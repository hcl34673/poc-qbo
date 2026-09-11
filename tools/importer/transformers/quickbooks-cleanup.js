/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: QuickBooks (quickbooks.intuit.com /r/ editorial) site-wide cleanup.
 *
 * Removes non-authorable site chrome from the Next.js-rendered article shell so the
 * import contains only page-level authorable content.
 *
 * ALL selectors below were verified by reading migration-work/cleaned.html:
 *   - #rw_global_nav .................... line 71  (global marketing nav <nav>)
 *   - .SecondaryNav_globalnavigation .... line 137 (QuickBooks Blog secondary/mega nav)
 *   - .TalkToSales_dPopup ............... line 1684 (nav "Talk to sales" popup)
 *   - #onetrust-consent-sdk ............. line 3837 (OneTrust cookie consent banner)
 *   - [id^="om-"] ....................... lines 4041/4043/4045 (OptinMonster popup holders)
 *   - #QrcLeadGenFloatBarContainer ...... line 2666 (floating lead-gen bar)
 *   - .QrcLeadGenFloatBar_floatBar ...... line 2666 (floating lead-gen bar, class form)
 *   - [class*='TableOfContents'] ........ line 1564 (auto-generated article TOC nav)
 *   - [class*='ProductBanner_productBanner'] . line 2516 (right-rail product promo widget)
 *   - .Footer_container ................. line 3128 (global site footer, incl. cookie/TRUSTe links)
 *   - iframe / #batBeacon* tracking ..... lines 4036-4049 (Adobe/Bing/TTD tracking pixels & iframes)
 *   - [class*='Promo_promo'][class*='Promo_sticky'] . line 38 (sticky "Get 50% OFF" promo ad bar)
 *
 * NOTE: The top sticky promo bar (line 38: Promo_promo + Promo_sticky) IS site chrome — a
 * sticky marketing ad injected by the Next.js shell — and was leaking into the import as a
 * "Get 50% OFF QuickBooks for 3 months" heading. It is removed here in beforeTransform, ahead
 * of block parsing, because it affects parsing: the columns-promo parser and section 13 both
 * key off [class*='Promo_promo'] and would otherwise mis-capture this ad as authorable content.
 * The selector combines Promo_promo + Promo_sticky so it can ONLY match the sticky ad (line 38,
 * the sole Promo_promo/Promo_sticky element on the page); the article's "Looking for something
 * else?" section (line ~3018) uses Container_bg/Heading_heading1 classes and is untouched.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / popups / cookie consent + sticky promo ad — remove before block parsing.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk', // OneTrust cookie consent banner (line 3837)
      '[id^="om-"]', // OptinMonster popup holders (lines 4041/4043/4045)
      "[class*='TalkToSales_']", // nav "Talk to sales" widget (popup + label/CTA container)
      '#QrcLeadGenFloatBarContainer', // floating lead-gen bar container (line 2666)
      '.QrcLeadGenFloatBar_floatBar__50e45e1d', // floating lead-gen bar (line 2666)
      // Sticky "Get 50% OFF QuickBooks for 3 months" promo ad bar (line 38): site
      // chrome injected by the Next.js shell, NOT authorable content. Combined
      // Promo_promo + Promo_sticky ensures this matches ONLY the sticky ad (the sole
      // element carrying both classes) and never the article's "Looking for something
      // else?" section (line ~3018, Container_bg/Heading_heading1 classes). Removed in
      // beforeTransform so the columns-promo parser and section 13 (both keyed on
      // [class*='Promo_promo']) cannot mis-capture it as authorable content.
      "[class*='Promo_promo'][class*='Promo_sticky']",
    ]);

    // Hidden SEO metadata dump + skip link at the very top of <body> (before #__next):
    //   <a href="#">___</a>
    //   <div></div>
    //   <div><div><span>2026-06-17 …</span>…<span><meta>…</meta></span></div></div>
    // These are classless/id-less structural nodes, so they can't be matched by a class
    // selector. The metadata block is uniquely identifiable as a top-of-body element that
    // contains <meta> tags (real article content never nests <meta>); the skip link is the
    // literal href="#" anchor. Remove both so the datetime/URL/description text and the
    // "___" link stop rendering as the first "section" of the article.
    element.querySelectorAll('a[href="#"]').forEach((a) => {
      if ((a.textContent || '').trim() === '___' || a.textContent.trim() === '') a.remove();
    });
    element.querySelectorAll('div').forEach((div) => {
      if (div.querySelector(':scope meta')) div.remove();
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome + tracking — remove after block parsing.
    WebImporter.DOMUtils.remove(element, [
      '#rw_global_nav', // global marketing nav (line 71)
      '.SecondaryNav_globalnavigation__5294673a', // QuickBooks Blog secondary/mega nav (line 137)
      '[class*="TableOfContents"]', // auto-generated article table of contents (line 1564)
      '[class*="ProductBanner_productBanner"]', // right-rail product promo widget (line 2516)
      '.Footer_container__ee4db7bf', // global site footer (line 3128)
      // Social-share widgets ("Share this article:" + Facebook/Twitter/LinkedIn/
      // YouTube icons) — non-authorable chrome. The page has TWO variants: a
      // vertical `socialContainer` bar and a horizontal `socialHeadingHoriz`/`themeIes`
      // heading. Match ALL SocialMedia_* elements so both are removed.
      "[class*='SocialMedia_']",
      // Legal fine-print / "Important offers, pricing details and disclaimers" block —
      // footer-level disclaimer content, not article body (line 578812, Disclaimer_*).
      // Sits AFTER the "View all products" CTA, so removing it preserves that CTA.
      "[class*='Disclaimer_disclaimer']",
      '[id^="batBeacon"]', // Bing tracking beacon (line 4038)
      'iframe', // Adobe/TTD tracking iframes (lines 4036/4047/4049)
      'noscript',
      'link',
    ]);
  }
}
