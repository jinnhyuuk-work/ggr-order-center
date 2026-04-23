import {
  DOOR_MATERIALS as MATERIALS,
  DOOR_PROCESSING_SERVICES as DOOR_PROCESSING_SERVICE_DATA,
  DOOR_OPTIONS,
  DOOR_ADDON_ITEMS as BOARD_ADDON_ITEMS,
  DOOR_CATEGORY_META_BY_CATEGORY as CATEGORY_META_BY_CATEGORY,
  DOOR_PRICE_TIERS_BY_CATEGORY,
  DOOR_PRICING_POLICY,
  DOOR_TYPE_OPTIONS,
  DOOR_SIDE_THICKNESS_OPTIONS,
  DOOR_DIMENSION_LIMITS,
  getDoorOptionIdsForCategory,
  getDoorProcessingServiceIdsForCategory,
} from "./data/door-data.js";
import { DOOR_MEASUREMENT_GUIDES } from "./data/measurement-guides-data.js";
import {
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
  bindSizeInputHandlers,
  renderEstimateTable,
  createProcessingServiceModalController,
  renderSelectedCard,
  buildMaterialVisualMarkup,
  renderFulfillmentServiceMediaSlots,
  renderSelectedAddonChips,
  updateProcessingServiceSummaryChip,
  initCollapsibleSections,
  updatePreviewSummary,
  buildConsultAwarePricing,
  buildBaseProductPricingExtraCosts,
  buildAddonLineItemDetail,
  CONSULT_EXCLUDED_SUFFIX,
  getPricingDisplayMeta,
  formatPricingRuleDisplayText,
  hasConsultLineItem,
  renderItemPriceDisplay,
  renderItemPriceNotice,
  calcGroupedAmount,
  initCustomerPhotoUploader,
  uploadCustomerPhotoFilesToCloudinary,
  UI_COLOR_FALLBACKS,
  validateFulfillmentStepSelection,
  buildCustomerEmailSectionLines,
  buildOrderPayloadBase,
  resolveThreePhaseNextTransition,
  resolveThreePhasePrevPhase,
  applyThreePhaseStepVisibility,
  submitOrderNotification,
  renderCategoryFeatureCapsules,
} from "./shared.js?v=20260423g-html";
import { createDoorPricingHelpers } from "./door-pricing.js";
import {
  normalizeFulfillmentType,
  isFulfillmentAddressReady,
  evaluateFulfillmentPolicy,
  formatFulfillmentCostText,
  formatFulfillmentLine,
  formatFulfillmentCardPriceText,
} from "./fulfillment-policy.js";
import {
  FULFILLMENT_SERVICE_MEDIA,
  FULFILLMENT_POLICY_MESSAGES,
  DOOR_FULFILLMENT_POLICY,
} from "./data/fulfillment-policy-data.js";
import { resolveInstallationTravelZoneByAddress } from "./installation-travel-zone.js";
import { createMeasurementGuideModalController } from "./measurement-guide-core.js";
import { buildServiceModels } from "./service-models.js?v=20260423f-html";

const ALL_PROCESSING_SERVICES = buildServiceModels(DOOR_PROCESSING_SERVICE_DATA);
const OPTION_CATALOG = DOOR_OPTIONS.reduce((acc, option) => {
  if (!option?.id) return acc;
  acc[option.id] = option;
  return acc;
}, {});

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

function nudgePreviewDimensionChipIntoFrame(chipEl, frameEl, marginPx = 6) {
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

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const WIDTH_MIN = DOOR_DIMENSION_LIMITS.minWidth;
const WIDTH_MAX = DOOR_DIMENSION_LIMITS.maxWidth;
const LENGTH_MIN = DOOR_DIMENSION_LIMITS.minLength;
const LENGTH_MAX = DOOR_DIMENSION_LIMITS.maxLength;
const DOOR_HINGE_PRICE_PER_HOLE = DOOR_PRICING_POLICY.hingePricePerHole;
const DOOR_HINGE_MIN_COUNT = 2;
const DOOR_HINGE_MAX_COUNT = 4;
const DOOR_HINGE_DEFAULT_EDGE_DISTANCE = 22;
const DOOR_HINGE_AUTO_TOP_OFFSET = 100;
const DOOR_HINGE_AUTO_BOTTOM_OFFSET = 100;
const DOOR_HINGE_AUTO_INTERIOR_RISE = 100;

function getDoorDimensionLimits(mat) {
  return {
    minWidth: Number(mat?.minWidth ?? WIDTH_MIN),
    maxWidth: Number(mat?.maxWidth ?? WIDTH_MAX),
    minLength: Number(mat?.minLength ?? LENGTH_MIN),
    maxLength: Number(mat?.maxLength ?? LENGTH_MAX),
  };
}

const PROCESSING_SERVICES = { ...ALL_PROCESSING_SERVICES };
const {
  formatDoorPriceTierLines,
  calcItemDetail,
  calcOrderSummary,
} = createDoorPricingHelpers({
  materials: MATERIALS,
  priceTiersByCategory: DOOR_PRICE_TIERS_BY_CATEGORY,
  processingServices: PROCESSING_SERVICES,
  optionCatalog: OPTION_CATALOG,
  hingePricePerHole: DOOR_HINGE_PRICE_PER_HOLE,
  cloneDoorHingeConfig,
});

const state = {
  items: [], // {id, materialId, thickness, width, length, quantity, services, ...계산 결과}
  addons: [],
  processingServiceDetails: {}, // 현재 선택된 가공서비스별 세부 옵션
  doorHingeConfig: createDefaultDoorHingeConfig(),
};
const previewSummaryConfig = {
  optionSelector: 'input[name="doorOption"]:checked',
  processingServiceSelector: 'input[name="processingService"]:checked',
};
const HAS_OPTION_SELECTIONS = DOOR_OPTIONS.length > 0;
const HAS_PROCESSING_SELECTIONS = Object.keys(PROCESSING_SERVICES).length > 0;
const HAS_ADDITIONAL_SELECTIONS = HAS_OPTION_SELECTIONS || HAS_PROCESSING_SELECTIONS;
const SWATCH_FALLBACK = UI_COLOR_FALLBACKS.swatch;
const SWATCH_MUTED_FALLBACK = UI_COLOR_FALLBACKS.swatchMuted;
const DOOR_TYPE_LABELS = Object.freeze(
  (Array.isArray(DOOR_TYPE_OPTIONS) ? DOOR_TYPE_OPTIONS : []).reduce((acc, option) => {
    const id = String(option?.id || "").trim().toLowerCase();
    if (!id) return acc;
    const label = String(option?.label || id).trim();
    acc[id] = label || id;
    return acc;
  }, {})
);
const SIDE_THICKNESS_OPTIONS = Object.freeze(
  (Array.isArray(DOOR_SIDE_THICKNESS_OPTIONS) ? DOOR_SIDE_THICKNESS_OPTIONS : [])
    .map((option) => {
      const rawValue =
        option && typeof option === "object" ? option.value : option;
      const value = Number(rawValue);
      if (!Number.isFinite(value) || value <= 0) return null;
      const normalized = Math.round(value);
      const rawLabel =
        option && typeof option === "object" ? option.label : "";
      const label = String(rawLabel || `${normalized}T`).trim();
      return { value: normalized, label: label || `${normalized}T` };
    })
    .filter(Boolean)
);
const SIDE_THICKNESS_VALUES = Object.freeze(
  SIDE_THICKNESS_OPTIONS.map((option) => option.value)
);
const SIDE_THICKNESS_LABELS = Object.freeze(
  SIDE_THICKNESS_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, {})
);
function normalizeDoorType(value) {
  const key = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(DOOR_TYPE_LABELS, key) ? key : "";
}

function formatDoorTypeLabel(value) {
  const normalized = normalizeDoorType(value);
  return DOOR_TYPE_LABELS[normalized] || "-";
}

function normalizeSideThickness(value) {
  const numericValue = Number(value);
  return SIDE_THICKNESS_VALUES.includes(numericValue) ? numericValue : 0;
}

function formatSideThicknessLabel(value) {
  const normalized = normalizeSideThickness(value);
  if (!normalized) return "-";
  return SIDE_THICKNESS_LABELS[normalized] || `${normalized}T`;
}

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

function getDoorProductItems() {
  return state.items.filter((item) => item.type !== "addon");
}

function getDoorProductQuantity() {
  return getDoorProductItems().reduce(
    (sum, item) => sum + Math.max(1, Math.floor(Number(item.quantity) || 1)),
    0
  );
}

function evaluateFulfillment(nextType = getFulfillmentType()) {
  const customer = getCustomerInfo();
  const hasProducts = getDoorProductItems().length > 0;
  return evaluateFulfillmentPolicy({
    nextType,
    customer,
    hasProducts,
    evaluateSupportedPolicy: ({ type }) => {
      const quantity = getDoorProductQuantity();
      const deliveryPolicy = DOOR_FULFILLMENT_POLICY.delivery;
      if (type === "delivery") {
        if (deliveryPolicy.mode === "consult") {
          return {
            amount: 0,
            amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
            isConsult: true,
            reason: deliveryPolicy.consultReason,
          };
        }
        if (deliveryPolicy.mode !== "groupedFee") {
          return {
            amount: 0,
            amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
            isConsult: true,
            reason: FULFILLMENT_POLICY_MESSAGES.fallbackReason,
          };
        }
        const hasOversize = getDoorProductItems().some(
          (item) =>
            Number(item?.width || 0) > deliveryPolicy.maxWidthMm ||
            Number(item?.length || 0) > deliveryPolicy.maxLengthMm
        );
        if (hasOversize) {
          return {
            amount: 0,
            amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
            isConsult: true,
            reason: deliveryPolicy.oversizeConsultReason,
          };
        }
        const amount = calcGroupedAmount(
          quantity,
          deliveryPolicy.groupedFee.groupSize,
          deliveryPolicy.groupedFee.groupPrice
        );
        return {
          amount,
          amountText: `${amount.toLocaleString()}원`,
          isConsult: false,
          reason: "",
        };
      }

      const installationPolicy = DOOR_FULFILLMENT_POLICY.installation;
      const amount =
        quantity <= installationPolicy.baseQuantity
          ? installationPolicy.baseAmount
          : installationPolicy.baseAmount +
            (quantity - installationPolicy.baseQuantity) * installationPolicy.additionalUnitAmount;
      return {
        amount,
        amountText: `${amount.toLocaleString()}원`,
        isConsult: false,
        reason: "",
      };
    },
  });
}

function buildGrandSummary() {
  const baseSummary = calcOrderSummary(state.items);
  const fulfillment = evaluateFulfillment();
  const fulfillmentCost = fulfillment.isConsult ? 0 : Number(fulfillment.amount || 0);
  const grandTotal = Number(baseSummary.grandTotal || 0) + fulfillmentCost;
  const hasConsult = hasConsultLineItem(state.items) || (Boolean(fulfillment.type) && fulfillment.isConsult);
  return {
    ...baseSummary,
    fulfillment,
    fulfillmentCost,
    grandTotal,
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

function resolveDoorHingeCountByLength(length) {
  const numericLength = Number(length);
  if (!Number.isFinite(numericLength) || numericLength <= 0) return DOOR_HINGE_MIN_COUNT;
  if (numericLength <= 800) return 2;
  if (numericLength <= 1500) return 3;
  return 4;
}

function createDefaultDoorHingeConfig() {
  return {
    enabled: true,
    side: "right",
    count: DOOR_HINGE_MIN_COUNT,
    edgeDistance: DOOR_HINGE_DEFAULT_EDGE_DISTANCE,
    holes: [],
    note: "",
  };
}

function cloneDoorHingeConfig(config) {
  return JSON.parse(JSON.stringify(config || createDefaultDoorHingeConfig()));
}

function getCurrentDoorLengthInputValue() {
  return Number($("#lengthInput")?.value || 0);
}

function getCurrentDoorLengthBounds() {
  const selectedInput = document.querySelector('input[name="material"]:checked');
  const matId = selectedInput?.value || selectedMaterialId;
  const mat = MATERIALS[matId];
  const min = Number(mat?.minLength);
  const max = Number(mat?.maxLength);
  return {
    min: Number.isFinite(min) ? min : LENGTH_MIN,
    max: Number.isFinite(max) ? max : LENGTH_MAX,
  };
}

function isDoorLengthReady(length) {
  const numericLength = Number(length);
  if (!Number.isFinite(numericLength)) return false;
  const { min, max } = getCurrentDoorLengthBounds();
  return numericLength >= min && numericLength <= max;
}

function buildDoorHingeAutoPositions(length, count) {
  const numericLength = Number(length);
  const normalizedCount = Math.max(
    DOOR_HINGE_MIN_COUNT,
    Math.min(DOOR_HINGE_MAX_COUNT, Number(count) || DOOR_HINGE_MIN_COUNT)
  );

  if (!Number.isFinite(numericLength) || numericLength <= 0) {
    const fallbackByCount = {
      2: [DOOR_HINGE_AUTO_TOP_OFFSET, 700],
      3: [DOOR_HINGE_AUTO_TOP_OFFSET, 650, 1200],
      4: [DOOR_HINGE_AUTO_TOP_OFFSET, 500, 950, 1400],
    };
    return (fallbackByCount[normalizedCount] || fallbackByCount[DOOR_HINGE_MIN_COUNT]).slice(
      0,
      normalizedCount
    );
  }

  const maxPos = Math.max(1, Math.round(numericLength - 1));
  const rawPositions = Array.from({ length: normalizedCount }, (_, idx) => {
    if (idx === 0) return DOOR_HINGE_AUTO_TOP_OFFSET;
    if (idx === normalizedCount - 1) return numericLength - DOOR_HINGE_AUTO_BOTTOM_OFFSET;
    const equalPosition = (numericLength * idx) / (normalizedCount - 1);
    return equalPosition - DOOR_HINGE_AUTO_INTERIOR_RISE;
  });
  const positions = rawPositions.map((pos) => Math.max(1, Math.min(maxPos, Math.round(pos))));

  for (let idx = 1; idx < positions.length; idx += 1) {
    if (positions[idx] <= positions[idx - 1]) {
      positions[idx] = Math.min(maxPos, positions[idx - 1] + 1);
    }
  }
  for (let idx = positions.length - 2; idx >= 0; idx -= 1) {
    if (positions[idx] >= positions[idx + 1]) {
      positions[idx] = Math.max(1, positions[idx + 1] - 1);
    }
  }

  return positions;
}

function normalizeDoorHingeConfig(rawConfig = {}, { length } = {}) {
  const side = rawConfig?.side === "right" ? "right" : "left";
  if (!isDoorLengthReady(length)) {
    return {
      enabled: true,
      side,
      count: 0,
      edgeDistance: DOOR_HINGE_DEFAULT_EDGE_DISTANCE,
      holes: [],
      note: String(rawConfig?.note || "").trim(),
    };
  }
  const count = resolveDoorHingeCountByLength(length);
  const autoPositions = buildDoorHingeAutoPositions(length, count);
  const sourceHoles = Array.isArray(rawConfig?.holes) ? rawConfig.holes : [];

  const holes = Array.from({ length: count }, (_, idx) => {
    const hole = sourceHoles[idx] || {};
    const rawVerticalDistance = Number(hole.verticalDistance);
    const verticalDistance = Number.isFinite(rawVerticalDistance)
      ? rawVerticalDistance
      : Number(autoPositions[idx] || 100);
    return {
      edge: side,
      distance: DOOR_HINGE_DEFAULT_EDGE_DISTANCE,
      verticalRef: "top",
      verticalDistance,
    };
  });

  return {
    enabled: true,
    side,
    count,
    edgeDistance: DOOR_HINGE_DEFAULT_EDGE_DISTANCE,
    holes,
    note: String(rawConfig?.note || "").trim(),
  };
}

function getDoorHingeHolesFromDOM(side) {
  return Array.from(document.querySelectorAll(".door-hinge-vertical-input")).map((inputEl) => ({
    edge: side,
    distance: DOOR_HINGE_DEFAULT_EDGE_DISTANCE,
    verticalRef: "top",
    verticalDistance: Number(inputEl.value),
  }));
}

function setDoorHingeError(message = "") {
  const errorEl = $("#doorHingeError");
  if (!errorEl) return;
  const text = String(message || "").trim();
  errorEl.textContent = text;
  errorEl.classList.toggle("error", Boolean(text));
}

function setDoorHingeSide(side) {
  const normalizedSide = side === "right" ? "right" : "left";
  const sideInput = $("#doorHingeSide");
  if (sideInput) sideInput.value = normalizedSide;
  document.querySelectorAll("[data-door-hinge-side]").forEach((btn) => {
    const active = btn.dataset.doorHingeSide === normalizedSide;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

function updateDoorHingeCountHint({ length, count } = {}) {
  const hintEl = $("#doorHingeCountHint");
  if (!hintEl) return;
  if (!isDoorLengthReady(length)) {
    const { min, max } = getCurrentDoorLengthBounds();
    hintEl.textContent =
      `도어 길이를 ${min}~${max}mm 범위로 입력하면 경첩 수량/위치가 자동 생성됩니다. (800mm 이하 2개 / 1500mm 이하 3개 / 그 이상 4개)`;
    return;
  }
  const numericLength = Number(length);
  const lengthText = `${Math.round(numericLength)}mm`;
  hintEl.textContent = `길이 ${lengthText} 기준 경첩 ${count}개 자동 적용 (800mm 이하 2개 / 1500mm 이하 3개 / 그 이상 4개)`;
}

function setDoorHingeInputErrors(invalidIndexes = []) {
  const invalidSet = new Set((Array.isArray(invalidIndexes) ? invalidIndexes : []).map((idx) => Number(idx)));
  const rows = Array.from(document.querySelectorAll(".door-hinge-row"));
  rows.forEach((row, idx) => {
    const input = row.querySelector(".door-hinge-vertical-input");
    const isInvalid = invalidSet.has(idx);
    row.classList.toggle("is-invalid", isInvalid);
    input?.classList.toggle("input-error", isInvalid);
  });
}

function syncDoorHingeFieldVisibility() {
  const fields = $("#doorHingeFields");
  if (fields) fields.classList.remove("hidden-step");
}

function renderDoorHingeRows({ preserveExistingValues = true } = {}) {
  const rowsEl = $("#doorHingeRows");
  const sideInput = $("#doorHingeSide");
  if (!rowsEl || !sideInput) return;

  const side = sideInput.value === "right" ? "right" : "left";
  const length = getCurrentDoorLengthInputValue();
  const sourceHoles = preserveExistingValues ? getDoorHingeHolesFromDOM(side) : [];

  state.doorHingeConfig = normalizeDoorHingeConfig(
    {
      ...state.doorHingeConfig,
      side,
      holes: sourceHoles,
    },
    { length }
  );
  updateDoorHingeCountHint({ length, count: state.doorHingeConfig.count });
  setDoorHingeSide(side);

  if (!state.doorHingeConfig.holes.length) {
    rowsEl.innerHTML = `
      <div class="processing-service-empty door-hinge-empty">
        도어 길이를 입력하면 경첩 위치 입력칸이 생성됩니다.
      </div>
    `;
    setDoorHingeInputErrors([]);
    return;
  }

  rowsEl.innerHTML = state.doorHingeConfig.holes
    .map((hole, idx) => {
      const value = Number(hole.verticalDistance);
      return `
        <div class="door-hinge-row" data-door-hinge-row-index="${idx}">
          <p class="door-hinge-row-title">경첩 ${idx + 1}</p>
          <div class="door-hinge-grid">
            <div>
              <label for="doorHingeVertical-${idx}">세로 위치 (mm)</label>
              <input
                type="number"
                id="doorHingeVertical-${idx}"
                class="processing-service-input door-hinge-vertical-input"
                data-door-hinge-index="${idx}"
                min="1"
                value="${Number.isFinite(value) && value > 0 ? value : ""}"
              />
            </div>
          </div>
        </div>
      `;
    })
    .join("");
  setDoorHingeInputErrors([]);
}

function readDoorHingeConfigFromDOM() {
  const side = $("#doorHingeSide")?.value === "right" ? "right" : "left";
  const holes = getDoorHingeHolesFromDOM(side);
  state.doorHingeConfig = normalizeDoorHingeConfig(
    {
      ...state.doorHingeConfig,
      side,
      holes,
    },
    { length: getCurrentDoorLengthInputValue() }
  );
  return cloneDoorHingeConfig(state.doorHingeConfig);
}

function validateDoorHingeConfigDetailed(doorHingeConfig, { length } = {}) {
  const numericLength = Number(length);
  if (!Number.isFinite(numericLength) || numericLength <= 0) {
    return {
      message: "경첩 위치를 위해 도어 길이를 먼저 입력해주세요.",
      invalidIndexes: [],
    };
  }

  const holes = Array.isArray(doorHingeConfig.holes) ? doorHingeConfig.holes : [];
  if (holes.length === 0) {
    return { message: "경첩 위치를 1개 이상 입력해주세요.", invalidIndexes: [] };
  }

  const positions = [];
  for (let index = 0; index < holes.length; index += 1) {
    const verticalDistance = Number(holes[index]?.verticalDistance);
    if (!Number.isFinite(verticalDistance)) {
      return {
        message: `${index + 1}번 경첩 세로 위치를 입력해주세요.`,
        invalidIndexes: [index],
      };
    }
    if (verticalDistance <= 0 || verticalDistance >= numericLength) {
      return {
        message: `${index + 1}번 경첩 세로 위치는 1~${Math.max(1, Math.round(numericLength - 1))}mm 범위로 입력해주세요.`,
        invalidIndexes: [index],
      };
    }
    positions.push(verticalDistance);
  }

  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index] <= positions[index - 1]) {
      return {
        message: "경첩 위치는 위에서 아래 순서로 오름차순 입력해주세요.",
        invalidIndexes: [index - 1, index],
      };
    }
  }

  return { message: "", invalidIndexes: [] };
}

function getDoorHingeValidHoleCount(doorHingeConfig) {
  const holes = Array.isArray(doorHingeConfig?.holes) ? doorHingeConfig.holes : [];
  return holes.filter((hole) => Number.isFinite(Number(hole?.verticalDistance)) && Number(hole.verticalDistance) > 0)
    .length;
}

function formatDoorPanelSideLabel(doorHingeConfig = {}) {
  const config = doorHingeConfig && typeof doorHingeConfig === "object" ? doorHingeConfig : {};
  return config.side === "left" ? "우측문" : "좌측문";
}

function formatDoorEstimateNameHtml(materialName, item = {}) {
  const baseName = String(materialName || "").trim();
  if (!baseName || (item && item.type === "addon")) return escapeHtml(baseName);
  const panelSideLabel = formatDoorPanelSideLabel(
    item && item.doorHingeConfig ? item.doorHingeConfig : createDefaultDoorHingeConfig()
  );
  if (!panelSideLabel) return escapeHtml(baseName);
  const chipText = panelSideLabel.startsWith("우") ? "우측" : "좌측";
  return `<span class="estimate-name-chip" aria-label="${escapeHtml(panelSideLabel)}">${escapeHtml(chipText)}</span> ${escapeHtml(baseName)}`;
}

function formatDoorHingeConfig(doorHingeConfig, { includeNote = false } = {}) {
  const holes = Array.isArray(doorHingeConfig.holes) ? doorHingeConfig.holes : [];
  if (holes.length === 0) return "경첩 위치 미입력";
  const sideText = doorHingeConfig.side === "right" ? "우경첩" : "좌경첩";
  const positionText = holes
    .map((hole) => Number(hole?.verticalDistance))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => `상 ${value}mm`)
    .join(", ");
  const noteText = includeNote && doorHingeConfig.note ? ` · 메모: ${doorHingeConfig.note}` : "";
  return `${sideText} ${holes.length}개${positionText ? ` · ${positionText}` : ""}${noteText}`;
}

function getDoorProcessingCategoryTexts(
  services = [],
  serviceDetails = {},
  doorHingeConfig = {},
  opts = {}
) {
  const processingServiceTextRaw = formatProcessingServiceList(services, serviceDetails, opts);
  const processingServiceText = processingServiceTextRaw && processingServiceTextRaw !== "-" ? processingServiceTextRaw : "-";
  const hingeTextRaw = formatDoorHingeConfig(doorHingeConfig || createDefaultDoorHingeConfig(), opts);
  const hingeText = hingeTextRaw && hingeTextRaw !== "-" ? hingeTextRaw : "-";
  return { processingServiceText, hingeText };
}

function formatProcessingList(services = [], serviceDetails = {}, doorHingeConfig = {}, opts = {}) {
  const { processingServiceText, hingeText } = getDoorProcessingCategoryTexts(
    services,
    serviceDetails,
    doorHingeConfig,
    opts
  );
  return `가공서비스 (${processingServiceText}), 경첩가공 (${hingeText})`;
}

function isDoorHingeSelected() {
  return true;
}

function updateDoorPreviewSummary() {
  updatePreviewSummary(previewSummaryConfig);
  const processingServiceSummaryEl = $("#previewProcessingServiceSummary");
  const hingeSummaryEl = $("#previewHingeSummary");
  if (!processingServiceSummaryEl && !hingeSummaryEl) return;
  const selectedProcessingServiceCount = previewSummaryConfig.processingServiceSelector
    ? document.querySelectorAll(previewSummaryConfig.processingServiceSelector).length
    : 0;
  const currentHingeConfig = readDoorHingeConfigFromDOM();
  const hingeConfigured =
    isDoorLengthReady(getCurrentDoorLengthInputValue()) &&
    getDoorHingeValidHoleCount(currentHingeConfig) > 0 &&
    isDoorHingeSelected();
  if (processingServiceSummaryEl) {
    processingServiceSummaryEl.textContent = selectedProcessingServiceCount
      ? `가공서비스 ${selectedProcessingServiceCount}개 선택`
      : "가공서비스 선택 없음";
  }
  if (hingeSummaryEl) {
    hingeSummaryEl.textContent = hingeConfigured ? "경첩가공 1개 선택" : "경첩가공 설정 필요";
  }
}

function buildDoorPriceBreakdownRows({
  itemCost = 0,
  optionCost = 0,
  processingServiceCost,
  serviceCost,
  hingeCost = 0,
  consultState = null,
  itemHasConsult = false,
  optionHasConsult = false,
  processingServiceHasConsult,
  serviceHasConsult,
  hingeHasConsult = false,
} = {}) {
  const normalizedConsult = consultState?.consult && typeof consultState.consult === "object"
    ? consultState.consult
    : consultState;
  const resolvedItemHasConsult = Boolean(normalizedConsult?.item ?? itemHasConsult);
  const resolvedOptionHasConsult = Boolean(normalizedConsult?.option ?? optionHasConsult);
  const resolvedProcessingServiceHasConsult = Boolean(
    normalizedConsult?.processingService ?? processingServiceHasConsult ?? serviceHasConsult
  );
  const normalizedHingeCost = Number(hingeCost || 0);
  const normalizedProcessingServiceCost = Number(processingServiceCost ?? serviceCost ?? 0);
  const processingServiceOnlyCost = Math.max(0, normalizedProcessingServiceCost - normalizedHingeCost);
  return [
    { label: "품목", amount: itemCost, isConsult: resolvedItemHasConsult },
    { label: "경첩가공", amount: normalizedHingeCost, isConsult: hingeHasConsult },
    { label: "옵션", amount: optionCost, isConsult: resolvedOptionHasConsult },
    { label: "가공서비스", amount: processingServiceOnlyCost, isConsult: resolvedProcessingServiceHasConsult },
  ];
}

function clearProcessingServices() {
  document.querySelectorAll('input[name="processingService"]').forEach((input) => {
    input.checked = false;
    input.closest(".processing-service-card")?.classList.remove("selected");
  });
  state.processingServiceDetails = {};
  Object.keys(PROCESSING_SERVICES).forEach((id) => updateProcessingServiceSummary(id));
}

function syncProcessingSectionVisibility() {
  const container = $("#processingServiceCards");
  if (!container) return;
  const section = container.closest(".selection-block--input");
  const hasActiveProcessingSelections =
    container.querySelectorAll('input[name="processingService"]').length > 0;
  if (section) section.classList.toggle("hidden-step", !hasActiveProcessingSelections);
  if (!hasActiveProcessingSelections) {
    updateDoorPreviewSummary();
    return;
  }
  container.classList.remove("hidden-step");
  container.querySelectorAll('input[name="processingService"]').forEach((input) => {
    input.disabled = false;
  });
  updateDoorPreviewSummary();
}

let currentPhase = 1; // 1: 도어/가공, 2: 서비스, 3: 고객 정보
let sendingEmail = false;
let orderCompleted = false;
let customerPhotoUploader = null;
let stickyOffsetTimer = null;
let previewResizeTimer = null;
const categories = Array.from(new Set(Object.values(MATERIALS).map((m) => m.category || "기타")));
let selectedCategory = categories[0];
let selectedMaterialId = "";

function getCurrentMaterialCategory() {
  return String(MATERIALS[selectedMaterialId]?.category || selectedCategory || "").trim();
}

function getActiveOptionIdSet() {
  return new Set(getDoorOptionIdsForCategory(getCurrentMaterialCategory()));
}

function getActiveProcessingServiceIdSet() {
  return new Set(getDoorProcessingServiceIdsForCategory(getCurrentMaterialCategory()));
}

function getActiveOptions() {
  const activeIds = getActiveOptionIdSet();
  return DOOR_OPTIONS.filter((option) => activeIds.has(option.id));
}

function getActiveProcessingServices() {
  const activeIds = getActiveProcessingServiceIdSet();
  return Object.values(PROCESSING_SERVICES).filter((service) => activeIds.has(service.id));
}

function cloneProcessingServiceDetails(details) {
  return JSON.parse(JSON.stringify(details || {}));
}

function getDefaultProcessingServiceDetail(serviceId) {
  const srv = PROCESSING_SERVICES[serviceId];
  if (!srv) return { note: "" };
  if (srv.detailMode === "side-hinge-list") {
    return cloneProcessingServiceDetails(srv.defaultDetail ? srv.defaultDetail() : { holes: [], note: "" });
  }
  if (srv.hasDetail()) return { holes: [], note: "" };
  const detail = srv.defaultDetail ? srv.defaultDetail() : { note: "" };
  return cloneProcessingServiceDetails(detail);
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
  guides: DOOR_MEASUREMENT_GUIDES,
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

function formatHingeDetail(detail, { short = false, includeNote = false } = {}) {
  return formatHoleDetail(detail, { short, includeNote });
}

function formatHandleDetail(detail, { includeNote = false } = {}) {
  return formatHoleDetail(detail, { includeNote });
}

function formatProcessingServiceDetail(serviceId, detail, { includeNote = false } = {}) {
  const srv = PROCESSING_SERVICES[serviceId] || ALL_PROCESSING_SERVICES[serviceId];
  const name = srv?.label || serviceId;
  if (!srv) return name;
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
  if (!srv.hasDetail()) return "세부 옵션 없음";
  const formatted = srv.formatDetail(detail, { short: true });
  return formatted || "세부 옵션을 설정해주세요.";
}

function updateProcessingServiceSummary(serviceId) {
  updateProcessingServiceSummaryChip({
    serviceId,
    processingServices: PROCESSING_SERVICES,
    processingServiceDetails: state.processingServiceDetails,
    formatSummaryText: formatProcessingServiceSummaryText,
  });
  updateDoorPreviewSummary();
}

function renderProcessingServiceCards() {
  const container = $("#processingServiceCards");
  if (!container) return;
  container.innerHTML = "";
  const activeIds = getActiveProcessingServiceIdSet();
  Object.keys(state.processingServiceDetails).forEach((id) => {
    if (!activeIds.has(id)) delete state.processingServiceDetails[id];
  });

  getActiveProcessingServices().forEach((srv) => {
    const card = document.createElement("div");
    card.className = "card-base processing-service-card";
    const helpBtnHtml = srv.helpGuideKey
      ? `<button type="button" class="section-help-btn processing-service-card-help" data-measurement-guide="${srv.helpGuideKey}" aria-label="${srv.label} 안내 보기">?</button>`
      : "";
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
    card.innerHTML = `
      ${helpBtnHtml}
      <label class="processing-service-card-body">
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
      </label>
    `;
    container.appendChild(card);
  });

  Object.keys(PROCESSING_SERVICES).forEach((id) => updateProcessingServiceSummary(id));
  syncProcessingSectionVisibility();
  if (!activeIds.size) return;

  container.onchange = (e) => {
    if (e.target.name === "processingService") {
      const serviceId = e.target.value;
      const srv = PROCESSING_SERVICES[serviceId];
      const card = e.target.closest(".processing-service-card");
      if (e.target.checked) {
        card?.classList.add("selected");
        if (srv?.hasDetail()) {
          openProcessingServiceModal(serviceId, e.target, "change");
        } else {
          state.processingServiceDetails[serviceId] = srv?.defaultDetail() || null;
          updateProcessingServiceSummary(serviceId);
          autoCalculatePrice();
        }
        updateDoorPreviewSummary();
      } else {
        if (srv?.hasDetail()) {
          e.target.checked = true;
          openProcessingServiceModal(serviceId, e.target, "edit");
          return;
        }
        card?.classList.remove("selected");
        delete state.processingServiceDetails[serviceId];
        updateProcessingServiceSummary(serviceId);
        autoCalculatePrice();
        updateDoorPreviewSummary();
      }
    }
  };

  container.onclick = (e) => {
    const guideBtn = e.target.closest("[data-measurement-guide]");
    if (guideBtn) {
      e.preventDefault();
      e.stopPropagation();
      openMeasurementGuideModal(guideBtn.dataset.measurementGuide || "");
      return;
    }
    const card = e.target.closest(".processing-service-card");
    if (!card) return;
    const checkbox = card.querySelector('input[name="processingService"]');
    if (!checkbox) return;
    const serviceId = checkbox.value;
    const srv = PROCESSING_SERVICES[serviceId];
    if (!srv?.hasDetail()) return;
    e.preventDefault();
    e.stopPropagation();
    const wasChecked = checkbox.checked;
    if (!checkbox.checked) {
      checkbox.checked = true;
      card.classList.add("selected");
      updateProcessingServiceSummary(serviceId);
      autoCalculatePrice();
      updateAddItemState();
    }
    openProcessingServiceModal(serviceId, checkbox, wasChecked ? "edit" : "change");
  };
}

function renderOptionCards() {
  const container = $("#doorOptionCards");
  if (!container) return;
  const section = container.closest(".selection-block");
  container.innerHTML = "";
  const activeOptions = getActiveOptions();
  if (section) section.classList.toggle("hidden-step", activeOptions.length === 0);
  if (!activeOptions.length) {
    updateDoorPreviewSummary();
    return;
  }
  activeOptions.forEach((opt) => {
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
      <input type="checkbox" name="doorOption" value="${opt.id}" />
      ${visualMarkup}
      <div class="name">${opt.name}</div>
      <div class="price${isConsultOption ? " is-consult" : ""}">${priceText}</div>
      ${descriptionHTML(opt.description)}
    `;
    container.appendChild(label);
  });
  updateDoorPreviewSummary();
  container.onchange = (e) => {
    if (e.target.name !== "doorOption") return;
    const card = e.target.closest(".option-card");
    if (e.target.checked) {
      card?.classList.add("selected");
    } else {
      card?.classList.remove("selected");
    }
    updateDoorPreviewSummary();
    autoCalculatePrice();
    updateAddItemState();
  };
}

function renderMaterialTabs() {
  const tabs = $("#materialTabs");
  tabs.innerHTML = "";
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `material-tab${cat === selectedCategory ? " active" : ""}`;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      selectedCategory = cat;
      // 선택된 소재가 다른 카테고리에 있을 경우 선택 해제
      const inCategory = Object.values(MATERIALS).some(
        (m) => m.id === selectedMaterialId && (m.category || "기타") === cat
      );
      if (!inCategory) selectedMaterialId = "";
      renderMaterialTabs();
      renderMaterialCards();
      renderOptionCards();
      renderProcessingServiceCards();
      if (selectedMaterialId) updateThicknessOptions(selectedMaterialId);
      renderCategoryDesc();
    });
    tabs.appendChild(btn);
  });
  renderCategoryDesc();
}

function renderMaterialCards() {
  const container = $("#materialCards");
  container.innerHTML = "";

  const list = Object.values(MATERIALS).filter(
    (mat) => (mat.category || "기타") === selectedCategory
  );

  list.forEach((mat) => {
    const priceLines = formatDoorPriceTierLines(mat.category);
    const label = document.createElement("label");
    const visualMarkup = buildMaterialVisualMarkup({
      swatch: mat.swatch,
      imageUrl: mat.thumbnail,
      fallbackSwatch: SWATCH_FALLBACK,
    });
    label.className = `card-base material-card${
      selectedMaterialId === mat.id ? " selected" : ""
    }`;
    label.innerHTML = `
      <input type="radio" name="material" value="${mat.id}" ${
        selectedMaterialId === mat.id ? "checked" : ""
      } />
      ${visualMarkup}
      <div class="name">${mat.name}</div>
      <div class="material-tier-heading">가격 기준</div>
      ${priceLines
        .map(
          (line) =>
            `<div class="material-tier-line${
              String(line).includes("상담안내") ? " is-consult" : ""
            }">${line}</div>`
        )
        .join("")}
      <div class="size-heading">제작 가능 범위</div>
      <div class="size">두께 ${(mat.availableThickness || []).map((t) => `${t}T`).join(", ")}</div>
      <div class="size">폭 ${mat.minWidth}~${mat.maxWidth}mm</div>
      <div class="size">길이 ${mat.minLength}~${mat.maxLength}mm</div>
      ${descriptionHTML(mat.description)}
    `;
    container.appendChild(label);
  });

  container.onclick = (e) => {
    const input = e.target.closest('input[name="material"]');
    if (!input) return;
    const prevMaterialId = selectedMaterialId;
    const prevCategory = getCurrentMaterialCategory();
    selectedMaterialId = input.value;
    const nextCategory = getCurrentMaterialCategory();
    if (prevMaterialId && prevMaterialId !== selectedMaterialId) {
      resetProcessingServiceOptions();
    }
    if (prevCategory !== nextCategory) {
      renderOptionCards();
      renderProcessingServiceCards();
    }
    updateThicknessOptions(selectedMaterialId);
    updateSelectedMaterialLabel();
    updateSizePlaceholders(MATERIALS[selectedMaterialId]);
    updatePreview();
    $$(".material-card").forEach((card) => card.classList.remove("selected"));
    input.closest(".material-card")?.classList.add("selected");
    input.blur();
    closeMaterialModal();
  };
  if (selectedMaterialId) updateThicknessOptions(selectedMaterialId);
  updateSelectedMaterialLabel();
}

function renderCategoryDesc() {
  const descEl = document.getElementById("materialCategoryDesc");
  const titleEl = document.getElementById("materialCategoryName");
  if (!descEl || !titleEl) return;
  const categoryMeta = CATEGORY_META_BY_CATEGORY[selectedCategory] || {};
  titleEl.textContent = selectedCategory || "";
  descEl.textContent = categoryMeta.description || "";
  renderCategoryFeatureCapsules(descEl, categoryMeta.features);
}

function renderAddonCards() {
  const container = $("#addonCards");
  if (!container) return;
  container.innerHTML = "";
  const selectedIds = state.items.filter((it) => it.type === "addon").map((it) => it.addonId);
  state.addons = [...selectedIds];

  BOARD_ADDON_ITEMS.forEach((item) => {
    const label = document.createElement("label");
    const isSelected = selectedIds.includes(item.id);
    label.className = `card-base addon-card${isSelected ? " selected" : ""}`;
    const priceText = formatPricingRuleDisplayText(item) || "0원";
    const visualMarkup = buildMaterialVisualMarkup({
      swatch: item.swatch,
      imageUrl: item.thumbnail,
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
      addAddonItem(id);
    } else {
      removeAddonItem(id);
    }
    state.addons = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(
      (el) => el.value
    );
    updateSelectedAddonsDisplay();
    $$("#addonCards .addon-card").forEach((card) => card.classList.remove("selected"));
    state.addons.forEach((selectedId) => {
      const card = container.querySelector(`input[value="${selectedId}"]`)?.closest(".addon-card");
      card?.classList.add("selected");
    });
  };
}

function addAddonItem(addonId) {
  const existing = state.items.some((it) => it.type === "addon" && it.addonId === addonId);
  if (existing) return;
  const addon = BOARD_ADDON_ITEMS.find((a) => a.id === addonId);
  if (!addon) return;
  const detail = buildAddonLineItemDetail({ addon });
  state.items.push({
    id: crypto.randomUUID(),
    type: "addon",
    addonId,
    quantity: 1,
    materialCost: detail.materialCost,
    processingCost: detail.processingCost,
    subtotal: detail.subtotal,
    vat: detail.vat,
    total: detail.total,
  });
  renderTable();
  renderSummary();
}

function removeAddonItem(addonId) {
  state.items = state.items.filter((it) => !(it.type === "addon" && it.addonId === addonId));
  renderTable();
  renderSummary();
}

function updateSelectedAddonsDisplay() {
  renderSelectedAddonChips({
    targetId: "selectedAddonCard",
    addons: state.addons,
    allItems: BOARD_ADDON_ITEMS,
  });
}

function syncAddonSelectionFromItems() {
  const selectedIds = state.items.filter((it) => it.type === "addon").map((it) => it.addonId);
  state.addons = [...selectedIds];
  updateSelectedAddonsDisplay();
  const container = $("#addonCards");
  if (!container) return;
  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const isSelected = selectedIds.includes(input.value);
    input.checked = isSelected;
    input.closest(".addon-card")?.classList.toggle("selected", isSelected);
  });
}

function syncAdditionalSelectionLockState(isLocked) {
  document.querySelectorAll("#step3Additional .selection-block").forEach((section) => {
    section.classList.toggle("is-disabled", isLocked);
    section.setAttribute("aria-disabled", String(isLocked));
    section.querySelectorAll("input, button, select, textarea").forEach((control) => {
      control.disabled = isLocked;
    });
  });
}

function updateAddItemState() {
  const btn = $("#addItemBtn");
  const input = readCurrentInputs();
  const err = validateInputs(input);
  const isLocked = Boolean(err);
  if (btn) btn.disabled = isLocked;
  syncAdditionalSelectionLockState(isLocked);
}

function readCurrentInputs() {
  const selected = document.querySelector('input[name="material"]:checked');
  const materialId = selected ? selected.value : "";
  const doorType = normalizeDoorType($("#doorTypeSelect")?.value);
  const thickness = Number($("#thicknessSelect").value);
  const sideThickness = normalizeSideThickness($("#sideThicknessSelect")?.value);
  const width = Number($("#widthInput").value);
  const length = Number($("#lengthInput").value);
  const options = Array.from(
    document.querySelectorAll("#doorOptionCards input:checked")
  )
    .map((el) => el.value)
    .filter((id) => getActiveOptionIdSet().has(id));

  const activeProcessingIds = getActiveProcessingServiceIdSet();
  const services = Array.from(document.querySelectorAll('input[name="processingService"]:checked'))
    .map((el) => el.value)
    .filter((id) => activeProcessingIds.has(id));

  const serviceDetails = cloneProcessingServiceDetails(state.processingServiceDetails);
  const doorHingeConfig = readDoorHingeConfigFromDOM();

  return {
    materialId,
    doorType,
    thickness,
    sideThickness,
    width,
    length,
    options,
    services,
    serviceDetails,
    doorHingeConfig,
  };
}

// 입력값 검증
function validateInputs(input) {
  const { materialId, doorType, thickness, sideThickness, width, length, doorHingeConfig } = input;
  const mat = MATERIALS[materialId];
  setDoorHingeError("");
  setDoorHingeInputErrors([]);

  if (!materialId) return "도어를 선택해주세요.";
  if (!mat) return "도어를 선택해주세요.";
  if (!doorType) return "도어 형태를 선택해주세요.";
  if (!thickness) return "두께를 선택해주세요.";
  if (!sideThickness) return "측면 두께를 선택해주세요.";
  if (!width) return "폭을 입력해주세요.";
  const { minWidth: widthMin, maxWidth: widthMax, minLength: lengthMin, maxLength: lengthMax } =
    getDoorDimensionLimits(mat);
  if (width < widthMin) return `폭은 최소 ${widthMin}mm 이상이어야 합니다.`;
  if (width > widthMax) return `폭은 최대 ${widthMax}mm 이하만 가능합니다.`;
  if (!length) return "길이를 입력해주세요.";
  if (length < lengthMin) return `길이는 최소 ${lengthMin}mm 이상이어야 합니다.`;
  if (length > lengthMax) return `길이는 최대 ${lengthMax}mm 이하만 가능합니다.`;

  const material = mat;
  if (!material.availableThickness?.includes(thickness)) {
    return `선택한 도어는 ${material.availableThickness.join(", ")}T만 가능합니다.`;
  }

  const doorHingeValidation = validateDoorHingeConfigDetailed(doorHingeConfig, { length });
  setDoorHingeInputErrors(doorHingeValidation.invalidIndexes);
  setDoorHingeError(doorHingeValidation.message);
  if (doorHingeValidation.message) return doorHingeValidation.message;

  return null;
}

// 버튼: 도어 담기
const addItemBtn = $("#addItemBtn");
if (addItemBtn) {
  addItemBtn.addEventListener("click", () => {
    const input = readCurrentInputs();
    const err = validateInputs(input);
    if (err) {
      renderItemPriceNotice({ target: "#itemPriceDisplay", text: err });
      updateAddItemState();
      return;
    }

    const quantity = 1;
    const detail = calcItemDetail({ ...input, quantity, includeDiscountMeta: true });
    if (detail.error) {
      showInfoModal(detail.error);
      return;
    }
    const itemProcessingServiceDetails = cloneProcessingServiceDetails(input.serviceDetails);
    const itemDoorHingeConfig = cloneDoorHingeConfig(input.doorHingeConfig);

    state.items.push({
      id: crypto.randomUUID(),
      ...input,
      quantity,
      serviceDetails: itemProcessingServiceDetails,
      doorHingeConfig: itemDoorHingeConfig,
      ...detail,
    });

    renderTable();
    renderSummary();
    renderItemPriceDisplay({
      target: "#itemPriceDisplay",
      totalLabel: "예상금액",
      totalAmount: 0,
      breakdownRows: buildDoorPriceBreakdownRows(),
    });
    resetStepsAfterAdd();
  });
}

function resetStepsAfterAdd() {
  selectedMaterialId = "";

  // 재질 선택 초기화
  document.querySelectorAll('input[name="material"]').forEach((input) => {
    input.checked = false;
    input.closest(".material-card")?.classList.remove("selected");
  });
  updateSelectedMaterialLabel();
  updateSizePlaceholders(null);

  const doorTypeSelect = $("#doorTypeSelect");
  if (doorTypeSelect) doorTypeSelect.value = "";

  // 두께 선택 초기화
  const thicknessSelect = $("#thicknessSelect");
  if (thicknessSelect) {
    thicknessSelect.innerHTML = `<option value="">도어를 선택해주세요</option>`;
  }
  const sideThicknessSelect = $("#sideThicknessSelect");
  if (sideThicknessSelect) sideThicknessSelect.value = "";

  // 사이즈 입력 초기화
  const widthEl = $("#widthInput");
  const lengthEl = $("#lengthInput");
  if (widthEl) widthEl.value = "";
  if (lengthEl) lengthEl.value = "";

  // 옵션 초기화
  document.querySelectorAll('input[name="doorOption"]').forEach((input) => {
    input.checked = false;
    input.closest(".option-card")?.classList.remove("selected");
  });

  // 가공 서비스 초기화
  clearProcessingServices();
  syncProcessingSectionVisibility();

  // 도어 전용 경첩 설정 초기화
  state.doorHingeConfig = createDefaultDoorHingeConfig();
  setDoorHingeSide(state.doorHingeConfig.side);
  syncDoorHingeFieldVisibility();
  renderDoorHingeRows({ preserveExistingValues: false });
  setDoorHingeError("");

  renderItemPriceDisplay({
    target: "#itemPriceDisplay",
    totalLabel: "예상금액",
    totalAmount: 0,
    breakdownRows: buildDoorPriceBreakdownRows(),
  });

  validateSizeFields();
  updatePreview();
  updateDoorPreviewSummary();
  updateModalCardPreviews();
  updateAddItemState();
}

function updateStepVisibility(scrollTarget) {
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const stepPreview = document.getElementById("stepPreview");
  const step3Additional = document.getElementById("step3Additional");
  const actionCard = document.querySelector(".action-card");
  const step4 = document.getElementById("step4");
  const step5 = document.getElementById("step5");
  const summaryCard = document.getElementById("stepFinal");
  const sendBtn = document.getElementById("sendQuoteBtn");
  const nextBtn = document.getElementById("nextStepsBtn");
  const backToCenterBtn = document.getElementById("backToCenterBtn");
  const orderComplete = document.getElementById("orderComplete");
  const navActions = document.querySelector(".nav-actions");
  const prevBtn = document.getElementById("prevStepsBtn");

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
    prevButton: prevBtn,
    nextButton: nextBtn,
    sendButton: sendBtn,
    backToCenterButton: backToCenterBtn,
    completedHiddenElements: [step1, step2, stepPreview, step3Additional, step4, step5, actionCard, summaryCard],
    completedActionButtons: [sendBtn, nextBtn],
    onActiveRender: () => updateSendButtonEnabled(),
    scrollTarget,
  });
}

function goToNextStep() {
  const transition = resolveThreePhaseNextTransition({
    currentPhase,
    phase1Ready: state.items.some((it) => it.type !== "addon"),
    phase1ErrorMessage: "도어를 하나 이상 담아주세요.",
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

function renderTable() {
  const formatItemTotal = (item) =>
    item.consultStatus === "consult" ? "상담 안내" : `${item.total.toLocaleString()}원`;
  const formatItemMaterial = (item) =>
    item.consultStatus === "consult" ? "상담 안내" : `${item.materialCost.toLocaleString()}원`;

  renderEstimateTable({
    items: state.items,
    getName: (item) => {
      const isAddon = item.type === "addon";
      const addonInfo = isAddon ? BOARD_ADDON_ITEMS.find((a) => a.id === item.addonId) : null;
      const materialName = isAddon
        ? addonInfo?.name || "부자재"
        : MATERIALS[item.materialId].name;
      return formatDoorEstimateNameHtml(materialName, item);
    },
    getTotalText: (item) => formatItemTotal(item),
    getDetailLines: (item) => {
      const isAddon = item.type === "addon";
      const addonInfo = isAddon ? BOARD_ADDON_ITEMS.find((a) => a.id === item.addonId) : null;
      const materialName = isAddon
        ? addonInfo?.name || "부자재"
        : MATERIALS[item.materialId].name;
      if (isAddon) {
        return [
          `부자재 ${escapeHtml(materialName)}`,
          `상품가 ${item.materialCost.toLocaleString()}원`,
        ];
      }
      const sizeText = `${item.thickness}T / ${item.width}×${item.length}mm`;
      const doorTypeText = formatDoorTypeLabel(item.doorType);
      const sideThicknessText = formatSideThicknessLabel(item.sideThickness);
      const { processingServiceText, hingeText } = getDoorProcessingCategoryTexts(
        item.services,
        item.serviceDetails,
        item.doorHingeConfig,
        { includeNote: true }
      );
      const processingServiceOnlyCost = Math.max(0, Number(item.serviceCost || 0) - Number(item.doorHingeCost || 0));
      const baseLines = [
        `사이즈 ${escapeHtml(sizeText)}`,
        `도어형태 ${escapeHtml(doorTypeText)}`,
        `측면두께 ${escapeHtml(sideThicknessText)}`,
        `경첩가공 ${escapeHtml(hingeText)}`,
        `옵션 ${escapeHtml(item.optionsLabel || "-")}`,
        `가공서비스 ${escapeHtml(processingServiceText)}`,
      ];
      if (item.consultStatus === "consult") {
        baseLines.push("도어비 상담 안내");
        baseLines.push("경첩가공비 상담 안내");
        baseLines.push("가공서비스비 상담 안내");
        return baseLines;
      }
      baseLines.push(`도어비 ${item.materialCost.toLocaleString()}원`);
      baseLines.push(`경첩가공비 ${Number(item.doorHingeCost || 0).toLocaleString()}원`);
      baseLines.push(`가공서비스비 ${processingServiceOnlyCost.toLocaleString()}원`);
      return baseLines;
    },
    onQuantityChange: (id, value) => updateItemQuantity(id, value),
    onDelete: (id) => {
      const removedItem = state.items.find((it) => it.id === id);
      state.items = state.items.filter((it) => it.id !== id);
      renderTable();
      renderSummary();
      if (removedItem?.type === "addon") {
        syncAddonSelectionFromItems();
      }
    },
  });
  requestStickyOffsetUpdate();
}

function updateItemQuantity(id, quantity) {
  const idx = state.items.findIndex((it) => it.id === id);
  if (idx === -1) return;
  const item = state.items[idx];
  if (item.type === "addon") {
    const addon = BOARD_ADDON_ITEMS.find((a) => a.id === item.addonId);
    if (!addon) return;
    const detail = buildAddonLineItemDetail({ addon, quantity });
    state.items[idx] = { ...item, quantity, ...detail };
  } else {
    const detail = calcItemDetail({
      materialId: item.materialId,
      width: item.width,
      length: item.length,
      thickness: item.thickness,
      quantity,
      options: item.options,
      services: item.services,
      serviceDetails: item.serviceDetails,
      doorHingeConfig: item.doorHingeConfig,
      includeDiscountMeta: true,
    });
    state.items[idx] = { ...item, quantity, ...detail };
  }
  renderTable();
  renderSummary();
}
function renderSummary() {
  const summary = buildGrandSummary();
  const hasConsult = summary.hasConsult;
  const suffix = hasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const productHasConsult = hasConsultLineItem(state.items);
  const productSuffix = productHasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const productTotal = Number(summary.subtotal || 0);

  const productTotalEl = $("#productTotal");
  if (productTotalEl) productTotalEl.textContent = `${productTotal.toLocaleString()}${productSuffix}`;
  const materialsTotalEl = $("#materialsTotal");
  if (materialsTotalEl) materialsTotalEl.textContent = summary.materialsTotal.toLocaleString();
  $("#grandTotal").textContent = `${summary.grandTotal.toLocaleString()}${suffix}`;
  const fulfillmentCostEl = $("#fulfillmentCost");
  if (fulfillmentCostEl) fulfillmentCostEl.textContent = formatFulfillmentCostText(summary.fulfillment);

  const naverUnits = Math.ceil(summary.grandTotal / 1000);
  $("#naverUnits").textContent = `${naverUnits}${suffix}`;
  updateFulfillmentStepUI();
  updateSendButtonEnabled();
}

function buildEmailContent({ customerPhotoUploads = [], customerPhotoErrors = [] } = {}) {
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();

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
      buildDoorOrderCompleteDetailRows(item).forEach((row) => {
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
  const naverUnits = Math.ceil(summary.grandTotal / 1000) || 0;
  lines.push(`예상 제품금액: ${productTotal.toLocaleString()}원${productSuffix}`);
  lines.push(`배송/시공 서비스: ${formatFulfillmentLine(summary.fulfillment)}`);
  lines.push(`예상 결제금액: ${summary.grandTotal.toLocaleString()}원${suffix}`);
  lines.push(`예상 네이버 결제수량: ${naverUnits}개`);

  const subject = `[GGR 견적요청] ${customer.name || customer.ggrId || "고객"}`;
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
      pageKey: "door",
      customer,
      summary,
      customerPhotoUploads,
    }),
    items: state.items.map((item) => {
      const isAddon = item.type === "addon";
      const addon = isAddon ? BOARD_ADDON_ITEMS.find((candidate) => candidate.id === item.addonId) : null;
      const doorType = normalizeDoorType(item.doorType);
      const sideThickness = normalizeSideThickness(item.sideThickness);
      const hingeSpec = cloneDoorHingeConfig(item.doorHingeConfig || createDefaultDoorHingeConfig());
      if (!hingeSpec.enabled) hingeSpec.holes = [];
      return {
        lineId: item.id,
        itemType: isAddon ? "addon" : "product",
        name: isAddon ? addon?.name || "부자재" : MATERIALS[item.materialId]?.name || "",
        quantity: Number(item.quantity || 1),
        materialId: isAddon ? null : item.materialId,
        dimensions: isAddon
          ? null
          : {
              thicknessMm: Number(item.thickness || 0),
              sideThicknessMm: sideThickness,
              widthMm: Number(item.width || 0),
              lengthMm: Number(item.length || 0),
            },
        options: isAddon ? [] : Array.isArray(item.options) ? item.options : [],
        services: isAddon ? [] : Array.isArray(item.services) ? item.services : [],
        serviceDetails: isAddon ? {} : item.serviceDetails || {},
        doorSpec: isAddon
          ? null
          : {
              type: doorType,
              typeLabel: DOOR_TYPE_LABELS[doorType] || "",
              sideThicknessMm: sideThickness,
              hinges: hingeSpec,
            },
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

function resetOrderCompleteUI() {
  orderCompleted = false;
  const navActions = document.querySelector(".nav-actions");
  const completeEl = document.getElementById("orderComplete");
  const summaryCard = document.getElementById("stepFinal");
  const customerStep = document.getElementById("step5");
  const actionCard = document.querySelector(".action-card");
  ["step1", "step2", "stepPreview", "step3Additional"].forEach((id) =>
    document.getElementById(id)?.classList.remove("hidden-step")
  );
  document.getElementById("step4")?.classList.add("hidden-step");
  actionCard?.classList.remove("hidden-step");
  navActions?.classList.remove("hidden-step");
  completeEl?.classList.add("hidden-step");
  summaryCard?.classList.remove("order-complete-visible");
  summaryCard?.classList.remove("hidden-step");
  customerStep?.classList.add("hidden-step"); // 시작 시 고객정보 스텝 노출 방지
}

function showOrderComplete() {
  const navActions = document.querySelector(".nav-actions");
  const completeEl = document.getElementById("orderComplete");
  const fulfillmentStep = document.getElementById("step4");
  const customerStep = document.getElementById("step5");
  const summaryCard = document.getElementById("stepFinal");
  renderOrderCompleteDetails();
  orderCompleted = true;
  if (navActions) navActions.classList.add("hidden-step");
  if (fulfillmentStep) fulfillmentStep.classList.add("hidden-step");
  if (customerStep) customerStep.classList.add("hidden-step");
  if (completeEl) completeEl.classList.remove("hidden-step");
  summaryCard?.classList.add("order-complete-visible");
  summaryCard?.classList.add("hidden-step");
}

function resetFlow() {
  sendingEmail = false;
  orderCompleted = false;
  state.items = [];
  state.addons = [];
  const customerFields = [
    "#customerName",
    "#customerPhone",
    "#customerEmail",
    "#customerMemo",
    "#sample6_postcode",
    "#sample6_address",
  ];
  customerFields.forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = "";
  });
  customerPhotoUploader?.clear?.();
  setFulfillmentType("");
  setFulfillmentStepError("");
  renderTable();
  renderSummary();
  selectedMaterialId = "";
  resetStepsAfterAdd();
  currentPhase = 1;
  updateStepVisibility(document.getElementById("step1"));
  const navActions = document.querySelector(".nav-actions");
  const completeEl = document.getElementById("orderComplete");
  if (navActions) navActions.classList.remove("hidden-step");
  if (completeEl) completeEl.classList.add("hidden-step");
  document.getElementById("step5")?.classList.add("hidden-step");
  const summaryCard = document.getElementById("stepFinal");
  summaryCard?.classList.remove("order-complete-visible");
  summaryCard?.classList.remove("hidden-step");
  const consentEl = document.getElementById("privacyConsent");
  if (consentEl) consentEl.checked = false;
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

function buildDoorOrderCompleteDetailRows(item = {}) {
  const isAddon = item.type === "addon";
  const addonInfo = isAddon ? BOARD_ADDON_ITEMS.find((a) => a.id === item.addonId) : null;
  const materialName = isAddon ? addonInfo?.name || "부자재" : MATERIALS[item.materialId]?.name || "-";
  const sizeText = isAddon ? "-" : `${item.thickness}T / ${item.width}×${item.length}mm`;
  const doorTypeText = isAddon ? "-" : formatDoorTypeLabel(item.doorType);
  const sideThicknessText = isAddon ? "-" : formatSideThicknessLabel(item.sideThickness);
  const { processingServiceText, hingeText } = isAddon
    ? { processingServiceText: "-", hingeText: "-" }
    : getDoorProcessingCategoryTexts(item.services, item.serviceDetails, item.doorHingeConfig, {
        includeNote: true,
      });
  return [
    { label: "품목명", value: materialName },
    { label: "수량", value: `${Math.max(1, Number(item.quantity || 1))}개` },
    { label: "사이즈", value: sizeText },
    { label: "도어형태", value: doorTypeText },
    { label: "측면두께", value: sideThicknessText },
    { label: "옵션", value: isAddon ? "-" : item.optionsLabel || "-" },
    { label: "가공서비스", value: processingServiceText || "-" },
    { label: "경첩가공", value: hingeText || "-" },
  ];
}

function renderOrderCompleteDetails() {
  const container = document.getElementById("orderCompleteDetails");
  if (!container) return;
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();
  const productHasConsult = hasConsultLineItem(state.items);
  const productSuffix = productHasConsult ? CONSULT_EXCLUDED_SUFFIX : "";
  const productTotal = Number(summary.subtotal || 0);

  const itemsHtml =
    state.items.length === 0
      ? "<p class=\"item-line\">담긴 항목이 없습니다.</p>"
      : state.items
          .map((item, idx) => {
            const detailRowsHtml = buildCompleteDetailRowsHtml(buildDoorOrderCompleteDetailRows(item));
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
      <p>주소: ${escapeHtml(customer.postcode || "-")} ${escapeHtml(customer.address || "")}</p>
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
      <p>예상 결제금액: ${summary.grandTotal.toLocaleString()}원${
        summary.hasConsult ? CONSULT_EXCLUDED_SUFFIX : ""
      }</p>
    </div>
  `;
}

async function sendQuote() {
  if (state.items.length === 0) {
    showInfoModal("담긴 항목이 없습니다. 주문을 담아주세요.");
    return;
  }
  const customer = getCustomerInfo();
  const customerError = validateCustomerInfo(customer);
  if (customerError) {
    showInfoModal(customerError);
    return;
  }
  sendingEmail = true;
  updateSendButtonEnabled();

  const selectedCustomerPhotos = customerPhotoUploader?.getSelectedFiles?.() || [];
  const customerPhotoUploadResult = await uploadCustomerPhotoFilesToCloudinary({
    files: selectedCustomerPhotos,
    pageKey: "door",
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
  try {
    await submitOrderNotification({
      customer,
      orderTimeText,
      subject,
      message: body,
      orderLines: lines,
      payload,
      customerPhotoUploads,
      customerPhotoErrors,
      emailjsInstance: getEmailJSInstance(showInfoModal),
      showInfoModal,
    });
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

function updateThicknessOptions(materialId) {
  const select = $("#thicknessSelect");
  select.innerHTML = `<option value="">두께를 선택하세요</option>`;
  if (!materialId) return;
  const mat = MATERIALS[materialId];
  (mat.availableThickness || []).forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = `${t}T`;
    select.appendChild(opt);
  });
  // 자동 선택 제거: 사용자가 직접 선택하도록 유지
  autoCalculatePrice();
}

function renderDoorTypeOptions() {
  const select = $("#doorTypeSelect");
  if (!select) return;
  const currentValue = normalizeDoorType(select.value);
  select.innerHTML = `<option value="">도어 형태를 선택해주세요</option>`;
  Object.entries(DOOR_TYPE_LABELS).forEach(([value, label]) => {
    const optionEl = document.createElement("option");
    optionEl.value = value;
    optionEl.textContent = label;
    select.appendChild(optionEl);
  });
  if (currentValue) select.value = currentValue;
}

function renderSideThicknessOptions() {
  const select = $("#sideThicknessSelect");
  if (!select) return;
  const currentValue = normalizeSideThickness(select.value);
  select.innerHTML = `<option value="">측면 두께를 선택해주세요</option>`;
  SIDE_THICKNESS_OPTIONS.forEach((item) => {
    const optionEl = document.createElement("option");
    optionEl.value = String(item.value);
    optionEl.textContent = item.label;
    select.appendChild(optionEl);
  });
  if (currentValue) select.value = String(currentValue);
}

function validateSizeFields() {
  const calcBtn = $("#calcItemBtn");
  const mat = MATERIALS[selectedMaterialId];
  const { minWidth: widthMin, maxWidth: widthMax, minLength: lengthMin, maxLength: lengthMax } =
    getDoorDimensionLimits(mat);

  const { valid } = updateSizeErrors({
    widthId: "widthInput",
    lengthId: "lengthInput",
    widthErrorId: "widthError",
    lengthErrorId: "lengthError",
    widthMin,
    widthMax,
    lengthMin,
    lengthMax,
  });

  if (calcBtn) calcBtn.disabled = !valid;
  updateAddItemState();
}

function autoCalculatePrice() {
  const input = readCurrentInputs();
  const err = validateInputs(input);
  if (err) {
    renderItemPriceNotice({ target: "#itemPriceDisplay", text: err });
    updateAddItemState();
    return;
  }
  const detail = calcItemDetail({ ...input, quantity: 1 });
  if (detail.error) {
    renderItemPriceNotice({ target: "#itemPriceDisplay", text: detail.error });
    updateAddItemState();
    return;
  }
  if (detail.consultStatus === "consult") {
    renderItemPriceDisplay({
      target: "#itemPriceDisplay",
      totalLabel: "예상금액",
      totalText: "상담 안내",
      breakdownRows: buildDoorPriceBreakdownRows({
        consultState: detail,
        hingeHasConsult: true,
      }),
    });
    updateAddItemState();
    return;
  }
  renderItemPriceDisplay({
    target: "#itemPriceDisplay",
    totalLabel: "예상금액",
    totalAmount: detail.total,
    showConsultSuffix: Boolean(detail?.consult?.hasItems ?? detail.hasConsultItems),
    breakdownRows: buildDoorPriceBreakdownRows({
      itemCost: detail.materialCost,
      optionCost: detail.optionCost,
      processingServiceCost: detail.processingServiceCost,
      hingeCost: detail.doorHingeCost,
      consultState: detail,
    }),
  });
  updateAddItemState();
}

function updatePreview() {
  const colorEl = $("#previewColor");
  const textEl = $("#previewText");
  if (!colorEl || !textEl) return;
  clearPreviewDimensionChips(colorEl);

  const input = readCurrentInputs();
  const mat = MATERIALS[input.materialId];
  if (
    !mat ||
    !input.width ||
    !input.length ||
    !input.thickness ||
    !input.doorType ||
    !input.sideThickness
  ) {
    colorEl.style.background = SWATCH_FALLBACK;
    colorEl.style.width = "120px";
    colorEl.style.height = "120px";
    textEl.textContent = "도어와 사이즈를 선택하면 미리보기가 표시됩니다.";
    clearPreviewHoles();
    return;
  }
  colorEl.style.background = mat.thumbnail
    ? `url('${String(mat.thumbnail).replace(/'/g, "%27")}') center/cover no-repeat`
    : mat.swatch || SWATCH_FALLBACK;
  const { maxPx, minPx } = getPreviewScaleBounds(colorEl, { fallbackMax: 180, fallbackMin: 40 });
  const { w, h } = getPreviewDimensions(input.width, input.length, maxPx, minPx);
  colorEl.style.width = `${w}px`;
  colorEl.style.height = `${h}px`;
  textEl.textContent = `${mat.name} / ${formatDoorTypeLabel(input.doorType)} / ${input.thickness}T / 측면 ${formatSideThicknessLabel(input.sideThickness)} / ${input.width}×${input.length}mm`;
  renderPreviewHoles(input);
  renderPreviewDimensionChips(colorEl, { widthMm: input.width, lengthMm: input.length });
}

function clearPreviewHoles() {
  const colorEl = $("#previewColor");
  if (!colorEl) return;
  colorEl.querySelectorAll(".hole-dot").forEach((el) => el.remove());
}

function resetProcessingServiceOptions() {
  const hasSelectedProcessingService = document.querySelector('input[name="processingService"]:checked');
  const hasDetails = state.processingServiceDetails && Object.keys(state.processingServiceDetails).length > 0;
  if (!hasSelectedProcessingService && !hasDetails) return;

  clearProcessingServices();
  clearPreviewHoles();
  autoCalculatePrice();
  updateAddItemState();
}

function renderPreviewHoles(input) {
  const colorEl = $("#previewColor");
  if (!colorEl) return;
  clearPreviewHoles();
  const hasHinge = Boolean(input?.doorHingeConfig?.enabled);
  const hasHandle = input?.services?.includes("proc_handle_hole");
  if (!hasHinge && !hasHandle) return;
  if (!input.width || !input.length) return;
  const hingeHoles =
    hasHinge && Array.isArray(input.doorHingeConfig?.holes)
      ? input.doorHingeConfig.holes
      : [];
  const handleHoles =
    hasHandle && Array.isArray(input.serviceDetails?.proc_handle_hole?.holes)
      ? input.serviceDetails.proc_handle_hole.holes
      : [];
  const holes = [
    ...hingeHoles.map((h) => ({ ...h, _type: "hinge" })),
    ...handleHoles.map((h) => ({ ...h, _type: "handle" })),
  ];
  if (holes.length === 0) return;

  const rect = colorEl.getBoundingClientRect();
  const inlineWidth = Number.parseFloat(colorEl.style.width);
  const inlineHeight = Number.parseFloat(colorEl.style.height);
  // Prefer target dimensions from inline style so hole coordinates stay correct while size transition is running.
  const pxW = Number.isFinite(inlineWidth) && inlineWidth > 0 ? inlineWidth : rect.width;
  const pxH = Number.isFinite(inlineHeight) && inlineHeight > 0 ? inlineHeight : rect.height;
  if (!pxW || !pxH) return;
  const scaleX = pxW / input.width;
  const scaleY = pxH / input.length;
  const scale = Math.min(scaleX, scaleY);

  holes.forEach((h) => {
    const distX = Number(h.distance);
    const distY = Number(h.verticalDistance);
    if (!Number.isFinite(distX) || !Number.isFinite(distY) || distX <= 0 || distY <= 0) return;
    const x = h.edge === "right" ? pxW - distX * scaleX : distX * scaleX;
    const y = h.verticalRef === "bottom" ? pxH - distY * scaleY : distY * scaleY;
    const diameterMm = h._type === "handle" ? 15 : 35;
    const sizePx = diameterMm * scale;
    const dot = document.createElement("div");
    dot.className = `hole-dot${h._type === "handle" ? " handle-hole" : ""}`;
    dot.style.width = `${sizePx}px`;
    dot.style.height = `${sizePx}px`;
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    colorEl.appendChild(dot);
  });
}

function updateSelectedMaterialLabel() {
  const fallbackSelected = document.querySelector('input[name="material"]:checked');
  const matId = selectedMaterialId || fallbackSelected?.value;
  if (matId && !selectedMaterialId) {
    selectedMaterialId = matId;
  }
  const mat = MATERIALS[matId];
  const priceLines = mat ? formatDoorPriceTierLines(mat.category) : [];
  renderSelectedCard({
    cardId: "#selectedMaterialCard",
    emptyTitle: "선택된 도어 없음",
    emptyMeta: "도어를 선택해주세요.",
    swatch: mat?.swatch,
    imageUrl: mat?.thumbnail,
    name: mat ? escapeHtml(mat.name) : "",
    metaLines: mat
      ? [
          ...priceLines,
          `두께 ${(mat.availableThickness || []).map((t) => `${t}T`).join(", ")}`,
          `폭 ${mat.minWidth}~${mat.maxWidth}mm`,
          `길이 ${mat.minLength}~${mat.maxLength}mm`,
        ]
      : [],
  });
}

const processingServiceModalController = createProcessingServiceModalController({
  modalId: "#processingServiceModal",
  titleId: "#processingServiceModalTitle",
  bodyId: "#processingServiceModalBody",
  errorId: "#processingServiceModalError",
  noteId: "processingServiceNote",
  focusTarget: "#processingServiceModalTitle",
  processingServices: PROCESSING_SERVICES,
  state,
  getDefaultProcessingServiceDetail,
  cloneProcessingServiceDetails,
  updateProcessingServiceSummary,
  openModal,
  closeModal,
  onRevertSelection: () => {
    autoCalculatePrice();
    updateAddItemState();
  },
  onAfterSave: () => {
    autoCalculatePrice();
    updateAddItemState();
    requestPreviewUpdate();
  },
  onAfterRemove: () => {
    autoCalculatePrice();
    updateAddItemState();
    requestPreviewUpdate();
  },
  onAfterClose: () => {
    requestPreviewUpdate();
  },
});

function openProcessingServiceModal(serviceId, triggerCheckbox, mode = "change") {
  processingServiceModalController.open(serviceId, triggerCheckbox, mode);
}

function closeProcessingServiceModal(revertSelection = true) {
  processingServiceModalController.close(revertSelection);
}

function saveProcessingServiceModal() {
  processingServiceModalController.save();
}

function removeProcessingServiceModal() {
  processingServiceModalController.remove();
}

function closeMaterialModal() {
  closeModal("#materialModal");
}

function updateModalCardPreviews() {
  const selectedVisual = document.querySelector("#selectedMaterialCard .material-visual");
  if (selectedVisual) {
    selectedVisual.style.width = "";
    selectedVisual.style.height = "";
  }
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

function requestPreviewUpdate() {
  if (previewResizeTimer) cancelAnimationFrame(previewResizeTimer);
  previewResizeTimer = requestAnimationFrame(() => {
    previewResizeTimer = null;
    updatePreview();
  });
}

function updateSizePlaceholders(mat) {
  const widthEl = $("#widthInput");
  const lengthEl = $("#lengthInput");
  if (!widthEl || !lengthEl) return;
  const limits = getDoorDimensionLimits(mat);
  widthEl.min = String(limits.minWidth);
  widthEl.max = String(limits.maxWidth);
  lengthEl.min = String(limits.minLength);
  lengthEl.max = String(limits.maxLength);
  if (!mat) {
    widthEl.placeholder = `폭 ${limits.minWidth}~${limits.maxWidth}mm`;
    lengthEl.placeholder = `길이 ${limits.minLength}~${limits.maxLength}mm`;
    return;
  }
  widthEl.placeholder = `폭 ${limits.minWidth}~${limits.maxWidth}mm`;
  lengthEl.placeholder = `길이 ${limits.minLength}~${limits.maxLength}mm`;
}

function handleDoorHingeUiChange({ rerenderRows = false, preserveExistingValues = true } = {}) {
  if (rerenderRows) {
    renderDoorHingeRows({ preserveExistingValues });
  } else {
    readDoorHingeConfigFromDOM();
  }
  const length = getCurrentDoorLengthInputValue();
  if (!isDoorLengthReady(length)) {
    setDoorHingeInputErrors([]);
    setDoorHingeError("");
  } else {
    const validation = validateDoorHingeConfigDetailed(state.doorHingeConfig, { length });
    setDoorHingeInputErrors(validation.invalidIndexes);
    setDoorHingeError(validation.message);
  }
  syncDoorHingeFieldVisibility();
  autoCalculatePrice();
  requestPreviewUpdate();
  updateDoorPreviewSummary();
  updateAddItemState();
}

function initDoorHingeSection() {
  const rowsEl = $("#doorHingeRows");
  const sideButtons = Array.from(document.querySelectorAll("[data-door-hinge-side]"));
  if (!rowsEl || sideButtons.length === 0) return;

  state.doorHingeConfig = normalizeDoorHingeConfig(state.doorHingeConfig, {
    length: getCurrentDoorLengthInputValue(),
  });
  setDoorHingeSide(state.doorHingeConfig.side);
  syncDoorHingeFieldVisibility();
  renderDoorHingeRows({ preserveExistingValues: false });
  setDoorHingeError("");

  sideButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setDoorHingeSide(btn.dataset.doorHingeSide || "left");
      handleDoorHingeUiChange({ rerenderRows: true, preserveExistingValues: true });
    });
  });
  rowsEl.addEventListener("input", (event) => {
    if (!event.target.classList.contains("door-hinge-vertical-input")) return;
    handleDoorHingeUiChange({ rerenderRows: false });
  });
}

let initialized = false;

function init() {
  if (initialized) return;

  // DOM 요소가 아직 없으면 조금 뒤에 재시도
  const materialCardsEl = $("#materialCards");
  const materialTabsEl = $("#materialTabs");
  const processingServiceCardsEl = $("#processingServiceCards");
  if (!materialCardsEl || !materialTabsEl || !processingServiceCardsEl) {
    setTimeout(init, 50);
    return;
  }

  initialized = true;

  resetOrderCompleteUI();

  initEmailJS();
  customerPhotoUploader = initCustomerPhotoUploader({
    showInfoModal,
    onChange: () => updateSendButtonEnabled(),
  });

  renderDoorTypeOptions();
  renderSideThicknessOptions();
  renderMaterialTabs();
  renderMaterialCards();
  renderOptionCards();
  renderProcessingServiceCards();
  renderFulfillmentServiceMediaSlots({ mediaByType: FULFILLMENT_SERVICE_MEDIA });
  syncProcessingSectionVisibility();
  initDoorHingeSection();
  initCollapsibleSections();
  renderAddonCards();
  renderTable();
  renderSummary();
  validateSizeFields();
  autoCalculatePrice();
  updatePreview();
  updateDoorPreviewSummary();
  updateModalCardPreviews();
  updateSelectedMaterialLabel();
  updateSizePlaceholders(MATERIALS[selectedMaterialId]);
  updateSelectedAddonsDisplay();
  updateAddItemState();
  updateStepVisibility();
  setFulfillmentType(getFulfillmentType());
  updateFulfillmentStepUI();
  requestStickyOffsetUpdate();

  bindModalOpenTriggers();
  bindModalCloseTriggers();
  $("#measurementGuideModalBody")?.addEventListener("click", handleMeasurementGuideCarouselClick);
  $("#nextStepsBtn")?.addEventListener("click", goToNextStep);
  $("#prevStepsBtn")?.addEventListener("click", goToPrevStep);

  const handleSizeInputChange = (event) => {
    updateModalCardPreviews();
    updateSelectedMaterialLabel();
    if (event?.target?.id === "lengthInput") {
      renderDoorHingeRows({ preserveExistingValues: false });
      autoCalculatePrice();
      requestPreviewUpdate();
    }
    updateDoorPreviewSummary();
  };

  bindSizeInputHandlers({
    widthId: "widthInput",
    lengthId: "lengthInput",
    handlers: [
      validateSizeFields,
      resetProcessingServiceOptions,
      autoCalculatePrice,
      requestPreviewUpdate,
      handleSizeInputChange,
    ],
    thicknessId: "thicknessSelect",
    thicknessHandlers: [() => {
      resetProcessingServiceOptions();
      autoCalculatePrice();
      requestPreviewUpdate();
      updateSelectedMaterialLabel();
      const selected = MATERIALS[selectedMaterialId];
      updateSizePlaceholders(selected);
    }],
  });
  ["doorTypeSelect", "sideThicknessSelect"].forEach((id) => {
    const selectEl = document.getElementById(id);
    selectEl?.addEventListener("change", () => {
      autoCalculatePrice();
      requestPreviewUpdate();
      updateDoorPreviewSummary();
      updateAddItemState();
    });
  });
  $("#saveProcessingServiceModal")?.addEventListener("click", saveProcessingServiceModal);
  $("#cancelProcessingServiceModal")?.addEventListener("click", () => closeProcessingServiceModal(true));
  $("#processingServiceModalBackdrop")?.addEventListener("click", () => closeProcessingServiceModal(true));
  $("#stepFinal .estimate-toggle")?.addEventListener("click", requestStickyOffsetUpdate);
  $("#backToCenterBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  $("#sendQuoteBtn")?.addEventListener("click", sendQuote);
  document.getElementById("privacyConsent")?.addEventListener("change", updateSendButtonEnabled);
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
  ["#sample6_postcode", "#sample6_address"].forEach((sel) => {
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
  window.addEventListener("resize", () => {
    requestStickyOffsetUpdate();
    requestPreviewUpdate();
  });
  $("#previewColor")?.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "width" && event.propertyName !== "height") return;
    requestPreviewUpdate();
  });
  document.addEventListener("change", (e) => {
    if (e.target.name === "material" || e.target.name === "processingService") {
      autoCalculatePrice();
      requestPreviewUpdate();
      updateDoorPreviewSummary();
      updateAddItemState();
    }
  });
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const guideBtn = target?.closest("[data-measurement-guide]");
    if (!guideBtn) return;
    openMeasurementGuideModal(guideBtn.dataset.measurementGuide || "");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
} else {
  init();
}
