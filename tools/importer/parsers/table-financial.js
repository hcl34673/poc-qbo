/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-financial. Base: table (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * Local block contract (blocks/table-financial/table-financial.js): rows become
 * table rows. An optional first single-cell row is the caption; every other row
 * is a two-column data row (line item | value).
 *
 * Source is a Datawrapper embed (`.vis-tables` / `.datawrapper-script-embed`,
 * here `id="datawrapper-vis-JrKG8"`). The tabular data is rendered client-side
 * by Datawrapper into a `<table>`.
 *   - When loaded in a browser (live validation / import), that table exists and
 *     we extract its rows.
 *   - In the static snapshot the embed is empty (`<datawrapper-visualization>`
 *     with no iframe/table). We then preserve a reference to the chart — an
 *     iframe/data-src if present, otherwise a URL reconstructed from the
 *     Datawrapper id — so the data isn't silently dropped.
 *   - If there is neither a table nor any recoverable reference, we BAIL cleanly
 *     (leave the element untouched) rather than emit a fabricated block.
 */
function findEmbedUrl(element) {
  const iframe = element.querySelector('iframe[src]');
  if (iframe) return iframe.getAttribute('src');

  const dataSrc = element.querySelector('[data-src]');
  if (dataSrc) return dataSrc.getAttribute('data-src');

  // Reconstruct from the Datawrapper id, e.g. "datawrapper-vis-JrKG8" → JrKG8.
  const idEl = element.id ? element : element.querySelector('[id*="datawrapper"]');
  const id = idEl && idEl.id;
  const m = id && id.match(/datawrapper-(?:vis|chart)-([A-Za-z0-9]+)/);
  if (m) return `https://datawrapper.dwcdn.net/${m[1]}/`;

  return null;
}

export default function parse(element, { document }) {
  // Preferred: a real rendered table inside the Datawrapper embed.
  const table = element.querySelector('table');
  if (table) {
    const cells = [];
    const rows = Array.from(table.querySelectorAll('tr'));

    // Caption: an explicit <caption>, or a preceding heading/figcaption.
    const captionEl = table.querySelector('caption')
      || element.querySelector('figcaption, [class*="caption"], h3, h4');
    if (captionEl && (captionEl.textContent || '').trim()) {
      const strong = document.createElement('strong');
      strong.textContent = captionEl.textContent.trim();
      cells.push([strong]); // single-cell caption row
    }

    rows.forEach((tr) => {
      const rowCells = Array.from(tr.querySelectorAll('th, td'));
      if (rowCells.length === 0) return;
      const item = rowCells[0];
      // Join any remaining columns' text as the value (block is line item | value).
      const valueText = rowCells.slice(1).map((c) => c.textContent.trim()).filter(Boolean).join(' ');
      const valueCell = document.createElement('div');
      valueCell.textContent = valueText;
      cells.push([item, valueCell]);
    });

    if (cells.length) {
      const block = WebImporter.Blocks.createBlock(document, { name: 'table-financial', cells });
      element.replaceWith(block);
      return;
    }
  }

  // Fallback: no rendered table (static snapshot). Preserve the Datawrapper
  // reference if we can recover one; otherwise bail cleanly.
  const src = findEmbedUrl(element);
  if (!src) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const caption = document.createElement('strong');
  caption.textContent = 'Cash flow statement example';
  cells.push([caption]); // single-cell caption row

  const link = document.createElement('a');
  link.href = src;
  link.textContent = src;
  cells.push([link, '']); // two-cell data row keeps the column count consistent

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-financial', cells });
  element.replaceWith(block);
}
