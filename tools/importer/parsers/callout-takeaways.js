/* eslint-disable */
/* global WebImporter */
/**
 * Parser for callout-takeaways. Base: callout (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * Local block contract (blocks/callout-takeaways/callout-takeaways.js): a single
 * block with one cell holding a heading followed by a bulleted list.
 * decorate() reads block.firstElementChild.firstElementChild as the body.
 *
 * Source: `.colored-box > left` wraps a `<h2>Key takeaways</h2>`, empty spacer
 * paragraphs, and a `<ul>` of takeaways. Empty <p>/<br> spacers are dropped.
 *
 * 🔴 SHARED SELECTOR: `.colored-box` also matches the recurring "tip" callouts
 * (callout-tip). Both parsers are handed the same class of element, so this
 * parser MUST only claim the box that is actually the "Key takeaways" summary —
 * i.e. one that contains a heading whose text is "Key takeaways". For every
 * other `.colored-box` (the tip boxes) it BAILS untouched so callout-tip can
 * handle it. This is robust regardless of which `.colored-box` it is called on.
 */
const TAKEAWAYS_RE = /key\s*takeaways/i;

export default function parse(element, { document }) {
  const scope = element.querySelector('left') || element;

  const headings = Array.from(scope.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const takeawaysHeading = headings.find((h) => TAKEAWAYS_RE.test((h.textContent || '').trim()));

  // Only claim the "Key takeaways" box. Anything else (tip callouts, empty
  // boxes) is left UNTOUCHED (plain return, not unwrapped) so the callout-tip
  // parser — which is handed the same `.colored-box` elements — can claim it.
  if (!takeawaysHeading) {
    return;
  }

  const list = scope.querySelector('ul, ol');

  const contentCell = [takeawaysHeading];
  if (list) contentCell.push(list);

  const cells = [];
  cells.push([contentCell]); // single-column block: one row, one cell holding all content

  const block = WebImporter.Blocks.createBlock(document, { name: 'callout-takeaways', cells });
  element.replaceWith(block);
}
