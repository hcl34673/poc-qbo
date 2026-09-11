import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards-feature — grid of tinted feature tiles.
 * Each tile: optional category tag + bold heading/stat + short description + optional image/icon.
 *
 * Content contract (DA table authoring): one row per tile. A cell containing only a
 * picture becomes the tile image; the remaining cell(s) become the tile body.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-feature-image';
      } else {
        div.className = 'cards-feature-body';
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]),
    );
  });

  block.replaceChildren(ul);
}
