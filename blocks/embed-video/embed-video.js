/**
 * embed-video — an embedded video (typically YouTube) with a poster image and
 * a lazy iframe that loads on click.
 *
 * Authored (DA) as a block whose first link is the video URL; an optional
 * image cell provides the poster. Authors may omit the poster.
 *
 * Options (CSS class tokens on the block):
 *   - `vertical` — portrait/vertical aspect ratio (e.g. Shorts) instead of 16:9;
 *     handled purely in CSS via the `.embed-video.vertical` selector.
 */
function embedYoutube(url) {
  const id = url.searchParams.get('v')
    || url.pathname.split('/').pop();
  const src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  const wrapper = document.createElement('div');
  wrapper.className = 'embed-video-frame';
  wrapper.innerHTML = `<iframe src="${src}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Embedded video" loading="lazy"></iframe>`;
  return wrapper;
}

export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const picture = block.querySelector('picture');
  const url = link ? new URL(link.href) : null;

  const container = document.createElement('div');
  container.className = 'embed-video-placeholder';

  if (picture) {
    container.append(picture);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'embed-video-play';
  button.setAttribute('aria-label', link?.textContent?.trim() || 'Play video');
  container.append(button);

  block.replaceChildren(container);

  const load = () => {
    if (!url) return;
    container.replaceWith(embedYoutube(url));
  };
  button.addEventListener('click', load);
}
