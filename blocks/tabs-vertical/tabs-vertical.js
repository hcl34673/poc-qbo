import { toClassName } from '../../scripts/aem.js';

/**
 * tabs-vertical — vertical list of category labels on one side switching a
 * detail panel (heading + paragraph + image + CTA) on the other.
 *
 * Content contract (DA table authoring): one row per category; the row's first
 * cell is the label, the row's content is the detail panel.
 */
export default async function decorate(block) {
  const tablist = document.createElement('div');
  tablist.className = 'tabs-vertical-list';
  tablist.setAttribute('role', 'tablist');

  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);
    // Capture the label markup before we rebuild the panel (which clears cells).
    const labelHTML = tab.innerHTML;

    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-vertical-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // Split the panel body into a text column (heading + list + CTA) and an
    // image column, so each tab renders as two columns like the live site.
    // The panel's content cell is the last cell of the row (the tab label is
    // the first cell).
    const body = tabpanel.querySelector(':scope > div:last-child') || tabpanel;
    const media = body.querySelector('picture, img');
    const textCol = document.createElement('div');
    textCol.className = 'tabs-vertical-text';
    const mediaCol = document.createElement('div');
    mediaCol.className = 'tabs-vertical-media';

    [...body.childNodes].forEach((node) => {
      // A paragraph that only wraps the picture goes to the media column.
      const isMediaWrap = node.nodeType === 1
        && node.querySelector && node.querySelector('picture, img')
        && node.textContent.trim() === '';
      if (isMediaWrap || node === media) {
        mediaCol.append(node);
      } else {
        textCol.append(node);
      }
    });

    tabpanel.textContent = '';
    tabpanel.append(textCol);
    if (mediaCol.childNodes.length) tabpanel.append(mediaCol);

    const button = document.createElement('button');
    button.className = 'tabs-vertical-tab';
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
}
