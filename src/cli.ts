#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { Command } from 'commander';

import { convertMarkdownToPdf } from './render';
import { listThemes } from './themes';

interface CliOptions {
  output?: string;
  theme: string;
  css?: string;
  browser?: string;
  title?: string;
  format: string;
  margin: string;
  listThemes?: boolean;
}

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
  .option('--format <size>', 'PDF page format', 'A4')
  .option('--margin <size>', 'Page margin for all sides', '16mm')
  .option('--list-themes', 'Print the available built-in themes')
  .action(async (input: string | undefined, options: CliOptions) => {
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

      const inputPath = path.resolve(input as string);
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
        math: true,
        outline: true,
        brand: {
          name: 'morro',
          placement: 'corner',
          logoPath: path.resolve(__dirname, '..', 'assets', 'morro-logo.png'),
        },
      });

      console.log(`Wrote PDF: ${outputPath}`);
    } catch (error) {
      console.error((error as Error).message);
      process.exitCode = 1;
    }
  });

void program.parseAsync(process.argv);
