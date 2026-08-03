import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Automated guard for the §2.1 contrast rule:
 *
 *   "Premium Gold (#CDAF80) has low contrast on Linen Cream — never use gold
 *    text as body text on cream."
 *
 * Gold is legitimate as a filled block (`bg-accent`, with `text-on-accent`) and
 * as text on navy (`text-accent-ink` in dark, `text-brand-gold` inside a navy
 * surface). What must never appear is a gold text colour that follows the
 * light theme's cream background.
 */

const SRC = join(process.cwd(), 'src');

/** Text-colour utilities that would render gold on a cream background. */
const FORBIDDEN = [
  /\btext-accent\b(?!-ink)/, // `--accent` is always gold; only `-ink` is theme-safe
  /\btext-\[#[cC][dD][aA][fF]80\]/,
  /\bcolor:\s*#[cC][dD][aA][fF]80/,
];

/** Files allowed to name gold directly (they define the tokens). */
const ALLOWLIST = new Set([join(SRC, 'styles', 'globals.css')]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const sourceFiles = walk(SRC).filter(
  (file) => /\.(tsx?|css)$/.test(file) && !ALLOWLIST.has(file),
);

describe('brand contrast rule', () => {
  it('finds source files to scan', () => {
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  it('never applies gold as a theme-following text colour', () => {
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      const contents = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN) {
        if (pattern.test(contents)) {
          offenders.push(`${file.replace(process.cwd(), '.')} matched ${pattern}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('exposes a theme-safe accent text token instead', () => {
    const css = readFileSync(join(SRC, 'styles', 'globals.css'), 'utf8');
    expect(css).toContain('--accent-ink: #11253c'); // light theme: navy
    expect(css).toContain('--accent-ink: #cdaf80'); // dark theme: gold
    expect(css).toContain('--color-accent-ink');
  });

  it('pins the four official palette values', () => {
    const css = readFileSync(join(SRC, 'styles', 'globals.css'), 'utf8');
    for (const hex of ['#11253c', '#cdaf80', '#f7f1e5', '#a5aab5']) {
      expect(css).toContain(hex);
    }
  });
});
