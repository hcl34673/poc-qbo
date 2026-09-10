import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * hero-split — text-on-one-side / image-on-the-other split hero on a light background.
 *
 * Content contract (DA table authoring):
 *   Either a single row with two cells (text | image), or two rows where one row
 *   holds a picture and the other holds the text (heading + paragraph + CTAs + trust line).
 *   Authors may omit the image cell (text-only) — the block degrades gracefully.
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Collect a text side and an image side, defensively — authors omit and add cells.
  let textCell;
  let imageCell;

  const cells = [];
  rows.forEach((row) => {
    [...row.children].forEach((cell) => cells.push(cell));
  });

  cells.forEach((cell) => {
    const hasPicture = cell.querySelector('picture, img');
    const hasText = cell.textContent.trim().length > 0;
    // A picture-only cell is the image side; any cell with text is the text side.
    if (hasPicture && !hasText && !imageCell) {
      imageCell = cell;
    } else if (hasText && !textCell) {
      textCell = cell;
    } else if (hasPicture && !imageCell) {
      imageCell = cell;
    }
  });

  // Fallbacks when the split couldn't be resolved cleanly.
  if (!textCell) [textCell] = cells;
  if (!imageCell) {
    imageCell = cells.find((c) => c !== textCell && c.querySelector('picture, img'));
  }

  block.textContent = '';

  const content = document.createElement('div');
  content.className = 'hero-split-content';
  if (textCell) content.append(...textCell.childNodes);
  block.append(content);

  if (imageCell) {
    const media = document.createElement('div');
    media.className = 'hero-split-media';
    const img = imageCell.querySelector('img');
    if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]);
      media.append(optimized);
    } else {
      media.append(...imageCell.childNodes);
    }
    block.append(media);
  } else {
    block.classList.add('no-image');
  }
}
