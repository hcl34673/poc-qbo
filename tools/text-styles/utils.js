const TEXT_STYLES = [
  'heading-font-size-l',
  'heading-font-size-m',
  'heading-font-size-s',
  'heading-font-size-xs',
];

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim().replace(/([,.;:!?])\s+/g, '$1');
}

function getOptions(token, method = 'GET') {
  return {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function getSection(element, document) {
  const main = element.parentElement.closest('main') || document.body;
  return Array.from(main.children).find((child) => child.contains(element)) || main;
}

function updateSectionStyleMetadata(section, appliedStyle, selectedText) {
  let metadata = Array.from(section.querySelectorAll('table, .section-metadata'))
    .find((element) => element.classList.contains('section-metadata')
      || element.querySelector('tr:first-child')?.textContent.trim().toLowerCase() === 'section metadata');

  if (metadata?.tagName !== 'TABLE') {
    metadata = metadata?.querySelector('table');
  }

  if (!metadata) {
    metadata = section.ownerDocument.createElement('table');
    const header = metadata.createTHead().insertRow();
    const title = section.ownerDocument.createElement('th');
    title.colSpan = 2;
    title.textContent = 'Section Metadata';
    header.append(title);
    section.append(metadata);
  }

  if (!metadata) return;

  const rows = Array.from(metadata.querySelectorAll('tr'));
  const styleRow = rows.find((row) => row.cells[0]?.textContent.trim().toLowerCase() === 'text-styles');
  const styleValue = styleRow?.cells[1]?.textContent || '[]';
  let mappings = [];

  try {
    const parsed = JSON.parse(styleValue);
    if (Array.isArray(parsed)) mappings = parsed;
  } catch {
    // Start a clean mapping list if an old or malformed value is present.
  }

  mappings = mappings.filter((mapping) => (
    mapping
    && typeof mapping.text === 'string'
    && normalizeText(mapping.text) !== normalizeText(selectedText)
  ));
  mappings.push({ text: selectedText, className: appliedStyle });

  rows
    .filter((row) => row.cells[0]?.textContent.trim().toLowerCase() === 'highlight')
    .forEach((row) => row.remove());

  const row = styleRow || (metadata.tBodies[0] || metadata.createTBody()).insertRow();
  const propertyCell = row.cells[0] || row.insertCell();
  const valueCell = row.cells[1] || row.insertCell();
  propertyCell.textContent = 'text-styles';
  valueCell.textContent = JSON.stringify(mappings);
}

export function applyTextStyle(html, selectionHtml, style) {
  if (typeof selectionHtml !== 'string' || !selectionHtml) {
    throw new Error('The selected text could not be read.');
  }

  if (!TEXT_STYLES.includes(style)) {
    throw new Error(`Unknown text style: ${style}`);
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  const selectionDocument = parser.parseFromString(selectionHtml, 'text/html');
  const selectedText = selectionDocument.body.textContent;

  if (!selectedText) {
    throw new Error('Select some text in the document first.');
  }

  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let documentText = '';
  let textNode = walker.nextNode();

  while (textNode) {
    const start = documentText.length;
    documentText += textNode.textContent;
    textNodes.push({ node: textNode, start, end: documentText.length });
    textNode = walker.nextNode();
  }

  const matchIndex = documentText.indexOf(selectedText);
  if (matchIndex < 0) {
    throw new Error('Could not find the selected text in the document.');
  }

  const matchEnd = matchIndex + selectedText.length;
  const startSegment = textNodes.find(
    (segment) => segment.start <= matchIndex && segment.end > matchIndex,
  );
  const endSegment = textNodes.find(
    (segment) => segment.start < matchEnd && segment.end >= matchEnd,
  );

  if (!startSegment || !endSegment) {
    throw new Error('Could not locate the selected text in the document.');
  }

  const range = document.createRange();
  range.setStart(startSegment.node, matchIndex - startSegment.start);
  range.setEnd(endSegment.node, matchEnd - endSegment.start);
  const section = getSection(startSegment.node, document);
  const matchingParagraphs = Array.from(section.querySelectorAll('p'))
    .filter((paragraph) => normalizeText(paragraph.textContent) === normalizeText(selectedText));

  if (matchingParagraphs.length) {
    matchingParagraphs.forEach((paragraph) => {
      paragraph.classList.remove(...TEXT_STYLES, 'highlight');
      paragraph.classList.add(style);
    });
  } else {
    const fragment = range.extractContents();
    fragment.querySelectorAll('*').forEach((element) => {
      element.classList.remove(...TEXT_STYLES, 'highlight');
      if (element.tagName === 'SPAN' && element.classList.length === 0) {
        element.replaceWith(...element.childNodes);
      }
    });

    const span = document.createElement('span');
    span.classList.add(style);
    span.appendChild(fragment);
    range.insertNode(span);
  }

  updateSectionStyleMetadata(section, style, selectedText);

  const doctype = html.match(/^\s*<!doctype[^>]*>/i)?.[0] || '';
  return `${doctype}${doctype ? '\n' : ''}${document.documentElement.outerHTML}`;
}

export async function fetchDocument(path, token) {
  const response = await fetch(
    `https://admin.da.live/source${path}.html`,
    getOptions(token),
  );

  if (!response.ok) {
    throw new Error(`Unable to fetch document (${response.status})`);
  }

  return response.text();
}

export async function saveDocument(path, token, html) {
  const body = new FormData();
  body.append('data', new Blob([html], { type: 'text/html' }));

  const options = getOptions(token, 'PUT');
  options.body = body;

  const response = await fetch(
    `https://admin.da.live/source${path}.html`,
    options,
  );

  if (!response.ok) {
    throw new Error(`Unable to save document (${response.status})`);
  }
}
