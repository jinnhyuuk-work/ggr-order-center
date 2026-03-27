const DEFAULT_EMAILJS_CONFIG = Object.freeze({
  serviceId: "service_8iw3ovj",
  templateId: "template_iaid1xl",
  publicKey: "dUvt2iF9ciN8bvf6r",
});

const DEFAULT_CLOUDINARY_CONFIG = Object.freeze({
  enabled: true,
  cloudName: "dpw2svbf6",
  uploadPreset: "ggr_order_center",
  folder: "ggr-order-center/system-preview",
});

const DEFAULT_FRONTEND_SECURITY_CONFIG = Object.freeze({
  enforceAllowedHosts: true,
  allowedHosts: Object.freeze(["order-center.ggr.kr", "ggr.kr", "localhost", "127.0.0.1"]),
  allowedHostSuffixes: Object.freeze([".ggr.kr"]),
});

function readRuntimeOrderCenterConfig() {
  if (typeof window === "undefined") return {};
  const cfg = window.__ORDER_CENTER_CONFIG__;
  return cfg && typeof cfg === "object" ? cfg : {};
}

function readRuntimeOrderCenterSection(key) {
  const cfg = readRuntimeOrderCenterConfig();
  const section = cfg?.[key];
  return section && typeof section === "object" ? section : {};
}

function normalizeHostList(values = []) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
}

function getRuntimeSecurityConfig() {
  const runtime = readRuntimeOrderCenterSection("security");
  const enforceAllowedHosts =
    typeof runtime.enforceAllowedHosts === "boolean"
      ? runtime.enforceAllowedHosts
      : DEFAULT_FRONTEND_SECURITY_CONFIG.enforceAllowedHosts;

  const allowedHostsRuntime = normalizeHostList(runtime.allowedHosts);
  const allowedHostSuffixesRuntime = normalizeHostList(runtime.allowedHostSuffixes);

  return {
    enforceAllowedHosts,
    allowedHosts: allowedHostsRuntime.length
      ? allowedHostsRuntime
      : [...DEFAULT_FRONTEND_SECURITY_CONFIG.allowedHosts],
    allowedHostSuffixes: allowedHostSuffixesRuntime.length
      ? allowedHostSuffixesRuntime
      : [...DEFAULT_FRONTEND_SECURITY_CONFIG.allowedHostSuffixes],
  };
}

function resolveCurrentHostname() {
  if (typeof window === "undefined") return "";
  return String(window.location?.hostname || "").trim().toLowerCase();
}

function isAllowedHostByPolicy(hostname = "", { allowedHosts = [], allowedHostSuffixes = [] } = {}) {
  if (!hostname) return false;
  if (allowedHosts.includes(hostname)) return true;
  return allowedHostSuffixes.some((suffix) => {
    if (!suffix) return false;
    const normalizedSuffix = String(suffix).toLowerCase();
    if (!normalizedSuffix) return false;
    if (!normalizedSuffix.startsWith(".")) {
      return hostname === normalizedSuffix || hostname.endsWith(`.${normalizedSuffix}`);
    }
    const suffixWithoutDot = normalizedSuffix.slice(1);
    return hostname === suffixWithoutDot || hostname.endsWith(normalizedSuffix);
  });
}

export function isAllowedRuntimeHost() {
  const policy = getRuntimeSecurityConfig();
  if (!policy.enforceAllowedHosts) return true;
  const hostname = resolveCurrentHostname();
  return isAllowedHostByPolicy(hostname, policy);
}

export function getRuntimeHostBlockedReason() {
  if (isAllowedRuntimeHost()) return "";
  const hostname = resolveCurrentHostname();
  if (hostname) {
    return `허용되지 않은 접속 도메인(${hostname})에서는 주문 전송/이미지 업로드가 차단됩니다.`;
  }
  return "현재 접속 환경에서는 주문 전송/이미지 업로드가 차단됩니다.";
}

const runtimeEmailConfig = readRuntimeOrderCenterSection("emailjs");
const runtimeCloudinaryConfig = readRuntimeOrderCenterSection("cloudinary");

export const EMAILJS_CONFIG = {
  serviceId: String(runtimeEmailConfig.serviceId || DEFAULT_EMAILJS_CONFIG.serviceId).trim(),
  templateId: String(runtimeEmailConfig.templateId || DEFAULT_EMAILJS_CONFIG.templateId).trim(),
  publicKey: String(runtimeEmailConfig.publicKey || DEFAULT_EMAILJS_CONFIG.publicKey).trim(),
};

export const CLOUDINARY_CONFIG = {
  enabled:
    typeof runtimeCloudinaryConfig.enabled === "boolean"
      ? runtimeCloudinaryConfig.enabled
      : DEFAULT_CLOUDINARY_CONFIG.enabled,
  cloudName: String(runtimeCloudinaryConfig.cloudName || DEFAULT_CLOUDINARY_CONFIG.cloudName).trim(),
  uploadPreset: String(
    runtimeCloudinaryConfig.uploadPreset || DEFAULT_CLOUDINARY_CONFIG.uploadPreset
  ).trim(),
  folder: String(runtimeCloudinaryConfig.folder || DEFAULT_CLOUDINARY_CONFIG.folder).trim(),
};

export const ORDER_PAYLOAD_SCHEMA_VERSION = "v2";
export const CONSULT_DISPLAY_PRICE_LABEL = "상담안내";
export const CONSULT_EXCLUDED_SUFFIX = "(상담 필요 항목 미포함)";
export const SERVICE_REGION_LABELS = Object.freeze({
  seoul: "서울특별시",
  gyeonggi: "경기도",
  incheon: "인천광역시",
  other: "수도권 외",
});
export const UI_COLOR_FALLBACKS = Object.freeze({
  swatch: "#ddd",
  swatchMuted: "#eee",
});
export const SERVICE_STEP_VALIDATION_MESSAGES = Object.freeze({
  addressRequired: "서비스 진행을 위해 주소를 입력해주세요.",
  fulfillmentRequired: "배송 또는 시공 서비스를 선택해주세요.",
});

const MODAL_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

let activeModalState = null;
let modalKeyHandlerBound = false;
let autoModalTitleIdSeq = 0;
let embeddedViewportClassBound = false;
const COMPACT_MOBILE_VIEWPORT_MAX_HEIGHT = 920;
const ESTIMATE_DETAIL_OPEN_STATE = new Map();
const CUSTOMER_PHOTO_MAX_COUNT = 5;
const CUSTOMER_PHOTO_MAX_FILE_SIZE_MB = 10;
const CUSTOMER_PHOTO_MAX_DIMENSION_PX = 2000;
const CUSTOMER_PHOTO_JPEG_QUALITY = 0.86;
const CUSTOMER_PHOTO_UPLOAD_TIMEOUT_MS = 20000;

export function formatPrice(value) {
  return Number(value || 0).toLocaleString();
}

export function resolveServiceRegionByAddress(address = "") {
  const text = String(address || "").trim();
  if (!text) {
    return { key: "", label: "주소 미입력", isSupported: false };
  }
  if (/(^|\s)(서울특별시|서울시|서울)(\s|$)/.test(text)) {
    return { key: "seoul", label: SERVICE_REGION_LABELS.seoul, isSupported: true };
  }
  if (/(^|\s)(경기도|경기)(\s|$)/.test(text)) {
    return { key: "gyeonggi", label: SERVICE_REGION_LABELS.gyeonggi, isSupported: true };
  }
  if (/(^|\s)(인천광역시|인천시|인천)(\s|$)/.test(text)) {
    return { key: "incheon", label: SERVICE_REGION_LABELS.incheon, isSupported: true };
  }
  return { key: "other", label: SERVICE_REGION_LABELS.other, isSupported: false };
}

export function validateServiceStepSelection({
  customer = {},
  fulfillmentType = "",
  isAddressReady,
  messages = SERVICE_STEP_VALIDATION_MESSAGES,
} = {}) {
  const checker =
    typeof isAddressReady === "function"
      ? isAddressReady
      : (value) => Boolean(value?.postcode && value?.address);
  const safeMessages = messages || SERVICE_STEP_VALIDATION_MESSAGES;
  if (!checker(customer)) {
    return String(safeMessages.addressRequired || "").trim() || SERVICE_STEP_VALIDATION_MESSAGES.addressRequired;
  }
  if (!fulfillmentType) {
    return (
      String(safeMessages.fulfillmentRequired || "").trim() ||
      SERVICE_STEP_VALIDATION_MESSAGES.fulfillmentRequired
    );
  }
  return "";
}

function normalizeCustomerPayload(customer = {}) {
  return {
    name: String(customer?.name || "").trim(),
    phone: String(customer?.phone || "").trim(),
    email: String(customer?.email || "").trim(),
    postcode: String(customer?.postcode || "").trim(),
    address: String(customer?.address || "").trim(),
    detailAddress: String(customer?.detailAddress || "").trim(),
    memo: String(customer?.memo || "").trim(),
  };
}

export function buildCustomerAddressLine(customer = {}) {
  const normalized = normalizeCustomerPayload(customer);
  return `${normalized.postcode || "-"} ${normalized.address || ""} ${normalized.detailAddress || ""}`.trim();
}

function normalizeCustomerPhotoPayload(customerPhotoUploads = []) {
  return (Array.isArray(customerPhotoUploads) ? customerPhotoUploads : []).map((photo) => ({
    name: String(photo?.originalName || "").trim(),
    url: String(photo?.secureUrl || "").trim(),
    publicId: String(photo?.publicId || "").trim(),
  }));
}

function formatCustomerPhotoUploadErrors(customerPhotoErrors = []) {
  return (Array.isArray(customerPhotoErrors) ? customerPhotoErrors : [])
    .map((error) => {
      const name = String(error?.name || "파일").trim() || "파일";
      const reason = String(error?.reason || "업로드 실패").trim() || "업로드 실패";
      return `${name}(${reason})`;
    })
    .join(" / ");
}

export function buildCustomerEmailSectionLines({
  customer = {},
  customerPhotoUploads = [],
  customerPhotoErrors = [],
} = {}) {
  const normalizedCustomer = normalizeCustomerPayload(customer);
  const uploadedPhotos = Array.isArray(customerPhotoUploads) ? customerPhotoUploads : [];
  const uploadErrors = Array.isArray(customerPhotoErrors) ? customerPhotoErrors : [];

  const lines = [];
  lines.push("=== 고객 정보 ===");
  lines.push(`이름: ${normalizedCustomer.name || "-"}`);
  lines.push(`연락처: ${normalizedCustomer.phone || "-"}`);
  lines.push(`이메일: ${normalizedCustomer.email || "-"}`);
  lines.push(`주소: ${buildCustomerAddressLine(normalizedCustomer)}`);
  lines.push(`요청사항: ${normalizedCustomer.memo || "-"}`);
  if (uploadedPhotos.length || uploadErrors.length) {
    lines.push("");
    lines.push("=== 공간/가구 사진 ===");
    if (uploadedPhotos.length) {
      uploadedPhotos.forEach((photo, index) => {
        lines.push(`${index + 1}) ${photo?.originalName || `사진 ${index + 1}`}`);
        lines.push(`- ${photo?.secureUrl || "-"}`);
      });
    }
    if (uploadErrors.length) {
      lines.push(`업로드 실패: ${formatCustomerPhotoUploadErrors(uploadErrors)}`);
    }
  }
  return lines;
}

export function buildOrderPayloadBase({
  pageKey = "",
  customer = {},
  summary = {},
  customerPhotoUploads = [],
} = {}) {
  const normalizedCustomer = normalizeCustomerPayload(customer);
  const fulfillment = summary?.fulfillment && typeof summary.fulfillment === "object" ? summary.fulfillment : {};
  const hasCustomPrice = Boolean(summary?.hasConsult);

  return {
    schemaVersion: ORDER_PAYLOAD_SCHEMA_VERSION,
    pageKey: String(pageKey || "").trim(),
    createdAt: new Date().toISOString(),
    customer: normalizedCustomer,
    customerPhotos: normalizeCustomerPhotoPayload(customerPhotoUploads),
    totals: {
      grandTotal: Number(summary?.grandTotal || 0),
      subtotal: Number(summary?.subtotal || 0),
      fulfillmentType: String(fulfillment?.type || "").trim(),
      fulfillmentRegion: String(fulfillment?.region?.label || "").trim(),
      fulfillmentCost: Number(summary?.fulfillmentCost || 0),
      fulfillmentConsult: Boolean(fulfillment?.isConsult),
      hasCustomPrice,
      displayPriceLabel: hasCustomPrice ? `${CONSULT_DISPLAY_PRICE_LABEL}${CONSULT_EXCLUDED_SUFFIX}` : null,
    },
  };
}

function buildCustomerPhotoUploadUrlsText(customerPhotoUploads = []) {
  return (Array.isArray(customerPhotoUploads) ? customerPhotoUploads : [])
    .map((photo) => String(photo?.secureUrl || "").trim())
    .filter(Boolean)
    .join("\n");
}

function formatCustomerPhotoUploadErrorsForTemplate(customerPhotoErrors = []) {
  return (Array.isArray(customerPhotoErrors) ? customerPhotoErrors : [])
    .map((error) => {
      const name = String(error?.name || "파일").trim() || "파일";
      const reason = String(error?.reason || "업로드 실패").trim() || "업로드 실패";
      return `${name}: ${reason}`;
    })
    .join(" / ");
}

function normalizeTemplatePreviewValue(value = "") {
  return String(value || "").trim() || "-";
}

export function buildSendQuoteTemplateParams({
  customer = {},
  orderTimeText = "",
  subject = "",
  message = "",
  orderLines = [],
  payload = {},
  payloadJson = "",
  customerPhotoUploads = [],
  customerPhotoErrors = [],
  customerAddress = "",
  previewImageUrl = "",
  previewImagePublicId = "",
  previewImageError = "",
  extraParams = {},
} = {}) {
  const normalizedCustomer = normalizeCustomerPayload(customer);
  const addressLine = String(customerAddress || buildCustomerAddressLine(normalizedCustomer)).trim();
  const orderLinesText = Array.isArray(orderLines) ? orderLines.join("\n") : String(orderLines || "");
  const payloadText = (() => {
    const customPayloadText = String(payloadJson || "");
    if (customPayloadText) return customPayloadText;
    try {
      return JSON.stringify(payload || {}, null, 2) || "{}";
    } catch (_error) {
      return "{}";
    }
  })();
  const photoUrlsText = buildCustomerPhotoUploadUrlsText(customerPhotoUploads);
  const photoErrorsText = formatCustomerPhotoUploadErrorsForTemplate(customerPhotoErrors);

  return {
    name: normalizedCustomer.name || "-",
    time: String(orderTimeText || ""),
    subject: String(subject || ""),
    message: String(message || ""),
    customer_name: normalizedCustomer.name,
    customer_phone: normalizedCustomer.phone,
    customer_email: normalizedCustomer.email,
    customer_address: addressLine || "-",
    customer_memo: normalizedCustomer.memo || "-",
    customer_photo_count: String(Array.isArray(customerPhotoUploads) ? customerPhotoUploads.length : 0),
    customer_photo_urls: photoUrlsText || "-",
    customer_photo_upload_error: photoErrorsText || "-",
    preview_image_url: normalizeTemplatePreviewValue(previewImageUrl),
    preview_image_public_id: normalizeTemplatePreviewValue(previewImagePublicId),
    preview_image_error: normalizeTemplatePreviewValue(previewImageError),
    order_lines: orderLinesText,
    order_payload_json: payloadText,
    ...(extraParams && typeof extraParams === "object" ? extraParams : {}),
  };
}

export function resolveThreePhaseNextTransition({
  currentPhase = 1,
  phase1Ready = true,
  phase1ErrorMessage = "",
  validatePhase2,
} = {}) {
  const normalizedPhase = Number(currentPhase) || 1;
  if (normalizedPhase === 1) {
    if (!phase1Ready) {
      return {
        nextPhase: 1,
        errorMessage: String(phase1ErrorMessage || "").trim(),
        errorStage: "phase1",
      };
    }
    return { nextPhase: 2, errorMessage: "", errorStage: "" };
  }
  if (normalizedPhase === 2) {
    const serviceError =
      typeof validatePhase2 === "function" ? String(validatePhase2() || "").trim() : "";
    if (serviceError) {
      return {
        nextPhase: 2,
        errorMessage: serviceError,
        errorStage: "phase2",
      };
    }
    return { nextPhase: 3, errorMessage: "", errorStage: "" };
  }
  return { nextPhase: normalizedPhase, errorMessage: "", errorStage: "" };
}

export function resolveThreePhasePrevPhase(currentPhase = 1) {
  const normalizedPhase = Number(currentPhase) || 1;
  if (normalizedPhase <= 1) return 1;
  if (normalizedPhase === 3) return 2;
  return 1;
}

function toggleHiddenStepClass(target, hidden) {
  if (!target) return;
  target.classList.toggle("hidden-step", Boolean(hidden));
}

function setStepControlVisibility(target, visible) {
  if (!target) return;
  const show = Boolean(visible);
  target.classList.toggle("hidden-step", !show);
  target.style.display = show ? "" : "none";
}

export function applyThreePhaseStepVisibility({
  currentPhase = 1,
  orderCompleted = false,
  resetOrderCompleteUI,
  phase1Elements = [],
  additionalPhase1Element = null,
  showAdditionalPhase1 = true,
  phase2Element = null,
  phase3Element = null,
  summaryCard = null,
  summaryCompleteClass = "",
  restoreSummaryOnActive = false,
  orderCompleteElement = null,
  navActionsElement = null,
  prevButton = null,
  nextButton = null,
  sendButton = null,
  backToCenterButton = null,
  completedHiddenElements = [],
  completedActionButtons = [],
  onActiveRender,
  scrollTarget = null,
} = {}) {
  if (!orderCompleted && typeof resetOrderCompleteUI === "function") {
    resetOrderCompleteUI();
  }

  const normalizedPhase = Number(currentPhase) || 1;
  const showPhase1 = normalizedPhase === 1;
  const showPhase2 = normalizedPhase === 2;
  const showPhase3 = normalizedPhase === 3;

  if (orderCompleted) {
    const resolvedCompletedHiddenElements =
      Array.isArray(completedHiddenElements) && completedHiddenElements.length
        ? completedHiddenElements
        : [...phase1Elements, additionalPhase1Element, phase2Element, phase3Element, summaryCard];

    resolvedCompletedHiddenElements.forEach((el) => toggleHiddenStepClass(el, true));
    toggleHiddenStepClass(navActionsElement, true);
    toggleHiddenStepClass(orderCompleteElement, false);

    const actionButtons = Array.isArray(completedActionButtons) ? completedActionButtons : [];
    actionButtons.forEach((button) => toggleHiddenStepClass(button, true));

    if (summaryCard && summaryCompleteClass) {
      summaryCard.classList.add(summaryCompleteClass);
    }
    return;
  }

  (Array.isArray(phase1Elements) ? phase1Elements : []).forEach((el) =>
    toggleHiddenStepClass(el, !showPhase1)
  );
  if (additionalPhase1Element) {
    toggleHiddenStepClass(additionalPhase1Element, !showPhase1 || !showAdditionalPhase1);
  }
  toggleHiddenStepClass(phase2Element, !showPhase2);
  toggleHiddenStepClass(phase3Element, !showPhase3);

  if (summaryCard && restoreSummaryOnActive) {
    summaryCard.classList.remove("hidden-step");
    if (summaryCompleteClass) {
      summaryCard.classList.remove(summaryCompleteClass);
    }
  }

  toggleHiddenStepClass(orderCompleteElement, true);
  toggleHiddenStepClass(navActionsElement, false);

  setStepControlVisibility(prevButton, normalizedPhase !== 1);
  setStepControlVisibility(sendButton, showPhase3);
  setStepControlVisibility(backToCenterButton, showPhase1);
  setStepControlVisibility(nextButton, !showPhase3);

  if (typeof onActiveRender === "function") {
    onActiveRender({
      currentPhase: normalizedPhase,
      showPhase1,
      showPhase2,
      showPhase3,
    });
  }

  if (scrollTarget && typeof scrollTarget.scrollIntoView === "function") {
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function calcGroupedAmount(count = 0, groupSize = 1, groupPrice = 0) {
  const normalizedCount = Math.max(0, Math.floor(Number(count) || 0));
  const normalizedGroupSize = Math.max(1, Math.floor(Number(groupSize) || 1));
  const normalizedGroupPrice = Math.max(0, Number(groupPrice) || 0);
  if (!normalizedCount || !normalizedGroupPrice) return 0;
  return Math.ceil(normalizedCount / normalizedGroupSize) * normalizedGroupPrice;
}

export function ceilAmountByUnit(value = 0, unit = 1) {
  const normalizedValue = Math.max(0, Number(value) || 0);
  const normalizedUnit = Math.max(1, Number(unit) || 1);
  if (!normalizedValue) return 0;
  return Math.ceil(normalizedValue / normalizedUnit) * normalizedUnit;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeCompactText(value) {
  return String(value || "").replace(/\s+/g, "");
}

function normalizeRuleToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function buildAvailabilityResult(status = "ok") {
  const normalizedStatus = normalizeRuleToken(status) === "consult"
    ? "consult"
    : normalizeRuleToken(status) === "free"
    ? "free"
    : "ok";
  return {
    status: normalizedStatus,
    isConsult: normalizedStatus === "consult",
    isFree: normalizedStatus === "free",
  };
}

function getConfiguredPriceText(config = {}) {
  if (!config || typeof config !== "object") return "";
  return String(
    config.priceLabel ||
      config.displayPriceText ||
      config.displayPriceLabel ||
      config?.priceRule?.label ||
      ""
  ).trim();
}

function toFiniteNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function getPriceRule(config = {}) {
  if (!config || typeof config !== "object") return null;
  if (config.priceRule && typeof config.priceRule === "object") return config.priceRule;

  if (Number.isFinite(Number(config.price))) {
    return { type: "fixed", value: Number(config.price), unit: "item" };
  }
  if (Number.isFinite(Number(config.pricePerHole))) {
    return { type: "perHole", value: Number(config.pricePerHole), unit: "hole" };
  }
  if (Number.isFinite(Number(config.pricePerMeter))) {
    return { type: "perMeter", value: Number(config.pricePerMeter), unit: "meter" };
  }
  if (Number.isFinite(Number(config.pricePerCorner))) {
    return { type: "perCorner", value: Number(config.pricePerCorner), unit: "corner" };
  }
  return null;
}

function getDefaultPriceRuleDisplayText(rule) {
  if (!rule || typeof rule !== "object") return "";
  const typeToken = normalizeRuleToken(rule.type);
  const unitToken = normalizeRuleToken(rule.unit);
  const value = toFiniteNumber(rule.value, NaN);
  const hasValue = Number.isFinite(value) && value >= 0;

  if (typeToken === "consult") return "상담 안내";
  if (typeToken === "free") return "무료";
  if (!hasValue) return "";

  if (typeToken === "fixed" || unitToken === "item") return `${formatPrice(value)}원`;
  if (typeToken === "perhole" || unitToken === "hole") return `개당 ${formatPrice(value)}원`;
  if (typeToken === "permeter" || unitToken === "meter") return `m당 ${formatPrice(value)}원`;
  if (typeToken === "percorner" || unitToken === "corner") return `모서리당 ${formatPrice(value)}원`;
  return `${formatPrice(value)}원`;
}

function normalizeAvailabilityResolverResult(result, fallbackStatus = "ok") {
  if (typeof result === "boolean") return result ? "consult" : "ok";
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    if (typeof result.status === "string") return result.status;
    if (typeof result.isConsult === "boolean") return result.isConsult ? "consult" : "ok";
    if (typeof result.consult === "boolean") return result.consult ? "consult" : "ok";
  }
  return fallbackStatus;
}

export function resolveAvailabilityStatus({
  config = {},
  context = {},
  resolveAvailability,
} = {}) {
  if (!config || typeof config !== "object") return buildAvailabilityResult("ok");

  const availabilityRule = config.availabilityRule;
  if (availabilityRule && typeof availabilityRule === "object") {
    const ruleType = normalizeRuleToken(availabilityRule.type);
    if (ruleType === "consult") return buildAvailabilityResult("consult");
    if (ruleType === "free") return buildAvailabilityResult("free");
    if (ruleType === "ok" || ruleType === "available") return buildAvailabilityResult("ok");
    if (ruleType === "conditional") {
      const fallbackStatus = availabilityRule.defaultStatus || "ok";
      if (typeof resolveAvailability === "function") {
        const resolved = resolveAvailability({
          rule: availabilityRule,
          config,
          context,
        });
        return buildAvailabilityResult(normalizeAvailabilityResolverResult(resolved, fallbackStatus));
      }
      return buildAvailabilityResult(fallbackStatus);
    }
  }

  // Backward compatibility with legacy consult flags/labels.
  const pricingMode = String(
    config.pricingMode ||
      config.pricingType ||
      config.priceType ||
      config?.priceRule?.type ||
      ""
  )
    .trim()
    .toLowerCase();
  if (pricingMode === "consult") return buildAvailabilityResult("consult");
  if (config.consultOnly === true || config.forceConsult === true || config.isConsult === true) {
    return buildAvailabilityResult("consult");
  }
  const labelToken = normalizeCompactText(getConfiguredPriceText(config));
  if (labelToken.startsWith(CONSULT_DISPLAY_PRICE_LABEL)) return buildAvailabilityResult("consult");
  return buildAvailabilityResult("ok");
}

export function resolveAmountFromPriceRule({
  config = {},
  quantity = 1,
  detail = null,
  metrics = {},
} = {}) {
  const rule = getPriceRule(config);
  if (!rule || typeof rule !== "object") return 0;

  const typeToken = normalizeRuleToken(rule.type);
  const unitToken = normalizeRuleToken(rule.unit);
  const value = toFiniteNumber(rule.value, NaN);
  if (!Number.isFinite(value) || value < 0) return 0;

  const qty = (() => {
    const normalized = Number(quantity);
    return Number.isFinite(normalized) && normalized > 0 ? normalized : 1;
  })();

  const detailHoleCount = Math.max(
    0,
    Number(Array.isArray(detail?.holes) ? detail.holes.length : detail?.count || 0) || 0
  );
  const holeCount = Math.max(0, Number(metrics?.holeCount || detailHoleCount || 0));
  const meterCount = Math.max(
    0,
    Number(
      metrics?.meterCount ||
        detail?.meters ||
        detail?.meter ||
        detail?.lengthMeter ||
        detail?.lengthMeters ||
        1
    )
  );
  const cornerCount = Math.max(0, Number(metrics?.cornerCount || detail?.corners || 1));

  if (typeToken === "consult") return 0;
  if (typeToken === "free") return 0;
  if (typeToken === "fixed" || unitToken === "item") return value * qty;
  if (typeToken === "perhole" || unitToken === "hole") return value * holeCount * qty;
  if (typeToken === "permeter" || unitToken === "meter") return value * meterCount * qty;
  if (typeToken === "percorner" || unitToken === "corner") return value * cornerCount * qty;
  return value * qty;
}

export function isConsultPricingConfig(config = {}) {
  return resolveAvailabilityStatus({ config }).isConsult;
}

export function getPricingDisplayMeta({
  config,
  fallbackText = "",
  availabilityContext = {},
  resolveAvailability,
} = {}) {
  const availability = resolveAvailabilityStatus({
    config,
    context: availabilityContext,
    resolveAvailability,
  });
  if (availability.isConsult) {
    return { text: "상담 안내", isConsult: true, status: availability.status };
  }

  const configuredText = getConfiguredPriceText(config);
  const derivedRuleText = getDefaultPriceRuleDisplayText(getPriceRule(config));
  const fallback = String(fallbackText || "").trim();
  const text = configuredText || derivedRuleText || fallback || (availability.isFree ? "무료" : "");
  return { text, isConsult: false, status: availability.status };
}

export function evaluateSelectionPricing({
  selectedIds = [],
  resolveById,
  getAmount,
  isConsult,
  quantity = 1,
  availabilityContext,
  resolveAvailability,
} = {}) {
  const ids = Array.isArray(selectedIds) ? selectedIds : [];
  let amount = 0;
  let hasConsult = false;

  ids.forEach((id) => {
    const item = typeof resolveById === "function" ? resolveById(id) : resolveById?.[id];
    if (!item) return;
    const contextForItem =
      typeof availabilityContext === "function"
        ? availabilityContext({ id, item })
        : availabilityContext || {};
    const availability = resolveAvailabilityStatus({
      config: item,
      context: contextForItem,
      resolveAvailability:
        typeof resolveAvailability === "function"
          ? (params) => resolveAvailability({ ...params, id, item, context: contextForItem })
          : undefined,
    });
    const consult =
      typeof isConsult === "function"
        ? Boolean(isConsult({ id, item, context: contextForItem, availability }))
        : availability.isConsult;
    if (consult) {
      hasConsult = true;
      return;
    }
    const value = Number(
      typeof getAmount === "function"
        ? getAmount({ id, item, quantity, context: contextForItem, availability })
        : resolveAmountFromPriceRule({
            config: item,
            quantity,
            detail: contextForItem?.detail,
            metrics: contextForItem?.metrics,
          })
    );
    if (Number.isFinite(value) && value > 0) amount += value;
  });

  return { amount, hasConsult };
}

export function hasConsultLineItem(items = []) {
  return Array.isArray(items) && items.some((item) => Boolean(item?.isCustomPrice || item?.hasConsultItems));
}

export function buildStandardPriceBreakdownRows({
  itemCost = 0,
  optionCost = 0,
  serviceCost = 0,
  itemHasConsult = false,
  optionHasConsult = false,
  serviceHasConsult = false,
} = {}) {
  return [
    { label: "품목", amount: itemCost, isConsult: itemHasConsult },
    { label: "옵션", amount: optionCost, isConsult: optionHasConsult },
    { label: "가공서비스", amount: serviceCost, isConsult: serviceHasConsult },
  ];
}

export function buildConsultAwarePricing({
  materialCost = 0,
  processingCost = 0,
  total = 0,
  isCustomPrice = false,
} = {}) {
  if (isCustomPrice) {
    return {
      materialCost: null,
      processingCost: null,
      total: null,
      isCustomPrice: true,
      displayPriceLabel: CONSULT_DISPLAY_PRICE_LABEL,
    };
  }
  return {
    materialCost: Number(materialCost || 0),
    processingCost: Number(processingCost || 0),
    total: Number(total || 0),
    isCustomPrice: false,
    displayPriceLabel: null,
  };
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

function getModalContent(modalEl) {
  return modalEl?.querySelector(".modal-content") || modalEl;
}

function ensureModalA11y(modalEl) {
  if (!modalEl) return;
  modalEl.setAttribute("role", "dialog");
  modalEl.setAttribute("aria-modal", "true");
  modalEl.setAttribute("aria-hidden", modalEl.classList.contains("hidden") ? "true" : "false");

  const contentEl = getModalContent(modalEl);
  if (contentEl && !contentEl.hasAttribute("tabindex")) {
    contentEl.setAttribute("tabindex", "-1");
  }

  const labelledBy = modalEl.getAttribute("aria-labelledby");
  if (labelledBy) return;

  const titleEl =
    modalEl.querySelector(".modal-header h1, .modal-header h2, .modal-header h3, .modal-header h4, .modal-header h5, .modal-header h6") ||
    modalEl.querySelector("h1, h2, h3, h4, h5, h6");
  if (!titleEl) return;

  if (!titleEl.id) {
    autoModalTitleIdSeq += 1;
    titleEl.id = `modalTitleAuto${autoModalTitleIdSeq}`;
  }
  modalEl.setAttribute("aria-labelledby", titleEl.id);
}

function getFocusableElements(modalEl) {
  const contentEl = getModalContent(modalEl);
  if (!contentEl) return [];
  return Array.from(contentEl.querySelectorAll(MODAL_FOCUSABLE_SELECTOR)).filter((el) => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.hidden) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    if (el.tabIndex < 0) return false;
    return el.offsetParent !== null || el === document.activeElement;
  });
}

function trapFocusInActiveModal(event) {
  const modalEl = activeModalState?.modalEl;
  if (!modalEl || event.key !== "Tab") return;
  const focusables = getFocusableElements(modalEl);
  if (focusables.length === 0) {
    event.preventDefault();
    getModalContent(modalEl)?.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === first || !modalEl.contains(active)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last || !modalEl.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}

function handleGlobalModalKeydown(event) {
  const modalEl = activeModalState?.modalEl;
  if (!modalEl) return;
  if (modalEl.classList.contains("hidden")) {
    activeModalState = null;
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeModal(modalEl);
    return;
  }

  trapFocusInActiveModal(event);
}

function ensureModalKeyHandler() {
  if (typeof document === "undefined" || modalKeyHandlerBound) return;
  document.addEventListener("keydown", handleGlobalModalKeydown, true);
  modalKeyHandlerBound = true;
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
  const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const modalEl = resolveElement(modal);
  if (!modalEl) return;
  ensureModalKeyHandler();
  ensureModalA11y(modalEl);
  previousActive?.blur?.();
  modalEl?.classList.remove("hidden");
  modalEl?.setAttribute("aria-hidden", "false");
  activeModalState = {
    modalEl,
    returnFocusEl: previousActive && document.contains(previousActive) ? previousActive : null,
  };
  const focusEl = resolveElement(focusTarget);
  const fallbackFocus =
    focusEl ||
    getFocusableElements(modalEl)[0] ||
    modalEl.querySelector(".modal-header [tabindex], .modal-header h1, .modal-header h2, .modal-header h3") ||
    getModalContent(modalEl);
  fallbackFocus?.focus?.();
  if (resetScroll) resetModalScroll(modalEl, bodySelector);
}

export function closeModal(modal, { bodySelector = ".modal-body", resetScroll = true } = {}) {
  if (typeof document === "undefined") return;
  const modalEl = resolveElement(modal);
  if (!modalEl) return;
  const shouldRestoreFocus = activeModalState?.modalEl === modalEl;
  const returnFocusEl = shouldRestoreFocus ? activeModalState?.returnFocusEl : null;
  const modalCloseDetail = { modalId: modalEl.id || "", modalEl };
  try {
    modalEl.dispatchEvent(new CustomEvent("app:modal-before-close", { bubbles: true, detail: modalCloseDetail }));
  } catch (_err) {
    // Ignore CustomEvent dispatch issues in constrained environments.
  }
  document.activeElement?.blur?.();
  if (resetScroll) resetModalScroll(modalEl, bodySelector);
  modalEl?.classList.add("hidden");
  modalEl?.setAttribute("aria-hidden", "true");
  try {
    modalEl.dispatchEvent(new CustomEvent("app:modal-closed", { bubbles: true, detail: modalCloseDetail }));
  } catch (_err) {
    // Ignore CustomEvent dispatch issues in constrained environments.
  }
  if (shouldRestoreFocus) {
    activeModalState = null;
    if (returnFocusEl && document.contains(returnFocusEl) && typeof returnFocusEl.focus === "function") {
      returnFocusEl.focus();
    }
  }
}

export function getCustomerInfo({
  nameSelector = "#customerName",
  phoneSelector = "#customerPhone",
  emailSelector = "#customerEmail",
  memoSelector = "#customerMemo",
  postcodeSelector = "#sample6_postcode",
  addressSelector = "#sample6_address",
  detailAddressSelector = "#sample6_detailAddress",
} = {}) {
  const addressEl = document.querySelector(addressSelector);
  const address = addressEl?.value.trim() || "";
  const matchedAddress = String(addressEl?.dataset?.matchedAddress || "").trim();
  const canUseStructuredAddressMeta = Boolean(address && matchedAddress && address === matchedAddress);
  const addressMeta = {
    sido: canUseStructuredAddressMeta ? String(addressEl?.dataset?.sido || "").trim() : "",
    sigungu: canUseStructuredAddressMeta ? String(addressEl?.dataset?.sigungu || "").trim() : "",
    bname: canUseStructuredAddressMeta ? String(addressEl?.dataset?.bname || "").trim() : "",
    roadname: canUseStructuredAddressMeta ? String(addressEl?.dataset?.roadname || "").trim() : "",
  };

  return {
    name: document.querySelector(nameSelector)?.value.trim() || "",
    phone: document.querySelector(phoneSelector)?.value.trim() || "",
    email: document.querySelector(emailSelector)?.value.trim() || "",
    memo: document.querySelector(memoSelector)?.value.trim() || "",
    postcode: document.querySelector(postcodeSelector)?.value.trim() || "",
    address,
    detailAddress: document.querySelector(detailAddressSelector)?.value.trim() || "",
    addressMeta,
    sido: addressMeta.sido,
    sigungu: addressMeta.sigungu,
    bname: addressMeta.bname,
  };
}

function isFileLike(value) {
  if (!value || typeof value !== "object") return false;
  if (typeof File !== "undefined" && value instanceof File) return true;
  return (
    typeof value.name === "string" &&
    Number.isFinite(Number(value.size)) &&
    typeof value.type === "string"
  );
}

function isImageFileLike(file) {
  return Boolean(file) && /^image\//i.test(String(file?.type || "").trim());
}

function formatFileSize(value = 0) {
  const size = Math.max(0, Number(value) || 0);
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  if (size >= 1024) return `${Math.round(size / 1024)}KB`;
  return `${size}B`;
}

function getFileFingerprint(file) {
  return [
    String(file?.name || "").trim(),
    Number(file?.size || 0),
    Number(file?.lastModified || 0),
  ].join("::");
}

function sanitizeFileName(name = "") {
  return String(name || "")
    .trim()
    .replace(/[^\w.\-가-힣]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function withTimeout(promise, timeoutMs = 0, timeoutMessage = "요청 시간이 초과되었습니다.") {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function getCustomerPhotoDefaultFolder() {
  const baseFolder = String(CLOUDINARY_CONFIG?.folder || "").trim();
  if (!baseFolder) return "ggr-order-center/customer-photo";
  const trimmed = baseFolder.replace(/\/+$/g, "");
  return trimmed.endsWith("/customer-photo") ? trimmed : `${trimmed}/customer-photo`;
}

function renderCustomerPhotoList(listEl, files = []) {
  if (!listEl) return;
  if (!Array.isArray(files) || files.length === 0) {
    listEl.innerHTML = `<div class="customer-photo-empty">선택된 사진이 없습니다.</div>`;
    return;
  }
  listEl.innerHTML = files
    .map((file, index) => {
      const fileName = escapeHtml(String(file?.name || `사진 ${index + 1}`));
      const fileSize = escapeHtml(formatFileSize(file?.size || 0));
      return `
        <div class="customer-photo-chip">
          <span class="customer-photo-chip-name">${fileName}</span>
          <span class="customer-photo-chip-size">${fileSize}</span>
          <button type="button" class="customer-photo-remove-btn" data-customer-photo-remove="${index}" aria-label="${fileName} 제거">삭제</button>
        </div>
      `;
    })
    .join("");
}

export function initCustomerPhotoUploader({
  inputSelector = "#customerPhotoInput",
  listSelector = "#customerPhotoList",
  maxCount = CUSTOMER_PHOTO_MAX_COUNT,
  maxFileSizeMb = CUSTOMER_PHOTO_MAX_FILE_SIZE_MB,
  showInfoModal = null,
  onChange = null,
} = {}) {
  const inputEl = typeof document !== "undefined" ? document.querySelector(inputSelector) : null;
  const listEl = typeof document !== "undefined" ? document.querySelector(listSelector) : null;
  const normalizedMaxCount = Math.max(1, Math.floor(Number(maxCount) || CUSTOMER_PHOTO_MAX_COUNT));
  const maxFileSizeBytes = Math.max(
    1,
    Math.floor(Number(maxFileSizeMb) || CUSTOMER_PHOTO_MAX_FILE_SIZE_MB) * 1024 * 1024
  );
  const state = { files: [] };

  const notifyChange = () => {
    if (typeof onChange === "function") {
      onChange(state.files.slice());
    }
  };

  const showErrors = (errors = []) => {
    if (!errors.length || typeof showInfoModal !== "function") return;
    if (errors.length === 1) {
      showInfoModal(errors[0]);
      return;
    }
    if (errors.length === 2) {
      showInfoModal(errors.join("\n"));
      return;
    }
    const preview = errors.slice(0, 2).join("\n");
    showInfoModal(`${preview}\n외 ${errors.length - 2}건`);
  };

  const render = () => {
    renderCustomerPhotoList(listEl, state.files);
  };

  const clear = () => {
    state.files = [];
    if (inputEl) inputEl.value = "";
    render();
    notifyChange();
  };

  const getSelectedFiles = () => state.files.slice();

  if (!inputEl || !listEl) {
    return {
      clear,
      getSelectedFiles,
      getSelectedCount: () => getSelectedFiles().length,
    };
  }

  render();

  inputEl.addEventListener("change", () => {
    const selectedFiles = Array.from(inputEl.files || []).filter(isFileLike);
    inputEl.value = "";
    if (!selectedFiles.length) return;

    const errors = [];
    const merged = [...state.files];
    const knownFingerprintSet = new Set(merged.map((file) => getFileFingerprint(file)));
    selectedFiles.forEach((file) => {
      const fileName = String(file?.name || "이미지");
      if (!isImageFileLike(file)) {
        errors.push(`${fileName}: 이미지 파일만 업로드할 수 있습니다.`);
        return;
      }
      if (Number(file.size || 0) > maxFileSizeBytes) {
        errors.push(`${fileName}: 파일 크기는 ${Math.floor(maxFileSizeBytes / (1024 * 1024))}MB 이하만 가능합니다.`);
        return;
      }
      if (merged.length >= normalizedMaxCount) {
        errors.push(`사진은 최대 ${normalizedMaxCount}장까지 업로드할 수 있습니다.`);
        return;
      }
      const fingerprint = getFileFingerprint(file);
      if (knownFingerprintSet.has(fingerprint)) {
        errors.push(`${fileName}: 이미 선택된 사진입니다.`);
        return;
      }
      merged.push(file);
      knownFingerprintSet.add(fingerprint);
    });

    state.files = merged;
    render();
    notifyChange();
    showErrors(errors);
  });

  listEl.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-customer-photo-remove]") : null;
    if (!target) return;
    const removeIndex = Number(target.getAttribute("data-customer-photo-remove"));
    if (!Number.isInteger(removeIndex) || removeIndex < 0 || removeIndex >= state.files.length) return;
    state.files.splice(removeIndex, 1);
    render();
    notifyChange();
  });

  return {
    clear,
    getSelectedFiles,
    getSelectedCount: () => getSelectedFiles().length,
  };
}

async function loadImageFromFile(file) {
  if (typeof document === "undefined" || !isFileLike(file)) return null;
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지 파일을 읽을 수 없습니다."));
    };
    image.src = objectUrl;
  });
}

async function compressCustomerPhoto(file) {
  if (!isFileLike(file) || !isImageFileLike(file) || typeof document === "undefined") {
    return { uploadFile: file, width: 0, height: 0, transformed: false };
  }

  try {
    const image = await loadImageFromFile(file);
    const sourceWidth = Math.max(1, Math.round(Number(image?.naturalWidth || image?.width || 0)));
    const sourceHeight = Math.max(1, Math.round(Number(image?.naturalHeight || image?.height || 0)));
    const maxSide = Math.max(sourceWidth, sourceHeight);
    const scale = maxSide > CUSTOMER_PHOTO_MAX_DIMENSION_PX
      ? CUSTOMER_PHOTO_MAX_DIMENSION_PX / maxSide
      : 1;
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return { uploadFile: file, width: sourceWidth, height: sourceHeight, transformed: false };
    }
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", CUSTOMER_PHOTO_JPEG_QUALITY);
    });
    if (!(blob instanceof Blob) || !blob.size) {
      return { uploadFile: file, width: sourceWidth, height: sourceHeight, transformed: false };
    }

    const baseName = sanitizeFileName(String(file?.name || "").replace(/\.[^.]+$/, "")) || "customer-photo";
    const uploadName = `${baseName}.jpg`;
    const uploadFile = typeof File !== "undefined"
      ? new File([blob], uploadName, { type: "image/jpeg" })
      : blob;
    return {
      uploadFile,
      uploadName,
      width: targetWidth,
      height: targetHeight,
      transformed: true,
    };
  } catch (_error) {
    return { uploadFile: file, width: 0, height: 0, transformed: false };
  }
}

export function isCloudinaryUploadReady() {
  if (!isAllowedRuntimeHost()) return false;
  if (!CLOUDINARY_CONFIG || typeof CLOUDINARY_CONFIG !== "object") return false;
  if (CLOUDINARY_CONFIG.enabled === false) return false;
  const cloudName = String(CLOUDINARY_CONFIG.cloudName || "").trim();
  const uploadPreset = String(CLOUDINARY_CONFIG.uploadPreset || "").trim();
  return Boolean(cloudName && uploadPreset);
}

export async function uploadCustomerPhotoFilesToCloudinary({
  files = [],
  pageKey = "",
  folder = "",
  timeoutMs = CUSTOMER_PHOTO_UPLOAD_TIMEOUT_MS,
} = {}) {
  const selectedFiles = (Array.isArray(files) ? files : []).filter(isFileLike);
  const uploaded = [];
  const failed = [];
  if (!selectedFiles.length) return { uploaded, failed, skipped: "no_files" };

  const blockedReason = getRuntimeHostBlockedReason();
  if (blockedReason) {
    selectedFiles.forEach((file) => {
      failed.push({
        name: String(file?.name || "이미지"),
        reason: blockedReason,
      });
    });
    return { uploaded, failed, skipped: "host_blocked" };
  }

  if (!isCloudinaryUploadReady()) {
    selectedFiles.forEach((file) => {
      failed.push({
        name: String(file?.name || "이미지"),
        reason: "Cloudinary 설정이 비어 있습니다.",
      });
    });
    return { uploaded, failed, skipped: "not_configured" };
  }

  const cloudName = String(CLOUDINARY_CONFIG.cloudName || "").trim();
  const uploadPreset = String(CLOUDINARY_CONFIG.uploadPreset || "").trim();
  const uploadFolder = String(folder || "").trim() || getCustomerPhotoDefaultFolder();
  const tags = ["order-center", "customer-photo"];
  if (String(pageKey || "").trim()) tags.push(`page-${String(pageKey).trim()}`);
  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

  for (const file of selectedFiles) {
    const originalName = String(file?.name || "이미지").trim() || "이미지";
    try {
      const optimized = await compressCustomerPhoto(file);
      const uploadFile = optimized.uploadFile || file;
      const formData = new FormData();
      if (typeof File !== "undefined" && uploadFile instanceof File) {
        formData.append("file", uploadFile);
      } else {
        formData.append("file", uploadFile, optimized.uploadName || originalName);
      }
      formData.append("upload_preset", uploadPreset);
      formData.append("tags", tags.join(","));
      if (uploadFolder) formData.append("folder", uploadFolder);

      const response = await withTimeout(
        fetch(uploadEndpoint, { method: "POST", body: formData }),
        timeoutMs,
        `${originalName}: 업로드 시간이 초과되었습니다.`
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const reason = String(result?.error?.message || "").trim();
        throw new Error(reason || `Cloudinary 업로드 실패 (${response.status})`);
      }
      const secureUrl = String(result?.secure_url || "").trim();
      if (!secureUrl) {
        throw new Error("업로드 URL을 받지 못했습니다.");
      }
      uploaded.push({
        originalName,
        secureUrl,
        publicId: String(result?.public_id || "").trim(),
        width: Number(result?.width || optimized.width || 0),
        height: Number(result?.height || optimized.height || 0),
      });
    } catch (error) {
      failed.push({
        name: originalName,
        reason: String(error?.message || error || "업로드 실패").trim() || "업로드 실패",
      });
    }
  }

  return { uploaded, failed, skipped: "" };
}

function normalizePhoneDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

export function isValidCustomerEmail(email = "") {
  const text = String(email || "").trim();
  if (!text) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

export function isValidCustomerPhone(phone = "") {
  const digits = normalizePhoneDigits(phone);
  return digits.length >= 9 && digits.length <= 11;
}

export function validateCustomerInfo(customer) {
  if (!customer?.name || !customer?.phone || !customer?.email) {
    return "이름, 연락처, 이메일을 입력해주세요.";
  }
  if (!isValidCustomerPhone(customer.phone)) {
    return "연락처 형식을 확인해주세요. 숫자 9~11자리로 입력해주세요.";
  }
  if (!isValidCustomerEmail(customer.email)) {
    return "이메일 형식을 확인해주세요.";
  }
  if (!customer?.postcode || !customer?.address || !customer?.detailAddress) {
    return "주소를 입력해주세요.";
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
  const hasRequired = Boolean(
    customer.name &&
      customer.phone &&
      customer.email &&
      customer.postcode &&
      customer.address &&
      customer.detailAddress
  );
  const hasValidFormat = isValidCustomerPhone(customer.phone) && isValidCustomerEmail(customer.email);
  btn.disabled = !(hasRequired && hasValidFormat && hasItems && onFinalStep && hasConsent) || sending;
}

export function getEmailJSInstance(showInfoModal) {
  const blockedReason = getRuntimeHostBlockedReason();
  if (blockedReason) {
    showInfoModal?.(blockedReason);
    return null;
  }
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

  const formatRangeError = (label, min, max) => {
    if (Number.isFinite(min) && Number.isFinite(max)) {
      return `${label}은 ${min}~${max}mm 범위 내로 입력해주세요.`;
    }
    if (Number.isFinite(min)) {
      return `${label}은 ${min}mm 이상으로 입력해주세요.`;
    }
    if (Number.isFinite(max)) {
      return `${label}은 ${max}mm 이하로 입력해주세요.`;
    }
    return `${label} 범위를 확인해주세요.`;
  };

  let widthValid = true;
  let lengthValid = true;
  let length2Valid = true;

  if (widthEl?.value) {
    const widthVal = Number(widthEl.value);
    const minOk = !Number.isFinite(widthMin) || widthVal >= widthMin;
    const maxOk = !Number.isFinite(widthMax) || widthVal <= widthMax;
    if (!minOk || !maxOk) {
      widthValid = false;
      if (widthErrEl) {
        widthErrEl.textContent = formatRangeError("폭", widthMin, widthMax);
        widthErrEl.classList.add("error");
      }
      widthEl.classList.add("input-error");
    }
  }

  if (lengthEl?.value) {
    const lengthVal = Number(lengthEl.value);
    const minOk = !Number.isFinite(lengthMin) || lengthVal >= lengthMin;
    const maxOk = !Number.isFinite(lengthMax) || lengthVal <= lengthMax;
    if (!minOk || !maxOk) {
      lengthValid = false;
      if (lengthErrEl) {
        lengthErrEl.textContent = formatRangeError("길이", lengthMin, lengthMax);
        lengthErrEl.classList.add("error");
      }
      lengthEl.classList.add("input-error");
    }
  }

  if (enableLength2 && length2El?.value) {
    const length2Val = Number(length2El.value);
    const minOk = !Number.isFinite(length2Min) || length2Val >= length2Min;
    const maxOk = !Number.isFinite(length2Max) || length2Val <= length2Max;
    if (!minOk || !maxOk) {
      length2Valid = false;
      if (length2ErrEl) {
        length2ErrEl.textContent = formatRangeError("길이2", length2Min, length2Max);
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

export function bindSizeInputHandlers({
  widthId,
  lengthId,
  handlers = [],
  thicknessId,
  thicknessHandlers = [],
} = {}) {
  const widthEl = widthId ? document.getElementById(widthId) : null;
  const lengthEl = lengthId ? document.getElementById(lengthId) : null;
  handlers.forEach((fn) => {
    widthEl?.addEventListener("input", fn);
    lengthEl?.addEventListener("input", fn);
  });
  if (thicknessId) {
    const thicknessEl = document.getElementById(thicknessId);
    thicknessHandlers.forEach((fn) => thicknessEl?.addEventListener("change", fn));
  }
}

export function renderEstimateTable({
  items = [],
  tbodySelector = "#estimateTable tbody",
  emptySelector = "#estimateEmpty",
  getName,
  getTotalText,
  getDetailLines,
  onQuantityChange,
  onDelete,
} = {}) {
  const preserveWindowScroll = (callback) => {
    if (typeof callback !== "function") return;
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      callback();
      return;
    }
    const prevX = Number(window.scrollX || window.pageXOffset || 0);
    const prevY = Number(window.scrollY || window.pageYOffset || 0);
    callback();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const nextX = Number(window.scrollX || window.pageXOffset || 0);
        const nextY = Number(window.scrollY || window.pageYOffset || 0);
        if (Math.abs(nextX - prevX) < 1 && Math.abs(nextY - prevY) < 1) return;
        window.scrollTo({ left: prevX, top: prevY, behavior: "auto" });
      });
    });
  };

  const tbody = document.querySelector(tbodySelector);
  if (!tbody) return;
  const emptyBanner = emptySelector ? document.querySelector(emptySelector) : null;
  tbody.innerHTML = "";

  if (!items.length) {
    if (emptyBanner) emptyBanner.style.display = "block";
    return;
  }
  if (emptyBanner) emptyBanner.style.display = "none";

  const currentDetailStateKeys = new Set(
    items.map((item, index) => String(item?.id || `row-${index}`))
  );
  Array.from(ESTIMATE_DETAIL_OPEN_STATE.keys()).forEach((key) => {
    if (!currentDetailStateKeys.has(key)) {
      ESTIMATE_DETAIL_OPEN_STATE.delete(key);
    }
  });

  items.forEach((item, index) => {
    const detailStateKey = String(item?.id || `row-${index}`);
    const detailLinesRaw = getDetailLines ? getDetailLines(item) : [];
    const detailLines = Array.isArray(detailLinesRaw)
      ? detailLinesRaw.map((line) => String(line || "").trim()).filter(Boolean)
      : [];
    const hasDetail = detailLines.length > 0;
    const detailOpen = hasDetail && ESTIMATE_DETAIL_OPEN_STATE.get(detailStateKey) === true;

    const tr = document.createElement("tr");
    const nameText = getName ? getName(item) : "";
    const totalText = getTotalText ? getTotalText(item) : "-";
    tr.innerHTML = `
      <td>
        <div class="estimate-name-wrap">
          <span class="estimate-name-text">${nameText}</span>
          ${
            hasDetail
              ? `<button type="button" class="detail-toggle-btn" aria-expanded="${detailOpen ? "true" : "false"}">${
                  detailOpen ? "상세닫기" : "상세보기"
                }</button>`
              : ""
          }
        </div>
      </td>
      <td>
        <input
          type="number"
          class="qty-input"
          data-id="${item.id}"
          value="${item.quantity}"
          min="1"
        />
      </td>
      <td>
        <div>총: ${totalText}</div>
      </td>
      <td><button data-id="${item.id}" class="deleteBtn">삭제</button></td>
    `;
    tbody.appendChild(tr);

    if (hasDetail) {
      const detailRow = document.createElement("tr");
      detailRow.className = `detail-row${detailOpen ? "" : " is-collapsed"}`;
      detailRow.innerHTML = `
        <td colspan="4">
          <div class="sub-detail">
            ${detailLines.map((line) => `<div class="detail-line">${line}</div>`).join("")}
          </div>
        </td>
      `;
      tbody.appendChild(detailRow);

      const toggleBtn = tr.querySelector(".detail-toggle-btn");
      toggleBtn?.addEventListener("click", () => {
        const willOpen = detailRow.classList.contains("is-collapsed");
        detailRow.classList.toggle("is-collapsed", !willOpen);
        toggleBtn.setAttribute("aria-expanded", String(willOpen));
        toggleBtn.textContent = willOpen ? "상세닫기" : "상세보기";
        ESTIMATE_DETAIL_OPEN_STATE.set(detailStateKey, willOpen);
      });
    }
  });

  tbody.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const id = e.target.dataset.id;
      const value = Math.max(1, Number(e.target.value) || 1);
      preserveWindowScroll(() => {
        onQuantityChange?.(id, value);
      });
    });
  });

  tbody.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      onDelete?.(id);
    });
  });
}

export function createServiceModalController({
  modalId,
  titleId,
  bodyId,
  errorId,
  noteId,
  focusTarget,
  services,
  state,
  getDefaultServiceDetail,
  cloneServiceDetails,
  updateServiceSummary,
  openModal,
  closeModal,
  onRevertSelection,
  onAfterSave,
  onAfterRemove,
  onAfterClose,
} = {}) {
  let draft = null;
  let context = { serviceId: null, triggerCheckbox: null, mode: null };
  const createDefaultHole = () => ({
    edge: "left",
    distance: 100,
    verticalRef: "top",
    verticalDistance: 100,
  });

  const setError = (message = "") => {
    const errEl = errorId ? document.querySelector(errorId) : null;
    if (errEl) errEl.textContent = message || "";
  };

  const renderHoleModal = (serviceId) => {
    const body = bodyId ? document.querySelector(bodyId) : null;
    const srv = services?.[serviceId];
    if (!body || !srv) return;
    const normalized = srv.normalizeDetail(draft);
    const holes = Array.isArray(normalized?.holes) ? normalized.holes : [];
    draft = { ...normalized, holes: holes.map((h) => ({ ...h })) };

    const rowsHtml =
      holes.length > 0
        ? holes
            .map(
              (hole, idx) => {
                const rowIdPrefix = `service-hole-${String(serviceId).replace(/[^a-zA-Z0-9_-]/g, "_")}-${idx}`;
                const edgeId = `${rowIdPrefix}-edge`;
                const distanceId = `${rowIdPrefix}-distance`;
                const verticalRefId = `${rowIdPrefix}-vertical-ref`;
                const verticalDistanceId = `${rowIdPrefix}-vertical-distance`;
                return `
                  <div class="service-row">
                    <div class="service-row-header">
                      <span>${srv.label} ${idx + 1}</span>
                      <button type="button" class="ghost-btn remove-hole" data-index="${idx}">삭제</button>
                    </div>
                    <div class="service-field-grid">
                      <div>
                        <label for="${edgeId}">측면</label>
                        <select id="${edgeId}" class="service-input select-caret" data-field="edge" data-index="${idx}">
                          <option value="left"${hole.edge === "left" ? " selected" : ""}>왼쪽</option>
                          <option value="right"${hole.edge === "right" ? " selected" : ""}>오른쪽</option>
                        </select>
                      </div>
                      <div>
                        <label for="${distanceId}">가로(mm)</label>
                        <input
                          id="${distanceId}"
                          type="number"
                          class="service-input"
                          data-field="distance"
                          data-index="${idx}"
                          value="${hole.distance ?? ""}"
                          min="1"
                        />
                      </div>
                      <div>
                        <label for="${verticalRefId}">세로 기준</label>
                        <select id="${verticalRefId}" class="service-input select-caret" data-field="verticalRef" data-index="${idx}">
                          <option value="top"${hole.verticalRef === "top" ? " selected" : ""}>상단 기준</option>
                          <option value="bottom"${hole.verticalRef === "bottom" ? " selected" : ""}>하단 기준</option>
                        </select>
                      </div>
                      <div>
                        <label for="${verticalDistanceId}">세로(mm)</label>
                        <input
                          id="${verticalDistanceId}"
                          type="number"
                          class="service-input"
                          data-field="verticalDistance"
                          data-index="${idx}"
                          value="${hole.verticalDistance ?? ""}"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                `;
              }
            )
            .join("")
        : `<div class="service-empty">등록된 위치가 없습니다. 아래의 "위치 추가"를 눌러주세요.</div>`;

    body.innerHTML = `
      <p class="input-tip">${srv.label} 위치를 원의 중심 기준으로 입력해주세요. 여러 개를 추가할 수 있습니다.</p>
      ${rowsHtml}
      <div class="service-actions">
        <button type="button" data-add-hole>위치 추가</button>
      </div>
      <div>
        <label for="${noteId}">추가 메모 (선택)</label>
        <textarea class="service-textarea" id="${noteId}">${draft?.note || ""}</textarea>
      </div>
    `;

    body.querySelectorAll("[data-field]").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = Number(e.target.dataset.index);
        const field = e.target.dataset.field;
        if (Number.isNaN(idx) || !field) return;
        if (!draft.holes[idx]) {
          draft.holes[idx] = { edge: "left", distance: 100, verticalRef: "top", verticalDistance: 100 };
        }
        if (field === "edge") draft.holes[idx].edge = e.target.value === "right" ? "right" : "left";
        if (field === "distance") draft.holes[idx].distance = Number(e.target.value);
        if (field === "verticalRef")
          draft.holes[idx].verticalRef = e.target.value === "bottom" ? "bottom" : "top";
        if (field === "verticalDistance") draft.holes[idx].verticalDistance = Number(e.target.value);
      });
    });

    const noteEl = body.querySelector(`#${noteId}`);
    if (noteEl) {
      noteEl.addEventListener("input", (e) => {
        draft.note = e.target.value;
      });
    }

    const addBtn = body.querySelector("[data-add-hole]");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        draft.holes.push(createDefaultHole());
        renderHoleModal(serviceId);
      });
    }

    body.querySelectorAll(".remove-hole").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = Number(e.target.dataset.index);
        if (Number.isNaN(idx)) return;
        draft.holes.splice(idx, 1);
        renderHoleModal(serviceId);
      });
    });
  };

  const renderContent = (serviceId) => {
    const titleEl = titleId ? document.querySelector(titleId) : null;
    const srv = services?.[serviceId];
    if (titleEl) titleEl.textContent = srv?.label || "가공 옵션 설정";
    setError("");
    if (!draft) {
      draft = getDefaultServiceDetail?.(serviceId) || { note: "" };
    }
    if (srv?.hasDetail()) {
      renderHoleModal(serviceId);
      return;
    }
    const body = bodyId ? document.querySelector(bodyId) : null;
    if (body) {
      body.innerHTML = `<p class="input-tip">선택한 가공의 세부 설정을 입력해주세요.</p>`;
    }
  };

  const open = (serviceId, triggerCheckbox, mode = "change") => {
    const srv = services?.[serviceId];
    if (!srv?.hasDetail()) return;
    context = { serviceId, triggerCheckbox, mode };
    draft =
      cloneServiceDetails?.(state?.serviceDetails?.[serviceId]) ||
      getDefaultServiceDetail?.(serviceId) ||
      { note: "", holes: [] };
    renderContent(serviceId);
    openModal?.(modalId, { focusTarget });
  };

  const close = (revertSelection = true) => {
    closeModal?.(modalId);
    setError("");
    if (revertSelection && context.mode === "change" && context.triggerCheckbox) {
      context.triggerCheckbox.checked = false;
      context.triggerCheckbox.closest(".service-card")?.classList.remove("selected");
      if (state?.serviceDetails) {
        delete state.serviceDetails[context.serviceId];
      }
      updateServiceSummary?.(context.serviceId);
      onRevertSelection?.();
    }
    draft = null;
    context = { serviceId: null, triggerCheckbox: null, mode: null };
    onAfterClose?.();
  };

  const save = () => {
    const serviceId = context.serviceId;
    const srv = services?.[serviceId];
    if (!serviceId || !srv) return;
    setError("");
    if (srv.hasDetail()) {
      const validation = srv.validateDetail(draft);
      if (!validation.ok) {
        setError(validation.message || "세부 옵션을 확인해주세요.");
        return;
      }
      state.serviceDetails[serviceId] = cloneServiceDetails(validation.detail);
    } else {
      state.serviceDetails[serviceId] = srv.normalizeDetail
        ? cloneServiceDetails(srv.normalizeDetail(draft))
        : null;
    }
    updateServiceSummary?.(serviceId);
    onAfterSave?.();
    close(false);
  };

  const remove = () => {
    const serviceId = context.serviceId;
    if (!serviceId) return;
    if (context.triggerCheckbox) {
      context.triggerCheckbox.checked = false;
      context.triggerCheckbox.closest(".service-card")?.classList.remove("selected");
    }
    if (state?.serviceDetails) {
      delete state.serviceDetails[serviceId];
    }
    updateServiceSummary?.(serviceId);
    onAfterRemove?.();
    close(false);
  };

  return { open, close, save, remove };
}

export function renderSelectedCard({
  cardId,
  emptyTitle,
  emptyMeta,
  swatch,
  imageUrl,
  name,
  metaLines = [],
} = {}) {
  const cardEl = cardId ? document.querySelector(cardId) : null;
  if (!cardEl) return;
  if (!name) {
    cardEl.innerHTML = `
      <div class="material-visual placeholder-visual"></div>
      <div class="info">
        <div class="placeholder">${emptyTitle || ""}</div>
        <div class="meta">${emptyMeta || ""}</div>
      </div>
    `;
    return;
  }
  const visualStyle = buildMaterialVisualInlineStyle({ swatch, imageUrl });
  cardEl.innerHTML = `
    <div class="material-visual" style="${visualStyle}"></div>
    <div class="info">
      <div class="name">${name}</div>
      ${metaLines.map((line) => `<div class="meta">${line}</div>`).join("")}
    </div>
  `;
}

export function buildMaterialVisualInlineStyle({
  swatch = UI_COLOR_FALLBACKS.swatch,
  imageUrl = "",
} = {}) {
  const safeSwatch =
    String(swatch || UI_COLOR_FALLBACKS.swatch).trim() || UI_COLOR_FALLBACKS.swatch;
  const safeImageUrl = String(imageUrl || "").trim();
  if (!safeImageUrl) return `background: ${safeSwatch};`;
  const encodedImageUrl = safeImageUrl.replace(/'/g, "%27");
  return [
    `background: ${safeSwatch};`,
    `background-image: url('${encodedImageUrl}');`,
    "background-size: cover;",
    "background-position: center;",
    "background-repeat: no-repeat;",
  ].join(" ");
}

export function renderSelectedAddonChips({
  targetId,
  emptyText = "선택된 부자재 없음",
  addons = [],
  allItems = [],
  formatPrice,
  swatch = UI_COLOR_FALLBACKS.swatch,
} = {}) {
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) return;
  if (!addons.length) {
    target.innerHTML = `<div class="placeholder">${emptyText}</div>`;
    return;
  }
  const chips = addons
    .map((id) => allItems.find((i) => i.id === id))
    .filter(Boolean)
    .map(
      (item) => `
        <div class="addon-chip">
          <div class="material-visual" style="background:${swatch};"></div>
          <div class="info">
            <div class="name">${item.name}</div>
            <div class="meta">${formatPrice ? formatPrice(item.price) : item.price.toLocaleString()}원</div>
          </div>
        </div>
      `
    )
    .join("");
  target.innerHTML = chips;
}

export function updateServiceSummaryChip({
  serviceId,
  services,
  serviceDetails,
  formatSummaryText,
  emptyDetailText = "세부 옵션을 설정해주세요.",
  noDetailText = "추가 설정 없음",
  selector,
} = {}) {
  const summaryEl = document.querySelector(
    selector || `[data-service-summary="${serviceId}"]`
  );
  if (!summaryEl) return;
  const srv = services?.[serviceId];
  if (!srv) {
    summaryEl.textContent = emptyDetailText;
    return;
  }
  const detail = serviceDetails?.[serviceId];
  summaryEl.textContent = detail
    ? formatSummaryText?.(serviceId, detail) || emptyDetailText
    : srv.hasDetail()
    ? emptyDetailText
    : noDetailText;
}

function isEmbeddedContext() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch (_err) {
    return true;
  }
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(max-width: 900px)").matches;
  }
  return Number(window.innerWidth || 0) <= 900;
}

function getViewportHeight() {
  if (typeof window === "undefined") return 0;
  return Number(window.visualViewport?.height || window.innerHeight || 0);
}

function hasEmbeddedModeHint() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(String(window.location?.search || ""));
  const hint = String(
    params.get("embed") ||
      params.get("embedded") ||
      params.get("oc_embed") ||
      params.get("oc_mode") ||
      ""
  )
    .trim()
    .toLowerCase();
  return ["1", "true", "yes", "y", "modal", "embed", "embedded"].includes(hint);
}

function syncEmbeddedViewportClass() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!root) return;
  const embedded = isEmbeddedContext();
  const embeddedLike = embedded || hasEmbeddedModeHint();
  const mobile = isMobileViewport();
  const compactHeight = getViewportHeight() > 0 && getViewportHeight() <= COMPACT_MOBILE_VIEWPORT_MAX_HEIGHT;
  const constrainedUi = mobile && (embeddedLike || compactHeight);
  root.classList.toggle("oc-embedded", embeddedLike);
  root.classList.toggle("oc-embedded-mobile", embeddedLike && mobile);
  root.classList.toggle("oc-compact-height", mobile && compactHeight);
  root.classList.toggle("oc-constrained-ui", constrainedUi);
}

function findScrollableParent(element) {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  let parent = element?.parentElement || null;
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    const overflowY = style?.overflowY || "";
    const canScroll = overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
    if (canScroll && parent.scrollHeight > parent.clientHeight + 1) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.scrollingElement || document.documentElement || null;
}

function keepAccordionSectionInViewport(section) {
  if (typeof window === "undefined") return;
  if (!isMobileViewport()) return;
  const headerEl = section?.querySelector(".step-card-header, .estimate-header") || section;
  if (!headerEl || typeof headerEl.getBoundingClientRect !== "function") return;
  const rect = headerEl.getBoundingClientRect();
  const viewportHeight = Number(window.visualViewport?.height || window.innerHeight || 0);
  if (!viewportHeight) return;
  const topGap = 12;
  const bottomGap = 12;
  const isOutOfView = rect.top < topGap || rect.bottom > viewportHeight - bottomGap;
  if (!isOutOfView) return;

  const scrollHost = findScrollableParent(section);
  if (!scrollHost) return;
  const targetOffset = Math.max(0, rect.top - topGap);
  if (scrollHost === document.scrollingElement || scrollHost === document.documentElement) {
    const targetTop = Math.max(0, (window.scrollY || 0) + targetOffset);
    window.scrollTo({ top: targetTop, behavior: "smooth" });
    return;
  }
  const currentTop = Number(scrollHost.scrollTop || 0);
  scrollHost.scrollTo({ top: Math.max(0, currentTop + targetOffset), behavior: "smooth" });
}

export function initCollapsibleSections({
  toggleSelector = ".accordion-toggle",
  collapsedClass = "is-collapsed",
  openText = "접기",
  closedText = "열기",
} = {}) {
  if (typeof document === "undefined") return;
  syncEmbeddedViewportClass();
  if (typeof window !== "undefined" && !embeddedViewportClassBound) {
    window.addEventListener("resize", syncEmbeddedViewportClass, { passive: true });
    window.addEventListener("orientationchange", syncEmbeddedViewportClass);
    embeddedViewportClassBound = true;
  }
  document.querySelectorAll(toggleSelector).forEach((btn) => {
    const targetId = btn.dataset.toggleTarget;
    const section = targetId ? document.getElementById(targetId) : null;
    if (!section) return;
    const openLabel = btn.dataset.openText || openText;
    const closedLabel = btn.dataset.closedText || closedText;
    const titleText = String(
      btn.dataset.a11yLabel ||
        section.querySelector(".step-card-header h2, .estimate-header h2, h2")?.textContent ||
        ""
    ).trim();
    const controlTarget =
      section.querySelector(".accordion-body[id], .estimate-body[id]") ||
      section.querySelector(".accordion-body, .estimate-body");
    if (controlTarget) {
      if (!controlTarget.id && targetId) controlTarget.id = `${targetId}Panel`;
      if (controlTarget.id) btn.setAttribute("aria-controls", controlTarget.id);
    } else if (targetId) {
      btn.setAttribute("aria-controls", targetId);
    }

    const applyState = (collapsed) => {
      const actionText = collapsed ? closedLabel : openLabel;
      btn.textContent = actionText;
      btn.setAttribute("aria-expanded", String(!collapsed));
      if (titleText) {
        btn.setAttribute("aria-label", `${titleText} ${actionText}`);
      }
    };

    const isCollapsed = section.classList.contains(collapsedClass);
    applyState(isCollapsed);
    btn.addEventListener("click", () => {
      const nowCollapsed = section.classList.toggle(collapsedClass);
      applyState(nowCollapsed);
      if (!nowCollapsed) {
        requestAnimationFrame(() => keepAccordionSectionInViewport(section));
      }
    });
  });
}

export function updatePreviewSummary({
  optionSelector,
  serviceSelector,
  optionSummarySelector = "#previewOptionSummary",
  serviceSummarySelector = "#previewServiceSummary",
  optionEmptyText = "옵션 선택 없음",
  serviceEmptyText = "가공 선택 없음",
} = {}) {
  if (typeof document === "undefined") return;
  const optionSummaryEl = document.querySelector(optionSummarySelector);
  const serviceSummaryEl = document.querySelector(serviceSummarySelector);
  if (!optionSummaryEl && !serviceSummaryEl) return;
  const optionCount = optionSelector
    ? document.querySelectorAll(optionSelector).length
    : 0;
  const serviceCount = serviceSelector
    ? document.querySelectorAll(serviceSelector).length
    : 0;
  if (optionSummaryEl) {
    optionSummaryEl.textContent = optionCount
      ? `옵션 ${optionCount}개 선택`
      : optionEmptyText;
  }
  if (serviceSummaryEl) {
    serviceSummaryEl.textContent = serviceCount
      ? `가공 ${serviceCount}개 선택`
      : serviceEmptyText;
  }
}

export function buildEstimateDetailLines({
  sizeText,
  optionsText,
  servicesText,
  serviceLabel = "가공서비스",
  materialLabel,
  materialCost,
  processingCost,
  processingCostLabel,
  materialConsult = false,
  processingConsult = false,
} = {}) {
  const lines = [];
  if (sizeText) lines.push(`사이즈 ${sizeText}`);
  if (optionsText) lines.push(`옵션 ${optionsText}`);
  if (servicesText) lines.push(`${serviceLabel} ${servicesText}`);
  if (materialLabel) {
    if (materialConsult) {
      lines.push(`${materialLabel} 상담 안내`);
    } else if (Number.isFinite(materialCost)) {
      lines.push(`${materialLabel} ${materialCost.toLocaleString()}원`);
    }
  }
  const resolvedProcessingCostLabel = processingCostLabel || `${serviceLabel}비`;
  if (processingConsult) {
    lines.push(`${resolvedProcessingCostLabel} 상담 안내`);
  } else if (Number.isFinite(processingCost)) {
    lines.push(`${resolvedProcessingCostLabel} ${processingCost.toLocaleString()}원`);
  }
  return lines;
}

export function renderItemPriceDisplay({
  target,
  totalLabel = "예상금액",
  totalAmount = 0,
  totalText = "",
  showConsultSuffix = false,
  breakdownRows = [],
} = {}) {
  const targetEl = resolveElement(target);
  if (!targetEl) return;

  const resolvedTotalText = String(totalText || `${formatPrice(totalAmount)}원`);
  const rows = Array.isArray(breakdownRows) ? breakdownRows.filter((row) => row?.label) : [];

  const rowsHtml = rows
    .map((row) => {
      const isConsult = Boolean(row.isConsult);
      const resolvedValueText = isConsult
        ? "상담 안내"
        : String(row.valueText || `${formatPrice(row.amount)}원`);
      return `
        <div class="item-price-row">
          <span class="item-price-label">${escapeHtml(row.label)}</span>
          <span class="item-price-value${isConsult ? " is-consult" : ""}">${escapeHtml(resolvedValueText)}</span>
        </div>
      `;
    })
    .join("");

  targetEl.classList.add("item-price-display");
  targetEl.innerHTML = `
    <div class="item-price-total">
      <span class="item-price-total-label">${escapeHtml(totalLabel)}:</span>
      <strong class="item-price-total-value">${escapeHtml(resolvedTotalText)}</strong>
      ${showConsultSuffix ? `<span class="item-price-suffix">${escapeHtml(CONSULT_EXCLUDED_SUFFIX)}</span>` : ""}
    </div>
    ${rowsHtml ? `<div class="item-price-breakdown">${rowsHtml}</div>` : ""}
  `;
}

export function renderItemPriceNotice({
  target,
  text = "",
} = {}) {
  const targetEl = resolveElement(target);
  if (!targetEl) return;
  targetEl.classList.add("item-price-display");
  targetEl.innerHTML = `
    <div class="item-price-total">
      <strong class="item-price-total-value">${escapeHtml(String(text || ""))}</strong>
    </div>
  `;
}
