/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroArticleParser from './parsers/hero-article.js';
import calloutTakeawaysParser from './parsers/callout-takeaways.js';
import calloutTipParser from './parsers/callout-tip.js';
import tableFinancialParser from './parsers/table-financial.js';
import embedVideoParser from './parsers/embed-video.js';
import cardsArticlesParser from './parsers/cards-articles.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import columnsAuthorParser from './parsers/columns-author.js';
import columnsPromoParser from './parsers/columns-promo.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/quickbooks-cleanup.js';
import sectionsTransformer from './transformers/quickbooks-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-article': heroArticleParser,
  'callout-takeaways': calloutTakeawaysParser,
  'callout-tip': calloutTipParser,
  'table-financial': tableFinancialParser,
  'embed-video': embedVideoParser,
  'cards-articles': cardsArticlesParser,
  'cards-feature': cardsFeatureParser,
  'columns-author': columnsAuthorParser,
  'columns-promo': columnsPromoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'cash-flow',
  description: 'Long-form QuickBooks editorial article about cash flow.',
  urls: ['https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/'],
  blocks: [
    { name: 'hero-article', instances: ["[class*='QrcArticleHero_articleHero']", "[class*='QrcArticleHero_root']"] },
    { name: 'callout-takeaways', instances: ['.colored-box'] },
    { name: 'callout-tip', instances: ['.colored-box'] },
    { name: 'table-financial', instances: ['.vis-tables', '.datawrapper-script-embed'] },
    { name: 'embed-video', instances: ["[class*='Video_videoContainer']", "[class*='Video_video']"] },
    { name: 'cards-articles', instances: ["[class*='QrcContentCardGrid_threegrids']"] },
    { name: 'cards-feature', instances: ["[class*='RwCardsContainer_container']"] },
    { name: 'columns-author', instances: ["[class*='AuthorBio_authorBioContainer']"] },
    { name: 'columns-promo', instances: ["[class*='Container_grey01']"] },
  ],
  sections: [
    { id: '0', name: 'article-hero', selector: ["[class*='QrcArticleHero_articleHero']", "[class*='QrcArticleHero_root']"], style: null, blocks: ['hero-article'], defaultContent: [] },
    { id: '1', name: 'key-takeaways', selector: ['.colored-box'], style: 'mint-green', blocks: ['callout-takeaways'], defaultContent: [] },
    { id: '2', name: 'intro-and-definition', selector: ['.core-block-container'], style: null, blocks: ['callout-tip'], defaultContent: [] },
    { id: '3', name: 'types-of-cash-flow', selector: ['.core-block-container'], style: null, blocks: ['callout-tip'], defaultContent: [] },
    { id: '4', name: 'how-to-calculate', selector: ['.core-block-container'], style: null, blocks: ['callout-tip'], defaultContent: [] },
    { id: '5', name: 'cash-flow-example', selector: ['.core-block-container'], style: null, blocks: [], defaultContent: [] },
    { id: '6', name: 'cash-flow-statement', selector: ['.core-block-container'], style: null, blocks: ['table-financial'], defaultContent: [] },
    { id: '7', name: 'managing-cash-flow', selector: ['.core-block-container'], style: null, blocks: ['embed-video', 'callout-tip'], defaultContent: [] },
    { id: '8', name: 'improving-cash-flow', selector: ['.core-block-container'], style: null, blocks: ['embed-video'], defaultContent: [] },
    { id: '9', name: 'faq-or-summary', selector: ['.core-block-container'], style: null, blocks: [], defaultContent: [] },
    { id: '10', name: 'author-bio', selector: ["[class*='AuthorBio_authorBioContainer']"], style: null, blocks: ['columns-author'], defaultContent: [] },
    { id: '11', name: 'recommended-articles', selector: ["[class*='QrcContentCardGrid_threegrids']"], style: null, blocks: ['cards-articles'], defaultContent: [] },
    { id: '12', name: 'product-features', selector: ["[class*='RwCardsContainer_container']"], style: 'grey', blocks: ['cards-feature'], defaultContent: [] },
    { id: '13', name: 'looking-for-something-else', selector: ["[class*='Container_grey01']"], style: 'dark', blocks: ['columns-promo'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata (afterTransform)
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
 * Find all blocks on the page based on the embedded template configuration.
 * De-duplicates elements matched by more than one selector so a single DOM node
 * is only parsed once (e.g. callout-takeaways and callout-tip share .colored-box).
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    // De-dupe PER block definition only. Different blocks may legitimately share a
    // selector (e.g. callout-takeaways and callout-tip both match `.colored-box`);
    // each must receive the shared elements and decide via its own logic whether to
    // claim or bail. The parse loop skips elements a prior parser already replaced.
    const seen = new Set();
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip nodes already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
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

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (map root URL to /index)
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
