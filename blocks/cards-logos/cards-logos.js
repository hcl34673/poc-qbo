import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards-logos — autoplaying marquee of partner brand logos.
 *
 * Content contract (DA table authoring): one row per logo (or a single row of
 * logo cells). Each cell holds a logo image, optionally wrapped in a link.
 *
 * The logos scroll continuously (CSS marquee). The track is duplicated so the
 * loop is seamless; animation pauses on hover and respects reduced-motion.
 */
export default function decorate(block) {
  const track = document.createElement('ul');
  track.className = 'cards-logos-track';

  const cells = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => cells.push(cell));
  });

  cells.forEach((cell) => {
    if (!cell.querySelector('picture, img')) return;
    const li = document.createElement('li');
    li.className = 'cards-logos-item';
    li.append(...cell.childNodes);
    track.append(li);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]),
    );
  });

  // Duplicate the set of logos so the marquee can loop seamlessly.
  const viewport = document.createElement('div');
  viewport.className = 'cards-logos-viewport';
  const clone = track.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  viewport.append(track, clone);

  block.replaceChildren(viewport);
}
