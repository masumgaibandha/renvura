import { Lora, Manrope, Noto_Sans_Bengali } from 'next/font/google';

/** English display headings. */
export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-lora',
  display: 'swap',
});

/** Latin UI and body text. */
export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

/** All Bangla text, headings included — Lora carries no Bengali glyphs. */
export const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-bengali',
  display: 'swap',
});

export const fontVariables = [lora.variable, manrope.variable, notoSansBengali.variable].join(' ');
