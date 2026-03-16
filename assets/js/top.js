import {
  EMAILJS_CONFIG,
  initEmailJS,
  openModal,
  closeModal,
  getCustomerInfo,
  validateCustomerInfo,
  updateSendButtonEnabled as updateSendButtonEnabledShared,
  isConsentChecked,
  getEmailJSInstance,
  updateSizeErrors,
  renderEstimateTable,
  createServiceModalController,
  renderSelectedCard,
  renderSelectedAddonChips,
  updateServiceSummaryChip,
  initCollapsibleSections,
  updatePreviewSummary,
  buildEstimateDetailLines,
  ORDER_PAYLOAD_SCHEMA_VERSION,
  buildConsultAwarePricing,
  CONSULT_EXCLUDED_SUFFIX,
  getPricingDisplayMeta,
  evaluateSelectionPricing,
  resolveAmountFromPriceRule,
  hasConsultLineItem,
  buildStandardPriceBreakdownRows,
  renderItemPriceDisplay,
  renderItemPriceNotice,
  resolveServiceRegionByAddress,
} from "./shared.js";
import { TOP_PROCESSING_SERVICES, TOP_TYPES, TOP_OPTIONS, TOP_ADDON_ITEMS } from "./data/top-data.js";
import {
  normalizeFulfillmentType,
  isServiceAddressReady,
  evaluateFulfillmentPolicy,
  formatServiceCostText,
  formatFulfillmentLine,
  formatFulfillmentCardPriceText,
} from "./fulfillment-policy.js";
import {
  FULFILLMENT_POLICY_MESSAGES,
  TOP_FULFILLMENT_POLICY,
} from "./data/fulfillment-policy-data.js";

class BaseService {
  constructor(cfg) {
    this.id = cfg.id;
    this.label = cfg.label;
    this.type = cfg.type || "simple";
    this.pricePerHole = cfg.pricePerHole;
    this.pricePerMeter = cfg.pricePerMeter;
    this.pricePerCorner = cfg.pricePerCorner;
    this.priceRule = cfg.priceRule;
    this.availabilityRule = cfg.availabilityRule;
    this.pricingMode = cfg.pricingMode;
    this.consultOnly = cfg.consultOnly;
    this.forceConsult = cfg.forceConsult;
    this.isConsult = cfg.isConsult;
    this.priceLabel = cfg.priceLabel;
    this.displayPriceText = cfg.displayPriceText;
    this.swatch = cfg.swatch;
    this.description = cfg.description;
  }
  hasDetail() {
    return this.type === "detail";
  }
  defaultDetail() {
    return null;
  }
  normalizeDetail(detail) {
    return detail || this.defaultDetail();
  }
  validateDetail(detail) {
    return { ok: true, detail: this.normalizeDetail(detail), message: "" };
  }
  getCount(detail) {
    return 1;
  }
  formatDetail(detail, { includeNote = false } = {}) {
    if (!this.hasDetail()) return "세부 설정 없음";
    const note = includeNote && detail?.note ? ` (메모: ${detail.note})` : "";
    return `세부 옵션 저장됨${note}`;
  }
  calcProcessingCost(quantity, detail) {
    return resolveAmountFromPriceRule({
      config: this,
      quantity,
      detail,
      metrics: { holeCount: this.getCount(detail) },
    });
  }
}

function formatHoleDetail(detail, { includeNote = false, short = false } = {}) {
  if (!detail) return short ? "세부 옵션을 설정해주세요." : "세부 옵션 미입력";
  const holes = Array.isArray(detail.holes) ? detail.holes : [];
  if (holes.length === 0) {
    return short ? "세부 옵션을 설정해주세요." : "세부 옵션 미입력";
  }
  const count = holes.length || detail.count || 0;
  const positions = holes
    .filter((h) => h && (h.distance || h.verticalDistance))
    .map((h) => {
      const edgeLabel = h.edge === "right" ? "우" : "좌";
      const verticalLabel = h.verticalRef === "bottom" ? "하" : "상";
      const vert = h.verticalDistance ? `${verticalLabel} ${h.verticalDistance}mm` : "";
      const horiz = h.distance ? `${edgeLabel} ${h.distance}mm` : "";
      return [horiz, vert].filter(Boolean).join(" / ");
    })
    .join(", ");
  const noteText = includeNote && detail.note ? ` · 메모: ${detail.note}` : "";
  const suffix = positions ? ` · ${positions}` : "";
  return `${count}개${suffix}${noteText}`;
}

class HoleService extends BaseService {
  constructor(cfg) {
    super({ ...cfg, type: "detail" });
  }
  defaultDetail() {
    return { holes: [], note: "" };
  }
  normalizeDetail(detail) {
    if (!detail || !Array.isArray(detail.holes)) return this.defaultDetail();
    const holes = detail.holes;
    return {
      holes: holes.map((h) => ({
        edge: h.edge === "right" ? "right" : "left",
        distance: Number(h.distance),
        verticalRef: h.verticalRef === "bottom" ? "bottom" : "top",
        verticalDistance: Number(h.verticalDistance),
      })),
      note: detail.note || "",
    };
  }
  validateDetail(detail) {
    const normalized = this.normalizeDetail(detail);
    const validHoles = (normalized.holes || []).filter(
      (h) =>
        h &&
        Number.isFinite(Number(h.distance)) &&
        Number(h.distance) > 0 &&
        Number.isFinite(Number(h.verticalDistance)) &&
        Number(h.verticalDistance) > 0
    );
    if (validHoles.length === 0) {
      return {
        ok: false,
        message: `${this.label}의 가로·세로 위치를 1개 이상 입력해주세요.`,
        detail: normalized,
      };
    }
    return {
      ok: true,
      detail: {
        holes: validHoles,
        note: normalized.note?.trim() || "",
      },
      message: "",
    };
  }
  getCount(detail) {
    const normalized = this.normalizeDetail(detail);
    const holes = Array.isArray(normalized.holes) ? normalized.holes.length : 0;
    const fallback = normalized.count || 0;
    return Math.max(0, holes || fallback || 0);
  }
  formatDetail(detail, { includeNote = false, short = false } = {}) {
    return formatHoleDetail(detail, { includeNote, short });
  }
}

function buildServiceModels(configs) {
  const models = {};
  Object.values(configs).forEach((cfg) => {
    if (cfg.type === "detail" || cfg.pricePerHole) {
      models[cfg.id] = new HoleService(cfg);
    } else {
      models[cfg.id] = new BaseService(cfg);
    }
  });
  return models;
}

const SERVICES = buildServiceModels(TOP_PROCESSING_SERVICES);
const OPTION_CATALOG = TOP_OPTIONS.reduce((acc, option) => {
  if (!option?.id) return acc;
  acc[option.id] = option;
  return acc;
}, {});

function cloneServiceDetails(details) {
  return JSON.parse(JSON.stringify(details || {}));
}

function getDefaultServiceDetail(serviceId) {
  const srv = SERVICES[serviceId];
  if (!srv) return { note: "" };
  if (srv.hasDetail()) return { holes: [], note: "" };
  return cloneServiceDetails(srv.defaultDetail ? srv.defaultDetail() : { note: "" });
}

function isBackShelfConsult({ serviceId, detail, width }) {
  if (serviceId !== TOP_BACK_SHELF_SERVICE_ID) return false;
  const height = getBackHeightFromServiceDetail(detail);
  if (height <= 0) return false;
  return height > getBackHeightLimit(width);
}

function calcServiceProcessingCost({ services = [], serviceDetails = {}, quantity = 1, width = 0 }) {
  const { amount, hasConsult } = evaluateSelectionPricing({
    selectedIds: services,
    resolveById: (id) => SERVICES[id],
    quantity,
    availabilityContext: ({ id }) => ({
      serviceId: id,
      detail: serviceDetails?.[id],
      width,
    }),
    resolveAvailability: ({ rule, context }) => {
      if (rule?.ruleKey === "top_back_height_limit") {
        return isBackShelfConsult({
          serviceId: context?.serviceId,
          detail: context?.detail,
          width: context?.width,
        })
          ? "consult"
          : "ok";
      }
      return rule?.defaultStatus || "ok";
    },
    getAmount: ({ id, item, quantity: qty }) => {
      const detail = serviceDetails?.[id];
      return item.calcProcessingCost(qty, detail);
    },
  });
  return { processingCost: amount, hasConsult };
}

function formatServiceDetail(serviceId, detail, { includeNote = false } = {}) {
  const srv = SERVICES[serviceId];
  const name = srv?.label || serviceId;
  if (!srv) return name;
  if (serviceId === TOP_BACK_SHELF_SERVICE_ID) {
    const height = getBackHeightFromServiceDetail(detail);
    return height > 0 ? `${name} (${height}mm)` : name;
  }
  if (!srv.hasDetail()) return name;
  return `${name} (${srv.formatDetail(detail, { includeNote })})`;
}

function formatServiceList(services, serviceDetails = {}, opts = {}) {
  if (!services || services.length === 0) return "-";
  return services
    .map((id) => formatServiceDetail(id, serviceDetails[id], opts))
    .filter(Boolean)
    .join(", ");
}

function formatServiceSummaryText(serviceId, detail) {
  const srv = SERVICES[serviceId];
  if (!srv) return "세부 옵션을 설정해주세요.";
  if (serviceId === TOP_BACK_SHELF_SERVICE_ID) {
    const height = getBackHeightFromServiceDetail(detail);
    return height > 0 ? `높이 ${height}mm` : "높이를 입력해주세요.";
  }
  if (!srv.hasDetail()) return "세부 옵션 없음";
  const formatted = srv.formatDetail(detail, { short: true });
  return formatted || "세부 옵션을 설정해주세요.";
}

let selectedTopType = "";
const TOP_CATEGORIES = Array.from(new Set(TOP_TYPES.map((t) => t.category || "기타")));
let selectedTopCategory = TOP_CATEGORIES[0] || "기타";
let currentPhase = 1; // 1: 상판/가공, 2: 서비스, 3: 고객정보
const state = { items: [], serviceDetails: {}, addons: [] };
const previewSummaryConfig = {
  optionSelector: "#topOptionCards input:checked",
  serviceSelector: 'input[name="service"]:checked',
};
const HAS_OPTION_SELECTIONS = TOP_OPTIONS.length > 0;
const HAS_PROCESSING_SELECTIONS = Object.keys(SERVICES).length > 0;
const HAS_ADDITIONAL_SELECTIONS = HAS_OPTION_SELECTIONS || HAS_PROCESSING_SELECTIONS;

function getFulfillmentType() {
  return normalizeFulfillmentType(String($("#fulfillmentType")?.value || ""));
}

function setFulfillmentType(nextType) {
  const normalizedType = normalizeFulfillmentType(nextType);
  const typeInput = $("#fulfillmentType");
  if (typeInput) typeInput.value = normalizedType;
  document.querySelectorAll("[data-fulfillment-type]").forEach((btn) => {
    const active = normalizedType && btn.dataset.fulfillmentType === normalizedType;
    btn.classList.toggle("selected", Boolean(active));
    btn.setAttribute("aria-pressed", String(Boolean(active)));
  });
}

function setServiceStepError(message = "") {
  const errorEl = $("#serviceStepError");
  if (!errorEl) return;
  errorEl.textContent = String(message || "").trim();
}

function getTopProductItems() {
  return state.items.filter((item) => item.type !== "addon");
}

function evaluateFulfillmentService(nextType = getFulfillmentType()) {
  const customer = getCustomerInfo();
  const hasProducts = getTopProductItems().length > 0;
  return evaluateFulfillmentPolicy({
    nextType,
    customer,
    hasProducts,
    evaluateSupportedPolicy: ({ type }) => {
      if (type === "delivery") {
        return {
          amount: 0,
          amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
          isConsult: true,
          reason: TOP_FULFILLMENT_POLICY.deliveryConsultReason,
        };
      }
      return {
        amount: TOP_FULFILLMENT_POLICY.installationAmount,
        amountText: TOP_FULFILLMENT_POLICY.installationAmountText,
        isConsult: false,
        reason: "",
      };
    },
  });
}

function buildGrandSummary() {
  const subtotal = state.items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);
  const materialsTotal = subtotal;
  const baseGrandTotal = state.items.reduce((sum, it) => sum + Number(it.total || 0), 0);
  const fulfillment = evaluateFulfillmentService();
  const fulfillmentCost = fulfillment.isConsult ? 0 : Number(fulfillment.amount || 0);
  const grandTotal = baseGrandTotal + fulfillmentCost;
  const hasConsult = hasConsultLineItem(state.items) || (Boolean(fulfillment.type) && fulfillment.isConsult);
  return {
    subtotal,
    materialsTotal,
    grandTotal,
    fulfillment,
    fulfillmentCost,
    hasConsult,
  };
}

function updateFulfillmentCardPriceUI() {
  const cardEntries = [
    { id: "#serviceCardPriceDelivery", fulfillment: evaluateFulfillmentService("delivery") },
    { id: "#serviceCardPriceInstallation", fulfillment: evaluateFulfillmentService("installation") },
  ];
  cardEntries.forEach(({ id, fulfillment }) => {
    const priceEl = $(id);
    if (!priceEl) return;
    const isPlaceholder = fulfillment.amountText === "미선택" || !fulfillment.addressReady;
    priceEl.textContent = formatFulfillmentCardPriceText(fulfillment);
    priceEl.classList.toggle("is-consult", Boolean(fulfillment.isConsult));
    priceEl.classList.toggle("is-placeholder", Boolean(!fulfillment.isConsult && isPlaceholder));
  });
}

function updateServiceStepUI({ showError = false } = {}) {
  const customer = getCustomerInfo();
  const addressReady = isServiceAddressReady(customer);
  const region = resolveServiceRegionByAddress(customer.address);
  const regionHintEl = $("#serviceRegionHint");
  if (regionHintEl) {
    if (!addressReady) {
      regionHintEl.textContent = "주소를 입력하면 서비스 가능 지역을 안내합니다.";
    } else {
      regionHintEl.textContent = `판별 지역: ${region.label}${region.isSupported ? "" : " (상담 안내)"}`;
    }
  }

  const fulfillment = evaluateFulfillmentService();
  const priceHintEl = $("#servicePriceHint");
  if (priceHintEl) {
    if (!fulfillment.type) {
      priceHintEl.textContent = "서비스를 선택하면 예상 서비스비가 표시됩니다.";
    } else if (fulfillment.isConsult) {
      priceHintEl.textContent = `${fulfillment.typeLabel} 서비스비: 상담 안내${fulfillment.reason ? ` (${fulfillment.reason})` : ""}`;
    } else {
      priceHintEl.textContent = `${fulfillment.typeLabel} 서비스비: ${Number(fulfillment.amount || 0).toLocaleString()}원`;
    }
  }
  updateFulfillmentCardPriceUI();

  if (showError) {
    setServiceStepError(validateServiceStep());
  } else {
    setServiceStepError("");
  }
}

function validateServiceStep() {
  const customer = getCustomerInfo();
  if (!isServiceAddressReady(customer)) {
    return "서비스 진행을 위해 주소를 입력해주세요.";
  }
  if (!getFulfillmentType()) {
    return "배송 또는 시공 서비스를 선택해주세요.";
  }
  return "";
}

function clearProcessingServices() {
  document.querySelectorAll('#topServiceCards input[name="service"]').forEach((input) => {
    input.checked = false;
    input.closest(".service-card")?.classList.remove("selected");
  });
  state.serviceDetails = {};
  Object.keys(SERVICES).forEach((id) => updateServiceSummary(id));
}

function syncProcessingSectionVisibility() {
  const container = $("#topServiceCards");
  if (!container) return;
  const section = container.closest(".selection-block--input");
  if (section) section.classList.toggle("hidden-step", !HAS_PROCESSING_SELECTIONS);
  if (!HAS_PROCESSING_SELECTIONS) {
    updatePreviewSummary(previewSummaryConfig);
    return;
  }
  container.classList.remove("hidden-step");
  container.querySelectorAll('input[name="service"]').forEach((input) => {
    input.disabled = false;
  });
  updatePreviewSummary(previewSummaryConfig);
}

let sendingEmail = false;
let orderCompleted = false;
let stickyOffsetTimer = null;
let previewResizeTimer = null;
const DEFAULT_TOP_THICKNESSES = [12, 24, 30, 40, 50];
const TOP_CUSTOM_LENGTH_MAX = 3000;
const TOP_STANDARD_THICKNESS = 12;
const TOP_STANDARD_WIDTH_MAX = 760;
const TOP_BACK_HEIGHT_MAX = 100;
const TOP_BACK_SHELF_SERVICE_ID = "top_back_shelf";
const TOP_ROUNDING_UNIT = 10;
const TOP_UNIT_PRICE_BY_CATEGORY = {
  인조대리석: 147000,
  하이막스: 210000,
};
const TOP_CATEGORY_DESC = {
  인조대리석: "12T 기준 · 깊이 760mm 이하 m당 147,000원",
  하이막스: "12T 기준 · 깊이 760mm 이하 m당 210,000원",
};

function getPreviewDimensions(width, length, maxPx = 160, minPx = 40) {
  if (!width || !length) return { w: 120, h: 120 };
  const scale = Math.min(maxPx / Math.max(width, length), 1);
  return {
    w: Math.max(minPx, width * scale),
    h: Math.max(minPx, length * scale),
  };
}

function getPreviewScaleBounds(colorEl, { fallbackMax = 180, fallbackMin = 40 } = {}) {
  const frameEl = colorEl ? colorEl.closest(".preview-frame") : null;
  const rect = frameEl ? frameEl.getBoundingClientRect() : null;
  const frameW = Number(rect?.width || 0);
  const frameH = Number(rect?.height || 0);
  if (!frameW || !frameH) {
    return { maxPx: fallbackMax, minPx: fallbackMin };
  }
  const shortSide = Math.max(1, Math.min(frameW, frameH));
  const framePaddingPx = 24;
  const visualScale = 0.88;
  const fitMax = Math.max(1, shortSide - framePaddingPx) * visualScale;
  const maxPx = Math.max(fallbackMin, Math.round(fitMax));
  return {
    maxPx,
    minPx: Math.min(fallbackMin, maxPx),
  };
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function formatPrice(n) {
  return Number(n || 0).toLocaleString();
}

function ceilToUnit(value, unit = TOP_ROUNDING_UNIT) {
  const safeValue = Number(value || 0);
  if (safeValue <= 0) return 0;
  return Math.ceil(safeValue / unit) * unit;
}

function needsSecondLength(shape) {
  return shape === "l" || shape === "rl" || shape === "u";
}

function needsThirdLength(shape) {
  return shape === "u";
}

function hasBackShelfService(services = []) {
  return Array.isArray(services) && services.includes(TOP_BACK_SHELF_SERVICE_ID);
}

function getBackHeightFromServiceDetail(detail) {
  const height = Number(detail?.height || 0);
  if (!Number.isFinite(height) || height <= 0) return 0;
  return height;
}

function validateBackHeightValue(backHeight) {
  const height = Number(backHeight);
  if (!Number.isFinite(height) || height <= 0) {
    return { ok: false, message: "뒷턱 높이를 입력해주세요." };
  }
  if (height > TOP_BACK_HEIGHT_MAX) {
    return {
      ok: false,
      message: `뒷턱 높이는 최대 ${TOP_BACK_HEIGHT_MAX}mm까지 입력 가능합니다.`,
    };
  }
  return { ok: true, height, message: "" };
}

function getBackHeightLimit(width) {
  return Math.max(0, TOP_STANDARD_WIDTH_MAX - Number(width || 0));
}

function getTopUnitPrice(type) {
  if (!type) return 0;
  return TOP_UNIT_PRICE_BY_CATEGORY[type.category] || 0;
}

function getTopStandardPriceLine(type) {
  const unitPrice = getTopUnitPrice(type);
  return unitPrice ? `깊이 760mm 이하 m당 ${formatPrice(unitPrice)}원` : "가격 정보 준비중";
}

function getTopAvailableThicknessText(type) {
  const thicknesses = type?.availableThickness?.length ? type.availableThickness : DEFAULT_TOP_THICKNESSES;
  return thicknesses.map((t) => `${t}T`).join("/");
}

function getChargeableLengthMm({ shape, width, length, length2 = 0, length3 = 0 }) {
  const safeWidth = Number(width || 0);
  const safeLength = Number(length || 0);
  const safeLength2 = Number(length2 || 0);
  const safeLength3 = Number(length3 || 0);
  if (shape === "u") {
    return Math.max(0, safeLength + safeLength2 + safeLength3 - safeWidth * 2);
  }
  if (shape === "l" || shape === "rl") {
    return Math.max(0, safeLength + safeLength2 - safeWidth);
  }
  return Math.max(0, safeLength);
}

function descriptionHTML(desc) {
  return desc ? `<div class="description">${desc}</div>` : "";
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

function readTopInputs() {
  const typeId = selectedTopType;
  const shape = $("#kitchenShape")?.value || "";
  const width = Number($("#topDepth")?.value || 0);
  const length = Number($("#topLength")?.value || 0);
  const length2 = Number($("#topLength2")?.value || 0);
  const length3 = Number($("#topLength3")?.value || 0);
  const thickness = Number($("#topThickness")?.value || 0);
  const options = Array.from(document.querySelectorAll("#topOptionCards input:checked")).map(
    (el) => el.value
  );
  const services = Array.from(document.querySelectorAll("#topServiceCards input:checked")).map(
    (el) => el.value
  );
  const serviceDetails = cloneServiceDetails(state.serviceDetails);
  const useBackHeight = hasBackShelfService(services);
  const backHeight = useBackHeight
    ? getBackHeightFromServiceDetail(serviceDetails?.[TOP_BACK_SHELF_SERVICE_ID])
    : 0;
  return {
    typeId,
    shape,
    width,
    length,
    length2,
    length3,
    thickness,
    options,
    backHeight,
    useBackHeight,
    services,
    serviceDetails,
  };
}

function validateTopInputs({
  typeId,
  shape,
  width,
  length,
  length2,
  length3,
  thickness,
  backHeight,
  useBackHeight,
}) {
  if (!typeId) return "상판 타입을 선택해주세요.";
  if (!shape) return "주방 형태를 선택해주세요.";
  if (!width) return "깊이를 입력해주세요.";
  if (!length) return "길이를 입력해주세요.";
  if (needsSecondLength(shape) && !length2) {
    return shape === "u" ? "ㄷ자 형태일 때 길이2를 입력해주세요." : "ㄱ자 형태일 때 길이2를 입력해주세요.";
  }
  if (needsThirdLength(shape) && !length3) return "ㄷ자 형태일 때 길이3을 입력해주세요.";
  if (!thickness) return "두께를 입력해주세요.";
  const type = TOP_TYPES.find((t) => t.id === typeId);
  if (type?.minWidth && width < type.minWidth) return `깊이는 최소 ${type.minWidth}mm 입니다.`;
  if (type?.minLength && length < type.minLength) return `길이는 최소 ${type.minLength}mm 입니다.`;
  if (needsSecondLength(shape)) {
    if (type?.minLength && length2 < type.minLength) return `길이2는 최소 ${type.minLength}mm 입니다.`;
  }
  if (needsThirdLength(shape)) {
    if (type?.minLength && length3 < type.minLength) return `길이3은 최소 ${type.minLength}mm 입니다.`;
  }
  if (useBackHeight) {
    const validation = validateBackHeightValue(backHeight);
    if (!validation.ok) return validation.message;
  }
  return null;
}

function isTopCustomSize({ type, shape, thickness, width, length, length2 = 0, length3 = 0 }) {
  if (Number(thickness) !== TOP_STANDARD_THICKNESS) return true;
  if (Number(width) > TOP_STANDARD_WIDTH_MAX) return true;
  if (length > TOP_CUSTOM_LENGTH_MAX) return true;
  if (needsSecondLength(shape) && length2 > TOP_CUSTOM_LENGTH_MAX) return true;
  if (needsThirdLength(shape) && length3 > TOP_CUSTOM_LENGTH_MAX) return true;
  if (!getTopUnitPrice(type)) return true;
  return false;
}

function calcTopDetail(input) {
  const {
    typeId,
    shape,
    width,
    length,
    length2,
    length3,
    thickness,
    options,
    backHeight = 0,
    useBackHeight = false,
    services = [],
    serviceDetails = {},
  } = input;
  const type = TOP_TYPES.find((t) => t.id === typeId);
  const err = validateTopInputs(input);
  if (!type || err) return { error: err || "필수 정보를 입력해주세요." };

  const isCustomPrice = isTopCustomSize({
    type,
    shape,
    thickness,
    width,
    length,
    length2,
    length3,
  });

  const { amount: optionPrice, hasConsult: hasConsultOption } = evaluateSelectionPricing({
    selectedIds: options,
    resolveById: (id) => OPTION_CATALOG[id],
  });
  const { processingCost: serviceProcessingCost, hasConsult: hasConsultService } = calcServiceProcessingCost({
    services,
    serviceDetails,
    quantity: 1,
    width,
  });
  const itemCost = ceilToUnit((getChargeableLengthMm({ shape, width, length, length2, length3 }) / 1000) * getTopUnitPrice(type));
  const shapeFee = shape === "l" || shape === "rl" ? 30000 : 0;
  const serviceCostRaw = shapeFee + serviceProcessingCost;
  const optionHasConsult = Boolean(isCustomPrice || hasConsultOption);
  const serviceHasConsult = Boolean(isCustomPrice || hasConsultService);
  const appliedOptionCost = optionHasConsult ? 0 : optionPrice;
  const appliedServiceCost = serviceHasConsult ? 0 : serviceCostRaw;
  const appliedProcessingCost = appliedOptionCost + appliedServiceCost;
  const materialCost = isCustomPrice ? 0 : itemCost + appliedProcessingCost;
  const subtotal = materialCost;
  const vat = 0;
  const total = isCustomPrice ? 0 : ceilToUnit(subtotal);
  const hasConsultItems = Boolean(isCustomPrice || optionHasConsult || serviceHasConsult);

  const displaySize = (() => {
    if (shape === "u") {
      return `${width}×${length} / ${width}×${length2} / ${width}×${length3}×${thickness}mm${
        useBackHeight ? ` · 뒷턱 ${backHeight}mm` : ""
      }`;
    }
    if (shape === "l" || shape === "rl") {
      return `${width}×${length} / ${width}×${length2}×${thickness}mm${
        useBackHeight ? ` · 뒷턱 ${backHeight}mm` : ""
      }`;
    }
    return `${width}×${length}×${thickness}mm${useBackHeight ? ` · 뒷턱 ${backHeight}mm` : ""}`;
  })();

  const optionLabels = options
    .map((id) => OPTION_CATALOG[id]?.name || id)
    .filter(Boolean);

  return {
    materialCost,
    subtotal,
    vat,
    total,
    displaySize,
    optionsLabel: optionLabels.length === 0 ? "-" : optionLabels.join(", "),
    servicesLabel: formatServiceList(services, serviceDetails, { includeNote: true }),
    serviceDetails,
    services,
    isCustomPrice,
    hasConsultItems,
    itemCost: isCustomPrice ? 0 : itemCost,
    optionCost: appliedOptionCost,
    serviceCost: appliedServiceCost,
    itemHasConsult: Boolean(isCustomPrice),
    optionHasConsult,
    serviceHasConsult,
    useBackHeight,
    backHeight,
    processingCost: appliedProcessingCost,
  };
}

function calcAddonDetail(price) {
  const subtotal = price;
  const vat = 0;
  const total = subtotal;
  return {
    materialCost: price,
    processingCost: 0,
    subtotal,
    vat,
    total,
  };
}

function updateSelectedTopTypeCard() {
  const type = TOP_TYPES.find((t) => t.id === selectedTopType);
  renderSelectedCard({
    cardId: "#selectedTopTypeCard",
    emptyTitle: "선택된 상판 없음",
    emptyMeta: "상판을 선택해주세요.",
    swatch: type?.swatch,
    name: type ? escapeHtml(type.name) : "",
    metaLines: type
      ? [
          `12T 기준: ${getTopStandardPriceLine(type)}`,
          "비규격 상담안내",
          `두께 ${getTopAvailableThicknessText(type)}`,
          "12T 외 상담안내",
        ]
      : [],
  });
}

function updateTopThicknessOptions(typeId) {
  const select = $("#topThickness");
  if (!select) return;
  const type = TOP_TYPES.find((t) => t.id === typeId);
  const options = type?.availableThickness?.length ? type.availableThickness : DEFAULT_TOP_THICKNESSES;
  const current = select.value;
  select.innerHTML = `<option value="">두께를 선택해주세요</option>`;
  options.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = String(t);
    opt.textContent = `${t}T`;
    select.appendChild(opt);
  });
  if (options.map(String).includes(current)) {
    select.value = current;
  } else {
    select.value = "";
  }
}

function updateTopSizePlaceholders(typeId) {
  const widthEl = $("#topDepth");
  const lengthEl = $("#topLength");
  const length2El = $("#topLength2");
  const length3El = $("#topLength3");
  if (!widthEl || !lengthEl) return;
  const type = TOP_TYPES.find((t) => t.id === typeId);
  if (!type?.minWidth || !type?.maxWidth || !type?.minLength || !type?.maxLength) {
    widthEl.placeholder = "상판 타입을 선택해주세요.";
    lengthEl.placeholder = "상판 타입을 선택해주세요.";
    if (length2El) length2El.placeholder = "상판 타입을 선택해주세요.";
    if (length3El) length3El.placeholder = "상판 타입을 선택해주세요.";
    return;
  }
  widthEl.placeholder = `깊이 ${type.minWidth}~${type.maxWidth}mm`;
  lengthEl.placeholder = `길이 ${type.minLength}~${type.maxLength}mm`;
  if (length2El) length2El.placeholder = `길이2 ${type.minLength}~${type.maxLength}mm`;
  if (length3El) length3El.placeholder = `길이3 ${type.minLength}~${type.maxLength}mm`;
}

function renderTopTypeTabs() {
  const tabs = $("#topTypeTabs");
  if (!tabs) return;
  tabs.innerHTML = "";
  TOP_CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `material-tab${cat === selectedTopCategory ? " active" : ""}`;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      selectedTopCategory = cat;
      // 다른 카테고리에 선택된 타입이 있으면 해제
      const inCategory = TOP_TYPES.some((t) => t.id === selectedTopType && (t.category || "기타") === cat);
      if (!inCategory) selectedTopType = "";
      renderTopTypeTabs();
      renderTopTypeCards();
      updateSelectedTopTypeCard();
      updateTopThicknessOptions(selectedTopType);
      updateTopSizePlaceholders(selectedTopType);
      renderTopCategoryDesc();
      refreshTopEstimate();
    });
    tabs.appendChild(btn);
  });
}

function renderTopCategoryDesc() {
  const descEl = $("#topTypeCategoryDesc");
  const titleEl = $("#topTypeCategoryName");
  if (!descEl || !titleEl) return;
  titleEl.textContent = selectedTopCategory || "";
  descEl.textContent = TOP_CATEGORY_DESC[selectedTopCategory] || "";
}

function renderTopTypeCards() {
  const container = $("#topTypeCards");
  if (!container) return;
  container.innerHTML = "";
  const list = TOP_TYPES.filter((t) => (t.category || "기타") === selectedTopCategory);
  list.forEach((t) => {
    const standardPriceLine = getTopStandardPriceLine(t);
    const thicknessText = getTopAvailableThicknessText(t);
    const label = document.createElement("label");
    label.className = `card-base material-card${selectedTopType === t.id ? " selected" : ""}`;
    label.innerHTML = `
      <input type="radio" name="topType" value="${t.id}" ${selectedTopType === t.id ? "checked" : ""} />
      <div class="material-visual" style="background: ${t.swatch || "#ddd"}"></div>
      <div class="name">${t.name}</div>
      <div class="material-tier-heading">12T 기준</div>
      <div class="material-tier-line">${standardPriceLine}</div>
      <div class="material-tier-line is-consult">비규격 상담안내</div>
      <div class="size-heading">제작 가능 범위</div>
      <div class="size">두께 ${thicknessText}</div>
      <div class="size">12T 외 상담안내</div>
    `;
    container.appendChild(label);
  });
  container.onclick = (e) => {
    const input = e.target.closest('input[name="topType"]');
    if (!input) return;
    selectedTopType = input.value;
    updateSelectedTopTypeCard();
    renderTopTypeCards();
    closeTopTypeModal();
    updateTopThicknessOptions(selectedTopType);
    updateTopSizePlaceholders(selectedTopType);
    refreshTopEstimate();
  };
}

function renderOptions() {
  const container = $("#topOptionCards");
  if (!container) return;
  const section = container.closest(".selection-block");
  if (section) section.classList.toggle("hidden-step", !HAS_OPTION_SELECTIONS);
  container.innerHTML = "";
  if (!HAS_OPTION_SELECTIONS) {
    updatePreviewSummary(previewSummaryConfig);
    return;
  }
  TOP_OPTIONS.forEach((opt) => {
    const label = document.createElement("label");
    label.className = "card-base option-card";
    const { text: priceText, isConsult: isConsultOption } = getPricingDisplayMeta({
      config: opt,
    });
    label.innerHTML = `
      <input type="checkbox" value="${opt.id}" />
      <div class="material-visual"></div>
      <div class="name">${opt.name}</div>
      <div class="price${isConsultOption ? " is-consult" : ""}">${priceText}</div>
      ${descriptionHTML(opt.description)}
    `;
    container.appendChild(label);
  });
  // 초기 선택 상태 반영
  container.querySelectorAll("input[type='checkbox']").forEach((input) => {
    input.closest(".option-card")?.classList.toggle("selected", input.checked);
  });
  updatePreviewSummary(previewSummaryConfig);
  container.addEventListener("change", (e) => {
    const input = e.target.closest("input[type='checkbox']");
    if (!input) return;
    input.closest(".option-card")?.classList.toggle("selected", input.checked);
    updatePreviewSummary(previewSummaryConfig);
    refreshTopEstimate();
  });
}

function renderTopAddonCards() {
  const container = $("#topAddonCards");
  if (!container) return;
  container.innerHTML = "";
  const selectedIds = state.items.filter((it) => it.type === "addon").map((it) => it.addonId);
  state.addons = [...selectedIds];

  TOP_ADDON_ITEMS.forEach((item) => {
    const label = document.createElement("label");
    const isSelected = selectedIds.includes(item.id);
    label.className = `card-base addon-card${isSelected ? " selected" : ""}`;
    label.innerHTML = `
      <input type="checkbox" value="${item.id}" ${isSelected ? "checked" : ""} />
      <div class="material-visual"></div>
      <div class="name">${item.name}</div>
      <div class="price">${formatPrice(item.price)}원</div>
      ${descriptionHTML(item.description)}
    `;
    container.appendChild(label);
  });

  container.onchange = (e) => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    const id = input.value;
    if (input.checked) {
      addTopAddonItem(id);
    } else {
      removeTopAddonItem(id);
    }
    state.addons = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(
      (el) => el.value
    );
    updateSelectedTopAddonsDisplay();
    $$("#topAddonCards .addon-card").forEach((card) => card.classList.remove("selected"));
    state.addons.forEach((selectedId) => {
      const card = container.querySelector(`input[value="${selectedId}"]`)?.closest(".addon-card");
      card?.classList.add("selected");
    });
  };
}

function addTopAddonItem(addonId) {
  const existing = state.items.some((it) => it.type === "addon" && it.addonId === addonId);
  if (existing) return;
  const addon = TOP_ADDON_ITEMS.find((a) => a.id === addonId);
  if (!addon) return;
  const detail = calcAddonDetail(addon.price);
  state.items.push({
    id: crypto.randomUUID(),
    type: "addon",
    addonId,
    typeName: addon.name,
    quantity: 1,
    materialCost: detail.materialCost,
    processingCost: detail.processingCost,
    subtotal: detail.subtotal,
    vat: detail.vat,
    total: detail.total,
    displaySize: "-",
    optionsLabel: "-",
    servicesLabel: "-",
    serviceDetails: {},
    services: [],
  });
  renderTable();
  renderSummary();
  updateStepVisibility();
}

function removeTopAddonItem(addonId) {
  state.items = state.items.filter((it) => !(it.type === "addon" && it.addonId === addonId));
  renderTable();
  renderSummary();
  updateStepVisibility();
}

function updateSelectedTopAddonsDisplay() {
  renderSelectedAddonChips({
    targetId: "selectedTopAddonCard",
    addons: state.addons,
    allItems: TOP_ADDON_ITEMS,
    formatPrice,
  });
}

function syncTopAddonSelectionFromItems() {
  const selectedIds = state.items.filter((it) => it.type === "addon").map((it) => it.addonId);
  state.addons = [...selectedIds];
  updateSelectedTopAddonsDisplay();
  const container = $("#topAddonCards");
  if (!container) return;
  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const isSelected = selectedIds.includes(input.value);
    input.checked = isSelected;
    input.closest(".addon-card")?.classList.toggle("selected", isSelected);
  });
}

function updateServiceSummary(serviceId) {
  updateServiceSummaryChip({
    serviceId,
    services: SERVICES,
    serviceDetails: state.serviceDetails,
    formatSummaryText: formatServiceSummaryText,
  });
  updatePreviewSummary(previewSummaryConfig);
}

function renderServiceCards() {
  const container = $("#topServiceCards");
  if (!container) return;
  container.innerHTML = "";

  Object.values(SERVICES).forEach((srv) => {
    const label = document.createElement("label");
    label.className = "card-base service-card";
    const fallbackPriceText = srv.pricePerHole
      ? `개당 ${srv.pricePerHole.toLocaleString()}원`
      : srv.pricePerMeter
      ? `m당 ${srv.pricePerMeter.toLocaleString()}원`
      : srv.pricePerCorner
      ? `모서리당 ${srv.pricePerCorner.toLocaleString()}원`
      : srv.displayPriceText || "";
    const { text: priceText, isConsult: isConsultService } = getPricingDisplayMeta({
      config: srv,
      fallbackText: fallbackPriceText,
    });
    label.innerHTML = `
      <input type="checkbox" name="service" value="${srv.id}" />
      <div class="material-visual" style="background: ${srv.swatch || "#eee"}"></div>
      <div class="name">${srv.label}</div>
      <div class="price${isConsultService ? " is-consult" : ""}">${priceText}</div>
      ${descriptionHTML(srv.description)}
      <div class="service-actions">
        <div class="service-detail-chip" data-service-summary="${srv.id}">
          ${srv.hasDetail() ? "세부 옵션을 설정해주세요." : "추가 설정 없음"}
        </div>
      </div>
    `;
    container.appendChild(label);
  });

  Object.keys(SERVICES).forEach((id) => updateServiceSummary(id));
  syncProcessingSectionVisibility();
  if (!HAS_PROCESSING_SELECTIONS) return;

  container.addEventListener("change", (e) => {
    if (e.target.name === "service") {
      const serviceId = e.target.value;
      const srv = SERVICES[serviceId];
      const card = e.target.closest(".service-card");
      if (e.target.checked) {
        card?.classList.add("selected");
        if (serviceId === TOP_BACK_SHELF_SERVICE_ID) {
          openServiceModal(serviceId, e.target, "change");
          updatePreviewSummary(previewSummaryConfig);
          return;
        }
        if (srv?.hasDetail()) {
          openServiceModal(serviceId, e.target, "change");
        } else {
          state.serviceDetails[serviceId] = srv?.defaultDetail() || null;
          updateServiceSummary(serviceId);
          refreshTopEstimate();
        }
        updatePreviewSummary(previewSummaryConfig);
      } else {
        if (srv?.hasDetail()) {
          e.target.checked = true;
          openServiceModal(serviceId, e.target, "edit");
          return;
        }
        card?.classList.remove("selected");
        delete state.serviceDetails[serviceId];
        updateServiceSummary(serviceId);
        refreshTopEstimate();
        updatePreviewSummary(previewSummaryConfig);
      }
    }
  });

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".service-card");
    if (!card) return;
    const checkbox = card.querySelector('input[name="service"]');
    if (!checkbox) return;
    const serviceId = checkbox.value;
    if (serviceId === TOP_BACK_SHELF_SERVICE_ID) {
      e.preventDefault();
      e.stopPropagation();
      const wasChecked = checkbox.checked;
      if (!checkbox.checked) {
        checkbox.checked = true;
        card.classList.add("selected");
      }
      openServiceModal(serviceId, checkbox, wasChecked ? "edit" : "change");
      return;
    }
    const srv = SERVICES[serviceId];
    if (!srv?.hasDetail()) return;
    e.preventDefault();
    e.stopPropagation();
    const wasChecked = checkbox.checked;
    if (!checkbox.checked) {
      checkbox.checked = true;
      card.classList.add("selected");
      updateServiceSummary(serviceId);
      refreshTopEstimate();
      updateAddButtonState();
    }
    openServiceModal(serviceId, checkbox, wasChecked ? "edit" : "change");
  });
}

function renderTable() {
  renderEstimateTable({
    items: state.items,
    getName: (item) => {
      const isAddon = item.type === "addon";
      const addonInfo = isAddon ? TOP_ADDON_ITEMS.find((a) => a.id === item.addonId) : null;
      return escapeHtml(isAddon ? addonInfo?.name || "부자재" : item.typeName);
    },
    getTotalText: (item) => (item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`),
    getDetailLines: (item) => {
      const isAddon = item.type === "addon";
      const addonInfo = isAddon ? TOP_ADDON_ITEMS.find((a) => a.id === item.addonId) : null;
      if (isAddon) {
        return [
          `부자재 ${escapeHtml(addonInfo?.name || "부자재")}`,
          `상품가 ${item.materialCost.toLocaleString()}원`,
        ];
      }
      const baseCost = Math.max(0, item.materialCost - item.processingCost);
      const servicesText = formatServiceList(item.services, item.serviceDetails, { includeNote: true });
      const baseLines = buildEstimateDetailLines({
        sizeText: escapeHtml(item.displaySize),
        optionsText: escapeHtml(item.optionsLabel),
        servicesText: escapeHtml(servicesText || "-"),
        serviceLabel: "가공서비스",
        materialLabel: "상판비",
        materialCost: item.isCustomPrice ? null : baseCost,
        materialConsult: item.isCustomPrice,
        processingCost: item.isCustomPrice ? null : item.processingCost,
        processingConsult: item.isCustomPrice,
      });
      return baseLines;
    },
    onQuantityChange: (id, value) => updateItemQuantity(id, value),
    onDelete: (id) => {
      const removedItem = state.items.find((it) => it.id === id);
      state.items = state.items.filter((it) => it.id !== id);
      renderTable();
      renderSummary();
      updateStepVisibility();
      if (removedItem?.type === "addon") {
        syncTopAddonSelectionFromItems();
      }
    },
  });
  requestStickyOffsetUpdate();
}

function renderSummary() {
  const summary = buildGrandSummary();
  const grandTotal = summary.grandTotal;
  const hasConsult = summary.hasConsult;
  const suffix = hasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const grandEl = $("#grandTotal");
  if (grandEl) grandEl.textContent = `${grandTotal.toLocaleString()}${suffix}`;
  const serviceCostEl = $("#serviceCost");
  if (serviceCostEl) serviceCostEl.textContent = formatServiceCostText(summary.fulfillment);
  const naverUnits = Math.ceil(grandTotal / 1000) || 0;
  const naverEl = $("#naverUnits");
  if (naverEl) naverEl.textContent = `${naverUnits}${suffix}`;
  updateServiceStepUI();
  updateSendButtonEnabled();
}

function renderOrderCompleteDetails() {
  const container = $("#orderCompleteDetails");
  if (!container) return;
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();
  const materialsTotal = summary.materialsTotal;
  const grandTotal = summary.grandTotal;

  const itemsHtml =
    state.items.length === 0
      ? '<p class="item-line">담긴 항목이 없습니다.</p>'
      : state.items
          .map((item, idx) => {
            const servicesText = formatServiceList(item.services, item.serviceDetails, { includeNote: true });
            const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
            return `<p class="item-line">${idx + 1}. ${item.type === "addon" ? "부자재" : "상판"} ${escapeHtml(item.typeName)} x${item.quantity}${
              item.type === "addon"
                ? ""
                : ` · 크기 ${escapeHtml(item.displaySize)} · 옵션 ${escapeHtml(item.optionsLabel)} · 가공 ${escapeHtml(servicesText || "-")}`
            } · 금액 ${amountText}</p>`;
          })
          .join("");

  container.innerHTML = `
    <div class="complete-section">
      <h4>고객 정보</h4>
      <p>이름: ${escapeHtml(customer.name || "-")}</p>
      <p>연락처: ${escapeHtml(customer.phone || "-")}</p>
      <p>이메일: ${escapeHtml(customer.email || "-")}</p>
      <p>주소: ${escapeHtml(customer.postcode || "-")} ${escapeHtml(customer.address || "")} ${escapeHtml(customer.detailAddress || "")}</p>
      <p>요청사항: ${escapeHtml(customer.memo || "-")}</p>
    </div>
    <div class="complete-section">
      <h4>주문 품목</h4>
      ${itemsHtml}
    </div>
    <div class="complete-section">
      <h4>합계</h4>
      <p>예상 결제금액: ${grandTotal.toLocaleString()}원${
        summary.hasConsult ? CONSULT_EXCLUDED_SUFFIX : ""
      }</p>
      <p>서비스: ${escapeHtml(formatFulfillmentLine(summary.fulfillment))}</p>
    </div>
  `;
}

function setInlineFieldError({ fieldId, errorId, message = "", isError = false }) {
  const fieldEl = fieldId ? document.getElementById(fieldId) : null;
  const errorEl = errorId ? document.getElementById(errorId) : null;
  if (errorEl) {
    errorEl.textContent = message || "";
    errorEl.classList.toggle("error", Boolean(isError && message));
  }
  if (fieldEl) {
    fieldEl.classList.toggle("input-error", Boolean(isError && message));
  }
}

function updateLength3InputError({ shape, length3, type }) {
  if (!needsThirdLength(shape)) {
    setInlineFieldError({ fieldId: "topLength3", errorId: "topLength3Error" });
    return;
  }
  if (!length3) {
    setInlineFieldError({ fieldId: "topLength3", errorId: "topLength3Error" });
    return;
  }
  if (type?.minLength && length3 < type.minLength) {
    setInlineFieldError({
      fieldId: "topLength3",
      errorId: "topLength3Error",
      message: `길이3은 ${type.minLength}mm 이상으로 입력해주세요.`,
      isError: true,
    });
    return;
  }
  setInlineFieldError({ fieldId: "topLength3", errorId: "topLength3Error" });
}

function getBackHeightGuidanceText(width) {
  const availableHeight = getBackHeightLimit(width);
  return availableHeight > 0
    ? `가용높이 ${availableHeight}mm (상판 깊이 + 뒷턱 높이 ≤ ${TOP_STANDARD_WIDTH_MAX}mm, 초과 시 상담안내)`
    : `가용높이 0mm (현재 깊이 기준 무료 적용 불가, 상담안내)`;
}

function updateAddButtonState() {
  const btn = $("#calcTopBtn");
  if (!btn) return;
  const input = readTopInputs();
  const err = validateTopInputs(input);
  btn.disabled = Boolean(err);
}

function refreshTopEstimate() {
  const priceEl = $("#topEstimateText");
  const input = readTopInputs();
  const type = TOP_TYPES.find((t) => t.id === input.typeId);
  const needsSecond = needsSecondLength(input.shape);
  updateSizeErrors({
    widthId: "topDepth",
    lengthId: "topLength",
    length2Id: "topLength2",
    widthErrorId: "topDepthError",
    lengthErrorId: "topLengthError",
    length2ErrorId: "topLength2Error",
    widthMin: type?.minWidth,
    widthMax: null,
    lengthMin: type?.minLength,
    lengthMax: null,
    length2Min: type?.minLength,
    length2Max: null,
    enableLength2: needsSecond,
  });
  updateLength3InputError({ shape: input.shape, length3: input.length3, type });
  const detail = calcTopDetail(input);
  if (detail.error) {
    renderItemPriceNotice({ target: priceEl, text: detail.error });
    updateAddButtonState();
    updateTopPreview(input, null);
    return;
  }
  if (detail.isCustomPrice) {
    renderItemPriceDisplay({
      target: priceEl,
      totalLabel: "예상금액",
      totalText: "상담 안내",
      breakdownRows: buildStandardPriceBreakdownRows({
        itemHasConsult: true,
        optionHasConsult: true,
        serviceHasConsult: true,
      }),
    });
    updateAddButtonState();
    updateTopPreview(input, detail);
    return;
  }
  renderItemPriceDisplay({
    target: priceEl,
    totalLabel: "예상금액",
    totalAmount: detail.total,
    showConsultSuffix: detail.hasConsultItems,
    breakdownRows: buildStandardPriceBreakdownRows({
      itemCost: detail.itemCost,
      optionCost: detail.optionCost,
      serviceCost: detail.serviceCost,
      itemHasConsult: detail.itemHasConsult,
      optionHasConsult: detail.optionHasConsult,
      serviceHasConsult: detail.serviceHasConsult,
    }),
  });
  updateAddButtonState();
  updateTopPreview(input, detail);
}

function addTopItem() {
  const input = readTopInputs();
  const detail = calcTopDetail(input);
  if (detail.error) {
    showInfoModal(detail.error);
    updateAddButtonState();
    return;
  }
  const type = TOP_TYPES.find((t) => t.id === input.typeId);
  state.items.push({
    id: crypto.randomUUID(),
    typeId: input.typeId,
    typeName: type?.name || "상판",
    type: "top",
    shape: input.shape,
    width: input.width,
    length: input.length,
    length2: input.length2,
    length3: input.length3,
    thickness: input.thickness,
    options: input.options,
    backHeight: input.backHeight,
    useBackHeight: input.useBackHeight,
    services: input.services,
    serviceDetails: cloneServiceDetails(input.serviceDetails),
    quantity: 1,
    ...detail,
  });
  renderTable();
  renderSummary();
  renderItemPriceDisplay({
    target: "#topEstimateText",
    totalLabel: "예상금액",
    totalAmount: 0,
    breakdownRows: buildStandardPriceBreakdownRows(),
  });
  resetSelections();
  updateStepVisibility();
}

function resetSelections() {
  selectedTopType = "";
  selectedTopCategory = TOP_CATEGORIES[0] || "기타";
  state.addons = [];
  document.querySelectorAll('input[name="topType"]').forEach((el) => {
    el.checked = false;
    el.closest(".material-card")?.classList.remove("selected");
  });
  $("#kitchenShape").value = "";
  $("#topDepth").value = "";
  $("#topLength").value = "";
  $("#topLength2").value = "";
  $("#topLength3").value = "";
  $("#topThickness").value = "";
  setInlineFieldError({ fieldId: "topLength3", errorId: "topLength3Error" });
  document.querySelectorAll("#topOptionCards input[type='checkbox']").forEach((el) => {
    el.checked = false;
    el.closest(".option-card")?.classList.remove("selected");
  });
  clearProcessingServices();
  syncProcessingSectionVisibility();
  document.querySelectorAll("#topAddonCards input[type='checkbox']").forEach((el) => {
    el.checked = false;
    el.closest(".addon-card")?.classList.remove("selected");
  });
  updatePreviewSummary(previewSummaryConfig);
  updateSelectedTopTypeCard();
  updateSelectedTopAddonsDisplay();
  refreshTopEstimate();
  updateTopPreview(readTopInputs(), null);
}

function updateLength2Visibility() {
  const shape = $("#kitchenShape")?.value;
  const row2 = $("#topLength2Row");
  const row3 = $("#topLength3Row");
  const showLength2 = needsSecondLength(shape);
  const showLength3 = needsThirdLength(shape);
  if (row2) row2.classList.toggle("hidden-step", !showLength2);
  if (row3) row3.classList.toggle("hidden-step", !showLength3);
  if (!showLength2) {
    const length2El = $("#topLength2");
    if (length2El) length2El.value = "";
  }
  if (!showLength3) {
    const length3El = $("#topLength3");
    if (length3El) length3El.value = "";
    setInlineFieldError({ fieldId: "topLength3", errorId: "topLength3Error" });
  }
  refreshTopEstimate();
}

function updateStickyOffset() {
  const summary = document.getElementById("stepFinal");
  if (!summary) return;
  const body = summary.querySelector(".estimate-body");
  const prevDisplay = body?.style.display;
  if (body) body.style.display = "none";
  const height = summary.getBoundingClientRect().height;
  if (body) body.style.display = prevDisplay || "";
  document.documentElement.style.setProperty("--sticky-offset", `${Math.ceil(height) + 16}px`);
}

function requestStickyOffsetUpdate() {
  if (stickyOffsetTimer) cancelAnimationFrame(stickyOffsetTimer);
  stickyOffsetTimer = requestAnimationFrame(updateStickyOffset);
}

function requestTopPreviewUpdate() {
  if (previewResizeTimer) cancelAnimationFrame(previewResizeTimer);
  previewResizeTimer = requestAnimationFrame(() => {
    previewResizeTimer = null;
    refreshTopEstimate();
  });
}

function updateTopPreview(input, detail) {
  const colorEl = $("#topPreviewColor");
  const textEl = $("#topPreviewText");
  if (!colorEl || !textEl) return;

  const type = TOP_TYPES.find((t) => t.id === input.typeId);
  const needsSecond = needsSecondLength(input.shape);
  const needsThird = needsThirdLength(input.shape);
  const hasSize =
    input.width &&
    input.length &&
    input.thickness &&
    (!needsSecond || input.length2) &&
    (!needsThird || input.length3);

  // reset shape container
  colorEl.innerHTML = "";
  colorEl.classList.remove("l-shape-preview", "u-shape-preview");
  colorEl.style.clipPath = "none";

  if (!type || !hasSize || !detail) {
    colorEl.style.background = "#ddd";
    colorEl.style.width = "120px";
    colorEl.style.height = "120px";
    colorEl.style.setProperty("--cutout-alpha", "0");
    colorEl.style.setProperty("--cutout-w", "0px");
    colorEl.style.setProperty("--cutout-h", "0px");
    colorEl.style.clipPath = "none";
    textEl.textContent = "상판과 사이즈를 선택하면 미리보기가 표시됩니다.";
    return;
  }

  const swatchMap = {
    solid: "linear-gradient(135deg, #f5f5f5 0%, #d9d9d9 100%)",
    engineered: "linear-gradient(135deg, #f2f7ff 0%, #d6e4ff 100%)",
    stainless: "linear-gradient(135deg, #f0f0f0 0%, #c7c7c7 100%)",
  };
  const swatch = type.swatch || swatchMap[type.id] || "#ddd";
  const { maxPx, minPx } = getPreviewScaleBounds(colorEl, { fallbackMax: 180, fallbackMin: 40 });

  if (input.shape === "u") {
    const overallWidthMm = input.length;
    const overallHeightMm = Math.max(input.length2, input.length3, input.width);
    const scale = Math.min(maxPx / Math.max(overallWidthMm, overallHeightMm), 1);
    const widthPx = Math.max(12, input.width * scale);
    const length2Px = Math.max(widthPx, Math.max(minPx, input.length2 * scale));
    const length3Px = Math.max(widthPx, Math.max(minPx, input.length3 * scale));
    const overallPxW = Math.max(minPx, overallWidthMm * scale);
    const overallPxH = Math.max(length2Px, length3Px);

    colorEl.classList.add("u-shape-preview");
    colorEl.style.background = swatch;
    colorEl.style.width = `${overallPxW}px`;
    colorEl.style.height = `${overallPxH}px`;
    colorEl.style.clipPath = `polygon(
      0px 0px,
      ${overallPxW}px 0px,
      ${overallPxW}px ${length3Px}px,
      ${overallPxW - widthPx}px ${length3Px}px,
      ${overallPxW - widthPx}px ${widthPx}px,
      ${widthPx}px ${widthPx}px,
      ${widthPx}px ${length2Px}px,
      0px ${length2Px}px
    )`;
    colorEl.style.setProperty("--cutout-alpha", "0");
    colorEl.style.setProperty("--cutout-w", "0px");
    colorEl.style.setProperty("--cutout-h", "0px");
  } else if (needsSecond) {
    const overallWidthMm = input.length;
    const overallHeightMm = Math.max(input.width, input.length2);
    const scale = Math.min(maxPx / Math.max(overallWidthMm, overallHeightMm), 1);
    const widthPx = Math.max(12, input.width * scale);
    const length2Px = Math.max(minPx, input.length2 * scale);
    const overallPxW = Math.max(minPx, overallWidthMm * scale);
    const overallPxH = Math.max(widthPx, length2Px);
    const isL = input.shape === "l"; // ㄱ자 (세로 오른쪽), 역ㄱ자 (세로 왼쪽)

    colorEl.classList.add("l-shape-preview");
    colorEl.style.background = swatch;
    colorEl.style.width = `${overallPxW}px`;
    colorEl.style.height = `${overallPxH}px`;

    if (isL) {
      // ㄱ자: 세로가 오른쪽
      colorEl.style.clipPath = `polygon(
        0px 0px,
        ${overallPxW}px 0px,
        ${overallPxW}px ${length2Px}px,
        ${overallPxW - widthPx}px ${length2Px}px,
        ${overallPxW - widthPx}px ${widthPx}px,
        0px ${widthPx}px
      )`;
    } else {
      // 역ㄱ자: 세로가 왼쪽
      colorEl.style.clipPath = `polygon(
        ${overallPxW}px 0px,
        0px 0px,
        0px ${length2Px}px,
        ${widthPx}px ${length2Px}px,
        ${widthPx}px ${widthPx}px,
        ${overallPxW}px ${widthPx}px
      )`;
    }

    const cutoutW = Math.max(0, overallPxW - widthPx);
    const cutoutH = Math.max(0, length2Px - widthPx);
    const cutoutX = isL ? 0 : widthPx;
    const cutoutY = widthPx;
    const cutoutAlpha = cutoutW > 0 && cutoutH > 0 ? 1 : 0;
    colorEl.style.setProperty("--cutout-x", `${cutoutX}px`);
    colorEl.style.setProperty("--cutout-y", `${cutoutY}px`);
    colorEl.style.setProperty("--cutout-w", `${cutoutW}px`);
    colorEl.style.setProperty("--cutout-h", `${cutoutH}px`);
    colorEl.style.setProperty("--cutout-alpha", String(cutoutAlpha));

  } else {
    colorEl.style.background = swatch;
    colorEl.style.clipPath = "none";
    colorEl.style.setProperty("--cutout-alpha", "0");
    colorEl.style.setProperty("--cutout-w", "0px");
    colorEl.style.setProperty("--cutout-h", "0px");

    const { w, h } = getPreviewDimensions(input.length, input.width, maxPx, minPx);
    colorEl.style.width = `${w}px`;
    colorEl.style.height = `${h}px`;
  }

  if (input.shape === "u") {
    textEl.textContent = `${type.name} / ${input.width}×${input.length} & ${input.width}×${input.length2} & ${input.width}×${input.length3}×${input.thickness}mm`;
    return;
  }
  textEl.textContent = needsSecond
    ? `${type.name} / ${input.width}×${input.length} & ${input.width}×${input.length2}×${input.thickness}mm`
    : `${type.name} / ${input.width}×${input.length}×${input.thickness}mm`;
}

const serviceModalController = createServiceModalController({
  modalId: "#topServiceModal",
  titleId: "#topServiceModalTitle",
  bodyId: "#topServiceModalBody",
  errorId: "#topServiceModalError",
  noteId: "topServiceNote",
  focusTarget: "#topServiceModalTitle",
  services: SERVICES,
  state,
  getDefaultServiceDetail,
  cloneServiceDetails,
  updateServiceSummary,
  openModal,
  closeModal,
  onRevertSelection: () => {
    refreshTopEstimate();
    updateAddButtonState();
  },
  onAfterSave: () => {
    refreshTopEstimate();
    updateAddButtonState();
  },
  onAfterRemove: () => {
    refreshTopEstimate();
    updateAddButtonState();
  },
});

let activeCustomServiceModalId = null;
let backHeightModalContext = { triggerCheckbox: null, mode: null };

function setServiceModalError(message = "") {
  const errEl = $("#topServiceModalError");
  if (errEl) errEl.textContent = message || "";
}

function updateBackHeightModalGuidance() {
  const width = Number($("#topDepth")?.value || 0);
  const availableHeight = getBackHeightLimit(width);
  const hintEl = $("#topBackHeightModalHint");
  const statusEl = $("#topBackHeightModalStatus");
  const heightInput = Number($("#topBackHeightModalInput")?.value || 0);

  if (hintEl) {
    hintEl.textContent = getBackHeightGuidanceText(width);
  }
  if (!statusEl) return;

  statusEl.classList.remove("error");

  if (!heightInput) {
    statusEl.textContent = "높이를 입력하면 무료 범위/상담 안내 여부가 자동 계산됩니다.";
    return;
  }
  if (heightInput > TOP_BACK_HEIGHT_MAX) {
    statusEl.textContent = `입력값이 최대 ${TOP_BACK_HEIGHT_MAX}mm를 초과했습니다.`;
    statusEl.classList.add("error");
    return;
  }
  if (availableHeight <= 0) {
    statusEl.textContent = `현재 깊이 ${width}mm 기준 무료 뒷턱 불가 (저장 시 상담안내).`;
    return;
  }
  if (heightInput <= availableHeight) {
    statusEl.textContent = `입력 높이 ${heightInput}mm는 무료 범위입니다.`;
    return;
  }
  statusEl.textContent = `입력 높이 ${heightInput}mm는 가용높이 ${availableHeight}mm를 초과하여 상담안내 대상입니다.`;
}

function renderBackHeightModalBody() {
  const bodyEl = $("#topServiceModalBody");
  if (!bodyEl) return;
  const savedHeight = getBackHeightFromServiceDetail(state.serviceDetails?.[TOP_BACK_SHELF_SERVICE_ID]);
  bodyEl.innerHTML = `
    <p class="input-tip">뒷턱 높이를 입력해주세요. 높이는 최대 ${TOP_BACK_HEIGHT_MAX}mm까지 가능합니다.</p>
    <div class="form-row">
      <label for="topBackHeightModalInput">뒷턱 높이 (mm)</label>
      <div class="field-col">
        <input
          type="number"
          class="service-input"
          id="topBackHeightModalInput"
          placeholder="예: 40"
          min="0"
          max="${TOP_BACK_HEIGHT_MAX}"
          value="${savedHeight > 0 ? savedHeight : ""}"
        />
        <div class="error-msg" id="topBackHeightModalHint"></div>
        <div class="error-msg" id="topBackHeightModalStatus"></div>
      </div>
    </div>
  `;
  const modalInput = $("#topBackHeightModalInput");
  updateBackHeightModalGuidance();
  modalInput?.addEventListener("input", () => {
    setServiceModalError("");
    updateBackHeightModalGuidance();
  });
}

function openBackHeightServiceModal(triggerCheckbox, mode = "change") {
  activeCustomServiceModalId = TOP_BACK_SHELF_SERVICE_ID;
  backHeightModalContext = { triggerCheckbox, mode };
  const titleEl = $("#topServiceModalTitle");
  if (titleEl) {
    titleEl.textContent = SERVICES[TOP_BACK_SHELF_SERVICE_ID]?.label || "뒷턱/뒷선반 추가";
  }
  setServiceModalError("");
  renderBackHeightModalBody();
  openModal("#topServiceModal", { focusTarget: "#topServiceModalTitle" });
}

function closeBackHeightServiceModal(revertSelection = true) {
  closeModal("#topServiceModal");
  setServiceModalError("");
  if (revertSelection && backHeightModalContext.mode === "change" && backHeightModalContext.triggerCheckbox) {
    backHeightModalContext.triggerCheckbox.checked = false;
    backHeightModalContext.triggerCheckbox.closest(".service-card")?.classList.remove("selected");
    delete state.serviceDetails[TOP_BACK_SHELF_SERVICE_ID];
    updateServiceSummary(TOP_BACK_SHELF_SERVICE_ID);
    updatePreviewSummary(previewSummaryConfig);
    refreshTopEstimate();
    updateAddButtonState();
  }
  activeCustomServiceModalId = null;
  backHeightModalContext = { triggerCheckbox: null, mode: null };
}

function saveBackHeightServiceModal() {
  const heightInput = Number($("#topBackHeightModalInput")?.value || 0);
  const validation = validateBackHeightValue(heightInput);
  if (!validation.ok) {
    setServiceModalError(validation.message);
    return;
  }
  state.serviceDetails[TOP_BACK_SHELF_SERVICE_ID] = { height: validation.height };
  updateServiceSummary(TOP_BACK_SHELF_SERVICE_ID);
  refreshTopEstimate();
  updateAddButtonState();
  closeBackHeightServiceModal(false);
}

function removeBackHeightServiceModal() {
  const checkbox =
    backHeightModalContext.triggerCheckbox ||
    document.querySelector(
      `#topServiceCards input[name="service"][value="${TOP_BACK_SHELF_SERVICE_ID}"]`
    );
  if (checkbox) {
    checkbox.checked = false;
    checkbox.closest(".service-card")?.classList.remove("selected");
  }
  delete state.serviceDetails[TOP_BACK_SHELF_SERVICE_ID];
  updateServiceSummary(TOP_BACK_SHELF_SERVICE_ID);
  updatePreviewSummary(previewSummaryConfig);
  refreshTopEstimate();
  updateAddButtonState();
  closeBackHeightServiceModal(false);
}

function openServiceModal(serviceId, triggerCheckbox, mode = "change") {
  if (serviceId === TOP_BACK_SHELF_SERVICE_ID) {
    openBackHeightServiceModal(triggerCheckbox, mode);
    return;
  }
  activeCustomServiceModalId = null;
  serviceModalController.open(serviceId, triggerCheckbox, mode);
}

function closeServiceModal(revertSelection = true) {
  if (activeCustomServiceModalId === TOP_BACK_SHELF_SERVICE_ID) {
    closeBackHeightServiceModal(revertSelection);
    return;
  }
  serviceModalController.close(revertSelection);
}

function saveServiceModal() {
  if (activeCustomServiceModalId === TOP_BACK_SHELF_SERVICE_ID) {
    saveBackHeightServiceModal();
    return;
  }
  serviceModalController.save();
}

function removeServiceModal() {
  if (activeCustomServiceModalId === TOP_BACK_SHELF_SERVICE_ID) {
    removeBackHeightServiceModal();
    return;
  }
  serviceModalController.remove();
}

function updateItemQuantity(id, quantity) {
  const idx = state.items.findIndex((it) => it.id === id);
  if (idx === -1) return;
  const item = state.items[idx];
  const detail = calcTopDetail({
    typeId: item.typeId,
    shape: item.shape,
    width: item.width,
    length: item.length,
    length2: item.length2,
    length3: item.length3,
    thickness: item.thickness,
    options: item.options,
    backHeight: item.backHeight,
    useBackHeight: item.useBackHeight,
    services: item.services,
    serviceDetails: item.serviceDetails,
  });
  state.items[idx] = {
    ...item,
    quantity,
    total: detail.total * quantity,
    subtotal: detail.subtotal * quantity,
    vat: detail.vat * quantity,
    materialCost: detail.materialCost * quantity,
    processingCost: detail.processingCost * quantity,
    servicesLabel: detail.servicesLabel,
  };
  renderTable();
  renderSummary();
}

function showInfoModal(message) {
  const modal = $("#infoModal");
  const msgEl = $("#infoMessage");
  if (msgEl) msgEl.textContent = message;
  openModal(modal, { focusTarget: "#infoModalTitle" });
}

function closeInfoModal() {
  closeModal("#infoModal");
}

function updateStepVisibility(scrollTarget) {
  const step1 = $("#step1");
  const step2 = $("#step2");
  const stepPreview = $("#stepPreview");
  const step3Additional = $("#step3Additional");
  const step4 = $("#step4");
  const step5 = $("#step5");
  const actionCard = document.querySelector(".action-card");
  const navPrev = $("#prevStepsBtn");
  const navNext = $("#nextStepsBtn");
  const backToCenterBtn = $("#backToCenterBtn");
  const sendBtn = $("#sendQuoteBtn");
  const summaryCard = $("#stepFinal");
  const orderComplete = $("#orderComplete");
  const navActions = document.querySelector(".nav-actions");

  const showPhase1 = currentPhase === 1;
  const showPhase2 = currentPhase === 2;
  const showPhase3 = currentPhase === 3;

  if (orderCompleted) {
    [
      step1,
      step2,
      stepPreview,
      step3Additional,
      step4,
      step5,
      actionCard,
      summaryCard,
    ].forEach((el) => el?.classList.add("hidden-step"));
    navActions?.classList.add("hidden-step");
    orderComplete?.classList.remove("hidden-step");
    return;
  }

  [step1, step2, stepPreview, actionCard].forEach((el) => {
    el?.classList.toggle("hidden-step", !showPhase1);
  });
  step3Additional?.classList.toggle("hidden-step", !showPhase1 || !HAS_ADDITIONAL_SELECTIONS);
  step4?.classList.toggle("hidden-step", !showPhase2 || orderCompleted);
  step5?.classList.toggle("hidden-step", !showPhase3);

  if (navPrev) {
    navPrev.classList.toggle("hidden-step", currentPhase === 1);
    navPrev.style.display = currentPhase === 1 ? "none" : "";
  }
  if (sendBtn) {
    sendBtn.classList.toggle("hidden-step", !showPhase3);
    sendBtn.style.display = showPhase3 ? "" : "none";
  }
  if (backToCenterBtn) {
    backToCenterBtn.classList.toggle("hidden-step", !showPhase1);
    backToCenterBtn.style.display = showPhase1 ? "" : "none";
  }
  if (navNext) {
    navNext.classList.toggle("hidden-step", showPhase3);
    navNext.style.display = showPhase3 ? "none" : "";
  }

  if (scrollTarget) {
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function goToNextStep() {
  if (currentPhase === 1) {
    const hasTopItem = state.items.some((it) => it.type !== "addon");
    if (!hasTopItem) {
      showInfoModal("상판을 하나 이상 담아주세요.");
      return;
    }
    currentPhase = 2;
    updateStepVisibility(document.getElementById("step4"));
    updateServiceStepUI();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (currentPhase === 2) {
    const serviceError = validateServiceStep();
    if (serviceError) {
      setServiceStepError(serviceError);
      showInfoModal(serviceError);
      return;
    }
    currentPhase = 3;
    updateStepVisibility(document.getElementById("step5"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function goToPrevStep() {
  if (currentPhase === 1) return;
  if (currentPhase === 3) {
    currentPhase = 2;
    updateStepVisibility(document.getElementById("step4"));
  } else {
    currentPhase = 1;
    updateStepVisibility(document.getElementById("step1"));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetOrderCompleteUI() {
  orderCompleted = false;
  const orderComplete = $("#orderComplete");
  const navActions = document.querySelector(".nav-actions");
  ["step1", "step2", "stepPreview", "step3Additional", "step5", "stepFinal"].forEach(
    (id) => document.getElementById(id)?.classList.remove("hidden-step")
  );
  document.getElementById("step4")?.classList.add("hidden-step");
  navActions?.classList.remove("hidden-step");
  orderComplete?.classList.add("hidden-step");
}

function showOrderComplete() {
  renderOrderCompleteDetails();
  orderCompleted = true;
  updateStepVisibility();
}

function updateSendButtonEnabled() {
  const customer = getCustomerInfo();
  updateSendButtonEnabledShared({
    customer,
    hasItems: state.items.length > 0,
    onFinalStep: currentPhase === 3,
    hasConsent: isConsentChecked(),
    sending: sendingEmail,
  });
}

function buildEmailContent() {
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();
  const grandTotal = summary.grandTotal;

  const lines = [];
  lines.push("[고객 정보]");
  lines.push(`이름: ${customer.name || "-"}`);
  lines.push(`연락처: ${customer.phone || "-"}`);
  lines.push(`이메일: ${customer.email || "-"}`);
  lines.push(`주소: ${customer.postcode || "-"} ${customer.address || ""} ${customer.detailAddress || ""}`.trim());
  lines.push(`요청사항: ${customer.memo || "-"}`);
  lines.push("");
  lines.push("[주문 내역]");

  if (state.items.length === 0) {
    lines.push("담긴 항목 없음");
  } else {
    state.items.forEach((item, idx) => {
      const servicesText = formatServiceList(item.services, item.serviceDetails, { includeNote: true });
      const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
      lines.push(
        `${idx + 1}. ${item.typeName} x${item.quantity} | 크기 ${
          item.displaySize
        } | 옵션 ${item.optionsLabel} | 가공 ${servicesText || "-"} | 금액 ${amountText}`
      );
    });
  }

  lines.push("");
  lines.push("[합계]");
  const hasConsult = summary.hasConsult;
  const suffix = hasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const naverUnits = Math.ceil(grandTotal / 1000) || 0;
  lines.push(`서비스: ${formatFulfillmentLine(summary.fulfillment)}`);
  lines.push(`예상 결제금액: ${grandTotal.toLocaleString()}원${suffix}`);
  lines.push(`예상 네이버 결제수량: ${naverUnits}개`);

  const subject = `[GGR 상판 견적요청] ${customer.name || "고객명"} (${customer.phone || "연락처"})`;
  return {
    subject,
    body: lines.join("\n"),
    lines,
  };
}

function buildOrderPayload() {
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();
  const grandTotal = summary.grandTotal;
  const subtotal = summary.subtotal;
  const hasCustomPrice = summary.hasConsult;

  return {
    schemaVersion: ORDER_PAYLOAD_SCHEMA_VERSION,
    pageKey: "top",
    createdAt: new Date().toISOString(),
    customer: {
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      postcode: customer.postcode || "",
      address: customer.address || "",
      detailAddress: customer.detailAddress || "",
      memo: customer.memo || "",
    },
    totals: {
      grandTotal: Number(grandTotal || 0),
      subtotal: Number(subtotal || 0),
      fulfillmentType: summary.fulfillment.type || "",
      fulfillmentRegion: summary.fulfillment.region?.label || "",
      fulfillmentCost: Number(summary.fulfillmentCost || 0),
      fulfillmentConsult: Boolean(summary.fulfillment.isConsult),
      hasCustomPrice,
      displayPriceLabel: hasCustomPrice ? `상담안내${CONSULT_EXCLUDED_SUFFIX}` : null,
    },
    items: state.items.map((item) => {
      const isAddon = item.type === "addon";
      const addon = isAddon ? TOP_ADDON_ITEMS.find((candidate) => candidate.id === item.addonId) : null;
      return {
        lineId: item.id,
        itemType: isAddon ? "addon" : "product",
        name: isAddon ? addon?.name || "부자재" : item.typeName || "",
        quantity: Number(item.quantity || 1),
        typeId: isAddon ? null : item.typeId,
        dimensions: isAddon
          ? null
          : {
              shape: item.shape || "",
              thicknessMm: Number(item.thickness || 0),
              widthMm: Number(item.width || 0),
              lengthMm: Number(item.length || 0),
              length2Mm: Number(item.length2 || 0),
              length3Mm: Number(item.length3 || 0),
              backHeightMm: Number(item.backHeight || 0),
            },
        options: isAddon ? [] : Array.isArray(item.options) ? item.options : [],
        services: isAddon ? [] : Array.isArray(item.services) ? item.services : [],
        serviceDetails: isAddon ? {} : item.serviceDetails || {},
        pricing: buildConsultAwarePricing({
          materialCost: item.materialCost,
          processingCost: item.processingCost,
          total: item.total,
          isCustomPrice: Boolean(item.isCustomPrice),
        }),
      };
    }),
  };
}

async function sendQuote() {
  if (state.items.length === 0) {
    showInfoModal("담긴 항목이 없습니다. 상판을 담아주세요.");
    return;
  }
  const customer = getCustomerInfo();
  const customerError = validateCustomerInfo(customer);
  if (customerError) {
    showInfoModal(customerError);
    return;
  }
  const emailjsInstance = getEmailJSInstance(showInfoModal);
  if (!emailjsInstance) return;

  sendingEmail = true;
  updateSendButtonEnabled();

  const { subject, body, lines } = buildEmailContent();
  const payload = buildOrderPayload();
  const addressLine = `${customer.postcode || "-"} ${customer.address || ""} ${customer.detailAddress || ""}`.trim();
  const templateParams = {
    subject,
    message: `${body}\n\n주소: ${addressLine || "-"}`,
    customer_name: customer.name,
    customer_phone: customer.phone,
    customer_email: customer.email,
    customer_address: addressLine || "-",
    customer_memo: customer.memo || "-",
    order_lines: lines.join("\n"),
    order_payload_json: JSON.stringify(payload, null, 2),
  };

  try {
    await emailjsInstance.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    showOrderComplete();
  } catch (err) {
    console.error(err);
    const detail = err?.text || err?.message || "";
    showInfoModal(
      detail
        ? `주문 전송 중 오류가 발생했습니다.\n${detail}`
        : "주문 전송 중 오류가 발생했습니다. 다시 시도해주세요."
    );
  } finally {
    sendingEmail = false;
    updateSendButtonEnabled();
  }
}

function resetFlow() {
  resetOrderCompleteUI();
  sendingEmail = false;
  orderCompleted = false;
  state.items = [];
  state.addons = [];
  ["#customerName", "#customerPhone", "#customerEmail", "#customerMemo", "#sample6_postcode", "#sample6_address", "#sample6_detailAddress"].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  });
  setFulfillmentType("");
  setServiceStepError("");
  renderTable();
  renderSummary();
  resetSelections();
  currentPhase = 1;
  updateStepVisibility();
  updateSendButtonEnabled();
  renderTopAddonCards();
  updateSelectedTopAddonsDisplay();
  const consentEl = document.getElementById("privacyConsent");
  if (consentEl) consentEl.checked = false;
}

function initTop() {
  renderTopTypeTabs();
  renderTopTypeCards();
  renderOptions();
  renderTopAddonCards();
  renderServiceCards();
  syncProcessingSectionVisibility();
  initCollapsibleSections();
  renderTable();
  renderSummary();
  updateSelectedTopTypeCard();
  updateSelectedTopAddonsDisplay();
  updateTopThicknessOptions(selectedTopType);
  updateTopSizePlaceholders(selectedTopType);
  renderTopCategoryDesc();
  resetOrderCompleteUI();
  initEmailJS();
  updatePreviewSummary(previewSummaryConfig);
  const priceEl = $("#topEstimateText");
  if (priceEl) renderItemPriceNotice({ target: priceEl, text: "상판 타입을 선택해주세요." });

  $("#calcTopBtn").addEventListener("click", addTopItem);
  $("#openTopTypeModal").addEventListener("click", openTopTypeModal);
  $("#closeTopTypeModal").addEventListener("click", closeTopTypeModal);
  $("#topTypeModalBackdrop")?.addEventListener("click", closeTopTypeModal);
  $("#openTopAddonModal")?.addEventListener("click", openTopAddonModal);
  $("#closeTopAddonModal")?.addEventListener("click", closeTopAddonModal);
  $("#topAddonModalBackdrop")?.addEventListener("click", closeTopAddonModal);
  $("#nextStepsBtn")?.addEventListener("click", goToNextStep);
  $("#prevStepsBtn")?.addEventListener("click", goToPrevStep);
  $("#backToCenterBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  $("#sendQuoteBtn")?.addEventListener("click", sendQuote);
  $("#closeInfoModal")?.addEventListener("click", closeInfoModal);
  $("#infoModalBackdrop")?.addEventListener("click", closeInfoModal);
  $("#saveTopServiceModal")?.addEventListener("click", saveServiceModal);
  $("#removeTopServiceModal")?.addEventListener("click", removeServiceModal);
  $("#cancelTopServiceModal")?.addEventListener("click", () => closeServiceModal(true));
  $("#topServiceModalBackdrop")?.addEventListener("click", () => closeServiceModal(true));

  ["topDepth", "topLength", "topLength2", "topLength3", "topThickness", "kitchenShape"].forEach((id) => {
    const el = document.getElementById(id);
    el?.addEventListener("input", refreshTopEstimate);
    el?.addEventListener("change", refreshTopEstimate);
  });
  $("#kitchenShape")?.addEventListener("change", updateLength2Visibility);
  updateLength2Visibility();
  ["#customerName", "#customerPhone", "#customerEmail"].forEach((sel) => {
    const el = document.querySelector(sel);
    el?.addEventListener("input", updateSendButtonEnabled);
  });
  document.querySelectorAll("[data-fulfillment-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setFulfillmentType(btn.dataset.fulfillmentType);
      setServiceStepError("");
      updateServiceStepUI();
      renderSummary();
    });
  });
  ["#sample6_postcode", "#sample6_address", "#sample6_detailAddress"].forEach((sel) => {
    const el = document.querySelector(sel);
    el?.addEventListener("input", () => {
      setServiceStepError("");
      updateServiceStepUI();
      renderSummary();
      updateSendButtonEnabled();
    });
  });
  $("#resetFlowBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  document.getElementById("privacyConsent")?.addEventListener("change", updateSendButtonEnabled);
  updateAddButtonState();
  updateStepVisibility();
  setFulfillmentType(getFulfillmentType());
  updateServiceStepUI();
  updateSendButtonEnabled();
  updateTopPreview(readTopInputs(), null);
  requestStickyOffsetUpdate();
  $("#stepFinal .estimate-toggle")?.addEventListener("click", requestStickyOffsetUpdate);
  window.addEventListener("resize", () => {
    requestStickyOffsetUpdate();
    requestTopPreviewUpdate();
  });
}

function openTopTypeModal() {
  openModal("#topTypeModal", { focusTarget: "#topTypeModalTitle" });
}

function closeTopTypeModal() {
  closeModal("#topTypeModal");
}

function openTopAddonModal() {
  openModal("#topAddonModal", { focusTarget: "#topAddonModalTitle" });
}

function closeTopAddonModal() {
  closeModal("#topAddonModal");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTop);
} else {
  initTop();
}
