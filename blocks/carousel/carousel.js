/**
 * =========================================================
 * CAROUSEL (hero-style)
 * - Accessible, no external dependencies
 * - Scroll-snap track + JS-controlled scrollTo
 * - Active slide state updates aria/indicators
 * - Dots + Prev/Next + keyboard focus management
 * =========================================================
 *
 * Expected HTML (before decoration):
 * <div class="carousel">
 *   <div>  <!-- row => slide 0 -->
 *     <div>  <!-- image column -->
 *       <div class="carousel-slide-image">
 *         <picture>
 *           <img src="/path/slide-1.jpg" alt="">
 *         </picture>
 *       </div>
 *     </div>
 *     <div>  <!-- content column -->
 *       <div class="carousel-slide-content" data-align="left">
 *         <h6 class="eyebrow">Welcome to visit site</h6>
 *         <h1>Best Solar Panel<br>to serve you!</h1>
 *         <p>Your journey begins with the right guidance...</p>
 *         <a class="button">Quick Service</a>
 *       </div>
 *     </div>
 *   </div>
 *   <!-- repeat more rows for more slides -->
 * </div>
 */

import { fetchPlaceholders } from '../../scripts/placeholders.js';

/** Update ARIA + indicators for a newly visible slide */
function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  // Manage aria-hidden and tab focus for links in non-active slides
  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a, button, [tabindex]').forEach((el) => {
      if (idx !== slideIndex) {
        // avoid trapping keyboard focus in non-active slides
        el.setAttribute('tabindex', '-1');
      } else {
        el.removeAttribute('tabindex');
      }
    });
  });

  // Update indicator buttons
  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    } else {
      button.setAttribute('disabled', true);
      button.setAttribute('aria-current', 'true');
    }
  });
}

/** Scroll to a particular slide index (wraps around edges) */
function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  const total = slides.length;

  if (!total) return;

  let target = slideIndex;
  if (target < 0) target = total - 1;
  if (target >= total) target = 0;

  const activeSlide = slides[target];

  // Ensure interactive elements are tabbable in the new slide
  activeSlide.querySelectorAll('a, button, [tabindex]').forEach((el) => {
    el.removeAttribute('tabindex');
  });

  const track = block.querySelector('.carousel-slides');
  track.scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

/** Wire click handlers and observe intersection to set active slide */
function bindEvents(block) {
  const indicatorsWrap = block.querySelector('.carousel-slide-indicators');
  if (indicatorsWrap) {
    indicatorsWrap.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const li = e.currentTarget.parentElement;
        showSlide(block, parseInt(li.dataset.targetSlide, 10));
      });
    });
  }

  const prevBtn = block.querySelector('.slide-prev');
  const nextBtn = block.querySelector('.slide-next');
  if (prevBtn) prevBtn.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1));

  // IntersectionObserver to update active state when a slide is centered enough
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });

  block.querySelectorAll('.carousel-slide').forEach((slide) => slideObserver.observe(slide));

  // Optional: keyboard left/right support when the carousel region is focused
  block.addEventListener('keydown', (e) => {
    const key = e.key || e.code;
    if (key === 'ArrowLeft') {
      e.preventDefault();
      showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
    }
  });
}

/** Create a slide (LI) from an initial row (two columns: image then content) */
function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  // Move the original row’s two columns into the slide
  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  // Accessibility: label slide by any heading within the content column
  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    if (!labeledBy.id) labeledBy.id = `carousel-${carouselId}-heading-${slideIndex}`;
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  // Ensure interactive elements in non-active slides are not focusable by default
  slide.setAttribute('aria-hidden', slideIndex !== 0);

  return slide;
}

let carouselId = 0;

/**
 * decorate(block)
 * Transforms a simple HTML structure into an accessible, controllable carousel.
 */
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);

  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders?.().catch(() => ({})) || {};

  // Region & ARIA labelling
  block.setAttribute('role', 'region');
  block.setAttribute('tabindex', '0'); // enables keyboard events on the region
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');

  // Build indicators + nav only if multiple slides exist
  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');

    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;
    container.append(slideNavButtons);
  }

  // Convert each row into a slide
  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `
        <button type="button"
          aria-label="${(placeholders.showSlide || 'Show Slide')} ${idx + 1} ${(placeholders.of || 'of')} ${rows.length}">
        </button>`;
      slideIndicators.append(indicator);
    }

    // Remove original row wrapper after moving children
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  // Set initial active slide to index 0
  block.dataset.activeSlide = 0;

  if (!isSingleSlide) {
    bindEvents(block);
  }

  // Ensure the first slide is in view on load (in case the page renders scrolled)
  requestAnimationFrame(() => showSlide(block, 0));
}
