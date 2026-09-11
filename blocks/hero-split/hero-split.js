import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * hero-split — text-on-one-side / image-on-the-other split hero on a light background.
 *
 * The image side is an autoplaying carousel (cross-fade) with a play/pause
 * control, mirroring the live QuickBooks hero image stack. When only one image
 * is authored it renders as a static picture.
 *
 * Content contract (DA table authoring):
 *   Either a single row with two cells (text | image[s]), or two rows where one
 *   row holds the picture(s) and the other holds the text (heading + paragraph
 *   + CTAs + trust line). Authors may omit the image cell (text-only).
 */
export default function decorate(block) {
  const rows = [...block.children];

  let textCell;
  let imageCell;

  const cells = [];
  rows.forEach((row) => {
    [...row.children].forEach((cell) => cells.push(cell));
  });

  cells.forEach((cell) => {
    const hasPicture = cell.querySelector('picture, img');
    const hasText = cell.textContent.trim().length > 0;
    if (hasPicture && !hasText && !imageCell) {
      imageCell = cell;
    } else if (hasText && !textCell) {
      textCell = cell;
    } else if (hasPicture && !imageCell) {
      imageCell = cell;
    }
  });

  if (!textCell) [textCell] = cells;
  if (!imageCell) {
    imageCell = cells.find((c) => c !== textCell && c.querySelector('picture, img'));
  }

  block.textContent = '';

  const content = document.createElement('div');
  content.className = 'hero-split-content';
  if (textCell) content.append(...textCell.childNodes);
  block.append(content);

  if (!imageCell) {
    block.classList.add('no-image');
    return;
  }

  const media = document.createElement('div');
  media.className = 'hero-split-media';

  const imgs = [...imageCell.querySelectorAll('img')];

  // Single image → static picture.
  if (imgs.length <= 1) {
    const img = imgs[0];
    if (img) {
      media.append(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
    } else {
      media.append(...imageCell.childNodes);
    }
    block.append(media);
    return;
  }

  // Multiple images → autoplaying cross-fade carousel.
  const track = document.createElement('div');
  track.className = 'hero-split-carousel';

  imgs.forEach((img, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-split-slide';
    slide.setAttribute('aria-hidden', i !== 0);
    slide.append(createOptimizedPicture(img.src, img.alt, i === 0, [{ width: '900' }]));
    track.append(slide);
  });
  media.append(track);

  // Play/pause control.
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'hero-split-toggle';
  control.setAttribute('aria-label', 'Pause carousel');
  control.dataset.state = 'playing';
  media.append(control);

  block.append(media);

  const slides = [...track.children];
  let current = 0;
  let timer = null;

  const show = (next) => {
    slides[current].setAttribute('aria-hidden', 'true');
    current = (next + slides.length) % slides.length;
    slides[current].setAttribute('aria-hidden', 'false');
  };

  const play = () => {
    if (timer) return;
    timer = window.setInterval(() => show(current + 1), 4000);
    control.dataset.state = 'playing';
    control.setAttribute('aria-label', 'Pause carousel');
  };

  const pause = () => {
    if (timer) { window.clearInterval(timer); timer = null; }
    control.dataset.state = 'paused';
    control.setAttribute('aria-label', 'Play carousel');
  };

  control.addEventListener('click', () => {
    if (timer) pause();
    else play();
  });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    play();
  } else {
    pause();
  }
}
