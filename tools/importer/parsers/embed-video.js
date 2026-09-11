/* eslint-disable */
/* global WebImporter */
/**
 * Parser for embed-video. Base: embed (custom local block).
 * Source: https://quickbooks.intuit.com/r/cash-flow/what-is-cash-flow/
 * Generated: 2026-09-09
 *
 * Block contract: single column. The poster image goes above the video URL in
 * one cell (matches the Embed (video) library convention). The local
 * decorate() (blocks/embed-video/embed-video.js) queries the whole block for
 * `a[href]` and `picture`, so this single-cell layout satisfies it too.
 *
 * Source is a Next.js `Video_videoContainer` with a `Video_videoThumbnail`
 * poster picture and a play-button overlay (a data-URI SVG `img`, excluded).
 * The YouTube URL is injected client-side, so extract it defensively:
 * an `<a href>`, else a YouTube `<iframe src>`, else a data-* video attribute.
 * The poster is always preserved even when no URL is present in the snapshot.
 */
function toWatchUrl(raw) {
  try {
    const u = new URL(raw, 'https://quickbooks.intuit.com');
    if (/youtube\.com|youtu\.be/.test(u.hostname)) {
      const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    return u.href;
  } catch (e) {
    return raw;
  }
}

export default function parse(element, { document }) {
  // Poster picture (exclude the bare play-button SVG img, which is not in a <picture>).
  const picture = element.querySelector('picture');

  // Video URL, defensively.
  const anchor = element.querySelector('a[href]');
  const iframe = element.querySelector('iframe[src*="youtube"], iframe[src*="youtu.be"], iframe[src]');
  const dataAttrEl = element.querySelector(
    '[data-video-url], [data-video-id], [data-youtube-id], [data-src*="youtu"]',
  );

  let href = null;
  if (anchor) {
    href = anchor.getAttribute('href');
  } else if (iframe) {
    href = iframe.getAttribute('src');
  } else if (dataAttrEl) {
    const id = dataAttrEl.getAttribute('data-video-id')
      || dataAttrEl.getAttribute('data-youtube-id');
    href = id
      ? `https://www.youtube.com/watch?v=${id}`
      : dataAttrEl.getAttribute('data-video-url') || dataAttrEl.getAttribute('data-src');
  }

  if (!href && !picture) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single cell: poster image above the video link.
  const contentCell = [];
  if (picture) contentCell.push(picture);
  if (href) {
    const link = document.createElement('a');
    link.href = toWatchUrl(href);
    link.textContent = link.href;
    contentCell.push(link);
  }

  const cells = [[contentCell]]; // one row, one cell holding poster + link

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-video', cells });
  element.replaceWith(block);
}
