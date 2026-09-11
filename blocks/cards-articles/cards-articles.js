import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards-articles — a grid of related-article cards. Each card has an image, an
 * optional category tag, a title, and a date, and the whole card links to
 * another article.
 *
 * Authored (DA) as repeating rows — one row per card. Each row: an image cell
 * and a body cell (tag, title, date; the title link is the card target).
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-articles-image';
      } else {
        div.className = 'cards-articles-body';
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(
    createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
  ));

  block.replaceChildren(ul);
}
