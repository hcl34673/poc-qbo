import {
  headingKey, sizeClass, parseSizeClass, matchHeadings, KEY_RE,
} from '../../scripts/heading-key.js';

const HEADINGS = 'h1,h2,h3,h4,h5,h6,p';
const rowKey = (row) => row.children[0]?.textContent.trim().toLowerCase();

function sourceUrl({ org, repo, path }) {
  const p = (path || '/').replace(/\.html$/, '').replace(/\/$/, '') || '/index';
  return `https://admin.da.live/source/${org}/${repo}${p}.html`;
}

async function loadDoc({ actions, context }) {
  const resp = await actions.daFetch(sourceUrl(context));
  if (!resp.ok) throw new Error(`Load failed (${resp.status})`);
  return new DOMParser().parseFromString(await resp.text(), 'text/html');
}

async function saveDoc({ actions, context }, doc) {
  const body = new FormData();
  body.append('data', new Blob([doc.documentElement.outerHTML], { type: 'text/html' }));
  const resp = await actions.daFetch(sourceUrl(context), { method: 'PUT', body });
  if (!resp.ok) throw new Error(`Save failed (${resp.status})`);
}

function metaOf(section, create = false) {
  let meta = section.querySelector(':scope > .section-metadata');
  if (!meta && create) {
    meta = section.ownerDocument.createElement('div');
    meta.className = 'section-metadata';
    section.append(meta);
  }
  return meta;
}

const findRow = (section, key) => [...(metaOf(section)?.children || [])]
  .find((r) => rowKey(r) === key);

function setRow(section, key, value) {
  const existing = findRow(section, key);
  if (existing) {
    existing.children[1].textContent = value;
    return;
  }
  const d = section.ownerDocument;
  const row = d.createElement('div');
  [key, value].forEach((t) => {
    const cell = d.createElement('div');
    cell.textContent = t;
    row.append(cell);
  });
  metaOf(section, true).append(row);
}

const sectionsOf = (doc) => [...doc.querySelectorAll('main > div')];

const entriesOf = (section) => [...(metaOf(section)?.children || [])]
  .filter((r) => KEY_RE.test(rowKey(r)))
  .map((row) => ({ key: rowKey(row), value: row.children[1]?.textContent.trim() || '', row }));

const matchOf = (section, el) => matchHeadings(section, entriesOf(section))
  .matched.find((m) => m.el === el);

/** Section, section number and key for a heading element in the source doc. */
export function headingInfo(el) {
  const section = el.closest('main > div');
  const sectionIndex = sectionsOf(el.ownerDocument).indexOf(section) + 1;
  return {
    el, section, sectionIndex, key: headingKey(el, section),
  };
}

/** Current style of a heading/paragraph, e.g. { as: 'h2', size: 'xxl' }; empty strings when unstyled. */
export function currentStyle(section, el) {
  return parseSizeClass(matchOf(section, el)?.entry.value);
}

/** Re-reads the source before writing so edits made since the selection aren't overwritten. */
export async function setHeadingSize(sdk, { sectionIndex, key }, size, as) {
  const doc = await loadDoc(sdk);
  const section = sectionsOf(doc)[sectionIndex - 1];
  const el = section && [...section.querySelectorAll(HEADINGS)]
    .find((h) => headingKey(h, section) === key);
  if (!el) throw new Error('Element moved since selection. Reselect it.');
  matchOf(section, el)?.entry.row.remove();
  if (size) setRow(section, key, sizeClass(el, size, as));
  await saveDoc(sdk, doc);
}

/** Re-keys edited or moved headings, saves if changed, returns orphaned entries. */
export async function repairAll(sdk) {
  const doc = await loadDoc(sdk);
  const total = { rekeyed: [], orphaned: [] };
  sectionsOf(doc).forEach((section, i) => {
    const { matched, orphans } = matchHeadings(section, entriesOf(section));
    matched.filter((m) => m.entry.key !== m.key).forEach((m) => {
      m.entry.row.children[0].textContent = m.key;
      total.rekeyed.push({ from: m.entry.key, to: m.key });
    });
    total.orphaned.push(...orphans.map((o) => ({ sectionIndex: i + 1, key: o.key })));
  });
  if (total.rekeyed.length) await saveDoc(sdk, doc);
  return total;
}

export async function removeOrphan(sdk, { sectionIndex, key }) {
  const doc = await loadDoc(sdk);
  const section = sectionsOf(doc)[sectionIndex - 1];
  findRow(section, key)?.remove();
  await saveDoc(sdk, doc);
}
