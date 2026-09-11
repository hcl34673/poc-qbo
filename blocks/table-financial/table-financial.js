/**
 * table-financial — a financial data table (line item -> value) with an
 * optional bold caption above it.
 *
 * Authored (DA) as a block whose rows become table rows. The first row, if it
 * holds a single cell, is treated as the caption; every other row is a
 * two-column data row (line item in the first cell, value in the second).
 */
export default function decorate(block) {
  const rows = [...block.children];
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  let caption;
  const firstRow = rows[0];
  if (firstRow && firstRow.children.length === 1) {
    caption = document.createElement('caption');
    while (firstRow.firstElementChild?.firstChild) {
      caption.append(firstRow.firstElementChild.firstChild);
    }
    rows.shift();
  }

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement('td');
      while (cell.firstChild) td.append(cell.firstChild);
      tr.append(td);
    });
    tbody.append(tr);
  });

  if (caption) table.append(caption);
  table.append(tbody);
  block.replaceChildren(table);
}
