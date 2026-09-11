/**
 * columns-author — an author bio: a round photo beside the author name and a
 * short biography paragraph.
 *
 * Authored (DA) as a single row with two cells — an image cell (photo) and a
 * body cell (name + bio). Authors may omit the photo.
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  [...row.children].forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic && col.children.length === 1) {
      col.classList.add('columns-author-photo');
    } else {
      col.classList.add('columns-author-bio');
    }
  });
}
