import DA_SDK from 'https://da.live/nx/utils/sdk.js';

import {
  applyTextStyle,
  fetchDocument,
  saveDocument,
} from './utils.js';

let context;
let token;
let actions;

const styleSelect = document.querySelector('#style-select');
const applyStyleButton = document.querySelector('#apply-style');
const statusEl = document.querySelector('.status');
const selectionEl = document.querySelector('#selection');

function setStatus(message) {
  statusEl.textContent = message;
}

async function applyStyle(style) {
  try {
    const selectionHtml = await actions.getSelection();
    const selectionDocument = new DOMParser().parseFromString(
      selectionHtml,
      'text/html',
    );
    const selectedText = selectionDocument.body.textContent;

    if (!selectedText) {
      throw new Error('Select some text in the document first.');
    }

    setStatus(`Applying ${style}...`);

    const { org, repo, path } = context;
    const documentPath = `/${org}/${repo}${path}`;
    const html = await fetchDocument(documentPath, token);
    const updatedHtml = applyTextStyle(html, selectionHtml, style);

    await saveDocument(documentPath, token, updatedHtml);

    selectionEl.textContent = `Selected: "${selectedText}"`;
    setStatus(`Applied "${style}". Refresh the document to see the saved change.`);
  } catch (error) {
    console.error(error);

    setStatus(
      error.message || 'Could not apply style.',
    );
  }
}

function handleApplyStyle() {
  applyStyle(styleSelect.value);
}

(async function init() {
  const sdk = await DA_SDK;

  context = sdk.context;
  token = sdk.token;
  actions = sdk.actions;

  applyStyleButton.addEventListener('click', handleApplyStyle);

  setStatus(
    'Select text in the document, then choose a style.',
  );
}());
