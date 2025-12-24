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

export function getCustomerInfo({
  nameSelector = "#customerName",
  phoneSelector = "#customerPhone",
  emailSelector = "#customerEmail",
  memoSelector = "#customerMemo",
} = {}) {
  return {
    name: document.querySelector(nameSelector)?.value.trim() || "",
    phone: document.querySelector(phoneSelector)?.value.trim() || "",
    email: document.querySelector(emailSelector)?.value.trim() || "",
    memo: document.querySelector(memoSelector)?.value.trim() || "",
  };
}

export function validateCustomerInfo(customer) {
  if (!customer?.name || !customer?.phone || !customer?.email) {
    return "이름, 연락처, 이메일을 입력해주세요.";
  }
  return "";
}

export function isConsentChecked(selector = "#privacyConsent") {
  const el = document.querySelector(selector);
  return el ? el.checked : true;
}

export function updateSendButtonEnabled({
  buttonSelector = "#sendQuoteBtn",
  customer = getCustomerInfo(),
  hasItems = false,
  onFinalStep = false,
  hasConsent = isConsentChecked(),
  sending = false,
} = {}) {
  const btn = document.querySelector(buttonSelector);
  if (!btn) return;
  const hasRequired = Boolean(customer.name && customer.phone && customer.email);
  btn.disabled = !(hasRequired && hasItems && onFinalStep && hasConsent) || sending;
}

export function getEmailJSInstance(showInfoModal) {
  if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
    showInfoModal?.("EmailJS 설정(서비스ID/템플릿ID/publicKey)을 입력해주세요.");
    return null;
  }
  const emailjsInstance = typeof window !== "undefined" ? window.emailjs : null;
  if (!emailjsInstance) {
    showInfoModal?.("EmailJS 스크립트가 로드되지 않았습니다.");
    return null;
  }
  return emailjsInstance;
}

export function getTieredPrice({ tiers = [], width, length, customLabel = "상담 안내" } = {}) {
  const match = tiers.find(
    (tier) => width <= tier.maxWidth && length <= tier.maxLength
  );
  if (!match) {
    return { price: 0, isCustom: true, label: customLabel };
  }
  return { price: match.price, isCustom: false, label: "" };
}

export function formatTierLabel(tiers = [], customLabel = "상담 안내") {
  const tierText = tiers
    .map(
      (tier) =>
        `${tier.maxWidth}×${tier.maxLength} 이하 ${tier.price.toLocaleString()}원`
    )
    .join(" / ");
  return `${tierText} / ${customLabel}`;
}

export function updateSizeErrors({
  widthId,
  lengthId,
  length2Id,
  widthErrorId,
  lengthErrorId,
  length2ErrorId,
  widthMin,
  widthMax,
  lengthMin,
  lengthMax,
  length2Min,
  length2Max,
  enableLength2 = false,
} = {}) {
  const widthEl = widthId ? document.getElementById(widthId) : null;
  const lengthEl = lengthId ? document.getElementById(lengthId) : null;
  const length2El = length2Id ? document.getElementById(length2Id) : null;
  const widthErrEl = widthErrorId ? document.getElementById(widthErrorId) : null;
  const lengthErrEl = lengthErrorId ? document.getElementById(lengthErrorId) : null;
  const length2ErrEl = length2ErrorId ? document.getElementById(length2ErrorId) : null;

  const clearField = (el, errEl) => {
    if (errEl) {
      errEl.textContent = "";
      errEl.classList.remove("error");
    }
    el?.classList.remove("input-error");
  };

  clearField(widthEl, widthErrEl);
  clearField(lengthEl, lengthErrEl);
  clearField(length2El, length2ErrEl);

  let widthValid = true;
  let lengthValid = true;
  let length2Valid = true;

  if (widthEl?.value && Number.isFinite(widthMin) && Number.isFinite(widthMax)) {
    const widthVal = Number(widthEl.value);
    if (widthVal < widthMin || widthVal > widthMax) {
      widthValid = false;
      if (widthErrEl) {
        widthErrEl.textContent = `폭: ${widthMin}~${widthMax}mm 범위로 입력해주세요.`;
        widthErrEl.classList.add("error");
      }
      widthEl.classList.add("input-error");
    }
  }

  if (lengthEl?.value && Number.isFinite(lengthMin) && Number.isFinite(lengthMax)) {
    const lengthVal = Number(lengthEl.value);
    if (lengthVal < lengthMin || lengthVal > lengthMax) {
      lengthValid = false;
      if (lengthErrEl) {
        lengthErrEl.textContent = `길이: ${lengthMin}~${lengthMax}mm 범위로 입력해주세요.`;
        lengthErrEl.classList.add("error");
      }
      lengthEl.classList.add("input-error");
    }
  }

  if (enableLength2 && length2El?.value && Number.isFinite(length2Min) && Number.isFinite(length2Max)) {
    const length2Val = Number(length2El.value);
    if (length2Val < length2Min || length2Val > length2Max) {
      length2Valid = false;
      if (length2ErrEl) {
        length2ErrEl.textContent = `길이2: ${length2Min}~${length2Max}mm 범위로 입력해주세요.`;
        length2ErrEl.classList.add("error");
      }
      length2El.classList.add("input-error");
    }
  }

  return {
    widthValid,
    lengthValid,
    length2Valid,
    valid: widthValid && lengthValid && length2Valid,
  };
}
