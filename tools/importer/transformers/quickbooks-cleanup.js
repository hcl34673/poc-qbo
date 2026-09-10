/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: QuickBooks (quickbooks.intuit.com) site-wide cleanup.
 *
 * Removes non-authorable site chrome and third-party widgets so the import
 * contains only page-level authorable content.
 *
 * ALL selectors below were verified by reading migration-work/cleaned.html:
 *   - nav#rw_global_nav                    (line 129)  global navigation
 *   - [class*="Footer_container"]          (line 2328) site footer
 *   - #onetrust-consent-sdk                (line 3318) cookie consent overlay
 *   - [class*="TalkToSales_dContainer"]    (line 3095) floating chat / sales widget
 *   - iframe                               (multiple)  chat, adobe id sync, feedback survey, tracking pixels
 *   - link / noscript / source             leftover non-authorable elements
 *
 * All removals run in afterTransform. Section boundaries in the "home" template
 * are #main > div:nth-of-type(N); :nth-of-type counts same-tag siblings, so the
 * section transformer's beforeTransform must resolve its selectors against an
 * untouched #main. Deferring removal to afterTransform guarantees that, and the
 * removed landmarks are all deeply-nested descendants (never direct div children
 * of #main), so the nth-of-type numbering is never disturbed.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome + third-party widgets (selectors from cleaned.html).
    WebImporter.DOMUtils.remove(element, [
      'nav#rw_global_nav',
      '[class*="Footer_container"]',
      '#onetrust-consent-sdk',
      '[class*="TalkToSales_dContainer"]',
      // pre-hero announcement bar ("Get 50% OFF...") and floating product-specialist chat pills
      '[class*="Promo_promo"]',
      '[class*="OmniFloatingButton"]',
      '[class*="OmniIframe"]',
      '[class*="product-specialist-chat"]',
      // privacy / feedback survey overlays
      '[class*="Qualtrics"]',
      '[id*="qualtrics"]',
      // "Tell us about your business" personalization modal (removed per request)
      '[class*="Dialog-dialog"]',
      '[class*="Dialog-title"]',
      '[class*="Dialog-overlay"]',
      'iframe',
      'link',
      'noscript',
      'source',
    ]);

    // Remove tracking-pixel / blob images (analytics beacons, closed-modal artifacts)
    // that survive as bare <img> with tracking hosts or blob: sources, plus the
    // "Tell us about your business" modal's decorative hero photo, which renders
    // loose outside the widget-form block.
    element.querySelectorAll('img[src^="blob:"], img[src*="bat.bing.com"], img[src*="qualtrics.com"], img[src*="/action/0"], img[src*="consumer-services-modal"]').forEach((img) => {
      const p = img.closest('p');
      (p || img).remove();
    });

    // Remove placeholder/empty anchors (e.g. the "___" skip-link artifact left by
    // the announcement region) — links whose visible text is only underscores/blank.
    element.querySelectorAll('a').forEach((a) => {
      const t = (a.textContent || '').trim();
      if (t === '' || /^_+$/.test(t)) {
        const p = a.closest('p');
        (p && p.textContent.trim() === t ? p : a).remove();
      }
    });

    // Strip non-authorable custom attribute observed in cleaned.html (data-theme on <body>/wrappers).
    element.querySelectorAll('[data-theme]').forEach((el) => {
      el.removeAttribute('data-theme');
    });
  }
}
