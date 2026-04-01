# md2pdf

A small Markdown-to-PDF CLI built on Playwright.

## Usage

```bash
node src/cli.js README.md
node src/cli.js README.md -o docs/guide.pdf --theme minimal
node src/cli.js README.md --css ./print.css --browser "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## Features

- Native PDF outline support through Playwright and Chromium
- Built-in `github`, `minimal`, and `dark` print themes
- Server-side code highlighting
- Offline KaTeX auto-rendering
- Optional CSS override layer for user customization
