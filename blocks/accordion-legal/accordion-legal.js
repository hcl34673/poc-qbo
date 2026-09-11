/*
 * accordion-legal Block
 * A toggle link (e.g. "Important pricing details and product information")
 * expanding to reveal legal/disclaimer fine print.
 * Forked from the vanilla accordion; classes namespaced to accordion-legal.
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-legal-item-label';
    summary.append(...label.childNodes);

    const body = row.children[1];
    body.className = 'accordion-legal-item-body';

    const details = document.createElement('details');
    details.className = 'accordion-legal-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
