/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-feature. Base: cards (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * 2-column cards: each row is one feature — icon cell | body cell
 * (heading + description, plus any CTA links). Matches both the Cards library
 * convention and the local decorate() (blocks/cards-feature/cards-feature.js),
 * which treats a single-picture cell as the icon and the rest as the body.
 *
 * Source: `.RwCardsContainer_container` holds a section heading and an
 * `.RwCard_rwCard` per feature. Each card has an icon `<picture>`
 * (`.RwCard_cardIcon`), an `<h3>` heading (`.RwCard_rwCardHeader`), a
 * description (`.RwCard_subhead` .ql-align-* text), and CTA/link anchors
 * (`.RwCard_rwCta`, `.RwCard_link a`). The container-level heading is not part
 * of a card row and is left in the section as default content.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('[class*="RwCard_rwCard"]'));
  const scope = cards.length ? cards : [element];

  const cells = [];

  scope.forEach((card) => {
    const iconWrap = card.querySelector('[class*="cardIcon"]');
    const iconPic = (iconWrap || card).querySelector('picture');

    const heading = card.querySelector('h2, h3, h4, [class*="rwCardHeader"]');

    // Description text (rich-text wrapper inside the subhead).
    const descEl = card.querySelector(
      '[class*="subhead"] .ql-align-center, [class*="subhead"] [class*="resp-text-wrapper"], [class*="subhead"]',
    );

    // CTA / secondary links.
    const links = Array.from(card.querySelectorAll('a[class*="rwCta"], [class*="RwCard_link"] a'))
      .filter((a) => a.getAttribute('href'));

    const body = [];
    if (heading && heading.textContent.trim()) {
      const h = document.createElement('h3');
      h.textContent = heading.textContent.trim();
      body.push(h);
    }
    if (descEl && descEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      body.push(p);
    }
    links.forEach((a) => {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = (a.textContent || a.getAttribute('title') || '').trim();
      p.append(link);
      body.push(p);
    });

    if (!iconPic && body.length === 0) return;

    // 2-column feature row: icon | body (pad missing side with '').
    cells.push([iconPic || '', body.length ? body : '']);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-feature', cells });
  element.replaceWith(block);
}
