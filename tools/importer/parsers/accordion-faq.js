/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base block: accordion.
 * Source: https://quickbooks.intuit.com/ (RwAccordion_accordion)
 * Content contract (blocks/accordion-faq/accordion-faq.js): one row per Q&A item.
 * Row cell 0 = question label; cell 1 = answer body (links preserved).
 * The standalone "FAQs" section heading is not part of the accordion rows.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('[class*="AccordionItem_itemContainer"]'));

  const cells = [];

  items.forEach((item) => {
    const toggle = item.querySelector('[class*="AccordionItem_toggle"]');
    // The question text is the toggle's first child div (excludes the arrow).
    let questionText = '';
    if (toggle) {
      const qDiv = toggle.querySelector(':scope > div:not([class*="Arrow"])');
      questionText = (qDiv || toggle).textContent.replace(/\s+/g, ' ').trim();
    }

    // Answer paragraph(s) from the panel.
    const panel = item.querySelector('[class*="itemPanel"]');
    const answerCell = [];
    if (panel) {
      const paras = panel.querySelectorAll('p');
      paras.forEach((srcP) => {
        const p = document.createElement('p');
        srcP.childNodes.forEach((node) => {
          if (node.nodeType === 3) {
            p.append(document.createTextNode(node.textContent));
          } else if (node.tagName === 'A') {
            const href = node.getAttribute('href');
            const text = node.textContent.replace(/\s+/g, ' ').trim();
            // Skip broken/placeholder hrefs but keep the text.
            if (href && /^https?:|^\//.test(href)) {
              const a = document.createElement('a');
              a.href = href;
              a.textContent = text;
              p.append(a);
            } else {
              p.append(document.createTextNode(text));
            }
          } else {
            p.append(document.createTextNode(node.textContent));
          }
        });
        // Normalize whitespace on text nodes.
        if (p.textContent.trim()) answerCell.push(p);
      });
    }

    if (!questionText && answerCell.length === 0) return;

    const label = document.createElement('strong');
    label.textContent = questionText;
    cells.push([[label], answerCell]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });

  // Preserve the "FAQs" section heading as default content above the block so
  // the section can lay it out beside the items (two-column on desktop).
  const headingEl = element.querySelector('[class*="accordion__title"], [class*="__title"], h1, h2, h3');
  const out = [];
  if (headingEl) {
    const h2 = document.createElement('h2');
    h2.textContent = headingEl.textContent.replace(/\s+/g, ' ').trim();
    if (h2.textContent) out.push(h2);
  }
  out.push(block);
  element.replaceWith(...out);
}
