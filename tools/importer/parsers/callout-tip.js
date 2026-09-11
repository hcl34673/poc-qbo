/* eslint-disable */
/* global WebImporter */
/**
 * Parser for callout-tip. Base: callout (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * Local block contract (blocks/callout-tip/callout-tip.js): a single row —
 *   cell 1 (optional): an icon (image only, no text)
 *   cell 2: the tip body (one or more short paragraphs)
 * decorate() finds the icon cell as the one whose only content is a picture/icon
 * and treats the rest as body.
 *
 * Source: `.colored-box` containing a leading icon image (`<img class="icon">`)
 * and one or more body `<p>` paragraphs (which may hold inline links). The icon
 * may sit in its own `<p>` (e.g. `<p><img class="icon"></p>`) OR share the first
 * body paragraph with the leading text (`<p><img class="icon"> ...text...</p>`).
 * Empty spacer <p>/<br> are dropped.
 *
 * 🔴 SHARED SELECTOR: `.colored-box` is also used by callout-takeaways. This
 * parser must BAIL (leave the element untouched) when the box is the
 * "Key takeaways" summary box (a heading whose text is "Key takeaways"), so the
 * callout-takeaways parser can claim it. Robust regardless of which
 * `.colored-box` it is handed.
 *
 * Alert variant: `blocks/callout-tip` supports an `alert` option. If the icon
 * signals an alert/warning treatment, the block is emitted as
 * `callout-tip (alert)` so aem.js applies the `alert` class.
 */
const TAKEAWAYS_RE = /key\s*takeaways/i;
const ALERT_RE = /alert|warning|exclamation|caution|important/i;

export default function parse(element, { document }) {
  const scope = element.querySelector('left') || element;

  // Disambiguate from callout-takeaways: bail (untouched) on the "Key takeaways"
  // box so callout-takeaways owns it. Plain return — never unwrap.
  const headings = Array.from(scope.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  if (headings.some((h) => TAKEAWAYS_RE.test((h.textContent || '').trim()))) {
    return;
  }

  // Leading icon image (its own <p> or shared with the first body paragraph).
  const icon = scope.querySelector('img.icon, img[class*="icon"], img');

  // Body paragraphs: any <p> with real text or a link. A paragraph that holds
  // ONLY the icon (no text, no link) is the icon wrapper and is skipped — but a
  // paragraph that holds the icon AND text is kept (createBlock relocates the
  // icon node into the icon cell, leaving the text behind in the body cell).
  const bodyParas = Array.from(scope.querySelectorAll('p')).filter((p) => {
    const hasText = p.textContent.trim() !== '';
    const hasLink = !!p.querySelector('a');
    return hasText || hasLink;
  });

  // Nothing to emit — bail gracefully rather than produce an empty block.
  if (!icon && bodyParas.length === 0) {
    return;
  }

  // Decide the alert treatment from the icon's hints.
  let name = 'callout-tip';
  if (icon) {
    const hint = `${icon.getAttribute('alt') || ''} ${icon.getAttribute('src') || ''} ${icon.className || ''}`;
    if (ALERT_RE.test(hint)) name = 'callout-tip (alert)';
  }

  const cells = [];
  const bodyCell = bodyParas.length ? bodyParas : [''];

  if (icon) {
    // Two-cell row: icon | body. createBlock appends the icon node to the icon
    // cell first, detaching it from any shared paragraph before that paragraph
    // is placed in the body cell.
    cells.push([[icon], bodyCell]);
  } else {
    // No icon — single body cell row.
    cells.push([bodyCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
