/**
 * columns-promo — a promotional band of equal columns, each with a heading, a
 * description, and a call-to-action button.
 *
 * Authored (DA) as a single row with one cell per column. Each cell holds a
 * heading, description, and a link (rendered as a button).
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cols = [...row.children];
  block.classList.add(`columns-promo-${cols.length}-cols`);

  cols.forEach((col) => {
    col.classList.add('columns-promo-col');
    // Promote a standalone trailing link into a button.
    const link = col.querySelector('a');
    if (link && !link.closest('.button-container')) {
      link.classList.add('button');
    }
  });
}
