'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const { chromium } = require('playwright');

const { getTheme } = require('./themes');

const katexCss = fs.readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf8');
const katexJs = fs.readFileSync(require.resolve('katex/dist/katex.min.js'), 'utf8');
const katexAutoRenderJs = fs.readFileSync(
  require.resolve('katex/dist/contrib/auto-render.min.js'),
  'utf8',
);

function createMarkdownRenderer() {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(code, language) {
      const hasLanguage = language && hljs.getLanguage(language);
      const value = hasLanguage
        ? hljs.highlight(code, { language, ignoreIllegals: true }).value
        : hljs.highlightAuto(code).value;
      const className = hasLanguage ? `hljs language-${language}` : 'hljs';
      return `<pre><code class="${className}">${value}</code></pre>`;
    },
  });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function fileToDataUrl(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function buildHtmlDocument({
  title,
  bodyHtml,
  themeName,
  customCss,
  baseHref,
  enableMath,
  margin,
  brand,
}) {
  const theme = getTheme(themeName);
  const inlineMathAssets = enableMath
    ? `
      <style>${katexCss}</style>
      <script>${katexJs}</script>
      <script>${katexAutoRenderJs}</script>
    `
    : '';

  const mathBootstrap = enableMath
    ? `
      <script>
        window.__MD2PDF_MATH__ = () => {
          renderMathInElement(document.body, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\\\[', right: '\\\\]', display: true },
              { left: '\\\\(', right: '\\\\)', display: false }
            ],
            throwOnError: false
          });
        };
      </script>
    `
    : '';

  const brandBlock = buildBrandBlock(brand);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <base href="${baseHref}">
    <style>
      :root { --page-margin: ${margin}; }
      ${theme.css}
      ${customCss}
    </style>
    ${inlineMathAssets}
    ${mathBootstrap}
  </head>
  <body>
    <main>
      ${brandBlock}
      ${bodyHtml}
    </main>
  </body>
</html>`;
}

function buildBrandBlock(brand) {
  if (!brand || (!brand.name && !brand.logoSrc)) {
    return '';
  }

  const eyebrow = brand.eyebrow || 'Made by';
  const placement = brand.placement === 'title' ? 'title' : 'corner';
  const image = brand.logoSrc
    ? `<img src="${brand.logoSrc}" alt="${escapeHtml(brand.name || 'Brand logo')}">`
    : '';
  const eyebrowBlock = placement === 'title' && brand.name
    ? `<div class="brand__eyebrow">${escapeHtml(eyebrow)}</div>`
    : '';
  const nameBlock = brand.name
    ? `<div class="brand__name">${escapeHtml(brand.name)}</div>`
    : '';
  const textBlock = placement === 'title' && (eyebrowBlock || nameBlock)
    ? `
      <div class="brand__text">
        ${eyebrowBlock}
        ${nameBlock}
      </div>
    `
    : '';

  return `
    <section class="brand brand--${placement}" aria-label="Document brand">
      ${image}
      ${textBlock}
    </section>
  `;
}

function resolveOutputPath(inputPath, outputPath) {
  if (outputPath) {
    return path.resolve(outputPath);
  }

  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.pdf`);
}

function findBrowserCandidates() {
  const candidates = [];
  const add = (value) => {
    if (value && !candidates.includes(value)) {
      candidates.push(value);
    }
  };

  add(process.env.MD2PDF_BROWSER);

  for (const command of [
    'google-chrome',
    'chromium',
    'chromium-browser',
    'msedge',
    'microsoft-edge',
    'brave-browser',
  ]) {
    try {
      add(execFileSync('which', [command], { encoding: 'utf8' }).trim());
    } catch {}
  }

  if (process.platform === 'darwin') {
    for (const candidate of [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Arc.app/Contents/MacOS/Arc',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ]) {
      add(candidate);
    }
  }

  if (process.platform === 'win32') {
    for (const candidate of [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    ]) {
      add(candidate);
    }
  }

  return candidates.filter((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

async function launchBrowser(executablePath) {
  const tried = [];
  const launch = async (options) => chromium.launch({ headless: true, ...options });

  for (const candidate of executablePath ? [executablePath] : findBrowserCandidates()) {
    try {
      return await launch({ executablePath: candidate });
    } catch (error) {
      tried.push(`${candidate}: ${error.message}`);
    }
  }

  for (const channel of ['chrome', 'msedge']) {
    try {
      return await launch({ channel });
    } catch (error) {
      tried.push(`${channel}: ${error.message}`);
    }
  }

  try {
    return await launch({});
  } catch (error) {
    tried.push(`playwright-bundled: ${error.message}`);
  }

  throw new Error(
    `Unable to launch a Chromium browser.\n` +
      `Set --browser /path/to/chrome, or set MD2PDF_BROWSER.\n` +
      `If you want the Playwright-managed browser, run: npx playwright install chromium\n\n` +
      `Tried:\n- ${tried.join('\n- ')}`,
  );
}

async function waitForRender(page, enableMath) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async (mathEnabled) => {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    if (mathEnabled && typeof window.__MD2PDF_MATH__ === 'function') {
      window.__MD2PDF_MATH__();
    }

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, enableMath);
}

async function convertMarkdownToPdf(options) {
  const inputPath = path.resolve(options.inputPath);
  const outputPath = resolveOutputPath(inputPath, options.outputPath);
  const markdown = fs.readFileSync(inputPath, 'utf8');
  const markdownRenderer = createMarkdownRenderer();
  const bodyHtml = markdownRenderer.render(markdown);
  const customCss = options.customCssPath
    ? fs.readFileSync(path.resolve(options.customCssPath), 'utf8')
    : '';
  const brand = options.brand
    ? {
        ...options.brand,
        logoSrc: options.brand.logoPath ? fileToDataUrl(path.resolve(options.brand.logoPath)) : '',
      }
    : null;
  const html = buildHtmlDocument({
    title: options.title || path.basename(inputPath, path.extname(inputPath)),
    bodyHtml,
    themeName: options.theme,
    customCss,
    baseHref: pathToFileURL(`${path.dirname(inputPath)}${path.sep}`).href,
    enableMath: options.math,
    margin: options.margin,
    brand,
  });

  const browser = await launchBrowser(options.browserPath);

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await waitForRender(page, options.math);
    await page.pdf({
      path: outputPath,
      format: options.format,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      printBackground: true,
      outline: options.outline,
      tagged: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }

  return outputPath;
}

module.exports = {
  convertMarkdownToPdf,
};
