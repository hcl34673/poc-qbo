/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-split. Base block: hero.
 * Source: https://quickbooks.intuit.com/ (HomepageHero-bleedWrapper)
 * Content contract (blocks/hero-split/hero-split.js): one row with two cells
 * (text side | image side). Text side = heading + paragraph + CTAs + trust line.
 * Image side = a single picture (picture-only cell is treated as the media side).
 */
export default function parse(element, { document }) {
  // --- Text side ---
  const textCell = [];

  // Headline is composed of highlight + rest spans inside the headline container.
  // Join the spans with a space so "Business" + "done right" → "Business done right".
  const headlineWrap = element.querySelector('[class*="HomepageHero-headline"]');
  if (headlineWrap) {
    const spans = Array.from(headlineWrap.querySelectorAll('span'));
    const headingText = (spans.length
      ? spans.map((s) => s.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ')
      : headlineWrap.textContent.replace(/\s+/g, ' ').trim());
    if (headingText) {
      const h1 = document.createElement('h1');
      h1.textContent = headingText;
      textCell.push(h1);
    }
  }

  // Description body copy (marked up as h1 in source, but it is body text).
  const description = element.querySelector('[class*="HomepageHero-description"]');
  if (description) {
    const p = document.createElement('p');
    p.textContent = description.textContent.replace(/\s+/g, ' ').trim();
    if (p.textContent) textCell.push(p);
  }

  // CTA buttons. Wrap the first in <strong> (→ primary blue button) and the
  // second in <em> (→ secondary outline button) so EDS decorateButtons styles them.
  const ctas = Array.from(element.querySelectorAll('[class*="HomepageHero-ctas"] a[href]'));
  ctas.forEach((a, i) => {
    const link = document.createElement('a');
    link.href = a.href;
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    const p = document.createElement('p');
    const wrap = document.createElement(i === 0 ? 'strong' : 'em');
    wrap.append(link);
    p.append(wrap);
    textCell.push(p);
  });

  // Trust line / stats — flatten to a short paragraph.
  const stats = element.querySelector('[class*="StatsBlock-stats"]');
  if (stats) {
    const trustText = stats.textContent.replace(/\s+/g, ' ').trim();
    if (trustText) {
      const p = document.createElement('p');
      p.textContent = trustText;
      textCell.push(p);
    }
  }

  // --- Image side ---
  // The hero cycles through several brand photos. Capture each unique image so
  // the block can render them as an autoplaying carousel. The source duplicates
  // the set for looping, so de-dupe by src.
  const imageCell = [];
  const seen = new Set();
  const heroImgs = Array.from(
    element.querySelectorAll('[class*="HeroImageStack"] img[src]:not([src^="data:"])'),
  );
  heroImgs.forEach((heroImg) => {
    const src = heroImg.getAttribute('src');
    if (!src || seen.has(src)) return;
    seen.add(src);
    const img = document.createElement('img');
    img.src = src;
    img.alt = heroImg.getAttribute('alt') || '';
    imageCell.push(img);
  });

  // Empty-block guard.
  if (textCell.length === 0 && imageCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell, imageCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-split', cells });
  element.replaceWith(block);
}
