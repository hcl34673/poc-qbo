/**
 * callout-tip — a highlighted tip box with a leading icon and one or more
 * short paragraphs. Used for recurring "tip" notes throughout an article.
 *
 * Authored (DA) as a single block. The first cell may hold an icon (image);
 * the remaining content is the tip body. Authors may omit the icon.
 *
 * Options (CSS class tokens on the block):
 *   - `alert`  — exclamation-mark treatment instead of the default lightbulb tip.
 */
const OPTION_CLASSES = ['alert'];

export default function decorate(block) {
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];

  // An icon cell is one whose only content is a picture/icon.
  const iconCell = cells.find((cell) => {
    const pic = cell.querySelector('picture, img, .icon');
    return pic && cell.textContent.trim() === '';
  });

  if (iconCell) {
    iconCell.classList.add('callout-tip-icon');
  }

  cells.forEach((cell) => {
    if (cell !== iconCell) cell.classList.add('callout-tip-body');
  });

  // Expose the resolved treatment for styling; harmless if already present.
  if (active.includes('alert')) block.classList.add('callout-tip-alert');
}
