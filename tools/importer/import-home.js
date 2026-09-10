/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroSplitParser from './parsers/hero-split.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import tabsDeckParser from './parsers/tabs-deck.js';
import tabsVerticalParser from './parsers/tabs-vertical.js';
import carouselStatsParser from './parsers/carousel-stats.js';
import videoPosterParser from './parsers/video-poster.js';
import cardsLogosParser from './parsers/cards-logos.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import heroBannerParser from './parsers/hero-banner.js';
import accordionLegalParser from './parsers/accordion-legal.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/quickbooks-cleanup.js';
import sectionsTransformer from './transformers/quickbooks-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-split': heroSplitParser,
  'cards-feature': cardsFeatureParser,
  'tabs-deck': tabsDeckParser,
  'tabs-vertical': tabsVerticalParser,
  'carousel-stats': carouselStatsParser,
  'video-poster': videoPosterParser,
  'cards-logos': cardsLogosParser,
  'accordion-faq': accordionFaqParser,
  'hero-banner': heroBannerParser,
  'accordion-legal': accordionLegalParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home',
  description: 'QuickBooks homepage',
  urls: [
    'https://quickbooks.intuit.com/',
  ],
  blocks: [
    { name: 'hero-split', instances: ['[class*="HomepageHero-bleedWrapper"]'] },
    { name: 'cards-feature', instances: ['[class*="PersonalizedCards-animatedTiles"]', '[class*="PersonalizedCards"]'] },
    { name: 'tabs-deck', instances: ['[class*="QRCardsAnimated-root"]', '[class*="QRCardsAnimated"]'] },
    { name: 'tabs-vertical', instances: ['[class*="TabbedDetailPanel-tabbed-detail-panel-container"]', '[class*="TabbedPanel-tabbed-panel-container"]'] },
    { name: 'carousel-stats', instances: ['[class*="FullWidthCarousel-sp-fwc"]', '[class*="FullWidthCarousel"]'] },
    { name: 'video-poster', instances: ['video.facade-teaser', '[class*="facade-teaser"]'] },
    { name: 'cards-logos', instances: ['[class*="InfiniteImageSlider-iis-root"]', '[class*="InfiniteImageSlider"]'] },
    { name: 'accordion-faq', instances: ['[class*="RwAccordion_accordion"]'] },
    { name: 'hero-banner', instances: ['[class*="Background-contentWrapper"]'] },
    { name: 'accordion-legal', instances: ['[class*="RwDisclaimer_rwDisclaimer"]'] },
  ],
  sections: [
    { id: 'rc12', name: 'hero', selector: ['#main > div:nth-of-type(12)'], style: null, blocks: ['hero-split'], defaultContent: [] },
    { id: 'rc16', name: 'recommended-cards', selector: ['#main > div:nth-of-type(16)'], style: null, blocks: ['cards-feature'], defaultContent: [] },
    { id: 'rc20', name: 'statement', selector: ['#main > div:nth-of-type(20)'], style: null, blocks: [], defaultContent: [] },
    { id: 'rc21', name: 'get-it-all-done-tabs', selector: ['#main > div:nth-of-type(21)'], style: null, blocks: ['tabs-deck'], defaultContent: [] },
    { id: 'rc22', name: 'platform-tabs', selector: ['#main > div:nth-of-type(22)'], style: null, blocks: ['tabs-vertical'], defaultContent: [] },
    { id: 'rc23', name: 'stats-testimonials-carousel', selector: ['#main > div:nth-of-type(23)'], style: null, blocks: ['carousel-stats'], defaultContent: [] },
    { id: 'rc24', name: 'sizzle-video', selector: ['#main > div:nth-of-type(24)'], style: null, blocks: ['video-poster'], defaultContent: [] },
    { id: 'rc25', name: 'integrations', selector: ['#main > div:nth-of-type(25)'], style: null, blocks: ['cards-logos'], defaultContent: [] },
    { id: 'rc26', name: 'faqs', selector: ['#main > div:nth-of-type(26)'], style: null, blocks: ['accordion-faq'], defaultContent: [] },
    { id: 'rc27', name: 'trusted-banner', selector: ['#main > div:nth-of-type(27)'], style: null, blocks: ['hero-banner'], defaultContent: [] },
    { id: 'rc28', name: 'pricing-disclaimer', selector: ['#main > div:nth-of-type(28)'], style: null, blocks: ['accordion-legal'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs, then section breaks (afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all block instances on the page based on the embedded template.
 * Only the first matching selector per block is used to avoid duplicate matches.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    let matched = false;
    blockDef.instances.forEach((selector) => {
      if (matched) return;
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) return;
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
      matched = true;
    });
    if (!matched) {
      console.warn(`Block "${blockDef.name}" not found with any selector`);
    }
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (cleanup + section marker setup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by an earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Point the header/footer blocks at the migrated QuickBooks nav/footer
    // documents (default EDS lookup is /nav and /footer; our content lives
    // under /content/). Append rows to the metadata block just created.
    // createMetadata emits a real <table> and appends it last; grab that one
    // (earlier <table>s are the block tables created above).
    const allTables = main.querySelectorAll('table');
    const metaTable = allTables[allTables.length - 1];
    const addMetaRow = (key, value) => {
      if (!metaTable) return;
      const row = document.createElement('tr');
      const k = document.createElement('td');
      k.textContent = key;
      const v = document.createElement('td');
      v.textContent = value;
      row.append(k, v);
      (metaTable.tBodies[0] || metaTable).append(row);
    };
    addMetaRow('nav', '/content/nav');
    addMetaRow('footer', '/content/footer');

    // 6. Sanitized path (root URL → /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
