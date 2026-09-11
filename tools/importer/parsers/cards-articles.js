/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-articles. Base: cards (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * 2-column cards: each row is one card — image cell | body cell (tag, title
 * link, date). Matches both the Cards library convention and the local
 * decorate() (blocks/cards-articles/cards-articles.js), which treats a
 * single-picture cell as the image and the rest as the body.
 *
 * Source: `.QrcContentCardGrid_qrcContentCardGridWrapper` wrappers each hold a
 * `.QrcContentCard_qrcContentCardContainer`. Each card has an image `<a>` with a
 * `<picture>` and a title `<a>` wrapping `p.contentArticleTitle`. The whole card
 * links to the article; the title anchor's href is the card target. Category tag
 * and date are optional. Iterate over every card in the element so this works
 * whether the element is one card wrapper or a full grid.
 */
export default function parse(element, { document }) {
  const cards = Array.from(
    element.querySelectorAll('[class*="qrcContentCardContainer"]'),
  );
  const scope = cards.length ? cards : [element];

  const cells = [];

  scope.forEach((card) => {
    const picture = card.querySelector('picture');

    // Card target link + title text.
    const titleP = card.querySelector('[class*="contentArticleTitle"]');
    const titleAnchor = card.querySelector('a[class*="contentAuthorInfoCardAnchor"]')
      || card.querySelector('a[href]');
    const href = titleAnchor?.getAttribute('href');
    const titleText = (titleP?.textContent || titleAnchor?.textContent || '').trim();

    // Optional category tag and date, if present.
    const tagEl = card.querySelector('[class*="tag" i], [class*="eyebrow" i]');
    const dateEl = card.querySelector('[class*="date" i], time');

    const body = [];

    if (tagEl && tagEl.textContent.trim() && tagEl !== titleP) {
      const p = document.createElement('p');
      p.textContent = tagEl.textContent.trim();
      body.push(p);
    }

    if (titleText) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        p.append(a);
      } else {
        p.textContent = titleText;
      }
      body.push(p);
    }

    if (dateEl && dateEl.textContent.trim() && dateEl !== tagEl) {
      const p = document.createElement('p');
      p.textContent = dateEl.textContent.trim();
      body.push(p);
    }

    if (!picture && body.length === 0) return;

    // 2-column card row: image | body (pad missing side with '').
    cells.push([picture || '', body.length ? body : '']);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-articles', cells });
  element.replaceWith(block);
}
