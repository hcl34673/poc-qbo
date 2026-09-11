/* eslint-disable */
/* global WebImporter */
/**
 * Parser for widget-form. Base block: widget (custom, inferred from source).
 * Source: https://quickbooks.intuit.com/ (Dialog-dialog-content personalization form)
 * Content contract (blocks/widget-form/widget-form.js):
 *   Row 1: heading / prompt
 *   Row 2: bulleted list (ul) of selectable need chips (checkboxes)
 *   Row 3: second prompt + ordered list (ol) of radio options
 *   Last row: submit / continue button (link)
 * Each row is a single cell; ul -> chips, ol -> radios.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Row 1: title.
  const title = element.querySelector('[class*="Dialog-title"], h1, h2');
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title.textContent.replace(/\s+/g, ' ').trim();
    if (h2.textContent) cells.push([[h2]]);
  }

  // Row 2: needs prompt + chip list (checkboxes -> ul).
  const needsPrompt = element.querySelector('[class*="tileSelectionQuestion"]');
  const needBtns = Array.from(element.querySelectorAll('[class*="tileSelectorTitle"]'))
    .map((b) => b.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (needBtns.length) {
    const cell = [];
    if (needsPrompt) {
      const p = document.createElement('p');
      p.textContent = needsPrompt.textContent.replace(/\s+/g, ' ').trim();
      if (p.textContent) cell.push(p);
    }
    const ul = document.createElement('ul');
    needBtns.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      ul.append(li);
    });
    cell.push(ul);
    cells.push([cell]);
  }

  // Row 3: employees prompt + radio options (ol).
  const radioPrompt = element.querySelector('[class*="form_question"]');
  const radioOpts = Array.from(element.querySelectorAll('[class*="radioOption"] label'))
    .map((l) => l.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (radioOpts.length) {
    const cell = [];
    if (radioPrompt) {
      const p = document.createElement('p');
      p.textContent = radioPrompt.textContent.replace(/\s+/g, ' ').trim();
      if (p.textContent) cell.push(p);
    }
    const ol = document.createElement('ol');
    radioOpts.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      ol.append(li);
    });
    cell.push(ol);
    cells.push([cell]);
  }

  // Last row: submit / continue button.
  const submit = element.querySelector('[class*="ctaButtonCustomize"], [class*="primaryWrapper"] button');
  if (submit) {
    const label = submit.textContent.replace(/\s+/g, ' ').trim();
    if (label) {
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = label;
      cells.push([[a]]);
    }
  }

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'widget-form', cells });
  element.replaceWith(block);
}
