/* eslint-disable */
/* global WebImporter */
/**
 * Parser for video-poster. Base block: video.
 * Source: https://quickbooks.intuit.com/ (video.facade-teaser)
 * Content contract (blocks/video-poster/video-poster.js): the block reads a video
 * link via block.querySelector('a').href and an optional poster picture. The
 * source is a bare <video src="...mp4"> facade, so we emit a single cell holding
 * a link to the mp4 (plus a poster image if one is present as a poster attribute).
 */
export default function parse(element, { document }) {
  // The video source may be on the element itself or a child <source>.
  const video = element.matches('video') ? element : element.querySelector('video');
  let src = '';
  if (video) {
    src = video.getAttribute('src')
      || (video.querySelector('source') && video.querySelector('source').getAttribute('src'))
      || '';
  }
  if (!src) {
    const anchor = element.querySelector('a[href]');
    if (anchor) src = anchor.getAttribute('href');
  }

  if (!src) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];

  // Optional poster image.
  const poster = (video && video.getAttribute('poster')) || null;
  if (poster) {
    const img = document.createElement('img');
    img.src = poster;
    img.alt = '';
    contentCell.push(img);
  }

  // Link to the video (required by the block decorator).
  const a = document.createElement('a');
  a.href = src;
  a.textContent = src;
  contentCell.push(a);

  const cells = [[contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'video-poster', cells });
  element.replaceWith(block);
}
