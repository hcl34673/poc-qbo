/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-stats. Base block: carousel.
 * Source: https://quickbooks.intuit.com/ (FullWidthCarousel-sp-fwc, stat cards)
 * Content contract (blocks/carousel-stats/carousel-stats.js): one row per slide.
 * The first cell of the row is the image; the remaining cell is the content
 * (testimonial quote + attribution + stat cards). Duplicate loop-clone slides are
 * de-duplicated by quote text.
 */
export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll('[class*="__slide-"]'));

  const cells = [];
  const seen = new Set();

  slides.forEach((slide) => {
    const quoteEl = slide.querySelector('[class*="__quote"]');
    const quoteText = quoteEl ? quoteEl.textContent.replace(/\s+/g, ' ').trim() : '';

    // Skip loop-clone slides (same quote already emitted).
    if (quoteText && seen.has(quoteText)) return;
    if (quoteText) seen.add(quoteText);

    // Image cell (testimonial background).
    const imageCell = [];
    const bg = slide.querySelector('img[class*="__bg"][src], [class*="__testimonial"] img[src]');
    if (bg) {
      const img = document.createElement('img');
      img.src = bg.getAttribute('src');
      img.alt = bg.getAttribute('alt') || '';
      imageCell.push(img);
    }

    // Content cell.
    const contentCell = [];
    if (quoteText) {
      const bq = document.createElement('blockquote');
      bq.textContent = quoteText;
      contentCell.push(bq);
    }
    const name = slide.querySelector('[class*="__name"]');
    const title = slide.querySelector('[class*="__title"]');
    if (name || title) {
      const p = document.createElement('p');
      const parts = [];
      if (name) parts.push(name.textContent.replace(/\s+/g, ' ').trim());
      if (title) parts.push(title.textContent.replace(/\s+/g, ' ').trim());
      p.textContent = parts.filter(Boolean).join(', ');
      if (p.textContent) contentCell.push(p);
    }

    // Stat cards.
    slide.querySelectorAll('[class*="__stat-card"]').forEach((card) => {
      const heading = card.querySelector('[class*="__stat-heading"]');
      const label = card.querySelector('[class*="__stat-label"]');
      if (heading) {
        const h3 = document.createElement('h3');
        h3.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
        if (h3.textContent) contentCell.push(h3);
      }
      if (label) {
        const p = document.createElement('p');
        p.textContent = label.textContent.replace(/\s+/g, ' ').trim();
        if (p.textContent) contentCell.push(p);
      }
    });

    if (imageCell.length === 0 && contentCell.length === 0) return;
    cells.push([imageCell, contentCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-stats', cells });
  element.replaceWith(block);
}
