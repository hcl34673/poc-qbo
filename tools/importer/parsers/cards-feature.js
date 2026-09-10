/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base block: cards.
 * Source: https://quickbooks.intuit.com/ (PersonalizedCards-animatedTiles)
 * Content contract (blocks/cards-feature/cards-feature.js): one row per tile.
 * A cell containing only a picture becomes the tile image; the other cell is the body
 * (eyebrow tag + headline + description + feature list).
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('[class*="PersonalizedCards-sn-card__content"]'))
    .map((c) => c.closest('[class*="PersonalizedCards-sn-card-"]') || c)
    // de-dupe if closest resolved to shared ancestors
    .filter((el, i, arr) => arr.indexOf(el) === i);

  // Fallback: select card wrappers directly.
  const cardEls = cards.length
    ? cards
    : Array.from(element.querySelectorAll('[class*="PersonalizedCards-sn-card-"]'));

  const cells = [];

  cardEls.forEach((card) => {
    const body = [];

    // Eyebrow / category tag.
    const eyebrow = card.querySelector('[class*="eyebrow-text"]');
    if (eyebrow) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = eyebrow.textContent.replace(/\s+/g, ' ').trim();
      p.append(strong);
      body.push(p);
    }

    // Headline / stat.
    const headline = card.querySelector('[class*="card__headline"]');
    if (headline) {
      const h3 = document.createElement('h3');
      h3.textContent = headline.textContent.replace(/\s+/g, ' ').trim();
      if (h3.textContent) body.push(h3);
    }

    // Description.
    const desc = card.querySelector('[class*="card__description"]');
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
      if (p.textContent) body.push(p);
    }

    // Feature list.
    const features = card.querySelector('[class*="card__features"]');
    if (features && features.querySelector('li')) {
      const ul = document.createElement('ul');
      features.querySelectorAll('li').forEach((li) => {
        const item = document.createElement('li');
        item.textContent = li.textContent.replace(/\s+/g, ' ').trim();
        ul.append(item);
      });
      body.push(ul);
    }

    // Tile image (from the image area, not decorative eyebrow icons).
    const imgEl = card.querySelector('[class*="card__image-area"] img[src]:not([src^="data:"])');
    const imageCell = [];
    if (imgEl) {
      const img = document.createElement('img');
      img.src = imgEl.getAttribute('src');
      img.alt = imgEl.getAttribute('alt') || '';
      imageCell.push(img);
    }

    if (body.length === 0 && imageCell.length === 0) return;

    // Body cell + image cell (image cell may be empty when the tile has no picture).
    cells.push([body, imageCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });

  // Preserve the section heading ("Recommended for businesses like yours") as
  // default content immediately above the block.
  const headingEl = element.querySelector('[class*="sn-variant__heading"], [class*="__heading"]');
  const fragmentNodes = [];
  if (headingEl) {
    const h2 = document.createElement('h2');
    h2.textContent = headingEl.textContent.replace(/\s+/g, ' ').trim();
    if (h2.textContent) fragmentNodes.push(h2);
  }
  fragmentNodes.push(block);
  element.replaceWith(...fragmentNodes);
}
