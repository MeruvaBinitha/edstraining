import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards block:
 *  - Grid with 3 columns on desktop
 *  - Default view: image + blue footer (icon + title)
 *  - Hover/focus: centered overlay shows title + description; image dims; footer fades
 *
 * Authoring:
 *  Each row -> 2 cells
 *   - Cell 1: image (picture)
 *   - Cell 2: title (heading/bold) and description (paragraph)
 */
export default function decorate(block) {
  // 1) Convert block rows to <ul><li> structure
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    // Move all row cells into li
    while (row.firstElementChild) li.append(row.firstElementChild);

    // Mark cells
    [...li.children].forEach((div) => {
      const onlyPic = div.children.length === 1 && div.querySelector('picture');
      div.className = onlyPic ? 'cards-card-image' : 'cards-card-body';
    });

    ul.append(li);
  });

  // 2) Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimized);
  });

  // 3) Enhance bodies into: overlay (centered content) + blue footer
  ul.querySelectorAll('.cards-card-body').forEach((body) => {
    if (body.querySelector('.cards-footer')) return; // already enhanced

    // Extract title
    const headingEl = body.querySelector('h1, h2, h3, h4, h5, h6') || body.querySelector('strong, b');
    let titleText = headingEl ? headingEl.textContent.trim() : '';

    // Extract first paragraph as description
    const pEl = body.querySelector('p');
    const descText = pEl ? pEl.textContent.trim() : '';

    // Fallback title if missing
    if (!titleText && descText) {
      // take a short snippet from desc
      titleText = descText.split('.').shift() || 'Card Title';
    } else if (!titleText) {
      titleText = 'Card Title';
    }

    // Build overlay wrapper + centered content
    const overlay = document.createElement('div');
    overlay.className = 'cards-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const overlayContent = document.createElement('div');
    overlayContent.className = 'cards-overlay-content';
    overlayContent.innerHTML = `
      <h3>${titleText}</h3>
      ${descText ? `<p>${descText}</p>` : ''}
    `;
    overlay.append(overlayContent);

    // Build footer (icon + title)
    const footer = document.createElement('div');
    footer.className = 'cards-footer';
    footer.innerHTML = `
      <span class="icon" aria-hidden="true">
        <!-- Default inline SVG icon (replace as needed) -->
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" focusable="false" aria-hidden="true">
          <path d="M12 2l4 7-4 2-4-2 4-7zm-7 18h14v2H5v-2zm2-6h10v2H7v-2z"></path>
        </svg>
      </span>
      <span class="title">${titleText}</span>
    `;

    // Clear body and append in render order
    body.innerHTML = '';
    body.append(overlay, footer);
  });

  // 4) Replace block content
  block.replaceChildren(ul);

  // 5) Keyboard accessibility
  block.querySelectorAll('.cards > ul > li, ul > li').forEach((li) => {
    const hasFocusable = li.querySelector('a, button, input, select, textarea, [tabindex]');
    if (!hasFocusable) li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'group');
  });
}
``