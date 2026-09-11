/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: QuickBooks section breaks + section metadata for the cash-flow template.
 *
 * Reads payload.template.sections (14 sections; 3 carry a style):
 *   - id 1  "key-takeaways" ............. style: mint-green (selector .colored-box)
 *   - id 12 "product-features" ......... style: grey       (selector [class*='RwCardsContainer_container'])
 *   - id 13 "looking-for-something-else" style: dark       (selector [class*='Promo_promo'])
 *
 * INTERACTION with quickbooks-cleanup.js: section 13's selector [class*='Promo_promo']
 * targets the sticky "Get 50% OFF" promo ad, which the cleanup transformer now removes in
 * beforeTransform. In the real import pipeline the cleanup transformer is registered ahead
 * of this one, so by the time this transformer's beforeTransform runs, that element is gone;
 * querySection() finds no match and section 13 is skipped gracefully (no <hr>, no metadata) —
 * the intended outcome, since that element is site chrome, not an authorable section. The
 * page has no genuine "Looking for something else?" Promo band (the real heading at line ~3018
 * uses Container_bg/Heading_heading1 classes and is not mapped to a section). All other section
 * breaks are unaffected. NOTE: the PostToolUse validation hook runs THIS transformer in
 * isolation against the full snapshot (cleanup has not run), so its section validation will
 * still see Promo_promo and count section 13 — expected divergence from the real pipeline.
 *
 * Inserts an <hr> before every non-first section (in beforeTransform, while every
 * section element still exists — before block parsers can replace them) and a
 * "Section Metadata" block after each styled section (in afterTransform, anchored
 * to the marker <hr> that survives parsing, or the original element as fallback).
 *
 * Selectors come directly from page-templates.json (DOM-verified during page
 * analysis); this transformer does not re-derive them. Sections whose selector
 * does not match on the page are skipped, never guessed.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// section.selector is an array of candidate selectors — try each in order, first match wins.
function querySection(root, selectors) {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break, no metadata
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue; // no selector matched on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have run and may have replaced section elements. Anchor each styled
    // section's Section Metadata block to whichever still exists: the marker <hr>
    // placed above, or (first section, no marker) the original element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
