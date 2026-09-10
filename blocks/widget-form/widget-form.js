/**
 * widget-form — "Tell us about your business" personalization form.
 *
 * A self-contained interactive block. Content contract (DA table authoring):
 *   Row 1: heading / prompt ("What are your business needs?")
 *   Row 2: a list of selectable "need" chips (authored as a bulleted list)
 *   Row 3 (optional): a second prompt + a list of radio options
 *   Last row: the submit/continue button (authored as a link/button)
 *
 * The block turns the authored lists into toggleable chips and radio groups and
 * degrades gracefully when optional rows are omitted.
 */
export default function decorate(block) {
  const rows = [...block.children];

  const form = document.createElement('form');
  form.className = 'widget-form-form';
  form.addEventListener('submit', (e) => e.preventDefault());

  let chipGroupIndex = 0;

  rows.forEach((row) => {
    const cell = row.children.length > 1 ? row : row.firstElementChild || row;
    const list = cell.querySelector('ul, ol');

    if (list) {
      const isRadio = list.tagName === 'OL';
      const group = document.createElement('div');
      group.className = isRadio ? 'widget-form-radios' : 'widget-form-chips';
      const groupName = `widget-form-group-${chipGroupIndex}`;
      chipGroupIndex += 1;

      [...list.children].forEach((li, i) => {
        const id = `${groupName}-${i}`;
        const labelEl = document.createElement('label');
        labelEl.className = isRadio ? 'widget-form-radio' : 'widget-form-chip';
        labelEl.setAttribute('for', id);

        const input = document.createElement('input');
        input.type = isRadio ? 'radio' : 'checkbox';
        input.id = id;
        input.name = isRadio ? groupName : id;

        const span = document.createElement('span');
        span.append(...li.childNodes);

        labelEl.append(input, span);
        group.append(labelEl);
      });
      form.append(group);
      return;
    }

    // Non-list rows: headings, prompts, and the submit button pass through.
    const wrap = document.createElement('div');
    wrap.className = 'widget-form-text';
    wrap.append(...cell.childNodes);
    form.append(wrap);
  });

  block.replaceChildren(form);
}
