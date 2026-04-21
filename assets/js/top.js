import {
  EMAILJS_CONFIG,
  initEmailJS,
  openModal,
  closeModal,
  showInfoModal,
  bindModalOpenTriggers,
  bindModalCloseTriggers,
  getCustomerInfo,
  validateCustomerInfo,
  updateSendButtonEnabled as updateSendButtonEnabledShared,
  isConsentChecked,
  getEmailJSInstance,
  updateSizeErrors,
  renderEstimateTable,
  createProcessingServiceModalController,
  renderSelectedCard,
  buildMaterialVisualMarkup,
  renderSelectedAddonChips,
  updateProcessingServiceSummaryChip,
  initCollapsibleSections,
  updatePreviewSummary,
  buildEstimateDetailLines,
  buildConsultAwarePricing,
  buildBaseProductPricingExtraCosts,
  buildAddonLineItemDetail,
  CONSULT_EXCLUDED_SUFFIX,
  getPricingDisplayMeta,
  formatPricingRuleDisplayText,
  hasConsultLineItem,
  buildStandardPriceBreakdownRows,
  renderItemPriceDisplay,
  renderItemPriceNotice,
  initCustomerPhotoUploader,
  uploadCustomerPhotoFilesToCloudinary,
  UI_COLOR_FALLBACKS,
  validateFulfillmentStepSelection,
  buildCustomerEmailSectionLines,
  buildOrderPayloadBase,
  resolveThreePhaseNextTransition,
  resolveThreePhasePrevPhase,
  applyThreePhaseStepVisibility,
  buildSendQuoteTemplateParams,
} from "./shared.js";
import { createTopPricingHelpers } from "./top-pricing.js";
import {
  TOP_MATERIALS,
  TOP_PROCESSING_SERVICES,
  TOP_TYPES,
  TOP_OPTIONS,
  TOP_ADDON_ITEMS,
  TOP_DIMENSION_LIMITS,
  TOP_PRICING_POLICY,
} from "./data/top-data.js";
import { TOP_MEASUREMENT_GUIDES } from "./data/measurement-guides-data.js";
import {
  normalizeFulfillmentType,
  isFulfillmentAddressReady,
  evaluateFulfillmentPolicy,
  formatFulfillmentCostText,
  formatFulfillmentLine,
  formatFulfillmentCardPriceText,
} from "./fulfillment-policy.js";
import {
  FULFILLMENT_POLICY_MESSAGES,
  TOP_FULFILLMENT_POLICY,
} from "./data/fulfillment-policy-data.js";
import { resolveInstallationTravelZoneByAddress } from "./installation-travel-zone.js";
import { createMeasurementGuideModalController } from "./measurement-guide-core.js";
import { buildServiceModels } from "./service-models.js";

const PROCESSING_SERVICES = buildServiceModels(TOP_PROCESSING_SERVICES);
const OPTION_CATALOG = TOP_OPTIONS.reduce((acc, option) => {
  if (!option?.id) return acc;
  acc[option.id] = option;
  return acc;
}, {});

function cloneProcessingServiceDetails(details) {
  return JSON.parse(JSON.stringify(details || {}));
}

function getDefaultProcessingServiceDetail(serviceId) {
  const srv = PROCESSING_SERVICES[serviceId];
  if (!srv) return { note: "" };
  if (srv.hasDetail()) return { holes: [], note: "" };
  return cloneProcessingServiceDetails(srv.defaultDetail ? srv.defaultDetail() : { note: "" });
}

function formatProcessingServiceDetail(serviceId, detail, { includeNote = false } = {}) {
  const srv = PROCESSING_SERVICES[serviceId];
  const name = srv?.label || serviceId;
  if (!srv) return name;
  if (serviceId === TOP_BACK_SHELF_SERVICE_ID) {
    const height = getBackHeightFromServiceDetail(detail);
    return height > 0 ? `${name} (${height}mm)` : name;
  }
  if (!srv.hasDetail()) return name;
  return `${name} (${srv.formatDetail(detail, { includeNote })})`;
}

function formatProcessingServiceList(services, serviceDetails = {}, opts = {}) {
  if (!services || services.length === 0) return "-";
  return services
    .map((id) => formatProcessingServiceDetail(id, serviceDetails[id], opts))
    .filter(Boolean)
    .join(", ");
}

function formatProcessingServiceSummaryText(serviceId, detail) {
  const srv = PROCESSING_SERVICES[serviceId];
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
const TOP_CATEGORIES = Array.from(new Set(Object.values(TOP_MATERIALS).map((t) => t.category || "기타")));
let selectedTopCategory = TOP_CATEGORIES[0] || "기타";
let currentPhase = 1; // 1: 상판/가공, 2: 서비스, 3: 고객정보
const state = { items: [], processingServiceDetails: {}, addons: [] };
const previewSummaryConfig = {
  optionSelector: "#topOptionCards input:checked",
  processingServiceSelector: 'input[name="processingService"]:checked',
};
const HAS_OPTION_SELECTIONS = TOP_OPTIONS.length > 0;
const HAS_PROCESSING_SELECTIONS = Object.keys(PROCESSING_SERVICES).length > 0;
const HAS_ADDITIONAL_SELECTIONS = HAS_OPTION_SELECTIONS || HAS_PROCESSING_SELECTIONS;
const SWATCH_FALLBACK = UI_COLOR_FALLBACKS.swatch;
const SWATCH_MUTED_FALLBACK = UI_COLOR_FALLBACKS.swatchMuted;

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

function setFulfillmentStepError(message = "") {
  const errorEl = $("#fulfillmentStepError");
  if (!errorEl) return;
  const text = String(message || "").trim();
  errorEl.textContent = text;
  errorEl.classList.toggle("error", Boolean(text));
}

function getTopProductItems() {
  return state.items.filter((item) => item.type !== "addon");
}

function evaluateFulfillment(nextType = getFulfillmentType()) {
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
  const fulfillment = evaluateFulfillment();
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
    { id: "#fulfillmentCardPriceDelivery", fulfillment: evaluateFulfillment("delivery") },
    { id: "#fulfillmentCardPriceInstallation", fulfillment: evaluateFulfillment("installation") },
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

function updateFulfillmentStepUI({ showError = false } = {}) {
  const customer = getCustomerInfo();
  const addressReady = isFulfillmentAddressReady(customer);
  const regionHintEl = $("#fulfillmentRegionHint");
  const travelZone = resolveInstallationTravelZoneByAddress(customer);
  if (regionHintEl) {
    if (!addressReady) {
      regionHintEl.textContent = "주소를 입력하면 서비스 권역을 안내합니다.";
    } else if (travelZone.isMatched) {
      regionHintEl.textContent = `판별 권역: ${travelZone.zoneLabel}`;
    } else {
      regionHintEl.textContent = "판별 권역: 상담 안내";
    }
  }

  const fulfillment = evaluateFulfillment();
  const priceHintEl = $("#fulfillmentPriceHint");
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
    setFulfillmentStepError(validateFulfillmentStep());
  } else {
    setFulfillmentStepError("");
  }
}

function validateFulfillmentStep() {
  return validateFulfillmentStepSelection({
    customer: getCustomerInfo(),
    fulfillmentType: getFulfillmentType(),
    isAddressReady: isFulfillmentAddressReady,
  });
}

function clearProcessingServices() {
  document.querySelectorAll('#topProcessingServiceCards input[name="processingService"]').forEach((input) => {
    input.checked = false;
    input.closest(".processing-service-card")?.classList.remove("selected");
  });
  state.processingServiceDetails = {};
  Object.keys(PROCESSING_SERVICES).forEach((id) => updateProcessingServiceSummary(id));
}

function syncProcessingSectionVisibility() {
  const container = $("#topProcessingServiceCards");
  if (!container) return;
  const section = container.closest(".selection-block--input");
  if (section) section.classList.toggle("hidden-step", !HAS_PROCESSING_SELECTIONS);
  if (!HAS_PROCESSING_SELECTIONS) {
    updatePreviewSummary(previewSummaryConfig);
    return;
  }
  container.classList.remove("hidden-step");
  container.querySelectorAll('input[name="processingService"]').forEach((input) => {
    input.disabled = false;
  });
  updatePreviewSummary(previewSummaryConfig);
}

let sendingEmail = false;
let orderCompleted = false;
let customerPhotoUploader = null;
let stickyOffsetTimer = null;
let previewResizeTimer = null;
const DEFAULT_TOP_THICKNESSES = [12, 24, 30, 40, 50];
const TOP_CUSTOM_LENGTH_MAX = TOP_DIMENSION_LIMITS.maxLength;
const TOP_STANDARD_WIDTH_MAX = TOP_PRICING_POLICY.standardWidthMaxMm;
const TOP_BACK_HEIGHT_MAX = TOP_PRICING_POLICY.backShelfHeightMaxMm;
const TOP_BACK_SHELF_SERVICE_ID = "top_back_shelf";
const TOP_CATEGORY_DESC = TOP_PRICING_POLICY.categoryDescriptionByCategory;

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

function parsePxValue(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function setPreviewDimensionChipPosition(chipEl, { x = 0, y = 0 } = {}) {
  if (!(chipEl instanceof HTMLElement)) return;
  chipEl.style.left = `${Math.round(Number(x || 0) * 10) / 10}px`;
  chipEl.style.top = `${Math.round(Number(y || 0) * 10) / 10}px`;
}

function nudgePreviewDimensionChipIntoFrame(chipEl, frameEl, marginPx = 4) {
  if (!(chipEl instanceof HTMLElement) || !(frameEl instanceof HTMLElement)) return;
  const frameRect = frameEl.getBoundingClientRect();
  const chipRect = chipEl.getBoundingClientRect();
  if (!frameRect.width || !frameRect.height || !chipRect.width || !chipRect.height) return;
  let dx = 0;
  let dy = 0;
  if (chipRect.left < frameRect.left + marginPx) {
    dx = frameRect.left + marginPx - chipRect.left;
  } else if (chipRect.right > frameRect.right - marginPx) {
    dx = frameRect.right - marginPx - chipRect.right;
  }
  if (chipRect.top < frameRect.top + marginPx) {
    dy = frameRect.top + marginPx - chipRect.top;
  } else if (chipRect.bottom > frameRect.bottom - marginPx) {
    dy = frameRect.bottom - marginPx - chipRect.bottom;
  }
  if (!dx && !dy) return;
  setPreviewDimensionChipPosition(chipEl, {
    x: parsePxValue(chipEl.style.left) + dx,
    y: parsePxValue(chipEl.style.top) + dy,
  });
}

function getPreviewDimensionChipCenter(chipEl, frameEl) {
  if (!(chipEl instanceof HTMLElement) || !(frameEl instanceof HTMLElement)) {
    return { x: 0, y: 0 };
  }
  const frameRect = frameEl.getBoundingClientRect();
  const rect = chipEl.getBoundingClientRect();
  return {
    x: rect.left - frameRect.left + rect.width / 2,
    y: rect.top - frameRect.top + rect.height / 2,
  };
}

function arePreviewDimensionChipsOverlapping(firstEl, secondEl, gapPx = 4) {
  if (!(firstEl instanceof HTMLElement) || !(secondEl instanceof HTMLElement)) return false;
  const a = firstEl.getBoundingClientRect();
  const b = secondEl.getBoundingClientRect();
  return !(
    a.right + gapPx <= b.left ||
    a.left >= b.right + gapPx ||
    a.bottom + gapPx <= b.top ||
    a.top >= b.bottom + gapPx
  );
}

function getPreviewDimensionDistanceScore(point = {}, target = {}) {
  return Math.abs(Number(point.x || 0) - Number(target.x || 0)) +
    Math.abs(Number(point.y || 0) - Number(target.y || 0));
}

function clearPreviewDimensionChips(colorEl) {
  const frameEl = colorEl?.closest(".preview-frame");
  if (!frameEl) return;
  frameEl.querySelectorAll(".preview-dimension-chip").forEach((el) => el.remove());
}

function renderPreviewDimensionChips(colorEl, { widthMm = 0, lengthMm = 0 } = {}) {
  const frameEl = colorEl?.closest(".preview-frame");
  if (!frameEl) return;
  clearPreviewDimensionChips(colorEl);
  const roundedWidthMm = Math.round(Number(widthMm || 0));
  const roundedLengthMm = Math.round(Number(lengthMm || 0));
  if (roundedWidthMm <= 0 || roundedLengthMm <= 0) return;

  const frameRect = frameEl.getBoundingClientRect();
  const colorRect = colorEl.getBoundingClientRect();
  const inlineWidth = parsePxValue(colorEl.style.width, 0);
  const inlineHeight = parsePxValue(colorEl.style.height, 0);
  const targetWidth = inlineWidth > 0 ? inlineWidth : colorRect.width;
  const targetHeight = inlineHeight > 0 ? inlineHeight : colorRect.height;
  if (!frameRect.width || !frameRect.height || !targetWidth || !targetHeight) return;

  // Use target size from inline style to avoid chip jump while width/height transition is running.
  const colorBox = {
    left: (frameRect.width - targetWidth) / 2,
    top: (frameRect.height - targetHeight) / 2,
    width: targetWidth,
    height: targetHeight,
  };
  colorBox.right = colorBox.left + colorBox.width;
  colorBox.bottom = colorBox.top + colorBox.height;

  const horizontalChip = document.createElement("div");
  horizontalChip.className = "system-dimension-label preview-dimension-chip preview-dimension-chip--horizontal";
  horizontalChip.textContent = `${roundedWidthMm}mm`;

  const verticalChip = document.createElement("div");
  verticalChip.className = "system-dimension-label preview-dimension-chip preview-dimension-chip--vertical";
  verticalChip.textContent = `${roundedLengthMm}mm`;

  frameEl.append(horizontalChip, verticalChip);

  const gapPx = Math.max(5, Math.round(Math.min(colorBox.width, colorBox.height) * 0.08));
  const innerInsetPx = Math.max(8, Math.round(gapPx * 0.75));
  const preferredHorizontal = {
    x: colorBox.left + colorBox.width / 2,
    y: colorBox.top - gapPx,
  };
  const preferredVertical = {
    x: colorBox.right + gapPx,
    y: colorBox.top + colorBox.height / 2,
  };

  const horizontalCandidates = [
    preferredHorizontal,
    { x: colorBox.left + colorBox.width / 2, y: colorBox.bottom + gapPx },
    { x: colorBox.left + colorBox.width / 2, y: colorBox.top + innerInsetPx },
    { x: colorBox.left + colorBox.width / 2, y: colorBox.bottom - innerInsetPx },
  ];
  const verticalCandidates = [
    preferredVertical,
    { x: colorBox.left - gapPx, y: colorBox.top + colorBox.height / 2 },
    { x: colorBox.right - innerInsetPx, y: colorBox.top + colorBox.height / 2 },
    { x: colorBox.left + innerInsetPx, y: colorBox.top + colorBox.height / 2 },
    { x: colorBox.right + gapPx, y: colorBox.top + innerInsetPx },
    { x: colorBox.right + gapPx, y: colorBox.bottom - innerInsetPx },
    { x: colorBox.left - gapPx, y: colorBox.top + innerInsetPx },
    { x: colorBox.left - gapPx, y: colorBox.bottom - innerInsetPx },
  ];

  const marginPx = 4;
  let bestLayout = null;
  horizontalCandidates.forEach((horizontalPos) => {
    setPreviewDimensionChipPosition(horizontalChip, horizontalPos);
    nudgePreviewDimensionChipIntoFrame(horizontalChip, frameEl, marginPx);
    verticalCandidates.forEach((verticalPos) => {
      setPreviewDimensionChipPosition(verticalChip, verticalPos);
      nudgePreviewDimensionChipIntoFrame(verticalChip, frameEl, marginPx);
      const horizontalCenter = getPreviewDimensionChipCenter(horizontalChip, frameEl);
      const verticalCenter = getPreviewDimensionChipCenter(verticalChip, frameEl);
      const overlapPenalty = arePreviewDimensionChipsOverlapping(horizontalChip, verticalChip) ? 20000 : 0;
      const score =
        getPreviewDimensionDistanceScore(horizontalCenter, preferredHorizontal) +
        getPreviewDimensionDistanceScore(verticalCenter, preferredVertical) +
        overlapPenalty;
      if (!bestLayout || score < bestLayout.score) {
        bestLayout = {
          score,
          horizontal: {
            x: parsePxValue(horizontalChip.style.left),
            y: parsePxValue(horizontalChip.style.top),
          },
          vertical: {
            x: parsePxValue(verticalChip.style.left),
            y: parsePxValue(verticalChip.style.top),
          },
        };
      }
    });
  });

  if (!bestLayout) return;
  setPreviewDimensionChipPosition(horizontalChip, bestLayout.horizontal);
  setPreviewDimensionChipPosition(verticalChip, bestLayout.vertical);
  nudgePreviewDimensionChipIntoFrame(horizontalChip, frameEl, marginPx);
  nudgePreviewDimensionChipIntoFrame(verticalChip, frameEl, marginPx);
}

function renderUShapeDimensionChips(
  colorEl,
  {
    widthMm = 0,
    leftLengthMm = 0,
    rightLengthMm = 0,
    armWidthPx = 0,
    leftLegPx = 0,
    rightLegPx = 0,
  } = {}
) {
  const frameEl = colorEl?.closest(".preview-frame");
  if (!frameEl) return;
  clearPreviewDimensionChips(colorEl);
  const roundedWidthMm = Math.round(Number(widthMm || 0));
  const roundedLeftLengthMm = Math.round(Number(leftLengthMm || 0));
  const roundedRightLengthMm = Math.round(Number(rightLengthMm || 0));
  if (roundedWidthMm <= 0 || roundedLeftLengthMm <= 0 || roundedRightLengthMm <= 0) return;

  const frameRect = frameEl.getBoundingClientRect();
  const colorRect = colorEl.getBoundingClientRect();
  const inlineWidth = parsePxValue(colorEl.style.width, 0);
  const inlineHeight = parsePxValue(colorEl.style.height, 0);
  const targetWidth = inlineWidth > 0 ? inlineWidth : colorRect.width;
  const targetHeight = inlineHeight > 0 ? inlineHeight : colorRect.height;
  if (!frameRect.width || !frameRect.height || !targetWidth || !targetHeight) return;

  const colorBox = {
    left: (frameRect.width - targetWidth) / 2,
    top: (frameRect.height - targetHeight) / 2,
    width: targetWidth,
    height: targetHeight,
  };
  colorBox.right = colorBox.left + colorBox.width;
  colorBox.bottom = colorBox.top + colorBox.height;

  const safeArmWidthPx = Math.max(0, Math.min(colorBox.width, colorBox.height, Number(armWidthPx || 0)));
  const safeLeftLegPx = Math.max(safeArmWidthPx, Math.min(colorBox.height, Number(leftLegPx || 0)));
  const safeRightLegPx = Math.max(safeArmWidthPx, Math.min(colorBox.height, Number(rightLegPx || 0)));

  const horizontalChip = document.createElement("div");
  horizontalChip.className = "system-dimension-label preview-dimension-chip preview-dimension-chip--horizontal";
  horizontalChip.textContent = `${roundedWidthMm}mm`;

  const leftVerticalChip = document.createElement("div");
  leftVerticalChip.className = "system-dimension-label preview-dimension-chip preview-dimension-chip--vertical";
  leftVerticalChip.textContent = `${roundedLeftLengthMm}mm`;

  const rightVerticalChip = document.createElement("div");
  rightVerticalChip.className = "system-dimension-label preview-dimension-chip preview-dimension-chip--vertical";
  rightVerticalChip.textContent = `${roundedRightLengthMm}mm`;

  frameEl.append(horizontalChip, leftVerticalChip, rightVerticalChip);

  const gapPx = Math.max(4, Math.round(Math.min(colorBox.width, colorBox.height) * 0.05));
  const innerInsetPx = Math.max(8, Math.round(gapPx * 2));
  const leftMidY = colorBox.top + safeLeftLegPx / 2;
  const rightMidY = colorBox.top + safeRightLegPx / 2;

  const preferredHorizontal = {
    x: colorBox.left + colorBox.width / 2,
    y: colorBox.top - gapPx,
  };
  const preferredLeftVertical = {
    x: colorBox.left - gapPx,
    y: leftMidY,
  };
  const preferredRightVertical = {
    x: colorBox.right + gapPx,
    y: rightMidY,
  };

  const horizontalCandidates = [
    preferredHorizontal,
    { x: colorBox.left + colorBox.width / 2, y: colorBox.bottom + gapPx },
    { x: colorBox.left + colorBox.width / 2, y: colorBox.top + Math.max(innerInsetPx, safeArmWidthPx / 2) },
  ];
  const leftVerticalCandidates = [
    preferredLeftVertical,
    { x: colorBox.left + innerInsetPx, y: leftMidY },
    { x: colorBox.left + innerInsetPx, y: Math.max(colorBox.top + innerInsetPx, colorBox.top + safeArmWidthPx + gapPx) },
    { x: colorBox.left + innerInsetPx, y: Math.min(colorBox.bottom - innerInsetPx, colorBox.top + safeLeftLegPx - innerInsetPx) },
  ];
  const rightVerticalCandidates = [
    preferredRightVertical,
    { x: colorBox.right - innerInsetPx, y: rightMidY },
    { x: colorBox.right - innerInsetPx, y: Math.max(colorBox.top + innerInsetPx, colorBox.top + safeArmWidthPx + gapPx) },
    { x: colorBox.right - innerInsetPx, y: Math.min(colorBox.bottom - innerInsetPx, colorBox.top + safeRightLegPx - innerInsetPx) },
  ];

  const marginPx = 4;
  let bestLayout = null;
  horizontalCandidates.forEach((horizontalPos) => {
    setPreviewDimensionChipPosition(horizontalChip, horizontalPos);
    nudgePreviewDimensionChipIntoFrame(horizontalChip, frameEl, marginPx);

    leftVerticalCandidates.forEach((leftPos) => {
      setPreviewDimensionChipPosition(leftVerticalChip, leftPos);
      nudgePreviewDimensionChipIntoFrame(leftVerticalChip, frameEl, marginPx);

      rightVerticalCandidates.forEach((rightPos) => {
        setPreviewDimensionChipPosition(rightVerticalChip, rightPos);
        nudgePreviewDimensionChipIntoFrame(rightVerticalChip, frameEl, marginPx);

        const horizontalCenter = getPreviewDimensionChipCenter(horizontalChip, frameEl);
        const leftCenter = getPreviewDimensionChipCenter(leftVerticalChip, frameEl);
        const rightCenter = getPreviewDimensionChipCenter(rightVerticalChip, frameEl);
        const overlapPenalty =
          (arePreviewDimensionChipsOverlapping(horizontalChip, leftVerticalChip) ? 20000 : 0) +
          (arePreviewDimensionChipsOverlapping(horizontalChip, rightVerticalChip) ? 20000 : 0) +
          (arePreviewDimensionChipsOverlapping(leftVerticalChip, rightVerticalChip) ? 20000 : 0);
        const score =
          getPreviewDimensionDistanceScore(horizontalCenter, preferredHorizontal) +
          getPreviewDimensionDistanceScore(leftCenter, preferredLeftVertical) +
          getPreviewDimensionDistanceScore(rightCenter, preferredRightVertical) +
          overlapPenalty;

        if (!bestLayout || score < bestLayout.score) {
          bestLayout = {
            score,
            horizontal: {
              x: parsePxValue(horizontalChip.style.left),
              y: parsePxValue(horizontalChip.style.top),
            },
            leftVertical: {
              x: parsePxValue(leftVerticalChip.style.left),
              y: parsePxValue(leftVerticalChip.style.top),
            },
            rightVertical: {
              x: parsePxValue(rightVerticalChip.style.left),
              y: parsePxValue(rightVerticalChip.style.top),
            },
          };
        }
      });
    });
  });

  if (!bestLayout) return;
  setPreviewDimensionChipPosition(horizontalChip, bestLayout.horizontal);
  setPreviewDimensionChipPosition(leftVerticalChip, bestLayout.leftVertical);
  setPreviewDimensionChipPosition(rightVerticalChip, bestLayout.rightVertical);
  nudgePreviewDimensionChipIntoFrame(horizontalChip, frameEl, marginPx);
  nudgePreviewDimensionChipIntoFrame(leftVerticalChip, frameEl, marginPx);
  nudgePreviewDimensionChipIntoFrame(rightVerticalChip, frameEl, marginPx);
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
function formatPrice(n) {
  return Number(n || 0).toLocaleString();
}

function needsSecondLength(shape) {
  return shape === "l" || shape === "rl" || shape === "u";
}

function needsThirdLength(shape) {
  return shape === "u";
}

function getTopShapeLabel(shape) {
  return (
    {
      i: "ㅡ자",
      l: "ㄱ자",
      rl: "역ㄱ자",
      u: "ㄷ자",
    }[shape] || ""
  );
}

function getTopDimensionLimits(typeId) {
  const type = TOP_TYPES.find((item) => item.id === typeId);
  return {
    minWidth: Number(type?.minWidth ?? TOP_DIMENSION_LIMITS.minWidth),
    maxWidth: Number(type?.maxWidth ?? TOP_DIMENSION_LIMITS.maxWidth),
    minLength: Number(type?.minLength ?? TOP_DIMENSION_LIMITS.minLength),
    maxLength: Number(type?.maxLength ?? TOP_DIMENSION_LIMITS.maxLength),
  };
}

function hasBackShelfProcessingService(services = []) {
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

function getTopAvailableThicknessText(type) {
  const thicknesses = type?.availableThickness?.length ? type.availableThickness : DEFAULT_TOP_THICKNESSES;
  return thicknesses.map((t) => `${t}T`).join("/");
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

const measurementGuideController = createMeasurementGuideModalController({
  guides: TOP_MEASUREMENT_GUIDES,
  openModal,
  closeModal,
  escapeHtml,
});

function handleMeasurementGuideCarouselClick(event) {
  measurementGuideController.handleBodyClick(event);
}

function openMeasurementGuideModal(guideKey) {
  measurementGuideController.open(guideKey);
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
  const services = Array.from(document.querySelectorAll("#topProcessingServiceCards input:checked")).map(
    (el) => el.value
  );
  const serviceDetails = cloneProcessingServiceDetails(state.processingServiceDetails);
  const useBackHeight = hasBackShelfProcessingService(services);
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
  const type = TOP_TYPES.find((item) => item.id === typeId);
  if (!type) return "상판 타입을 선택해주세요.";
  if (!shape) return "주방 형태를 선택해주세요.";
  if (!width) return "깊이를 입력해주세요.";
  if (!length) return "길이를 입력해주세요.";
  if (needsSecondLength(shape) && !length2) {
    return shape === "u" ? "ㄷ자 형태일 때 길이2를 입력해주세요." : "ㄱ자 형태일 때 길이2를 입력해주세요.";
  }
  if (needsThirdLength(shape) && !length3) return "ㄷ자 형태일 때 길이3을 입력해주세요.";
  if (!thickness) return "두께를 입력해주세요.";
  const limits = getTopDimensionLimits(typeId);
  if (width < limits.minWidth) return `깊이는 최소 ${limits.minWidth}mm 입니다.`;
  if (length < limits.minLength) return `길이는 최소 ${limits.minLength}mm 입니다.`;
  if (needsSecondLength(shape)) {
    if (length2 < limits.minLength) return `길이2는 최소 ${limits.minLength}mm 입니다.`;
  }
  if (needsThirdLength(shape)) {
    if (length3 < limits.minLength) return `길이3은 최소 ${limits.minLength}mm 입니다.`;
  }
  if (useBackHeight) {
    const validation = validateBackHeightValue(backHeight);
    if (!validation.ok) return validation.message;
  }
  return null;
}

const {
  getBackHeightLimit,
  getTopStandardPriceLine,
  calcTopDetail,
} = createTopPricingHelpers({
  topTypes: TOP_TYPES,
  pricingPolicy: TOP_PRICING_POLICY,
  customLengthMax: TOP_CUSTOM_LENGTH_MAX,
  processingServices: PROCESSING_SERVICES,
  optionCatalog: OPTION_CATALOG,
  backShelfServiceId: TOP_BACK_SHELF_SERVICE_ID,
  validateTopInputs,
  formatProcessingServiceList,
  getBackHeightFromServiceDetail,
});

function updateSelectedTopTypeCard() {
  const type = TOP_TYPES.find((t) => t.id === selectedTopType);
  renderSelectedCard({
    cardId: "#selectedTopTypeCard",
    emptyTitle: "선택된 상판 없음",
    emptyMeta: "상판을 선택해주세요.",
    swatch: type?.swatch,
    imageUrl: type?.thumbnail,
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
  const limits = getTopDimensionLimits(typeId);
  const hasSelectedType = Boolean(typeId);

  widthEl.min = String(limits.minWidth);
  widthEl.max = String(limits.maxWidth);
  lengthEl.min = String(limits.minLength);
  lengthEl.max = String(limits.maxLength);
  if (length2El) {
    length2El.min = String(limits.minLength);
    length2El.max = String(limits.maxLength);
  }
  if (length3El) {
    length3El.min = String(limits.minLength);
    length3El.max = String(limits.maxLength);
  }

  if (!hasSelectedType) {
    widthEl.placeholder = "상판 타입을 선택해주세요.";
    lengthEl.placeholder = "상판 타입을 선택해주세요.";
    if (length2El) length2El.placeholder = "상판 타입을 선택해주세요.";
    if (length3El) length3El.placeholder = "상판 타입을 선택해주세요.";
    return;
  }

  widthEl.placeholder = `깊이 ${limits.minWidth}~${limits.maxWidth}mm`;
  lengthEl.placeholder = `길이 ${limits.minLength}~${limits.maxLength}mm`;
  if (length2El) length2El.placeholder = `길이2 ${limits.minLength}~${limits.maxLength}mm`;
  if (length3El) length3El.placeholder = `길이3 ${limits.minLength}~${limits.maxLength}mm`;
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
    const visualMarkup = buildMaterialVisualMarkup({
      swatch: t.swatch,
      imageUrl: t.thumbnail,
      fallbackSwatch: SWATCH_FALLBACK,
    });
    label.className = `card-base material-card${selectedTopType === t.id ? " selected" : ""}`;
    label.innerHTML = `
      <input type="radio" name="topType" value="${t.id}" ${selectedTopType === t.id ? "checked" : ""} />
      ${visualMarkup}
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
    const visualMarkup = buildMaterialVisualMarkup({
      swatch: opt.swatch,
      imageUrl: opt.thumbnail,
      fallbackSwatch: SWATCH_MUTED_FALLBACK,
    });
    label.innerHTML = `
      <input type="checkbox" value="${opt.id}" />
      ${visualMarkup}
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
    const priceText = formatPricingRuleDisplayText(item) || "0원";
    const visualMarkup = buildMaterialVisualMarkup({
      swatch: item.swatch,
      imageUrl: item.thumbnail,
      fallbackSwatch: SWATCH_MUTED_FALLBACK,
    });
    label.innerHTML = `
      <input type="checkbox" value="${item.id}" ${isSelected ? "checked" : ""} />
      ${visualMarkup}
      <div class="name">${item.name}</div>
      <div class="price">${priceText}</div>
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
  const detail = buildAddonLineItemDetail({ addon });
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

function updateProcessingServiceSummary(serviceId) {
  updateProcessingServiceSummaryChip({
    serviceId,
    processingServices: PROCESSING_SERVICES,
    processingServiceDetails: state.processingServiceDetails,
    formatSummaryText: formatProcessingServiceSummaryText,
  });
  updatePreviewSummary(previewSummaryConfig);
}

function renderProcessingServiceCards() {
  const container = $("#topProcessingServiceCards");
  if (!container) return;
  container.innerHTML = "";

  Object.values(PROCESSING_SERVICES).forEach((srv) => {
    const label = document.createElement("label");
    label.className = "card-base processing-service-card";
    const fallbackPriceText = formatPricingRuleDisplayText(srv) || srv.displayPriceText || "";
    const { text: priceText, isConsult: isConsultService } = getPricingDisplayMeta({
      config: srv,
      fallbackText: fallbackPriceText,
    });
    const visualMarkup = buildMaterialVisualMarkup({
      swatch: srv.swatch,
      imageUrl: srv.thumbnail,
      fallbackSwatch: SWATCH_MUTED_FALLBACK,
    });
    label.innerHTML = `
      <input type="checkbox" name="processingService" value="${srv.id}" />
      ${visualMarkup}
      <div class="name">${srv.label}</div>
      <div class="price${isConsultService ? " is-consult" : ""}">${priceText}</div>
      ${descriptionHTML(srv.description)}
      <div class="processing-service-actions">
        <div class="processing-service-detail-chip" data-processing-service-summary="${srv.id}">
          ${srv.hasDetail() ? "세부 옵션을 설정해주세요." : "추가 설정 없음"}
        </div>
      </div>
    `;
    container.appendChild(label);
  });

  Object.keys(PROCESSING_SERVICES).forEach((id) => updateProcessingServiceSummary(id));
  syncProcessingSectionVisibility();
  if (!HAS_PROCESSING_SELECTIONS) return;

  container.addEventListener("change", (e) => {
    if (e.target.name === "processingService") {
      const serviceId = e.target.value;
      const srv = PROCESSING_SERVICES[serviceId];
      const card = e.target.closest(".processing-service-card");
      if (e.target.checked) {
        card?.classList.add("selected");
        if (serviceId === TOP_BACK_SHELF_SERVICE_ID) {
          openProcessingServiceModal(serviceId, e.target, "change");
          updatePreviewSummary(previewSummaryConfig);
          return;
        }
        if (srv?.hasDetail()) {
          openProcessingServiceModal(serviceId, e.target, "change");
        } else {
          state.processingServiceDetails[serviceId] = srv?.defaultDetail() || null;
          updateProcessingServiceSummary(serviceId);
          refreshTopEstimate();
        }
        updatePreviewSummary(previewSummaryConfig);
      } else {
        if (srv?.hasDetail()) {
          e.target.checked = true;
          openProcessingServiceModal(serviceId, e.target, "edit");
          return;
        }
        card?.classList.remove("selected");
        delete state.processingServiceDetails[serviceId];
        updateProcessingServiceSummary(serviceId);
        refreshTopEstimate();
        updatePreviewSummary(previewSummaryConfig);
      }
    }
  });

  container.addEventListener("click", (e) => {
    const card = e.target.closest(".processing-service-card");
    if (!card) return;
    const checkbox = card.querySelector('input[name="processingService"]');
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
      openProcessingServiceModal(serviceId, checkbox, wasChecked ? "edit" : "change");
      return;
    }
    const srv = PROCESSING_SERVICES[serviceId];
    if (!srv?.hasDetail()) return;
    e.preventDefault();
    e.stopPropagation();
    const wasChecked = checkbox.checked;
    if (!checkbox.checked) {
      checkbox.checked = true;
      card.classList.add("selected");
      updateProcessingServiceSummary(serviceId);
      refreshTopEstimate();
      updateAddButtonState();
    }
    openProcessingServiceModal(serviceId, checkbox, wasChecked ? "edit" : "change");
  });
}

function renderTable() {
  renderEstimateTable({
    items: state.items,
    getName: (item) => {
      const isAddon = item.type === "addon";
      const addonInfo = isAddon ? TOP_ADDON_ITEMS.find((a) => a.id === item.addonId) : null;
      if (isAddon) return escapeHtml(addonInfo?.name || "부자재");
      const typeLabel = getTopShapeLabel(item.shape);
      const nameText = escapeHtml(item.typeName || "상판");
      if (!typeLabel) return nameText;
      return `<span class="estimate-name-chip">${escapeHtml(typeLabel)}</span> ${nameText}`;
    },
    getTotalText: (item) => (item.consultStatus === "consult" ? "상담 안내" : `${item.total.toLocaleString()}원`),
    getDetailLines: (item) => {
      const isAddon = item.type === "addon";
      const addonInfo = isAddon ? TOP_ADDON_ITEMS.find((a) => a.id === item.addonId) : null;
      if (isAddon) {
        return [
          `부자재 ${escapeHtml(addonInfo?.name || "부자재")}`,
          `상품가 ${item.materialCost.toLocaleString()}원`,
        ];
      }
      const processingServicesText = formatProcessingServiceList(item.services, item.serviceDetails, { includeNote: true });
      const baseLines = buildEstimateDetailLines({
        sizeText: escapeHtml(item.displaySize),
        optionsText: escapeHtml(item.optionsLabel),
        processingServicesText: escapeHtml(processingServicesText || "-"),
        processingServiceLabel: "가공서비스",
        materialLabel: "상판비",
        materialCost: item.consultStatus === "consult" ? null : item.materialCost,
        materialConsult: item.consultStatus === "consult",
        processingCost: item.consultStatus === "consult" ? null : item.processingCost,
        processingConsult: item.consultStatus === "consult",
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
  const productHasConsult = hasConsultLineItem(state.items);
  const productSuffix = productHasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const productTotal = Number(summary.subtotal || 0);
  const productTotalEl = $("#productTotal");
  if (productTotalEl) productTotalEl.textContent = `${productTotal.toLocaleString()}${productSuffix}`;
  const grandEl = $("#grandTotal");
  if (grandEl) grandEl.textContent = `${grandTotal.toLocaleString()}${suffix}`;
  const fulfillmentCostEl = $("#fulfillmentCost");
  if (fulfillmentCostEl) fulfillmentCostEl.textContent = formatFulfillmentCostText(summary.fulfillment);
  const naverUnits = Math.ceil(grandTotal / 1000) || 0;
  const naverEl = $("#naverUnits");
  if (naverEl) naverEl.textContent = `${naverUnits}${suffix}`;
  updateFulfillmentStepUI();
  updateSendButtonEnabled();
}

function buildCompleteDetailRowsHtml(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map(
      (row) => `
        <div class="complete-detail-row">
          <span class="complete-detail-label">${escapeHtml(row.label)}</span>
          <span class="complete-detail-value">${escapeHtml(row.value)}</span>
        </div>
      `
    )
    .join("");
}

function buildTopOrderCompleteDetailRows(item = {}) {
  const isAddon = item.type === "addon";
  const processingServicesText = isAddon
    ? "-"
    : formatProcessingServiceList(item.services, item.serviceDetails, { includeNote: true }) || "-";
  return [
    { label: "품목명", value: `${isAddon ? "부자재" : "상판"} ${item.typeName || "-"}` },
    { label: "수량", value: `${Math.max(1, Number(item.quantity || 1))}개` },
    { label: "사이즈", value: isAddon ? "-" : item.displaySize || "-" },
    { label: "옵션", value: isAddon ? "-" : item.optionsLabel || "-" },
    { label: "가공서비스", value: processingServicesText },
  ];
}

function renderOrderCompleteDetails() {
  const container = $("#orderCompleteDetails");
  if (!container) return;
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();
  const grandTotal = summary.grandTotal;
  const productHasConsult = hasConsultLineItem(state.items);
  const productSuffix = productHasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const productTotal = Number(summary.subtotal || 0);

  const itemsHtml =
    state.items.length === 0
      ? '<p class="item-line">담긴 항목이 없습니다.</p>'
      : state.items
          .map((item, idx) => {
            const detailRowsHtml = buildCompleteDetailRowsHtml(buildTopOrderCompleteDetailRows(item));
            return `
              <div class="complete-order-item">
                <p class="complete-item-title">품목 ${idx + 1}</p>
                <div class="complete-detail-list">
                  ${detailRowsHtml}
                </div>
              </div>
            `;
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
      <p>예상 제품금액: ${productTotal.toLocaleString()}원${productSuffix}</p>
      <p>배송/시공 서비스: ${escapeHtml(formatFulfillmentLine(summary.fulfillment))}</p>
      <p>예상 결제금액: ${grandTotal.toLocaleString()}원${
        summary.hasConsult ? CONSULT_EXCLUDED_SUFFIX : ""
      }</p>
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
  const sizeLimits = getTopDimensionLimits(input.typeId);
  const needsSecond = needsSecondLength(input.shape);
  updateSizeErrors({
    widthId: "topDepth",
    lengthId: "topLength",
    length2Id: "topLength2",
    widthErrorId: "topDepthError",
    lengthErrorId: "topLengthError",
    length2ErrorId: "topLength2Error",
    widthMin: sizeLimits.minWidth,
    widthMax: null,
    lengthMin: sizeLimits.minLength,
    lengthMax: null,
    length2Min: sizeLimits.minLength,
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
  if (detail.consultStatus === "consult") {
    renderItemPriceDisplay({
      target: priceEl,
      totalLabel: "예상금액",
      totalText: "상담 안내",
      breakdownRows: buildStandardPriceBreakdownRows({
        consultState: detail,
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
    showConsultSuffix: Boolean(detail?.consult?.hasItems ?? detail.hasConsultItems),
    breakdownRows: buildStandardPriceBreakdownRows({
      itemCost: detail.itemCost,
      optionCost: detail.optionCost,
      processingServiceCost: detail.processingServiceCost,
      consultState: detail,
    }),
  });
  updateAddButtonState();
  updateTopPreview(input, detail);
}

function addTopItem() {
  const input = readTopInputs();
  const detail = calcTopDetail({ ...input, includeDiscountMeta: true });
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
    serviceDetails: cloneProcessingServiceDetails(input.serviceDetails),
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
  clearPreviewDimensionChips(colorEl);

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
    colorEl.style.background = SWATCH_FALLBACK;
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
  const swatch = type.thumbnail
    ? `url('${String(type.thumbnail).replace(/'/g, "%27")}') center/cover no-repeat`
    : swatchMap[type.id] || SWATCH_FALLBACK;
  const { maxPx, minPx } = getPreviewScaleBounds(colorEl, { fallbackMax: 180, fallbackMin: 40 });
  let previewHorizontalMm = 0;
  let previewVerticalMm = 0;

  if (input.shape === "u") {
    const overallWidthMm = input.length;
    const overallHeightMm = Math.max(input.length2, input.length3, input.width);
    const scale = Math.min(maxPx / Math.max(overallWidthMm, overallHeightMm), 1);
    const widthPx = Math.max(12, input.width * scale);
    const rightLegPx = Math.max(widthPx, Math.max(minPx, input.length2 * scale));
    const leftLegPx = Math.max(widthPx, Math.max(minPx, input.length3 * scale));
    const overallPxW = Math.max(minPx, overallWidthMm * scale);
    const overallPxH = Math.max(rightLegPx, leftLegPx);

    colorEl.classList.add("u-shape-preview");
    colorEl.style.background = swatch;
    colorEl.style.width = `${overallPxW}px`;
    colorEl.style.height = `${overallPxH}px`;
    colorEl.style.clipPath = `polygon(
      0px 0px,
      ${overallPxW}px 0px,
      ${overallPxW}px ${rightLegPx}px,
      ${overallPxW - widthPx}px ${rightLegPx}px,
      ${overallPxW - widthPx}px ${widthPx}px,
      ${widthPx}px ${widthPx}px,
      ${widthPx}px ${leftLegPx}px,
      0px ${leftLegPx}px
    )`;
    colorEl.style.setProperty("--cutout-alpha", "0");
    colorEl.style.setProperty("--cutout-w", "0px");
    colorEl.style.setProperty("--cutout-h", "0px");
    previewHorizontalMm = overallWidthMm;
    previewVerticalMm = overallHeightMm;

    renderUShapeDimensionChips(colorEl, {
      widthMm: overallWidthMm,
      leftLengthMm: input.length3,
      rightLengthMm: input.length2,
      armWidthPx: widthPx,
      leftLegPx,
      rightLegPx,
    });
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
    previewHorizontalMm = overallWidthMm;
    previewVerticalMm = overallHeightMm;

  } else {
    colorEl.style.background = swatch;
    colorEl.style.clipPath = "none";
    colorEl.style.setProperty("--cutout-alpha", "0");
    colorEl.style.setProperty("--cutout-w", "0px");
    colorEl.style.setProperty("--cutout-h", "0px");

    const { w, h } = getPreviewDimensions(input.length, input.width, maxPx, minPx);
    colorEl.style.width = `${w}px`;
    colorEl.style.height = `${h}px`;
    previewHorizontalMm = input.length;
    previewVerticalMm = input.width;

    renderPreviewDimensionChips(colorEl, { widthMm: previewHorizontalMm, lengthMm: previewVerticalMm });
  }

  if (needsSecond && input.shape !== "u") {
    renderPreviewDimensionChips(colorEl, { widthMm: previewHorizontalMm, lengthMm: previewVerticalMm });
  }

  if (input.shape === "u") {
    textEl.textContent = `${type.name} / ${input.width}×${input.length} & ${input.width}×${input.length2} & ${input.width}×${input.length3}×${input.thickness}mm`;
    return;
  }
  textEl.textContent = needsSecond
    ? `${type.name} / ${input.width}×${input.length} & ${input.width}×${input.length2}×${input.thickness}mm`
    : `${type.name} / ${input.width}×${input.length}×${input.thickness}mm`;
}

const processingServiceModalController = createProcessingServiceModalController({
  modalId: "#topProcessingServiceModal",
  titleId: "#topProcessingServiceModalTitle",
  bodyId: "#topProcessingServiceModalBody",
  errorId: "#topProcessingServiceModalError",
  noteId: "topProcessingServiceNote",
  focusTarget: "#topProcessingServiceModalTitle",
  processingServices: PROCESSING_SERVICES,
  state,
  getDefaultProcessingServiceDetail,
  cloneProcessingServiceDetails,
  updateProcessingServiceSummary,
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

let activeCustomProcessingServiceModalId = null;
let backHeightModalContext = { triggerCheckbox: null, mode: null };

function setProcessingServiceModalError(message = "") {
  const errEl = $("#topProcessingServiceModalError");
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
  const bodyEl = $("#topProcessingServiceModalBody");
  if (!bodyEl) return;
  const savedHeight = getBackHeightFromServiceDetail(state.processingServiceDetails?.[TOP_BACK_SHELF_SERVICE_ID]);
  bodyEl.innerHTML = `
    <p class="input-tip">뒷턱 높이를 입력해주세요. 높이는 최대 ${TOP_BACK_HEIGHT_MAX}mm까지 가능합니다.</p>
    <div class="form-row">
      <label for="topBackHeightModalInput">뒷턱 높이 (mm)</label>
      <div class="field-col">
        <input
          type="number"
          class="processing-service-input"
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
    setProcessingServiceModalError("");
    updateBackHeightModalGuidance();
  });
}

function openBackHeightProcessingServiceModal(triggerCheckbox, mode = "change") {
  activeCustomProcessingServiceModalId = TOP_BACK_SHELF_SERVICE_ID;
  backHeightModalContext = { triggerCheckbox, mode };
  const titleEl = $("#topProcessingServiceModalTitle");
  if (titleEl) {
    titleEl.textContent = PROCESSING_SERVICES[TOP_BACK_SHELF_SERVICE_ID]?.label || "뒷턱/뒷선반 추가";
  }
  setProcessingServiceModalError("");
  renderBackHeightModalBody();
  openModal("#topProcessingServiceModal", { focusTarget: "#topProcessingServiceModalTitle" });
}

function closeBackHeightProcessingServiceModal(revertSelection = true) {
  closeModal("#topProcessingServiceModal");
  setProcessingServiceModalError("");
  if (revertSelection && backHeightModalContext.mode === "change" && backHeightModalContext.triggerCheckbox) {
    backHeightModalContext.triggerCheckbox.checked = false;
    backHeightModalContext.triggerCheckbox.closest(".processing-service-card")?.classList.remove("selected");
    delete state.processingServiceDetails[TOP_BACK_SHELF_SERVICE_ID];
    updateProcessingServiceSummary(TOP_BACK_SHELF_SERVICE_ID);
    updatePreviewSummary(previewSummaryConfig);
    refreshTopEstimate();
    updateAddButtonState();
  }
  activeCustomProcessingServiceModalId = null;
  backHeightModalContext = { triggerCheckbox: null, mode: null };
}

function saveBackHeightProcessingServiceModal() {
  const heightInput = Number($("#topBackHeightModalInput")?.value || 0);
  const validation = validateBackHeightValue(heightInput);
  if (!validation.ok) {
    setProcessingServiceModalError(validation.message);
    return;
  }
  state.processingServiceDetails[TOP_BACK_SHELF_SERVICE_ID] = { height: validation.height };
  updateProcessingServiceSummary(TOP_BACK_SHELF_SERVICE_ID);
  refreshTopEstimate();
  updateAddButtonState();
  closeBackHeightProcessingServiceModal(false);
}

function removeBackHeightProcessingServiceModal() {
  const checkbox =
    backHeightModalContext.triggerCheckbox ||
    document.querySelector(
      `#topProcessingServiceCards input[name="processingService"][value="${TOP_BACK_SHELF_SERVICE_ID}"]`
    );
  if (checkbox) {
    checkbox.checked = false;
    checkbox.closest(".processing-service-card")?.classList.remove("selected");
  }
  delete state.processingServiceDetails[TOP_BACK_SHELF_SERVICE_ID];
  updateProcessingServiceSummary(TOP_BACK_SHELF_SERVICE_ID);
  updatePreviewSummary(previewSummaryConfig);
  refreshTopEstimate();
  updateAddButtonState();
  closeBackHeightProcessingServiceModal(false);
}

function openProcessingServiceModal(serviceId, triggerCheckbox, mode = "change") {
  if (serviceId === TOP_BACK_SHELF_SERVICE_ID) {
    openBackHeightProcessingServiceModal(triggerCheckbox, mode);
    return;
  }
  activeCustomProcessingServiceModalId = null;
  processingServiceModalController.open(serviceId, triggerCheckbox, mode);
}

function closeProcessingServiceModal(revertSelection = true) {
  if (activeCustomProcessingServiceModalId === TOP_BACK_SHELF_SERVICE_ID) {
    closeBackHeightProcessingServiceModal(revertSelection);
    return;
  }
  processingServiceModalController.close(revertSelection);
}

function saveProcessingServiceModal() {
  if (activeCustomProcessingServiceModalId === TOP_BACK_SHELF_SERVICE_ID) {
    saveBackHeightProcessingServiceModal();
    return;
  }
  processingServiceModalController.save();
}

function removeProcessingServiceModal() {
  if (activeCustomProcessingServiceModalId === TOP_BACK_SHELF_SERVICE_ID) {
    removeBackHeightProcessingServiceModal();
    return;
  }
  processingServiceModalController.remove();
}

function updateItemQuantity(id, quantity) {
  const idx = state.items.findIndex((it) => it.id === id);
  if (idx === -1) return;
  const item = state.items[idx];
  if (item.type === "addon") {
    const addon = TOP_ADDON_ITEMS.find((a) => a.id === item.addonId);
    if (!addon) return;
    const detail = buildAddonLineItemDetail({ addon, quantity });
    state.items[idx] = { ...item, quantity, ...detail };
    renderTable();
    renderSummary();
    return;
  }
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
    quantity,
    includeDiscountMeta: true,
  });
  state.items[idx] = {
    ...item,
    quantity,
    ...detail,
    servicesLabel: detail.servicesLabel,
  };
  renderTable();
  renderSummary();
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
  applyThreePhaseStepVisibility({
    currentPhase,
    orderCompleted,
    resetOrderCompleteUI,
    phase1Elements: [step1, step2, stepPreview, actionCard],
    additionalPhase1Element: step3Additional,
    showAdditionalPhase1: HAS_ADDITIONAL_SELECTIONS,
    phase2Element: step4,
    phase3Element: step5,
    summaryCard,
    summaryCompleteClass: "order-complete-visible",
    restoreSummaryOnActive: true,
    orderCompleteElement: orderComplete,
    navActionsElement: navActions,
    prevButton: navPrev,
    nextButton: navNext,
    sendButton: sendBtn,
    backToCenterButton: backToCenterBtn,
    completedActionButtons: [sendBtn, navNext],
    completedHiddenElements: [
      step1,
      step2,
      stepPreview,
      step3Additional,
      step4,
      step5,
      actionCard,
      summaryCard,
    ],
    scrollTarget,
  });
}

function goToNextStep() {
  const transition = resolveThreePhaseNextTransition({
    currentPhase,
    phase1Ready: state.items.some((it) => it.type !== "addon"),
    phase1ErrorMessage: "상판을 하나 이상 담아주세요.",
    validatePhase2: validateFulfillmentStep,
  });

  if (transition.errorMessage) {
    if (transition.errorStage === "phase2") {
      setFulfillmentStepError(transition.errorMessage);
    }
    showInfoModal(transition.errorMessage);
    return;
  }

  if (transition.nextPhase === 2 && currentPhase !== 2) {
    currentPhase = 2;
    updateStepVisibility(document.getElementById("step4"));
    updateFulfillmentStepUI();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (transition.nextPhase === 3 && currentPhase !== 3) {
    currentPhase = 3;
    updateStepVisibility(document.getElementById("step5"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function goToPrevStep() {
  const prevPhase = resolveThreePhasePrevPhase(currentPhase);
  if (prevPhase === currentPhase) return;
  currentPhase = prevPhase;
  updateStepVisibility(
    currentPhase === 2 ? document.getElementById("step4") : document.getElementById("step1")
  );
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetOrderCompleteUI() {
  orderCompleted = false;
  const orderComplete = $("#orderComplete");
  const navActions = document.querySelector(".nav-actions");
  const summaryCard = document.getElementById("stepFinal");
  ["step1", "step2", "stepPreview", "step3Additional", "step5", "stepFinal"].forEach(
    (id) => document.getElementById(id)?.classList.remove("hidden-step")
  );
  document.getElementById("step4")?.classList.add("hidden-step");
  navActions?.classList.remove("hidden-step");
  orderComplete?.classList.add("hidden-step");
  summaryCard?.classList.remove("order-complete-visible");
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

function buildEmailContent({ customerPhotoUploads = [], customerPhotoErrors = [] } = {}) {
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();
  const grandTotal = summary.grandTotal;

  const lines = buildCustomerEmailSectionLines({
    customer,
    customerPhotoUploads,
    customerPhotoErrors,
  });
  lines.push("");
  lines.push("=== 주문 내역 ===");

  if (state.items.length === 0) {
    lines.push("- 담긴 항목 없음");
  } else {
    state.items.forEach((item, idx) => {
      lines.push(`${idx + 1}) 품목`);
      buildTopOrderCompleteDetailRows(item).forEach((row) => {
        lines.push(`- ${row.label}: ${row.value}`);
      });
      if (idx < state.items.length - 1) {
        lines.push("");
        lines.push("------------------------------");
        lines.push("");
      }
    });
  }

  lines.push("");
  lines.push("=== 합계 ===");
  const hasConsult = summary.hasConsult;
  const suffix = hasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const productHasConsult = hasConsultLineItem(state.items);
  const productSuffix = productHasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const productTotal = Number(summary.subtotal || 0);
  const naverUnits = Math.ceil(grandTotal / 1000) || 0;
  lines.push(`예상 제품금액: ${productTotal.toLocaleString()}원${productSuffix}`);
  lines.push(`배송/시공 서비스: ${formatFulfillmentLine(summary.fulfillment)}`);
  lines.push(`예상 결제금액: ${grandTotal.toLocaleString()}원${suffix}`);
  lines.push(`예상 네이버 결제수량: ${naverUnits}개`);

  const subject = `[GGR 상판 견적요청] ${customer.name || "고객명"} (${customer.phone || "연락처"})`;
  return {
    subject,
    body: lines.join("\n"),
    lines,
  };
}

function buildOrderPayload({ customerPhotoUploads = [] } = {}) {
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();

  return {
    ...buildOrderPayloadBase({
      pageKey: "top",
      customer,
      summary,
      customerPhotoUploads,
    }),
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
          consultState: item,
          extraCosts: buildBaseProductPricingExtraCosts(item),
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

  const selectedCustomerPhotos = customerPhotoUploader?.getSelectedFiles?.() || [];
  const customerPhotoUploadResult = await uploadCustomerPhotoFilesToCloudinary({
    files: selectedCustomerPhotos,
    pageKey: "top",
  });
  const customerPhotoUploads = Array.isArray(customerPhotoUploadResult?.uploaded)
    ? customerPhotoUploadResult.uploaded
    : [];
  const customerPhotoErrors = Array.isArray(customerPhotoUploadResult?.failed)
    ? customerPhotoUploadResult.failed
    : [];

  const { subject, body, lines } = buildEmailContent({
    customerPhotoUploads,
    customerPhotoErrors,
  });
  const orderTimeText = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date());
  const payload = buildOrderPayload({ customerPhotoUploads });
  const templateParams = buildSendQuoteTemplateParams({
    customer,
    orderTimeText,
    subject,
    message: body,
    orderLines: lines,
    payload,
    customerPhotoUploads,
    customerPhotoErrors,
  });

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
  customerPhotoUploader?.clear?.();
  setFulfillmentType("");
  setFulfillmentStepError("");
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
  renderProcessingServiceCards();
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
  customerPhotoUploader = initCustomerPhotoUploader({
    showInfoModal,
    onChange: () => updateSendButtonEnabled(),
  });
  updatePreviewSummary(previewSummaryConfig);
  const priceEl = $("#topEstimateText");
  if (priceEl) renderItemPriceNotice({ target: priceEl, text: "상판 타입을 선택해주세요." });

  bindModalOpenTriggers();
  bindModalCloseTriggers();
  $("#calcTopBtn").addEventListener("click", addTopItem);
  $("#nextStepsBtn")?.addEventListener("click", goToNextStep);
  $("#prevStepsBtn")?.addEventListener("click", goToPrevStep);
  $("#backToCenterBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  $("#sendQuoteBtn")?.addEventListener("click", sendQuote);
  $("#measurementGuideModalBody")?.addEventListener("click", handleMeasurementGuideCarouselClick);
  $("#saveTopProcessingServiceModal")?.addEventListener("click", saveProcessingServiceModal);
  $("#removeTopProcessingServiceModal")?.addEventListener("click", removeProcessingServiceModal);
  $("#cancelTopProcessingServiceModal")?.addEventListener("click", () => closeProcessingServiceModal(true));
  $("#topProcessingServiceModalBackdrop")?.addEventListener("click", () => closeProcessingServiceModal(true));

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
      setFulfillmentStepError("");
      updateFulfillmentStepUI();
      renderSummary();
    });
  });
  ["#sample6_postcode", "#sample6_address", "#sample6_detailAddress"].forEach((sel) => {
    const el = document.querySelector(sel);
    el?.addEventListener("input", () => {
      setFulfillmentStepError("");
      updateFulfillmentStepUI();
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
  updateFulfillmentStepUI();
  updateSendButtonEnabled();
  updateTopPreview(readTopInputs(), null);
  requestStickyOffsetUpdate();
  $("#stepFinal .estimate-toggle")?.addEventListener("click", requestStickyOffsetUpdate);
  window.addEventListener("resize", () => {
    requestStickyOffsetUpdate();
    requestTopPreviewUpdate();
  });
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const guideBtn = target?.closest("[data-measurement-guide]");
    if (!guideBtn) return;
    openMeasurementGuideModal(guideBtn.dataset.measurementGuide || "");
  });
}

function closeTopTypeModal() {
  closeModal("#topTypeModal");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTop);
} else {
  initTop();
}
