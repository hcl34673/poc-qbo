import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * hero-article — article header: eyebrow label, H1 title, byline + dates,
 * and a header illustration image beside the title.
 *
 * Authored (DA) as a two-column block:
 *   | <eyebrow> <h1> <byline/dates> | <image> |
 * The image cell is optional; authors may omit it and the block still renders.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const firstRow = rows[0];
  if (!firstRow) return;

  const cells = [...firstRow.children];
  const textCell = cells[0];
  const mediaCell = cells.find((cell) => cell.querySelector('picture')) || cells[1];

  if (textCell) {
    textCell.classList.add('hero-article-text');
  }

  if (mediaCell && mediaCell !== textCell) {
    mediaCell.classList.add('hero-article-media');
    mediaCell.querySelectorAll('picture > img').forEach((img) => {
      img.closest('picture').replaceWith(
        createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
      );
    });
  }

  // Tag the eyebrow: the first short paragraph before the H1, if present.
  if (textCell) {
    const heading = textCell.querySelector('h1');
    const firstEl = textCell.firstElementChild;
    if (heading && firstEl && firstEl !== heading && firstEl.tagName === 'P') {
      firstEl.classList.add('hero-article-eyebrow');
    }
    // Everything after the heading is byline / date metadata.
    if (heading) {
      let node = heading.nextElementSibling;
      while (node) {
        node.classList.add('hero-article-meta');
        node = node.nextElementSibling;
      }
    }
  }
}
