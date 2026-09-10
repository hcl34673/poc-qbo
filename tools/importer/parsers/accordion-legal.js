/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-legal. Base block: accordion.
 * Source: https://quickbooks.intuit.com/ (RwDisclaimer_rwDisclaimer)
 * Content contract (blocks/accordion-legal/accordion-legal.js): one row per toggle.
 * Row cell 0 = toggle label (e.g. "Important pricing details..."); cell 1 = the
 * disclaimer body (all fine-print paragraphs). This source has a single toggle.
 */
export default function parse(element, { document }) {
  // Toggle label — the button text, minus the chevron icon.
  const toggle = element.querySelector('[class*="rwDisclaimer__link"], button');
  let labelText = '';
  if (toggle) {
    labelText = toggle.textContent.replace(/\s+/g, ' ').trim();
  }

  // Body: all disclaimer paragraphs.
  const content = element.querySelector('[class*="rwDisclaimer__content"], [class*="accordionWrapper"]');
  const bodyCell = [];
  if (content) {
    content.querySelectorAll('p').forEach((srcP) => {
      const text = srcP.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      const p = document.createElement('p');
      p.textContent = text;
      bodyCell.push(p);
    });
  }

  if (!labelText && bodyCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const label = document.createElement('strong');
  label.textContent = labelText || 'Important pricing details and product information';

  const cells = [[[label], bodyCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-legal', cells });
  element.replaceWith(block);
}
