import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { chromium, type Browser, type Page } from 'playwright';

import { getTheme } from './themes';

export type BrandPlacement = 'corner' | 'title';

export interface BrandOptions {
  name?: string;
  placement?: BrandPlacement | string;
  logoPath?: string;
  logoSrc?: string;
}

export interface ConvertOptions {
  inputPath: string;
  outputPath?: string;
  theme: string;
  customCssPath?: string;
  browserPath?: string;
  title?: string;
  format: string;
  margin: string;
  math: boolean;
  outline: boolean;
  brand?: BrandOptions;
}

interface HtmlDocumentOptions {
  title: string;
  bodyHtml: string;
  themeName: string;
  customCss: string;
  baseHref: string;
  enableMath: boolean;
  margin: string;
  brand?: BrandOptions | null;
}

const katexCss = fs.readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf8');
const katexJs = fs.readFileSync(require.resolve('katex/dist/katex.min.js'), 'utf8');
const katexAutoRenderJs = fs.readFileSync(
  require.resolve('katex/dist/contrib/auto-render.min.js'),
  'utf8',
);

function createMarkdownRenderer(): MarkdownIt {
  const markdownIt = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(code: string, language: string) {
      const hasLanguage = Boolean(language) && hljs.getLanguage(language);
      const value = hasLanguage
        ? hljs.highlight(code, { language, ignoreIllegals: true }).value
        : hljs.highlightAuto(code).value;
      const className = hasLanguage ? `hljs language-${language}` : 'hljs';
      return `<pre><code class="${className}">${value}</code></pre>`;
    },
  });

  const originalTextRule =
    markdownIt.renderer.rules.text ??
    ((tokens, idx) => tokens[idx]?.content ?? '');

  markdownIt.renderer.rules.text = (tokens, idx, options, env, self) => {
    const rendered = originalTextRule(tokens, idx, options, env, self);
    return rendered.replace(/==(.+?)==/g, '<mark>$1</mark>');
  };

  const originalImageRule =
    markdownIt.renderer.rules.image ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  markdownIt.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet('src');

    if (src && !/^(https?:|data:|file:|\/\/)/i.test(src)) {
      const markdownPath = (env as { markdownPath?: string }).markdownPath;
      if (markdownPath) {
        const resolvedPath = path.resolve(path.dirname(markdownPath), src);
        if (fs.existsSync(resolvedPath)) {
          token.attrSet('src', fileToDataUrl(resolvedPath));
        }
      }
    }

    return originalImageRule(tokens, idx, options, env, self);
  };

  return markdownIt;
}

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/, '');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function fileToDataUrl(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  const mimeType = mimeTypes[ext] ?? 'application/octet-stream';
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
}: HtmlDocumentOptions): string {
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

function buildBrandBlock(brand?: BrandOptions | null): string {
  if (!brand || (!brand.name && !brand.logoSrc)) {
    return '';
  }

  const placement: BrandPlacement = brand.placement === 'title' ? 'title' : 'corner';
  const image = brand.logoSrc
    ? `<img src="${brand.logoSrc}" alt="${escapeHtml(brand.name || 'Brand logo')}">`
    : '';
  const nameBlock = brand.name
    ? `<div class="brand__name">by ${escapeHtml(brand.name)}</div>`
    : '';
  const textBlock = nameBlock
    ? `
      <div class="brand__text">
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

function resolveOutputPath(inputPath: string, outputPath?: string): string {
  if (outputPath) {
    return path.resolve(outputPath);
  }

  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.pdf`);
}

function findBrowserCandidates(): string[] {
  const candidates: string[] = [];
  const add = (value?: string) => {
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

async function launchBrowser(executablePath?: string): Promise<Browser> {
  const tried: string[] = [];
  const launch = async (options: Parameters<typeof chromium.launch>[0]): Promise<Browser> =>
    chromium.launch({ headless: true, ...options });

  for (const candidate of executablePath ? [executablePath] : findBrowserCandidates()) {
    try {
      return await launch({ executablePath: candidate });
    } catch (error) {
      tried.push(`${candidate}: ${(error as Error).message}`);
    }
  }

  for (const channel of ['chrome', 'msedge'] as const) {
    try {
      return await launch({ channel });
    } catch (error) {
      tried.push(`${channel}: ${(error as Error).message}`);
    }
  }

  try {
    return await launch({});
  } catch (error) {
    tried.push(`playwright-bundled: ${(error as Error).message}`);
  }

  throw new Error(
    `Unable to launch a Chromium browser.\n` +
      `Set --browser /path/to/chrome, or set MD2PDF_BROWSER.\n` +
      `If you want the Playwright-managed browser, run: npx playwright install chromium\n\n` +
      `Tried:\n- ${tried.join('\n- ')}`,
  );
}

async function waitForRender(page: Page, enableMath: boolean): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async (mathEnabled: boolean) => {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    if (
      mathEnabled &&
      typeof (window as Window & { __MD2PDF_MATH__?: () => void }).__MD2PDF_MATH__ === 'function'
    ) {
      (window as Window & { __MD2PDF_MATH__?: () => void }).__MD2PDF_MATH__?.();
    }

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  }, enableMath);
}

export async function convertMarkdownToPdf(options: ConvertOptions): Promise<string> {
  const inputPath = path.resolve(options.inputPath);
  const outputPath = resolveOutputPath(inputPath, options.outputPath);
  const markdown = stripFrontmatter(fs.readFileSync(inputPath, 'utf8'));
  const markdownRenderer = createMarkdownRenderer();
  const bodyHtml = markdownRenderer.render(markdown, { markdownPath: inputPath });
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
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        '<div style="width:100%;font-size:9px;color:#94a3b8;padding:0 16mm 8px 16mm;text-align:center;">' +
        '<span class="pageNumber"></span> / <span class="totalPages"></span>' +
        '</div>',
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
