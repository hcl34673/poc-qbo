/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-logos. Base block: cards.
 * Source: https://quickbooks.intuit.com/ (InfiniteImageSlider-iis-root)
 * Content contract (blocks/cards-logos/cards-logos.js): one row per logo, each
 * cell holding a logo image (optionally wrapped in a link). The infinite slider
 * duplicates its logos for the marquee effect, so duplicate images are removed by src.
 */
export default function parse(element, { document }) {
  const imgs = Array.from(element.querySelectorAll('img[src]:not([src^="data:"])'));

  const cells = [];
  const seen = new Set();

  imgs.forEach((imgEl) => {
    const src = imgEl.getAttribute('src');
    if (!src || seen.has(src)) return;
    seen.add(src);

    const img = document.createElement('img');
    img.src = src;
    img.alt = imgEl.getAttribute('alt') || '';

    // Preserve a wrapping link if present.
    const anchor = imgEl.closest('a[href]');
    if (anchor) {
      const a = document.createElement('a');
      a.href = anchor.getAttribute('href');
      a.append(img);
      cells.push([[a]]);
    } else {
      cells.push([[img]]);
    }
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logos', cells });
  element.replaceWith(block);
}
