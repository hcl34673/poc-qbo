/**
 * hero-banner — centered heading with a single CTA, on a plain band.
 * Structural passthrough: if the block has no image it renders as a centered
 * text banner; an optional background image is placed behind the content.
 */
export default function decorate(block) {
  if (!block.querySelector(':scope picture')) {
    block.classList.add('no-image');
  }
}
