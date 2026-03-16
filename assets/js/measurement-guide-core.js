const DEFAULT_MODAL_SELECTOR = "#measurementGuideModal";
const DEFAULT_TITLE_SELECTOR = "#measurementGuideModalTitle";
const DEFAULT_BODY_SELECTOR = "#measurementGuideModalBody";

function defaultEscapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeMeasurementGuideImages(guide) {
  const rawImages = Array.isArray(guide?.images)
    ? guide.images
    : guide?.image?.src
      ? [guide.image]
      : [];
  return rawImages
    .filter((image) => image && image.src)
    .map((image, index) => ({
      src: String(image.src),
      alt: String(image.alt || `${guide?.title || "측정 가이드"} ${index + 1}`),
    }));
}

function normalizeMeasurementGuideSections(guide) {
  const rawSections = Array.isArray(guide?.sections) ? guide.sections : [];
  return rawSections.map((section, index) => ({
    title: String(section?.title || `${index + 1}. 안내`),
    items: Array.isArray(section?.items)
      ? section.items.map((item) => String(item || "")).filter(Boolean)
      : [],
  }));
}

function resolveMeasurementGuideStepItem(list, index) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const safeIndex = Math.max(0, Math.min(list.length - 1, Number(index) || 0));
  return list[safeIndex];
}

function buildMeasurementGuideStepItemsHtml(section, escapeHtml) {
  const items = Array.isArray(section?.items) ? section.items.slice(0, 3) : [];
  if (!items.length) return "";
  const listItems = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<ul class="measurement-guide-step-list">${listItems}</ul>`;
}

function buildMeasurementGuideStepsHtml(sections = [], stepCount = 0, escapeHtml = defaultEscapeHtml) {
  if (!sections.length) return "";
  const totalSteps = Math.max(1, Number(stepCount) || sections.length);
  const steps = Array.from({ length: totalSteps }, (_, index) => {
    const section = resolveMeasurementGuideStepItem(sections, index);
    const isActive = index === 0;
    return `
      <section
        class="measurement-guide-step${isActive ? " is-active" : ""}"
        data-measurement-step
        data-step-index="${index}"
        aria-hidden="${isActive ? "false" : "true"}"
      >
        <h4 class="measurement-guide-step-title">${escapeHtml(section?.title || `${index + 1}. 안내`)}</h4>
        ${buildMeasurementGuideStepItemsHtml(section, escapeHtml)}
      </section>
    `;
  }).join("");
  return `<div class="measurement-guide-steps">${steps}</div>`;
}

function buildMeasurementGuideMediaHtml(
  images = [],
  stepSections = "",
  stepCount = 0,
  escapeHtml = defaultEscapeHtml
) {
  const totalSlides = Math.max(1, Number(stepCount) || images.length || 1);
  const hasImages = images.length > 0;
  const slides = Array.from({ length: totalSlides }, (_, index) => {
    const image = resolveMeasurementGuideStepItem(images, index);
    const isActive = index === 0;
    const mediaNode =
      hasImages && image?.src
        ? `
          <img
            class="measurement-guide-media-image"
            src="${escapeHtml(image.src)}"
            alt="${escapeHtml(image?.alt || `측정 가이드 ${index + 1}`)}"
            loading="lazy"
            decoding="async"
          />
        `
        : `<div class="measurement-guide-media-placeholder">측정 이미지 영역</div>`;
    return `
      <figure
        class="measurement-guide-slide${isActive ? " is-active" : ""}"
        data-measurement-slide
        data-slide-index="${index}"
        aria-hidden="${isActive ? "false" : "true"}"
      >
        ${mediaNode}
      </figure>
    `;
  }).join("");
  const controls =
    totalSlides > 1
      ? `
        <div class="measurement-guide-carousel-controls">
          <button type="button" class="measurement-guide-carousel-btn" data-measurement-carousel-prev aria-label="이전 이미지">
            &lt;
          </button>
          <button type="button" class="measurement-guide-carousel-btn" data-measurement-carousel-next aria-label="다음 이미지">
            &gt;
          </button>
        </div>
        <div class="measurement-guide-carousel-status">
          <div class="measurement-guide-carousel-dots" role="tablist" aria-label="측정 가이드 이미지 선택">
            ${Array.from({ length: totalSlides }, (_, index) => {
              const isActive = index === 0;
              return `
                <button
                  type="button"
                  class="measurement-guide-carousel-dot${isActive ? " is-active" : ""}"
                  data-measurement-carousel-dot
                  data-slide-to="${index}"
                  aria-label="${index + 1}번 이미지"
                  aria-pressed="${isActive ? "true" : "false"}"
                >
                  ${index + 1}
                </button>
              `;
            }).join("")}
          </div>
          <span class="measurement-guide-carousel-counter" data-measurement-carousel-counter aria-live="polite">
            1 / ${totalSlides}
          </span>
        </div>
      `
      : "";
  return `
    <figure class="measurement-guide-media" aria-label="측정 이미지 캐러셀" data-measurement-guide-root>
      <div class="measurement-guide-carousel" data-measurement-carousel data-current-index="0" data-total-slides="${totalSlides}">
        <div class="measurement-guide-slide-frame">
          <div class="measurement-guide-carousel-slides">
            ${slides}
          </div>
          ${controls}
        </div>
        ${stepSections}
      </div>
    </figure>
  `;
}

function setMeasurementGuideCarouselIndex(carouselEl, nextIndex) {
  if (!carouselEl) return;
  const slides = Array.from(carouselEl.querySelectorAll("[data-measurement-slide]"));
  const total = slides.length;
  if (!total) return;
  const normalizedIndex = ((Number(nextIndex) % total) + total) % total;
  carouselEl.dataset.currentIndex = String(normalizedIndex);
  slides.forEach((slideEl, index) => {
    const isActive = index === normalizedIndex;
    slideEl.classList.toggle("is-active", isActive);
    slideEl.setAttribute("aria-hidden", isActive ? "false" : "true");
  });
  const counterEl = carouselEl.querySelector("[data-measurement-carousel-counter]");
  if (counterEl) {
    counterEl.textContent = `${normalizedIndex + 1} / ${total}`;
  }
  carouselEl.querySelectorAll("[data-measurement-carousel-dot]").forEach((dotEl, index) => {
    const isActive = index === normalizedIndex;
    dotEl.classList.toggle("is-active", isActive);
    dotEl.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
  const stepRoot = carouselEl.closest("[data-measurement-guide-root]");
  if (stepRoot) {
    stepRoot.querySelectorAll("[data-measurement-step]").forEach((stepEl, index) => {
      const isActive = index === normalizedIndex;
      stepEl.classList.toggle("is-active", isActive);
      stepEl.setAttribute("aria-hidden", isActive ? "false" : "true");
    });
  }
}

function moveMeasurementGuideCarousel(carouselEl, delta) {
  const currentIndex = Number(carouselEl?.dataset?.currentIndex || 0);
  setMeasurementGuideCarouselIndex(carouselEl, currentIndex + Number(delta || 0));
}

function handleMeasurementGuideCarouselClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const prevBtn = target.closest("[data-measurement-carousel-prev]");
  if (prevBtn) {
    moveMeasurementGuideCarousel(prevBtn.closest("[data-measurement-carousel]"), -1);
    return;
  }
  const nextBtn = target.closest("[data-measurement-carousel-next]");
  if (nextBtn) {
    moveMeasurementGuideCarousel(nextBtn.closest("[data-measurement-carousel]"), 1);
    return;
  }
  const dotBtn = target.closest("[data-measurement-carousel-dot]");
  if (dotBtn) {
    const nextIndex = Number(dotBtn.dataset.slideTo || 0);
    setMeasurementGuideCarouselIndex(dotBtn.closest("[data-measurement-carousel]"), nextIndex);
  }
}

function buildMeasurementGuideBodyHtml(guide, escapeHtml = defaultEscapeHtml) {
  const intro = guide?.intro
    ? `<p class="measurement-guide-intro">${escapeHtml(guide.intro)}</p>`
    : "";
  const images = normalizeMeasurementGuideImages(guide);
  const sections = normalizeMeasurementGuideSections(guide);
  const stepCount = images.length > 0 ? images.length : Math.max(1, sections.length);
  const stepSections = buildMeasurementGuideStepsHtml(sections, stepCount, escapeHtml);
  const media = buildMeasurementGuideMediaHtml(images, stepSections, stepCount, escapeHtml);
  return `${intro}${media}`;
}

export function createMeasurementGuideModalController({
  guides = {},
  openModal,
  closeModal,
  escapeHtml = defaultEscapeHtml,
  modalSelector = DEFAULT_MODAL_SELECTOR,
  titleSelector = DEFAULT_TITLE_SELECTOR,
  bodySelector = DEFAULT_BODY_SELECTOR,
} = {}) {
  const guideMap = guides && typeof guides === "object" ? guides : {};

  function open(guideKey) {
    const guide = guideMap[String(guideKey || "")];
    if (!guide) return;
    const titleEl = document.querySelector(titleSelector);
    const bodyEl = document.querySelector(bodySelector);
    if (titleEl) titleEl.textContent = guide.title || "측정 가이드";
    if (bodyEl) {
      bodyEl.innerHTML = buildMeasurementGuideBodyHtml(guide, escapeHtml);
      bodyEl
        .querySelectorAll("[data-measurement-carousel]")
        .forEach((carouselEl) => setMeasurementGuideCarouselIndex(carouselEl, 0));
    }
    if (typeof openModal === "function") {
      openModal(modalSelector, { focusTarget: titleSelector });
    }
  }

  function close() {
    if (typeof closeModal === "function") {
      closeModal(modalSelector);
    }
  }

  return {
    open,
    close,
    handleBodyClick: handleMeasurementGuideCarouselClick,
  };
}
