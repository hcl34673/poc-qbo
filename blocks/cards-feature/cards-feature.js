import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards-feature — a grid of product-feature cards, each with an icon, a
 * heading, and a description.
 *
 * Authored (DA) as repeating rows — one row per feature. Each row may hold an
 * icon (image) and body content (heading + description).
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-feature-icon';
      } else {
        div.className = 'cards-feature-body';
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(
    createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]),
  ));

  block.replaceChildren(ul);
}
