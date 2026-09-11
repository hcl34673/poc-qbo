/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-cash-flow.js
  var import_cash_flow_exports = {};
  __export(import_cash_flow_exports, {
    default: () => import_cash_flow_default
  });

  // tools/importer/parsers/hero-article.js
  function parse(element, { document: document2 }) {
    const textContainer = element.querySelector('[class*="textContentContainer"]') || element;
    const heading = textContainer.querySelector("h1") || element.querySelector("h1, h2");
    const eyebrowLink = textContainer.querySelector('a[class*="categoryContainer"]');
    const authorLink = textContainer.querySelector('a[class*="primaryAuthor"], [class*="author"] a');
    const dateEls = Array.from(
      textContainer.querySelectorAll('[class*="articlePublishDate"], [class*="articleUpdatedDate"]')
    );
    const mediaContainer = element.querySelector('[class*="mediaContainer"]');
    const picture = (mediaContainer || element).querySelector("picture");
    const textCell = [];
    if (eyebrowLink) {
      const p = document2.createElement("p");
      p.textContent = (eyebrowLink.textContent || "").trim();
      if (p.textContent) textCell.push(p);
    }
    if (heading) textCell.push(heading);
    if (authorLink) {
      const p = document2.createElement("p");
      p.append(document2.createTextNode("By "));
      const a = document2.createElement("a");
      a.href = authorLink.href;
      a.textContent = (authorLink.textContent || "").trim();
      p.append(a);
      textCell.push(p);
    }
    dateEls.forEach((el) => {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (text) {
        const p = document2.createElement("p");
        p.textContent = text;
        textCell.push(p);
      }
    });
    if (!heading && textCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([textCell, picture || ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/callout-takeaways.js
  var TAKEAWAYS_RE = /key\s*takeaways/i;
  function parse2(element, { document: document2 }) {
    const scope = element.querySelector("left") || element;
    const headings = Array.from(scope.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    const takeawaysHeading = headings.find((h) => TAKEAWAYS_RE.test((h.textContent || "").trim()));
    if (!takeawaysHeading) {
      return;
    }
    const list = scope.querySelector("ul, ol");
    const contentCell = [takeawaysHeading];
    if (list) contentCell.push(list);
    const cells = [];
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "callout-takeaways", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/callout-tip.js
  var TAKEAWAYS_RE2 = /key\s*takeaways/i;
  var ALERT_RE = /alert|warning|exclamation|caution|important/i;
  function parse3(element, { document: document2 }) {
    const scope = element.querySelector("left") || element;
    const headings = Array.from(scope.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    if (headings.some((h) => TAKEAWAYS_RE2.test((h.textContent || "").trim()))) {
      return;
    }
    const icon = scope.querySelector('img.icon, img[class*="icon"], img');
    const bodyParas = Array.from(scope.querySelectorAll("p")).filter((p) => {
      const hasText = p.textContent.trim() !== "";
      const hasLink = !!p.querySelector("a");
      return hasText || hasLink;
    });
    if (!icon && bodyParas.length === 0) {
      return;
    }
    let name = "callout-tip";
    if (icon) {
      const hint = `${icon.getAttribute("alt") || ""} ${icon.getAttribute("src") || ""} ${icon.className || ""}`;
      if (ALERT_RE.test(hint)) name = "callout-tip (alert)";
    }
    const cells = [];
    const bodyCell = bodyParas.length ? bodyParas : [""];
    if (icon) {
      cells.push([[icon], bodyCell]);
    } else {
      cells.push([bodyCell]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-financial.js
  function findEmbedUrl(element) {
    const iframe = element.querySelector("iframe[src]");
    if (iframe) return iframe.getAttribute("src");
    const dataSrc = element.querySelector("[data-src]");
    if (dataSrc) return dataSrc.getAttribute("data-src");
    const idEl = element.id ? element : element.querySelector('[id*="datawrapper"]');
    const id = idEl && idEl.id;
    const m = id && id.match(/datawrapper-(?:vis|chart)-([A-Za-z0-9]+)/);
    if (m) return `https://datawrapper.dwcdn.net/${m[1]}/`;
    return null;
  }
  function parse4(element, { document: document2 }) {
    const table = element.querySelector("table");
    if (table) {
      const cells2 = [];
      const rows = Array.from(table.querySelectorAll("tr"));
      const captionEl = table.querySelector("caption") || element.querySelector('figcaption, [class*="caption"], h3, h4');
      if (captionEl && (captionEl.textContent || "").trim()) {
        const strong = document2.createElement("strong");
        strong.textContent = captionEl.textContent.trim();
        cells2.push([strong]);
      }
      rows.forEach((tr) => {
        const rowCells = Array.from(tr.querySelectorAll("th, td"));
        if (rowCells.length === 0) return;
        const item = rowCells[0];
        const valueText = rowCells.slice(1).map((c) => c.textContent.trim()).filter(Boolean).join(" ");
        const valueCell = document2.createElement("div");
        valueCell.textContent = valueText;
        cells2.push([item, valueCell]);
      });
      if (cells2.length) {
        const block2 = WebImporter.Blocks.createBlock(document2, { name: "table-financial", cells: cells2 });
        element.replaceWith(block2);
        return;
      }
    }
    const src = findEmbedUrl(element);
    if (!src) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const caption = document2.createElement("strong");
    caption.textContent = "Cash flow statement example";
    cells.push([caption]);
    const link = document2.createElement("a");
    link.href = src;
    link.textContent = src;
    cells.push([link, ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-financial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed-video.js
  function toWatchUrl(raw) {
    try {
      const u = new URL(raw, "https://quickbooks.intuit.com");
      if (/youtube\.com|youtu\.be/.test(u.hostname)) {
        const id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
        if (id) return `https://www.youtube.com/watch?v=${id}`;
      }
      return u.href;
    } catch (e) {
      return raw;
    }
  }
  function parse5(element, { document: document2 }) {
    const picture = element.querySelector("picture");
    const anchor = element.querySelector("a[href]");
    const iframe = element.querySelector('iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src]');
    const dataAttrEl = element.querySelector(
      '[data-video-url], [data-video-id], [data-youtube-id], [data-src*="youtu"]'
    );
    let href = null;
    if (anchor) {
      href = anchor.getAttribute("href");
    } else if (iframe) {
      href = iframe.getAttribute("src");
    } else if (dataAttrEl) {
      const id = dataAttrEl.getAttribute("data-video-id") || dataAttrEl.getAttribute("data-youtube-id");
      href = id ? `https://www.youtube.com/watch?v=${id}` : dataAttrEl.getAttribute("data-video-url") || dataAttrEl.getAttribute("data-src");
    }
    if (!href && !picture) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (picture) contentCell.push(picture);
    if (href) {
      const link = document2.createElement("a");
      link.href = toWatchUrl(href);
      link.textContent = link.href;
      contentCell.push(link);
    }
    const cells = [[contentCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "embed-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-articles.js
  function parse6(element, { document: document2 }) {
    const cards = Array.from(
      element.querySelectorAll('[class*="qrcContentCardContainer"]')
    );
    const scope = cards.length ? cards : [element];
    const cells = [];
    scope.forEach((card) => {
      const picture = card.querySelector("picture");
      const titleP = card.querySelector('[class*="contentArticleTitle"]');
      const titleAnchor = card.querySelector('a[class*="contentAuthorInfoCardAnchor"]') || card.querySelector("a[href]");
      const href = titleAnchor == null ? void 0 : titleAnchor.getAttribute("href");
      const titleText = ((titleP == null ? void 0 : titleP.textContent) || (titleAnchor == null ? void 0 : titleAnchor.textContent) || "").trim();
      const tagEl = card.querySelector('[class*="tag" i], [class*="eyebrow" i]');
      const dateEl = card.querySelector('[class*="date" i], time');
      const body = [];
      if (tagEl && tagEl.textContent.trim() && tagEl !== titleP) {
        const p = document2.createElement("p");
        p.textContent = tagEl.textContent.trim();
        body.push(p);
      }
      if (titleText) {
        const p = document2.createElement("p");
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = titleText;
          p.append(a);
        } else {
          p.textContent = titleText;
        }
        body.push(p);
      }
      if (dateEl && dateEl.textContent.trim() && dateEl !== tagEl) {
        const p = document2.createElement("p");
        p.textContent = dateEl.textContent.trim();
        body.push(p);
      }
      if (!picture && body.length === 0) return;
      cells.push([picture || "", body.length ? body : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-articles", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-feature.js
  function parse7(element, { document: document2 }) {
    const cards = Array.from(element.querySelectorAll('[class*="RwCard_rwCard"]'));
    const scope = cards.length ? cards : [element];
    const cells = [];
    scope.forEach((card) => {
      const iconWrap = card.querySelector('[class*="cardIcon"]');
      const iconPic = (iconWrap || card).querySelector("picture");
      const heading = card.querySelector('h2, h3, h4, [class*="rwCardHeader"]');
      const descEl = card.querySelector(
        '[class*="subhead"] .ql-align-center, [class*="subhead"] [class*="resp-text-wrapper"], [class*="subhead"]'
      );
      const links = Array.from(card.querySelectorAll('a[class*="rwCta"], [class*="RwCard_link"] a')).filter((a) => a.getAttribute("href"));
      const body = [];
      if (heading && heading.textContent.trim()) {
        const h = document2.createElement("h3");
        h.textContent = heading.textContent.trim();
        body.push(h);
      }
      if (descEl && descEl.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = descEl.textContent.trim();
        body.push(p);
      }
      links.forEach((a) => {
        const p = document2.createElement("p");
        const link = document2.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = (a.textContent || a.getAttribute("title") || "").trim();
        p.append(link);
        body.push(p);
      });
      if (!iconPic && body.length === 0) return;
      cells.push([iconPic || "", body.length ? body : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-author.js
  function parse8(element, { document: document2 }) {
    var _a;
    const picture = element.querySelector("picture");
    const info = element.querySelector('.author-info, [class*="author-info"]') || element;
    const nameLink = info.querySelector('a[class*="authorNameLink" i], [class*="authorName" i] a');
    const nameText = ((nameLink == null ? void 0 : nameLink.textContent) || ((_a = info.querySelector('[class*="authorName" i]')) == null ? void 0 : _a.textContent) || "").trim();
    const bioEl = info.querySelector('[class*="authorBio__" i]') || Array.from(info.querySelectorAll("span, p")).filter((el) => el !== nameLink && !el.contains(nameLink) && el.textContent.trim().length > 60).pop();
    const bioText = ((bioEl == null ? void 0 : bioEl.textContent) || "").trim();
    if (!nameText && !bioText && !picture) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const bodyCell = [];
    if (nameText) {
      const p = document2.createElement("p");
      const strong = document2.createElement("strong");
      if (nameLink == null ? void 0 : nameLink.getAttribute("href")) {
        const a = document2.createElement("a");
        a.href = nameLink.getAttribute("href");
        a.textContent = nameText;
        strong.append(a);
      } else {
        strong.textContent = nameText;
      }
      p.append(strong);
      bodyCell.push(p);
    }
    if (bioText) {
      const p = document2.createElement("p");
      p.textContent = bioText;
      bodyCell.push(p);
    }
    const cells = [[picture || "", bodyCell.length ? bodyCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-author", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function parse9(element, { document: document2 }) {
    const HEADING_SEL = "h1, h2, h3, h4, h5, h6";
    const items = Array.from(
      element.querySelectorAll('[class*="ContainerItem_containerItem"]')
    ).filter((it) => it.querySelector("a[href]") && it.querySelector(HEADING_SEL));
    if (items.length === 0) {
      const heading = element.querySelector(HEADING_SEL);
      if (heading && (heading.textContent || "").trim()) {
        const lead = document2.createElement(heading.tagName.toLowerCase());
        lead.textContent = heading.textContent.replace(/\s+/g, " ").trim();
        element.replaceWith(lead);
        return;
      }
      element.replaceWith(...element.childNodes);
      return;
    }
    const columnCells = items.map((item) => {
      const cell = [];
      const headingEl = item.querySelector(HEADING_SEL);
      if (headingEl && (headingEl.textContent || "").trim()) {
        const h = document2.createElement(headingEl.tagName.toLowerCase());
        h.textContent = headingEl.textContent.replace(/\s+/g, " ").trim();
        cell.push(h);
      }
      const descWrap = item.querySelector('[class*="Responsivetext"], [class*="resp-text"], .text');
      const descParas = descWrap ? Array.from(descWrap.querySelectorAll("p")).filter((p) => (p.textContent || "").trim()) : [];
      descParas.forEach((p) => cell.push(p));
      const seen = /* @__PURE__ */ new Set();
      Array.from(item.querySelectorAll("a[href]")).forEach((a) => {
        const href = a.getAttribute("href");
        if (!href || seen.has(href)) return;
        seen.add(href);
        const p = document2.createElement("p");
        const link = document2.createElement("a");
        link.href = href;
        link.textContent = (a.textContent || a.getAttribute("title") || href).replace(/\s+/g, " ").trim();
        p.append(link);
        cell.push(p);
      });
      return cell;
    }).filter((cell) => cell.length);
    if (columnCells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [columnCells];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/quickbooks-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        // OneTrust cookie consent banner (line 3837)
        '[id^="om-"]',
        // OptinMonster popup holders (lines 4041/4043/4045)
        "[class*='TalkToSales_']",
        // nav "Talk to sales" widget (popup + label/CTA container)
        "#QrcLeadGenFloatBarContainer",
        // floating lead-gen bar container (line 2666)
        ".QrcLeadGenFloatBar_floatBar__50e45e1d",
        // floating lead-gen bar (line 2666)
        // Sticky "Get 50% OFF QuickBooks for 3 months" promo ad bar (line 38): site
        // chrome injected by the Next.js shell, NOT authorable content. Combined
        // Promo_promo + Promo_sticky ensures this matches ONLY the sticky ad (the sole
        // element carrying both classes) and never the article's "Looking for something
        // else?" section (line ~3018, Container_bg/Heading_heading1 classes). Removed in
        // beforeTransform so the columns-promo parser and section 13 (both keyed on
        // [class*='Promo_promo']) cannot mis-capture it as authorable content.
        "[class*='Promo_promo'][class*='Promo_sticky']"
      ]);
      element.querySelectorAll('a[href="#"]').forEach((a) => {
        if ((a.textContent || "").trim() === "___" || a.textContent.trim() === "") a.remove();
      });
      element.querySelectorAll("div").forEach((div) => {
        if (div.querySelector(":scope meta")) div.remove();
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#rw_global_nav",
        // global marketing nav (line 71)
        ".SecondaryNav_globalnavigation__5294673a",
        // QuickBooks Blog secondary/mega nav (line 137)
        '[class*="TableOfContents"]',
        // auto-generated article table of contents (line 1564)
        '[class*="ProductBanner_productBanner"]',
        // right-rail product promo widget (line 2516)
        ".Footer_container__ee4db7bf",
        // global site footer (line 3128)
        // Social-share widgets ("Share this article:" + Facebook/Twitter/LinkedIn/
        // YouTube icons) — non-authorable chrome. The page has TWO variants: a
        // vertical `socialContainer` bar and a horizontal `socialHeadingHoriz`/`themeIes`
        // heading. Match ALL SocialMedia_* elements so both are removed.
        "[class*='SocialMedia_']",
        // Legal fine-print / "Important offers, pricing details and disclaimers" block —
        // footer-level disclaimer content, not article body (line 578812, Disclaimer_*).
        // Sits AFTER the "View all products" CTA, so removing it preserves that CTA.
        "[class*='Disclaimer_disclaimer']",
        '[id^="batBeacon"]',
        // Bing tracking beacon (line 4038)
        "iframe",
        // Adobe/TTD tracking iframes (lines 4036/4047/4049)
        "noscript",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/quickbooks-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-cash-flow.js
  var parsers = {
    "hero-article": parse,
    "callout-takeaways": parse2,
    "callout-tip": parse3,
    "table-financial": parse4,
    "embed-video": parse5,
    "cards-articles": parse6,
    "cards-feature": parse7,
    "columns-author": parse8,
    "columns-promo": parse9
  };
  var PAGE_TEMPLATE = {
    name: "cash-flow",
    description: "Long-form QuickBooks editorial article about cash flow.",
    urls: ["https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/"],
    blocks: [
      { name: "hero-article", instances: ["[class*='QrcArticleHero_articleHero']", "[class*='QrcArticleHero_root']"] },
      { name: "callout-takeaways", instances: [".colored-box"] },
      { name: "callout-tip", instances: [".colored-box"] },
      { name: "table-financial", instances: [".vis-tables", ".datawrapper-script-embed"] },
      { name: "embed-video", instances: ["[class*='Video_videoContainer']", "[class*='Video_video']"] },
      { name: "cards-articles", instances: ["[class*='QrcContentCardGrid_threegrids']"] },
      { name: "cards-feature", instances: ["[class*='RwCardsContainer_container']"] },
      { name: "columns-author", instances: ["[class*='AuthorBio_authorBioContainer']"] },
      { name: "columns-promo", instances: ["[class*='Container_grey01']"] }
    ],
    sections: [
      { id: "0", name: "article-hero", selector: ["[class*='QrcArticleHero_articleHero']", "[class*='QrcArticleHero_root']"], style: null, blocks: ["hero-article"], defaultContent: [] },
      { id: "1", name: "key-takeaways", selector: [".colored-box"], style: "mint-green", blocks: ["callout-takeaways"], defaultContent: [] },
      { id: "2", name: "intro-and-definition", selector: [".core-block-container"], style: null, blocks: ["callout-tip"], defaultContent: [] },
      { id: "3", name: "types-of-cash-flow", selector: [".core-block-container"], style: null, blocks: ["callout-tip"], defaultContent: [] },
      { id: "4", name: "how-to-calculate", selector: [".core-block-container"], style: null, blocks: ["callout-tip"], defaultContent: [] },
      { id: "5", name: "cash-flow-example", selector: [".core-block-container"], style: null, blocks: [], defaultContent: [] },
      { id: "6", name: "cash-flow-statement", selector: [".core-block-container"], style: null, blocks: ["table-financial"], defaultContent: [] },
      { id: "7", name: "managing-cash-flow", selector: [".core-block-container"], style: null, blocks: ["embed-video", "callout-tip"], defaultContent: [] },
      { id: "8", name: "improving-cash-flow", selector: [".core-block-container"], style: null, blocks: ["embed-video"], defaultContent: [] },
      { id: "9", name: "faq-or-summary", selector: [".core-block-container"], style: null, blocks: [], defaultContent: [] },
      { id: "10", name: "author-bio", selector: ["[class*='AuthorBio_authorBioContainer']"], style: null, blocks: ["columns-author"], defaultContent: [] },
      { id: "11", name: "recommended-articles", selector: ["[class*='QrcContentCardGrid_threegrids']"], style: null, blocks: ["cards-articles"], defaultContent: [] },
      { id: "12", name: "product-features", selector: ["[class*='RwCardsContainer_container']"], style: "grey", blocks: ["cards-feature"], defaultContent: [] },
      { id: "13", name: "looking-for-something-else", selector: ["[class*='Container_grey01']"], style: "dark", blocks: ["columns-promo"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      const seen = /* @__PURE__ */ new Set();
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_cash_flow_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_cash_flow_exports);
})();
