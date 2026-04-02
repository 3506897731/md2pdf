export type ThemeName = 'github' | 'minimal' | 'dark';

export interface ThemeDefinition {
  label: string;
  css: string;
}

const sharedCSS = `
  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  html {
    font-size: 15px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: var(--paper);
  }

  body {
    margin: 0;
    word-break: break-word;
    text-rendering: optimizeLegibility;
    font-kerning: normal;
    background: var(--paper);
  }

  main {
    position: relative;
    width: min(100%, var(--content-width));
    margin: 0 auto;
    padding: var(--content-padding);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--muted);
  }

  .brand img {
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 0.25rem;
    object-fit: cover;
    flex: none;
  }

  .brand--corner {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
    opacity: 0.88;
  }

  .brand--title {
    margin: 0 0 0.8rem;
  }

  .brand__text {
    display: flex;
    flex-direction: column;
    gap: 0.04rem;
    min-width: 0;
  }

  .brand__eyebrow {
    color: var(--muted);
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .brand__name {
    color: var(--heading);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.1;
  }

  a {
    color: var(--link);
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }

  p,
  ul,
  ol,
  dl,
  blockquote,
  table,
  pre,
  figure {
    margin: 0 0 1.1rem;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    color: var(--heading);
    break-after: avoid-page;
    break-inside: avoid;
  }

  h1 { margin-top: 0; }
  h2, h3, h4, h5, h6 { margin-top: 2rem; }

  h1 + p,
  h2 + p,
  h3 + p,
  h4 + p,
  h5 + p,
  h6 + p {
    margin-top: 1rem;
  }

  img,
  svg,
  video,
  canvas {
    display: block;
    max-width: 100%;
    height: auto;
  }

  hr {
    margin: 2rem 0;
    border: 0;
    border-top: 1px solid var(--rule);
  }

  blockquote {
    padding: 0.8rem 1rem;
    border-left: 0.22rem solid var(--accent-soft);
    background: var(--surface-soft);
    color: var(--muted);
  }

  ul,
  ol {
    padding-left: 1.4rem;
  }

  li + li {
    margin-top: 0.32rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    overflow: hidden;
    border: 1px solid var(--table-border);
    border-radius: 14px;
  }

  th,
  td {
    padding: 0.72rem 0.82rem;
    border-bottom: 1px solid var(--table-border);
    vertical-align: top;
    text-align: left;
  }

  th {
    font-weight: 700;
    background: var(--table-head);
    color: var(--heading);
  }

  tr:nth-child(even) td {
    background: var(--table-stripe);
  }

  tr:last-child td {
    border-bottom: 0;
  }

  code {
    font-family: "SFMono-Regular", "JetBrains Mono", "Fira Code", Consolas, monospace;
    font-size: 0.88em;
    padding: 0.16rem 0.4rem;
    border-radius: 0.45rem;
    background: var(--inline-code-bg);
    color: var(--inline-code-fg);
  }

  pre {
    overflow: auto;
    padding: 1rem 1.1rem;
    border-radius: 16px;
    background: var(--code-bg);
    color: var(--code-fg);
    border: 1px solid var(--code-border);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }

  pre code {
    display: block;
    padding: 0;
    background: transparent;
    color: inherit;
    border-radius: 0;
    font-size: 0.9rem;
    line-height: 1.65;
  }

  strong {
    color: var(--heading);
  }

  .footnotes {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--rule);
    color: var(--muted);
  }

  .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.25rem 0;
  }

  @page {
    size: A4;
    margin: var(--page-margin);
    background: var(--paper);
  }

  .hljs {
    color: var(--code-fg);
    background: transparent;
  }

  .hljs-comment,
  .hljs-quote {
    color: var(--syntax-comment);
    font-style: italic;
  }

  .hljs-keyword,
  .hljs-selector-tag,
  .hljs-literal,
  .hljs-name,
  .hljs-section,
  .hljs-link {
    color: var(--syntax-keyword);
  }

  .hljs-title,
  .hljs-title.class_,
  .hljs-title.function_,
  .hljs-function .hljs-title,
  .hljs-attr,
  .hljs-selector-id,
  .hljs-selector-class {
    color: var(--syntax-title);
  }

  .hljs-string,
  .hljs-meta .hljs-string,
  .hljs-symbol,
  .hljs-bullet,
  .hljs-addition {
    color: var(--syntax-string);
  }

  .hljs-number,
  .hljs-built_in,
  .hljs-type,
  .hljs-template-variable,
  .hljs-variable,
  .hljs-variable.language_,
  .hljs-params {
    color: var(--syntax-value);
  }

  .hljs-regexp,
  .hljs-link,
  .hljs-meta,
  .hljs-operator,
  .hljs-punctuation {
    color: var(--syntax-accent);
  }

  .hljs-deletion {
    color: var(--syntax-danger);
  }

  .hljs-emphasis {
    font-style: italic;
  }

  .hljs-strong {
    font-weight: 700;
  }
`;

const github = `
  :root {
    --page-margin: 16mm;
    --content-width: 880px;
    --content-padding: 10mm 8mm 12mm;
    --paper: #ffffff;
    --ink: #1f2937;
    --heading: #0f172a;
    --muted: #526071;
    --link: #0b66d6;
    --accent-soft: #9fc3ff;
    --surface-soft: #f5f8fc;
    --rule: #dbe4ef;
    --table-border: #d9e3ef;
    --table-head: #f3f7fb;
    --table-stripe: #fafcff;
    --inline-code-bg: #eef4fb;
    --inline-code-fg: #0f3f73;
    --code-bg: #0f172a;
    --code-fg: #e5eefb;
    --code-border: #1e293b;
    --syntax-comment: #94a3b8;
    --syntax-keyword: #93c5fd;
    --syntax-title: #f8fafc;
    --syntax-string: #86efac;
    --syntax-value: #fbbf24;
    --syntax-accent: #c4b5fd;
    --syntax-danger: #fca5a5;
  }

  html,
  body {
    background: var(--paper);
    color: var(--ink);
    font-family: "Inter", "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif;
    line-height: 1.75;
  }

  h1 {
    font-size: 2.5rem;
    line-height: 1.08;
    letter-spacing: -0.04em;
  }

  h2 {
    font-size: 1.65rem;
    line-height: 1.18;
    letter-spacing: -0.03em;
  }

  h3 {
    font-size: 1.18rem;
    line-height: 1.3;
  }

  h4,
  h5,
  h6 {
    font-size: 1rem;
    line-height: 1.4;
  }

  p,
  li,
  td,
  th {
    font-size: 0.99rem;
  }
`;

const minimal = `
  :root {
    --page-margin: 18mm;
    --content-width: 760px;
    --content-padding: 12mm 4mm 14mm;
    --paper: #fffdfa;
    --ink: #302820;
    --heading: #17120d;
    --muted: #6f6255;
    --link: #7d3f22;
    --accent-soft: #dfc1a7;
    --surface-soft: #f7efe6;
    --rule: #e8d9cb;
    --table-border: #e2d3c5;
    --table-head: #f9f3ec;
    --table-stripe: #fffcf8;
    --inline-code-bg: #f4ece4;
    --inline-code-fg: #6a3320;
    --code-bg: #fbf5ef;
    --code-fg: #352920;
    --code-border: #e7d7c7;
    --syntax-comment: #9a8471;
    --syntax-keyword: #8c3b2a;
    --syntax-title: #4a2316;
    --syntax-string: #3f6d52;
    --syntax-value: #9f6a10;
    --syntax-accent: #7f4d7f;
    --syntax-danger: #b44343;
  }

  html,
  body {
    background: var(--paper);
    color: var(--ink);
    font-family: "Iowan Old Style", "Palatino Linotype", "Source Han Serif SC", "Noto Serif CJK SC", serif;
    line-height: 1.88;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: "Avenir Next", "Helvetica Neue", "PingFang SC", sans-serif;
    font-weight: 700;
  }

  h1 {
    font-size: 2.45rem;
    line-height: 1.05;
    letter-spacing: -0.05em;
    max-width: 14ch;
  }

  h2 {
    font-size: 1.55rem;
    line-height: 1.18;
  }

  h3 {
    font-size: 1.12rem;
    letter-spacing: 0.01em;
    text-transform: uppercase;
  }

  blockquote {
    border-left-width: 0.18rem;
    padding-left: 1.1rem;
    background: transparent;
    font-style: italic;
  }

  pre {
    border-radius: 10px;
    box-shadow: none;
  }
`;

const dark = `
  :root {
    color-scheme: dark;
    --page-margin: 16mm;
    --content-width: 860px;
    --content-padding: 10mm 8mm 12mm;
    --paper: #0d1117;
    --ink: #d6deeb;
    --heading: #f5f7fb;
    --muted: #9eaabd;
    --link: #7cc5ff;
    --accent-soft: #2f81f7;
    --surface-soft: #111826;
    --rule: #263041;
    --table-border: #2b3546;
    --table-head: #131c2b;
    --table-stripe: #0f1520;
    --inline-code-bg: #182234;
    --inline-code-fg: #9ed0ff;
    --code-bg: #060b12;
    --code-fg: #e7edf7;
    --code-border: #1f2a39;
    --syntax-comment: #7f8ea3;
    --syntax-keyword: #7cc5ff;
    --syntax-title: #f8fbff;
    --syntax-string: #7ee787;
    --syntax-value: #ffbe7a;
    --syntax-accent: #c297ff;
    --syntax-danger: #ff9b9b;
  }

  html,
  body {
    background: var(--paper);
    color: var(--ink);
    font-family: "Inter", "Segoe UI", "PingFang SC", sans-serif;
    line-height: 1.76;
  }

  h1 {
    font-size: 2.45rem;
    line-height: 1.06;
    letter-spacing: -0.045em;
  }

  h2 {
    font-size: 1.58rem;
    line-height: 1.18;
  }

  h3 {
    font-size: 1.16rem;
  }

  blockquote {
    border-left-color: #3b82f6;
  }

  a {
    color: var(--link);
  }

  strong {
    color: #ffffff;
  }
`;

const themes: Record<ThemeName, ThemeDefinition> = {
  github: {
    label: 'Modern technical document',
    css: `${sharedCSS}\n${github}`,
  },
  minimal: {
    label: 'Editorial report with serif body text',
    css: `${sharedCSS}\n${minimal}`,
  },
  dark: {
    label: 'Graphite dark paper for dense technical notes',
    css: `${sharedCSS}\n${dark}`,
  },
};

export function getTheme(name: string): ThemeDefinition {
  const theme = themes[name as ThemeName];
  if (!theme) {
    const available = Object.keys(themes).join(', ');
    throw new Error(`Unknown theme "${name}". Available themes: ${available}`);
  }

  return theme;
}

export function listThemes(): Array<{ name: ThemeName; label: string }> {
  return (Object.entries(themes) as Array<[ThemeName, ThemeDefinition]>).map(([name, theme]) => ({
    name,
    label: theme.label,
  }));
}
