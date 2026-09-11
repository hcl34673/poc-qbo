import { toClassName, loadScript } from '../../scripts/aem.js';

/**
 * tabs-deck — horizontal tab navigation switching content panels.
 *
 * Each panel is a two-part card: a photo with the heading/body/CTA overlaid on
 * a translucent white card, beside a product-UI Lottie animation (migrated from
 * the source). The Lottie player (vendored lottie_light) is lazy-loaded when the
 * block scrolls into view; each animation has a play/pause control.
 *
 * Content contract (DA table authoring): one row per tab; the row's first cell
 * is the tab label, the row's content is the panel (image + heading + body + link).
 */

// Lottie animations migrated from the source, in tab order.
const ANIMATIONS = [
  'ii-automation-V1',
  'ii-cashflow-V1',
  'ii-invoicing-V1',
];

let lottieReady = null;
function ensureLottie() {
  if (!lottieReady) {
    lottieReady = loadScript(`${window.hlx.codeBasePath}/blocks/tabs-deck/lottie.min.js`)
      .then(() => window.lottie);
  }
  return lottieReady;
}

export default async function decorate(block) {
  const tablist = document.createElement('div');
  tablist.className = 'tabs-deck-list';
  tablist.setAttribute('role', 'tablist');

  const animControllers = [];

  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);
    // Capture the label markup before we rebuild the panel (which clears cells).
    const labelHTML = tab.innerHTML;

    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-deck-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // Split the panel into a media layer (photo) + a text overlay card.
    const body = tabpanel.querySelector(':scope > div:last-child') || tabpanel;
    const media = document.createElement('div');
    media.className = 'tabs-deck-media';
    const content = document.createElement('div');
    content.className = 'tabs-deck-body';

    [...body.childNodes].forEach((node) => {
      const wrapsImage = node.nodeType === 1
        && node.querySelector && node.querySelector('picture, img')
        && node.textContent.trim() === '';
      if (wrapsImage) {
        media.append(node.querySelector('picture, img'));
      } else if (node.nodeType === 1 && (node.tagName === 'PICTURE' || node.tagName === 'IMG')) {
        media.append(node);
      } else {
        content.append(node);
      }
    });

    tabpanel.textContent = '';
    // The text card overlays the photo, so nest it inside the media column
    // (media is the positioning context) — this keeps the animation column clear.
    media.append(content);
    tabpanel.append(media);

    // Animation column (product-UI Lottie), when one is mapped for this tab.
    const animName = ANIMATIONS[i];
    if (animName) {
      const anim = document.createElement('div');
      anim.className = 'tabs-deck-anim';
      const stage = document.createElement('div');
      stage.className = 'tabs-deck-anim-stage';
      anim.append(stage);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'tabs-deck-anim-toggle';
      toggle.dataset.state = 'playing';
      toggle.setAttribute('aria-label', 'Pause animation');
      anim.append(toggle);

      tabpanel.append(anim);
      animControllers.push({
        stage, toggle, animName, player: null,
      });
    }

    const button = document.createElement('button');
    button.className = 'tabs-deck-tab';
    button.id = `tab-${id}`;
    button.innerHTML = labelHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);

  // Lazy-init the Lottie animations once the block scrolls into view.
  if (animControllers.length) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const initAnimations = async () => {
      const lottie = await ensureLottie();
      if (!lottie) return;
      animControllers.forEach((ctrl) => {
        ctrl.player = lottie.loadAnimation({
          container: ctrl.stage,
          renderer: 'svg',
          loop: true,
          autoplay: !reduceMotion,
          path: `${window.hlx.codeBasePath}/blocks/tabs-deck/animations/${ctrl.animName}.json`,
        });
        if (reduceMotion) {
          ctrl.toggle.dataset.state = 'paused';
          ctrl.toggle.setAttribute('aria-label', 'Play animation');
        }
        ctrl.toggle.addEventListener('click', () => {
          if (ctrl.toggle.dataset.state === 'playing') {
            ctrl.player.pause();
            ctrl.toggle.dataset.state = 'paused';
            ctrl.toggle.setAttribute('aria-label', 'Play animation');
          } else {
            ctrl.player.play();
            ctrl.toggle.dataset.state = 'playing';
            ctrl.toggle.setAttribute('aria-label', 'Pause animation');
          }
        });
      });
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        initAnimations();
      }
    }, { rootMargin: '200px' });
    observer.observe(block);
  }
}
