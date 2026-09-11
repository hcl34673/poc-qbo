/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base block: hero.
 * Source: https://quickbooks.intuit.com/ (Background-contentWrapper)
 * Content contract (blocks/hero-banner/hero-banner.js): structural passthrough —
 * a centered heading with a single CTA, optionally over a background image.
 * Single column: one row, one cell holding heading + CTA (+ optional image).
 */
export default function parse(element, { document }) {
  const contentCell = [];

  // Optional background image.
  const bg = element.querySelector('img[src]:not([src^="data:"]), picture img[src]');
  if (bg) {
    const img = document.createElement('img');
    img.src = bg.getAttribute('src');
    img.alt = bg.getAttribute('alt') || '';
    contentCell.push(img);
  }

  // Heading.
  const heading = element.querySelector('h1, h2, h3, h4, [class*="display"]');
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    if (h2.textContent) contentCell.push(h2);
  }

  // CTA link(s).
  const ctas = Array.from(element.querySelectorAll('a[href]'));
  ctas.forEach((cta) => {
    const label = cta.textContent.replace(/\s+/g, ' ').trim();
    if (!label) return;
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = label;
    contentCell.push(a);
  });

  if (contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
