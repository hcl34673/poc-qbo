/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-article. Base: hero (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * Local block contract (blocks/hero-article/hero-article.js): a single row with
 * two cells —
 *   cell 1 (text): eyebrow paragraph, H1 title, byline + publish/update dates
 *   cell 2 (media): the header illustration picture (optional)
 * decorate() reads firstRow.children: cells[0] = text, the picture-bearing cell
 * (or cells[1]) = media.
 *
 * Source is a Next.js QrcArticleHero. Text lives in
 * `.QrcArticleHero_textContentContainer` (a category eyebrow link, the H1, an
 * author byline, and a dates container); the illustration in
 * `.QrcArticleHero_mediaContainer`. Social-share icons are excluded.
 */
export default function parse(element, { document }) {
  const textContainer = element.querySelector('[class*="textContentContainer"]') || element;

  const heading = textContainer.querySelector('h1') || element.querySelector('h1, h2');

  // Eyebrow: the category link shown above the title.
  const eyebrowLink = textContainer.querySelector('a[class*="categoryContainer"]');

  // Byline: "By <author>".
  const authorLink = textContainer.querySelector('a[class*="primaryAuthor"], [class*="author"] a');

  // Publish / update dates.
  const dateEls = Array.from(
    textContainer.querySelectorAll('[class*="articlePublishDate"], [class*="articleUpdatedDate"]'),
  );

  // Header illustration (never a social-share data-URI icon).
  const mediaContainer = element.querySelector('[class*="mediaContainer"]');
  const picture = (mediaContainer || element).querySelector('picture');

  const textCell = [];

  if (eyebrowLink) {
    const p = document.createElement('p');
    p.textContent = (eyebrowLink.textContent || '').trim();
    if (p.textContent) textCell.push(p);
  }

  if (heading) textCell.push(heading);

  if (authorLink) {
    const p = document.createElement('p');
    p.append(document.createTextNode('By '));
    const a = document.createElement('a');
    a.href = authorLink.href;
    a.textContent = (authorLink.textContent || '').trim();
    p.append(a);
    textCell.push(p);
  }

  dateEls.forEach((el) => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      textCell.push(p);
    }
  });

  if (!heading && textCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([textCell, picture || '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-article', cells });
  element.replaceWith(block);
}
