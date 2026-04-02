# morro-md2pdf

A Markdown-to-PDF CLI built on Playwright, with built-in themes, syntax highlighting, KaTeX rendering, and optional logo branding.

## Install

Global install:

```bash
npm install -g morro-md2pdf
```

Local development:

```bash
npm install
npm run build
npm link
```

If your machine does not already have a usable Chrome or Chromium executable, install the Playwright-managed browser once:

```bash
npx playwright install chromium
```

## Usage

Basic conversion:

```bash
md2pdf README.md
md2pdf README.md -o docs/guide.pdf --theme minimal
```

From source without global install:

```bash
npm run build
node dist/cli.js README.md -o docs/guide.pdf
```

With custom CSS:

```bash
md2pdf README.md --css ./print.css
```

With explicit browser path:

```bash
md2pdf README.md --browser "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

With logo branding:

```bash
md2pdf README.md \
  --theme github \
  --logo "/absolute/path/logo.png" \
  --brand-name morro \
  --brand-placement corner
```

## Built-in Themes

- `github`: modern technical document
- `minimal`: editorial serif report
- `dark`: graphite dark paper

List them from the CLI:

```bash
md2pdf --list-themes
```

## Features

- Native PDF outline support through Playwright and Chromium
- Built-in `github`, `minimal`, and `dark` print themes
- Server-side syntax highlighting with `highlight.js`
- Offline KaTeX auto-rendering
- Optional CSS override layer with `--css`
- Optional local logo branding with `--logo`, `--brand-name`, and `--brand-placement`

## Publish Checklist

Before publishing:

```bash
npm test
npm run pack:check
npm publish
```

This package is published as `morro-md2pdf` because `md2pdf` is already taken on npm.
