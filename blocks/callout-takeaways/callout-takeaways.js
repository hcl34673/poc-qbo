/**
 * callout-takeaways — a "Key takeaways" summary box: a heading followed by a
 * bulleted list, presented inside a distinct rounded box.
 *
 * Authored (DA) as a single block with one cell holding a heading and a list.
 */
export default function decorate(block) {
  const content = block.firstElementChild?.firstElementChild || block.firstElementChild;
  if (content) {
    content.classList.add('callout-takeaways-body');
  }
}
