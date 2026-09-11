/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-author. Base: columns (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * Local block contract (blocks/columns-author/columns-author.js): a single row
 * with two cells — an image cell (round photo) and a body cell (author name +
 * bio). decorate() classifies a single-picture cell as the photo and the rest
 * as the bio. Two columns in one row matches the Columns convention.
 *
 * Source: `.AuthorBio_authorBioContainer` with a circular photo
 * (`.AuthorBio_authorBioImageWrapper picture`) and an `.author-info` block
 * holding the author name (a link) and the bio paragraph.
 */
export default function parse(element, { document }) {
  const picture = element.querySelector('picture');

  const info = element.querySelector('.author-info, [class*="author-info"]') || element;

  const nameLink = info.querySelector('a[class*="authorNameLink" i], [class*="authorName" i] a');
  const nameText = (nameLink?.textContent
    || info.querySelector('[class*="authorName" i]')?.textContent || '').trim();
  // Bio: the AuthorBio_authorBio__<hash> span. Match the `authorBio__` token so
  // it doesn't collide with `authorBioContainer`/`authorName` (case-insensitive).
  const bioEl = info.querySelector('[class*="authorBio__" i]')
    || Array.from(info.querySelectorAll('span, p'))
      .filter((el) => el !== nameLink && !el.contains(nameLink) && el.textContent.trim().length > 60)
      .pop();
  const bioText = (bioEl?.textContent || '').trim();

  if (!nameText && !bioText && !picture) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const bodyCell = [];
  if (nameText) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    if (nameLink?.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = nameLink.getAttribute('href');
      a.textContent = nameText;
      strong.append(a);
    } else {
      strong.textContent = nameText;
    }
    p.append(strong);
    bodyCell.push(p);
  }
  if (bioText) {
    const p = document.createElement('p');
    p.textContent = bioText;
    bodyCell.push(p);
  }

  // Single row, two cells: photo | body.
  const cells = [[picture || '', bodyCell.length ? bodyCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-author', cells });
  element.replaceWith(block);
}
