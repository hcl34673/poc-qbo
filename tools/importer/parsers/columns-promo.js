/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo. Base: columns (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * Local block contract (blocks/columns-promo/columns-promo.js): a single row
 * with one cell per column; each cell holds a heading, a description, and a
 * link (rendered as a button). decorate() reads `block.firstElementChild`'s
 * children as the columns, so the block must have exactly ONE row (the columns);
 * any lead/intro heading belongs OUTSIDE the block as default content.
 *
 * 🔴 SHARED SELECTOR: `[class*='Container_grey01']` matches THREE sibling divs in
 * the "Looking for something else?" band:
 *   1. an intro heading-only container  ("Looking for something else?")
 *   2. the promo grid: three `ContainerItem` columns, each an H3/H4 heading + a
 *      description paragraph + a "See how it works" CTA link
 *   3. a trailing separator-only container
 * Each element is handed to this parser once (de-dup). The parser detects which
 * one it is and behaves accordingly:
 *   - grid  → emit columns-promo, one cell per promo (heading + description + CTA)
 *   - intro → unwrap to the bare heading so it stays as a lead (default content)
 *             directly above the block
 *   - separator / empty → bail (leave untouched)
 * Links are preserved.
 */
export default function parse(element, { document }) {
  const HEADING_SEL = 'h1, h2, h3, h4, h5, h6';

  // Promo columns: containers that hold BOTH a heading and a CTA link.
  const items = Array.from(
    element.querySelectorAll('[class*="ContainerItem_containerItem"]'),
  ).filter((it) => it.querySelector('a[href]') && it.querySelector(HEADING_SEL));

  // No promo columns → this is the intro heading band or the separator.
  if (items.length === 0) {
    const heading = element.querySelector(HEADING_SEL);
    if (heading && (heading.textContent || '').trim()) {
      // Intro heading — keep it as a lead (default content), drop the wrapper.
      const lead = document.createElement(heading.tagName.toLowerCase());
      lead.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
      element.replaceWith(lead);
      return;
    }
    // Separator / nothing meaningful — leave untouched.
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build one column cell per promo: heading + description(s) + CTA link.
  const columnCells = items.map((item) => {
    const cell = [];

    const headingEl = item.querySelector(HEADING_SEL);
    if (headingEl && (headingEl.textContent || '').trim()) {
      const h = document.createElement(headingEl.tagName.toLowerCase());
      h.textContent = headingEl.textContent.replace(/\s+/g, ' ').trim();
      cell.push(h);
    }

    // Description paragraphs (preserve any inline links inside them).
    const descWrap = item.querySelector('[class*="Responsivetext"], [class*="resp-text"], .text');
    const descParas = descWrap
      ? Array.from(descWrap.querySelectorAll('p')).filter((p) => (p.textContent || '').trim())
      : [];
    descParas.forEach((p) => cell.push(p));

    // CTA links — de-duplicated by href (mobile/desktop may repeat the same one).
    const seen = new Set();
    Array.from(item.querySelectorAll('a[href]')).forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || seen.has(href)) return;
      seen.add(href);
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = href;
      link.textContent = (a.textContent || a.getAttribute('title') || href).replace(/\s+/g, ' ').trim();
      p.append(link);
      cell.push(p);
    });

    return cell;
  }).filter((cell) => cell.length);

  if (columnCells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single row, one cell per promo column.
  const cells = [columnCells];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo', cells });
  element.replaceWith(block);
}
