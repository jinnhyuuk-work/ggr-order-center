export const VAT_RATE = 0.1; // 공통 VAT 비율

export const EMAILJS_CONFIG = {
  serviceId: "service_8iw3ovj",
  templateId: "template_iaid1xl",
  publicKey: "dUvt2iF9ciN8bvf6r",
};

export const PACKING_SETTINGS = {
  packingPricePerKg: 400,
  basePackingPrice: 2000,
};

export function formatPrice(value) {
  return Number(value || 0).toLocaleString();
}

export function calcPackingCost(totalWeightKg) {
  if (totalWeightKg === 0) return 0;
  const { packingPricePerKg, basePackingPrice } = PACKING_SETTINGS;
  const raw = totalWeightKg * packingPricePerKg;
  return Math.max(Math.round(raw), basePackingPrice);
}

export function calcShippingCost(totalWeightKg) {
  if (totalWeightKg === 0) return 0;

  if (totalWeightKg <= 10) return 4000;
  if (totalWeightKg <= 20) return 6000;
  if (totalWeightKg <= 30) return 8000;
  return 8000 + Math.ceil((totalWeightKg - 30) / 10) * 3000;
}

export function initEmailJS() {
  if (typeof window === "undefined") return;
  if (window.emailjs && EMAILJS_CONFIG.publicKey) {
    window.emailjs.init({
      publicKey: EMAILJS_CONFIG.publicKey,
    });
  }
}

function resolveElement(target) {
  if (!target || typeof document === "undefined") return null;
  return typeof target === "string" ? document.querySelector(target) : target;
}

function resetModalScroll(modal, bodySelector) {
  const body = bodySelector ? modal?.querySelector(bodySelector) : null;
  if (!body) return;
  body.scrollTop = 0;
  if (typeof body.scrollTo === "function") {
    body.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
  requestAnimationFrame(() => {
    body.scrollTop = 0;
  });
  setTimeout(() => {
    body.scrollTop = 0;
  }, 0);
}

export function openModal(modal, { focusTarget = null, bodySelector = ".modal-body", resetScroll = true } = {}) {
  if (typeof document === "undefined") return;
  document.activeElement?.blur();
  const modalEl = resolveElement(modal);
  modalEl?.classList.remove("hidden");
  const focusEl = resolveElement(focusTarget);
  focusEl?.focus();
  if (resetScroll) resetModalScroll(modalEl, bodySelector);
}

export function closeModal(modal, { bodySelector = ".modal-body", resetScroll = true } = {}) {
  if (typeof document === "undefined") return;
  document.activeElement?.blur();
  const modalEl = resolveElement(modal);
  if (resetScroll) resetModalScroll(modalEl, bodySelector);
  modalEl?.classList.add("hidden");
}
