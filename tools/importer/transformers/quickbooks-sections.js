/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: QuickBooks (quickbooks.intuit.com) section breaks + section metadata.
 *
 * The "home" template defines 11 sections whose boundaries are
 * `#main > div:nth-of-type(N)` (N = 12,16,20,21,22,23,24,25,26,27,28), taken
 * verbatim from page-templates.json `template.sections[].selector`. Only the
 * `stats-testimonials-carousel` section (rc23) carries a style ("dark").
 *
 * Expected after run: 10 <hr> section breaks (one before each non-first section)
 * and 1 Section Metadata block (for rc23).
 *
 * Uses BOTH hooks: breaks/markers are inserted in beforeTransform while every
 * section element still exists (block parsers replace elements between the
 * hooks); Section Metadata is anchored in afterTransform to the surviving
 * marker <hr>. Sections are iterated in reverse so inserting relative to a live
 * element never disturbs the position of sections not yet processed. Bare <hr>
 * is not a <div>, so inserting it never perturbs the sections' :nth-of-type
 * selectors (:nth-of-type counts same-tag siblings only).
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
      if (!sectionEl) continue; // no selector matched on this page — skip, never guess a replacement

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now run and may have replaced section elements. Anchor each
    // styled section's Section Metadata block to whichever still exists: the
    // marker <hr> placed above, or (first section, no marker inserted) the
    // original element itself.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived — no selector matched post-parse; skip, never guess

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
