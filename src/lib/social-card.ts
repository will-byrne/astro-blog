// Draws the 1200x630 image shown when a post is shared on social media or in a chat app.
//
// It follows the default card (scripts/og-default.html): Catppuccin Macchiato, the palette stripe, the title in
// mauve, and the post's cover image (or the avatar) on the right. Satori lays it out as SVG with the text turned
// into shapes, so the build machine needs no fonts installed, and sharp turns that into a PNG.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const colours = {
  base: '#24273a',
  mantle: '#1e2030',
  surface0: '#363a4f',
  text: '#cad3f5',
  subtext1: '#b8c0e0',
  mauve: '#c6a0f6',
  stripe: ['#c6a0f6', '#f5bde6', '#f5a97f', '#eed49f', '#a6da95', '#8bd5ca', '#7dc4e4', '#8aadf4'],
};

export interface CardContent {
  title: string;
  /** e.g. "17 May 2024 · 3 min read · iPad" */
  details: string;
  /** e.g. "Part 1 of 3 in My new iPad" */
  series?: string;
  /** The cover image file; without one, the avatar is shown in a circle */
  image?: Buffer;
  avatar: Buffer;
  site: string;
  domain: string;
}

/** Shorter titles get bigger text, so every title fits in at most four lines */
export function titleSize(title: string): number {
  if (title.length <= 18) return 84;
  if (title.length <= 34) return 70;
  if (title.length <= 60) return 58;
  return 48;
}

const require = createRequire(import.meta.url);
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700 | 800; style: 'normal' }[]> | undefined;

// Satori cannot read the woff2 files the site uses, so it gets the same font as woff
function loadFonts() {
  fonts ??= Promise.all(
    ([400, 700, 800] as const).map(async (weight) => ({
      name: 'Atkinson Hyperlegible Next',
      data: await readFile(require.resolve(`@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-${weight}-normal.woff`)),
      weight,
      style: 'normal' as const,
    })),
  );
  return fonts;
}

// Satori takes the same shape React elements have; this saves writing them out in full
type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: (Node | string | false | undefined)[] | string, props: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children: Array.isArray(children) ? children.filter(Boolean) : children, ...props },
});

// Cropped to the part of the image with the most going on, rather than always the middle
const dataUrl = async (image: Buffer, width: number, height: number) =>
  `data:image/jpeg;base64,${(await sharp(image).resize(width, height, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 85 }).toBuffer()).toString('base64')}`;

const INSET = 40;
const RADIUS = 32;

export async function renderSocialCard(content: CardContent): Promise<Buffer> {
  const inset = INSET;
  const inner = { width: CARD_WIDTH - inset * 2, height: CARD_HEIGHT - inset * 2 };
  const pictureWidth = content.image ? 400 : 0;

  const picture = content.image
    ? el('img', { width: pictureWidth, height: inner.height, objectFit: 'cover' }, undefined, {
        src: await dataUrl(content.image, pictureWidth, inner.height),
        width: pictureWidth,
        height: inner.height,
      })
    : el('div', { display: 'flex', alignItems: 'center', paddingRight: 72 }, [
        el('img', { width: 200, height: 200, borderRadius: 100, border: `6px solid ${colours.surface0}` }, undefined, {
          src: await dataUrl(content.avatar, 200, 200),
          width: 200,
          height: 200,
        }),
      ]);

  const text = el(
    'div',
    { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '64px 56px 48px 72px' },
    [
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { fontSize: 30, fontWeight: 700, color: colours.subtext1 }, content.site),
        el(
          'div',
          { marginTop: 20, fontSize: titleSize(content.title), fontWeight: 800, lineHeight: 1.1, color: colours.mauve, lineClamp: 4 },
          content.title,
        ),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        content.series && el('div', { fontSize: 28, color: colours.text, marginBottom: 8 }, content.series),
        el('div', { fontSize: 28, color: colours.subtext1 }, content.details),
        el('div', { marginTop: 20, fontSize: 30, fontWeight: 700, color: colours.text }, content.domain),
      ]),
    ],
  );

  const stripe = el(
    'div',
    { position: 'absolute', top: 0, left: 0, right: 0, height: 14, display: 'flex' },
    colours.stripe.map((colour) => el('div', { flex: 1, backgroundColor: colour })),
  );

  // Satori does not clip the picture and stripe to rounded corners, so the panel is drawn square and then
  // cut to shape, and placed on the background, by sharp
  const panel = el('div', { position: 'relative', display: 'flex', width: inner.width, height: inner.height, backgroundColor: colours.base, fontFamily: 'Atkinson Hyperlegible Next' }, [
    text,
    picture,
    stripe,
  ]);
  const svg = await satori(panel as never, { width: inner.width, height: inner.height, fonts: await loadFonts() });
  const corners = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${inner.width}" height="${inner.height}"><rect width="100%" height="100%" rx="${RADIUS}" fill="#fff"/></svg>`);
  const rounded = await sharp(Buffer.from(svg)).composite([{ input: corners, blend: 'dest-in' }]).png().toBuffer();
  return sharp({ create: { width: CARD_WIDTH, height: CARD_HEIGHT, channels: 3, background: colours.mantle } })
    .composite([{ input: rounded, left: INSET, top: INSET }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}
