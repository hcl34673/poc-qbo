/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-deck. Base block: tabs.
 * Source: https://quickbooks.intuit.com/ (QRCardsAnimated-root)
 * Content contract (blocks/tabs-deck/tabs-deck.js): one row per tab. The row's
 * first cell is the tab label; the row content is the panel (image + heading +
 * body + optional link). The source is JS-driven and only renders the active
 * panel, so non-active tabs get an empty panel cell.
 */
export default function parse(element, { document }) {
  const tabButtons = Array.from(element.querySelectorAll('[class*="QRCardsAnimated-tab-"]'))
    .filter((el) => el.tagName === 'BUTTON');

  const cells = [];

  // Build the panel content from the single rendered card (active tab).
  const buildPanel = (card) => {
    const panel = [];
    const img = card.querySelector('[class*="QRCardsAnimated-image"][src]:not([src^="data:"])');
    if (img) {
      const picture = document.createElement('img');
      picture.src = img.getAttribute('src');
      picture.alt = img.getAttribute('alt') || '';
      panel.push(picture);
    }
    const title = card.querySelector('[class*="overlay-title"]');
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.replace(/\s+/g, ' ').trim();
      if (h3.textContent) panel.push(h3);
    }
    const body = card.querySelector('[class*="overlay-body"]');
    if (body) {
      const p = document.createElement('p');
      p.textContent = body.textContent.replace(/\s+/g, ' ').trim();
      if (p.textContent) panel.push(p);
    }
    const cta = card.querySelector('[class*="overlay-cta"]');
    if (cta) {
      const label = cta.textContent.replace(/\s+/g, ' ').trim();
      if (label) {
        const a = document.createElement('a');
        a.href = cta.getAttribute('href') || '#';
        a.textContent = label;
        panel.push(a);
      }
    }
    return panel;
  };

  // All cards are present in the source (one per tab); map each card to its tab by index.
  const cards = Array.from(element.querySelectorAll('[class*="QRCardsAnimated-card-"]'));

  tabButtons.forEach((btn, i) => {
    const label = document.createElement('strong');
    label.textContent = btn.textContent.replace(/\s+/g, ' ').trim();

    const card = cards[i];
    const panel = card ? buildPanel(card) : [];

    cells.push([[label], panel]);
  });

  // Fallback: if no tabs found but a card exists, emit a single tab.
  if (cells.length === 0 && cards[0]) {
    const label = document.createElement('strong');
    label.textContent = 'Tab';
    cells.push([[label], buildPanel(cards[0])]);
  }

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-deck', cells });
  element.replaceWith(block);
}
