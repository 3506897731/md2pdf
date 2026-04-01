#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const { Command } = require('commander');

const { convertMarkdownToPdf } = require('./render');
const { listThemes } = require('./themes');

const program = new Command();

program
  .name('md2pdf')
  .description('Convert Markdown files to polished PDFs with Playwright')
  .argument('[input]', 'Markdown file to convert')
  .option('-o, --output <file>', 'Output PDF path')
  .option('-t, --theme <name>', 'Built-in theme to use', 'github')
  .option('--css <file>', 'Extra CSS file to append after the built-in theme')
  .option('--browser <path>', 'Explicit Chromium/Chrome executable path')
  .option('--title <title>', 'Override the PDF document title')
  .option('--logo <file>', 'Brand logo shown at the top of the document')
  .option('--brand-name <name>', 'Brand name shown next to the logo')
  .option('--brand-eyebrow <text>', 'Small label shown above the brand name', 'Made by')
  .option('--format <size>', 'PDF page format', 'A4')
  .option('--margin <size>', 'Page margin for all sides', '16mm')
  .option('--no-math', 'Disable KaTeX auto-rendering')
  .option('--no-outline', 'Disable PDF outline/bookmarks')
  .option('--list-themes', 'Print the available built-in themes')
  .action(async (input, options) => {
    try {
      if (options.listThemes) {
        for (const theme of listThemes()) {
          console.log(`${theme.name.padEnd(8)} ${theme.label}`);
        }
        return;
      }

      if (!input) {
        program.error('Missing input Markdown file. Pass a file path or use --list-themes.');
      }

      const inputPath = path.resolve(input);
      if (!fs.existsSync(inputPath)) {
        program.error(`Input file not found: ${inputPath}`);
      }

      const outputPath = await convertMarkdownToPdf({
        inputPath,
        outputPath: options.output,
        theme: options.theme,
        customCssPath: options.css,
        browserPath: options.browser,
        title: options.title,
        format: options.format,
        margin: options.margin,
        math: options.math,
        outline: options.outline,
        brand: {
          name: options.brandName,
          eyebrow: options.brandEyebrow,
          logoSrc: options.logo ? pathToFileURL(path.resolve(options.logo)).href : '',
        },
      });

      console.log(`Wrote PDF: ${outputPath}`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
