/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-vertical. Base block: tabs.
 * Source: https://quickbooks.intuit.com/ (TabbedDetailPanel container)
 * Content contract (blocks/tabs-vertical/tabs-vertical.js): one row per category.
 * The row's first cell is the label; the row content is the detail panel
 * (heading + CTA + feature list + image). The source renders all tab labels but
 * only a subset of panels have populated content; panels are matched to labels by
 * order, and labels without a content panel get an empty panel cell.
 */
export default function parse(element, { document }) {
  const labels = Array.from(element.querySelectorAll('[class*="tab-label"]'))
    .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 0);

  // Only panels that actually carry content (have a header).
  const contentPanels = Array.from(element.querySelectorAll('[class*="right-panel"]'))
    .filter((p) => p.querySelector('[class*="right-container-header"]'));

  const buildPanel = (panel) => {
    const content = [];

    const header = panel.querySelector('[class*="right-container-header"]');
    if (header) {
      const h3 = document.createElement('h3');
      h3.textContent = header.textContent.replace(/\s+/g, ' ').trim();
      if (h3.textContent) content.push(h3);
    }

    // Feature list.
    const items = Array.from(panel.querySelectorAll('[class*="feature-list-item-text"]'))
      .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (items.length) {
      const ul = document.createElement('ul');
      items.forEach((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        ul.append(li);
      });
      content.push(ul);
    }

    // Bento text paragraphs (supporting copy / stats).
    panel.querySelectorAll('[class*="bento-text"] p').forEach((p) => {
      const para = document.createElement('p');
      para.textContent = p.textContent.replace(/\s+/g, ' ').trim();
      if (para.textContent) content.push(para);
    });

    // Primary image from the bento grid.
    const img = panel.querySelector('[class*="BentoGrid-image"][src]:not([src^="data:"])');
    if (img) {
      const image = document.createElement('img');
      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt') || '';
      content.push(image);
    }

    // CTA link.
    const cta = panel.querySelector('[class*="cta-desktop-link"]');
    if (cta) {
      const label = cta.textContent.replace(/\s+/g, ' ').trim();
      if (label) {
        const a = document.createElement('a');
        a.href = cta.getAttribute('href') || '#';
        a.textContent = label;
        content.push(a);
      }
    }

    return content;
  };

  const cells = [];
  labels.forEach((labelText, i) => {
    const label = document.createElement('strong');
    label.textContent = labelText;
    const panel = contentPanels[i] ? buildPanel(contentPanels[i]) : [];
    cells.push([[label], panel]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-vertical', cells });
  element.replaceWith(block);
}
