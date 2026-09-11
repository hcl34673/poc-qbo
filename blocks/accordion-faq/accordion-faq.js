/*
 * accordion-faq Block
 * Expandable question-and-answer pairs.
 * Forked from the vanilla accordion; classes namespaced to accordion-faq.
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate item label (question)
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...label.childNodes);
    // decorate item body (answer)
    const body = row.children[1];
    body.className = 'accordion-faq-item-body';
    // decorate item
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
