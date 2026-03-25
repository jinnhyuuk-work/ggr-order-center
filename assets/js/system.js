import {
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  SYSTEM_MATERIAL_CATEGORIES_DESC,
  SYSTEM_SHELF_TIER_PRICING,
  SYSTEM_POST_BAR_PRICING,
  SYSTEM_POST_BAR_HEIGHT_LIMITS as MODULE_POST_BAR_HEIGHT_LIMITS,
  SYSTEM_ADDON_ITEM_IDS,
  SYSTEM_ADDON_OPTION_CONFIG,
  SYSTEM_ADDON_ITEMS,
  SYSTEM_FURNITURE_WIDTH_POLICY,
  SYSTEM_MODULE_OPTION_CONFIG,
  SYSTEM_MODULE_PRESETS,
  SYSTEM_MODULE_PRESET_CATEGORIES,
} from "./data/system-data.js";
import {
  createPreviewAddFlowState,
  clearPreviewAddFlowTarget,
  resetPreviewAddFlowState,
  createPreviewPresetPickerFlowState,
  resetPreviewPresetPickerFlowState,
  patchPreviewPresetPickerFlowState,
  createPresetModuleOptionFlowState,
  resetPresetModuleOptionFlowState,
  patchPresetModuleOptionFlowState,
  createPreviewModuleActionFlowState,
  resetPreviewModuleActionFlowState,
} from "./system-flow-state.js";
import {
  setPreviewAddFlowStep,
  setPreviewAddFlowTarget,
  buildPreviewAddCloseUiDispatchPlan,
  buildPreviewAddTypeModalOpenViewModel,
  buildPreviewAddTypeModalOpenUiExecutionPlan,
  buildPreviewAddTypeModalStepViewState,
  buildPreviewAddTypeSelectionUiExecutionPlan,
  buildPreviewAddTypeSelectionUiDispatchPlan,
  buildRootCornerStartTargetVariant,
  hasSelectedRootCornerStartDirection,
  buildPreviewAddRootCornerDirectionBlockedMessages,
  buildPreviewAddRootCornerDirectionSelectionUiExecutionPlan,
  buildPreviewAddRootCornerDirectionSelectionUiDispatchPlan,
  buildPreviewAddTypeBackUiExecutionPlan,
  setPreviewModuleActionFlowTarget,
  buildPreviewModuleActionCloseUiDispatchPlan,
  getClosedModalIdFromEvent,
  buildPendingDirectComposeCleanupPlan,
  buildPendingDirectComposeCleanupRuntimePlan,
  buildPresetModuleOptionCloseUiDispatchPlan,
  setPreviewPresetPickerOpenState,
  clonePreviewAddTargetSnapshot,
  clonePresetModuleOptionBackContext,
  buildPresetModuleOptionOpenUiDispatchPlan,
  buildPresetModuleOptionCustomComposeSessionBootstrap,
  buildPresetModuleOptionCustomComposeBootstrapUiExecutionPlan,
  buildPendingCornerComposeEdge,
  buildPendingCornerComposeEdgeCreatePlan,
  buildPreviewPresetCornerEdge,
  buildPresetModuleOptionCustomCornerComposeValidation,
  buildPresetModuleOptionCustomCornerCreationUiExecutionPlan,
  buildPresetModuleOptionCustomComposeCreationUiExecutionPlan,
  buildPendingBayComposeAddOptions,
  buildPreviewAddSourceResolutionResult,
  buildPreviewAddNormalCommitUiExecutionPlan,
  buildPreviewAddCornerCommitUiExecutionPlan,
  buildPreviewPresetNormalAddUiExecutionPlan,
  buildPreviewPresetCornerAddUiExecutionPlan,
  buildPresetModuleOptionCustomComposeSourceUiExecutionPlan,
  buildPresetModuleOptionDraftAfterFilterChange,
  buildPresetModuleOptionDraftAfterTabChange,
  buildPresetModuleOptionDraftForReopenAfterPresetPicker,
  buildPresetModuleOptionDraftAfterPresetPickerSelection,
  normalizePresetModuleOptionDraftForSync,
  buildPresetModuleOptionSyncPreViewModel,
  buildPresetModuleOptionCustomSyncResolvedViewModel,
  buildPresetModuleOptionSyncDomUiViewModel,
  buildPresetModuleOptionCustomSyncPreUiDispatchPlan,
  buildPresetModuleOptionCustomSyncPostUiDispatchPlan,
  buildPresetModuleOptionSaveUiDispatchPlan,
  buildPresetModuleOptionSaveRuntimeUiDispatchPlan,
  isPresetModuleOptionCustomTabActive,
  buildPreviewPresetPickerOpenUiExecutionPlan,
  buildPreviewPresetPickerOpenUiDispatchPlan,
  resolvePreviewPresetPickerTargetEdgeForOpenContext,
  buildPreviewPresetPickerVisibleSelectionPatch,
  buildPreviewPresetPickerCardClickUiExecutionPlan,
  buildPreviewPresetPickerApplyRuntimeUiDispatchPlan,
  buildPreviewPresetPickerDefaultOpenState,
  resolvePreviewPresetDefaultFilterKeyForTargetEdge,
  buildPreviewPresetApplyRuntimeUiDispatchPlan,
  resolvePreviewPresetMatchedIdForTargetEdge,
  buildPreviewPresetPickerOpenFromPresetModuleOption,
  buildPreviewPresetPickerCloseUiDispatchPlan,
  buildPreviewAddPresetModuleOptionOpenPlan,
  buildPresetModuleOptionOpenFromPreviewAddUiDispatchPlan,
  buildPresetModuleOptionOpenFromPreviewAddExceptionUiDispatchPlan,
  buildPreviewAddOpenArgsFromBackContext,
  buildPresetModuleOptionBackUiDispatchPlan,
  buildPresetModuleOptionOpenFromDirectComposeEdge,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
  normalizePresetModuleOptionMode,
  normalizePresetModuleOptionTab,
} from "./system-flow.js";
import { createSystemPricingHelpers } from "./system-pricing.js";
import {
  initEmailJS,
  EMAILJS_CONFIG,
  openModal,
  closeModal,
  getCustomerInfo,
  validateCustomerInfo,
  updateSendButtonEnabled as updateSendButtonEnabledShared,
  isConsentChecked,
  getEmailJSInstance,
  renderEstimateTable,
  renderSelectedCard,
  buildMaterialVisualInlineStyle,
  initCollapsibleSections,
  renderItemPriceDisplay,
  renderItemPriceNotice,
  calcGroupedAmount,
} from "./shared.js";
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
  SYSTEM_FULFILLMENT_POLICY,
} from "./data/fulfillment-policy-data.js";
import { resolveInstallationTravelZoneByAddress } from "./installation-travel-zone.js";
import { SYSTEM_MEASUREMENT_GUIDES } from "./data/measurement-guides-data.js";
import { createMeasurementGuideModalController } from "./measurement-guide-core.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const SHELF_PANEL_LIMITS = Object.freeze({
  minWidth: 460,
  maxWidth: 1200,
  minLength: 200,
  maxLength: 2400,
});
const POST_BAR_LENGTH_LIMITS = Object.freeze({
  minLength: MODULE_POST_BAR_HEIGHT_LIMITS.min,
  maxLength: MODULE_POST_BAR_HEIGHT_LIMITS.max,
});
const SYSTEM_DIMENSION_LIMITS = Object.freeze({
  shelf: SHELF_PANEL_LIMITS,
  column: POST_BAR_LENGTH_LIMITS,
});

const LIMITS = {
  // NOTE:
  // - `LIMITS.shelf` is panel/material spec bounds used in validation/pricing helpers.
  // - module width input bounds are controlled separately by `MODULE_SHELF_WIDTH_LIMITS`.
  shelf: SYSTEM_DIMENSION_LIMITS.shelf,
  column: SYSTEM_DIMENSION_LIMITS.column,
};

const COLUMN_WIDTH_MM = 30;
const COLUMN_ENDPOINT_WIDTH_MM = 25;
const COLUMN_DEPTH_MM = 75;
const COLUMN_EXTRA_LENGTH_THRESHOLD = 2400;
const SHELF_LENGTH_MM = 400;
const SHELF_THICKNESS_MM = 18;
const COLUMN_THICKNESS_MM = 18;
// Module input width (shelf width only, without post bar).
const MODULE_SHELF_WIDTH_LIMITS = Object.freeze({ min: 400, max: 1000 });
const FURNITURE_ALLOWED_NORMAL_WIDTHS = Object.freeze(
  Array.isArray(SYSTEM_FURNITURE_WIDTH_POLICY?.standardWidths)
    ? SYSTEM_FURNITURE_WIDTH_POLICY.standardWidths.map((width) => Math.round(Number(width || 0))).filter((width) => width > 0)
    : [600, 800]
);
const FURNITURE_SELECTABLE_RANGE_MIN_MM = Math.max(
  1,
  Math.round(Number(SYSTEM_FURNITURE_WIDTH_POLICY?.selectableRange?.min || 600))
);
const FURNITURE_SELECTABLE_RANGE_MAX_MM = Math.max(
  FURNITURE_SELECTABLE_RANGE_MIN_MM,
  Math.round(Number(SYSTEM_FURNITURE_WIDTH_POLICY?.selectableRange?.max || 800))
);
const FURNITURE_DISABLED_AT_OR_BELOW_MM = Math.max(
  0,
  Math.round(Number(SYSTEM_FURNITURE_WIDTH_POLICY?.disabledAtOrBelow || 400))
);
const FURNITURE_CONSULT_PRICE_GT_MM = Math.max(
  FURNITURE_DISABLED_AT_OR_BELOW_MM,
  Math.round(Number(SYSTEM_FURNITURE_WIDTH_POLICY?.consultPriceAbove || 800))
);
const SUPPORT_BRACKET_WIDTH_MM = 15;
const SUPPORT_BRACKET_INSERT_MM = 10;
const SUPPORT_VISIBLE_MM = SUPPORT_BRACKET_WIDTH_MM - SUPPORT_BRACKET_INSERT_MM;
const ADDON_CLOTHES_ROD_ID = SYSTEM_ADDON_ITEM_IDS.CLOTHES_ROD || "clothes_rod";
const COLUMN_ENDPOINT_HALF_MM = COLUMN_ENDPOINT_WIDTH_MM / 2;
const SYSTEM_SHAPE_DEFAULT = "i_single";
const SYSTEM_SHAPE_KEYS = Object.freeze(["i_single", "l_shape", "rl_shape", "u_shape", "box_shape"]);
const SYSTEM_LAYOUT_TYPE_LABELS = Object.freeze({
  i_single: "ㅣ자",
  l_shape: "ㄱ자",
  rl_shape: "역ㄱ자",
  u_shape: "ㄷ자",
  box_shape: "ㅁ자",
});
const SYSTEM_SECTION_LENGTH_MIN_MM = 460;
const SYSTEM_SECTION_LENGTH_CONSULT_AT_MM = 8000;
const SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM = MODULE_POST_BAR_HEIGHT_LIMITS.consultAt;

const SHAPE_BAY_COUNTS = {
  i_single: 1,
  l_shape: 2,
  rl_shape: 2,
  u_shape: 3,
  box_shape: 4,
};
const SYSTEM_SHAPE_CORNER_LIMITS = Object.freeze({
  i_single: 0,
  l_shape: 1,
  rl_shape: 1,
  u_shape: 2,
  box_shape: 4,
});
const SYSTEM_SHAPE_CORNER_ATTACH_SIDE_RULES = Object.freeze({
  // directionToSideIndex mapping: right=0, bottom=1, left=2, top=3
  l_shape: { allowedAttachSideIndices: [0], label: "우측" },
  rl_shape: { allowedAttachSideIndices: [2], label: "좌측" },
});
const FREE_LAYOUT_MODE = true;
const BUILDER_HISTORY_LIMIT = 80;
const {
  calcAddonCostBreakdown,
  calcBayDetail,
  calcColumnsDetail,
  calcOrderSummary,
} = createSystemPricingHelpers({
  limits: SYSTEM_DIMENSION_LIMITS,
  shelfLengthMm: SHELF_LENGTH_MM,
  postBarPriceMaxHeightMm: SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM,
  addonClothesRodId: ADDON_CLOTHES_ROD_ID,
});

function normalizeSystemShape(shape) {
  return SYSTEM_SHAPE_KEYS.includes(shape) ? shape : SYSTEM_SHAPE_DEFAULT;
}

function getSectionCountForShape(shape) {
  return SHAPE_BAY_COUNTS[normalizeSystemShape(shape)] || 1;
}

function getShapeCornerLimit(shape = getSelectedShape()) {
  const normalizedShape = normalizeSystemShape(shape);
  const limit = SYSTEM_SHAPE_CORNER_LIMITS[normalizedShape];
  return Number.isFinite(Number(limit)) ? Math.max(0, Number(limit)) : Infinity;
}

function createDefaultLayoutConfig(shape = SYSTEM_SHAPE_DEFAULT) {
  const normalizedShape = normalizeSystemShape(shape);
  const sectionCount = getSectionCountForShape(normalizedShape);
  return {
    shapeType: normalizedShape,
    // S-01: 신규 타입/설치공간 기능을 위한 상태 모델만 먼저 준비한다.
    sections: Array.from({ length: sectionCount }, (_, idx) => ({
      id: `section-${idx + 1}`,
      lengthMm: 0,
      label: `설치공간${idx + 1}`,
    })),
    lowestHeightMm: 0,
    highestHeightMm: 0,
    sectionUsage: [],
    status: "ok", // ok | consult | invalid (S-04에서 판정 연결)
    consultReasons: [],
    constraints: {
      sectionLengthMinMm: SYSTEM_SECTION_LENGTH_MIN_MM,
      consultSectionLengthAtMm: SYSTEM_SECTION_LENGTH_CONSULT_AT_MM,
    },
  };
}

function syncLayoutConfigShape(nextShape) {
  const normalizedShape = normalizeSystemShape(nextShape);
  const prev = state.layoutConfig || createDefaultLayoutConfig(normalizedShape);
  const prevShapeType = normalizeSystemShape(prev.shapeType || SYSTEM_SHAPE_DEFAULT);
  const nextSectionCount = getSectionCountForShape(normalizedShape);
  const shapeChanged = prevShapeType !== normalizedShape;
  const nextSections = Array.from({ length: nextSectionCount }, (_, idx) => {
    const prevSection = prev.sections?.[idx];
    return {
      id: prevSection?.id || `section-${idx + 1}`,
      lengthMm: Number(prevSection?.lengthMm || 0),
      label: prevSection?.label || `설치공간${idx + 1}`,
    };
  });
  const nextSectionUsage =
    !shapeChanged && Array.isArray(prev.sectionUsage)
      ? prev.sectionUsage
          .slice(0, nextSectionCount)
          .map((usage, idx) => ({
            sectionIndex: Number.isFinite(Number(usage?.sectionIndex))
              ? Number(usage.sectionIndex)
              : idx,
            edgeHint: String(usage?.edgeHint || ""),
            usedMm: Math.max(0, Number(usage?.usedMm || 0)),
            targetMm: Math.max(0, Number(usage?.targetMm || 0)),
            overflow: Boolean(usage?.overflow),
          }))
      : [];
  state.layoutConfig = {
    ...prev,
    shapeType: normalizedShape,
    sections: nextSections,
    sectionUsage: nextSectionUsage,
    constraints: {
      sectionLengthMinMm: SYSTEM_SECTION_LENGTH_MIN_MM,
      consultSectionLengthAtMm: SYSTEM_SECTION_LENGTH_CONSULT_AT_MM,
    },
  };
  return state.layoutConfig;
}

const state = {
  items: [],
  shelfAddons: {},
  graph: null,
  layoutConfig: createDefaultLayoutConfig(),
};

function getLayoutTypeLabel(shape) {
  return SYSTEM_LAYOUT_TYPE_LABELS[normalizeSystemShape(shape)] || SYSTEM_LAYOUT_TYPE_LABELS[SYSTEM_SHAPE_DEFAULT];
}

function getRenderedSpaceInputCount() {
  return Math.max(1, document.querySelectorAll('[id^="spaceMin-"]').length);
}

function syncLayoutConfigRuntimeFields(input) {
  const layout = syncLayoutConfigShape(input?.shape || getSelectedShape());
  const lowestHeightMm = Number(input?.spaces?.[0]?.min || 0);
  const highestHeightCandidate = Number(input?.column?.maxLength || input?.spaces?.[0]?.max || 0);
  layout.lowestHeightMm = Number.isFinite(lowestHeightMm) && lowestHeightMm > 0 ? lowestHeightMm : 0;
  layout.highestHeightMm =
    Number.isFinite(highestHeightCandidate) && highestHeightCandidate > 0 ? highestHeightCandidate : 0;
  return layout;
}

function syncLayoutSectionLengthsFromDOM() {
  const layout = syncLayoutConfigShape(getSelectedShape());
  if (!layout || !Array.isArray(layout.sections)) return layout;
  document.querySelectorAll("[data-layout-section-length]").forEach((inputEl) => {
    const index = Number(inputEl?.dataset?.layoutSectionLength ?? -1);
    if (!Number.isFinite(index) || index < 0 || !layout.sections[index]) return;
    const value = Number(inputEl.value || 0);
    layout.sections[index].lengthMm = Number.isFinite(value) && value > 0 ? value : 0;
  });
  return layout;
}

function getLayoutConfigSnapshot(input = null) {
  const base = syncLayoutConfigShape(input?.shape || state.layoutConfig?.shapeType || SYSTEM_SHAPE_DEFAULT);
  const lowestHeightCandidate = Number(input?.spaces?.[0]?.min || base.lowestHeightMm || 0);
  const highestHeightCandidate = Number(
    input?.column?.maxLength || input?.spaces?.[0]?.max || base.highestHeightMm || 0
  );
  return {
    shapeType: normalizeSystemShape(base.shapeType),
    shapeLabel: getLayoutTypeLabel(base.shapeType),
    lowestHeightMm:
      Number.isFinite(lowestHeightCandidate) && lowestHeightCandidate > 0 ? lowestHeightCandidate : 0,
    highestHeightMm:
      Number.isFinite(highestHeightCandidate) && highestHeightCandidate > 0 ? highestHeightCandidate : 0,
    sections: (base.sections || []).map((section, idx) => ({
      id: String(section?.id || `section-${idx + 1}`),
      label: String(section?.label || `설치공간${idx + 1}`),
      lengthMm: Math.max(0, Number(section?.lengthMm || 0)),
    })),
    sectionUsage: Array.isArray(base.sectionUsage)
      ? base.sectionUsage.map((usage, idx) => ({
          sectionIndex: Number.isFinite(Number(usage?.sectionIndex)) ? Number(usage.sectionIndex) : idx,
          edgeHint: String(usage?.edgeHint || ""),
          usedMm: Math.max(0, Number(usage?.usedMm || 0)),
          targetMm: Math.max(0, Number(usage?.targetMm || 0)),
          overflow: Boolean(usage?.overflow),
        }))
      : [],
  };
}

function syncLayoutSectionUsageSnapshot(sideWidthLabels = [], input = null) {
  const layoutSnapshot = getLayoutConfigSnapshot(input);
  const normalizedShape = normalizeSystemShape(layoutSnapshot.shapeType || SYSTEM_SHAPE_DEFAULT);
  const sectionCount = getSectionCountForShape(normalizedShape);
  const labels = Array.isArray(sideWidthLabels) ? sideWidthLabels : [];
  const nextUsage = Array.from({ length: sectionCount }, (_, idx) => {
    const label = labels.find((entry) => Number(entry?.sectionIndex) === idx) || null;
    const usedMm = Math.round(Math.max(0, Number(label?.totalMm || 0)));
    const targetMm = Math.round(
      Math.max(0, Number(label?.targetMm || layoutSnapshot.sections?.[idx]?.lengthMm || 0))
    );
    return {
      sectionIndex: idx,
      edgeHint: String(label?.edgeHint || ""),
      usedMm,
      targetMm,
      overflow: targetMm > 0 && usedMm > targetMm,
    };
  });

  syncLayoutConfigShape(normalizedShape);
  if (state.layoutConfig) {
    state.layoutConfig.sectionUsage = nextUsage;
  }
  return nextUsage;
}

function evaluateLayoutConsultState(layout = getLayoutConfigSnapshot()) {
  const reasons = [];
  if (Number(layout?.highestHeightMm || 0) > SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM) {
    reasons.push(`가장 높은 높이 ${SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM}mm 초과`);
  }
  const longSections = (layout?.sections || []).filter(
    (section) => Number(section?.lengthMm || 0) >= SYSTEM_SECTION_LENGTH_CONSULT_AT_MM
  );
  if (longSections.length) {
    reasons.push(`설치공간 길이 ${SYSTEM_SECTION_LENGTH_CONSULT_AT_MM}mm 이상`);
  }
  return {
    status: reasons.length ? "consult" : "ok",
    reasons,
  };
}

function buildLayoutSpecLines(input = null, { includeStatus = false, onlyWhenConfigured = true } = {}) {
  const layout = getLayoutConfigSnapshot(input);
  const sectionParts = (layout.sections || [])
    .map((section) => {
      const lengthMm = Number(section.lengthMm || 0);
      if (!lengthMm) return "";
      return `${section.label} ${lengthMm}mm`;
    })
    .filter(Boolean);
  const hasConfiguredValues = Boolean(sectionParts.length || Number(layout.lowestHeightMm || 0) > 0);
  if (onlyWhenConfigured && !hasConfiguredValues) return [];

  const lines = [`레이아웃 타입: ${layout.shapeLabel}`];
  if (sectionParts.length) {
    lines.push(`설치공간 길이: ${sectionParts.join(" | ")}`);
  }
  if (Number(layout.lowestHeightMm || 0) > 0) {
    lines.push(`가장 낮은 높이: ${layout.lowestHeightMm}mm`);
  }
  if (Number(layout.highestHeightMm || 0) > 0 && Number(layout.highestHeightMm) !== Number(layout.lowestHeightMm)) {
    lines.push(`가장 높은 높이: ${layout.highestHeightMm}mm`);
  }
  if (includeStatus) {
    const consult = evaluateLayoutConsultState(layout);
    if (consult.status === "consult") {
      lines.push(`레이아웃 상태: 상담 안내 (${consult.reasons.join(", ")})`);
    } else {
      lines.push("레이아웃 상태: 정상 견적 가능");
    }
  }
  return lines;
}

function buildLayoutPreviewSummaryText(input = null) {
  const layout = getLayoutConfigSnapshot(input);
  const sectionParts = (layout.sections || [])
    .map((section) => {
      const lengthMm = Number(section.lengthMm || 0);
      if (!lengthMm) return "";
      return `${section.label} ${lengthMm}mm`;
    })
    .filter(Boolean);
  const head = `레이아웃 ${layout.shapeLabel}`;
  if (!sectionParts.length) return head;
  return `${head} · ${sectionParts.join(" | ")}`;
}

function isLayoutConsultStatus(layoutConsult) {
  return String(layoutConsult?.status || "") === "consult";
}

function applyConsultPriceToDetail(detail = {}) {
  const next = {
    ...detail,
    materialCost: 0,
    processingCost: 0,
    subtotal: 0,
    vat: 0,
    total: 0,
    isCustomPrice: true,
  };
  if (next.basePostBar && typeof next.basePostBar === "object") {
    next.basePostBar = { ...next.basePostBar, totalCost: 0 };
  }
  if (next.cornerPostBar && typeof next.cornerPostBar === "object") {
    next.cornerPostBar = { ...next.cornerPostBar, totalCost: 0 };
  }
  if (Array.isArray(next.basePostBars)) {
    next.basePostBars = next.basePostBars.map((row) => ({ ...row, totalCost: 0 }));
  }
  if (Array.isArray(next.cornerPostBars)) {
    next.cornerPostBars = next.cornerPostBars.map((row) => ({ ...row, totalCost: 0 }));
  }
  return next;
}

function buildLayoutSpecLinesFromSnapshot(layoutSpec, layoutConsult = null, { includeStatus = false } = {}) {
  if (!layoutSpec || typeof layoutSpec !== "object") return [];
  const shapeLabel = String(layoutSpec.shapeLabel || getLayoutTypeLabel(layoutSpec.shapeType || SYSTEM_SHAPE_DEFAULT));
  const sections = Array.isArray(layoutSpec.sections) ? layoutSpec.sections : [];
  const sectionParts = sections
    .map((section, idx) => {
      const lengthMm = Number(section?.lengthMm || 0);
      if (!lengthMm) return "";
      const label = String(section?.label || `설치공간${idx + 1}`);
      return `${label} ${lengthMm}mm`;
    })
    .filter(Boolean);
  const lines = [];
  if (shapeLabel) lines.push(`레이아웃 타입 ${shapeLabel}`);
  if (sectionParts.length) lines.push(sectionParts.join(" | "));
  const lowestHeightMm = Number(layoutSpec.lowestHeightMm || 0);
  if (lowestHeightMm > 0) lines.push(`가장 낮은 높이 ${lowestHeightMm}mm`);
  const highestHeightMm = Number(layoutSpec.highestHeightMm || 0);
  if (highestHeightMm > 0 && highestHeightMm !== lowestHeightMm) {
    lines.push(`가장 높은 높이 ${highestHeightMm}mm`);
  }
  if (includeStatus) {
    if (isLayoutConsultStatus(layoutConsult)) {
      const reasons = Array.isArray(layoutConsult?.reasons) ? layoutConsult.reasons.filter(Boolean) : [];
      lines.push(
        reasons.length
          ? `레이아웃 상태 상담 안내 (${reasons.join(", ")})`
          : "레이아웃 상태 상담 안내"
      );
    } else {
      lines.push("레이아웃 상태 정상 견적 가능");
    }
  }
  return lines;
}

function evaluateLayoutValidationState(layout = getLayoutConfigSnapshot()) {
  const sectionErrors = [];
  const messages = [];
  const missingSections = [];
  const tooShortSections = [];
  const overflowSections = [];

  (layout?.sections || []).forEach((section, idx) => {
    const lengthMm = Number(section?.lengthMm || 0);
    if (!lengthMm) {
      missingSections.push(idx);
      return;
    }
    if (lengthMm < SYSTEM_SECTION_LENGTH_MIN_MM) {
      tooShortSections.push(idx);
      sectionErrors[idx] = `설치공간 길이는 최소 ${SYSTEM_SECTION_LENGTH_MIN_MM}mm 이상 입력해주세요.`;
    }
  });

  (layout?.sectionUsage || []).forEach((usage, idx) => {
    const sectionIndex = Number.isFinite(Number(usage?.sectionIndex)) ? Number(usage.sectionIndex) : idx;
    const usedMm = Math.max(0, Number(usage?.usedMm || 0));
    const targetMm = Math.max(0, Number(usage?.targetMm || 0));
    if (!targetMm || usedMm <= targetMm) return;
    overflowSections.push({ sectionIndex, usedMm, targetMm });
    sectionErrors[sectionIndex] = `가용범위를 초과했습니다. 사용 ${usedMm}mm / 전체 ${targetMm}mm`;
  });

  let status = "ok";
  const consult = evaluateLayoutConsultState(layout);

  if (missingSections.length) {
    status = "invalid";
    messages.push("설치공간 길이를 모두 입력해주세요.");
  }

  if (tooShortSections.length) {
    status = "invalid";
    messages.push(`설치공간 길이는 최소 ${SYSTEM_SECTION_LENGTH_MIN_MM}mm 이상이어야 합니다.`);
  }

  if (overflowSections.length) {
    status = "invalid";
    const overflowNames = overflowSections
      .map((entry) => `설치공간${Number(entry.sectionIndex) + 1}`)
      .join(", ");
    messages.push(`가용범위를 초과한 구간이 있습니다 (${overflowNames}). 폭을 조정해주세요.`);
  }

  if (status !== "invalid" && consult.status === "consult") {
    status = "consult";
    messages.push(...consult.reasons.map((reason) => `${reason} · 상담 안내로 처리됩니다.`));
  }

  if (!messages.length) {
    messages.push("정상 견적 가능");
  }

  return {
    status,
    messages,
    sectionErrors,
    consultReasons: consult.reasons || [],
    overflowSections,
  };
}

function syncLayoutConstraintIndicators() {
  const layout = getLayoutConfigSnapshot();
  const result = evaluateLayoutValidationState(layout);

  if (state.layoutConfig) {
    state.layoutConfig.status = result.status;
    state.layoutConfig.consultReasons = [...(result.consultReasons || [])];
    state.layoutConfig.lowestHeightMm = Number(layout.lowestHeightMm || 0);
    state.layoutConfig.highestHeightMm = Number(layout.highestHeightMm || 0);
  }

  (layout.sections || []).forEach((section, idx) => {
    const inputEl = document.querySelector(`[data-layout-section-length="${idx}"]`);
    const errorEl = document.getElementById(`layoutSectionError-${idx}`);
    const message = result.sectionErrors?.[idx] || "";
    setFieldError(inputEl, errorEl, message);
  });

  const statusEl = document.getElementById("layoutConstraintStatus");
  if (statusEl) {
    const badgeLabel =
      result.status === "consult"
        ? "상담 안내"
        : result.status === "invalid"
          ? "구성 불가"
          : "정상 견적 가능";
    statusEl.dataset.status = result.status;
    statusEl.innerHTML = `
      <span class="layout-constraint-badge">${escapeHtml(badgeLabel)}</span>
      <span class="layout-constraint-text">${escapeHtml(result.messages.join(" "))}</span>
    `;
  }

  const previewCustomSummaryEl = document.getElementById("previewCustomSummary");
  if (previewCustomSummaryEl) {
    if (result.status === "consult") {
      previewCustomSummaryEl.textContent = "레이아웃 상담 안내";
    } else if (result.status === "invalid") {
      previewCustomSummaryEl.textContent = "레이아웃 입력 확인 필요";
    } else {
      previewCustomSummaryEl.textContent = "비규격 없음";
    }
  }

  return result;
}

function refreshBuilderDerivedUI({ preview = true, price = true, addItemState = true } = {}) {
  if (preview) updatePreview();
  if (price) {
    autoCalculatePrice();
  } else if (addItemState) {
    updateAddItemState();
  }
  syncLayoutConstraintIndicators();
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

function setServiceStepError(message = "") {
  const errorEl = $("#serviceStepError");
  if (!errorEl) return;
  errorEl.textContent = String(message || "").trim();
}

function getSystemColumnsItems() {
  return state.items.filter((item) => item.type === "columns");
}

function getSystemBayItems() {
  return state.items.filter((item) => item.type === "bay");
}

function getPostBarRowsForService(columnItem) {
  const rows = [];
  const baseRows = Array.isArray(columnItem?.basePostBars) && columnItem.basePostBars.length
    ? columnItem.basePostBars
    : columnItem?.basePostBar
      ? [columnItem.basePostBar]
      : [];
  const cornerRows = Array.isArray(columnItem?.cornerPostBars) && columnItem.cornerPostBars.length
    ? columnItem.cornerPostBars
    : columnItem?.cornerPostBar
      ? [columnItem.cornerPostBar]
      : [];
  [...baseRows, ...cornerRows].forEach((row) => {
    if (!row || typeof row !== "object") return;
    const rowCount = Math.max(0, Number(row.count || 0));
    const rowQty = Math.max(1, Math.floor(Number(row.quantity || columnItem?.quantity || 1)));
    rows.push({
      countTotal: rowCount * rowQty,
      heightMm: Math.max(0, Number(row.heightMm || 0)),
    });
  });
  return rows;
}

function getSystemPostBarSummary() {
  const rows = getSystemColumnsItems().flatMap((item) => getPostBarRowsForService(item));
  return {
    totalCount: rows.reduce((sum, row) => sum + Number(row.countTotal || 0), 0),
    hasOverHeight: rows.some((row) => Number(row.countTotal || 0) > 0 && Number(row.heightMm || 0) > 2400),
    hasUnknownHeight: rows.some((row) => Number(row.countTotal || 0) > 0 && Number(row.heightMm || 0) <= 0),
  };
}

function getSystemShelfSummary() {
  const bays = getSystemBayItems();
  return {
    totalCount: bays.reduce((sum, bay) => {
      const shelfCount = Math.max(1, Math.floor(Number(bay?.shelf?.count || 1)));
      const quantity = Math.max(1, Math.floor(Number(bay?.quantity || 1)));
      return sum + shelfCount * quantity;
    }, 0),
    hasOverWidth: bays.some((bay) => Number(bay?.shelf?.width || 0) > 800),
    hasUnknownWidth: bays.some((bay) => Number(bay?.shelf?.width || 0) <= 0),
  };
}

function hasSystemCornerOrFurniture() {
  return getSystemBayItems().some((bay) => {
    if (bay?.isCorner) return true;
    const addons = Array.isArray(bay?.addons) ? bay.addons : [];
    return addons.some((addonId) => String(addonId || "") && String(addonId || "") !== String(ADDON_CLOTHES_ROD_ID));
  });
}

function getSystemSectionLengthSumMm() {
  return getSystemColumnsItems().reduce((sum, item) => {
    const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
    const sectionUsage = Array.isArray(item?.layoutSpec?.sectionUsage) ? item.layoutSpec.sectionUsage : [];
    const sections = Array.isArray(item?.layoutSpec?.sections) ? item.layoutSpec.sections : [];
    const perUnitLengthByUsage = sectionUsage.reduce(
      (acc, usage) => acc + Math.max(0, Number(usage?.usedMm || 0)),
      0
    );
    const perUnitLengthBySection = sections.reduce(
      (acc, section) => acc + Math.max(0, Number(section?.lengthMm || 0)),
      0
    );
    const perUnitLength = perUnitLengthByUsage > 0 ? perUnitLengthByUsage : perUnitLengthBySection;
    return sum + perUnitLength * quantity;
  }, 0);
}

function evaluateFulfillmentService(nextType = getFulfillmentType()) {
  const customer = getCustomerInfo();
  const hasProducts = state.items.length > 0;
  return evaluateFulfillmentPolicy({
    nextType,
    customer,
    hasProducts,
    evaluateSupportedPolicy: ({ type }) => {
      const postBar = getSystemPostBarSummary();
      const shelf = getSystemShelfSummary();

      if (type === "delivery") {
        if (hasSystemCornerOrFurniture()) {
          return {
            amount: 0,
            amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
            isConsult: true,
            reason: SYSTEM_FULFILLMENT_POLICY.delivery.consultReasons.cornerOrFurniture,
          };
        }
        if (postBar.hasOverHeight || postBar.hasUnknownHeight) {
          return {
            amount: 0,
            amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
            isConsult: true,
            reason: SYSTEM_FULFILLMENT_POLICY.delivery.consultReasons.overPostBarHeight,
          };
        }
        if (shelf.hasOverWidth || shelf.hasUnknownWidth) {
          return {
            amount: 0,
            amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
            isConsult: true,
            reason: SYSTEM_FULFILLMENT_POLICY.delivery.consultReasons.overShelfWidth,
          };
        }
        const postBarCost = calcGroupedAmount(
          postBar.totalCount,
          SYSTEM_FULFILLMENT_POLICY.delivery.postBarGroupedFee.groupSize,
          SYSTEM_FULFILLMENT_POLICY.delivery.postBarGroupedFee.groupPrice
        );
        const shelfCost = calcGroupedAmount(
          shelf.totalCount,
          SYSTEM_FULFILLMENT_POLICY.delivery.shelfGroupedFee.groupSize,
          SYSTEM_FULFILLMENT_POLICY.delivery.shelfGroupedFee.groupPrice
        );
        const amount = postBarCost + shelfCost;
        return {
          amount,
          amountText: `${amount.toLocaleString()}원`,
          isConsult: false,
          reason: "",
        };
      }

      const fixedAmount = SYSTEM_FULFILLMENT_POLICY.installation.fixedByPostBarCount[postBar.totalCount];
      if (Number.isFinite(Number(fixedAmount)) && fixedAmount > 0) {
        return {
          amount: Number(fixedAmount),
          amountText:
            SYSTEM_FULFILLMENT_POLICY.installation.fixedAmountTextByPostBarCount[postBar.totalCount] ||
            `${Number(fixedAmount).toLocaleString()}원`,
          isConsult: false,
          reason: "",
        };
      }
      if (postBar.totalCount >= 5) {
        const sectionLengthSumMm = getSystemSectionLengthSumMm();
        if (!sectionLengthSumMm) {
          return {
            amount: 0,
            amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
            isConsult: true,
            reason: SYSTEM_FULFILLMENT_POLICY.installation.missingSectionLengthConsultReason,
          };
        }
        const amount = calcGroupedAmount(
          sectionLengthSumMm,
          SYSTEM_FULFILLMENT_POLICY.installation.sectionLengthGroupedFee.groupSizeMm,
          SYSTEM_FULFILLMENT_POLICY.installation.sectionLengthGroupedFee.groupPrice
        );
        return {
          amount,
          amountText: `${amount.toLocaleString()}원`,
          isConsult: false,
          reason: "",
        };
      }

      return {
        amount: 0,
        amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
        isConsult: true,
        reason: SYSTEM_FULFILLMENT_POLICY.installation.fallbackConsultReason,
      };
    },
  });
}

function buildGrandSummary() {
  const baseSummary = calcOrderSummary(state.items);
  const fulfillment = evaluateFulfillmentService();
  const fulfillmentCost = fulfillment.isConsult ? 0 : Number(fulfillment.amount || 0);
  const grandTotal = Number(baseSummary.grandTotal || 0) + fulfillmentCost;
  const hasConsult = state.items.some((item) => item.isCustomPrice) || (Boolean(fulfillment.type) && fulfillment.isConsult);
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
  const regionHintEl = $("#serviceRegionHint");
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

let currentPhase = 1;
let sendingEmail = false;
let orderCompleted = false;
let stickyOffsetTimer = null;
let previewResizeRafTimer = null;
let previewFrameResizeObserver = null;
let previewFrameLastSize = { width: 0, height: 0 };
let previewAddButtonPlacementHints = new Map();
let previewAddTooltipEl = null;
let previewAddTooltipAnchorEl = null;
let activeShelfAddonId = null;
let activeCornerOptionId = null;
let activeBayOptionId = null;
let shelfAddonModalReturnTo = "";
let suppressPendingOptionModalCleanupOnce = false;
let systemAddonModalCategoryFilterKey = "all";
let previewPresetModuleCategoryFilterKey = "all";
let bayDirectComposeDraft = null;
let cornerDirectComposeDraft = null;
const previewAddFlowState = createPreviewAddFlowState();
const previewPresetPickerFlowState = createPreviewPresetPickerFlowState();
const presetModuleOptionFlowState = createPresetModuleOptionFlowState();
const previewModuleActionFlowState = createPreviewModuleActionFlowState();
let previewOpenEndpoints = new Map();
let inlineInsertPendingFirstSaveEdgeId = "";
let previewRenderTransform = { scale: 1, tx: 0, ty: 0, depthMm: 400 };
let previewInfoMode = "size";
const builderHistory = {
  undo: [],
  redo: [],
  applying: false,
};
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
  guides: SYSTEM_MEASUREMENT_GUIDES,
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

function closeMeasurementGuideModal() {
  measurementGuideController.close();
}

function formatColumnSize(column) {
  const maxLength = Number(column?.maxLength || 0);
  const minLength = Number(column?.minLength || 0);
  const displayLength = maxLength || Number(column?.length || 0);
  const lengthText =
    minLength && maxLength ? `${minLength}~${maxLength}mm` : `${displayLength}mm`;
  return `${column.thickness}T / ${column.width}×${lengthText}`;
}

const materialPickers = {
  shelf: {
    key: "shelf",
    materials: SYSTEM_SHELF_MATERIALS,
    inputName: "shelfMaterial",
    modalId: "#shelfMaterialModal",
    openBtn: "#openShelfMaterialModal",
    closeBtn: "#closeShelfMaterialModal",
    backdrop: "#shelfMaterialModalBackdrop",
    tabsId: "#shelfMaterialTabs",
    cardsId: "#shelfMaterialCards",
    categoryNameId: "#shelfMaterialCategoryName",
    categoryDescId: "#shelfMaterialCategoryDesc",
    selectedCardId: "#selectedShelfMaterialCard",
    thicknessSelectId: "#shelfThicknessSelect",
    emptyTitle: "선택된 선반 컬러 없음",
    emptyMeta: "선반 컬러를 선택해주세요.",
    selectedCategory: "",
    selectedMaterialId: "",
    visualModifierClass: "",
  },
  column: {
    key: "column",
    materials: SYSTEM_COLUMN_MATERIALS,
    inputName: "columnMaterial",
    modalId: "#columnMaterialModal",
    openBtn: "#openColumnMaterialModal",
    closeBtn: "#closeColumnMaterialModal",
    backdrop: "#columnMaterialModalBackdrop",
    tabsId: "#columnMaterialTabs",
    cardsId: "#columnMaterialCards",
    categoryNameId: "#columnMaterialCategoryName",
    categoryDescId: "#columnMaterialCategoryDesc",
    selectedCardId: "#selectedColumnMaterialCard",
    thicknessSelectId: "#columnThicknessSelect",
    emptyTitle: "선택된 포스트바 컬러 없음",
    emptyMeta: "포스트바 컬러를 선택해주세요.",
    selectedCategory: "",
    selectedMaterialId: "",
    visualModifierClass: "material-visual--square",
  },
};

function buildCategories(materials) {
  const list = Object.values(materials).map((m) => m.category || "기타");
  return Array.from(new Set(list));
}

function renderMaterialTabs(picker) {
  const tabs = $(picker.tabsId);
  if (!tabs) return;
  tabs.innerHTML = "";
  picker.categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `material-tab${cat === picker.selectedCategory ? " active" : ""}`;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      picker.selectedCategory = cat;
      const inCategory = Object.values(picker.materials).some(
        (m) => m.id === picker.selectedMaterialId && (m.category || "기타") === cat
      );
      if (!inCategory) picker.selectedMaterialId = "";
      renderMaterialTabs(picker);
      renderMaterialCards(picker);
      updateThicknessOptions(picker);
      renderCategoryDesc(picker);
      updateSelectedMaterialCard(picker);
    });
    tabs.appendChild(btn);
  });
  renderCategoryDesc(picker);
}

function renderCategoryDesc(picker) {
  const descEl = $(picker.categoryDescId);
  const titleEl = $(picker.categoryNameId);
  if (!descEl || !titleEl) return;
  const desc = SYSTEM_MATERIAL_CATEGORIES_DESC[picker.selectedCategory] || "";
  titleEl.textContent = picker.selectedCategory || "";
  descEl.textContent = desc;
}

function formatWon(amount) {
  const value = Math.round(Number(amount || 0));
  if (!Number.isFinite(value) || value <= 0) return "-";
  return `${value.toLocaleString()}원`;
}

function resolveTierUnitPrice(tier, material) {
  if (!tier || !material || Boolean(tier.isCustomPrice)) return 0;
  const tierKey = String(tier.key || "");
  const materialId = String(material.id || "");
  const category = String(material.category || "");
  const materialPriceByTierKey =
    material.priceByTierKey && typeof material.priceByTierKey === "object" ? material.priceByTierKey : null;
  const priceByMaterialId =
    tier.priceByMaterialId && typeof tier.priceByMaterialId === "object" ? tier.priceByMaterialId : null;
  const priceByCategory =
    tier.priceByCategory && typeof tier.priceByCategory === "object" ? tier.priceByCategory : null;
  const byMaterialTierKey = materialPriceByTierKey ? Number(materialPriceByTierKey[tierKey] || 0) : 0;
  if (Number.isFinite(byMaterialTierKey) && byMaterialTierKey > 0) return Math.round(byMaterialTierKey);
  const byMaterialId = priceByMaterialId ? Number(priceByMaterialId[materialId] || 0) : 0;
  if (Number.isFinite(byMaterialId) && byMaterialId > 0) return Math.round(byMaterialId);
  const byCategory = priceByCategory ? Number(priceByCategory[category] || 0) : 0;
  if (Number.isFinite(byCategory) && byCategory > 0) return Math.round(byCategory);
  const unitPrice = Number(tier.unitPrice || 0);
  if (Number.isFinite(unitPrice) && unitPrice > 0) return Math.round(unitPrice);
  return 0;
}

function formatTierConstraintLabel(tier, { widthKey = "maxWidthMm", heightKey = "maxHeightMm" } = {}) {
  const rawLabel = String(tier?.label || "").trim();
  if (!rawLabel) return "-";
  if (rawLabel.includes("이하") || rawLabel.includes("이상")) return rawLabel;
  const maxWidth = Number(tier?.[widthKey] || 0);
  if (Number.isFinite(maxWidth) && maxWidth > 0) return `${rawLabel} (${maxWidth} 이하)`;
  const maxHeight = Number(tier?.[heightKey] || 0);
  if (Number.isFinite(maxHeight) && maxHeight > 0) return `${rawLabel} (${maxHeight} 이하)`;
  return rawLabel;
}

function getShelfDisplayWidthRangeText() {
  const minWidthMm = Number(MODULE_SHELF_WIDTH_LIMITS.min || 400) || 400;
  const maxWidthMm = Number(MODULE_SHELF_WIDTH_LIMITS.max || 1000) || 1000;
  return `${minWidthMm}~${maxWidthMm}mm`;
}

function getShelfDisplayDepthText() {
  // System shelf depth is fixed to 400mm in current product spec.
  return "400mm";
}

function buildShelfTierPriceHtml(material) {
  const groups = [
    { title: "일반 선반", tiers: SYSTEM_SHELF_TIER_PRICING?.normal?.tiers || [] },
    { title: "코너 선반", tiers: SYSTEM_SHELF_TIER_PRICING?.corner?.tiers || [] },
  ];
  const groupHtml = groups
    .map((group) => {
      const tiers = Array.isArray(group.tiers) ? group.tiers : [];
      if (!tiers.length) return "";
      const rows = tiers
        .map((tier) => {
          const label = String(tier?.label || "-");
          if (Boolean(tier?.isCustomPrice)) {
            const consultLabel = String(label || "").includes("비규격")
              ? "비규격 상담안내"
              : `${label} 상담안내`;
            return `<div class="material-tier-line is-consult">${escapeHtml(consultLabel)}</div>`;
          }
          return `<div class="material-tier-line">${escapeHtml(label)} ${formatWon(
            resolveTierUnitPrice(tier, material)
          )}</div>`;
        })
        .join("");
      return `
        <div class="material-tier-heading">${escapeHtml(group.title)}</div>
        ${rows}
      `;
    })
    .filter(Boolean)
    .join("");
  return groupHtml || `<div class="material-tier-line">가격 정보 준비중</div>`;
}

function buildPostBarTierPriceHtml() {
  const basicTiers = (Array.isArray(SYSTEM_POST_BAR_PRICING?.basic?.tiers)
    ? SYSTEM_POST_BAR_PRICING.basic.tiers
    : []
  ).filter(
    (tier) => Number(tier?.maxHeightMm || 0) !== Number(MODULE_POST_BAR_HEIGHT_LIMITS.pricing?.lte2100 || 2100)
  );
  const cornerAllTiers = Array.isArray(SYSTEM_POST_BAR_PRICING?.corner?.tiers)
    ? SYSTEM_POST_BAR_PRICING.corner.tiers
    : [];
  let cornerTiers = cornerAllTiers.filter(
    (tier) => Number(tier?.maxHeightMm || 0) === SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM
  );
  if (!cornerTiers.length && cornerAllTiers.length) {
    const maxTierHeight = Math.max(...cornerAllTiers.map((tier) => Number(tier?.maxHeightMm || 0)));
    cornerTiers = cornerAllTiers.filter((tier) => Number(tier?.maxHeightMm || 0) === maxTierHeight);
  }
  const groups = [
    { title: SYSTEM_POST_BAR_PRICING?.basic?.label || "기본 포스트바", tiers: basicTiers },
    { title: SYSTEM_POST_BAR_PRICING?.corner?.label || "코너 포스트바", tiers: cornerTiers },
  ];
  const groupHtml = groups
    .map((group) => {
      const tiers = Array.isArray(group.tiers) ? group.tiers : [];
      if (!tiers.length) return "";
      const rows = tiers
        .map((tier) => {
          const label = formatTierConstraintLabel(tier);
          const price = formatWon(resolveTierUnitPrice(tier, {}));
          return `<div class="material-tier-line">${escapeHtml(label)} ${price}</div>`;
        })
        .join("");
      return `
        <div class="material-tier-heading">${escapeHtml(group.title)}</div>
        ${rows}
        <div class="material-tier-line is-consult">비규격 상담안내</div>
      `;
    })
    .filter(Boolean)
    .join("");
  return groupHtml;
}

function buildMaterialTierPriceHtml(picker, material) {
  if (picker.key === "shelf") {
    return buildShelfTierPriceHtml(material);
  }
  if (picker.key === "column") {
    return buildPostBarTierPriceHtml();
  }
  return `<div class="material-tier-line">가격 정보 준비중</div>`;
}

function renderMaterialCards(picker) {
  const container = $(picker.cardsId);
  if (!container) return;
  container.innerHTML = "";

  const list = Object.values(picker.materials).filter(
    (mat) => (mat.category || "기타") === picker.selectedCategory
  );

  list.forEach((mat) => {
    const label = document.createElement("label");
    const visualModifierClass = String(picker.visualModifierClass || "").trim();
    const visualClassName = visualModifierClass
      ? `material-visual ${visualModifierClass}`
      : "material-visual";
    label.className = `card-base material-card${
      picker.selectedMaterialId === mat.id ? " selected" : ""
    }`;
    const visualStyle = buildMaterialVisualInlineStyle({
      swatch: mat.swatch || "#ddd",
      imageUrl: mat.thumbnail || "",
    });
    const limits = LIMITS[picker.key];
    const heightLine = `높이 ${limits.minLength}~${limits.maxLength}mm`;
    const tierPriceHtml = buildMaterialTierPriceHtml(picker, mat);
    const sizeLines = [];
    if (picker.key === "column") {
      sizeLines.push(heightLine);
    } else {
      const thicknessValues = (mat.availableThickness || [])
        .map((t) => `${t}T`)
        .join(", ");
      if (thicknessValues) sizeLines.push(`두께 ${thicknessValues}`);
      sizeLines.push(`폭 ${getShelfDisplayWidthRangeText()}`);
      sizeLines.push(`깊이 ${getShelfDisplayDepthText()}`);
    }
    const sizeInfoHtml = sizeLines.length
      ? `
        <div class="size-heading">제작 가능 범위</div>
        ${sizeLines.map((line) => `<div class="size">${escapeHtml(line)}</div>`).join("")}
      `
      : "";
    label.innerHTML = `
      <input type="radio" name="${picker.inputName}" value="${mat.id}" ${
        picker.selectedMaterialId === mat.id ? "checked" : ""
      } />
      <div class="${visualClassName}" style="${visualStyle}"></div>
      <div class="name">${mat.name}</div>
      ${tierPriceHtml}
      ${sizeInfoHtml}
    `;
    container.appendChild(label);
  });

  container.onclick = (e) => {
    const input = e.target.closest(`input[name="${picker.inputName}"]`);
    if (!input) return;
    picker.selectedMaterialId = input.value;
    updateThicknessOptions(picker);
    updateSelectedMaterialCard(picker);
    updatePreview();
    container.querySelectorAll(".material-card").forEach((card) => card.classList.remove("selected"));
    input.closest(".material-card")?.classList.add("selected");
    input.blur();
    closeModal(picker.modalId);
    autoCalculatePrice();
  };
}

function updateSelectedMaterialCard(picker) {
  const mat = picker.materials[picker.selectedMaterialId];
  const limits = LIMITS[picker.key];
  const metaLines = [];
  if (mat) {
    if (picker.key === "column") {
      metaLines.push(`높이 ${limits.minLength}~${limits.maxLength}mm`);
    } else {
      metaLines.push(`두께 ${(mat.availableThickness || []).map((t) => `${t}T`).join(", ")}`);
      metaLines.push(`폭 ${getShelfDisplayWidthRangeText()}`);
      metaLines.push(`깊이 ${getShelfDisplayDepthText()}`);
    }
  }
  renderSelectedCard({
    cardId: picker.selectedCardId,
    emptyTitle: picker.emptyTitle,
    emptyMeta: picker.emptyMeta,
    swatch: mat?.swatch,
    imageUrl: mat?.thumbnail,
    name: mat ? escapeHtml(mat.name) : "",
    metaLines,
  });
}

function updateThicknessOptions(picker) {
  const select = $(picker.thicknessSelectId);
  if (!select) return;
  select.innerHTML = `<option value="">두께를 선택하세요</option>`;
  const mat = picker.materials[picker.selectedMaterialId];
  if (!mat) return;
  (mat.availableThickness || []).forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = `${t}T`;
    select.appendChild(opt);
  });
}

function getSelectedShape() {
  return normalizeSystemShape(state.layoutConfig?.shapeType);
}

function getBayCountForShape(shape) {
  return SHAPE_BAY_COUNTS[normalizeSystemShape(shape)] || 1;
}

function getCornerFlags(shape) {
  const sideCount = getBayCountForShape(shape);
  if (shape === "box_shape") return new Array(sideCount).fill(true);
  if (shape === "u_shape") return [false, true, true];
  if (shape === "l_shape" || shape === "rl_shape") return [false, true];
  return new Array(sideCount).fill(false);
}

function createGraphForShape(shape) {
  const sideCount = getBayCountForShape(shape);
  const closedLoop = !FREE_LAYOUT_MODE && shape === "box_shape";
  const nodes = {};
  const sides = [];
  const nodeCount = closedLoop ? sideCount : sideCount + 1;
  for (let i = 0; i < nodeCount; i += 1) {
    nodes[`node-${i}`] = { id: `node-${i}` };
  }
  for (let i = 0; i < sideCount; i += 1) {
    const startNodeId = `node-${i}`;
    const endNodeId = closedLoop ? `node-${(i + 1) % sideCount}` : `node-${i + 1}`;
    sides.push({
      id: `side-${i}`,
      startNodeId,
      endNodeId,
      bayEdgeIds: [],
    });
  }
  return {
    shape,
    sideCount,
    closedLoop,
    nodes,
    sides,
    edges: {},
    edgeOrder: [],
  };
}

function ensureGraph(shape = getSelectedShape()) {
  if (!state.graph) state.graph = createGraphForShape(shape);
  return state.graph;
}

function ensureEdgeOrder() {
  ensureGraph();
  if (!Array.isArray(state.graph.edgeOrder)) state.graph.edgeOrder = [];
  const seen = new Set();
  state.graph.edgeOrder = state.graph.edgeOrder.filter((id) => {
    if (!id || !state.graph.edges[id] || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  Object.keys(state.graph.edges).forEach((id) => {
    if (!seen.has(id)) {
      state.graph.edgeOrder.push(id);
      seen.add(id);
    }
  });
  return state.graph.edgeOrder;
}

function registerEdge(edge) {
  if (!edge?.id) return;
  ensureGraph();
  state.graph.edges[edge.id] = edge;
  const order = ensureEdgeOrder();
  if (!order.includes(edge.id)) order.push(edge.id);
}

function unregisterEdge(id) {
  if (!id) return;
  ensureGraph();
  if (state.graph.edges[id]) delete state.graph.edges[id];
  ensureEdgeOrder();
  state.graph.edgeOrder = state.graph.edgeOrder.filter((edgeId) => edgeId !== id);
}

function getOrderedGraphEdges({ includePending = false } = {}) {
  ensureGraph();
  const order = ensureEdgeOrder();
  return order
    .map((id) => state.graph.edges[id])
    .filter(
      (edge) =>
        edge &&
        (edge.type === "bay" || edge.type === "corner") &&
        (includePending || !edge.pendingAdd)
    );
}

function getOrderedCommittedGraphEdges() {
  return getOrderedGraphEdges({ includePending: false });
}

function countCurrentCornerModules() {
  return getOrderedCommittedGraphEdges().filter((edge) => edge?.type === "corner").length;
}

function getShapeCornerLimitState(shape = getSelectedShape()) {
  const normalizedShape = normalizeSystemShape(shape);
  const limit = getShapeCornerLimit(normalizedShape);
  const currentCount = countCurrentCornerModules();
  const canAdd = Number.isFinite(limit) ? currentCount < limit : true;
  const remaining = Number.isFinite(limit) ? Math.max(0, limit - currentCount) : Infinity;
  return {
    shape: normalizedShape,
    shapeLabel: getLayoutTypeLabel(normalizedShape),
    limit,
    currentCount,
    remaining,
    canAdd,
  };
}

function getCornerLimitBlockedMessage(limitState = getShapeCornerLimitState()) {
  const shapeLabel = String(limitState?.shapeLabel || getLayoutTypeLabel(getSelectedShape()));
  const limit = Number(limitState?.limit);
  if (Number.isFinite(limit) && limit <= 0) {
    return `${shapeLabel} 타입은 코너 추가가 불가합니다.`;
  }
  if (Number.isFinite(limit)) {
    return `${shapeLabel} 타입은 코너를 최대 ${limit}개까지 추가할 수 있습니다.`;
  }
  return "현재 레이아웃에서는 코너를 추가할 수 없습니다.";
}

function getShapeCornerAttachSideRule(shape = getSelectedShape()) {
  const normalizedShape = normalizeSystemShape(shape);
  const rule = SYSTEM_SHAPE_CORNER_ATTACH_SIDE_RULES[normalizedShape];
  if (!rule) return null;
  const allowedAttachSideIndices = Array.isArray(rule.allowedAttachSideIndices)
    ? rule.allowedAttachSideIndices
        .map((idx) => Number(idx))
        .filter((idx) => Number.isFinite(idx))
    : [];
  if (!allowedAttachSideIndices.length) return null;
  return {
    shape: normalizedShape,
    shapeLabel: getLayoutTypeLabel(normalizedShape),
    allowedAttachSideIndices,
    label: String(rule.label || ""),
  };
}

function getCornerAttachSideBlockedMessage(target, shape = getSelectedShape()) {
  const rule = getShapeCornerAttachSideRule(shape);
  if (!rule) return "";
  const attachSideIndex = Number(target?.attachSideIndex ?? target?.sideIndex);
  if (!Number.isFinite(attachSideIndex)) {
    return `${rule.shapeLabel} 타입은 ${rule.label || "지정된 위치"}에서만 코너를 추가할 수 있습니다.`;
  }
  if (rule.allowedAttachSideIndices.includes(attachSideIndex)) return "";
  return `${rule.shapeLabel} 타입은 ${rule.label || "지정된 위치"}에서만 코너를 추가할 수 있습니다.`;
}

function canAddCornerAtTarget(target, shape = getSelectedShape()) {
  return !getCornerAttachSideBlockedMessage(target, shape);
}

function isRootPreviewEndpointTarget(target) {
  return String(target?.endpointId || "") === "root-endpoint";
}

function getRootCornerBlockedMessage() {
  return "첫 모듈은 일반 모듈로 추가해주세요. 코너 모듈은 첫 모듈 추가 후 연결해서 추가할 수 있습니다.";
}

function getRootCornerDirectionRequiredMessage() {
  return "코너로 시작하려면 먼저 방향(좌측/우측)을 선택해주세요.";
}

function resolveActivePreviewAddSourceTarget(target = previewAddFlowState.target) {
  if (!target && !previewOpenEndpoints) return null;
  const endpointId = String(target?.endpointId || "");
  const endpoint = endpointId ? previewOpenEndpoints.get(endpointId) : null;
  if (!endpoint && !target) return null;
  if (isRootPreviewEndpointTarget(endpoint || target) && hasSelectedRootCornerStartDirection(target)) {
    const variant = buildRootCornerStartTargetVariant(target, target.rootCornerStartDirection);
    return {
      ...(endpoint || {}),
      ...(target && typeof target === "object" ? target : {}),
      ...(variant || {}),
    };
  }
  return endpoint || target;
}

function setPreviewAddTypeErrorMessage(message = "", { isError = false } = {}) {
  ["#previewAddTypeModalError"].forEach((selector) => {
    const errorEl = $(selector);
    if (!errorEl) return;
    errorEl.textContent = String(message || "");
    errorEl.classList.toggle("error", Boolean(isError && message));
  });
}

function getPreviewAddTypeModalElements() {
  return {
    modal: $("#previewAddTypeModal"),
    normalBtn: $("#previewAddModalNormalBtn"),
    cornerBtn: $("#previewAddModalCornerBtn"),
    rootCornerRightBtn: $("#previewAddModalRootCornerRightBtn"),
    rootCornerLeftBtn: $("#previewAddModalRootCornerLeftBtn"),
    rootCornerBackBtn: $("#previewAddModalRootCornerBackBtn"),
    descEl: $("#previewAddTypeModalDesc"),
    typeStepEl: $("#previewAddTypeModalTypeStep"),
    rootCornerStepEl: $("#previewAddTypeModalRootCornerStep"),
    titleEl: $("#previewAddTypeModalTitle"),
  };
}

function applyPreviewAddTypeModalOpenUiView(openUiPlan) {
  const {
    modal,
    cornerBtn: modalCornerBtn,
    normalBtn: modalNormalBtn,
    titleEl: modalTitleEl,
  } = getPreviewAddTypeModalElements();
  const openViewState = openUiPlan?.openViewState;
  if (!openViewState) {
    return {
      modal,
      modalCornerBtn,
      modalNormalBtn,
      modalTitleEl,
    };
  }
  [modalNormalBtn].filter(Boolean).forEach((btn) => {
    btn.disabled = Boolean(openViewState.normalButton?.disabled);
    if (openViewState.normalButton?.title) btn.title = openViewState.normalButton.title;
    else btn.removeAttribute("title");
  });
  [modalCornerBtn].filter(Boolean).forEach((btn) => {
    btn.disabled = Boolean(openViewState.cornerButton?.disabled);
    if (openViewState.cornerButton?.title) btn.title = openViewState.cornerButton.title;
    else btn.removeAttribute("title");
  });
  setPreviewAddTypeErrorMessage(openViewState.error?.message || "", {
    isError: Boolean(openViewState.error?.isError),
  });
  return {
    modal,
    modalCornerBtn,
    modalNormalBtn,
    modalTitleEl,
  };
}

function focusPreviewAddTypeModalInitialTarget(openUiPlan, elements = {}) {
  const { modalNormalBtn, modalCornerBtn, modalTitleEl } = elements || {};
  const focusKey = String(openUiPlan?.initialFocusKey || "title");
  if (focusKey === "normal" && modalNormalBtn) {
    modalNormalBtn.focus();
    return;
  }
  if (focusKey === "corner" && modalCornerBtn) {
    modalCornerBtn.focus();
    return;
  }
  modalTitleEl?.focus();
}

function focusPreviewAddTypeModalStepTarget(focusKey, elements = {}) {
  const {
    rootCornerRightBtn,
    rootCornerLeftBtn,
    normalBtn,
    cornerBtn,
    titleEl,
  } = elements || {};
  const key = String(focusKey || "title");
  if (key === "right" && rootCornerRightBtn) {
    rootCornerRightBtn.focus();
    return;
  }
  if (key === "left" && rootCornerLeftBtn) {
    rootCornerLeftBtn.focus();
    return;
  }
  if (key === "normal" && normalBtn) {
    normalBtn.focus();
    return;
  }
  if (key === "corner" && cornerBtn) {
    cornerBtn.focus();
    return;
  }
  titleEl?.focus();
}

function setPreviewAddTypeModalStep(step = "type", selectedModuleType = "") {
  setPreviewAddFlowStep(previewAddFlowState, step, selectedModuleType);

  const {
    modal,
    titleEl,
    descEl,
    typeStepEl,
    rootCornerStepEl,
    rootCornerRightBtn,
    rootCornerLeftBtn,
    rootCornerBackBtn,
  } = getPreviewAddTypeModalElements();
  if (!modal) return;

  modal.dataset.step = previewAddFlowState.step;
  modal.dataset.moduleType = previewAddFlowState.selectedModuleType;
  typeStepEl?.classList.toggle("hidden", previewAddFlowState.step !== "type");
  rootCornerStepEl?.classList.toggle("hidden", previewAddFlowState.step !== "root-corner-direction");

  let rightBlockedMessage = "";
  let leftBlockedMessage = "";
  if (previewAddFlowState.step === "root-corner-direction") {
    const blockedMessages = buildPreviewAddRootCornerDirectionBlockedMessages(
      previewAddFlowState.target,
      (target) => getCornerAttachSideBlockedMessage(target, getSelectedShape())
    );
    rightBlockedMessage = blockedMessages.rightBlockedMessage;
    leftBlockedMessage = blockedMessages.leftBlockedMessage;
  }

  const stepViewState = buildPreviewAddTypeModalStepViewState({
    step: previewAddFlowState.step,
    rightBlockedMessage,
    leftBlockedMessage,
  });
  if (titleEl) titleEl.textContent = stepViewState.title;
  if (descEl) descEl.textContent = stepViewState.description;

  if (previewAddFlowState.step === "root-corner-direction") {
    const directionViewState = stepViewState.rootCornerDirection;
    if (rootCornerRightBtn) {
      rootCornerRightBtn.disabled = Boolean(directionViewState?.rightButton?.disabled);
      if (directionViewState?.rightButton?.title) {
        rootCornerRightBtn.title = directionViewState.rightButton.title;
      }
      else rootCornerRightBtn.removeAttribute("title");
    }
    if (rootCornerLeftBtn) {
      rootCornerLeftBtn.disabled = Boolean(directionViewState?.leftButton?.disabled);
      if (directionViewState?.leftButton?.title) {
        rootCornerLeftBtn.title = directionViewState.leftButton.title;
      }
      else rootCornerLeftBtn.removeAttribute("title");
    }
    if (rootCornerBackBtn) rootCornerBackBtn.disabled = Boolean(directionViewState?.backButton?.disabled);
    return;
  }
}

function handlePreviewAddModalTypeSelect(moduleType) {
  const normalizedType = moduleType === "corner" ? "corner" : "normal";
  const { normalBtn, cornerBtn, rootCornerRightBtn, rootCornerLeftBtn, titleEl } =
    getPreviewAddTypeModalElements();
  const sourceBtn = normalizedType === "corner" ? cornerBtn : normalBtn;
  if (!sourceBtn || sourceBtn.disabled) return;
  setPreviewAddTypeErrorMessage("", { isError: false });
  const uiPlan = buildPreviewAddTypeSelectionUiExecutionPlan({
    moduleType: normalizedType,
    previewAddFlowState,
    rootCornerRightDisabled: Boolean(rootCornerRightBtn?.disabled),
    rootCornerLeftDisabled: Boolean(rootCornerLeftBtn?.disabled),
  });
  const dispatchPlan = buildPreviewAddTypeSelectionUiDispatchPlan(uiPlan);
  if (dispatchPlan.route === "root-corner-direction") {
    setPreviewAddTypeModalStep(dispatchPlan.nextStep, dispatchPlan.selectedModuleType);
    requestAnimationFrame(() => {
      focusPreviewAddTypeModalStepTarget(dispatchPlan.focusKey, {
        rootCornerRightBtn,
        rootCornerLeftBtn,
        titleEl,
      });
    });
    return;
  }
  if (dispatchPlan.route === "error") {
    setPreviewAddTypeErrorMessage(String(dispatchPlan.errorMessage || ""), { isError: true });
    return;
  }
  if (dispatchPlan.clearErrorMessage) setPreviewAddTypeErrorMessage("", { isError: false });
  openPresetModuleOptionFromPreviewAdd(dispatchPlan.normalizedType, dispatchPlan.nextOpen);
}

function handlePreviewAddModalRootCornerDirectionSelect(direction = "right") {
  const normalizedDirection = direction === "left" ? "left" : "right";
  const { rootCornerRightBtn, rootCornerLeftBtn } = getPreviewAddTypeModalElements();
  const sourceBtn = normalizedDirection === "left" ? rootCornerLeftBtn : rootCornerRightBtn;
  if (!sourceBtn || sourceBtn.disabled) return;
  const uiPlan = buildPreviewAddRootCornerDirectionSelectionUiExecutionPlan({
    direction: normalizedDirection,
    previewAddFlowState,
    getBlockedMessageForTarget: (previewTarget) =>
      getCornerAttachSideBlockedMessage(previewTarget, getSelectedShape()),
    requiredMessage: getRootCornerDirectionRequiredMessage(),
  });
  const dispatchPlan = buildPreviewAddRootCornerDirectionSelectionUiDispatchPlan(uiPlan);
  if (dispatchPlan.route === "error") {
    setPreviewAddTypeErrorMessage(dispatchPlan.errorMessage, { isError: true });
    return;
  }
  if (dispatchPlan.clearErrorMessage) setPreviewAddTypeErrorMessage("", { isError: false });
  openPresetModuleOptionFromPreviewAdd(dispatchPlan.normalizedType, dispatchPlan.nextOpen);
}

function openPresetModuleOptionFromPreviewAdd(moduleType = "normal", prebuiltNextOpen = null) {
  const openPlan = prebuiltNextOpen
    ? { ok: true, nextOpen: prebuiltNextOpen }
    : buildPreviewAddPresetModuleOptionOpenPlan(previewAddFlowState, moduleType);
  const dispatchPlan = buildPresetModuleOptionOpenFromPreviewAddUiDispatchPlan({
    prebuiltNextOpen,
    openPlan,
  });
  if (dispatchPlan.route !== "open" || !dispatchPlan.nextOpen) {
    setPreviewAddTypeErrorMessage(String(dispatchPlan.errorMessage || ""), { isError: true });
    return false;
  }
  try {
    openPresetModuleOptionModal(dispatchPlan.nextOpen.moduleType, dispatchPlan.nextOpen.options);
    closePreviewAddTypePicker({ clearTarget: false });
    return true;
  } catch (err) {
    console.error("[system] Failed to open preset module option modal from preview add", err);
    const exceptionUiPlan = buildPresetModuleOptionOpenFromPreviewAddExceptionUiDispatchPlan(err);
    setPreviewAddTypeErrorMessage(exceptionUiPlan.errorMessage, { isError: true });
    return false;
  }
}

function handlePreviewAddModalBack() {
  const { normalBtn, cornerBtn, titleEl } =
    getPreviewAddTypeModalElements();
  const backUiPlan = buildPreviewAddTypeBackUiExecutionPlan({
    normalDisabled: Boolean(normalBtn?.disabled),
    cornerDisabled: Boolean(cornerBtn?.disabled),
  });
  if (backUiPlan.shouldClearError) {
    setPreviewAddTypeErrorMessage("", { isError: false });
  }
  setPreviewAddTypeModalStep(backUiPlan.nextStep, backUiPlan.selectedModuleType);
  requestAnimationFrame(() => {
    focusPreviewAddTypeModalStepTarget(backUiPlan.focusKey, {
      normalBtn,
      cornerBtn,
      titleEl,
    });
  });
}

function setPreviewPresetModuleError(message = "") {
  const errorEl = $("#previewPresetModuleError");
  if (!errorEl) return;
  errorEl.textContent = String(message || "");
  errorEl.classList.toggle("error", Boolean(message));
}

function closePreviewPresetModuleModal({ returnFocus = true, clearTarget = true } = {}) {
  const closeUiPlan = buildPreviewPresetPickerCloseUiDispatchPlan(previewPresetPickerFlowState, {
    fallbackFocusEl: previewAddFlowState.anchorEl,
    returnFocus,
    clearTarget,
  });
  closeModal("#previewPresetModuleModal");
  applyPreviewPresetPickerCloseUiDispatchPlanToRuntime(closeUiPlan);
}

function setPresetModuleOptionError(message = "") {
  const errorEl = $("#presetModuleOptionError");
  if (!errorEl) return;
  errorEl.textContent = String(message || "");
  errorEl.classList.toggle("error", Boolean(message));
}

function getPresetModuleOptionSelectedPreset() {
  const presetId = String(presetModuleOptionFlowState.draft?.presetId || "");
  if (!presetId) return null;
  const items = getPreviewPresetItemsForType(presetModuleOptionFlowState.draft?.moduleType || "");
  return items.find((item) => String(item.id) === presetId) || null;
}

function getPresetModuleOptionFilterOptions(moduleType = "normal") {
  const normalizedType = moduleType === "corner" ? "corner" : "normal";
  if (normalizedType === "corner") {
    const availableKeys = new Set(
      getPreviewPresetItemsForType("corner")
        .flatMap((item) => getPreviewPresetFilterKeysForItem(item, "corner"))
    );
    return (SYSTEM_MODULE_OPTION_CONFIG.corner?.directionOptions || [])
      .map((option) => ({
        key: String(option.key || ""),
        label: String(option.label || option.key || ""),
      }))
      .filter((option) => availableKeys.has(option.key));
  }

  const availableKeys = new Set(
    getPreviewPresetItemsForType("normal")
      .flatMap((item) => getPreviewPresetFilterKeysForItem(item, "normal"))
  );
  return (SYSTEM_MODULE_OPTION_CONFIG.normal?.widthOptions || [])
    .map((width) => String(Math.round(Number(width || 0))))
    .filter((key) => key && availableKeys.has(key))
    .map((key) => ({ key, label: key }));
}

function getDefaultPresetModuleOptionFilterKey(moduleType = "normal", edgeId = "") {
  const normalizedType = moduleType === "corner" ? "corner" : "normal";
  const options = getPresetModuleOptionFilterOptions(normalizedType);
  const edge = edgeId ? findShelfById(edgeId) : null;
  if (edge) {
    if (normalizedType === "corner" && edge.type === "corner") {
      const key = edge.swap ? "600x800" : "800x600";
      if (options.some((option) => option.key === key)) return key;
    }
    if (normalizedType === "normal" && edge.type === "bay") {
      const key = String(Math.round(Number(edge.width || 0) || 0));
      if (options.some((option) => option.key === key)) return key;
    }
  }
  return String(options[0]?.key || "");
}

function renderPresetModuleOptionSelectionSummary() {
  const target = $("#selectedPresetModuleOption");
  if (!target) return;
  const preset = getPresetModuleOptionSelectedPreset();
  if (!preset) {
    target.innerHTML = `<div class="placeholder">선택된 모듈 없음</div>`;
    return;
  }
  const moduleType = presetModuleOptionFlowState.draft?.moduleType === "corner" ? "corner" : "normal";
  const filterLabel =
    moduleType === "corner"
      ? (preset.swap ? "600 × 800" : "800 × 600")
      : `${String(presetModuleOptionFlowState.draft?.filterKey || Math.round(Number(preset.width || 0) || 0) || "")}mm`;
  const { componentSummary, furnitureSummary } = buildPresetAddonBreakdownFromPreset(preset);
  const meta = `${moduleType === "corner" ? "코너" : "일반"} · ${filterLabel} · 선반 ${Math.max(
    1,
    Math.floor(Number(preset.count || 1))
  )}개 · 구성품 ${componentSummary === "-" ? "없음" : componentSummary} · 가구 ${
    furnitureSummary === "-" ? "없음" : furnitureSummary
  }`;
  const visualStyle = buildMaterialVisualInlineStyle({
    swatch: "#ddd",
    imageUrl: preset?.thumbnail || "",
  });
  target.innerHTML = `
    <div class="addon-chip">
      <div class="material-visual" style="${visualStyle}"></div>
      <div class="info">
        <div class="name">${escapeHtml(String(preset.label || "모듈"))}</div>
        <div class="meta">${escapeHtml(meta)}</div>
      </div>
    </div>
  `;
}

function renderPresetModuleOptionFrontPreview() {
  const container = $("#presetModuleOptionFrontPreview");
  if (!container) return;
  const modalState = presetModuleOptionFlowState.modalState;
  const preset = getPresetModuleOptionSelectedPreset();
  const activeTab = presetModuleOptionFlowState.draft?.activeTab === "custom" ? "custom" : "preset";
  if (!modalState) {
    container.innerHTML = "";
    return;
  }
  if (activeTab === "custom") {
    container.innerHTML = `
      <div class="module-front-preview-card">
        <div class="module-front-preview-head">
          <div class="module-front-preview-title">모듈 미리보기</div>
        </div>
        <div class="module-front-preview-canvas" aria-hidden="true">
          <div class="module-front-preview-empty-guide">맞춤구성에서 선반/행거/가구를 직접 설정할 수 있습니다.</div>
        </div>
        <div class="module-front-preview-meta">
          <div class="module-front-preview-row">
            <span class="label">구성 방식</span>
            <span class="value">맞춤구성</span>
          </div>
        </div>
        <div class="module-front-preview-note">맞춤구성 탭에서 바로 편집할 수 있습니다.</div>
      </div>
    `;
    return;
  }
  if (!preset) {
    const widthLabel = presetModuleOptionFlowState.draft?.filterKey
      ? (modalState.moduleType === "corner"
          ? (presetModuleOptionFlowState.draft.filterKey === "600x800" ? "600 × 800" : "800 × 600")
          : `${presetModuleOptionFlowState.draft.filterKey}mm`)
      : "";
    container.innerHTML = `
      <div class="module-front-preview-card">
        <div class="module-front-preview-head">
          <div class="module-front-preview-title">모듈 미리보기</div>
        </div>
        <div class="module-front-preview-canvas" aria-hidden="true">
          <div class="module-front-preview-empty-guide">
            ${
              widthLabel
                ? "모듈 선택 버튼을 눌러 미리 구성된 모듈을 선택하세요."
                : "모듈 선택 버튼을 눌러 미리 구성된 모듈을 선택하세요."
            }
          </div>
        </div>
        <div class="module-front-preview-meta">
          <div class="module-front-preview-row">
            <span class="label">선택 기준</span>
            <span class="value">${widthLabel ? escapeHtml(widthLabel) : "-"}</span>
          </div>
        </div>
        <div class="module-front-preview-note">모듈 선택 후 정면 미리보기가 표시됩니다.</div>
      </div>
    `;
    return;
  }
  const moduleType = modalState.moduleType === "corner" ? "corner" : "normal";
  const averageHeightMm = getModuleOptionAverageHeightMm();
  const normalWidthFromFilter = Math.max(
    1,
    Math.round(Number(presetModuleOptionFlowState.draft?.filterKey || preset.width || 400) || 400)
  );
  const shelfWidthMm = moduleType === "corner" ? (preset.swap ? 600 : 800) : normalWidthFromFilter;
  const sizeLabel =
    moduleType === "corner"
      ? (preset.swap ? "600 × 800mm" : "800 × 600mm")
      : `폭 ${normalWidthFromFilter}mm`;
  const { componentSummary, furnitureSummary, rodCount, furnitureAddonId } =
    buildPresetAddonBreakdownFromPreset(preset);
  const previewColors = getModuleFrontPreviewMaterialColors();
  container.innerHTML = buildModuleFrontPreviewHtml({
    moduleLabel: moduleType === "corner" ? "코너 모듈" : "일반 모듈",
    sizeLabel,
    shelfCount: Number(preset.count || 1),
    rodCount,
    furnitureAddonId,
    componentSummary,
    furnitureSummary,
    type: moduleType === "corner" ? "corner" : "bay",
    averageHeightMm,
    shelfWidthMm,
    shelfColor: previewColors.shelfColor,
    postBarColor: previewColors.postBarColor,
  });
}

function applyPresetModuleOptionSyncDomUiViewModel({
  domUiViewModel,
  filterOptions,
  elements,
} = {}) {
  const viewModel = domUiViewModel && typeof domUiViewModel === "object" ? domUiViewModel : null;
  if (!viewModel) return;
  const {
    titleEl,
    pickerBtn,
    filterLabelEl,
    filterNoteEl,
    filterSelectEl,
    backBtn,
    presetTabBtn,
    customTabBtn,
    presetPanelEl,
    customPanelEl,
    customBayPanelEl,
    customCornerPanelEl,
    unifiedPreviewEl,
    saveBtn,
  } = elements || {};

  if (titleEl) titleEl.textContent = viewModel.title;
  if (presetTabBtn) {
    presetTabBtn.classList.toggle("active", viewModel.tab.presetActive);
    presetTabBtn.setAttribute("aria-selected", viewModel.tab.presetActive ? "true" : "false");
  }
  if (customTabBtn) {
    customTabBtn.classList.toggle("active", viewModel.tab.customActive);
    customTabBtn.setAttribute("aria-selected", viewModel.tab.customActive ? "true" : "false");
  }
  if (presetPanelEl) presetPanelEl.classList.toggle("hidden", !viewModel.panel.showPresetPanel);
  if (customPanelEl) customPanelEl.classList.toggle("hidden", !viewModel.panel.showCustomPanel);
  if (unifiedPreviewEl) {
    unifiedPreviewEl.classList.toggle("hidden", !viewModel.panel.showUnifiedPreview);
  }
  if (customBayPanelEl) {
    customBayPanelEl.classList.toggle("hidden", !viewModel.panel.showCustomBayPanel);
  }
  if (customCornerPanelEl) {
    customCornerPanelEl.classList.toggle("hidden", !viewModel.panel.showCustomCornerPanel);
  }
  if (filterLabelEl) filterLabelEl.textContent = viewModel.filterLabel;
  if (filterNoteEl) filterNoteEl.textContent = viewModel.filterNote;
  if (filterSelectEl) {
    filterSelectEl.innerHTML = (Array.isArray(filterOptions) ? filterOptions : [])
      .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
      .join("");
    filterSelectEl.value = viewModel.filterSelectValue;
  }
  if (pickerBtn) pickerBtn.textContent = viewModel.pickerButtonText;
  if (backBtn) {
    const backBtnState = viewModel.backBtnState;
    backBtn.classList.toggle("hidden", backBtnState.hidden);
    backBtn.disabled = backBtnState.disabled;
    backBtn.classList.toggle("btn-disabled", backBtnState.disabledClass);
  }
  if (saveBtn) {
    const saveBtnState = viewModel.saveBtnState;
    saveBtn.disabled = saveBtnState.disabled;
    saveBtn.classList.toggle("btn-disabled", saveBtnState.disabledClass);
    saveBtn.classList.toggle("hidden", saveBtnState.hidden);
    if (saveBtnState.title) saveBtn.title = saveBtnState.title;
    else saveBtn.removeAttribute("title");
  }
}

function applyPresetModuleOptionCustomSyncPreRuntimePlan(customSyncPreUiPlan) {
  if (!customSyncPreUiPlan?.enabled) return;
  const customSyncActivePatch = customSyncPreUiPlan.activeTargetsPatch;
  if (customSyncActivePatch?.hasBayPatch) {
    activeBayOptionId = customSyncActivePatch.nextActiveBayOptionId;
  }
  if (customSyncActivePatch?.hasCornerPatch) {
    activeCornerOptionId = customSyncActivePatch.nextActiveCornerOptionId;
  }
  if (customSyncPreUiPlan.shouldEnsureSession) {
    ensurePresetModuleOptionCustomComposeSession();
  }
}

function applyPresetModuleOptionCustomSyncPostRuntimePlan(customSyncExecutionPlan) {
  if (!customSyncExecutionPlan) return;
  if (customSyncExecutionPlan.shouldSyncCorner) syncCornerOptionModal();
  if (customSyncExecutionPlan.shouldSyncBay) syncBayOptionModal();
}

function applyPresetModuleOptionPresetSaveRuntimePlan(runtimeUiPlan) {
  if (!runtimeUiPlan || runtimeUiPlan.route !== "preset") return;
  const preset = runtimeUiPlan.preset;
  setPresetModuleOptionError("");

  if (runtimeUiPlan.shouldPatchPreviewAddTarget) {
    setPreviewAddFlowTarget(
      previewAddFlowState,
      runtimeUiPlan.previewAddTargetPatchTarget,
      runtimeUiPlan.previewAddTargetPatchAnchorEl
    );
  }

  closePresetModuleOptionModal({ returnFocus: false, clearState: true });
  setPreviewPresetPickerOpenState(
    previewPresetPickerFlowState,
    runtimeUiPlan.pickerOpenModuleType,
    runtimeUiPlan.pickerOpenOptions
  );
  applyPreviewPresetByContext(
    preset,
    runtimeUiPlan.presetApplyContext,
    runtimeUiPlan.presetApplyType,
    runtimeUiPlan.presetApplyFilterKey
  );
}

function applyPresetModuleOptionOpenUiDispatchPlanToRuntime(
  openUiPlan,
  debugMeta = {}
) {
  if (!openUiPlan?.openTransition) {
    throw new Error("통합 모듈구성 모달 전환 상태를 만들지 못했습니다.");
  }
  const openTransition = openUiPlan.openTransition;
  patchPresetModuleOptionFlowState(presetModuleOptionFlowState, openUiPlan.flowStatePatch);
  if (openUiPlan.shouldResetActiveComposeTargets) {
    activeBayOptionId = "";
    activeCornerOptionId = "";
  }
  try {
    syncPresetModuleOptionModal();
  } catch (err) {
    console.error("[system] Failed while syncing preset module option modal", {
      ...debugMeta,
      openTransition,
    }, err);
    throw err;
  }
  openModal("#presetModuleOptionModal", { focusTarget: "#presetModuleOptionModalTitle" });
  const modalEl = $("#presetModuleOptionModal");
  if (!modalEl || modalEl.classList.contains("hidden")) {
    throw new Error("통합 모듈구성 모달이 열리지 않았습니다.");
  }
}

function applyPreviewAddCloseUiDispatchPlanToRuntime(closeUiPlan) {
  if (!closeUiPlan) return;
  setPreviewAddTypeModalStep(closeUiPlan.resetStep, closeUiPlan.resetSelectedModuleType);
  if (closeUiPlan.clearErrorMessage) {
    setPreviewAddTypeErrorMessage("", { isError: false });
  }
  if (closeUiPlan.shouldRestoreFocus && closeUiPlan.focusTarget?.isConnected) {
    closeUiPlan.focusTarget.focus();
  }
  if (closeUiPlan.shouldClearFlowTarget) {
    clearPreviewAddFlowTarget(previewAddFlowState);
  }
}

function applyPreviewPresetPickerCloseUiDispatchPlanToRuntime(closeUiPlan) {
  if (!closeUiPlan) return;
  if (closeUiPlan.clearErrorMessage) setPreviewPresetModuleError("");
  if (closeUiPlan.shouldResetPreviewPresetPickerFlowState) {
    resetPreviewPresetPickerFlowState(previewPresetPickerFlowState);
  }
  if (closeUiPlan.shouldRestoreFocus && closeUiPlan.focusTarget?.isConnected) {
    closeUiPlan.focusTarget.focus();
  }
  if (closeUiPlan.shouldClearPreviewAddTarget) {
    clearPreviewAddFlowTarget(previewAddFlowState);
  }
  if (closeUiPlan.shouldReopenPresetModuleOption) {
    reopenPresetModuleOptionModalAfterPresetPicker();
  }
}

function applyPresetModuleOptionCloseUiDispatchPlanToRuntime(closeUiPlan) {
  if (!closeUiPlan) return;
  if (closeUiPlan.clearErrorMessage) setPresetModuleOptionError("");
  if (closeUiPlan.shouldRestoreFocus && closeUiPlan.focusTarget?.isConnected) {
    closeUiPlan.focusTarget.focus();
  }
  if (closeUiPlan.shouldResetActiveComposeTargets) {
    activeBayOptionId = "";
    activeCornerOptionId = "";
  }
  if (closeUiPlan.shouldResetFlowState) {
    resetPresetModuleOptionFlowState(presetModuleOptionFlowState);
  }
}

function applyPreviewModuleActionCloseUiDispatchPlanToRuntime(closeUiPlan) {
  if (!closeUiPlan) return;
  if (closeUiPlan.clearErrorMessage) setPreviewModuleActionModalError("", { isError: false });
  if (closeUiPlan.shouldRestoreFocus && closeUiPlan.focusTarget?.isConnected) {
    closeUiPlan.focusTarget.focus();
  }
  if (closeUiPlan.shouldResetFlowState) {
    resetPreviewModuleActionFlowState(previewModuleActionFlowState);
  }
}

function applyPreviewPresetPickerOpenUiDispatchPlanToRuntime(openDispatchPlan) {
  if (!openDispatchPlan || openDispatchPlan.route !== "open") return;
  setPreviewPresetPickerOpenState(
    previewPresetPickerFlowState,
    openDispatchPlan.openState.moduleType,
    openDispatchPlan.openState.options
  );
  patchPreviewPresetPickerFlowState(previewPresetPickerFlowState, openDispatchPlan.pickerStatePatch);
  previewPresetModuleCategoryFilterKey = "all";
  const titleEl = $("#previewPresetModuleModalTitle");
  if (titleEl) {
    titleEl.textContent = openDispatchPlan.title;
  }
  if (openDispatchPlan.clearErrorMessage) setPreviewPresetModuleError("");
  if (openDispatchPlan.shouldRenderModalUi) renderPreviewPresetModuleModalUI();
  openModal("#previewPresetModuleModal", { focusTarget: "#previewPresetModuleModalTitle" });
}

function syncPresetModuleOptionModal() {
  const modalState = presetModuleOptionFlowState.modalState;
  if (!modalState) return;
  const titleEl = $("#presetModuleOptionModalTitle");
  const pickerBtn = $("#openPresetModulePickerBtn");
  const filterLabelEl = $("#presetModuleOptionFilterLabel");
  const filterNoteEl = $("#presetModuleOptionFilterNote");
  const filterSelectEl = $("#presetModuleOptionFilterSelect");
  const backBtn = $("#backPresetModuleOptionModal");
  const presetTabBtn = $("#presetModuleOptionPresetTabBtn");
  const customTabBtn = $("#presetModuleOptionCustomTabBtn");
  const presetPanelEl = $("#presetModuleOptionPresetTabPanel");
  const customPanelEl = $("#presetModuleOptionCustomTabPanel");
  const customBayPanelEl = $("#presetModuleOptionCustomBayPanel");
  const customCornerPanelEl = $("#presetModuleOptionCustomCornerPanel");
  const unifiedPreviewEl = $("#presetModuleOptionFrontPreview");
  const removeBtn = $("#removePresetModuleOptionModal");
  const moduleLabel = modalState.moduleType === "corner" ? "코너 모듈" : "일반 모듈";
  const filterOptions = getPresetModuleOptionFilterOptions(modalState.moduleType);
  const selectedPreset = getPresetModuleOptionSelectedPreset();
  const syncPreViewModel = buildPresetModuleOptionSyncPreViewModel({
    modalState,
    currentDraft: presetModuleOptionFlowState.draft,
    filterOptions,
    selectedPreset,
    getDefaultFilterKey: getDefaultPresetModuleOptionFilterKey,
    isPresetAvailableForFilter: isPreviewPresetAvailableForFilter,
    moduleLabel,
    activeBayOptionId,
    activeCornerOptionId,
  });
  if (!syncPreViewModel) return;
  const {
    normalizedDraft,
    activeTab,
    textViewState,
    customSyncRunPlan,
  } = syncPreViewModel;
  patchPresetModuleOptionFlowState(presetModuleOptionFlowState, { draft: normalizedDraft });
  const customPanelsViewState = customSyncRunPlan.customPanelsViewState;
  const customSyncPreUiPlan = buildPresetModuleOptionCustomSyncPreUiDispatchPlan(customSyncRunPlan);
  const customSyncPlan = customSyncPreUiPlan.customSyncPlan;
  if (customSyncPreUiPlan.enabled) {
    applyPresetModuleOptionCustomSyncPreRuntimePlan(customSyncPreUiPlan);
    const customSyncExecutionPlan = buildPresetModuleOptionCustomSyncPostUiDispatchPlan({
      customSyncPlan,
      activeBayOptionId,
      activeCornerOptionId,
    });
    applyPresetModuleOptionCustomSyncPostRuntimePlan(customSyncExecutionPlan);
  }
  const customResolvedViewModel = buildPresetModuleOptionCustomSyncResolvedViewModel({
    modalState,
    activeTab,
    activeBayOptionId,
    activeCornerOptionId,
    customSyncPlan,
    hasPreset: Boolean(getPresetModuleOptionSelectedPreset()),
    bayValidation: activeTab === "custom" ? getBayOptionApplyValidationState() : null,
    cornerValidation: activeTab === "custom" ? getCornerOptionApplyValidationState() : null,
  });
  const customPostSyncPlan = customResolvedViewModel.customPostSyncPlan;
  const refreshedCustomPanelsViewState = customPostSyncPlan.customPanelsViewState;
  const syncPostViewModel = customResolvedViewModel.syncPostViewModel;
  const domUiViewModel = buildPresetModuleOptionSyncDomUiViewModel({
    activeTab,
    textViewState,
    customPanelsViewState: refreshedCustomPanelsViewState,
    syncPostViewModel,
    currentDraft: presetModuleOptionFlowState.draft,
  });
  const saveBtn = $("#savePresetModuleOptionModal");
  applyPresetModuleOptionSyncDomUiViewModel({
    domUiViewModel,
    filterOptions,
    elements: {
      titleEl,
      pickerBtn,
      filterLabelEl,
      filterNoteEl,
      filterSelectEl,
      backBtn,
      presetTabBtn,
      customTabBtn,
      presetPanelEl,
      customPanelEl,
      customBayPanelEl,
      customCornerPanelEl,
      unifiedPreviewEl,
      saveBtn,
    },
  });
  if (removeBtn) {
    const modalEdgeId = String(modalState?.edgeId || "");
    const modalEdge = modalEdgeId ? findShelfById(modalEdgeId) : null;
    const isPendingComposeTarget = Boolean(modalEdge && isPendingEdge(modalEdge));
    const isAddMode = normalizePresetModuleOptionMode(modalState?.mode) === "add";
    removeBtn.classList.toggle("hidden", false);
    removeBtn.disabled = false;
    removeBtn.classList.toggle("btn-disabled", false);
    removeBtn.setAttribute("aria-disabled", "false");
    removeBtn.textContent = isAddMode || isPendingComposeTarget ? "추가 취소" : "모듈 삭제";
  }
  renderPresetModuleOptionSelectionSummary();
  renderPresetModuleOptionFrontPreview();
  setPresetModuleOptionError("");
}

function setPresetModuleOptionModalTab(nextTab = "preset") {
  if (!presetModuleOptionFlowState.draft) return;
  const normalizedNextTab = normalizePresetModuleOptionTab(nextTab);
  const currentTab = normalizePresetModuleOptionTab(
    String(presetModuleOptionFlowState.draft?.activeTab || "preset")
  );
  let nextDraft = buildPresetModuleOptionDraftAfterTabChange(
    presetModuleOptionFlowState.draft,
    normalizedNextTab
  );
  if (!nextDraft) return;
  if (currentTab !== normalizedNextTab) {
    bayDirectComposeDraft = null;
    cornerDirectComposeDraft = null;
    nextDraft = {
      ...nextDraft,
      // Reset selected preset whenever user switches compose mode.
      presetId: "",
    };
  }
  patchPresetModuleOptionFlowState(presetModuleOptionFlowState, {
    draft: nextDraft,
  });
  syncPresetModuleOptionModal();
}

function handlePresetModuleOptionModalTabClick(nextTab = "preset") {
  if (!presetModuleOptionFlowState.modalState) return;
  setPresetModuleOptionModalTab(nextTab);
}

function resetBayComposeInputsOnWidthChange() {
  if (!activeBayOptionId) return;
  const countInput = $("#bayCountInput");
  const rodCountInput = $("#bayRodCountInput");
  if (countInput) countInput.value = "0";
  if (rodCountInput) rodCountInput.value = "0";
  clearFurnitureAddonsForEdge(activeBayOptionId);
  renderShelfAddonSelectionToTarget(activeBayOptionId, "selectedBayOptionAddon");
  renderShelfAddonSelection(activeBayOptionId);
  setFieldError(countInput, $("#bayCountError"), "");
  bayDirectComposeDraft = captureBayOptionModalDraft();
}

function applyDirectComposePendingActivationStateToRuntime(activationState) {
  activeBayOptionId = activationState?.activeBayOptionId || "";
  activeCornerOptionId = activationState?.activeCornerOptionId || "";
  if (activationState?.resetCornerDirectComposeDraft) cornerDirectComposeDraft = null;
  if (activationState?.resetBayDirectComposeDraft) bayDirectComposeDraft = null;
  setPresetModuleOptionError(String(activationState?.errorMessage || ""));
}

function ensurePresetModuleOptionCustomComposeSession() {
  const composeSourceErrorMessage = "이 끝점에서는 모듈을 추가할 수 없습니다.";
  const modalState = presetModuleOptionFlowState.modalState;
  const sessionBootstrap = buildPresetModuleOptionCustomComposeSessionBootstrap({
    modalState,
    draft: presetModuleOptionFlowState.draft,
    activeBayOptionId,
    activeCornerOptionId,
    previewAddTarget: previewAddFlowState.target,
    cloneTargetSnapshot: clonePreviewAddTargetSnapshot,
  });
  const bootstrapUiPlan =
    buildPresetModuleOptionCustomComposeBootstrapUiExecutionPlan(sessionBootstrap);
  if (bootstrapUiPlan.route === "abort") return false;
  if (bootstrapUiPlan.route === "ready") return true;
  if (bootstrapUiPlan.route === "error") {
    setPresetModuleOptionError(bootstrapUiPlan.errorMessage);
    return false;
  }
  const normalizedModuleType = bootstrapUiPlan.moduleType;
  const addTarget = bootstrapUiPlan.addTarget;

  const sourceResolution = buildPreviewAddSourceResolutionResult({
    source: resolveActivePreviewAddSourceTarget(addTarget),
    errorMessage: composeSourceErrorMessage,
  });
  const sourceUiPlan = buildPresetModuleOptionCustomComposeSourceUiExecutionPlan({
    bootstrapUiPlan,
    sourceResolution,
  });
  if (sourceUiPlan.route !== "create") {
    setPresetModuleOptionError(sourceUiPlan.errorMessage);
    return false;
  }
  const source = sourceUiPlan.source;

  if (normalizedModuleType === "corner") {
    const cornerLimitState = getShapeCornerLimitState();
    const cornerComposeValidation = buildPresetModuleOptionCustomCornerComposeValidation({
      isRootSource: isRootPreviewEndpointTarget(source),
      hasRootCornerStartDirection: hasSelectedRootCornerStartDirection(addTarget),
      rootCornerDirectionRequiredMessage: getRootCornerDirectionRequiredMessage(),
      canAddCornerByLimit: Boolean(cornerLimitState?.canAdd),
      cornerLimitBlockedMessage: getCornerLimitBlockedMessage(cornerLimitState),
      canAddCornerAtTarget: canAddCornerAtTarget(source, getSelectedShape()),
      cornerAttachSideBlockedMessage: getCornerAttachSideBlockedMessage(source, getSelectedShape()),
    });
    const placement = buildPlacementFromEndpoint(source);
    const edgeCreatePlan = buildPendingCornerComposeEdgeCreatePlan({
      source,
      placement,
      normalizeDirection,
      directionToSideIndex,
      createdAt: Date.now(),
    });
    const cornerCreationUiPlan = buildPresetModuleOptionCustomCornerCreationUiExecutionPlan({
      cornerComposeValidation,
      edgeCreatePlan,
      fallbackErrorMessage: composeSourceErrorMessage,
    });
    if (cornerCreationUiPlan.route !== "create-corner-edge") {
      setPresetModuleOptionError(cornerCreationUiPlan.errorMessage);
      return false;
    }
    const edge = buildPendingCornerComposeEdge(cornerCreationUiPlan.edgeCreatePlan);
    registerEdge(edge);
    const creationUiPlan = buildPresetModuleOptionCustomComposeCreationUiExecutionPlan({
      moduleType: "corner",
      edgeId: edge.id,
      fallbackErrorMessage: composeSourceErrorMessage,
    });
    if (creationUiPlan.route === "error") {
      setPresetModuleOptionError(creationUiPlan.errorMessage);
      return false;
    }
    applyDirectComposePendingActivationStateToRuntime(creationUiPlan.activationState);
    return true;
  }

  const shelfId = addShelfFromEndpoint(source, addTarget, buildPendingBayComposeAddOptions());
  const creationUiPlan = buildPresetModuleOptionCustomComposeCreationUiExecutionPlan({
    moduleType: "normal",
    edgeId: shelfId,
    fallbackErrorMessage: composeSourceErrorMessage,
  });
  if (creationUiPlan.route === "error") {
    setPresetModuleOptionError(creationUiPlan.errorMessage);
    return false;
  }
  applyDirectComposePendingActivationStateToRuntime(creationUiPlan.activationState);
  return true;
}

function openPresetModuleOptionModal(
  moduleType,
  {
    mode = "add",
    edgeId = "",
    returnFocusEl = null,
    addTarget = null,
    preserveDraft = false,
    initialTab = "preset",
    backContext = null,
  } = {}
) {
  const openUiPlan = buildPresetModuleOptionOpenUiDispatchPlan({
    moduleType,
    options: {
      mode,
      edgeId,
      returnFocusEl,
      addTarget,
      preserveDraft,
      initialTab,
      backContext,
    },
    currentDraft: presetModuleOptionFlowState.draft,
    fallbackAddTarget: previewAddFlowState.target,
    getDefaultFilterKey: getDefaultPresetModuleOptionFilterKey,
  });
  if (openUiPlan.route === "error" || !openUiPlan.openTransition) {
    throw new Error(openUiPlan.errorMessage || "통합 모듈구성 모달 전환 상태를 만들지 못했습니다.");
  }
  applyPresetModuleOptionOpenUiDispatchPlanToRuntime(openUiPlan, {
    moduleType,
    mode,
    edgeId,
    initialTab,
  });
}

function closePresetModuleOptionModal({ returnFocus = true, clearState = true } = {}) {
  const closeUiPlan = buildPresetModuleOptionCloseUiDispatchPlan(presetModuleOptionFlowState.modalState, {
    returnFocus,
    clearState,
  });
  closeModal("#presetModuleOptionModal");
  applyPresetModuleOptionCloseUiDispatchPlanToRuntime(closeUiPlan);
}

function handlePresetModuleOptionModalBack() {
  const modalState = presetModuleOptionFlowState.modalState;
  const dispatchPlan = buildPresetModuleOptionBackUiDispatchPlan(
    modalState,
    clonePreviewAddTargetSnapshot
  );
  if (!dispatchPlan) return;
  closePresetModuleOptionModal({ returnFocus: false, clearState: true });
  if (dispatchPlan.route === "preview-module-action") {
    openPreviewModuleActionModal(...dispatchPlan.previewModuleActionArgs);
    return;
  }
  openPreviewAddTypeModal(...dispatchPlan.previewAddArgs);
}

function reopenPresetModuleOptionModalAfterPresetPicker() {
  if (!presetModuleOptionFlowState.modalState) return;
  patchPresetModuleOptionFlowState(presetModuleOptionFlowState, {
    draft: buildPresetModuleOptionDraftForReopenAfterPresetPicker(
      presetModuleOptionFlowState.draft
    ),
  });
  syncPresetModuleOptionModal();
  openModal("#presetModuleOptionModal", { focusTarget: "#presetModuleOptionModalTitle" });
}

function handlePresetModuleOptionFilterChange() {
  const modalState = presetModuleOptionFlowState.modalState;
  const filterSelectEl = $("#presetModuleOptionFilterSelect");
  if (!modalState || !filterSelectEl) return;
  const nextFilterKey = String(filterSelectEl.value || "");
  const preset = getPresetModuleOptionSelectedPreset();
  const nextDraft = buildPresetModuleOptionDraftAfterFilterChange({
    modalState,
    currentDraft: presetModuleOptionFlowState.draft,
    nextFilterKey,
    selectedPreset: preset,
    isPresetAvailableForFilter: isPreviewPresetAvailableForFilter,
  });
  if (!nextDraft) return;
  patchPresetModuleOptionFlowState(presetModuleOptionFlowState, {
    draft: {
      ...nextDraft,
      // Width/filter change should always reset selected module.
      presetId: "",
    },
  });
  syncPresetModuleOptionModal();
}

function openPresetPickerFromPresetModuleOptionModal() {
  const modalState = presetModuleOptionFlowState.modalState;
  if (!modalState) return;
  const modalEdgeId = String(modalState?.edgeId || "");
  const modalEdge = modalEdgeId ? findShelfById(modalEdgeId) : null;
  const nextOpen = buildPreviewPresetPickerOpenFromPresetModuleOption(
    modalState,
    presetModuleOptionFlowState.draft
  );
  if (!nextOpen) return;
  if (isPendingEdge(modalEdge)) {
    suppressPendingOptionModalCleanupOnce = true;
  }
  closePresetModuleOptionModal({ returnFocus: false, clearState: false });
  openPreviewPresetModuleModal(nextOpen.moduleType, nextOpen.options);
}

function getPreviewPresetItemsForType(type = "") {
  const key = type === "corner" ? "corner" : "normal";
  return Array.isArray(SYSTEM_MODULE_PRESETS[key]) ? SYSTEM_MODULE_PRESETS[key] : [];
}

function getPreviewPresetFilterKeysForItem(item, type = previewPresetPickerFlowState.moduleType) {
  if (!item || typeof item !== "object") return [];
  if (type === "corner") {
    const explicitKeys = Array.isArray(item.filterKeys)
      ? item.filterKeys.map((key) => String(key || "")).filter(Boolean)
      : [];
    if (explicitKeys.length) return explicitKeys;
    return [item.swap ? "600x800" : "800x600"];
  }
  const explicitKeys = Array.isArray(item.filterKeys)
    ? item.filterKeys.map((key) => String(key || "")).filter(Boolean)
    : [];
  if (explicitKeys.length) return explicitKeys;
  const width = Number(item.width || 0);
  return width > 0 ? [String(Math.round(width))] : [];
}

function getPreviewPresetFilterKeyForItem(item, type = previewPresetPickerFlowState.moduleType) {
  return String(getPreviewPresetFilterKeysForItem(item, type)[0] || "");
}

function isPreviewPresetAvailableForFilter(item, filterKey, type = previewPresetPickerFlowState.moduleType) {
  const key = String(filterKey || "");
  if (!key) return true;
  return getPreviewPresetFilterKeysForItem(item, type).includes(key);
}

function getPreviewPresetFilterOptions(type = previewPresetPickerFlowState.moduleType) {
  if (type === "corner") {
    const keys = new Set(
      getPreviewPresetItemsForType("corner")
        .flatMap((item) => getPreviewPresetFilterKeysForItem(item, "corner"))
    );
    return (SYSTEM_MODULE_OPTION_CONFIG.corner?.directionOptions || [])
      .map((option) => ({
        key: String(option.key || ""),
        label: String(option.label || option.key || ""),
      }))
      .filter((option) => keys.has(option.key));
  }
  const keys = new Set(
    getPreviewPresetItemsForType("normal")
      .flatMap((item) => getPreviewPresetFilterKeysForItem(item, "normal"))
  );
  return (SYSTEM_MODULE_OPTION_CONFIG.normal?.widthOptions || [])
    .map((width) => String(Math.round(Number(width || 0))))
    .filter((key) => key && keys.has(key))
    .map((key) => ({ key, label: key }));
}

function getWidthFilteredPreviewPresetItems() {
  const items = getPreviewPresetItemsForType(previewPresetPickerFlowState.moduleType);
  if (!previewPresetPickerFlowState.filterKey) return items;
  return items.filter((item) =>
    isPreviewPresetAvailableForFilter(item, previewPresetPickerFlowState.filterKey, previewPresetPickerFlowState.moduleType)
  );
}

function getPreviewPresetCategoryFilterOptions(
  widthFilteredItems = getWidthFilteredPreviewPresetItems()
) {
  const items = Array.isArray(widthFilteredItems) ? widthFilteredItems : [];
  const usedCategoryKeys = new Set(
    items.map((item) => String(item?.categoryKey || "")).filter(Boolean)
  );
  const categories = (SYSTEM_MODULE_PRESET_CATEGORIES || [])
    .filter((category) => usedCategoryKeys.has(String(category?.key || "")))
    .sort((a, b) => {
      const aOrder = Number(a?.order || 0);
      const bOrder = Number(b?.order || 0);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a?.label || "").localeCompare(String(b?.label || ""), "ko");
    })
    .map((category) => ({
      key: String(category?.key || ""),
      label: String(category?.label || category?.key || ""),
    }));
  return [{ key: "all", label: "전체" }, ...categories];
}

function renderPreviewPresetModuleCategoryTabs(
  widthFilteredItems = getWidthFilteredPreviewPresetItems()
) {
  const container = $("#previewPresetModuleCategoryTabs");
  if (!container) return;
  const options = getPreviewPresetCategoryFilterOptions(widthFilteredItems);
  const currentKey = String(previewPresetModuleCategoryFilterKey || "all");
  if (!options.some((option) => option.key === currentKey)) {
    previewPresetModuleCategoryFilterKey = "all";
  }
  container.classList.toggle("hidden", options.length <= 1);
  container.innerHTML = options
    .map((option) => {
      const key = String(option.key || "");
      const isActive = key === String(previewPresetModuleCategoryFilterKey || "all");
      return `
        <button
          type="button"
          class="material-tab${isActive ? " active" : ""}"
          data-preview-preset-category="${escapeHtml(key)}"
          aria-pressed="${isActive ? "true" : "false"}"
        >
          ${escapeHtml(option.label)}
        </button>
      `;
    })
    .join("");
}

function getFilteredPreviewPresetItems(widthFilteredItems = null) {
  const items = Array.isArray(widthFilteredItems)
    ? widthFilteredItems
    : getWidthFilteredPreviewPresetItems();
  const categoryKey = String(previewPresetModuleCategoryFilterKey || "all");
  if (!categoryKey || categoryKey === "all") return [...items];
  return items.filter((item) => String(item?.categoryKey || "") === categoryKey);
}

function getPreviewPresetSelectedPreset() {
  if (!previewPresetPickerFlowState.selectedPresetId) return null;
  const allItems = getPreviewPresetItemsForType(previewPresetPickerFlowState.moduleType);
  return allItems.find((item) => String(item.id) === String(previewPresetPickerFlowState.selectedPresetId)) || null;
}

function getPreviewPresetTargetEdge() {
  const ctx = previewPresetPickerFlowState.context;
  if (!ctx || ctx.mode !== "edit" || !ctx.edgeId) return null;
  return findShelfById(ctx.edgeId);
}

function buildPresetModuleOptionDraftSeedFromEdge(edgeOrId, { preferredTab = "" } = {}) {
  const edge = getEdgeByIdOrInstance(edgeOrId);
  if (!edge?.id) return null;
  const moduleType = edge.type === "corner" ? "corner" : "normal";
  const filterKey = String(getDefaultPresetModuleOptionFilterKey(moduleType, edge.id) || "");
  const itemsForType = getPreviewPresetItemsForType(moduleType);
  const filteredItems = filterKey
    ? itemsForType.filter((item) =>
        isPreviewPresetAvailableForFilter(item, filterKey, moduleType)
      )
    : itemsForType;
  const matchedPresetId = String(
    resolvePreviewPresetMatchedIdForTargetEdge({
      moduleType,
      targetEdge: edge,
      filteredItems,
      getRodCountForEdge: (targetEdge) =>
        getShelfAddonQuantity(targetEdge.id, ADDON_CLOTHES_ROD_ID),
      getFurnitureIdForEdge: (targetEdge) =>
        getSelectedFurnitureAddonId(targetEdge.id),
      getPresetFurnitureIdForItem: (item) => getPresetFurnitureAddonIds(item)[0] || "",
    }) || ""
  );
  const explicitTab = preferredTab === "custom" ? "custom" : preferredTab === "preset" ? "preset" : "";
  const storedTab =
    edge.composeTab === "custom" || edge.composeTab === "preset" ? edge.composeTab : "";
  const hasNormalPresetWidth = moduleType === "normal"
    ? getPresetModuleOptionFilterOptions("normal").some(
        (option) => String(option?.key || "") === String(Math.round(Number(edge.width || 0) || 0))
      )
    : false;
  const inferredTab = moduleType === "corner"
    ? (edge.customProcessing ? "custom" : matchedPresetId ? "preset" : "custom")
    : (hasNormalPresetWidth && matchedPresetId ? "preset" : "custom");
  const activeTab = explicitTab || storedTab || inferredTab;
  return {
    moduleType,
    presetId: activeTab === "preset" ? matchedPresetId : "",
    filterKey,
    activeTab,
  };
}

function buildRodAddonSummary(rodCount, emptyText = "-") {
  const normalizedRodCount = Number.isFinite(Number(rodCount))
    ? Math.max(0, Math.floor(Number(rodCount)))
    : 0;
  if (normalizedRodCount <= 0) return emptyText;
  const addonIds = Array.from({ length: normalizedRodCount }, () => ADDON_CLOTHES_ROD_ID);
  return getShelfAddonSummary(addonIds) || emptyText;
}

function buildFurnitureAddonSummary(addonIds = [], emptyText = "-") {
  const normalizedIds = Array.isArray(addonIds)
    ? addonIds.filter((addonId) => String(addonId || "") !== ADDON_CLOTHES_ROD_ID)
    : [];
  if (!normalizedIds.length) return emptyText;
  return getShelfAddonSummary(normalizedIds) || emptyText;
}

function getPresetFurnitureAddonIds(preset) {
  const presetFurnitureIds = Array.isArray(preset?.furnitureAddonIds)
    ? preset.furnitureAddonIds
    : preset?.furnitureAddonId
      ? [preset.furnitureAddonId]
      : [];
  return presetFurnitureIds.map((id) => String(id || "")).filter(Boolean);
}

function buildPresetAddonBreakdownFromPreset(preset) {
  const furnitureAddonIds = getPresetFurnitureAddonIds(preset);
  const isCornerPreset = String(preset?.moduleType || "") === "corner";
  const rodCount = Math.max(0, Math.floor(Number(preset?.rodCount || 0)));
  const furnitureAddonId = isCornerPreset ? "" : String(furnitureAddonIds[0] || "");
  return {
    componentSummary: buildRodAddonSummary(rodCount, "-"),
    furnitureSummary: isCornerPreset ? "적용 불가" : buildFurnitureAddonSummary(furnitureAddonIds, "-"),
    rodCount,
    furnitureAddonId,
  };
}

function renderPreviewPresetModuleCards() {
  const container = $("#previewPresetModuleCards");
  if (!container) return;
  const widthFilteredItems = getWidthFilteredPreviewPresetItems();
  renderPreviewPresetModuleCategoryTabs(widthFilteredItems);
  const items = getFilteredPreviewPresetItems(widthFilteredItems);
  if (!items.length) {
    container.innerHTML = `<div class="builder-hint">표시할 모듈이 없습니다.</div>`;
    return;
  }
  container.innerHTML = items
    .map((item) => {
      const type = previewPresetPickerFlowState.moduleType === "corner" ? "corner" : "normal";
      const selected = String(item.id) === String(previewPresetPickerFlowState.selectedPresetId);
      const selectedFilterKey =
        String(previewPresetPickerFlowState.filterKey || getPreviewPresetFilterKeyForItem(item, type) || "");
      const priceInfo = resolvePresetModulePriceInfo(item, {
        moduleType: type,
        selectedFilterKey,
      });
      const { componentSummary, furnitureSummary } = buildPresetAddonBreakdownFromPreset(item);
      const meta = `선반 ${Number(item.count || 1)}개 · 구성품 ${
        componentSummary === "-" ? "없음" : componentSummary
      } · 가구 ${furnitureSummary === "-" ? "없음" : furnitureSummary}`;
      const visualStyle = buildMaterialVisualInlineStyle({
        swatch: "#ddd",
        imageUrl: item?.thumbnail || "",
      });
      return `
        <button
          type="button"
          class="card-base preview-preset-card${selected ? " is-selected" : ""}"
          data-preview-preset-id="${escapeHtml(item.id)}"
          data-preview-preset-type="${escapeHtml(type)}"
          aria-pressed="${selected ? "true" : "false"}"
        >
          <div class="material-visual module_visual" style="${visualStyle}"></div>
          <span class="preset-title">${escapeHtml(item.label)}</span>
          <span class="price${priceInfo.isConsult ? " is-consult" : ""}">${escapeHtml(priceInfo.label)}</span>
          <span class="preset-meta">${escapeHtml(meta)}</span>
          ${item.description ? `<span class="preset-desc">${escapeHtml(item.description)}</span>` : ""}
        </button>
      `;
    })
    .join("");
}

function syncPreviewPresetSelectionForCurrentFilter() {
  const filteredItems = getFilteredPreviewPresetItems();
  patchPreviewPresetPickerFlowState(
    previewPresetPickerFlowState,
    buildPreviewPresetPickerVisibleSelectionPatch(
      previewPresetPickerFlowState.selectedPresetId,
      filteredItems
    )
  );
}

function renderPreviewPresetModuleModalUI() {
  syncPreviewPresetSelectionForCurrentFilter();
  renderPreviewPresetModuleCards();
}

function openPreviewPresetModuleModal(moduleType, { context = null } = {}) {
  const openUiPlan = buildPreviewPresetPickerOpenUiExecutionPlan({
    moduleType,
    context,
    fallbackFocusEl: previewAddFlowState.anchorEl,
    filterOptions: getPreviewPresetFilterOptions(moduleType),
    allItems: getPreviewPresetItemsForType(moduleType),
    targetEdge: resolvePreviewPresetPickerTargetEdgeForOpenContext(context, findShelfById),
    resolveTargetFilterKey: resolvePreviewPresetDefaultFilterKeyForTargetEdge,
    isItemAvailableForFilter: isPreviewPresetAvailableForFilter,
    resolveMatchedPresetId: ({ moduleType: nextModuleType, targetEdge, filteredItems }) =>
      resolvePreviewPresetMatchedIdForTargetEdge({
        moduleType: nextModuleType,
        targetEdge,
        filteredItems,
        getRodCountForEdge: (edge) => getShelfAddonQuantity(edge.id, ADDON_CLOTHES_ROD_ID),
        getFurnitureIdForEdge: (edge) => getSelectedFurnitureAddonId(edge.id),
        getPresetFurnitureIdForItem: (item) => getPresetFurnitureAddonIds(item)[0] || "",
      }),
  });
  const openDispatchPlan = buildPreviewPresetPickerOpenUiDispatchPlan(openUiPlan);
  applyPreviewPresetPickerOpenUiDispatchPlanToRuntime(openDispatchPlan);
}

function applyPreviewPresetToExistingBay(edgeId, preset, selectedFilterKey = "") {
  const shelf = findShelfById(edgeId);
  if (!shelf || shelf.type !== "bay") {
    setPreviewPresetModuleError("변경 대상 일반 모듈을 찾을 수 없습니다.");
    return;
  }
  const nextWidth = Math.max(1, Math.round(Number(selectedFilterKey || preset?.width || shelf.width || 400) || 400));
  const nextCount = Math.max(1, Math.floor(Number(preset?.count || shelf.count || 1)));
  const nextRodCount = Math.max(0, Math.floor(Number(preset?.rodCount || 0)));
  const prevWidth = Number(shelf.width || 0);
  const prevCount = Number(shelf.count || 0);
  const prevRodCount = getShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID);
  const prevFurnitureAddonId = getSelectedFurnitureAddonId(shelf.id);
  const nextFurnitureAddonId = String(getPresetFurnitureAddonIds(preset)[0] || "");
  const wasPendingAdd = isPendingEdge(shelf);
  const shouldMergeWithInlineInsertHistory =
    String(inlineInsertPendingFirstSaveEdgeId || "") === String(shelf.id || "");
  if (wasPendingAdd) {
    pushBuilderHistory("add-normal-preset");
  } else if (
    !shouldMergeWithInlineInsertHistory &&
    (prevWidth !== nextWidth || prevCount !== nextCount || prevRodCount !== nextRodCount)
  ) {
    pushBuilderHistory("update-normal-preset");
  } else if (!shouldMergeWithInlineInsertHistory && prevFurnitureAddonId !== nextFurnitureAddonId) {
    pushBuilderHistory("update-normal-preset");
  }
  if (wasPendingAdd) delete shelf.pendingAdd;
  if (shouldMergeWithInlineInsertHistory) inlineInsertPendingFirstSaveEdgeId = "";
  shelf.width = nextWidth;
  shelf.count = nextCount;
  shelf.composeTab = "preset";
  applyPresetAddonsToEdge(shelf.id, preset);
  closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
  renderBayInputs();
}

function applyPreviewPresetToExistingCorner(edgeId, preset, selectedFilterKey = "") {
  const corner = findShelfById(edgeId);
  if (!corner || corner.type !== "corner") {
    setPreviewPresetModuleError("변경 대상 코너 모듈을 찾을 수 없습니다.");
    return;
  }
  const nextSwap = String(selectedFilterKey || "") === "600x800"
    ? true
    : String(selectedFilterKey || "") === "800x600"
      ? false
      : Boolean(preset?.swap);
  const nextCount = Math.max(1, Math.floor(Number(preset?.count || corner.count || 1)));
  const nextRodCount = Math.max(0, Math.floor(Number(preset?.rodCount || 0)));
  const prevSwap = Boolean(corner.swap);
  const prevCount = Number(corner.count || 0);
  const prevRodCount = getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID);
  const prevCustomProcessing = Boolean(corner.customProcessing);
  const prevCustomPrimaryMm = Number(corner.customPrimaryMm || 0);
  const prevCustomSecondaryMm = Number(corner.customSecondaryMm || 0);
  const prevFurnitureAddonId = getSelectedFurnitureAddonId(corner.id);
  const nextFurnitureAddonId = String(getPresetFurnitureAddonIds(preset)[0] || "");
  const wasPendingAdd = isPendingEdge(corner);
  if (wasPendingAdd) {
    pushBuilderHistory("add-corner-preset");
  } else if (
    prevSwap !== nextSwap ||
    prevCount !== nextCount ||
    prevRodCount !== nextRodCount ||
    prevCustomProcessing ||
    prevCustomPrimaryMm > 0 ||
    prevCustomSecondaryMm > 0
  ) {
    pushBuilderHistory("update-corner-preset");
  } else if (prevFurnitureAddonId !== nextFurnitureAddonId) {
    pushBuilderHistory("update-corner-preset");
  }
  if (wasPendingAdd) delete corner.pendingAdd;
  corner.swap = nextSwap;
  corner.count = nextCount;
  corner.customProcessing = false;
  delete corner.customPrimaryMm;
  delete corner.customSecondaryMm;
  corner.composeTab = "preset";
  applyPresetAddonsToEdge(corner.id, preset);
  closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
  renderBayInputs();
}

function applyPreviewPresetNormalModule(preset, selectedFilterKey = "") {
  const sourceResolution = buildPreviewAddSourceResolutionResult({
    source: resolveActivePreviewAddSourceTarget(previewAddFlowState.target),
    errorMessage: "추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.",
  });
  const source = sourceResolution.source;
  const shelfId = sourceResolution.ok ? addShelfFromEndpoint(source, previewAddFlowState.target) : "";
  const normalAddUiPlan = buildPreviewPresetNormalAddUiExecutionPlan({
    sourceResolution,
    shelfId,
    fallbackErrorMessage: "모듈을 추가하지 못했습니다. 다시 시도해주세요.",
  });
  if (normalAddUiPlan.route !== "apply-normal-preset") {
    setPreviewPresetModuleError(normalAddUiPlan.errorMessage);
    return;
  }
  const shelf = findShelfById(normalAddUiPlan.shelfId);
  if (shelf) {
    shelf.width = Math.max(
      1,
      Math.round(Number(selectedFilterKey || preset?.width || shelf.width || 400) || 400)
    );
    shelf.count = Math.max(1, Math.floor(Number(preset?.count || shelf.count || 1)));
    shelf.composeTab = "preset";
    applyPresetAddonsToEdge(shelf.id, preset);
  }
  closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
  renderBayInputs();
}

function applyPreviewPresetCornerModule(preset, selectedFilterKey = "") {
  const sourceResolution = buildPreviewAddSourceResolutionResult({
    source: resolveActivePreviewAddSourceTarget(previewAddFlowState.target),
    errorMessage: "추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.",
  });
  const source = sourceResolution.source;
  const cornerLimitState = getShapeCornerLimitState();
  const cornerComposeValidation = buildPresetModuleOptionCustomCornerComposeValidation({
    isRootSource: Boolean(source && isRootPreviewEndpointTarget(source)),
    hasRootCornerStartDirection: hasSelectedRootCornerStartDirection(previewAddFlowState.target),
    rootCornerDirectionRequiredMessage: getRootCornerDirectionRequiredMessage(),
    canAddCornerByLimit: Boolean(cornerLimitState?.canAdd),
    cornerLimitBlockedMessage: getCornerLimitBlockedMessage(cornerLimitState),
    canAddCornerAtTarget: Boolean(source && canAddCornerAtTarget(source, getSelectedShape())),
    cornerAttachSideBlockedMessage: source
      ? getCornerAttachSideBlockedMessage(source, getSelectedShape())
      : sourceResolution.errorMessage,
  });
  const placement = source ? buildPlacementFromEndpoint(source) : null;
  const edge = source
    ? buildPreviewPresetCornerEdge({
        source,
        preset,
        selectedFilterKey,
        placement,
        normalizeDirection,
        directionToSideIndex,
        createdAt: Date.now(),
      })
    : null;
  const cornerAddUiPlan = buildPreviewPresetCornerAddUiExecutionPlan({
    sourceResolution,
    cornerComposeValidation,
    edge,
    fallbackErrorMessage: "모듈을 추가하지 못했습니다. 다시 시도해주세요.",
  });
  if (cornerAddUiPlan.route !== "apply-corner-preset") {
    setPreviewPresetModuleError(cornerAddUiPlan.errorMessage);
    return;
  }
  pushBuilderHistory("add-corner-preset");
  cornerAddUiPlan.edge.composeTab = "preset";
  registerEdge(cornerAddUiPlan.edge);
  applyPresetAddonsToEdge(cornerAddUiPlan.edge.id, preset);
  closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
  renderBayInputs();
}

function handlePreviewPresetModuleCardClick(buttonEl) {
  if (!(buttonEl instanceof Element)) return;
  const presetId = String(buttonEl.dataset.previewPresetId || "");
  const type = String(buttonEl.dataset.previewPresetType || previewPresetPickerFlowState.moduleType || "normal");
  const items = getFilteredPreviewPresetItems();
  const uiPlan = buildPreviewPresetPickerCardClickUiExecutionPlan({
    pickerFlowState: previewPresetPickerFlowState,
    clickedPresetId: presetId,
    clickedType: type,
    filteredItems: items,
  });
  if (uiPlan.route === "error") {
    setPreviewPresetModuleError(String(uiPlan.errorMessage || ""));
    return;
  }
  setPreviewPresetModuleError("");
  patchPreviewPresetPickerFlowState(previewPresetPickerFlowState, uiPlan.pickerStatePatch || {});
  if (uiPlan.shouldRenderCards) renderPreviewPresetModuleCards();
  if (uiPlan.shouldApplySelectedPreset) applySelectedPreviewPresetModule();
}

function applyPreviewPresetByContext(
  preset,
  presetContext,
  type = previewPresetPickerFlowState.moduleType,
  selectedFilterKey = previewPresetPickerFlowState.filterKey
) {
  const runtimeUiPlan = buildPreviewPresetApplyRuntimeUiDispatchPlan({
    presetContext,
    moduleType: type,
  });
  if (runtimeUiPlan.route === "edit-corner") {
    applyPreviewPresetToExistingCorner(runtimeUiPlan.edgeId, preset, selectedFilterKey);
    return;
  }
  if (runtimeUiPlan.route === "edit-bay") {
    applyPreviewPresetToExistingBay(runtimeUiPlan.edgeId, preset, selectedFilterKey);
    return;
  }
  if (runtimeUiPlan.route === "add-corner") {
    applyPreviewPresetCornerModule(preset, selectedFilterKey);
    return;
  }
  applyPreviewPresetNormalModule(preset, selectedFilterKey);
}

function applySelectedPreviewPresetModule() {
  const preset = getPreviewPresetSelectedPreset();
  const runtimeUiPlan = buildPreviewPresetPickerApplyRuntimeUiDispatchPlan({
    pickerFlowState: previewPresetPickerFlowState,
    preset,
  });
  if (runtimeUiPlan.route === "error") {
    setPreviewPresetModuleError(String(runtimeUiPlan.errorMessage || ""));
    return;
  }
  setPreviewPresetModuleError("");
  if (runtimeUiPlan.route === "return-to-preset-module-option") {
    patchPresetModuleOptionFlowState(presetModuleOptionFlowState, {
      draft: runtimeUiPlan.nextDraft,
    });
    closePreviewPresetModuleModal(runtimeUiPlan.closePickerOptions);
    return;
  }
  applyPreviewPresetByContext(
    preset,
    runtimeUiPlan.applyContext,
    runtimeUiPlan.applyType,
    runtimeUiPlan.applyFilterKey
  );
}

function savePresetModuleOptionModal() {
  const modalState = presetModuleOptionFlowState.modalState;
  const saveUiPlan = buildPresetModuleOptionSaveUiDispatchPlan({
    modalState,
    draft: presetModuleOptionFlowState.draft,
    selectedPreset: getPresetModuleOptionSelectedPreset(),
  });
  const runtimeUiPlan = buildPresetModuleOptionSaveRuntimeUiDispatchPlan(saveUiPlan);
  if (runtimeUiPlan.route === "abort") return;
  if (runtimeUiPlan.route === "error") {
    setPresetModuleOptionError(String(runtimeUiPlan.errorMessage || ""));
    return;
  }
  if (runtimeUiPlan.route === "custom") {
    const isAddMode = normalizePresetModuleOptionMode(modalState?.mode) === "add";
    if (isAddMode) {
      const ready = ensurePresetModuleOptionCustomComposeSession();
      if (!ready) return;
    }
    if (runtimeUiPlan.moduleType === "corner") saveCornerOptionModal();
    else saveBayOptionModal();
    return;
  }
  if (runtimeUiPlan.route === "preset") {
    const isEditMode = normalizePresetModuleOptionMode(modalState?.mode) === "edit";
    const modalEdgeId = String(modalState?.edgeId || "");
    const modalEdge = modalEdgeId ? findShelfById(modalEdgeId) : null;
    if (isEditMode && (!modalEdgeId || !modalEdge)) {
      setPresetModuleOptionError("적용할 모듈을 찾지 못했습니다. 모듈을 다시 선택해주세요.");
      return;
    }
    if (isPendingEdge(modalEdge)) {
      suppressPendingOptionModalCleanupOnce = true;
    }
  }
  applyPresetModuleOptionPresetSaveRuntimePlan(runtimeUiPlan);
}

function closePreviewAddTypePicker({ returnFocus = false, clearTarget = true } = {}) {
  const { modal } = getPreviewAddTypeModalElements();
  if (modal) {
    if (!modal.classList.contains("hidden")) {
      closeModal(modal, { bodySelector: null });
    } else {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }
    modal.style.left = "";
    modal.style.top = "";
  }
  const closeUiPlan = buildPreviewAddCloseUiDispatchPlan(previewAddFlowState, {
    returnFocus,
    clearTarget,
  });
  applyPreviewAddCloseUiDispatchPlanToRuntime(closeUiPlan);
}

function bindPendingOptionModalCleanupOnClose() {
  if (document.body.dataset.pendingOptionModalCleanupBound === "true") return;
  document.body.dataset.pendingOptionModalCleanupBound = "true";
  document.addEventListener("app:modal-closed", (event) => {
    if (builderHistory.applying) return;
    const modalId = getClosedModalIdFromEvent(event);
    if (modalId === "presetModuleOptionModal" && suppressPendingOptionModalCleanupOnce) {
      suppressPendingOptionModalCleanupOnce = false;
      return;
    }
    const activeEdgeId = activeCornerOptionId || activeBayOptionId || "";
    const edge = activeEdgeId ? findShelfById(activeEdgeId) : null;
    const discarded = modalId === "presetModuleOptionModal" ? discardPendingEdge(edge) : false;
    const cleanupPlan = buildPendingDirectComposeCleanupPlan({
      modalId,
      activeCornerOptionId,
      activeBayOptionId,
      discardedEdgeId: String(edge?.id || ""),
      discarded,
    });
    const cleanupRuntimePlan = buildPendingDirectComposeCleanupRuntimePlan(cleanupPlan);
    if (!cleanupRuntimePlan.shouldApply) return;
    if (cleanupRuntimePlan.clearCorner) {
      cornerDirectComposeDraft = null;
      activeCornerOptionId = null;
    }
    if (cleanupRuntimePlan.clearBay) {
      bayDirectComposeDraft = null;
      activeBayOptionId = null;
    }
    if (cleanupRuntimePlan.shouldRender) renderBayInputs();
  });
}

function setPreviewModuleActionModalError(message = "", { isError = false } = {}) {
  const errorEl = $("#previewModuleActionModalError");
  if (!errorEl) return;
  errorEl.textContent = String(message || "");
  errorEl.classList.toggle("error", Boolean(isError && message));
}

function getPreviewModuleActionModalElements() {
  return {
    modal: $("#previewModuleActionModal"),
    titleEl: $("#previewModuleActionModalTitle"),
    descEl: $("#previewModuleActionModalDesc"),
    editBtn: $("#previewModuleActionEditBtn"),
    addRightBtn: $("#previewModuleActionAddRightBtn"),
    addLeftBtn: $("#previewModuleActionAddLeftBtn"),
  };
}

function applyPreviewModuleActionModalOpenUiView(openDispatchPlan, elements = {}) {
  const viewState = openDispatchPlan?.modalViewState;
  if (!viewState) return;
  const { titleEl, descEl, editBtn, addRightBtn, addLeftBtn } = elements || {};
  if (titleEl) titleEl.textContent = viewState.title;
  if (descEl) descEl.textContent = viewState.description;
  const buttonResetState = viewState.buttonState || {};
  [editBtn, addRightBtn, addLeftBtn].forEach((btn) => {
    if (!btn) return;
    if (btn === editBtn) btn.disabled = Boolean(buttonResetState.presetDisabled);
    else if (btn === addRightBtn) btn.disabled = Boolean(buttonResetState.customDisabled);
    else btn.disabled = Boolean(buttonResetState.removeDisabled);
  });
}

function focusPreviewModuleActionModalInitialTarget(openDispatchPlan, elements = {}) {
  const focusKey = String(openDispatchPlan?.modalViewState?.initialFocusKey || "title");
  const { editBtn, addRightBtn, titleEl } = elements || {};
  if (focusKey === "preset" && editBtn) {
    editBtn.focus();
    return;
  }
  if (focusKey === "custom" && addRightBtn) {
    addRightBtn.focus();
    return;
  }
  titleEl?.focus();
}

function closePreviewModuleActionModal({ returnFocus = false, clearTarget = true } = {}) {
  const { modal } = getPreviewModuleActionModalElements();
  if (modal) {
    if (!modal.classList.contains("hidden")) {
      closeModal(modal, { bodySelector: null });
    } else {
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
    }
    modal.style.left = "";
    modal.style.top = "";
  }
  const closeUiPlan = buildPreviewModuleActionCloseUiDispatchPlan(previewModuleActionFlowState, {
    returnFocus,
    clearTarget,
  });
  applyPreviewModuleActionCloseUiDispatchPlanToRuntime(closeUiPlan);
}

function getPreviewModuleActionTargetEdge() {
  const targetEdgeId = String(previewModuleActionFlowState?.target?.edgeId || "");
  return targetEdgeId ? findShelfById(targetEdgeId) : null;
}

function resolveBayHorizontalEndpointSide(edge, direction = "right") {
  const sideHint = String(direction || "").toLowerCase() === "left" ? "left" : "right";
  const startEndpoint = buildBayEndpointFromPlacement(edge, "start");
  const endEndpoint = buildBayEndpointFromPlacement(edge, "end");
  const startX = Number(startEndpoint?.x || 0);
  const endX = Number(endEndpoint?.x || 0);
  if (Math.abs(startX - endX) > 1e-6) {
    const leftSide = startX <= endX ? "start" : "end";
    return sideHint === "left" ? leftSide : leftSide === "start" ? "end" : "start";
  }
  return sideHint === "left" ? "start" : "end";
}

function collectEdgesAnchoredToEndpoint(parentEdgeId, endpointSide = "end") {
  const parentId = String(parentEdgeId || "");
  const side = endpointSide === "start" ? "start" : "end";
  const canonicalAnchor = `${parentId}:${side}`;
  if (!parentId) return [];
  const edges = getOrderedCommittedGraphEdges();
  return edges.filter((edge) => {
    const edgeId = String(edge?.id || "");
    if (!edgeId || edgeId === parentId) return false;
    const canonical = resolveAnchorForDirection(String(edge?.anchorEndpointId || ""));
    return canonical === canonicalAnchor;
  });
}

function parseCanonicalEndpointId(endpointId = "") {
  const match = String(endpointId || "").match(/^(.+):(start|end)$/);
  if (!match) return null;
  return {
    edgeId: String(match[1] || ""),
    side: match[2] === "start" ? "start" : "end",
  };
}

function areEndpointsNear(a, b, thresholdMm = 1) {
  if (!a || !b) return false;
  const ax = Number(a.x);
  const ay = Number(a.y);
  const bx = Number(b.x);
  const by = Number(b.y);
  if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) || !Number.isFinite(by)) {
    return false;
  }
  return Math.hypot(ax - bx, ay - by) <= Math.max(0.1, Number(thresholdMm || 1));
}

function getEndpointDistanceMm(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const ax = Number(a.x);
  const ay = Number(a.y);
  const bx = Number(b.x);
  const by = Number(b.y);
  if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) || !Number.isFinite(by)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.hypot(ax - bx, ay - by);
}

function findBayEndpointNeighborsByPlacement(targetEdge, endpointSide = "end", thresholdMm = 2) {
  if (!targetEdge || targetEdge.type !== "bay") {
    return {
      targetEndpoint: null,
      neighbors: [],
    };
  }
  const targetId = String(targetEdge.id || "");
  const targetEndpoint = buildBayEndpointFromPlacement(targetEdge, endpointSide);
  if (!targetEndpoint) {
    return {
      targetEndpoint: null,
      neighbors: [],
    };
  }
  const maxDistance = Math.max(0.1, Number(thresholdMm || 2));
  const bestByEdgeId = new Map();
  const edges = getOrderedCommittedGraphEdges();
  edges.forEach((edge) => {
    const neighborId = String(edge?.id || "");
    if (!neighborId || neighborId === targetId || edge.type !== "bay") return;
    ["start", "end"].forEach((side) => {
      const endpoint = buildBayEndpointFromPlacement(edge, side);
      if (!endpoint) return;
      const distanceMm = getEndpointDistanceMm(endpoint, targetEndpoint);
      if (!Number.isFinite(distanceMm) || distanceMm > maxDistance) return;
      const prev = bestByEdgeId.get(neighborId);
      if (!prev || distanceMm < prev.distanceMm) {
        bestByEdgeId.set(neighborId, {
          edge,
          side,
          endpoint,
          distanceMm,
        });
      }
    });
  });
  return {
    targetEndpoint,
    neighbors: Array.from(bestByEdgeId.values()).sort((a, b) => a.distanceMm - b.distanceMm),
  };
}

function collectUniqueBayEdgeIds(edgeIds = []) {
  const seen = new Set();
  return (Array.isArray(edgeIds) ? edgeIds : [])
    .map((edgeId) => String(edgeId || ""))
    .filter((edgeId) => {
      if (!edgeId || seen.has(edgeId)) return false;
      const edge = findShelfById(edgeId);
      if (!edge || edge.type !== "bay") return false;
      seen.add(edgeId);
      return true;
    });
}

function reanchorBayChildChain(parentEdgeId, childEdgeIds = []) {
  const parentId = String(parentEdgeId || "");
  if (!parentId) return [];
  const chainIds = collectUniqueBayEdgeIds(childEdgeIds).filter((edgeId) => edgeId !== parentId);
  let anchorParentId = parentId;
  chainIds.forEach((childId) => {
    const child = findShelfById(childId);
    if (!child || child.type !== "bay") return;
    child.anchorEndpointId = `${anchorParentId}:end`;
    child.attachAtStart = false;
    clearRootAnchorVector(child);
    child.placement = null;
    anchorParentId = childId;
  });
  for (let i = chainIds.length - 2; i >= 0; i -= 1) {
    moveEdgeBeforeInOrder(chainIds[i], chainIds[i + 1]);
  }
  return chainIds;
}

function addBayAdjacentToModuleEdge(edgeId, { direction = "right" } = {}) {
  const targetId = String(edgeId || "");
  normalizeDanglingAnchorIds();
  const targetEdge = targetId ? findShelfById(targetId) : null;
  if (!targetEdge || targetEdge.type !== "bay") {
    return {
      ok: false,
      message: "일반 모듈에서만 좌/우 추가가 가능합니다.",
      shelfId: "",
    };
  }

  const endpointSide = resolveBayHorizontalEndpointSide(targetEdge, direction);
  const canonicalTargetEndpointId = `${targetId}:${endpointSide}`;
  const sourceEndpoint = buildBayEndpointFromPlacement(targetEdge, endpointSide);
  if (!sourceEndpoint) {
    return {
      ok: false,
      message: "추가할 기준 위치를 찾지 못했습니다.",
      shelfId: "",
    };
  }

  const anchoredEdges = collectEdgesAnchoredToEndpoint(targetId, endpointSide);
  const anchoredBayChildIds = collectUniqueBayEdgeIds(
    anchoredEdges
      .filter((edge) => String(edge?.type || "") === "bay")
      .map((edge) => String(edge?.id || ""))
  );
  if (anchoredEdges.some((edge) => edge && edge.type !== "bay")) {
    return {
      ok: false,
      message: "코너가 연결된 방향은 좌/우 추가를 지원하지 않습니다.",
      shelfId: "",
    };
  }

  const targetAnchorCanonical = resolveAnchorForDirection(String(targetEdge.anchorEndpointId || ""));
  const targetAnchorInfo = parseCanonicalEndpointId(targetAnchorCanonical);
  let parentNeighbor = null;
  if (targetAnchorInfo) {
    const parentEdge = findShelfById(targetAnchorInfo.edgeId);
    if (parentEdge?.type === "bay") {
      const targetStartEndpoint = buildBayEndpointFromPlacement(targetEdge, "start");
      const targetEndEndpoint = buildBayEndpointFromPlacement(targetEdge, "end");
      const alternateSide = targetAnchorInfo.side === "start" ? "end" : "start";
      const candidateSides = [targetAnchorInfo.side, alternateSide];
      let bestParentCandidate = null;
      candidateSides.forEach((candidateSide) => {
        const parentEndpoint = buildBayEndpointFromPlacement(parentEdge, candidateSide);
        if (!parentEndpoint) return;
        let connectedTargetSide = "";
        if (targetStartEndpoint && areEndpointsNear(parentEndpoint, targetStartEndpoint, 2.5)) {
          connectedTargetSide = "start";
        } else if (targetEndEndpoint && areEndpointsNear(parentEndpoint, targetEndEndpoint, 2.5)) {
          connectedTargetSide = "end";
        }
        if (connectedTargetSide !== endpointSide) return;
        const distanceMm = getEndpointDistanceMm(parentEndpoint, sourceEndpoint);
        if (
          !bestParentCandidate ||
          distanceMm < bestParentCandidate.distanceMm ||
          (Math.abs(distanceMm - bestParentCandidate.distanceMm) < 1e-6 &&
            candidateSide === targetAnchorInfo.side)
        ) {
          bestParentCandidate = {
            side: candidateSide,
            endpoint: parentEndpoint,
            distanceMm,
          };
        }
      });
      if (!bestParentCandidate && typeof targetEdge.attachAtStart === "boolean") {
        const connectedTargetSide = targetEdge.attachAtStart ? "start" : "end";
        if (connectedTargetSide === endpointSide) {
          const fallbackParentEndpoint = buildBayEndpointFromPlacement(parentEdge, targetAnchorInfo.side);
          if (fallbackParentEndpoint) {
            bestParentCandidate = {
              side: targetAnchorInfo.side,
              endpoint: fallbackParentEndpoint,
              distanceMm: getEndpointDistanceMm(fallbackParentEndpoint, sourceEndpoint),
            };
          }
        }
      }
      if (bestParentCandidate) {
        const parentEndpointId = `${targetAnchorInfo.edgeId}:${bestParentCandidate.side}`;
        parentNeighbor = {
          edge: parentEdge,
          parentEndpointId,
          sourceEndpoint: {
            ...bestParentCandidate.endpoint,
            endpointId: parentEndpointId,
          },
        };
      }
    }
  }

  let betweenPlan = null;
  let betweenChainChildIds = [];
  if (anchoredBayChildIds.length) {
    const anchoredChildId = anchoredBayChildIds[0];
    betweenPlan = {
      parentEdgeId: targetId,
      childEdgeId: anchoredChildId,
      parentEndpointId: canonicalTargetEndpointId,
      sourceEndpoint: {
        ...sourceEndpoint,
        endpointId: canonicalTargetEndpointId,
      },
      insertId: `insert:${targetId}:${endpointSide}:${anchoredChildId}`,
    };
    betweenChainChildIds = anchoredBayChildIds.slice();
  } else if (parentNeighbor) {
    betweenPlan = {
      parentEdgeId: String(parentNeighbor.edge.id || ""),
      childEdgeId: targetId,
      parentEndpointId: parentNeighbor.parentEndpointId,
      sourceEndpoint: parentNeighbor.sourceEndpoint,
      insertId: `insert:${String(parentNeighbor.edge.id || "")}:${targetId}`,
    };
    betweenChainChildIds = [targetId];
  }

  if (!betweenPlan) {
    const geometryNeighborsResult = findBayEndpointNeighborsByPlacement(targetEdge, endpointSide, 2.5);
    const geometryNeighbors = Array.isArray(geometryNeighborsResult.neighbors)
      ? geometryNeighborsResult.neighbors
      : [];
    const geometryBayNeighbors = geometryNeighbors.filter(
      (info) => info?.edge && info.edge.type === "bay" && String(info.edge.id || "") !== targetId
    );
    const geometryNeighborIds = collectUniqueBayEdgeIds(
      geometryBayNeighbors.map((info) => String(info?.edge?.id || ""))
    );
    if (geometryNeighborIds.length) {
      const geometryMetaById = new Map(
        geometryNeighborIds.map((neighborId) => {
          const neighborEdge = findShelfById(neighborId);
          const neighborAnchorCanonical = resolveAnchorForDirection(
            String(neighborEdge?.anchorEndpointId || "")
          );
          const neighborAnchorInfo = parseCanonicalEndpointId(neighborAnchorCanonical);
          return [
            neighborId,
            {
              neighborId,
              neighborEdge,
              neighborAnchorCanonical,
              neighborAnchorInfo,
            },
          ];
        })
      );

      const endpointAnchoredChildIds = geometryNeighborIds.filter((neighborId) => {
        const meta = geometryMetaById.get(neighborId);
        return Boolean(meta && meta.neighborAnchorCanonical === canonicalTargetEndpointId);
      });
      if (endpointAnchoredChildIds.length) {
        const firstChildId = endpointAnchoredChildIds[0];
        betweenPlan = {
          parentEdgeId: targetId,
          childEdgeId: firstChildId,
          parentEndpointId: canonicalTargetEndpointId,
          sourceEndpoint: {
            ...sourceEndpoint,
            endpointId: canonicalTargetEndpointId,
          },
          insertId: `insert:${targetId}:${endpointSide}:${firstChildId}`,
        };
        betweenChainChildIds = endpointAnchoredChildIds.slice();
      } else {
        const targetParentId = String(targetAnchorInfo?.edgeId || "");
        const targetParentMeta = targetParentId ? geometryMetaById.get(targetParentId) : null;
        const targetParentAnchorInfo = parseCanonicalEndpointId(targetAnchorCanonical);
        const canInsertBetweenParentAndTarget =
          Boolean(targetParentMeta?.neighborEdge) &&
          Boolean(targetParentAnchorInfo?.edgeId) &&
          String(targetParentAnchorInfo.edgeId || "") === targetParentId;
        if (canInsertBetweenParentAndTarget) {
          const parentEndpointSide = targetParentAnchorInfo.side === "start" ? "start" : "end";
          const parentSourceEndpoint = buildBayEndpointFromPlacement(
            targetParentMeta.neighborEdge,
            parentEndpointSide
          );
          if (parentSourceEndpoint) {
            const siblingChildIds = geometryNeighborIds.filter((neighborId) => {
              if (neighborId === targetParentId || neighborId === targetId) return false;
              const meta = geometryMetaById.get(neighborId);
              return Boolean(meta && meta.neighborAnchorCanonical === targetAnchorCanonical);
            });
            betweenPlan = {
              parentEdgeId: targetParentId,
              childEdgeId: targetId,
              parentEndpointId: targetAnchorCanonical,
              sourceEndpoint: {
                ...parentSourceEndpoint,
                endpointId: targetAnchorCanonical,
              },
              insertId: `insert:${targetParentId}:${targetId}`,
            };
            betweenChainChildIds = [targetId, ...siblingChildIds];
          }
        }
      }

      if (!betweenPlan) {
        const fallbackChildId = geometryNeighborIds[0];
        betweenPlan = {
          parentEdgeId: targetId,
          childEdgeId: fallbackChildId,
          parentEndpointId: canonicalTargetEndpointId,
          sourceEndpoint: {
            ...sourceEndpoint,
            endpointId: canonicalTargetEndpointId,
          },
          insertId: `insert:${targetId}:${endpointSide}:${fallbackChildId}`,
        };
        betweenChainChildIds = geometryNeighborIds.slice();
      }
    }
  }

  if (betweenPlan) {
    const insertedShelfId = insertBayBetweenModulesByTarget({
      id: betweenPlan.insertId,
      parentEdgeId: betweenPlan.parentEdgeId,
      childEdgeId: betweenPlan.childEdgeId,
      parentEndpointId: betweenPlan.parentEndpointId,
      sourceEndpoint: betweenPlan.sourceEndpoint,
      pushHistory: false,
      initialCount: 1,
      pendingAdd: true,
    });
    if (!insertedShelfId) {
      return {
        ok: false,
        message: "모듈 사이 추가에 실패했습니다.",
        shelfId: "",
      };
    }
    if (betweenChainChildIds.length > 1) {
      reanchorBayChildChain(insertedShelfId, betweenChainChildIds);
      normalizeDanglingAnchorIds();
      renderBayInputs();
    }
    return {
      ok: true,
      message: "",
      shelfId: insertedShelfId,
    };
  }

  const insertedShelfId = addShelfFromEndpoint(
    {
      ...sourceEndpoint,
      endpointId: canonicalTargetEndpointId,
    },
    {
      endpointId: canonicalTargetEndpointId,
      attachAtStart: Boolean(sourceEndpoint.attachAtStart),
    },
    { pushHistory: false, skipRender: true, initialCount: 1, pendingAdd: true }
  );
  if (!insertedShelfId) {
    return {
      ok: false,
      message: "모듈 추가에 실패했습니다.",
      shelfId: "",
    };
  }
  inlineInsertPendingFirstSaveEdgeId = insertedShelfId;
  normalizeDanglingAnchorIds();
  renderBayInputs();
  return {
    ok: true,
    message: "",
    shelfId: insertedShelfId,
  };
}

function openPreviewModuleActionModal(edgeId, edgeType = "bay", anchorEl = null) {
  const targetId = String(edgeId || "");
  const edge = targetId ? findShelfById(targetId) : null;
  if (!edge) return;
  const normalizedEdgeType =
    normalizePreviewEdgeType(edgeType) === "corner" || edge.type === "corner"
      ? "corner"
      : "bay";
  const modalElements = getPreviewModuleActionModalElements();
  if (!modalElements.modal) {
    if (normalizedEdgeType === "corner") openCornerOptionModal(targetId);
    else openBayOptionModal(targetId, { initialTab: "preset" });
    return;
  }
  setPreviewModuleActionFlowTarget(
    previewModuleActionFlowState,
    targetId,
    normalizedEdgeType,
    anchorEl instanceof Element ? anchorEl : null
  );
  const canAddSide =
    normalizedEdgeType === "bay" && isPreviewBuilderReady(readCurrentInputs());
  if (modalElements.titleEl) modalElements.titleEl.textContent = "모듈 작업";
  if (modalElements.descEl) {
    modalElements.descEl.textContent =
      normalizedEdgeType === "bay"
        ? "선택한 모듈을 수정하거나 좌/우로 새 모듈을 추가하세요."
        : "코너 모듈은 모듈수정만 가능합니다.";
  }
  if (modalElements.editBtn) modalElements.editBtn.disabled = false;
  if (modalElements.addLeftBtn) modalElements.addLeftBtn.disabled = !canAddSide;
  if (modalElements.addRightBtn) modalElements.addRightBtn.disabled = !canAddSide;
  setPreviewModuleActionModalError("");
  openModal("#previewModuleActionModal", { focusTarget: "#previewModuleActionModalTitle" });
}

function handlePreviewModuleActionEdit() {
  const targetEdge = getPreviewModuleActionTargetEdge();
  if (!targetEdge) return;
  const preferredTab = targetEdge.composeTab === "custom" ? "custom" : "preset";
  const seedDraft = buildPresetModuleOptionDraftSeedFromEdge(targetEdge.id, {
    preferredTab,
  });
  if (seedDraft) {
    patchPresetModuleOptionFlowState(presetModuleOptionFlowState, {
      draft: seedDraft,
    });
  }
  const preserveDraft = Boolean(seedDraft);
  closePreviewModuleActionModal();
  if (targetEdge.type === "corner") {
    openCornerOptionModal(targetEdge.id, { initialTab: preferredTab, preserveDraft });
    return;
  }
  openBayOptionModal(targetEdge.id, { initialTab: preferredTab, preserveDraft });
}

function handlePreviewModuleActionAddSide(direction = "right") {
  const targetEdge = getPreviewModuleActionTargetEdge();
  if (!targetEdge) return;
  if (targetEdge.type !== "bay") {
    setPreviewModuleActionModalError("코너 모듈은 좌/우 추가를 지원하지 않습니다.", { isError: true });
    return;
  }
  const result = addBayAdjacentToModuleEdge(targetEdge.id, { direction });
  if (!result.ok || !result.shelfId) {
    setPreviewModuleActionModalError(result.message || "모듈 추가에 실패했습니다.", {
      isError: true,
    });
    return;
  }
  closePreviewModuleActionModal();
  openBayOptionModal(result.shelfId, { initialTab: "preset" });
}

function handlePresetModuleOptionModalRemove() {
  const modalState = presetModuleOptionFlowState.modalState;
  if (!modalState) return;
  const modalEdgeId = String(modalState?.edgeId || "");
  const modalEdge = modalEdgeId ? findShelfById(modalEdgeId) : null;
  const isAddMode = normalizePresetModuleOptionMode(modalState?.mode) === "add";
  const isPendingComposeTarget = Boolean(modalEdge && isPendingEdge(modalEdge));
  if (isAddMode || isPendingComposeTarget || !modalEdge?.id) {
    closePresetModuleOptionModal({ returnFocus: false, clearState: true });
    return;
  }
  const edgeType = modalEdge.type === "corner" ? "corner" : "bay";
  closePresetModuleOptionModal({ returnFocus: false, clearState: true });
  if (edgeType === "corner") removeCornerById(modalEdgeId);
  else removeBayById(modalEdgeId);
}

function getPreviewOrderedEdges(edges = []) {
  const source = (Array.isArray(edges) ? edges : [])
    .filter((edge) => edge && edge.id)
    .map((edge) => edge);
  if (source.length <= 1) return source;
  const ids = new Set(source.map((edge) => String(edge.id)));
  const remaining = new Set(ids);
  const placed = new Set();
  const ordered = [];

  let progressed = true;
  while (remaining.size && progressed) {
    progressed = false;
    source.forEach((edge) => {
      const id = String(edge.id || "");
      if (!remaining.has(id)) return;
      const anchorId = String(edge.anchorEndpointId || "");
      const canonicalAnchorId = anchorId
        ? resolveAnchorForDirection(anchorId, null, { includePending: true })
        : "";
      const normalizedAnchorId = String(canonicalAnchorId || anchorId || "");
      if (!normalizedAnchorId || normalizedAnchorId === "root-endpoint") {
        ordered.push(edge);
        remaining.delete(id);
        placed.add(id);
        progressed = true;
        return;
      }
      const match = normalizedAnchorId.match(/^(.+):(start|end)$/);
      if (!match) {
        ordered.push(edge);
        remaining.delete(id);
        placed.add(id);
        progressed = true;
        return;
      }
      const parentId = String(match[1] || "");
      if (parentId === id || placed.has(parentId) || !ids.has(parentId)) {
        ordered.push(edge);
        remaining.delete(id);
        placed.add(id);
        progressed = true;
      }
    });
  }

  if (remaining.size) {
    source.forEach((edge) => {
      const id = String(edge.id || "");
      if (!remaining.has(id)) return;
      ordered.push(edge);
      remaining.delete(id);
    });
  }
  return ordered;
}

function normalizeDirection(dx, dy) {
  const nx = Number(dx || 0);
  const ny = Number(dy || 0);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return { dx: 1, dy: 0 };
  if (Math.abs(nx) >= Math.abs(ny)) {
    if (Math.abs(nx) < 1e-6) return { dx: 1, dy: 0 };
    return { dx: nx >= 0 ? 1 : -1, dy: 0 };
  }
  if (Math.abs(ny) < 1e-6) return { dx: 1, dy: 0 };
  return { dx: 0, dy: ny >= 0 ? 1 : -1 };
}

function directionToSideIndex(dx, dy) {
  const dir = normalizeDirection(dx, dy);
  if (Math.abs(dir.dx) >= Math.abs(dir.dy)) {
    return dir.dx >= 0 ? 0 : 2;
  }
  return dir.dy >= 0 ? 1 : 3;
}

function initShelfStateForShape(shape) {
  const normalizedShape = normalizeSystemShape(shape);
  syncLayoutConfigShape(normalizedShape);
  state.graph = createGraphForShape(normalizedShape);
}

function readCurrentInputs() {
  const shape = getSelectedShape();
  const spaces = readSpaceConfigs(shape);
  const minValues = spaces.map((space) => Number(space.min || 0)).filter((v) => v > 0);
  const maxValues = spaces.map((space) => Number(space.max || 0)).filter((v) => v > 0);
  const columnMinLength = minValues.length ? Math.min(...minValues) : 0;
  const columnMaxLength = maxValues.length ? Math.max(...maxValues) : 0;
  const shelf = {
    materialId: materialPickers.shelf.selectedMaterialId,
    thickness: SHELF_THICKNESS_MM,
    length: SHELF_LENGTH_MM,
  };
  const column = {
    materialId: materialPickers.column.selectedMaterialId,
    thickness: COLUMN_THICKNESS_MM,
    width: COLUMN_WIDTH_MM,
    length: columnMaxLength,
    minLength: columnMinLength,
    maxLength: columnMaxLength,
    customProcessing: false,
    spaceMins: spaces.map((space) => Number(space.min || 0)),
    spaceMaxs: spaces.map((space) => Number(space.max || 0)),
    spaceExtraHeights: spaces.map((space) => [...(space.extraHeights || [])]),
  };
  const input = { shelf, column, shape, spaces };
  syncLayoutConfigRuntimeFields(input);
  return input;
}

function readSpaceConfigs(shape) {
  const normalizedShape = normalizeSystemShape(shape);
  const count = Math.max(
    1,
    Math.min(getSectionCountForShape(normalizedShape), getRenderedSpaceInputCount())
  );
  const spaces = [];
  for (let i = 0; i < count; i += 1) {
    const min = Number($(`#spaceMin-${i}`)?.value || 0);
    const max = Number($(`#spaceMax-${i}`)?.value || 0);
    const extraHeights = Array.from(
      document.querySelectorAll(`[data-space-extra-height="${i}"]`)
    )
      .map((input) => Number(input.value || 0))
      .filter((value) => value > 0);
    spaces.push({ min, max, extraHeights });
  }
  return spaces;
}

function getRequiredSectionCount() {
  return getRenderedSpaceInputCount();
}

function setErrorMessage(errorEl, message) {
  if (!errorEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.classList.add("error");
  } else {
    errorEl.textContent = "";
    errorEl.classList.remove("error");
  }
}

function normalizeShelfAddonQuantities(raw) {
  if (Array.isArray(raw)) {
    return raw.reduce((acc, addonId) => {
      const key = String(addonId || "");
      if (!key) return acc;
      acc[key] = Number(acc[key] || 0) + 1;
      return acc;
    }, {});
  }
  if (!raw || typeof raw !== "object") return {};
  return Object.entries(raw).reduce((acc, [addonId, qty]) => {
    const key = String(addonId || "");
    const value = Number(qty || 0);
    if (!key || !Number.isFinite(value) || value <= 0) return acc;
    acc[key] = Math.floor(value);
    return acc;
  }, {});
}

function getShelfAddonQuantities(id) {
  const key = String(id || "");
  const normalized = normalizeShelfAddonQuantities(state.shelfAddons[key]);
  state.shelfAddons[key] = normalized;
  return normalized;
}

function getShelfAddonQuantity(id, addonId) {
  const quantities = getShelfAddonQuantities(id);
  return Number(quantities[String(addonId || "")] || 0);
}

function setShelfAddonQuantity(id, addonId, qty) {
  const key = String(id || "");
  const addonKey = String(addonId || "");
  if (!key || !addonKey) return;
  const quantities = { ...getShelfAddonQuantities(key) };
  const nextQty = Math.max(0, Math.floor(Number(qty || 0)));
  if (nextQty > 0) {
    quantities[addonKey] = nextQty;
  } else {
    delete quantities[addonKey];
  }
  state.shelfAddons[key] = quantities;
}

function setShelfAddonSelected(id, addonId, selected) {
  const currentQty = getShelfAddonQuantity(id, addonId);
  if (selected) {
    setShelfAddonQuantity(id, addonId, Math.max(1, currentQty));
    return;
  }
  setShelfAddonQuantity(id, addonId, 0);
}

function getSelectedFurnitureAddonId(id) {
  const quantities = getShelfAddonQuantities(id);
  const match = Object.entries(quantities).find(([addonId, qty]) => {
    if (String(addonId || "") === ADDON_CLOTHES_ROD_ID) return false;
    return Math.max(0, Math.floor(Number(qty || 0))) > 0;
  });
  return match ? String(match[0] || "") : "";
}

function getEdgeModuleTypeById(edgeId) {
  const edge = edgeId ? findShelfById(edgeId) : null;
  if (!edge) return "normal";
  return edge.type === "corner" ? "corner" : "normal";
}

function getNormalModuleShelfTierByWidth(widthMm) {
  const width = Math.round(Number(widthMm || 0));
  if (!Number.isFinite(width) || width <= 0) return null;
  const tiers = Array.isArray(SYSTEM_SHELF_TIER_PRICING?.normal?.tiers)
    ? SYSTEM_SHELF_TIER_PRICING.normal.tiers
    : [];
  return tiers.find((tier) => {
    if (String(tier?.matchMode || "range") !== "range") return false;
    const minExclusiveMm = Number(tier?.minWidthExclusiveMm);
    const maxWidthMm = Number(tier?.maxWidthMm);
    if (Number.isFinite(minExclusiveMm) && !(width > minExclusiveMm)) return false;
    if (Number.isFinite(maxWidthMm) && maxWidthMm > 0 && !(width <= maxWidthMm)) return false;
    return true;
  }) || null;
}

function resolveNormalModuleShelfUnitPriceByWidth(widthMm) {
  const tier = getNormalModuleShelfTierByWidth(widthMm);
  const shelfMaterial = SYSTEM_SHELF_MATERIALS[materialPickers?.shelf?.selectedMaterialId];
  const unitPrice = resolveTierUnitPrice(tier, shelfMaterial);
  return {
    tier,
    unitPrice: unitPrice > 0 ? unitPrice : 0,
    hasMaterial: Boolean(shelfMaterial),
    isConsult: !tier || Boolean(tier?.isCustomPrice) || unitPrice <= 0,
  };
}

function resolveFurnitureSelectionPolicyForNormalWidth(widthMm) {
  const normalizedWidth = Math.round(Number(widthMm || 0));
  if (!Number.isFinite(normalizedWidth) || normalizedWidth <= 0) {
    return {
      widthMm: 0,
      canSelect: false,
      isStandardWidth: false,
      isConsultPriceWidth: false,
      blockedReason: "모듈 정보를 확인해주세요.",
    };
  }
  const isStandardWidth = FURNITURE_ALLOWED_NORMAL_WIDTHS.includes(normalizedWidth);
  const withinSelectableRange =
    normalizedWidth >= FURNITURE_SELECTABLE_RANGE_MIN_MM &&
    normalizedWidth <= FURNITURE_SELECTABLE_RANGE_MAX_MM;
  const canSelect =
    withinSelectableRange && normalizedWidth > FURNITURE_DISABLED_AT_OR_BELOW_MM;
  const isConsultPriceWidth = canSelect && normalizedWidth > FURNITURE_CONSULT_PRICE_GT_MM;
  const blockedReason = canSelect
    ? ""
    : `가구는 일반모듈 폭 ${FURNITURE_SELECTABLE_RANGE_MIN_MM}~${FURNITURE_SELECTABLE_RANGE_MAX_MM}mm에서만 선택할 수 있습니다.`;
  return {
    widthMm: normalizedWidth,
    canSelect,
    isStandardWidth,
    isConsultPriceWidth,
    blockedReason,
    isDisabledByLowerBound: normalizedWidth <= FURNITURE_DISABLED_AT_OR_BELOW_MM,
  };
}

function resolveFurnitureSelectionPolicyForEdge(edgeOrId, { modalReturnTo = "" } = {}) {
  const edge = getEdgeByIdOrInstance(edgeOrId);
  if (!edge) {
    return {
      moduleType: "normal",
      widthMm: 0,
      canSelect: false,
      isStandardWidth: false,
      isConsultPriceWidth: false,
      blockedReason: "모듈 정보를 확인해주세요.",
    };
  }
  if (edge.type === "corner") {
    return {
      moduleType: "corner",
      widthMm: Math.round(Number(edge.width || 0)),
      canSelect: false,
      isStandardWidth: false,
      isConsultPriceWidth: false,
      blockedReason: "코너 모듈에는 가구를 적용할 수 없습니다.",
    };
  }
  const widthMm = getFurnitureSelectionWidthMmForEdge(edge, { modalReturnTo });
  const policy = resolveFurnitureSelectionPolicyForNormalWidth(widthMm);
  return {
    ...policy,
    moduleType: "normal",
  };
}

function resolveFurnitureAddonUnitPriceByWidth(addonItem, _widthMm) {
  const addon = addonItem && typeof addonItem === "object" ? addonItem : null;
  if (!addon) return 0;
  const basePrice = Number(addon?.price || 0);
  if (Number.isFinite(basePrice) && basePrice > 0) return Math.round(basePrice);
  return 0;
}

function resolveFurnitureAddonDisplayPriceInfo(addonItem, { widthPolicy = null, widthMm = 0 } = {}) {
  const policy =
    widthPolicy && typeof widthPolicy === "object"
      ? widthPolicy
      : resolveFurnitureSelectionPolicyForNormalWidth(widthMm);
  if (!policy.canSelect) {
    return {
      isConsult: true,
      unitPrice: 0,
      label: "선택 불가",
    };
  }
  if (policy.isConsultPriceWidth) {
    return {
      isConsult: true,
      unitPrice: 0,
      label: "상담 안내",
    };
  }
  const unitPrice = resolveFurnitureAddonUnitPriceByWidth(addonItem, policy.widthMm);
  if (unitPrice <= 0) {
    return {
      isConsult: true,
      unitPrice: 0,
      label: "상담 안내",
    };
  }
  return {
    isConsult: false,
    unitPrice,
    label: formatWon(unitPrice),
  };
}

function resolvePresetModuleFilterWidthMm(item, moduleType, selectedFilterKey = "") {
  const normalizedType = moduleType === "corner" ? "corner" : "normal";
  const key = String(selectedFilterKey || "");
  if (normalizedType === "corner") {
    if (key.includes("x")) {
      const [rawPrimary = "0", rawSecondary = "0"] = key.toLowerCase().split("x");
      const primaryMm = Math.round(Number(rawPrimary || 0));
      const secondaryMm = Math.round(Number(rawSecondary || 0));
      return Math.max(primaryMm, secondaryMm, 0);
    }
    return 800;
  }
  const keyWidth = Math.round(Number(key || 0));
  if (Number.isFinite(keyWidth) && keyWidth > 0) return keyWidth;
  const fallbackWidth = Math.round(Number(item?.width || 0));
  return fallbackWidth > 0 ? fallbackWidth : 0;
}

function resolvePresetModulePriceInfo(item, { moduleType = "normal", selectedFilterKey = "" } = {}) {
  const normalizedType = moduleType === "corner" ? "corner" : "normal";
  const shelfCount = Math.max(1, Math.floor(Number(item?.count || 1)));
  const rodCount = Math.max(0, Math.floor(Number(item?.rodCount || 0)));
  const shelfWidthMm = resolvePresetModuleFilterWidthMm(item, normalizedType, selectedFilterKey);
  const shelfPricing = resolveNormalModuleShelfUnitPriceByWidth(shelfWidthMm);
  if (normalizedType === "corner") {
    const cornerTier = Array.isArray(SYSTEM_SHELF_TIER_PRICING?.corner?.tiers)
      ? SYSTEM_SHELF_TIER_PRICING.corner.tiers.find((tier) => !Boolean(tier?.isCustomPrice))
      : null;
    const shelfMaterial = SYSTEM_SHELF_MATERIALS[materialPickers?.shelf?.selectedMaterialId];
    const cornerUnitPrice = resolveTierUnitPrice(cornerTier, shelfMaterial);
    const rodUnitPrice = resolveFurnitureAddonUnitPriceByWidth(getAddonItemById(ADDON_CLOTHES_ROD_ID), shelfWidthMm);
    if (!cornerTier || cornerUnitPrice <= 0) {
      return { isConsult: true, total: 0, label: "상담 안내" };
    }
    const total = Math.round(cornerUnitPrice * shelfCount + rodUnitPrice * rodCount);
    return total > 0
      ? { isConsult: false, total, label: formatWon(total) }
      : { isConsult: true, total: 0, label: "상담 안내" };
  }

  if (shelfPricing.isConsult || shelfPricing.unitPrice <= 0) {
    return { isConsult: true, total: 0, label: "상담 안내" };
  }
  const rodUnitPrice = resolveFurnitureAddonUnitPriceByWidth(getAddonItemById(ADDON_CLOTHES_ROD_ID), shelfWidthMm);
  const furnitureAddonIds = getPresetFurnitureAddonIds(item);
  let furnitureTotal = 0;
  for (const addonId of furnitureAddonIds) {
    const addon = getAddonItemById(addonId);
    const addonPriceInfo = resolveFurnitureAddonDisplayPriceInfo(addon, {
      widthPolicy: resolveFurnitureSelectionPolicyForNormalWidth(shelfWidthMm),
      widthMm: shelfWidthMm,
    });
    if (addonPriceInfo.isConsult) {
      return { isConsult: true, total: 0, label: "상담 안내" };
    }
    furnitureTotal += Number(addonPriceInfo.unitPrice || 0);
  }
  const total = Math.round(shelfPricing.unitPrice * shelfCount + rodUnitPrice * rodCount + furnitureTotal);
  return total > 0
    ? { isConsult: false, total, label: formatWon(total) }
    : { isConsult: true, total: 0, label: "상담 안내" };
}

function isFurnitureSelectableForNormalModuleWidth(widthMm) {
  const policy = resolveFurnitureSelectionPolicyForNormalWidth(widthMm);
  return policy.canSelect;
}

function getEdgeByIdOrInstance(edgeOrId) {
  if (!edgeOrId) return null;
  if (typeof edgeOrId === "string") return findShelfById(edgeOrId);
  return edgeOrId;
}

function getFurnitureSelectionWidthMmForEdge(edgeOrId, { modalReturnTo = "" } = {}) {
  const edge = getEdgeByIdOrInstance(edgeOrId);
  if (!edge) return 0;
  const edgeWidthMm = Math.round(Number(edge.width || 0));
  if (
    modalReturnTo === "bay" &&
    String(activeBayOptionId || "") === String(edge.id || "")
  ) {
    return getBayOptionModalWidthMm(edgeWidthMm, { edgeId: String(edge.id || "") });
  }
  return edgeWidthMm;
}

function canSelectFurnitureForEdge(edgeOrId, { modalReturnTo = "" } = {}) {
  const policy = resolveFurnitureSelectionPolicyForEdge(edgeOrId, { modalReturnTo });
  return policy.canSelect;
}

function getFurnitureAddonBlockedReason(edgeOrId, { modalReturnTo = "" } = {}) {
  const policy = resolveFurnitureSelectionPolicyForEdge(edgeOrId, { modalReturnTo });
  return policy.canSelect ? "" : String(policy.blockedReason || "가구 선택이 불가능합니다.");
}

function hasFurnitureAddonSelection(addons = []) {
  return (Array.isArray(addons) ? addons : []).some(
    (addonId) => String(addonId || "") !== ADDON_CLOTHES_ROD_ID
  );
}

function shouldTreatBayFurniturePriceAsConsult(bay = {}) {
  if (Boolean(bay?.isCorner)) return false;
  if (!hasFurnitureAddonSelection(bay?.addons)) return false;
  const policy = resolveFurnitureSelectionPolicyForNormalWidth(Number(bay?.width || 0));
  return !policy.canSelect || policy.isConsultPriceWidth;
}

function clearFurnitureAddonsForEdge(edgeId) {
  const key = String(edgeId || "");
  if (!key) return;
  const quantities = { ...getShelfAddonQuantities(key) };
  Object.keys(quantities).forEach((addonId) => {
    if (String(addonId || "") !== ADDON_CLOTHES_ROD_ID) {
      delete quantities[addonId];
    }
  });
  state.shelfAddons[key] = quantities;
}

function enforceFurnitureAddonPolicyForEdge(edgeOrId, { modalReturnTo = "" } = {}) {
  const edge = getEdgeByIdOrInstance(edgeOrId);
  if (!edge?.id) return false;
  if (canSelectFurnitureForEdge(edge, { modalReturnTo })) return false;
  clearFurnitureAddonsForEdge(edge.id);
  return true;
}

function applyPresetAddonsToEdge(edgeId, preset) {
  if (!edgeId) return;
  const rodCount = Math.max(0, Math.floor(Number(preset?.rodCount || 0)));
  const furnitureAddonIds = getPresetFurnitureAddonIds(preset);
  const targetFurnitureId = canSelectFurnitureForEdge(edgeId)
    ? String(furnitureAddonIds[0] || "")
    : "";
  const quantities = { ...getShelfAddonQuantities(edgeId) };
  Object.keys(quantities).forEach((addonId) => {
    if (String(addonId || "") !== ADDON_CLOTHES_ROD_ID) {
      delete quantities[addonId];
    }
  });
  if (rodCount > 0) {
    quantities[ADDON_CLOTHES_ROD_ID] = rodCount;
  } else {
    delete quantities[ADDON_CLOTHES_ROD_ID];
  }
  if (targetFurnitureId) {
    quantities[targetFurnitureId] = 1;
  }
  state.shelfAddons[String(edgeId)] = quantities;
  enforceSingleSelectableAddon(edgeId);
}

function getSelectableSystemAddonItems() {
  const categoryOrderMap = new Map(
    (SYSTEM_ADDON_OPTION_CONFIG.categories || []).map((cat, index) => [
      String(cat?.key || ""),
      Number.isFinite(Number(cat?.order)) ? Number(cat.order) : index * 10,
    ])
  );
  const currentModuleType = getEdgeModuleTypeById(activeShelfAddonId);
  if (
    activeShelfAddonId &&
    !canSelectFurnitureForEdge(activeShelfAddonId, { modalReturnTo: shelfAddonModalReturnTo })
  ) {
    return [];
  }
  return SYSTEM_ADDON_ITEMS.filter((item) => {
    if (item.selectableInModuleAddonModal === false) return false;
    const applicableModuleTypes = Array.isArray(item?.applicableModuleTypes)
      ? item.applicableModuleTypes.map((type) => String(type || ""))
      : [];
    if (!applicableModuleTypes.length) return true;
    return applicableModuleTypes.includes(currentModuleType);
  }).sort((a, b) => {
    const aCategoryOrder = categoryOrderMap.get(String(a?.categoryKey || "")) ?? 999;
    const bCategoryOrder = categoryOrderMap.get(String(b?.categoryKey || "")) ?? 999;
    if (aCategoryOrder !== bCategoryOrder) return aCategoryOrder - bCategoryOrder;
    const aOrder = Number(a?.sortOrder || 0);
    const bOrder = Number(b?.sortOrder || 0);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a?.name || "").localeCompare(String(b?.name || ""), "ko");
  });
}

function getSystemAddonModalCategoryFilterOptions(selectableItems = getSelectableSystemAddonItems()) {
  const usedCategoryKeys = new Set(
    (Array.isArray(selectableItems) ? selectableItems : [])
      .map((item) => String(item?.categoryKey || ""))
      .filter(Boolean)
  );
  const categories = (SYSTEM_ADDON_OPTION_CONFIG.categories || [])
    .filter((category) => usedCategoryKeys.has(String(category?.key || "")))
    .sort((a, b) => {
      const aOrder = Number(a?.order || 0);
      const bOrder = Number(b?.order || 0);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a?.label || "").localeCompare(String(b?.label || ""), "ko");
    })
    .map((category) => ({
      key: String(category?.key || ""),
      label: String(category?.label || category?.key || ""),
    }));
  return [{ key: "all", label: "전체" }, ...categories];
}

function renderSystemAddonModalCategoryFilterTabs(selectableItems = getSelectableSystemAddonItems()) {
  const container = $("#systemAddonCategoryFilterTabs");
  if (!container) return;
  const options = getSystemAddonModalCategoryFilterOptions(selectableItems);
  const currentKey = String(systemAddonModalCategoryFilterKey || "all");
  if (!options.some((option) => option.key === currentKey)) {
    systemAddonModalCategoryFilterKey = "all";
  }
  container.innerHTML = options
    .map((option) => {
      const key = String(option.key || "");
      const isActive = key === String(systemAddonModalCategoryFilterKey || "all");
      return `
        <button
          type="button"
          class="material-tab${isActive ? " active" : ""}"
          data-system-addon-category="${escapeHtml(key)}"
          aria-pressed="${isActive ? "true" : "false"}"
        >
          ${escapeHtml(option.label)}
        </button>
      `;
    })
    .join("");
}

function getFilteredSystemAddonModalItems(allItems = getSelectableSystemAddonItems()) {
  const categoryKey = String(systemAddonModalCategoryFilterKey || "all");
  if (!categoryKey || categoryKey === "all") return [...allItems];
  return (Array.isArray(allItems) ? allItems : []).filter(
    (item) => String(item?.categoryKey || "") === categoryKey
  );
}

function enforceSingleSelectableAddon(id) {
  const key = String(id || "");
  if (!key) return {};
  const quantities = { ...getShelfAddonQuantities(key) };
  let selectedAddonId = "";
  Object.entries(quantities).forEach(([addonId, qty]) => {
    const isSelectable = addonId !== ADDON_CLOTHES_ROD_ID;
    if (!isSelectable) return;
    const count = Math.max(0, Math.floor(Number(qty || 0)));
    if (count < 1) {
      delete quantities[addonId];
      return;
    }
    if (!selectedAddonId) {
      selectedAddonId = addonId;
      quantities[addonId] = 1;
      return;
    }
    delete quantities[addonId];
  });
  state.shelfAddons[key] = quantities;
  return quantities;
}

function sortAddonEntriesWithRodFirst(entries = []) {
  return [...entries].sort((a, b) => {
    const aId = String(a?.[0] || "");
    const bId = String(b?.[0] || "");
    const aIsRod = aId === ADDON_CLOTHES_ROD_ID;
    const bIsRod = bId === ADDON_CLOTHES_ROD_ID;
    if (aIsRod !== bIsRod) return aIsRod ? -1 : 1;
    return aId.localeCompare(bId, "ko");
  });
}

function getShelfAddonIds(id) {
  const quantities = getShelfAddonQuantities(id);
  const ids = [];
  sortAddonEntriesWithRodFirst(Object.entries(quantities)).forEach(([addonId, qty]) => {
    for (let i = 0; i < Number(qty || 0); i += 1) ids.push(addonId);
  });
  return ids;
}

function getShelfAddonSummary(addons = []) {
  if (!Array.isArray(addons) || !addons.length) return "-";
  const counts = addons.reduce((acc, addonId) => {
    const key = String(addonId || "");
    if (!key) return acc;
    acc[key] = Number(acc[key] || 0) + 1;
    return acc;
  }, {});
  return sortAddonEntriesWithRodFirst(Object.entries(counts))
    .map(([addonId, qty]) => {
      const addon = SYSTEM_ADDON_ITEMS.find((item) => item.id === addonId);
      if (!addon) return "";
      return `${addon.name}${qty > 1 ? ` x${qty}` : ""}`;
    })
    .filter(Boolean)
    .join(", ");
}

function buildAddonBreakdownFromIds(addonIds = [], emptyText = "없음") {
  const normalizedIds = Array.isArray(addonIds) ? addonIds : [];
  const rodCount = normalizedIds.reduce(
    (count, addonId) => count + (String(addonId || "") === ADDON_CLOTHES_ROD_ID ? 1 : 0),
    0
  );
  return {
    componentSummary: buildRodAddonSummary(rodCount, emptyText),
    furnitureSummary: buildFurnitureAddonSummary(normalizedIds, emptyText),
  };
}

function formatAddonCompactBreakdown(addonIds = [], emptyText = "없음") {
  const { componentSummary, furnitureSummary } = buildAddonBreakdownFromIds(addonIds, emptyText);
  return `구성품 ${componentSummary} / 가구 ${furnitureSummary}`;
}

function getComposeTabLabelInfo(edge = null) {
  const tab = String(edge?.composeTab || "");
  if (tab === "preset") {
    return { key: "preset", label: "모듈선택" };
  }
  if (tab === "custom") {
    return { key: "custom", label: "맞춤구성" };
  }
  return { key: "unknown", label: "미지정" };
}

function createModuleLabelElement(
  labelInfo = {},
  {
    level = 2, // 2: badge+shelf+addons, 1: index chip only, 0: index chip only
    index = 1,
  } = {}
) {
  const normalizedLevel = Math.max(0, Math.min(2, Math.floor(Number(level) || 0)));
  const labelEl = document.createElement("div");
  labelEl.className = `system-module-label${
    labelInfo.corner ? " system-module-label--corner" : ""
  }`;
  if (normalizedLevel < 2) labelEl.classList.add("system-module-label--compact");
  if (normalizedLevel <= 1) labelEl.classList.add("system-module-label--index-only");
  labelEl.dataset.densityLevel = String(normalizedLevel);
  labelEl.dataset.restoreLevel = String(normalizedLevel);
  labelEl.dataset.labelIndex = String(Math.max(1, Number(index || 1)));
  labelEl.dataset.shelfCount = String(Math.max(1, Number(labelInfo.count || 1)));
  labelEl.dataset.addons = String(labelInfo.addons || "");
  const composeInfo =
    labelInfo.compose && typeof labelInfo.compose === "object"
      ? labelInfo.compose
      : { key: "unknown", label: "미지정" };
  labelEl.dataset.composeKey = String(composeInfo.key || "unknown");
  labelEl.dataset.composeLabel = String(composeInfo.label || "미지정");
  const edgeId = String(labelInfo.edgeId || "");
  labelEl.dataset.edgeId = edgeId;
  if (labelInfo.corner) labelEl.dataset.cornerPreview = edgeId;
  else labelEl.dataset.bayPreview = edgeId;
  labelEl.style.left = `${Number(labelInfo.x || 0)}px`;
  labelEl.style.top = `${Number(labelInfo.y || 0)}px`;

  if (normalizedLevel <= 1) {
    const chip = document.createElement("span");
    chip.className = "system-module-index-chip";
    chip.textContent = String(Math.max(1, Number(index || 1)));
    labelEl.appendChild(chip);
    return labelEl;
  }

  const composeBadge = document.createElement("span");
  composeBadge.className = `system-module-label-compose system-module-label-compose--${escapeHtml(
    String(composeInfo.key || "unknown")
  )}`;
  composeBadge.textContent = String(composeInfo.label || "미지정");

  const shelfLine = document.createElement("span");
  shelfLine.className = "system-module-label-line";
  shelfLine.textContent = `선반 ${labelInfo.count}개`;

  labelEl.appendChild(composeBadge);
  labelEl.appendChild(shelfLine);

  if (normalizedLevel >= 2) {
    const addonLine = document.createElement("span");
    addonLine.className = "system-module-label-line";
    addonLine.textContent = `${labelInfo.addons}`;
    labelEl.appendChild(addonLine);
  }
  return labelEl;
}

function getModuleLabelInfoFromElement(labelEl) {
  if (!(labelEl instanceof Element)) return null;
  const composeKey = String(labelEl.dataset.composeKey || "unknown");
  const composeLabel = String(labelEl.dataset.composeLabel || "미지정");
  return {
    edgeId: String(labelEl.dataset.edgeId || ""),
    corner: labelEl.classList.contains("system-module-label--corner"),
    count: Math.max(1, Number(labelEl.dataset.shelfCount || 1)),
    addons: String(labelEl.dataset.addons || ""),
    compose: {
      key: composeKey,
      label: composeLabel,
    },
    x: Number(labelEl.style.left.replace("px", "") || 0),
    y: Number(labelEl.style.top.replace("px", "") || 0),
  };
}

function setModuleLabelExpandedState(labelEl, expanded = false) {
  if (!(labelEl instanceof Element)) return;
  const restoreLevel = Math.max(
    0,
    Math.min(2, Math.floor(Number(labelEl.dataset.restoreLevel || labelEl.dataset.densityLevel || 2)))
  );
  if (restoreLevel >= 2) return;
  const index = Math.max(1, Math.floor(Number(labelEl.dataset.labelIndex || 1)));
  const targetLevel = expanded ? 2 : restoreLevel;
  const info = getModuleLabelInfoFromElement(labelEl);
  if (!info) return;
  const rebuilt = createModuleLabelElement(info, {
    level: targetLevel,
    index,
  });
  rebuilt.dataset.restoreLevel = String(restoreLevel);
  rebuilt.dataset.densityLevel = String(targetLevel);
  rebuilt.classList.toggle("system-module-label--expanded", Boolean(expanded));
  labelEl.replaceWith(rebuilt);
}

function formatDimensionLabelText(
  text = "",
  { compact = false, expanded = false, compactText = "" } = {}
) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  if (compact && !expanded) {
    const compactRaw = String(compactText || "").trim();
    if (compactRaw) return compactRaw;
    return raw;
  }
  return `${raw}mm`;
}

function createDimensionLabelElement(labelInfo = {}, { compact = false } = {}) {
  const labelEl = document.createElement("div");
  labelEl.className = `system-dimension-label${
    labelInfo.corner ? " system-dimension-label--corner" : ""
  }`;
  const isCompact = Boolean(compact);
  if (isCompact) {
    labelEl.classList.add("system-dimension-label--compact");
  }
  const edgeId = String(labelInfo.edgeId || "");
  labelEl.dataset.edgeId = edgeId;
  labelEl.dataset.rawText = String(labelInfo.text || "");
  const compactText =
    Number.isFinite(Number(labelInfo.moduleIndex)) && Number(labelInfo.moduleIndex) > 0
      ? String(Math.max(1, Math.floor(Number(labelInfo.moduleIndex))))
      : "";
  labelEl.dataset.compactText = compactText;
  labelEl.dataset.restoreCompact = isCompact ? "true" : "false";
  labelEl.textContent = formatDimensionLabelText(labelInfo.text, {
    compact: isCompact,
    expanded: false,
    compactText,
  });
  labelEl.style.left = `${Number(labelInfo.x || 0)}px`;
  labelEl.style.top = `${Number(labelInfo.y || 0)}px`;
  if (isCompact && edgeId) {
    labelEl.addEventListener("mouseenter", () => {
      setDimensionLabelExpandedState(labelEl, true);
      setPreviewEdgeHoverState(edgeId, true);
    });
    labelEl.addEventListener("mouseleave", () => {
      setDimensionLabelExpandedState(labelEl, false);
      setPreviewEdgeHoverState("", false);
    });
  }
  return labelEl;
}

function setDimensionLabelExpandedState(labelEl, expanded = false) {
  if (!(labelEl instanceof Element)) return;
  const restoreCompact = String(labelEl.dataset.restoreCompact || "") === "true";
  if (!restoreCompact) return;
  const rawText = String(labelEl.dataset.rawText || "");
  const compactText = String(labelEl.dataset.compactText || "");
  const shouldExpand = Boolean(expanded);
  labelEl.textContent = formatDimensionLabelText(rawText, {
    compact: restoreCompact,
    expanded: shouldExpand,
    compactText,
  });
  labelEl.classList.toggle("system-dimension-label--expanded", shouldExpand);
}

function resolveDimensionLabelCompactStates(labelInfos = [], parentEl) {
  const infos = Array.isArray(labelInfos) ? labelInfos : [];
  if (!(parentEl instanceof Element) || infos.length <= 1) return infos.map(() => false);
  const overlapPadding = 2;
  const tempLabels = [];
  const tempRects = [];
  infos.forEach((info) => {
    const tempEl = createDimensionLabelElement(info, { compact: false });
    tempEl.style.visibility = "hidden";
    tempEl.style.opacity = "0";
    tempEl.style.pointerEvents = "none";
    parentEl.appendChild(tempEl);
    tempLabels.push(tempEl);
    tempRects.push(getBoundingRectOnParent(tempEl, parentEl));
  });

  let hasOverlap = false;
  for (let i = 0; i < tempRects.length; i += 1) {
    for (let j = i + 1; j < tempRects.length; j += 1) {
      if (isRectOverlapping(tempRects[i], tempRects[j], overlapPadding)) {
        hasOverlap = true;
      }
    }
  }

  tempLabels.forEach((el) => el.remove());
  return infos.map(() => hasOverlap);
}

function syncModuleLabelExpansionByEdge(edgeId = "", active = false) {
  const container = $("#systemPreviewShelves");
  if (!container) return;
  const targetId = String(edgeId || "");
  const labels = Array.from(container.querySelectorAll(".system-module-label"));
  labels.forEach((labelEl) => {
    if (!(labelEl instanceof Element)) return;
    const shouldExpand =
      Boolean(active) && Boolean(targetId) && String(labelEl.dataset.edgeId || "") === targetId;
    setModuleLabelExpandedState(labelEl, shouldExpand);
  });
}

function syncDimensionLabelExpansionByEdge(edgeId = "", active = false) {
  const container = $("#systemPreviewShelves");
  if (!container) return;
  const targetId = String(edgeId || "");
  const labels = Array.from(container.querySelectorAll(".system-dimension-label[data-edge-id]"));
  labels.forEach((labelEl) => {
    if (!(labelEl instanceof Element)) return;
    const shouldExpand =
      Boolean(active) && Boolean(targetId) && String(labelEl.dataset.edgeId || "") === targetId;
    setDimensionLabelExpandedState(labelEl, shouldExpand);
  });
}

function isRectOverlapping(a = null, b = null, padding = 0) {
  if (!a || !b) return false;
  const pad = Math.max(0, Number(padding || 0));
  return !(
    a.right + pad <= b.left - pad ||
    a.left - pad >= b.right + pad ||
    a.bottom + pad <= b.top - pad ||
    a.top - pad >= b.bottom + pad
  );
}

function getBoundingRectOnParent(childEl, parentEl) {
  if (!(childEl instanceof Element) || !(parentEl instanceof Element)) return null;
  const childRect = childEl.getBoundingClientRect();
  const parentRect = parentEl.getBoundingClientRect();
  return {
    left: childRect.left - parentRect.left,
    right: childRect.right - parentRect.left,
    top: childRect.top - parentRect.top,
    bottom: childRect.bottom - parentRect.top,
  };
}

function resolveModuleLabelDensityLevels(labelInfos = [], parentEl) {
  const infos = Array.isArray(labelInfos) ? labelInfos : [];
  if (!(parentEl instanceof Element) || infos.length <= 1) return infos.map(() => 2);
  let globalLevel = 2;
  const levels = infos.map(() => globalLevel);
  const maxPass = 3;
  const overlapPadding = 2;
  for (let pass = 0; pass < maxPass; pass += 1) {
    const tempLabels = [];
    const tempRects = [];
    infos.forEach((info, index) => {
      const tempEl = createModuleLabelElement(info, {
        level: levels[index],
        index: index + 1,
      });
      tempEl.classList.add("system-module-label--measure");
      parentEl.appendChild(tempEl);
      tempLabels.push(tempEl);
      tempRects.push(getBoundingRectOnParent(tempEl, parentEl));
    });

    let hasOverlap = false;
    for (let i = 0; i < tempRects.length; i += 1) {
      for (let j = i + 1; j < tempRects.length; j += 1) {
        if (isRectOverlapping(tempRects[i], tempRects[j], overlapPadding)) {
          hasOverlap = true;
        }
      }
    }

    tempLabels.forEach((el) => el.remove());
    if (!hasOverlap) break;
    if (globalLevel <= 0) break;
    globalLevel -= 1;
    for (let i = 0; i < levels.length; i += 1) levels[i] = globalLevel;
  }
  return levels;
}

function normalizePreviewInfoMode(mode) {
  return String(mode || "").toLowerCase() === "module" ? "module" : "size";
}

function syncPreviewInfoModeButtons() {
  document.querySelectorAll("[data-preview-info-mode]").forEach((btn) => {
    const mode = normalizePreviewInfoMode(btn.dataset.previewInfoMode);
    const active = mode === previewInfoMode;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setPreviewInfoMode(mode, { rerender = true } = {}) {
  const nextMode = normalizePreviewInfoMode(mode);
  const changed = previewInfoMode !== nextMode;
  previewInfoMode = nextMode;
  syncPreviewInfoModeButtons();
  if (rerender && changed) updatePreview();
}

function buildShelfAddonChipsHtml(id, emptyText = "선택된 가구 없음") {
  const quantities = enforceSingleSelectableAddon(id);
  const widthPolicy = resolveFurnitureSelectionPolicyForEdge(id);
  const rows = sortAddonEntriesWithRodFirst(Object.entries(quantities))
    .map(([addonId, qty]) => {
      if (addonId === ADDON_CLOTHES_ROD_ID) return "";
      const addon = SYSTEM_ADDON_ITEMS.find((item) => item.id === addonId);
      const count = Math.max(0, Math.floor(Number(qty || 0)));
      if (!addon || count < 1) return "";
      const name = `${addon.name}${count > 1 ? ` x${count}` : ""}`;
      const priceInfo = resolveFurnitureAddonDisplayPriceInfo(addon, {
        widthPolicy,
        widthMm: Number(widthPolicy?.widthMm || 0),
      });
      const totalPriceLabel = priceInfo.isConsult
        ? "상담 안내"
        : formatWon(Math.max(0, Number(priceInfo.unitPrice || 0)) * count);
      return `
        <div class="addon-chip">
          <div class="material-visual" style="background:#ddd;"></div>
          <div class="info">
            <div class="name">${escapeHtml(name)}</div>
            <div class="meta">${escapeHtml(totalPriceLabel)}</div>
          </div>
        </div>
      `;
    })
    .filter(Boolean)
    .join("");
  if (!rows) {
    return `<div class="placeholder">${escapeHtml(emptyText)}</div>`;
  }
  return rows;
}

function renderShelfAddonSelectionToTarget(id, targetId, emptyText = "선택된 가구 없음") {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = buildShelfAddonChipsHtml(id, emptyText);
}

function getCornerSizeAlongSide(sideIndex, swap) {
  const isHorizontal = sideIndex === 0 || sideIndex === 2;
  if (isHorizontal) return swap ? 600 : 800;
  return swap ? 800 : 600;
}

function getResolvedCornerArmLengthsMm(edge, { primarySideIndex = null, secondarySideIndex = null } = {}) {
  const swap = Boolean(edge?.swap);
  const fallbackPrimary =
    Number.isFinite(Number(primarySideIndex)) && Number(primarySideIndex) >= 0
      ? getCornerSizeAlongSide(Number(primarySideIndex), swap)
      : swap
        ? 600
        : 800;
  const fallbackSecondary =
    Number.isFinite(Number(secondarySideIndex)) && Number(secondarySideIndex) >= 0
      ? getCornerSizeAlongSide(Number(secondarySideIndex), swap)
      : swap
        ? 800
        : 600;
  if (!edge?.customProcessing) {
    return {
      primaryMm: fallbackPrimary,
      secondaryMm: fallbackSecondary,
      isCustom: false,
    };
  }
  const customPrimaryMm = Math.round(Number(edge.customPrimaryMm || 0));
  const customSecondaryMm = Math.round(Number(edge.customSecondaryMm || 0));
  return {
    primaryMm: customPrimaryMm > 0 ? customPrimaryMm : fallbackPrimary,
    secondaryMm: customSecondaryMm > 0 ? customSecondaryMm : fallbackSecondary,
    isCustom: true,
  };
}

function getCornerCustomCutLimits() {
  return {
    primaryMinMm: 600,
    primaryMaxMm: 800,
    secondaryMinMm: 600,
    secondaryMaxMm: 800,
    fixedAxisMm: 600,
  };
}

function syncCornerCustomCutInputsUI() {
  const row = $("#cornerCustomCutRow");
  const wrap = $("#cornerCustomCutInputs");
  const primaryInput = $("#cornerCustomPrimaryInput");
  const secondaryInput = $("#cornerCustomSecondaryInput");
  const guideEl = $("#cornerCustomCutGuide");
  if (!wrap || !primaryInput || !secondaryInput) return;
  const mode = String($("#cornerSwapSelect")?.value || "default");
  const limits = getCornerCustomCutLimits();
  const enabled = mode === "custom";

  if (row) row.classList.toggle("hidden", !enabled);
  wrap.classList.toggle("hidden", !enabled);
  primaryInput.disabled = !enabled;
  secondaryInput.disabled = !enabled;

  primaryInput.min = String(limits.primaryMinMm);
  primaryInput.max = String(limits.primaryMaxMm);
  secondaryInput.min = String(limits.secondaryMinMm);
  secondaryInput.max = String(limits.secondaryMaxMm);
  primaryInput.placeholder = `${limits.primaryMinMm}~${limits.primaryMaxMm}`;
  secondaryInput.placeholder = `${limits.secondaryMinMm}~${limits.secondaryMaxMm}`;

  if (guideEl) {
    guideEl.textContent =
      `입력 가능 범위: ${limits.primaryMinMm}~${limits.primaryMaxMm}mm · ` +
      `가로/세로 중 한 축은 ${limits.fixedAxisMm}mm 고정`;
  }
}

function setCornerCustomCutError(message = "") {
  const primaryInput = $("#cornerCustomPrimaryInput");
  const secondaryInput = $("#cornerCustomSecondaryInput");
  const errorEl = $("#cornerCustomCutError");
  const hasError = Boolean(message);
  [primaryInput, secondaryInput].forEach((input) => {
    if (input) input.classList.toggle("input-error", hasError);
  });
  if (errorEl) {
    errorEl.textContent = hasError ? String(message) : "";
    errorEl.classList.toggle("error", hasError);
  }
}

function getCornerCustomCutValidationState() {
  const mode = String($("#cornerSwapSelect")?.value || "default");
  const enabled = mode === "custom";
  if (!enabled) {
    return {
      enabled: false,
      valid: true,
      message: "",
      primaryMm: 0,
      secondaryMm: 0,
    };
  }
  const primaryInput = $("#cornerCustomPrimaryInput");
  const secondaryInput = $("#cornerCustomSecondaryInput");
  const limits = getCornerCustomCutLimits();
  const primaryRaw = Number(primaryInput?.value || 0);
  const secondaryRaw = Number(secondaryInput?.value || 0);
  if (!Number.isFinite(primaryRaw) || !Number.isFinite(secondaryRaw) || primaryRaw <= 0 || secondaryRaw <= 0) {
    return {
      enabled: true,
      valid: false,
      message: "코너 비규격 절단값(1축/2축)을 입력해주세요.",
      primaryMm: 0,
      secondaryMm: 0,
    };
  }
  const primaryMm = Math.round(primaryRaw);
  const secondaryMm = Math.round(secondaryRaw);
  if (
    primaryMm < limits.primaryMinMm ||
    primaryMm > limits.primaryMaxMm ||
    secondaryMm < limits.secondaryMinMm ||
    secondaryMm > limits.secondaryMaxMm
  ) {
    return {
      enabled: true,
      valid: false,
      message:
        `코너 비규격 절단값은 ${limits.primaryMinMm}~${limits.primaryMaxMm}mm / ` +
        `${limits.secondaryMinMm}~${limits.secondaryMaxMm}mm 범위로 입력해주세요.`,
      primaryMm,
      secondaryMm,
    };
  }
  if (primaryMm !== limits.fixedAxisMm && secondaryMm !== limits.fixedAxisMm) {
    return {
      enabled: true,
      valid: false,
      message: `가로/세로 중 한 축은 ${limits.fixedAxisMm}mm로 입력해주세요.`,
      primaryMm,
      secondaryMm,
    };
  }
  return {
    enabled: true,
    valid: true,
    message: "",
    primaryMm,
    secondaryMm,
  };
}

function getCornerLabel(corner) {
  const sideNumber = Number(corner?.sideIndex) + 1;
  return Number.isFinite(sideNumber) ? `코너 ${sideNumber}` : "코너";
}

function getEdgeTypeLabel(item) {
  return item.isCorner ? "코너" : "모듈";
}

function setPreviewEdgeHoverState(edgeId = "", active = false) {
  const container = $("#systemPreviewShelves");
  if (!container) return;
  container.querySelectorAll(".system-shelf.is-edge-hovered").forEach((el) => {
    el.classList.remove("is-edge-hovered");
  });
  if (!active) {
    syncModuleLabelExpansionByEdge("", false);
    syncDimensionLabelExpansionByEdge("", false);
    return;
  }
  const targetId = String(edgeId || "");
  if (!targetId) {
    syncModuleLabelExpansionByEdge("", false);
    syncDimensionLabelExpansionByEdge("", false);
    return;
  }
  const target = Array.from(
    container.querySelectorAll("[data-bay-preview], [data-corner-preview]")
  ).find(
    (el) =>
      String(el?.dataset?.bayPreview || "") === targetId ||
      String(el?.dataset?.cornerPreview || "") === targetId
  );
  if (target) target.classList.add("is-edge-hovered");
  const shouldExpandLabels = Boolean(targetId);
  syncModuleLabelExpansionByEdge(targetId, shouldExpandLabels);
  syncDimensionLabelExpansionByEdge(targetId, shouldExpandLabels);
}

function renderBuilderStructure() {
  const listEl = $("#builderEdgeList");
  if (!listEl) return;
  const rows = [];
  const edges = getPreviewOrderedEdges(getOrderedCommittedGraphEdges());
  edges.forEach((edge, idx) => {
    const placement = edge.placement;
    const dir = hasValidPlacement(placement)
      ? normalizeDirection(placement.dirDx, placement.dirDy)
      : { dx: 1, dy: 0 };
    const sideIndex = directionToSideIndex(dir.dx, dir.dy);
    const isCorner = edge.type === "corner";
    const addonText = formatAddonCompactBreakdown(getShelfAddonIds(edge.id));
    const secondarySideIndex = directionToSideIndex(-dir.dy, dir.dx);
    const { primaryMm: cornerPrimaryMm, secondaryMm: cornerSecondaryMm } = getResolvedCornerArmLengthsMm(edge, {
      primarySideIndex: sideIndex,
      secondarySideIndex,
    });
    const widthText = isCorner
      ? `${cornerPrimaryMm} × ${cornerSecondaryMm}mm${edge.customProcessing ? " (비규격)" : ""}`
      : `${Number(edge.width || 0)}mm`;
    rows.push({
      id: edge.id,
      isCorner,
      title: `${isCorner ? "코너" : "모듈"} ${idx + 1}`,
      meta: `${widthText} / 선반 ${Number(edge.count || 1)}개 / ${addonText}`,
    });
  });
  if (!rows.length) {
    listEl.innerHTML = `<div class="builder-hint">아직 구성된 모듈이 없습니다.</div>`;
    return;
  }
  listEl.innerHTML = rows
    .map(
      (row) => `
      <div class="builder-edge-item" data-builder-edge-id="${row.id}" data-builder-edge-type="${
        row.isCorner ? "corner" : "bay"
      }" tabindex="0">
        <span>${escapeHtml(row.title)}</span>
        <span class="meta">${escapeHtml(row.meta)}</span>
      </div>
    `
    )
    .join("");
}

function addShelfToSide(
  sideIndex,
  { atStart = false, placement = null, skipRender = false, initialCount = 1, pendingAdd = false } = {}
) {
  if (Number.isNaN(sideIndex)) return;
  ensureGraph();
  const newShelf = {
    id: `shelf-${sideIndex}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "bay",
    sideIndex,
    width: 400,
    count: Math.max(0, Math.floor(Number(initialCount ?? 1) || 0)),
    placement: placement || null,
    pendingAdd: Boolean(pendingAdd),
    createdAt: Date.now(),
  };
  registerEdge(newShelf);
  if (!skipRender) renderBayInputs();
  return newShelf.id;
}

function addShelfFromEndpoint(
  endpoint,
  target = {},
  { pushHistory = true, skipRender = false, initialCount = 1, pendingAdd = false } = {}
) {
  const placement = buildPlacementFromEndpoint(endpoint) || null;
  const dir = placement ? normalizeDirection(placement.dirDx, placement.dirDy) : { dx: 1, dy: 0 };
  const sideIndex = Number(
    endpoint?.attachSideIndex ??
      endpoint?.sideIndex ??
      directionToSideIndex(dir.dx, dir.dy)
  );
  if (Number.isNaN(sideIndex)) return "";
  if (pushHistory) pushBuilderHistory("add-normal");
  const shelfId = addShelfToSide(sideIndex, {
    atStart: Boolean(target?.attachAtStart ?? endpoint?.attachAtStart),
    placement,
    skipRender,
    initialCount,
    pendingAdd,
  });
  if (!shelfId) return "";
  const edge = state.graph?.edges?.[shelfId];
  if (edge) {
    edge.attachAtStart = Boolean(target?.attachAtStart ?? endpoint?.attachAtStart);
    edge.anchorEndpointId = String(target?.endpointId || endpoint?.endpointId || "");
    const sourceDir = normalizeDirection(endpoint?.extendDx, endpoint?.extendDy);
    let sourceInward = normalizeDirection(endpoint?.inwardX, endpoint?.inwardY);
    const dot = sourceDir.dx * sourceInward.dx + sourceDir.dy * sourceInward.dy;
    if (Math.abs(dot) > 0.9) sourceInward = { dx: -sourceDir.dy, dy: sourceDir.dx };
    edge.anchorDirDx = sourceDir.dx;
    edge.anchorDirDy = sourceDir.dy;
    edge.anchorInwardX = sourceInward.dx;
    edge.anchorInwardY = sourceInward.dy;
  }
  return shelfId;
}

function moveEdgeBeforeInOrder(edgeId, beforeEdgeId) {
  const targetId = String(edgeId || "");
  const beforeId = String(beforeEdgeId || "");
  if (!targetId || !beforeId || targetId === beforeId) return;
  ensureGraph();
  const order = ensureEdgeOrder();
  const fromIndex = order.indexOf(targetId);
  const toIndex = order.indexOf(beforeId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
  order.splice(fromIndex, 1);
  const nextToIndex = order.indexOf(beforeId);
  order.splice(nextToIndex < 0 ? order.length : nextToIndex, 0, targetId);
}

function insertBayBetweenModulesByTarget(target) {
  const parentEdgeId = String(target?.parentEdgeId || "");
  const childEdgeId = String(target?.childEdgeId || "");
  if (!parentEdgeId || !childEdgeId || parentEdgeId === childEdgeId) return "";
  const parentEndpointId = resolveAnchorForDirection(
    String(target?.parentEndpointId || "")
  );
  const sourceEndpointBase = target?.sourceEndpoint && typeof target.sourceEndpoint === "object"
    ? target.sourceEndpoint
    : null;
  const sourceEndpoint = sourceEndpointBase
    ? {
        ...sourceEndpointBase,
        endpointId: parentEndpointId || String(sourceEndpointBase.endpointId || ""),
      }
    : null;
  if (!parentEndpointId || !sourceEndpoint) return "";

  ensureGraph();
  const parent = state.graph?.edges?.[parentEdgeId];
  const child = state.graph?.edges?.[childEdgeId];
  if (!parent || !child || parent.type !== "bay" || child.type !== "bay") return "";

  const childAnchorCanonical = resolveAnchorForDirection(String(child.anchorEndpointId || ""));
  if (childAnchorCanonical !== parentEndpointId) {
    const childAnchorInfo = parseCanonicalEndpointId(childAnchorCanonical);
    const parentAnchorInfo = parseCanonicalEndpointId(parentEndpointId);
    const canRetargetChildToParentEndpoint =
      childAnchorInfo &&
      parentAnchorInfo &&
      childAnchorInfo.edgeId === parentAnchorInfo.edgeId;
    if (!canRetargetChildToParentEndpoint) return "";
    child.anchorEndpointId = parentEndpointId;
    child.placement = null;
    clearRootAnchorVector(child);
  }

  const shouldPushHistory = target?.pushHistory !== false;
  if (shouldPushHistory) pushBuilderHistory("insert-normal");
  const normalizedInitialCount = Math.max(0, Math.floor(Number(target?.initialCount ?? 1) || 0));
  const pendingAdd = Boolean(target?.pendingAdd);
  const shelfId = addShelfFromEndpoint(
    sourceEndpoint,
    {
      endpointId: parentEndpointId,
      attachAtStart: Boolean(sourceEndpoint.attachAtStart),
    },
    {
      pushHistory: false,
      skipRender: true,
      initialCount: normalizedInitialCount,
      pendingAdd,
    }
  );
  if (!shelfId) return "";

  const inserted = state.graph?.edges?.[shelfId];
  const nextChild = state.graph?.edges?.[childEdgeId];
  if (!inserted || !nextChild) {
    unregisterEdge(shelfId);
    normalizeDanglingAnchorIds();
    renderBayInputs();
    return "";
  }

  nextChild.anchorEndpointId = `${shelfId}:end`;
  nextChild.attachAtStart = false;
  clearRootAnchorVector(nextChild);
  nextChild.placement = null;
  moveEdgeBeforeInOrder(shelfId, childEdgeId);
  inlineInsertPendingFirstSaveEdgeId = shelfId;
  normalizeDanglingAnchorIds();
  renderBayInputs();
  return shelfId;
}

function buildRectBounds(startX, startY, dir, inward, length, depth) {
  const x1 = startX;
  const y1 = startY;
  const x2 = startX + dir.dx * length;
  const y2 = startY + dir.dy * length;
  const x3 = startX + inward.x * depth;
  const y3 = startY + inward.y * depth;
  const x4 = x2 + inward.x * depth;
  const y4 = y2 + inward.y * depth;
  return {
    minX: Math.min(x1, x2, x3, x4),
    minY: Math.min(y1, y2, y3, y4),
    maxX: Math.max(x1, x2, x3, x4),
    maxY: Math.max(y1, y2, y3, y4),
  };
}

function projectCornerPoint(cornerGeom, u, v, scale, tx, ty, offsetX, offsetY) {
  const gx = cornerGeom.originX + cornerGeom.u.dx * u + cornerGeom.v.dx * v;
  const gy = cornerGeom.originY + cornerGeom.u.dy * u + cornerGeom.v.dy * v;
  return {
    x: gx * scale + tx - offsetX,
    y: gy * scale + ty - offsetY,
  };
}

function buildRoundedPolygonPathData(points, radiusPx = 0) {
  if (!Array.isArray(points) || points.length < 3) return "";
  const n = points.length;
  const radius = Math.max(0, Number(radiusPx || 0));
  const rounded = [];

  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const vx1 = Number(prev.x || 0) - Number(curr.x || 0);
    const vy1 = Number(prev.y || 0) - Number(curr.y || 0);
    const vx2 = Number(next.x || 0) - Number(curr.x || 0);
    const vy2 = Number(next.y || 0) - Number(curr.y || 0);
    const len1 = Math.hypot(vx1, vy1);
    const len2 = Math.hypot(vx2, vy2);
    if (!len1 || !len2 || !radius) {
      rounded.push({
        start: { x: curr.x, y: curr.y },
        end: { x: curr.x, y: curr.y },
        corner: { x: curr.x, y: curr.y },
      });
      continue;
    }
    const ux1 = vx1 / len1;
    const uy1 = vy1 / len1;
    const ux2 = vx2 / len2;
    const uy2 = vy2 / len2;
    const cross = ux1 * uy2 - uy1 * ux2;
    if (Math.abs(cross) < 1e-6) {
      rounded.push({
        start: { x: curr.x, y: curr.y },
        end: { x: curr.x, y: curr.y },
        corner: { x: curr.x, y: curr.y },
      });
      continue;
    }
    const trim = Math.min(radius, len1 * 0.45, len2 * 0.45);
    rounded.push({
      start: { x: curr.x + ux1 * trim, y: curr.y + uy1 * trim },
      end: { x: curr.x + ux2 * trim, y: curr.y + uy2 * trim },
      corner: { x: curr.x, y: curr.y },
    });
  }

  const fmt = (num) => Number(num || 0).toFixed(2);
  let d = `M ${fmt(rounded[0].start.x)} ${fmt(rounded[0].start.y)}`;
  for (let i = 0; i < n; i += 1) {
    const seg = rounded[i];
    d += ` Q ${fmt(seg.corner.x)} ${fmt(seg.corner.y)} ${fmt(seg.end.x)} ${fmt(seg.end.y)}`;
    if (i < n - 1) {
      const nextSeg = rounded[i + 1];
      d += ` L ${fmt(nextSeg.start.x)} ${fmt(nextSeg.start.y)}`;
    }
  }
  return `${d} Z`;
}

function buildCornerSvgPathData(cornerGeom, scale, tx, ty, offsetX, offsetY, cornerRadiusPx = 0) {
  if (!cornerGeom) return "";
  const pLen = Math.max(0, Number(cornerGeom.primaryLen || 0));
  const sLen = Math.max(0, Number(cornerGeom.secondaryLen || 0));
  const depth = Math.max(0, Number(cornerGeom.depth || 0));
  const innerU = Math.max(0, pLen - depth);

  const points = [
    projectCornerPoint(cornerGeom, 0, 0, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, pLen, 0, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, pLen, sLen, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, innerU, sLen, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, innerU, depth, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, 0, depth, scale, tx, ty, offsetX, offsetY),
  ];
  return buildRoundedPolygonPathData(points, cornerRadiusPx);
}

function pushPreviewAddButton(list, entry) {
  const exists = list.find((it) => {
    const dx = Math.abs((it.x || 0) - (entry.x || 0));
    const dy = Math.abs((it.y || 0) - (entry.y || 0));
    if (dx >= 10 || dy >= 10) return false;
    return (
      Number(it.attachSideIndex) === Number(entry.attachSideIndex) &&
      Boolean(it.attachAtStart) === Boolean(entry.attachAtStart) &&
      String(it.cornerId || "") === String(entry.cornerId || "")
    );
  });
  if (exists) return exists;
  const overlaps = list.filter((it) => {
    const dx = Math.abs((it.x || 0) - (entry.x || 0));
    const dy = Math.abs((it.y || 0) - (entry.y || 0));
    return dx < 10 && dy < 10;
  });
  if (overlaps.length) {
    const spread = 12;
    const angle = (Math.PI * 2 * overlaps.length) / Math.max(2, overlaps.length + 1);
    entry.x = Number(entry.x || 0) + Math.cos(angle) * spread;
    entry.y = Number(entry.y || 0) + Math.sin(angle) * spread;
  }
  list.push(entry);
  return entry;
}

function pushUniquePoint(list, entry, threshold = 8) {
  const edgeHint = entry.edgeHint || "";
  const entryIsStructural = entry.isStructuralColumn !== false;
  const exists = list.find((it) => {
    const dx = Math.abs((it.x || 0) - (entry.x || 0));
    const dy = Math.abs((it.y || 0) - (entry.y || 0));
    return dx < threshold && dy < threshold;
  });
  if (exists) {
    exists.inwardX = Number(exists.inwardX || 0) + Number(entry.inwardX || 0);
    exists.inwardY = Number(exists.inwardY || 0) + Number(entry.inwardY || 0);
    const nextCount = Number(exists.count || 1) + 1;
    exists.count = nextCount;
    const prevStructuralCount = Math.max(0, Number(exists.structuralCount || 0));
    const structuralCount = prevStructuralCount + (entryIsStructural ? 1 : 0);
    exists.structuralCount = structuralCount;
    const existsWidthMm = Number(exists.columnWidthMm || 0);
    const entryWidthMm = Number(entry.columnWidthMm || 0);
    const shouldPromoteInner = structuralCount > 1;
    if (Number.isFinite(entryWidthMm) && entryWidthMm > 0) {
      const baseWidthMm = Number.isFinite(existsWidthMm) && existsWidthMm > 0 ? existsWidthMm : entryWidthMm;
      // Shared structural columns are treated as inner columns.
      exists.columnWidthMm = shouldPromoteInner
        ? Math.max(COLUMN_WIDTH_MM, baseWidthMm, entryWidthMm)
        : baseWidthMm;
    } else if (shouldPromoteInner) {
      exists.columnWidthMm = Math.max(COLUMN_WIDTH_MM, Number(exists.columnWidthMm || 0));
    }
    if (Number.isFinite(Number(entry.rotationDeg)) && !Number.isFinite(Number(exists.rotationDeg))) {
      exists.rotationDeg = Number(entry.rotationDeg);
    }
    if (entry.columnRole && !exists.columnRole) {
      exists.columnRole = String(entry.columnRole);
    }
    if (edgeHint) {
      exists.edgeVotes = exists.edgeVotes || {};
      exists.edgeVotes[edgeHint] = Number(exists.edgeVotes[edgeHint] || 0) + 1;
    }
    return;
  }
  list.push({
    ...entry,
    inwardX: Number(entry.inwardX || 0),
    inwardY: Number(entry.inwardY || 0),
    count: 1,
    columnWidthMm: Number(entry.columnWidthMm || 0),
    structuralCount: entryIsStructural ? 1 : 0,
    edgeVotes: edgeHint ? { [edgeHint]: 1 } : {},
  });
}

function hasValidPlacement(placement) {
  return Boolean(
    placement &&
      Number.isFinite(Number(placement.startX)) &&
      Number.isFinite(Number(placement.startY)) &&
      Number.isFinite(Number(placement.dirDx)) &&
      Number.isFinite(Number(placement.dirDy)) &&
      Number.isFinite(Number(placement.inwardX)) &&
      Number.isFinite(Number(placement.inwardY))
  );
}

function buildPlacementFromEndpoint(endpoint) {
  if (!endpoint) return null;
  const centerX = Number(endpoint.x);
  const centerY = Number(endpoint.y);
  const rawDx = Number(endpoint.extendDx);
  const rawDy = Number(endpoint.extendDy);
  let inwardX = Number(endpoint.inwardX);
  let inwardY = Number(endpoint.inwardY);
  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) return null;
  if (!Number.isFinite(rawDx) || !Number.isFinite(rawDy)) return null;
  const dirLen = Math.hypot(rawDx, rawDy);
  if (!dirLen) return null;
  const dirDx = rawDx / dirLen;
  const dirDy = rawDy / dirLen;
  const inwardLen = Math.hypot(inwardX, inwardY);
  if (!inwardLen) {
    inwardX = -dirDy;
    inwardY = dirDx;
  }
  const endpointPostBarWidthMm = Math.max(
    1,
    Number(endpoint.postBarWidthMm || COLUMN_WIDTH_MM)
  );
  return {
    startX: centerX + dirDx * (endpointPostBarWidthMm / 2),
    startY: centerY + dirDy * (endpointPostBarWidthMm / 2),
    dirDx,
    dirDy,
    inwardX,
    inwardY,
  };
}

function getEdgeHintFromDir(dir) {
  if (!dir) return "";
  if (dir.dx === 1 && dir.dy === 0) return "top";
  if (dir.dx === 0 && dir.dy === 1) return "right";
  if (dir.dx === -1 && dir.dy === 0) return "bottom";
  if (dir.dx === 0 && dir.dy === -1) return "left";
  return "";
}

function getEdgeHintFromInward(inwardX, inwardY) {
  const inward = normalizeDirection(inwardX, inwardY);
  const outward = { dx: -inward.dx, dy: -inward.dy };
  if (Math.abs(outward.dx) >= Math.abs(outward.dy)) {
    return outward.dx >= 0 ? "right" : "left";
  }
  return outward.dy >= 0 ? "bottom" : "top";
}

function toEndpointKeyNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3);
}

function buildEndpointStableId(entry) {
  const dir = normalizeDirection(entry?.extendDx, entry?.extendDy);
  const inward = normalizeDirection(entry?.inwardX, entry?.inwardY);
  const x = toEndpointKeyNumber(entry?.x);
  const y = toEndpointKeyNumber(entry?.y);
  return `ep-${x}-${y}-${dir.dx}-${dir.dy}-${inward.dx}-${inward.dy}`;
}

function isOppositeEndpointDirection(a, b) {
  const ad = normalizeDirection(a?.extendDx, a?.extendDy);
  const bd = normalizeDirection(b?.extendDx, b?.extendDy);
  return ad.dx === -bd.dx && ad.dy === -bd.dy;
}

function readBayInputs({ includePending = false } = {}) {
  return getOrderedGraphEdges({ includePending }).map((edge) => {
    const isCorner = edge.type === "corner";
    const dir = hasValidPlacement(edge.placement)
      ? normalizeDirection(edge.placement.dirDx, edge.placement.dirDy)
      : { dx: 1, dy: 0 };
    const sideIndex = directionToSideIndex(dir.dx, dir.dy);
    const secondarySideIndex = directionToSideIndex(-dir.dy, dir.dx);
    const { primaryMm: cornerPrimaryMm, secondaryMm: cornerSecondaryMm } = getResolvedCornerArmLengthsMm(edge, {
      primarySideIndex: sideIndex,
      secondarySideIndex,
    });
    return {
      id: edge.id,
      width: isCorner ? cornerPrimaryMm : edge.width || 0,
      count: edge.count || 1,
      addons: getShelfAddonIds(edge.id),
      isCorner,
      customProcessing: Boolean(edge.customProcessing),
      customPrimaryMm: isCorner ? cornerPrimaryMm : 0,
      customSecondaryMm: isCorner ? cornerSecondaryMm : 0,
      sideIndex,
      placement: edge.placement || null,
    };
  });
}

function validateInputs(input, bays) {
  const shelfMat = SYSTEM_SHELF_MATERIALS[input.shelf.materialId];
  const columnMat = SYSTEM_COLUMN_MATERIALS[input.column.materialId];
  const spaces = input.spaces || [];
  const layoutValidation = evaluateLayoutValidationState(getLayoutConfigSnapshot(input));

  if (layoutValidation.status === "invalid") {
    return layoutValidation.messages[0] || "레이아웃 입력값을 확인해주세요.";
  }

  const space = spaces[0] || { min: 0, max: 0, extraHeights: [] };
  if (!space.min || !space.max) {
    return "가장 낮은/높은 천장 높이를 입력해주세요.";
  }
  if (space.min > space.max) {
    return "가장 낮은 천장 높이는 가장 높은 천장 이하로 입력해주세요.";
  }
  if (space.min < LIMITS.column.minLength || space.max < LIMITS.column.minLength) {
    return `천장 높이는 ${LIMITS.column.minLength}mm 이상 입력해주세요.`;
  }
  const extraHeights = space.extraHeights || [];
  for (let j = 0; j < extraHeights.length; j += 1) {
    const h = Number(extraHeights[j] || 0);
    if (h < LIMITS.column.minLength) {
      return `개별높이는 ${LIMITS.column.minLength}mm 이상 입력해주세요.`;
    }
  }

  if (!input.column.materialId) return "포스트바 컬러를 선택해주세요.";
  if (!input.shelf.materialId) return "선반 컬러를 선택해주세요.";

  const shelfPanelLimits = LIMITS.shelf;
  for (let i = 0; i < bays.length; i += 1) {
    const bay = bays[i];
    if (!bay.width) return `선반 폭을 입력해주세요.`;
    if (!bay.count || bay.count < 1) return `선반 갯수를 입력해주세요.`;
    if (!bay.isCorner && (bay.width < MODULE_SHELF_WIDTH_LIMITS.min || bay.width > MODULE_SHELF_WIDTH_LIMITS.max)) {
      return `폭은 ${MODULE_SHELF_WIDTH_LIMITS.min}~${MODULE_SHELF_WIDTH_LIMITS.max}mm 범위 내로 입력해주세요.`;
    }
  }
  if (SHELF_LENGTH_MM > shelfPanelLimits.maxLength) {
    return `선반 길이는 ${shelfPanelLimits.maxLength}mm 이하입니다.`;
  }

  if (!shelfMat?.availableThickness?.includes(input.shelf.thickness)) {
    return `선택한 선반 컬러는 ${shelfMat.availableThickness.join(", ")}T만 가능합니다.`;
  }
  if (!columnMat?.availableThickness?.includes(input.column.thickness)) {
    return `선택한 포스트바 컬러는 ${columnMat.availableThickness.join(", ")}T만 가능합니다.`;
  }

  return null;
}

function validateEstimateInputs(input, bays) {
  if (!bays.length) return "미리보기에서 모듈을 추가해주세요.";
  return validateInputs(input, bays);
}

function setFieldError(inputEl, errorEl, message) {
  if (!errorEl || !inputEl) return;
  if (message) {
    errorEl.textContent = message;
    errorEl.classList.add("error");
    inputEl.classList.add("input-error");
  } else {
    errorEl.textContent = "";
    errorEl.classList.remove("error");
    inputEl.classList.remove("input-error");
  }
}

function updateSizeErrorsUI(input, bays) {
  const spaces = input.spaces || [];
  const space = spaces[0] || { min: 0, max: 0, extraHeights: [] };
  const minEl = $("#spaceMin-0");
  const maxEl = $("#spaceMax-0");
  const heightError = $("#spaceHeightError-0");
  const extraError = $("#spaceExtraError-0");

  let heightMsg = "";
  if (!space.min || !space.max) {
    heightMsg = "가장 낮은/높은 천장 높이를 입력해주세요.";
  } else if (space.min > space.max) {
    heightMsg = "가장 낮은 천장 높이는 가장 높은 천장 이하로 입력해주세요.";
  } else if (space.min < LIMITS.column.minLength || space.max < LIMITS.column.minLength) {
    heightMsg = `천장 높이는 ${LIMITS.column.minLength}mm 이상 입력해주세요.`;
  }
  setFieldError(minEl, heightError, heightMsg);
  setFieldError(maxEl, heightError, heightMsg);

  const extraInputs = Array.from(document.querySelectorAll(`[data-space-extra-height="0"]`));
  let extraMsg = "";
  extraInputs.forEach((inputEl) => {
    const value = Number(inputEl.value || 0);
    const invalid = value && value < LIMITS.column.minLength;
    inputEl.classList.toggle("input-error", Boolean(invalid));
    if (!extraMsg && invalid) {
      extraMsg = `개별높이는 ${LIMITS.column.minLength}mm 이상 입력해주세요.`;
    }
  });
  if (!extraMsg && (space.extraHeights || []).length > 1) {
    extraMsg = "창문, 커튼박스 등으로 동일 높이 설치가 어려운 경우에는 구간별 개별 높이 포스트바를 추가해 주세요.";
  }
  if (extraError) {
    extraError.textContent = extraMsg;
    extraError.classList.toggle("error", Boolean(extraMsg));
  }

  bays.forEach((bay) => {
    if (!bay.id) return;
    const widthEl = document.querySelector(`[data-shelf-width="${bay.id}"]`);
    const countEl = document.querySelector(`[data-shelf-count="${bay.id}"]`);
    const widthError = document.querySelector(`[data-shelf-width-error="${bay.id}"]`);
    const countError = document.querySelector(`[data-shelf-count-error="${bay.id}"]`);
    const widthMsg =
      !bay.isCorner && bay.width && (bay.width < MODULE_SHELF_WIDTH_LIMITS.min || bay.width > MODULE_SHELF_WIDTH_LIMITS.max)
        ? `폭은 ${MODULE_SHELF_WIDTH_LIMITS.min}~${MODULE_SHELF_WIDTH_LIMITS.max}mm 범위 내로 입력해주세요.`
        : "";
    const countMsg = bay.count < 1 ? "선반 갯수는 1개 이상이어야 합니다." : "";
    setFieldError(widthEl, widthError, widthMsg);
    setFieldError(countEl, countError, countMsg);
  });
}

function bindSpaceExtraHeightEvents(spaceIndex) {
  document
    .querySelectorAll(`[data-space-extra-height="${spaceIndex}"]`)
    .forEach((inputEl) => {
      if (inputEl.dataset.bound === "true") return;
      inputEl.dataset.bound = "true";
      inputEl.addEventListener("input", () => {
        refreshBuilderDerivedUI();
      });
    });
  document
    .querySelectorAll(`[data-space-extra-remove="${spaceIndex}"]`)
    .forEach((btn) => {
      if (btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", () => {
        btn.closest(".space-extra-row")?.remove();
        refreshBuilderDerivedUI();
      });
    });
}

function setSpaceExtraHeights(spaceIndex, values) {
  const list = $(`#spaceExtraList-${spaceIndex}`);
  if (!list) return;
  const rows = (values || []).filter((v) => Number(v || 0) > 0);
  list.innerHTML = rows
    .map(
      (value) => `
        <div class="space-extra-row">
          <input type="number" data-space-extra-height="${spaceIndex}" placeholder="개별높이 (${LIMITS.column.minLength}mm 이상)" value="${Number(value)}" />
          <button type="button" class="ghost-btn" data-space-extra-remove="${spaceIndex}">삭제</button>
        </div>
      `
    )
    .join("");
  bindSpaceExtraHeightEvents(spaceIndex);
}

function isPreviewBuilderReady(input) {
  if (!input?.shelf?.materialId) return false;
  if (!input?.column?.materialId) return false;
  const layoutValidation = evaluateLayoutValidationState(getLayoutConfigSnapshot(input));
  if (layoutValidation.status === "invalid") return false;
  const spaces = input.spaces || [];
  const requiredCount = getRequiredSectionCount();
  for (let i = 0; i < requiredCount; i += 1) {
    const space = spaces[i] || { min: 0, max: 0 };
    const min = Number(space.min || 0);
    const max = Number(space.max || 0);
    if (!min || !max) return false;
    if (min > max) return false;
    if (min < LIMITS.column.minLength || max < LIMITS.column.minLength) return false;
  }
  return true;
}

function getPreviewBuilderDisabledReason(input) {
  if (!input?.column?.materialId) return "포스트바 컬러를 먼저 선택해주세요.";
  if (!input?.shelf?.materialId) return "선반 컬러를 먼저 선택해주세요.";
  const layoutValidation = evaluateLayoutValidationState(getLayoutConfigSnapshot(input));
  if (layoutValidation.status === "invalid") {
    return layoutValidation.messages[0] || "레이아웃 설치공간 입력값을 확인해주세요.";
  }
  const space = (input?.spaces || [])[0] || { min: 0, max: 0 };
  const min = Number(space.min || 0);
  const max = Number(space.max || 0);
  if (!min || !max) return "천장 높이(최소/최대)를 먼저 입력해주세요.";
  if (min > max) return "천장 높이 입력값을 확인해주세요.";
  if (min < LIMITS.column.minLength || max < LIMITS.column.minLength) {
    return `천장 높이는 ${LIMITS.column.minLength}mm 이상이어야 합니다.`;
  }
  return "";
}

function getItemPriceDisplayValidationMessage(input, bays) {
  if (!input?.column?.materialId) return "포스트바 컬러를 선택해주세요.";
  if (!input?.shelf?.materialId) return "선반 컬러를 선택해주세요.";

  const space = (input?.spaces || [])[0] || { min: 0, max: 0, extraHeights: [] };
  const min = Number(space.min || 0);
  const max = Number(space.max || 0);
  if (!min || !max) return "가장 낮은/높은 천장 높이를 입력해주세요.";
  if (min > max) return "가장 낮은 천장 높이는 가장 높은 천장 이하로 입력해주세요.";
  if (min < LIMITS.column.minLength || max < LIMITS.column.minLength) {
    return `천장 높이는 ${LIMITS.column.minLength}mm 이상 입력해주세요.`;
  }

  const extraHeights = space.extraHeights || [];
  for (let i = 0; i < extraHeights.length; i += 1) {
    const h = Number(extraHeights[i] || 0);
    if (h < LIMITS.column.minLength) {
      return `개별높이는 ${LIMITS.column.minLength}mm 이상 입력해주세요.`;
    }
  }

  if (!Array.isArray(bays) || !bays.length) return "미리보기에서 모듈을 추가해주세요.";

  const detailedErr = validateInputs(input, bays);
  return detailedErr || "";
}

function buildPreviewOptionText(input, shelfMat, columnMat) {
  const space = (input?.spaces || [])[0] || { min: 0, max: 0, extraHeights: [] };
  const min = Number(space.min || 0);
  const max = Number(space.max || 0);
  const heightText = min && max ? `${min}~${max}mm` : "-";
  const extraCount = Array.isArray(space.extraHeights)
    ? space.extraHeights.filter((value) => Number(value || 0) > 0).length
    : 0;
  const extraText = extraCount > 0 ? ` · 개별높이 ${extraCount}개` : "";
  const layoutText = buildLayoutPreviewSummaryText(input);
  return `탑뷰 · ${layoutText} · 선반 ${shelfMat?.name || "-"} · 포스트바 ${columnMat?.name || "-"} · 천장 ${heightText}${extraText}`;
}

function applyPreviewAddButtonState(btn, { enabled = true, reason = "" } = {}) {
  if (!btn) return;
  if (enabled) {
    btn.disabled = false;
    btn.removeAttribute("disabled");
    btn.classList.remove("is-disabled");
    btn.classList.remove("btn-disabled");
    delete btn.dataset.disabledReason;
    btn.removeAttribute("aria-disabled");
    if (previewAddTooltipAnchorEl === btn) hidePreviewAddTooltip();
    return;
  }
  btn.disabled = true;
  btn.classList.add("is-disabled");
  btn.classList.add("btn-disabled");
  if (!reason) {
    delete btn.dataset.disabledReason;
    btn.removeAttribute("aria-disabled");
    if (previewAddTooltipAnchorEl === btn) hidePreviewAddTooltip();
    return;
  }
  btn.dataset.disabledReason = reason;
  btn.setAttribute("aria-disabled", "true");
}

function ensurePreviewAddTooltipElement() {
  if (previewAddTooltipEl && previewAddTooltipEl.isConnected) return previewAddTooltipEl;
  const el = document.createElement("div");
  el.className = "preview-add-tooltip";
  el.setAttribute("role", "tooltip");
  el.setAttribute("aria-hidden", "true");
  el.style.display = "none";
  document.body.appendChild(el);
  previewAddTooltipEl = el;
  return el;
}

function hidePreviewAddTooltip() {
  if (!previewAddTooltipEl) return;
  previewAddTooltipEl.style.display = "none";
  previewAddTooltipEl.textContent = "";
  previewAddTooltipEl.setAttribute("aria-hidden", "true");
  delete previewAddTooltipEl.dataset.placement;
  previewAddTooltipAnchorEl = null;
}

function showPreviewAddTooltip(anchorEl, message = "") {
  if (!(anchorEl instanceof Element)) return;
  const text = String(message || "").trim();
  if (!text) {
    hidePreviewAddTooltip();
    return;
  }
  const tooltipEl = ensurePreviewAddTooltipElement();
  tooltipEl.textContent = text;
  tooltipEl.style.display = "block";
  tooltipEl.setAttribute("aria-hidden", "false");
  const anchorRect = anchorEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const viewportW = Math.max(
    0,
    Number(window.innerWidth || 0) || Number(document.documentElement?.clientWidth || 0)
  );
  const viewportH = Math.max(
    0,
    Number(window.innerHeight || 0) || Number(document.documentElement?.clientHeight || 0)
  );
  const gutter = 8;
  const gap = 8;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value || 0)));
  let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
  left = clamp(left, gutter, Math.max(gutter, viewportW - tooltipRect.width - gutter));
  let top = anchorRect.bottom + gap;
  let placement = "bottom";
  if (top + tooltipRect.height > viewportH - gutter) {
    top = anchorRect.top - tooltipRect.height - gap;
    placement = "top";
  }
  if (top < gutter) {
    top = clamp(
      anchorRect.bottom + gap,
      gutter,
      Math.max(gutter, viewportH - tooltipRect.height - gutter)
    );
    placement = "bottom";
  }
  tooltipEl.style.left = `${Math.round(left)}px`;
  tooltipEl.style.top = `${Math.round(top)}px`;
  tooltipEl.dataset.placement = placement;
  previewAddTooltipAnchorEl = anchorEl;
}

function getPreviewAddButtonPlacementKey(point = null) {
  if (!point || typeof point !== "object") return "";
  const endpointId = String(point.endpointId || "").trim();
  if (endpointId) return `endpoint:${endpointId}`;
  const cornerId = String(point.cornerId || "").trim();
  const sideIndex = Number(point.sideIndex);
  const attachSideIndex = Number(point.attachSideIndex);
  const attachAtStart = Boolean(point.attachAtStart);
  if (!Number.isFinite(sideIndex)) return "";
  const sideToken = Number.isFinite(attachSideIndex) ? attachSideIndex : sideIndex;
  return `fallback:${sideIndex}:${sideToken}:${attachAtStart ? "1" : "0"}:${cornerId}`;
}

function setPreviewRenderTransform(next) {
  previewRenderTransform = {
    scale: Number(next?.scale || 1),
    tx: Number(next?.tx || 0),
    ty: Number(next?.ty || 0),
    depthMm: Number(next?.depthMm || 400),
  };
}

function requestPreviewFrameRerender() {
  if (previewResizeRafTimer) cancelAnimationFrame(previewResizeRafTimer);
  previewResizeRafTimer = requestAnimationFrame(() => {
    previewResizeRafTimer = null;
    hidePreviewAddTooltip();
    const frame = $("#systemPreviewFrame");
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const width = Math.round(Number(rect.width || 0));
    const height = Math.round(Number(rect.height || 0));
    if (width <= 0 || height <= 0) return;
    if (previewFrameLastSize.width === width && previewFrameLastSize.height === height) return;
    previewFrameLastSize = { width, height };
    updatePreview();
  });
}

function bindPreviewFrameResizeSync() {
  const frame = $("#systemPreviewFrame");
  if (!frame) return;
  const rect = frame.getBoundingClientRect();
  previewFrameLastSize = {
    width: Math.round(Number(rect.width || 0)),
    height: Math.round(Number(rect.height || 0)),
  };
  if (previewFrameResizeObserver) {
    previewFrameResizeObserver.disconnect();
    previewFrameResizeObserver = null;
  }
  if (typeof ResizeObserver !== "function") return;
  previewFrameResizeObserver = new ResizeObserver(() => {
    requestPreviewFrameRerender();
  });
  previewFrameResizeObserver.observe(frame);
}

function clearPreviewGhost() {
  const container = $("#systemPreviewShelves");
  if (!container) return;
  container.querySelectorAll(".system-preview-ghost").forEach((el) => el.remove());
}

function renderPreviewGhostNormal(placement, container) {
  if (!hasValidPlacement(placement) || !container) return;
  const widthMm = 400 + SUPPORT_VISIBLE_MM * 2;
  const depthMm = Number(previewRenderTransform.depthMm || 400);
  const dir = normalizeDirection(placement.dirDx, placement.dirDy);
  let inward = normalizeDirection(placement.inwardX, placement.inwardY);
  const dot = dir.dx * inward.dx + dir.dy * inward.dy;
  if (Math.abs(dot) > 0.9) inward = { dx: -dir.dy, dy: dir.dx };
  const rect = buildRectBounds(
    Number(placement.startX || 0),
    Number(placement.startY || 0),
    dir,
    { x: inward.dx, y: inward.dy },
    widthMm,
    depthMm
  );
  const ghost = document.createElement("div");
  ghost.className = "system-preview-ghost system-preview-ghost--normal";
  ghost.style.left = `${rect.minX * previewRenderTransform.scale + previewRenderTransform.tx}px`;
  ghost.style.top = `${rect.minY * previewRenderTransform.scale + previewRenderTransform.ty}px`;
  ghost.style.width = `${Math.max(1, (rect.maxX - rect.minX) * previewRenderTransform.scale)}px`;
  ghost.style.height = `${Math.max(1, (rect.maxY - rect.minY) * previewRenderTransform.scale)}px`;
  container.appendChild(ghost);
}

function renderPreviewGhostCorner(placement, container) {
  if (!hasValidPlacement(placement) || !container) return;
  const depthMm = Number(previewRenderTransform.depthMm || 400);
  const dir = normalizeDirection(placement.dirDx, placement.dirDy);
  let inward = normalizeDirection(placement.inwardX, placement.inwardY);
  const dot = dir.dx * inward.dx + dir.dy * inward.dy;
  if (Math.abs(dot) > 0.9) inward = { dx: -dir.dy, dy: dir.dx };
  const primaryLen = 800 + SUPPORT_VISIBLE_MM * 2;
  const secondLen = 600 + SUPPORT_VISIBLE_MM * 2;
  const startX = Number(placement.startX || 0);
  const startY = Number(placement.startY || 0);
  const secondStartX = startX + dir.dx * primaryLen;
  const secondStartY = startY + dir.dy * primaryLen;
  const armA = buildRectBounds(
    startX,
    startY,
    dir,
    { x: inward.dx, y: inward.dy },
    primaryLen,
    depthMm
  );
  const armB = buildRectBounds(
    secondStartX,
    secondStartY,
    inward,
    { x: -dir.dx, y: -dir.dy },
    secondLen,
    depthMm
  );
  const minX = Math.min(armA.minX, armB.minX);
  const minY = Math.min(armA.minY, armB.minY);
  const maxX = Math.max(armA.maxX, armB.maxX);
  const maxY = Math.max(armA.maxY, armB.maxY);
  const ghost = document.createElement("div");
  ghost.className = "system-preview-ghost system-preview-ghost--corner";
  ghost.style.left = `${minX * previewRenderTransform.scale + previewRenderTransform.tx}px`;
  ghost.style.top = `${minY * previewRenderTransform.scale + previewRenderTransform.ty}px`;
  ghost.style.width = `${Math.max(1, (maxX - minX) * previewRenderTransform.scale)}px`;
  ghost.style.height = `${Math.max(1, (maxY - minY) * previewRenderTransform.scale)}px`;
  [armA, armB].forEach((arm) => {
    const armEl = document.createElement("div");
    armEl.className = "system-preview-ghost-arm";
    armEl.style.left = `${(arm.minX - minX) * previewRenderTransform.scale}px`;
    armEl.style.top = `${(arm.minY - minY) * previewRenderTransform.scale}px`;
    armEl.style.width = `${Math.max(1, (arm.maxX - arm.minX) * previewRenderTransform.scale)}px`;
    armEl.style.height = `${Math.max(1, (arm.maxY - arm.minY) * previewRenderTransform.scale)}px`;
    ghost.appendChild(armEl);
  });
  container.appendChild(ghost);
}

function showPreviewGhostForEndpoint(endpoint, preferType = "normal") {
  const container = $("#systemPreviewShelves");
  if (!endpoint || !container) return;
  const placement = buildPlacementFromEndpoint(endpoint);
  if (!placement) return;
  clearPreviewGhost();
  if (preferType === "corner") {
    renderPreviewGhostCorner(placement, container);
    return;
  }
  renderPreviewGhostNormal(placement, container);
}

function bindAddButtonPreviewInteractions(
  btn,
  endpoint,
  canAddFromPreview,
  { showGhost = true } = {}
) {
  if (!btn || !endpoint) return;
  const allowedTypes = Array.isArray(endpoint.allowedTypes)
    ? endpoint.allowedTypes
    : ["normal", "corner"];
  btn.dataset.allowedTypes = allowedTypes.join(",");
  const preferredType =
    allowedTypes.includes("normal") || !allowedTypes.length ? "normal" : allowedTypes[0];
  const show = () => {
    if (!canAddFromPreview || btn.disabled) return;
    if (showGhost) {
      showPreviewGhostForEndpoint(endpoint, preferredType);
    } else {
      clearPreviewGhost();
    }
  };
  const hide = () => {
    if (showGhost) clearPreviewGhost();
  };
  const showDisabledReason = () => {
    if (!btn.disabled) return;
    const reason = String(btn.dataset.disabledReason || "").trim();
    if (!reason) return;
    showPreviewAddTooltip(btn, reason);
  };
  const hideDisabledReason = () => {
    if (previewAddTooltipAnchorEl === btn) hidePreviewAddTooltip();
  };
  btn.addEventListener("mouseenter", () => {
    show();
    showDisabledReason();
  });
  btn.addEventListener("focus", () => {
    show();
    showDisabledReason();
  });
  btn.addEventListener("mouseleave", () => {
    hide();
    hideDisabledReason();
  });
  btn.addEventListener("blur", () => {
    hide();
    hideDisabledReason();
  });
}

function cloneBuilderStateSnapshot() {
  const graphClone = state.graph ? JSON.parse(JSON.stringify(state.graph)) : null;
  const addonClone = state.shelfAddons ? JSON.parse(JSON.stringify(state.shelfAddons)) : {};
  if (graphClone?.edges && typeof graphClone.edges === "object") {
    const reanchorCloneChildrenBeforePendingRemoval = (removedEdgeId, replacementAnchorId) => {
      const removedId = String(removedEdgeId || "");
      if (!removedId) return;
      const nextAnchor = String(replacementAnchorId || "root-endpoint");
      Object.entries(graphClone.edges).forEach(([candidateId, candidateEdge]) => {
        const childId = String(candidateId || "");
        if (!childId || childId === removedId || !candidateEdge) return;
        const anchorId = String(candidateEdge.anchorEndpointId || "");
        if (!anchorId) return;
        const canonicalAnchor = resolveAnchorForDirection(anchorId, null, { includePending: true });
        const isAnchoredToPending =
          anchorId.startsWith(`${removedId}:`) ||
          String(canonicalAnchor || "").startsWith(`${removedId}:`);
        if (!isAnchoredToPending) return;
        candidateEdge.anchorEndpointId = nextAnchor;
        candidateEdge.placement = null;
      });
    };
    Object.keys(graphClone.edges).forEach((edgeId) => {
      const edge = graphClone.edges[edgeId];
      if (edge?.pendingAdd) {
        const rawReplacementAnchor = String(edge.anchorEndpointId || "");
        const resolvedReplacementAnchor = resolveAnchorForDirection(rawReplacementAnchor, null, {
          includePending: true,
        });
        const replacementAnchor =
          resolvedReplacementAnchor && !resolvedReplacementAnchor.startsWith(`${String(edgeId || "")}:`)
            ? resolvedReplacementAnchor
            : "root-endpoint";
        reanchorCloneChildrenBeforePendingRemoval(edgeId, replacementAnchor);
        delete graphClone.edges[edgeId];
        if (Array.isArray(graphClone.edgeOrder)) {
          graphClone.edgeOrder = graphClone.edgeOrder.filter((id) => id !== edgeId);
        }
        if (addonClone && Object.prototype.hasOwnProperty.call(addonClone, edgeId)) {
          delete addonClone[edgeId];
        }
      }
    });
  }
  return {
    graph: graphClone,
    shelfAddons: addonClone,
  };
}

function getBuilderSnapshotKey(snapshot) {
  try {
    return JSON.stringify(snapshot || {});
  } catch (err) {
    return String(Date.now());
  }
}

function updateBuilderHistoryButtons() {
  const undoBtn = $("#builderUndoBtn");
  const redoBtn = $("#builderRedoBtn");
  if (undoBtn) undoBtn.disabled = builderHistory.undo.length === 0;
  if (redoBtn) redoBtn.disabled = builderHistory.redo.length === 0;
}

function resetBuilderHistoryState() {
  builderHistory.undo = [];
  builderHistory.redo = [];
  updateBuilderHistoryButtons();
}

function pushBuilderHistory(label = "") {
  if (builderHistory.applying) return;
  ensureGraph();
  const snapshot = cloneBuilderStateSnapshot();
  const key = getBuilderSnapshotKey(snapshot);
  const last = builderHistory.undo[builderHistory.undo.length - 1];
  if (last && last.key === key) return;
  builderHistory.undo.push({ key, snapshot, label });
  if (builderHistory.undo.length > BUILDER_HISTORY_LIMIT) builderHistory.undo.shift();
  builderHistory.redo = [];
  updateBuilderHistoryButtons();
}

function restoreBuilderSnapshot(snapshot) {
  if (!snapshot) return;
  builderHistory.applying = true;
  try {
    state.graph = snapshot.graph
      ? JSON.parse(JSON.stringify(snapshot.graph))
      : createGraphForShape(getSelectedShape());
    state.shelfAddons = snapshot.shelfAddons
      ? JSON.parse(JSON.stringify(snapshot.shelfAddons))
      : {};
    closeModal("#presetModuleOptionModal");
    closePreviewAddTypePicker();
    closePreviewModuleActionModal();
    closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
    resetPreviewAddFlowState(previewAddFlowState);
    resetPresetModuleOptionFlowState(presetModuleOptionFlowState);
    resetPreviewModuleActionFlowState(previewModuleActionFlowState);
    resetPreviewPresetPickerFlowState(previewPresetPickerFlowState);
    activeCornerOptionId = null;
    activeBayOptionId = null;
    inlineInsertPendingFirstSaveEdgeId = "";
    normalizeDanglingAnchorIds();
    renderBayInputs();
  } finally {
    builderHistory.applying = false;
  }
  updateBuilderHistoryButtons();
}

function undoBuilderHistory() {
  if (!builderHistory.undo.length) return;
  const current = cloneBuilderStateSnapshot();
  const entry = builderHistory.undo.pop();
  builderHistory.redo.push({ key: getBuilderSnapshotKey(current), snapshot: current, label: "redo" });
  restoreBuilderSnapshot(entry.snapshot);
}

function redoBuilderHistory() {
  if (!builderHistory.redo.length) return;
  const current = cloneBuilderStateSnapshot();
  const entry = builderHistory.redo.pop();
  builderHistory.undo.push({ key: getBuilderSnapshotKey(current), snapshot: current, label: "undo" });
  restoreBuilderSnapshot(entry.snapshot);
}

function collectOpenEndpointsFromCandidates(candidates = []) {
  const buckets = [];
  const threshold = 2;
  candidates.forEach((entry) => {
    const x = Number(entry.x || 0);
    const y = Number(entry.y || 0);
    let bucket = buckets.find((b) => Math.abs(b.x - x) < threshold && Math.abs(b.y - y) < threshold);
    if (!bucket) {
      bucket = { x, y, entries: [] };
      buckets.push(bucket);
    }
    bucket.entries.push(entry);
  });

  const endpoints = [];
  buckets.forEach((bucket) => {
    const entries = bucket.entries;
    if (!entries.length) return;
    const used = new Array(entries.length).fill(false);
    for (let i = 0; i < entries.length; i += 1) {
      if (used[i]) continue;
      let matched = false;
      for (let j = i + 1; j < entries.length; j += 1) {
        if (used[j]) continue;
        if (isOppositeEndpointDirection(entries[i], entries[j])) {
          used[i] = true;
          used[j] = true;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }
    const remaining = entries.filter((_, idx) => !used[idx]);
    const uniqueByDirection = [];
    remaining.forEach((entry) => {
      const dir = normalizeDirection(entry.extendDx, entry.extendDy);
      const exists = uniqueByDirection.find((it) => {
        const sameDir = normalizeDirection(it.extendDx, it.extendDy);
        return sameDir.dx === dir.dx && sameDir.dy === dir.dy;
      });
      if (!exists) uniqueByDirection.push(entry);
    });
    uniqueByDirection.forEach((src) => {
      const base = {
        x: bucket.x,
        y: bucket.y,
        sideIndex: Number(src.sideIndex || 0),
        attachSideIndex: Number(src.attachSideIndex ?? src.sideIndex ?? 0),
        attachAtStart: Boolean(src.attachAtStart),
        cornerId: String(src.cornerId || ""),
        prepend: Boolean(src.attachAtStart),
        extendDx: Number(src.extendDx || 0),
        extendDy: Number(src.extendDy || 0),
        inwardX: Number(src.inwardX || 0),
        inwardY: Number(src.inwardY || 0),
        postBarWidthMm: Math.max(1, Number(src.postBarWidthMm || COLUMN_ENDPOINT_WIDTH_MM)),
        allowedTypes: Array.isArray(src.allowedTypes) ? src.allowedTypes : ["normal", "corner"],
      };
      endpoints.push({
        endpointId: src.endpointId || buildEndpointStableId(base),
        ...base,
      });
    });
  });
  return endpoints;
}

function buildBayEndpointFromPlacement(edge, endpointSide = "end") {
  if (!edge || edge.type !== "bay" || !hasValidPlacement(edge.placement)) return null;
  const placement = edge.placement;
  const drawDir = normalizeDirection(placement.dirDx, placement.dirDy);
  let drawInwardNorm = normalizeDirection(placement.inwardX, placement.inwardY);
  const dot = drawDir.dx * drawInwardNorm.dx + drawDir.dy * drawInwardNorm.dy;
  if (Math.abs(dot) > 0.9) drawInwardNorm = { dx: -drawDir.dy, dy: drawDir.dx };
  const drawInward = { x: drawInwardNorm.dx, y: drawInwardNorm.dy };
  const px = Number(placement.startX || 0);
  const py = Number(placement.startY || 0);
  const widthMm = (Number(edge.width || 0) || 0) + SUPPORT_VISIBLE_MM * 2;
  const startCenterX = px + drawDir.dx * (-COLUMN_ENDPOINT_HALF_MM);
  const startCenterY = py + drawDir.dy * (-COLUMN_ENDPOINT_HALF_MM);
  const endCenterX = px + drawDir.dx * (widthMm + COLUMN_ENDPOINT_HALF_MM);
  const endCenterY = py + drawDir.dy * (widthMm + COLUMN_ENDPOINT_HALF_MM);
  const startSideIndex = directionToSideIndex(-drawDir.dx, -drawDir.dy);
  const endSideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);

  if (endpointSide === "start") {
    return {
      x: startCenterX,
      y: startCenterY,
      sideIndex: startSideIndex,
      attachSideIndex: startSideIndex,
      attachAtStart: true,
      prepend: true,
      extendDx: -drawDir.dx,
      extendDy: -drawDir.dy,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
      postBarWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
      allowedTypes: ["normal", "corner"],
      endpointId: `${String(edge.id || "")}:start`,
    };
  }

  return {
    x: endCenterX,
    y: endCenterY,
    sideIndex: endSideIndex,
    attachSideIndex: endSideIndex,
    attachAtStart: false,
    prepend: false,
    extendDx: drawDir.dx,
    extendDy: drawDir.dy,
    inwardX: drawInward.x,
    inwardY: drawInward.y,
    postBarWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
    allowedTypes: ["normal", "corner"],
    endpointId: `${String(edge.id || "")}:end`,
  };
}

function buildRootEndpoint() {
  return {
    endpointId: "root-endpoint",
    x: 0,
    y: 0,
    sideIndex: 0,
    attachSideIndex: 0,
    attachAtStart: true,
    cornerId: "",
    prepend: true,
    extendDx: 1,
    extendDy: 0,
    inwardX: 0,
    inwardY: 1,
    postBarWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
    allowedTypes: ["normal", "corner"],
  };
}

function getEdgeEndpointAliasSets(edge) {
  const startAliases = new Set([`${String(edge?.id || "")}:start`]);
  const endAliases = new Set([`${String(edge?.id || "")}:end`]);
  if (!edge || !hasValidPlacement(edge.placement)) {
    return { startAliases, endAliases };
  }

  const placement = edge.placement;
  const depthMm = 400;
  const drawDir = normalizeDirection(placement.dirDx, placement.dirDy);
  let drawInwardNorm = normalizeDirection(placement.inwardX, placement.inwardY);
  const dot = drawDir.dx * drawInwardNorm.dx + drawDir.dy * drawInwardNorm.dy;
  if (Math.abs(dot) > 0.9) drawInwardNorm = { dx: -drawDir.dy, dy: drawDir.dx };
  const drawInward = { x: drawInwardNorm.dx, y: drawInwardNorm.dy };
  const px = Number(placement.startX || 0);
  const py = Number(placement.startY || 0);

  if (edge.type !== "corner") {
    const widthMm = (Number(edge.width || 0) || 0) + SUPPORT_VISIBLE_MM * 2;
    const startCenterX = px + drawDir.dx * (-COLUMN_ENDPOINT_HALF_MM);
    const startCenterY = py + drawDir.dy * (-COLUMN_ENDPOINT_HALF_MM);
    const endCenterX = px + drawDir.dx * (widthMm + COLUMN_ENDPOINT_HALF_MM);
    const endCenterY = py + drawDir.dy * (widthMm + COLUMN_ENDPOINT_HALF_MM);
    startAliases.add(
      buildEndpointStableId({
        x: startCenterX,
        y: startCenterY,
        extendDx: -drawDir.dx,
        extendDy: -drawDir.dy,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
      })
    );
    endAliases.add(
      buildEndpointStableId({
        x: endCenterX,
        y: endCenterY,
        extendDx: drawDir.dx,
        extendDy: drawDir.dy,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
      })
    );
    return { startAliases, endAliases };
  }

  const secondDir = { dx: drawInward.x, dy: drawInward.y };
  const primarySideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);
  const { primaryMm: primaryNominal, secondaryMm: secondaryNominal } = getResolvedCornerArmLengthsMm(edge, {
    primarySideIndex,
    secondarySideIndex: directionToSideIndex(secondDir.dx, secondDir.dy),
  });
  const primaryLen = primaryNominal + SUPPORT_VISIBLE_MM * 2;
  const secondLen = secondaryNominal + SUPPORT_VISIBLE_MM * 2;
  const secondInward = { x: -drawDir.dx, y: -drawDir.dy };
  const secondStartX = px + drawDir.dx * primaryLen;
  const secondStartY = py + drawDir.dy * primaryLen;
  const startCenterX = px + drawDir.dx * (-COLUMN_ENDPOINT_HALF_MM);
  const startCenterY = py + drawDir.dy * (-COLUMN_ENDPOINT_HALF_MM);
  const secondEndCenterX = secondStartX + secondDir.dx * (secondLen + COLUMN_ENDPOINT_HALF_MM);
  const secondEndCenterY = secondStartY + secondDir.dy * (secondLen + COLUMN_ENDPOINT_HALF_MM);

  startAliases.add(
    buildEndpointStableId({
      x: startCenterX,
      y: startCenterY,
      extendDx: -drawDir.dx,
      extendDy: -drawDir.dy,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
    })
  );
  endAliases.add(
    buildEndpointStableId({
      x: secondEndCenterX,
      y: secondEndCenterY,
      extendDx: secondDir.dx,
      extendDy: secondDir.dy,
      inwardX: secondInward.x,
      inwardY: secondInward.y,
    })
  );
  return { startAliases, endAliases };
}

function getEdgeEndpointDirections(edge) {
  if (!edge || !hasValidPlacement(edge.placement)) {
    return {
      start: { dx: 1, dy: 0 },
      end: { dx: 1, dy: 0 },
    };
  }
  const placement = edge.placement;
  const drawDir = normalizeDirection(placement.dirDx, placement.dirDy);
  let inward = normalizeDirection(placement.inwardX, placement.inwardY);
  const dot = drawDir.dx * inward.dx + drawDir.dy * inward.dy;
  if (Math.abs(dot) > 0.9) inward = { dx: -drawDir.dy, dy: drawDir.dx };

  if (edge.type === "corner") {
    return {
      start: { dx: -drawDir.dx, dy: -drawDir.dy },
      end: { dx: inward.dx, dy: inward.dy },
    };
  }
  return {
    start: { dx: -drawDir.dx, dy: -drawDir.dy },
    end: { dx: drawDir.dx, dy: drawDir.dy },
  };
}

function resolveAnchorForDirection(anchorId, preferredDir = null, { includePending = false } = {}) {
  const raw = String(anchorId || "");
  if (!raw || raw === "root-endpoint") return "root-endpoint";
  const edges = includePending
    ? getOrderedGraphEdges({ includePending: true })
    : getOrderedCommittedGraphEdges();
  let parent = null;
  let canonical = "";

  const directMatch = raw.match(/^(.+):(start|end)$/);
  if (directMatch) {
    const edgeId = String(directMatch[1] || "");
    const edge = edges.find((it) => String(it?.id || "") === edgeId);
    if (edge) {
      parent = edge;
      canonical = `${edgeId}:${directMatch[2]}`;
    }
  }

  if (!parent) {
    for (let i = 0; i < edges.length; i += 1) {
      const edge = edges[i];
      const { startAliases, endAliases } = getEdgeEndpointAliasSets(edge);
      if (startAliases.has(raw)) {
        parent = edge;
        canonical = `${String(edge.id || "")}:start`;
        break;
      }
      if (endAliases.has(raw)) {
        parent = edge;
        canonical = `${String(edge.id || "")}:end`;
        break;
      }
    }
  }

  if (!parent) return "";
  if (!preferredDir) return canonical || raw;
  const pref = normalizeDirection(preferredDir.dx, preferredDir.dy);
  const dirs = getEdgeEndpointDirections(parent);
  const scoreStart = pref.dx * dirs.start.dx + pref.dy * dirs.start.dy;
  const scoreEnd = pref.dx * dirs.end.dx + pref.dy * dirs.end.dy;
  // Keep the current anchor side when direction scoring is tied.
  if (Math.abs(scoreEnd - scoreStart) < 1e-6) {
    return canonical || raw;
  }
  return `${String(parent.id || "")}:${scoreEnd > scoreStart ? "end" : "start"}`;
}

function applyRootAnchorVector(edge, preferredDir, preferredInward = null) {
  const dir = normalizeDirection(preferredDir?.dx, preferredDir?.dy);
  let inward = preferredInward
    ? normalizeDirection(preferredInward.dx, preferredInward.dy)
    : { dx: -dir.dy, dy: dir.dx };
  const dot = dir.dx * inward.dx + dir.dy * inward.dy;
  if (Math.abs(dot) > 0.9) inward = { dx: -dir.dy, dy: dir.dx };
  edge.anchorDirDx = dir.dx;
  edge.anchorDirDy = dir.dy;
  edge.anchorInwardX = inward.dx;
  edge.anchorInwardY = inward.dy;
}

function clearRootAnchorVector(edge) {
  delete edge.anchorDirDx;
  delete edge.anchorDirDy;
  delete edge.anchorInwardX;
  delete edge.anchorInwardY;
}

function normalizeDanglingAnchorIds() {
  const edges = getOrderedGraphEdges({ includePending: true });
  const existingIds = new Set(edges.map((it) => String(it?.id || "")));
  edges.forEach((edge) => {
    const currentAnchor = String(edge.anchorEndpointId || "");
    if (!currentAnchor || currentAnchor === "root-endpoint") return;
    const explicitMatch = currentAnchor.match(/^(.+):(start|end)$/);
    if (explicitMatch) {
      const parentId = String(explicitMatch[1] || "");
      if (!existingIds.has(parentId)) {
        edge.anchorEndpointId = "root-endpoint";
        edge.placement = null;
        return;
      }
      if (parentId === String(edge.id || "")) {
        edge.anchorEndpointId = "root-endpoint";
        edge.placement = null;
        return;
      }
      // Explicit canonical anchor should be preserved as-is.
      return;
    }
    const preferredDir = hasValidPlacement(edge.placement)
      ? normalizeDirection(edge.placement.dirDx, edge.placement.dirDy)
      : null;
    const normalizedAnchor = resolveAnchorForDirection(currentAnchor, preferredDir, {
      includePending: true,
    });
    if (!normalizedAnchor) {
      edge.anchorEndpointId = "root-endpoint";
      edge.placement = null;
      return;
    }
    if (normalizedAnchor.startsWith(`${String(edge.id || "")}:`)) {
      edge.anchorEndpointId = "root-endpoint";
      edge.placement = null;
      return;
    }
    edge.anchorEndpointId = normalizedAnchor;
    if (normalizedAnchor !== "root-endpoint") {
      clearRootAnchorVector(edge);
    }
  });
}

function buildSectionRunsFromSegments(segments = []) {
  if (!Array.isArray(segments) || !segments.length) return [];
  const lineBuckets = new Map();
  segments.forEach((seg) => {
    const orientation = seg.orientation === "vertical" ? "vertical" : "horizontal";
    const edgeHint = String(seg.edgeHint || "");
    if (!edgeHint) return;
    const lineCoord = Number(seg.lineCoord || 0);
    const a0 = Number(seg.axisStart || 0);
    const a1 = Number(seg.axisEnd || 0);
    const totalMm = Math.max(0, Number(seg.totalMm || 0));
    if (
      !Number.isFinite(lineCoord) ||
      !Number.isFinite(a0) ||
      !Number.isFinite(a1) ||
      !Number.isFinite(totalMm)
    ) {
      return;
    }
    const axisStart = Math.min(a0, a1);
    const axisEnd = Math.max(a0, a1);
    const lineKey = Math.round(lineCoord * 10) / 10;
    const key = `${orientation}:${lineKey}:${edgeHint}`;
    if (!lineBuckets.has(key)) lineBuckets.set(key, []);
    lineBuckets.get(key).push({
      orientation,
      edgeHint,
      lineCoord: lineKey,
      axisStart,
      axisEnd,
      totalMm,
    });
  });

  const runs = [];
  const mergeGapMm = 2;
  lineBuckets.forEach((items) => {
    const sorted = items.sort((a, b) => {
      if (a.axisStart !== b.axisStart) return a.axisStart - b.axisStart;
      return a.axisEnd - b.axisEnd;
    });
    let current = null;
    sorted.forEach((item) => {
      if (!current) {
        current = { ...item };
        return;
      }
      if (item.axisStart <= current.axisEnd + mergeGapMm) {
        current.axisEnd = Math.max(current.axisEnd, item.axisEnd);
        current.totalMm += item.totalMm;
        return;
      }
      runs.push(current);
      current = { ...item };
    });
    if (current) runs.push(current);
  });
  return runs;
}

function calcSectionUsedWidthWithPostBarsMm({
  shelfTotalMm = 0,
  postBarCount = 0,
  postBarTotalMm = NaN,
} = {}) {
  // Section usage is measured with post bars included.
  const safeShelfMm = Math.max(0, Number(shelfTotalMm || 0));
  const explicitPostBarTotalMm = Number(postBarTotalMm);
  if (Number.isFinite(explicitPostBarTotalMm) && explicitPostBarTotalMm >= 0) {
    return safeShelfMm + explicitPostBarTotalMm;
  }
  const safePostBarCount = Math.max(0, Math.floor(Number(postBarCount || 0)));
  if (safePostBarCount <= 0) return safeShelfMm;
  const endpointCount = Math.min(2, safePostBarCount);
  const innerCount = Math.max(0, safePostBarCount - endpointCount);
  const postBarsTotalMm = endpointCount * COLUMN_ENDPOINT_WIDTH_MM + innerCount * COLUMN_WIDTH_MM;
  return safeShelfMm + postBarsTotalMm;
}

function buildOuterSectionLabels(sectionRuns = [], columnMarksByHint = {}) {
  if (!Array.isArray(sectionRuns) || !sectionRuns.length) return [];
  const buckets = {
    top: [],
    right: [],
    bottom: [],
    left: [],
  };

  sectionRuns.forEach((run) => {
    const hint = String(run.edgeHint || "");
    if (!hint || !buckets[hint]) return;
    buckets[hint].push(run);
  });

  const order = ["top", "right", "bottom", "left"];
  const labels = [];
  order.forEach((edgeHint) => {
    const runs = buckets[edgeHint] || [];
    if (!runs.length) return;
    const shelfTotalMm = runs.reduce((sum, run) => sum + Math.max(0, Number(run.totalMm || 0)), 0);
    const columnMarks = columnMarksByHint?.[edgeHint];
    const columnCount =
      columnMarks && typeof columnMarks.size === "number" ? Number(columnMarks.size || 0) : 0;
    let postBarTotalMm = NaN;
    if (columnMarks instanceof Map) {
      postBarTotalMm = Array.from(columnMarks.values()).reduce((sum, entry) => {
        const widthMm =
          entry && typeof entry === "object"
            ? Number(entry.widthMm || 0)
            : Number(entry || 0);
        return sum + Math.max(0, widthMm);
      }, 0);
    }
    const totalMm = calcSectionUsedWidthWithPostBarsMm({
      shelfTotalMm,
      postBarCount: columnCount,
      postBarTotalMm,
    });
    const axisStart = Math.min(...runs.map((run) => Number(run.axisStart || 0)));
    const axisEnd = Math.max(...runs.map((run) => Number(run.axisEnd || 0)));
    const lineCoord = runs.reduce((sum, run) => sum + Number(run.lineCoord || 0), 0) / runs.length;
    const horizontal = edgeHint === "top" || edgeHint === "bottom";
    labels.push({
      edgeHint,
      orientation: horizontal ? "horizontal" : "vertical",
      axisStart,
      axisEnd,
      lineCoord,
      totalMm,
      x: horizontal ? (axisStart + axisEnd) / 2 : lineCoord,
      y: horizontal ? lineCoord : (axisStart + axisEnd) / 2,
      overflow: false,
    });
  });
  return labels;
}

function updatePreviewWidthSummary(input, sectionRuns = null) {
  const widthSummaryEl = $("#previewWidthSummary");
  if (!widthSummaryEl) return;
  const layout = getLayoutConfigSnapshot(input);
  const targetSections = (layout.sections || [])
    .map((section, idx) => ({
      idx,
      label: section.label || `설치공간${idx + 1}`,
      lengthMm: Math.max(0, Number(section.lengthMm || 0)),
    }))
    .filter((section) => section.lengthMm > 0);
  const runs = Array.isArray(sectionRuns)
    ? sectionRuns.filter((run) => Number(run?.totalMm || 0) > 0)
    : [];
  if (!runs.length) {
    if (targetSections.length) {
      widthSummaryEl.textContent = `레이아웃 목표: ${targetSections
        .map((section) => `${section.label} ${section.lengthMm}mm`)
        .join(" | ")}`;
      return;
    }
    widthSummaryEl.textContent = "적용 너비 합계: -";
    return;
  }
  const hintPriority = { top: 0, right: 1, bottom: 2, left: 3 };
  const ordered = [...runs].sort((a, b) => {
    const ap = hintPriority[String(a?.edgeHint || "")] ?? 99;
    const bp = hintPriority[String(b?.edgeHint || "")] ?? 99;
    if (ap !== bp) return ap - bp;
    const ac = (Number(a?.axisStart || 0) + Number(a?.axisEnd || 0)) / 2;
    const bc = (Number(b?.axisStart || 0) + Number(b?.axisEnd || 0)) / 2;
    return ac - bc;
  });
  const segments = [];
  ordered.forEach((run, idx) => {
    const used = Math.round(Math.max(COLUMN_ENDPOINT_WIDTH_MM, Number(run.totalMm || 0)));
    const targetLength = Number(targetSections[idx]?.lengthMm || 0);
    if (targetLength > 0) {
      segments.push(`설치공간${idx + 1} ${used}/${targetLength}mm`);
      return;
    }
    segments.push(`설치공간${idx + 1} ${used}mm`);
  });
  if (!segments.length) {
    widthSummaryEl.textContent = "적용 너비 합계: -";
    return;
  }
  widthSummaryEl.textContent = `사용/전체(포스트바 포함): ${segments.join(" | ")}`;
}

function updateShelfAddButtonState(input) {
  const canAddFromPreview = isPreviewBuilderReady(input);
  const previewDisabledReason = canAddFromPreview ? "" : getPreviewBuilderDisabledReason(input);
  document.querySelectorAll("[data-add-shelf]").forEach((btn) => {
    applyPreviewAddButtonState(btn, {
      enabled: canAddFromPreview,
      reason: previewDisabledReason,
    });
  });
}

function updatePreview() {
  const input = readCurrentInputs();
  const shelfMat = SYSTEM_SHELF_MATERIALS[input.shelf.materialId];
  const columnMat = SYSTEM_COLUMN_MATERIALS[input.column.materialId];
  const frame = $("#systemPreviewFrame");
  const shelvesEl = $("#systemPreviewShelves");
  const textEl = $("#systemPreviewText");
  if (!frame || !shelvesEl || !textEl) return;
  hidePreviewAddTooltip();
  const frameRect = frame.getBoundingClientRect();
  const frameW = frameRect.width || 260;
  const frameH = frameRect.height || 220;
  previewFrameLastSize = {
    width: Math.round(Number(frameW || 0)),
    height: Math.round(Number(frameH || 0)),
  };
  const shortSide = Math.min(frameW, frameH);
  const uiScale = Math.max(0.8, Math.min(1.15, shortSide / 520));
  const coarsePointer =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const addBtnMinSize = coarsePointer ? 40 : 22;
  const addBtnMaxSize = coarsePointer ? 44 : 32;
  const addBtnBaseSize = coarsePointer ? 40 : 28;
  const addBtnSize = Math.max(
    addBtnMinSize,
    Math.min(addBtnMaxSize, Math.round(addBtnBaseSize * uiScale))
  );
  const dimFontSize = Math.round(11 * uiScale);
  const dimPaddingX = Math.max(4, Math.round(6 * uiScale));
  const dimPaddingY = Math.max(1, Math.round(2 * uiScale));
  shelvesEl.style.setProperty("--preview-add-btn-size", `${addBtnSize}px`);
  shelvesEl.style.setProperty("--preview-dim-font-size", `${dimFontSize}px`);
  shelvesEl.style.setProperty("--preview-dim-padding-x", `${dimPaddingX}px`);
  shelvesEl.style.setProperty("--preview-dim-padding-y", `${dimPaddingY}px`);
  frame.querySelectorAll(".system-column").forEach((col) => {
    col.style.display = "none";
  });

  const bays = readBayInputs({ includePending: true });
  const edges = getPreviewOrderedEdges(getOrderedGraphEdges({ includePending: true }));
  const hasShelfBase = Boolean(shelfMat && input.shelf.thickness);
  const hasColumn = Boolean(columnMat && input.column.minLength && input.column.maxLength);
  let canAddFromPreview = false;
  let previewDisabledReason = "";
  const showModuleInfo = previewInfoMode === "module";
  const showSizeInfo = !showModuleInfo;
  updatePreviewWidthSummary(input, []);
  syncLayoutSectionUsageSnapshot([], input);
  canAddFromPreview = isPreviewBuilderReady(input);
  previewDisabledReason = canAddFromPreview ? "" : getPreviewBuilderDisabledReason(input);

  if (!hasShelfBase || !hasColumn) {
    textEl.textContent = `${buildLayoutPreviewSummaryText(input)} · 옵션 선택 후 모듈을 추가하면 미리보기가 표시됩니다.`;
    shelvesEl.innerHTML = "";
    clearPreviewGhost();
    previewAddButtonPlacementHints = new Map();
    if (!bays.length) {
      previewOpenEndpoints = new Map();
      const rootEndpoint = buildRootEndpoint();
      const startBtn = document.createElement("button");
      startBtn.type = "button";
      startBtn.className = "system-preview-add-btn";
      startBtn.dataset.addShelf = "0";
      startBtn.dataset.addRootStart = "true";
      startBtn.dataset.attachSide = "0";
      startBtn.dataset.attachAtStart = "true";
      startBtn.dataset.endpointId = "root-endpoint";
      startBtn.title = "첫 모듈 추가";
      startBtn.textContent = "+";
      applyPreviewAddButtonState(startBtn, {
        enabled: canAddFromPreview,
        reason: previewDisabledReason,
      });
      startBtn.style.left = `${frameW / 2}px`;
      startBtn.style.top = `${frameH / 2}px`;
      shelvesEl.appendChild(startBtn);
      bindAddButtonPreviewInteractions(startBtn, rootEndpoint, canAddFromPreview);
      previewOpenEndpoints.set("root-endpoint", rootEndpoint);
    }
    return;
  }

  shelvesEl.innerHTML = "";
  clearPreviewGhost();
  textEl.textContent = buildPreviewOptionText(input, shelfMat, columnMat);

  const depthMm = 400;
  const shelves = [];
  const columnCenters = [];
  const endpointCandidates = [];
  const sectionColumnMarks = {
    top: new Map(),
    right: new Map(),
    bottom: new Map(),
    left: new Map(),
  };
  const toSectionAxisKey = (value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "0";
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  const markSectionColumn = (edgeHint, centerX, centerY, widthMm = COLUMN_ENDPOINT_WIDTH_MM) => {
    const hint = String(edgeHint || "");
    const bucket = sectionColumnMarks[hint];
    if (!bucket) return;
    const axisValue =
      hint === "top" || hint === "bottom" ? Number(centerX || 0) : Number(centerY || 0);
    const axisKey = toSectionAxisKey(axisValue);
    const normalizedWidthMm = Math.max(1, Number(widthMm || COLUMN_ENDPOINT_WIDTH_MM));
    const prev = bucket.get(axisKey);
    if (!prev) {
      bucket.set(axisKey, { count: 1, widthMm: normalizedWidthMm });
      return;
    }
    const nextCount = Math.max(1, Number(prev.count || 0)) + 1;
    // Shared posts in the same section line are treated as inner posts(30mm).
    const nextWidthMm =
      nextCount > 1
        ? Math.max(COLUMN_WIDTH_MM, Number(prev.widthMm || 0), normalizedWidthMm)
        : Math.max(1, Number(prev.widthMm || 0), normalizedWidthMm);
    bucket.set(axisKey, { count: nextCount, widthMm: nextWidthMm });
  };
  const sectionLengthSegments = [];
  const recordSectionSegment = ({
    startX,
    startY,
    endX,
    endY,
    nominalLength = 0,
    inwardX = 0,
    inwardY = 1,
  } = {}) => {
    const sx = Number(startX || 0);
    const sy = Number(startY || 0);
    const ex = Number(endX || 0);
    const ey = Number(endY || 0);
    if (
      !Number.isFinite(sx) ||
      !Number.isFinite(sy) ||
      !Number.isFinite(ex) ||
      !Number.isFinite(ey)
    ) {
      return;
    }
    const horizontal = Math.abs(ex - sx) >= Math.abs(ey - sy);
    sectionLengthSegments.push({
      orientation: horizontal ? "horizontal" : "vertical",
      edgeHint: getEdgeHintFromInward(inwardX, inwardY),
      lineCoord: horizontal ? (sy + ey) / 2 : (sx + ex) / 2,
      axisStart: horizontal ? Math.min(sx, ex) : Math.min(sy, ey),
      axisEnd: horizontal ? Math.max(sx, ex) : Math.max(sy, ey),
      // Section width is calculated as: (sum of shelf widths) + (sum of column widths).
      totalMm: Math.max(0, Number(nominalLength || 0)),
    });
  };
  const resolvedOpenEndpoints = new Map();
  const rootEndpoint = buildRootEndpoint();
  const registerResolvedEndpoint = (entry) => {
    if (!entry) return;
    const semanticId = String(entry.endpointId || "");
    if (semanticId) resolvedOpenEndpoints.set(semanticId, entry);
    const geometricId = buildEndpointStableId(entry);
    if (geometricId) resolvedOpenEndpoints.set(geometricId, entry);
  };
  const consumeResolvedEndpoint = (endpointId) => {
    const key = String(endpointId || "");
    if (!key || key === "root-endpoint") return;
    const endpoint = resolvedOpenEndpoints.get(key);
    if (!endpoint) {
      resolvedOpenEndpoints.delete(key);
      return;
    }
    Array.from(resolvedOpenEndpoints.entries()).forEach(([mapKey, value]) => {
      if (value === endpoint) resolvedOpenEndpoints.delete(mapKey);
    });
  };
  registerResolvedEndpoint(rootEndpoint);

  edges.forEach((edge) => {
    const anchorEndpointId = String(edge.anchorEndpointId || "");
    const anchorEndpoint = anchorEndpointId
      ? resolvedOpenEndpoints.get(anchorEndpointId) || null
      : null;
    let placement = hasValidPlacement(edge.placement) ? edge.placement : null;
    if (anchorEndpoint) {
      let placementSource = anchorEndpoint;
      const hasAnchorDir =
        Number.isFinite(Number(edge.anchorDirDx)) && Number.isFinite(Number(edge.anchorDirDy));
      const hasAnchorInward =
        Number.isFinite(Number(edge.anchorInwardX)) &&
        Number.isFinite(Number(edge.anchorInwardY));
      if ((hasAnchorDir || hasAnchorInward) && anchorEndpointId === "root-endpoint") {
        const dir = hasAnchorDir
          ? normalizeDirection(edge.anchorDirDx, edge.anchorDirDy)
          : normalizeDirection(anchorEndpoint.extendDx, anchorEndpoint.extendDy);
        let inward = hasAnchorInward
          ? normalizeDirection(edge.anchorInwardX, edge.anchorInwardY)
          : normalizeDirection(anchorEndpoint.inwardX, anchorEndpoint.inwardY);
        const dot = dir.dx * inward.dx + dir.dy * inward.dy;
        if (Math.abs(dot) > 0.9) inward = { dx: -dir.dy, dy: dir.dx };
        placementSource = {
          ...anchorEndpoint,
          extendDx: dir.dx,
          extendDy: dir.dy,
          inwardX: inward.dx,
          inwardY: inward.dy,
        };
      }
      const anchoredPlacement = buildPlacementFromEndpoint(placementSource);
      if (anchoredPlacement) placement = anchoredPlacement;
      consumeResolvedEndpoint(anchorEndpointId);
    }
    if (!placement) {
      const hasAnchorDir =
        Number.isFinite(Number(edge.anchorDirDx)) && Number.isFinite(Number(edge.anchorDirDy));
      const hasAnchorInward =
        Number.isFinite(Number(edge.anchorInwardX)) &&
        Number.isFinite(Number(edge.anchorInwardY));
      const rootSource = buildRootEndpoint();
      const dir = hasAnchorDir
        ? normalizeDirection(edge.anchorDirDx, edge.anchorDirDy)
        : normalizeDirection(rootSource.extendDx, rootSource.extendDy);
      let inward = hasAnchorInward
        ? normalizeDirection(edge.anchorInwardX, edge.anchorInwardY)
        : normalizeDirection(rootSource.inwardX, rootSource.inwardY);
      const dot = dir.dx * inward.dx + dir.dy * inward.dy;
      if (Math.abs(dot) > 0.9) inward = { dx: -dir.dy, dy: dir.dx };
      placement = buildPlacementFromEndpoint({
        ...rootSource,
        extendDx: dir.dx,
        extendDy: dir.dy,
        inwardX: inward.dx,
        inwardY: inward.dy,
      });
    }
    if (!placement) {
      // Keep endpoint model deterministic: unresolved edges are skipped rather than placed by side fallback.
      return;
    }

    const drawDirNormalized = normalizeDirection(placement.dirDx, placement.dirDy);
    let drawInwardNormalized = normalizeDirection(placement.inwardX, placement.inwardY);
    const dot =
      drawDirNormalized.dx * drawInwardNormalized.dx +
      drawDirNormalized.dy * drawInwardNormalized.dy;
    if (Math.abs(dot) > 0.9) {
      drawInwardNormalized = { dx: -drawDirNormalized.dy, dy: drawDirNormalized.dx };
    }
    const drawDir = { dx: drawDirNormalized.dx, dy: drawDirNormalized.dy };
    const drawInward = { x: drawInwardNormalized.dx, y: drawInwardNormalized.dy };
    const px = Number(placement.startX || 0);
    const py = Number(placement.startY || 0);
    edge.placement = {
      startX: px,
      startY: py,
      dirDx: drawDir.dx,
      dirDy: drawDir.dy,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
    };

    const primarySideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);
    const edgeHint = getEdgeHintFromDir(drawDir);
    const primarySegmentHint = getEdgeHintFromInward(drawInward.x, drawInward.y);

    if (edge.type !== "corner") {
      const widthMm = (Number(edge.width || 0) || 0) + SUPPORT_VISIBLE_MM * 2;
      recordSectionSegment({
        startX: px,
        startY: py,
        endX: px + drawDir.dx * widthMm,
        endY: py + drawDir.dy * widthMm,
        nominalLength: Number(edge.width || 0),
        inwardX: drawInward.x,
        inwardY: drawInward.y,
      });
      const startCenterX = px + drawDir.dx * (-COLUMN_ENDPOINT_HALF_MM);
      const startCenterY = py + drawDir.dy * (-COLUMN_ENDPOINT_HALF_MM);
      const endCenterX = px + drawDir.dx * (widthMm + COLUMN_ENDPOINT_HALF_MM);
      const endCenterY = py + drawDir.dy * (widthMm + COLUMN_ENDPOINT_HALF_MM);
      markSectionColumn(primarySegmentHint, startCenterX, startCenterY);
      markSectionColumn(primarySegmentHint, endCenterX, endCenterY);
      pushUniquePoint(columnCenters, {
        x: startCenterX,
        y: startCenterY,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        edgeHint,
        columnWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
      });
      pushUniquePoint(columnCenters, {
        x: endCenterX,
        y: endCenterY,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        edgeHint,
        columnWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
      });
      const startSideIndex = directionToSideIndex(-drawDir.dx, -drawDir.dy);
      const endSideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);
      const startCandidate = {
        x: startCenterX,
        y: startCenterY,
        sideIndex: startSideIndex,
        attachSideIndex: startSideIndex,
        attachAtStart: true,
        extendDx: -drawDir.dx,
        extendDy: -drawDir.dy,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        postBarWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
        allowedTypes: ["normal", "corner"],
      };
      startCandidate.endpointId = `${edge.id}:start`;
      endpointCandidates.push(startCandidate);
      registerResolvedEndpoint(startCandidate);
      const endCandidate = {
        x: endCenterX,
        y: endCenterY,
        sideIndex: endSideIndex,
        attachSideIndex: endSideIndex,
        attachAtStart: false,
        extendDx: drawDir.dx,
        extendDy: drawDir.dy,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        postBarWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
        allowedTypes: ["normal", "corner"],
        endpointId: `${edge.id}:end`,
      };
      endpointCandidates.push(endCandidate);
      registerResolvedEndpoint(endCandidate);

      const rect = buildRectBounds(px, py, drawDir, drawInward, widthMm, depthMm);
      shelves.push({
        id: edge.id,
        isCorner: false,
        title: "모듈 옵션 수정",
        minX: rect.minX,
        minY: rect.minY,
        maxX: rect.maxX,
        maxY: rect.maxY,
      });
      return;
    }

    const corner = edge;
    const secondDir = { dx: drawInward.x, dy: drawInward.y };
    const secondSideIndex = directionToSideIndex(secondDir.dx, secondDir.dy);
    const { primaryMm: primaryNominal, secondaryMm: secondaryNominal } = getResolvedCornerArmLengthsMm(corner, {
      primarySideIndex,
      secondarySideIndex: secondSideIndex,
    });
    const primaryLen = primaryNominal + SUPPORT_VISIBLE_MM * 2;
    const secondLen = secondaryNominal + SUPPORT_VISIBLE_MM * 2;
    recordSectionSegment({
      startX: px,
      startY: py,
      endX: px + drawDir.dx * primaryLen,
      endY: py + drawDir.dy * primaryLen,
      nominalLength: primaryNominal,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
    });

    const secondInward = { x: -drawDir.dx, y: -drawDir.dy };
    const secondarySegmentHint = getEdgeHintFromInward(secondInward.x, secondInward.y);
    const secondStartX = px + drawDir.dx * primaryLen;
    const secondStartY = py + drawDir.dy * primaryLen;
    recordSectionSegment({
      startX: secondStartX,
      startY: secondStartY,
      endX: secondStartX + secondDir.dx * secondLen,
      endY: secondStartY + secondDir.dy * secondLen,
      nominalLength: secondaryNominal,
      inwardX: secondInward.x,
      inwardY: secondInward.y,
    });

    const startCenterX = px + drawDir.dx * (-COLUMN_ENDPOINT_HALF_MM);
    const startCenterY = py + drawDir.dy * (-COLUMN_ENDPOINT_HALF_MM);
    const secondEndCenter = {
      x: secondStartX + secondDir.dx * (secondLen + COLUMN_ENDPOINT_HALF_MM),
      y: secondStartY + secondDir.dy * (secondLen + COLUMN_ENDPOINT_HALF_MM),
    };
    markSectionColumn(primarySegmentHint, startCenterX, startCenterY);
    markSectionColumn(secondarySegmentHint, secondEndCenter.x, secondEndCenter.y);

    const startCandidate = {
      x: startCenterX,
      y: startCenterY,
      sideIndex: directionToSideIndex(-drawDir.dx, -drawDir.dy),
      attachSideIndex: directionToSideIndex(-drawDir.dx, -drawDir.dy),
      attachAtStart: true,
      extendDx: -drawDir.dx,
      extendDy: -drawDir.dy,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
      postBarWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
      allowedTypes: ["normal", "corner"],
    };
    startCandidate.endpointId = `${edge.id}:start`;
    endpointCandidates.push(startCandidate);
    registerResolvedEndpoint(startCandidate);
    const secondEndCandidate = {
      x: secondEndCenter.x,
      y: secondEndCenter.y,
      sideIndex: secondSideIndex,
      attachSideIndex: secondSideIndex,
      attachAtStart: false,
      extendDx: secondDir.dx,
      extendDy: secondDir.dy,
      inwardX: secondInward.x,
      inwardY: secondInward.y,
      postBarWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
      allowedTypes: ["normal", "corner"],
    };
    secondEndCandidate.endpointId = `${edge.id}:end`;
    endpointCandidates.push(secondEndCandidate);
    registerResolvedEndpoint(secondEndCandidate);

    pushUniquePoint(columnCenters, {
      x: startCenterX,
      y: startCenterY,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
      edgeHint: getEdgeHintFromDir({ dx: -drawDir.dx, dy: -drawDir.dy }),
      columnWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
    });
    pushUniquePoint(columnCenters, {
      x: secondEndCenter.x,
      y: secondEndCenter.y,
      inwardX: secondInward.x,
      inwardY: secondInward.y,
      edgeHint: getEdgeHintFromDir(secondDir),
      columnWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
    });
    const cornerPostAngleDeg = (Math.atan2(drawDir.dy - secondDir.dy, drawDir.dx - secondDir.dx) * 180) / Math.PI;
    pushUniquePoint(columnCenters, {
      x: secondStartX,
      y: secondStartY,
      inwardX: drawInward.x + secondInward.x,
      inwardY: drawInward.y + secondInward.y,
      edgeHint: "",
      rotationDeg: cornerPostAngleDeg,
      columnRole: "corner-post",
    });

    const currentArm = buildRectBounds(px, py, drawDir, drawInward, primaryLen, depthMm);
    const secondArm = buildRectBounds(
      secondStartX,
      secondStartY,
      secondDir,
      secondInward,
      secondLen,
      depthMm
    );
    shelves.push({
      id: edge.id,
      isCorner: true,
      title: `${getCornerLabel(edge)} 옵션 수정`,
      minX: Math.min(currentArm.minX, secondArm.minX),
      minY: Math.min(currentArm.minY, secondArm.minY),
      maxX: Math.max(currentArm.maxX, secondArm.maxX),
      maxY: Math.max(currentArm.maxY, secondArm.maxY),
      arms: [currentArm, secondArm],
      cornerGeom: {
        originX: px,
        originY: py,
        u: { dx: drawDir.dx, dy: drawDir.dy },
        v: { dx: drawInward.x, dy: drawInward.y },
        primaryLen,
        secondaryLen: secondLen,
        depth: depthMm,
      },
    });
  });

  const sectionRuns = buildSectionRunsFromSegments(sectionLengthSegments);
  const sectionLabels = buildOuterSectionLabels(sectionRuns, sectionColumnMarks);
  const layoutForPreview = getLayoutConfigSnapshot(input);
  const sideWidthLabels = sectionLabels.map((run) => ({
    sectionIndex: 0,
    edgeHint: run.edgeHint,
    x: Number(run.x || 0),
    y: Number(run.y || 0),
    totalMm: Math.round(Math.max(COLUMN_ENDPOINT_WIDTH_MM, Number(run.totalMm || 0))),
    targetMm: 0,
    text: `${Math.round(Math.max(COLUMN_ENDPOINT_WIDTH_MM, Number(run.totalMm || 0)))}mm`,
    overflow: false,
  }));
  sideWidthLabels.forEach((label, idx) => {
    label.sectionIndex = idx;
    const targetMm = Number(layoutForPreview.sections?.[idx]?.lengthMm || 0);
    label.targetMm = targetMm > 0 ? targetMm : 0;
    label.overflow = label.targetMm > 0 && Number(label.totalMm || 0) > label.targetMm;
    if (label.targetMm > 0) {
      label.text = `${Math.round(Number(label.totalMm || 0))}/${Math.round(label.targetMm)}`;
    } else {
      label.text = `${Math.round(Number(label.totalMm || 0))}mm`;
    }
  });
  updatePreviewWidthSummary(input, sectionLabels);
  syncLayoutSectionUsageSnapshot(sideWidthLabels, input);
  canAddFromPreview = isPreviewBuilderReady(input);
  previewDisabledReason = canAddFromPreview ? "" : getPreviewBuilderDisabledReason(input);

  const addButtons = collectOpenEndpointsFromCandidates(endpointCandidates);
  addButtons.forEach((point) => {
    const edgeHint = getEdgeHintFromDir({
      dx: Number(point.extendDx || 0),
      dy: Number(point.extendDy || 0),
    });
    pushUniquePoint(columnCenters, {
      x: Number(point.x || 0),
      y: Number(point.y || 0),
      inwardX: Number(point.inwardX || 0),
      inwardY: Number(point.inwardY || 0),
      edgeHint,
      columnWidthMm: Math.max(1, Number(point.postBarWidthMm || COLUMN_ENDPOINT_WIDTH_MM)),
      isStructuralColumn: false,
    });
  });
  previewOpenEndpoints = new Map(
    addButtons
      .filter((point) => point.endpointId)
      .map((point) => [point.endpointId, { ...point }])
  );

  let minX = 0;
  let maxX = 1;
  let minY = 0;
  let maxY = 1;
  if (shelves.length || addButtons.length) {
    const xPoints = shelves.length
      ? shelves.flatMap((s) => [s.minX, s.maxX])
      : addButtons.map((p) => p.x);
    const yPoints = shelves.length
      ? shelves.flatMap((s) => [s.minY, s.maxY])
      : addButtons.map((p) => p.y);
    minX = Math.min(...xPoints);
    maxX = Math.max(...xPoints);
    minY = Math.min(...yPoints);
    maxY = Math.max(...yPoints);
  }

  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);
  // Keep a dedicated safe area at the top so the preview never collides with
  // the toggle/undo-redo controls, and reduce initial module scale slightly.
  const sidePaddingPx = Math.max(22, Math.min(38, Math.round(addBtnSize * 1.1)));
  const topSafeAreaPx = Math.max(72, Math.min(104, Math.round(addBtnSize * 2.4)));
  const bottomPaddingPx = Math.max(22, Math.min(42, Math.round(addBtnSize * 1.0)));
  const availableW = Math.max(1, frameW - sidePaddingPx * 2);
  const availableH = Math.max(1, frameH - topSafeAreaPx - bottomPaddingPx);
  const fitScaleX = availableW / rangeX;
  const fitScaleY = availableH / rangeY;
  const baseScale = Math.max(0.1, Math.min(fitScaleX, fitScaleY));
  const scale = baseScale * 0.86;
  const tx = sidePaddingPx + (availableW - rangeX * scale) / 2 - minX * scale;
  const ty = topSafeAreaPx + (availableH - rangeY * scale) / 2 - minY * scale;
  setPreviewRenderTransform({ scale, tx, ty, depthMm });
  const shelfBoxesPx = shelves.map((item) => ({
    left: item.minX * scale + tx,
    right: item.maxX * scale + tx,
    top: item.minY * scale + ty,
    bottom: item.maxY * scale + ty,
  }));

  shelves.forEach((item) => {
      const shelf = document.createElement("div");
      shelf.className = "system-shelf";
      if (item.isCorner) {
        shelf.classList.add("system-corner-shelf");
        shelf.dataset.cornerPreview = item.id;
        shelf.title = item.title;
      } else {
        shelf.classList.add("system-bay-shelf");
        shelf.dataset.bayPreview = item.id;
        shelf.title = item.title;
      }
      shelf.style.width = `${(item.maxX - item.minX) * scale}px`;
      shelf.style.height = `${(item.maxY - item.minY) * scale}px`;
      shelf.style.left = `${item.minX * scale + tx}px`;
      shelf.style.top = `${item.minY * scale + ty}px`;
      if (item.isCorner && item.cornerGeom) {
        shelf.style.background = "transparent";
        const svgNs = "http://www.w3.org/2000/svg";
        const svgEl = document.createElementNS(svgNs, "svg");
        svgEl.setAttribute("class", "system-corner-shape-svg");
        const widthPx = Math.max(1, (item.maxX - item.minX) * scale);
        const heightPx = Math.max(1, (item.maxY - item.minY) * scale);
        const cornerRadiusPx = Math.max(4, Math.min(10, 6 * uiScale));
        svgEl.setAttribute("viewBox", `0 0 ${widthPx.toFixed(2)} ${heightPx.toFixed(2)}`);
        svgEl.setAttribute("width", `${widthPx.toFixed(2)}`);
        svgEl.setAttribute("height", `${heightPx.toFixed(2)}`);

        const pathEl = document.createElementNS(svgNs, "path");
        pathEl.setAttribute("class", "system-corner-shape-path");
        const pathD = buildCornerSvgPathData(
          item.cornerGeom,
          scale,
          tx,
          ty,
          item.minX * scale + tx,
          item.minY * scale + ty,
          cornerRadiusPx
        );
        pathEl.setAttribute("d", pathD);
        pathEl.setAttribute("fill", shelfMat.swatch || "#ddd");
        pathEl.setAttribute("stroke", "rgba(0, 0, 0, 0.28)");
        pathEl.setAttribute("stroke-width", "1.25");
        pathEl.setAttribute("stroke-linejoin", "round");
        pathEl.setAttribute("stroke-linecap", "round");
        svgEl.appendChild(pathEl);
        shelf.appendChild(svgEl);
      } else if (item.isCorner && item.arms?.length) {
        shelf.style.background = "transparent";
        item.arms.forEach((arm) => {
          const armEl = document.createElement("div");
          armEl.className = "system-corner-arm";
          armEl.style.left = `${(arm.minX - item.minX) * scale}px`;
          armEl.style.top = `${(arm.minY - item.minY) * scale}px`;
          armEl.style.width = `${(arm.maxX - arm.minX) * scale}px`;
          armEl.style.height = `${(arm.maxY - arm.minY) * scale}px`;
          armEl.style.background = shelfMat.swatch || "#ddd";
          shelf.appendChild(armEl);
        });
      } else {
        shelf.style.background = shelfMat.swatch || "#ddd";
      }
      shelf.addEventListener("mouseenter", () => {
        setPreviewEdgeHoverState(item.id, true);
      });
      shelf.addEventListener("mouseleave", () => {
        setPreviewEdgeHoverState("", false);
      });
      shelvesEl.appendChild(shelf);
  });

  const columnDepthPx = Math.max(COLUMN_DEPTH_MM * scale, 8);
  const columnLabelCenters = [];
  const columnBoxesPx = [];
  columnCenters.forEach((point) => {
    const sumInwardX = Number(point.inwardX || 0);
    const sumInwardY = Number(point.inwardY || 0);
    const inwardLen = Math.hypot(sumInwardX, sumInwardY) || 1;
    const normalizedInwardX = sumInwardX / inwardLen;
    const normalizedInwardY = sumInwardY / inwardLen;
    const isCornerPostBar = String(point.columnRole || "") === "corner-post";
    const insetMm = isCornerPostBar ? 0 : depthMm * (2 / 3);
    const shiftedX = point.x + normalizedInwardX * insetMm;
    const shiftedY = point.y + normalizedInwardY * insetMm;
    const renderX = shiftedX * scale + tx;
    const renderY = shiftedY * scale + ty;
    const edgeRefX = point.x * scale + tx;
    const edgeRefY = point.y * scale + ty;
    const tangentX = -normalizedInwardY;
    const tangentY = normalizedInwardX;
    const pointColumnWidthMm = Math.max(
      1,
      Number(
        point.columnWidthMm ||
          (isCornerPostBar || Number(point.count || 1) > 1 ? COLUMN_WIDTH_MM : COLUMN_ENDPOINT_WIDTH_MM)
      )
    );
    const pointColumnWidthPx = Math.max(pointColumnWidthMm * scale, 4);
    const angleDeg = Number.isFinite(Number(point.rotationDeg))
      ? Number(point.rotationDeg)
      : (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
    const columnEl = document.createElement("div");
    columnEl.className = "system-column system-preview-column-box";
    columnEl.style.width = `${pointColumnWidthPx}px`;
    columnEl.style.height = `${columnDepthPx}px`;
    columnEl.style.left = `${renderX}px`;
    columnEl.style.top = `${renderY}px`;
    columnEl.style.transform = `translate(-50%, -50%) rotate(${angleDeg.toFixed(2)}deg)`;
    columnEl.style.background = columnMat?.swatch || "#d9d9d9";
    shelvesEl.appendChild(columnEl);
    const halfDiag = Math.hypot(pointColumnWidthPx, columnDepthPx) / 2;
    columnBoxesPx.push({
      left: renderX - halfDiag,
      right: renderX + halfDiag,
      top: renderY - halfDiag,
      bottom: renderY + halfDiag,
    });
    columnLabelCenters.push({
      x: renderX,
      y: renderY,
      edgeRefX,
      edgeRefY,
      widthMm: pointColumnWidthMm,
      showDimensionLabel: !isCornerPostBar,
    });
  });

  const dimensionLabels = [];
  const moduleInfoLabels = [];
  const edgeById = new Map(
    edges
      .filter((edge) => edge?.id)
      .map((edge) => [String(edge.id), edge])
  );
  shelves.forEach((item, itemIndex) => {
    const edge = edgeById.get(String(item.id || ""));
    const shelfCount = Math.max(1, Number(edge?.count || 1));
    const addonSummary = formatAddonCompactBreakdown(getShelfAddonIds(item.id));
    const composeInfo = getComposeTabLabelInfo(edge);
    const moduleIndex = Math.max(1, itemIndex + 1);
    if (item.isCorner && item.arms?.length) {
      const primaryArm = item.arms[0] || null;
      const secondaryArm = item.arms[1] || null;
      const getArmOrientation = (arm) => {
        if (!arm) return "";
        const spanX = Math.abs(Number(arm.maxX || 0) - Number(arm.minX || 0));
        const spanY = Math.abs(Number(arm.maxY || 0) - Number(arm.minY || 0));
        return spanX >= spanY ? "horizontal" : "vertical";
      };
      const armNominalLength = (arm) => {
        if (!arm) return 0;
        const lengthWithSupport = Math.max(
          Number(arm.maxX || 0) - Number(arm.minX || 0),
          Number(arm.maxY || 0) - Number(arm.minY || 0)
        );
        return Math.max(0, Math.round(lengthWithSupport - SUPPORT_VISIBLE_MM * 2));
      };
      const primaryLength =
        item.cornerGeom && Number.isFinite(Number(item.cornerGeom.primaryLen))
          ? Math.max(0, Math.round(Number(item.cornerGeom.primaryLen) - SUPPORT_VISIBLE_MM * 2))
          : armNominalLength(primaryArm);
      const secondaryLength =
        item.cornerGeom && Number.isFinite(Number(item.cornerGeom.secondaryLen))
          ? Math.max(0, Math.round(Number(item.cornerGeom.secondaryLen) - SUPPORT_VISIBLE_MM * 2))
          : armNominalLength(secondaryArm);
      const cornerText =
        secondaryLength > 0
          ? `${primaryLength} x ${secondaryLength}`
          : `${primaryLength}`;
      // Prefer the horizontal arm so corner labels sit on the same line as straight-module labels.
      const horizontalArm =
        getArmOrientation(primaryArm) === "horizontal"
          ? primaryArm
          : getArmOrientation(secondaryArm) === "horizontal"
            ? secondaryArm
            : null;
      const labelAnchorArm = horizontalArm || primaryArm || secondaryArm;
      const labelXMm = labelAnchorArm
        ? (Number(labelAnchorArm.minX || 0) + Number(labelAnchorArm.maxX || 0)) / 2
        : (Number(item.minX || 0) + Number(item.maxX || 0)) / 2;
      const labelYMm = labelAnchorArm
        ? (Number(labelAnchorArm.minY || 0) + Number(labelAnchorArm.maxY || 0)) / 2
        : (Number(item.minY || 0) + Number(item.maxY || 0)) / 2;
      dimensionLabels.push({
        edgeId: item.id,
        moduleIndex,
        x: labelXMm * scale + tx,
        y: labelYMm * scale + ty,
        text: cornerText,
        corner: true,
      });
      moduleInfoLabels.push({
        edgeId: item.id,
        x: labelXMm * scale + tx,
        y: labelYMm * scale + ty,
        count: shelfCount,
        addons: addonSummary,
        compose: composeInfo,
        corner: true,
      });
      return;
    }
    const lengthWithSupport = Math.max(item.maxX - item.minX, item.maxY - item.minY);
    const nominalLength = Math.max(
      0,
      Math.round(lengthWithSupport - SUPPORT_VISIBLE_MM * 2)
    );
    dimensionLabels.push({
      edgeId: item.id,
      moduleIndex,
      x: ((item.minX + item.maxX) / 2) * scale + tx,
      y: ((item.minY + item.maxY) / 2) * scale + ty,
      text: `${nominalLength}`,
      corner: false,
    });
    moduleInfoLabels.push({
      edgeId: item.id,
      x: ((item.minX + item.maxX) / 2) * scale + tx,
      y: ((item.minY + item.maxY) / 2) * scale + ty,
      count: shelfCount,
      addons: addonSummary,
      compose: composeInfo,
      corner: false,
    });
  });

  if (showSizeInfo) {
    const compactStates = resolveDimensionLabelCompactStates(dimensionLabels, shelvesEl);
    dimensionLabels.forEach((labelInfo, index) => {
      const labelEl = createDimensionLabelElement(labelInfo, {
        compact: Boolean(compactStates[index]),
      });
      shelvesEl.appendChild(labelEl);
    });
  } else {
    const densityLevels = resolveModuleLabelDensityLevels(moduleInfoLabels, shelvesEl);
    moduleInfoLabels.forEach((labelInfo, index) => {
      const labelEl = createModuleLabelElement(labelInfo, {
        level: densityLevels[index],
        index: index + 1,
      });
      shelvesEl.appendChild(labelEl);
    });
  }

  const outerBoundsPx = shelves.length
    ? {
        minX: Math.min(...shelves.map((item) => item.minX * scale + tx)),
        maxX: Math.max(...shelves.map((item) => item.maxX * scale + tx)),
        minY: Math.min(...shelves.map((item) => item.minY * scale + ty)),
        maxY: Math.max(...shelves.map((item) => item.maxY * scale + ty)),
      }
    : {
        minX: frameW * 0.2,
        maxX: frameW * 0.8,
        minY: frameH * 0.2,
        maxY: frameH * 0.8,
      };
  const edgeOffset = 14;
  const sectionLabelOffset = 36;

  sideWidthLabels.forEach((info) => {
    const labelEl = document.createElement("div");
    labelEl.className = `system-dimension-label system-section-width-label${
      info.overflow ? " system-section-width-label--overflow" : ""
    }`;
    if (info.edgeHint === "left" || info.edgeHint === "right") {
      labelEl.classList.add("system-section-width-label--vertical");
    }
    const sectionPrefix =
      Number.isFinite(Number(info.sectionIndex)) && Number(info.sectionIndex) >= 0
        ? `S${Number(info.sectionIndex) + 1} `
        : "";
    labelEl.textContent = `${sectionPrefix}${info.text}`;
    if (info.overflow) {
      labelEl.setAttribute("aria-label", `${sectionPrefix.trim()} 사용 너비가 전체를 초과했습니다`);
    }
    const isVerticalSectionLabel = info.edgeHint === "left" || info.edgeHint === "right";
    const labelTextLength = String(labelEl.textContent || "").length;
    if (labelTextLength >= 11) labelEl.classList.add("system-section-width-label--compact");
    if (Number(info.targetMm || 0) > 0) {
      labelEl.title = `설치공간${Number(info.sectionIndex) + 1}: 사용 ${Number(info.totalMm || 0)}mm / 전체 ${Number(info.targetMm)}mm`;
    }
    const dynamicSectionLabelOffset =
      sectionLabelOffset +
      (labelTextLength >= 11 ? 10 : labelTextLength >= 9 ? 6 : 0) +
      (isVerticalSectionLabel ? 6 : 0) +
      (info.overflow ? 4 : 0);
    let placedX = Number.isFinite(info.x)
      ? info.x * scale + tx
      : (outerBoundsPx.minX + outerBoundsPx.maxX) / 2;
    let placedY = Number.isFinite(info.y)
      ? info.y * scale + ty
      : (outerBoundsPx.minY + outerBoundsPx.maxY) / 2;
    if (info.edgeHint === "top") {
      placedY = outerBoundsPx.minY - dynamicSectionLabelOffset;
      if (!Number.isFinite(info.x)) placedX = (outerBoundsPx.minX + outerBoundsPx.maxX) / 2;
    } else if (info.edgeHint === "right") {
      placedX = outerBoundsPx.maxX + dynamicSectionLabelOffset;
      if (!Number.isFinite(info.y)) placedY = (outerBoundsPx.minY + outerBoundsPx.maxY) / 2;
    } else if (info.edgeHint === "bottom") {
      placedY = outerBoundsPx.maxY + dynamicSectionLabelOffset;
      if (!Number.isFinite(info.x)) placedX = (outerBoundsPx.minX + outerBoundsPx.maxX) / 2;
    } else if (info.edgeHint === "left") {
      placedX = outerBoundsPx.minX - dynamicSectionLabelOffset;
      if (!Number.isFinite(info.y)) placedY = (outerBoundsPx.minY + outerBoundsPx.maxY) / 2;
    }
    labelEl.style.left = `${placedX}px`;
    labelEl.style.top = `${placedY}px`;
    shelvesEl.appendChild(labelEl);
  });

  if (showSizeInfo) {
    columnLabelCenters.forEach((point) => {
      if (point.showDimensionLabel === false) return;
      const anchorX = Number(point.x || 0);
      const anchorY = Number(point.y || 0);
      const edgeRefX = Number(point.edgeRefX || anchorX);
      const edgeRefY = Number(point.edgeRefY || anchorY);
      const edgeVotes = point.edgeVotes || {};
      const edgeOrder = ["top", "right", "bottom", "left"];
      const votedEdge = edgeOrder.reduce((best, edge) => {
        const score = Number(edgeVotes[edge] || 0);
        if (!best) return { edge, score };
        if (score > best.score) return { edge, score };
        return best;
      }, null);

      const distTop = Math.abs(edgeRefY - outerBoundsPx.minY);
      const distRight = Math.abs(edgeRefX - outerBoundsPx.maxX);
      const distBottom = Math.abs(edgeRefY - outerBoundsPx.maxY);
      const distLeft = Math.abs(edgeRefX - outerBoundsPx.minX);
      const nearestByDistance = [
        { edge: "top", dist: distTop },
        { edge: "right", dist: distRight },
        { edge: "bottom", dist: distBottom },
        { edge: "left", dist: distLeft },
      ].sort((a, b) => a.dist - b.dist)[0]?.edge;
      const nearest = votedEdge && votedEdge.score > 0 ? votedEdge.edge : nearestByDistance;

      let placedX = anchorX;
      let placedY = anchorY;

      if (nearest === "top") {
        placedY = outerBoundsPx.minY - edgeOffset;
      } else if (nearest === "right") {
        placedX = outerBoundsPx.maxX + edgeOffset;
      } else if (nearest === "bottom") {
        placedY = outerBoundsPx.maxY + edgeOffset;
      } else if (nearest === "left") {
        placedX = outerBoundsPx.minX - edgeOffset;
      }

      const labelEl = document.createElement("div");
      labelEl.className = "system-dimension-label system-dimension-label--column";
      if (nearest === "left" || nearest === "right") {
        labelEl.classList.add("system-dimension-label--vertical");
      }
      const labelWidthMm = Math.max(1, Math.round(Number(point.widthMm || COLUMN_WIDTH_MM)));
      labelEl.textContent = `${labelWidthMm}mm`;
      labelEl.style.left = `${placedX}px`;
      labelEl.style.top = `${placedY}px`;
      shelvesEl.appendChild(labelEl);
    });
  }

  if (!shelves.length && !addButtons.length) {
    previewOpenEndpoints = new Map();
    const rootEndpoint = buildRootEndpoint();
    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "system-preview-add-btn";
    startBtn.dataset.addShelf = "0";
    startBtn.dataset.addRootStart = "true";
    startBtn.dataset.attachSide = "0";
    startBtn.dataset.attachAtStart = "true";
    startBtn.dataset.endpointId = "root-endpoint";
    startBtn.title = "첫 모듈 추가";
    startBtn.textContent = "+";
    applyPreviewAddButtonState(startBtn, {
      enabled: canAddFromPreview,
      reason: previewDisabledReason,
    });
    startBtn.style.left = `${frameW / 2}px`;
    startBtn.style.top = `${frameH / 2}px`;
    shelvesEl.appendChild(startBtn);
    bindAddButtonPreviewInteractions(startBtn, rootEndpoint, canAddFromPreview);
    previewOpenEndpoints.set("root-endpoint", rootEndpoint);
  }

  const placedAddBtnBoxes = [];
  const nextPlacementHints = new Map();
  const addBtnRadius = addBtnSize / 2;
  const infoLabelBoxesPx = Array.from(
    shelvesEl.querySelectorAll(".system-dimension-label, .system-module-label, .system-section-width-label")
  )
    .map((el) => getBoundingRectOnParent(el, shelvesEl))
    .filter((rect) => Boolean(rect));
  const isSingleStraightBayLayout =
    edges.length === 1 && String(edges[0]?.type || "") === "bay" && addButtons.length === 2;
  const framePad = Math.max(8, addBtnRadius + 2);
  const minBtnX = framePad;
  const maxBtnX = Math.max(framePad, frameW - framePad);
  const minBtnY = framePad;
  const maxBtnY = Math.max(framePad, frameH - framePad);
  const clampToFrame = (value, min, max) => Math.min(max, Math.max(min, Number(value || 0)));
  const rectOverlapsCircle = (rect, cx, cy, r) =>
    cx + r > rect.left && cx - r < rect.right && cy + r > rect.top && cy - r < rect.bottom;
  const isBlockedPointForPlacement = (
    x,
    y,
    r,
    { ignoreColumns = false, ignoreShelves = false, ignoreInfoLabels = true } = {}
  ) => {
    if (x < framePad || x > frameW - framePad || y < framePad || y > frameH - framePad) {
      return true;
    }
    if (!ignoreShelves && shelfBoxesPx.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    if (!ignoreColumns && columnBoxesPx.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    if (!ignoreInfoLabels && infoLabelBoxesPx.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    if (placedAddBtnBoxes.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    return false;
  };
  const fallbackAngles = [0, 45, 90, 135, 180, 225, 270, 315].map(
    (deg) => (deg * Math.PI) / 180
  );
  const findNearestAvailablePoint = (
    originX,
    originY,
    r,
    { ignoreColumns = false, ignoreShelves = false, ignoreInfoLabels = true } = {}
  ) => {
    const baseX = clampToFrame(originX, minBtnX, maxBtnX);
    const baseY = clampToFrame(originY, minBtnY, maxBtnY);
    if (!isBlockedPointForPlacement(baseX, baseY, r, { ignoreColumns, ignoreShelves, ignoreInfoLabels })) {
      return { x: baseX, y: baseY };
    }
    const radialSteps = [
      Math.max(8, addBtnSize * 0.55),
      Math.max(14, addBtnSize * 1.05),
      Math.max(20, addBtnSize * 1.65),
      Math.max(26, addBtnSize * 2.25),
    ];
    for (let i = 0; i < radialSteps.length; i += 1) {
      const radius = radialSteps[i];
      for (let j = 0; j < fallbackAngles.length; j += 1) {
        const angle = fallbackAngles[j];
        const candidateX = clampToFrame(baseX + Math.cos(angle) * radius, minBtnX, maxBtnX);
        const candidateY = clampToFrame(baseY + Math.sin(angle) * radius, minBtnY, maxBtnY);
        if (
          !isBlockedPointForPlacement(candidateX, candidateY, r, {
            ignoreColumns,
            ignoreShelves,
            ignoreInfoLabels,
          })
        ) {
          return { x: candidateX, y: candidateY };
        }
      }
    }
    return { x: baseX, y: baseY };
  };

  addButtons.forEach((point) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "system-preview-add-btn";
    btn.dataset.addShelf = String(point.sideIndex);
    if (point.endpointId) btn.dataset.endpointId = point.endpointId;
    btn.dataset.attachSide = String(
      Number.isFinite(point.attachSideIndex) ? point.attachSideIndex : point.sideIndex
    );
    if (point.cornerId) btn.dataset.anchorCorner = point.cornerId;
    btn.dataset.attachAtStart = point.attachAtStart ? "true" : "false";
    btn.title = `끝점에 모듈 추가`;
    btn.textContent = "+";
    applyPreviewAddButtonState(btn, {
      enabled: canAddFromPreview,
      reason: previewDisabledReason,
    });
    const inwardX = Number(point.inwardX || 0);
    const inwardY = Number(point.inwardY || 0);
    const inwardLen = Math.hypot(inwardX, inwardY) || 1;
    const columnInsetMm = depthMm * (2 / 3);
    const columnCenterX =
      Number(point.x || 0) + (inwardX / inwardLen) * columnInsetMm;
    const columnCenterY =
      Number(point.y || 0) + (inwardY / inwardLen) * columnInsetMm;
    const outwardX = -inwardX / inwardLen;
    const outwardY = -inwardY / inwardLen;
    const tangentX = -inwardY / inwardLen;
    const tangentY = inwardX / inwardLen;
    const columnCenterPxX = columnCenterX * scale + tx;
    const columnCenterPxY = columnCenterY * scale + ty;
    const extendDir = normalizeDirection(point.extendDx, point.extendDy);
    const singleBayPreferred = isSingleStraightBayLayout
      ? { x: Number(extendDir.dx || 0), y: Number(extendDir.dy || 0) }
      : null;
    const isLinearSingleBayPlacement = Boolean(
      isSingleStraightBayLayout &&
        singleBayPreferred &&
        (Math.abs(Number(singleBayPreferred.x || 0)) >= 0.5 ||
          Math.abs(Number(singleBayPreferred.y || 0)) >= 0.5)
    );
    const ignoreColumnOverlap = isLinearSingleBayPlacement;
    const placementKey = getPreviewAddButtonPlacementKey(point);
    const previousHint = placementKey ? previewAddButtonPlacementHints.get(placementKey) : null;
    const candidateVectors = [];
    if (previousHint && !isLinearSingleBayPlacement) {
      const hintDx = Number(previousHint.dx || 0);
      const hintDy = Number(previousHint.dy || 0);
      const hintLen = Math.hypot(hintDx, hintDy);
      if (hintLen > 0.0001) {
        candidateVectors.push({
          x: hintDx / hintLen,
          y: hintDy / hintLen,
          mul: Number(previousHint.mul || 1),
        });
      }
    }
    if (isLinearSingleBayPlacement && singleBayPreferred) {
      candidateVectors.push(
        { x: singleBayPreferred.x, y: singleBayPreferred.y, mul: 1 },
        { x: singleBayPreferred.x, y: singleBayPreferred.y, mul: 1.25 },
        { x: singleBayPreferred.x, y: singleBayPreferred.y, mul: 0.82 },
        { x: singleBayPreferred.x, y: singleBayPreferred.y, mul: 1.48 }
      );
    } else {
      if (singleBayPreferred) {
        candidateVectors.push(singleBayPreferred);
        if (Math.abs(singleBayPreferred.x) >= Math.abs(singleBayPreferred.y)) {
          candidateVectors.push({ x: singleBayPreferred.x, y: 0, mul: 1.2 });
        } else {
          candidateVectors.push({ x: 0, y: singleBayPreferred.y, mul: 1.2 });
        }
      }
      candidateVectors.push(
        { x: outwardX, y: outwardY },
        { x: tangentX, y: tangentY },
        { x: -tangentX, y: -tangentY },
        { x: outwardX, y: outwardY, mul: 1.35 },
        { x: inwardX / inwardLen, y: inwardY / inwardLen }
      );
    }
    const offsetPx = isLinearSingleBayPlacement
      ? Math.max(addBtnRadius + Math.round(addBtnSize * 0.22), 16)
      : Math.max(columnDepthPx * 0.5 + addBtnSize * 0.65, 20);
    const toClampedPoint = (x, y) => ({
      x: clampToFrame(x, minBtnX, maxBtnX),
      y: clampToFrame(y, minBtnY, maxBtnY),
    });
    const initialPoint = toClampedPoint(
      columnCenterPxX + (singleBayPreferred?.x ?? outwardX) * offsetPx,
      columnCenterPxY + (singleBayPreferred?.y ?? outwardY) * offsetPx
    );
    let btnX = initialPoint.x;
    let btnY = initialPoint.y;
    let placed = !isBlockedPointForPlacement(btnX, btnY, addBtnRadius, {
      ignoreColumns: ignoreColumnOverlap,
    });
    for (let i = 0; i < candidateVectors.length; i += 1) {
      if (placed) break;
      const c = candidateVectors[i];
      const mul = Number(c.mul || 1);
      const candidatePoint = toClampedPoint(
        columnCenterPxX + Number(c.x || 0) * offsetPx * mul,
        columnCenterPxY + Number(c.y || 0) * offsetPx * mul
      );
      if (
        !isBlockedPointForPlacement(candidatePoint.x, candidatePoint.y, addBtnRadius, {
          ignoreColumns: ignoreColumnOverlap,
        })
      ) {
        btnX = candidatePoint.x;
        btnY = candidatePoint.y;
        placed = true;
        break;
      }
    }
    if (
      isBlockedPointForPlacement(btnX, btnY, addBtnRadius, {
        ignoreColumns: ignoreColumnOverlap,
      })
    ) {
      const fallbackPoint = findNearestAvailablePoint(btnX, btnY, addBtnRadius, {
        ignoreColumns: ignoreColumnOverlap,
      });
      btnX = fallbackPoint.x;
      btnY = fallbackPoint.y;
    }
    btn.style.left = `${btnX}px`;
    btn.style.top = `${btnY}px`;
    shelvesEl.appendChild(btn);
    bindAddButtonPreviewInteractions(btn, point, canAddFromPreview);
    if (placementKey && !isLinearSingleBayPlacement) {
      const relX = btnX - columnCenterPxX;
      const relY = btnY - columnCenterPxY;
      const relLen = Math.hypot(relX, relY);
      if (relLen > 0.0001) {
        const safeOffset = Math.max(1, Number(offsetPx || 0));
        nextPlacementHints.set(placementKey, {
          dx: relX / relLen,
          dy: relY / relLen,
          mul: Math.min(2.6, Math.max(0.45, relLen / safeOffset)),
        });
      }
    }
    placedAddBtnBoxes.push({
      left: btnX - addBtnRadius,
      right: btnX + addBtnRadius,
      top: btnY - addBtnRadius,
      bottom: btnY + addBtnRadius,
    });
  });
  previewAddButtonPlacementHints = nextPlacementHints;
}

function openPreviewAddTypeModal(
  sideIndex,
  cornerId = "",
  prepend = false,
  attachSideIndex = sideIndex,
  attachAtStart = prepend,
  endpointId = "",
  allowedTypes = ["normal"],
  anchorEl = null
) {
  const cornerLimitState = getShapeCornerLimitState();
  const openViewModel = buildPreviewAddTypeModalOpenViewModel({
    sideIndex,
    attachSideIndex,
    cornerId,
    prepend,
    attachAtStart,
    endpointId,
    allowedTypes,
    cornerLimitState,
    getCornerDirectionBlockedMessage: ({ sideIndex, attachSideIndex }) =>
      getCornerAttachSideBlockedMessage({ sideIndex, attachSideIndex }, getSelectedShape()),
    getCornerLimitBlockedMessage,
  });
  const openUiPlan = buildPreviewAddTypeModalOpenUiExecutionPlan({
    openViewModel,
    anchorEl,
  });
  if (openUiPlan.route !== "open" || !openUiPlan.flowTargetPatch || !openUiPlan.openViewState) return;
  const { openViewState } = openUiPlan;
  setPreviewAddFlowTarget(
    previewAddFlowState,
    openUiPlan.flowTargetPatch.target,
    openUiPlan.flowTargetPatch.anchorEl
  );
  const { modal, modalCornerBtn, modalNormalBtn, modalTitleEl } =
    applyPreviewAddTypeModalOpenUiView(openUiPlan);
  if (modal) {
    setPreviewAddTypeModalStep("type", "");
    openModal(modal, { focusTarget: "#previewAddTypeModalTitle", bodySelector: null });
    requestAnimationFrame(() => {
      focusPreviewAddTypeModalInitialTarget(openUiPlan, {
        modalNormalBtn,
        modalCornerBtn,
        modalTitleEl,
      });
    });
    return;
  }
}

function commitPreviewAddNormal() {
  const sourceResolution = buildPreviewAddSourceResolutionResult({
    source: resolveActivePreviewAddSourceTarget(previewAddFlowState.target),
    errorMessage: "이 끝점에서는 일반 모듈을 추가할 수 없습니다.",
  });
  const source = sourceResolution.source;
  const shelfId = sourceResolution.ok
    ? addShelfFromEndpoint(
        source,
        previewAddFlowState.target,
        buildPendingBayComposeAddOptions()
      )
    : "";
  const normalCommitUiPlan = buildPreviewAddNormalCommitUiExecutionPlan({
    sourceResolution,
    shelfId,
  });
  if (normalCommitUiPlan.route !== "open-bay-option") {
    setPreviewAddTypeErrorMessage(normalCommitUiPlan.errorMessage, { isError: true });
    return;
  }
  closePreviewAddTypePicker();
  if (normalCommitUiPlan.shelfId) openBayOptionModal(normalCommitUiPlan.shelfId);
}

function commitPreviewAddCorner() {
  const cornerId = previewAddFlowState.target?.cornerId || "";
  if (cornerId) {
    const existingCornerUiPlan = buildPreviewAddCornerCommitUiExecutionPlan({
      existingCornerId: cornerId,
      sourceResolution: null,
      cornerComposeValidation: null,
      edgeCreatePlan: null,
      fallbackErrorMessage: "코너 모듈을 찾을 수 없습니다.",
    });
    if (existingCornerUiPlan.route !== "open-existing-corner") {
      setPreviewAddTypeErrorMessage(existingCornerUiPlan.errorMessage, { isError: true });
      return;
    }
    closePreviewAddTypePicker();
    openCornerOptionModal(existingCornerUiPlan.cornerId);
    return;
  }
  const sourceResolution = buildPreviewAddSourceResolutionResult({
    source: resolveActivePreviewAddSourceTarget(previewAddFlowState.target),
    errorMessage: "이 끝점에는 코너 모듈을 추가할 수 없습니다.",
  });
  const source = sourceResolution.source;
  const cornerLimitState = getShapeCornerLimitState();
  const cornerComposeValidation = buildPresetModuleOptionCustomCornerComposeValidation({
    isRootSource: Boolean(source && isRootPreviewEndpointTarget(source)),
    hasRootCornerStartDirection: hasSelectedRootCornerStartDirection(previewAddFlowState.target),
    rootCornerDirectionRequiredMessage: getRootCornerDirectionRequiredMessage(),
    canAddCornerByLimit: Boolean(cornerLimitState?.canAdd),
    cornerLimitBlockedMessage: getCornerLimitBlockedMessage(cornerLimitState),
    canAddCornerAtTarget: Boolean(source && canAddCornerAtTarget(source, getSelectedShape())),
    cornerAttachSideBlockedMessage: source
      ? getCornerAttachSideBlockedMessage(source, getSelectedShape())
      : sourceResolution.errorMessage,
  });
  let edgeCreatePlan = null;
  if (source) {
    const placement = buildPlacementFromEndpoint(source);
    edgeCreatePlan = buildPendingCornerComposeEdgeCreatePlan({
      source,
      placement,
      normalizeDirection,
      directionToSideIndex,
      createdAt: Date.now(),
    });
  }
  const cornerCommitUiPlan = buildPreviewAddCornerCommitUiExecutionPlan({
    existingCornerId: "",
    sourceResolution,
    cornerComposeValidation,
    edgeCreatePlan,
    fallbackErrorMessage: sourceResolution.errorMessage,
  });
  if (cornerCommitUiPlan.route !== "create-corner") {
    setPreviewAddTypeErrorMessage(cornerCommitUiPlan.errorMessage, { isError: true });
    return;
  }
  const edge = buildPendingCornerComposeEdge(cornerCommitUiPlan.edgeCreatePlan);
  registerEdge(edge);
  closePreviewAddTypePicker();
  openCornerOptionModal(edge.id);
}

function updateAddItemState() {
  const btn = $("#addEstimateBtn");
  if (!btn) return;
  const input = readCurrentInputs();
  const bays = readBayInputs();
  const err = validateEstimateInputs(input, bays);
  btn.disabled = Boolean(err);
}

function autoCalculatePrice() {
  const input = readCurrentInputs();
  const bays = readBayInputs();
  updateSizeErrorsUI(input, bays);
  updateShelfAddButtonState(input);
  const err = getItemPriceDisplayValidationMessage(input, bays);
  if (err) {
    renderItemPriceNotice({ target: "#itemPriceDisplay", text: err });
    updateAddItemState();
    return;
  }
  const bayTotals = bays.reduce(
    (acc, bay) => {
      const shelf = {
        ...input.shelf,
        width: bay.width,
        count: bay.count,
        customProcessing: bay.customProcessing,
        customPrimaryMm: bay.customPrimaryMm,
        customSecondaryMm: bay.customSecondaryMm,
      };
      let detail = calcBayDetail({
        shelf,
        addons: bay.addons,
        quantity: 1,
        isCorner: Boolean(bay.isCorner),
      });
      if (shouldTreatBayFurniturePriceAsConsult(bay)) {
        detail = applyConsultPriceToDetail(detail);
      }
      const addonCost = detail.isCustomPrice
        ? { componentCost: 0, furnitureCost: 0 }
        : calcAddonCostBreakdown(bay.addons, 1);
      return {
        materialCost: acc.materialCost + detail.materialCost,
        processingCost: acc.processingCost + detail.processingCost,
        componentCost: acc.componentCost + addonCost.componentCost,
        furnitureCost: acc.furnitureCost + addonCost.furnitureCost,
        total: acc.total + detail.total,
        isCustomPrice: acc.isCustomPrice || detail.isCustomPrice,
      };
    },
    {
      materialCost: 0,
      processingCost: 0,
      componentCost: 0,
      furnitureCost: 0,
      total: 0,
      isCustomPrice: false,
    }
  );
  const columnDetail = calcColumnsDetail({
    column: input.column,
    count: bays.length + 1,
    quantity: 1,
    bays,
  });
  const layoutConsult = evaluateLayoutConsultState(getLayoutConfigSnapshot(input));
  const totalPrice = bayTotals.total + columnDetail.total;
  const isCustom = bayTotals.isCustomPrice || columnDetail.isCustomPrice || isLayoutConsultStatus(layoutConsult);
  const basePostCost = Number(columnDetail?.basePostBar?.totalCost || 0);
  const cornerPostCost = Number(columnDetail?.cornerPostBar?.totalCost || 0);
  const breakdownRows = isCustom
    ? [
        { label: "선반", isConsult: true },
        { label: "행거", isConsult: true },
        { label: "가구", isConsult: true },
        { label: "기본 포스트바", isConsult: true },
        { label: "코너 포스트바", isConsult: true },
      ]
    : [
        { label: "선반", amount: bayTotals.materialCost },
        { label: "행거", amount: bayTotals.componentCost },
        { label: "가구", amount: bayTotals.furnitureCost },
        { label: "기본 포스트바", amount: basePostCost },
        { label: "코너 포스트바", amount: cornerPostCost },
      ];
  renderItemPriceDisplay({
    target: "#itemPriceDisplay",
    totalLabel: "예상금액",
    totalAmount: totalPrice,
    totalText: isCustom ? "상담 안내" : "",
    breakdownRows,
  });
  updateAddItemState();
}

function applyLayoutShapeTypeChange(nextShape) {
  const normalizedNextShape = normalizeSystemShape(nextShape);
  const currentShape = getSelectedShape();
  if (normalizedNextShape === currentShape) return;

  const hasExistingModules = getOrderedCommittedGraphEdges().length > 0;
  if (hasExistingModules) {
    const confirmed = window.confirm(
      "레이아웃 타입을 변경하면 현재 모듈 구성이 초기화됩니다. 계속할까요?"
    );
    if (!confirmed) return;
  }

  // Preserve current section-length inputs before rerendering the layout UI.
  syncLayoutSectionLengthsFromDOM();
  syncLayoutConfigShape(normalizedNextShape);
  initShelfStateForShape(normalizedNextShape);
  state.shelfAddons = {};
  resetPreviewAddFlowState(previewAddFlowState);
  previewOpenEndpoints = new Map();
  inlineInsertPendingFirstSaveEdgeId = "";
  clearPreviewGhost();
  resetBuilderHistoryState();
  renderShapeSizeInputs();
  renderBayInputs();

  if (hasExistingModules) {
    showInfoModal("레이아웃 타입이 변경되어 현재 모듈 구성이 초기화되었습니다.");
  }
}

function bindLayoutTypeShapeEvents(container) {
  if (!container) return;
  container.querySelectorAll("[data-layout-shape]").forEach((btn) => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      applyLayoutShapeTypeChange(btn.dataset.layoutShape || "");
    });
  });
}

function bindLayoutSectionLengthEvents(container) {
  if (!container) return;
  container.querySelectorAll("[data-layout-section-length]").forEach((inputEl) => {
    if (inputEl.dataset.bound === "true") return;
    inputEl.dataset.bound = "true";
    inputEl.addEventListener("input", () => {
      const index = Number(inputEl.dataset.layoutSectionLength || 0);
      const layout = syncLayoutConfigShape(getSelectedShape());
      if (!layout.sections[index]) return;
      const value = Number(inputEl.value || 0);
      layout.sections[index].lengthMm = Number.isFinite(value) && value > 0 ? value : 0;
      refreshBuilderDerivedUI();
    });
  });
}

function renderShapeSizeInputs() {
  const container = $("#shapeSizeInputs");
  if (!container) return;
  const previousSpaces = readSpaceConfigs(getSelectedShape());
  const previousSpace = previousSpaces[0] || { min: 0, max: 0, extraHeights: [] };
  const layout = syncLayoutConfigShape(getSelectedShape());
  const selectedShape = normalizeSystemShape(layout.shapeType);
  container.innerHTML = "";
  const i = 0;

  const layoutCard = document.createElement("div");
  layoutCard.className = "config-card system-layout-config-card";
  layoutCard.innerHTML = `
    <div class="form-section-head">
      <div class="form-section-title">레이아웃 타입 및 설치공간 설정</div>
      <button
        type="button"
        class="section-help-btn"
        data-measurement-guide="system-layout"
        aria-label="레이아웃 타입 및 설치공간 측정법 보기"
      >
        ?
      </button>
    </div>
    <p class="form-section-desc">레이아웃 타입을 선택한 뒤 각 설치공간 길이를 입력해주세요.</p>
    <div class="input-tip">
      <ul class="input-tip-list">
         <li>레이아웃 타입은 코너를 사용해 연결되는 구성을 기준으로 합니다.</li>
         <li>연결되지 않은 구성을 원하실 경우 ㅣ자로 개별 구성해주세요.</li>
       </ul>
    </div>
    <div class="layout-type-grid" role="group" aria-label="레이아웃 타입 선택">
      ${SYSTEM_SHAPE_KEYS.map((shapeKey) => {
        const sectionCount = getSectionCountForShape(shapeKey);
        const selected = shapeKey === selectedShape;
        return `
          <button
            type="button"
            class="layout-type-btn${selected ? " is-active" : ""}"
            data-layout-shape="${shapeKey}"
            aria-pressed="${selected ? "true" : "false"}"
          >
            <span class="layout-type-btn-label">${escapeHtml(getLayoutTypeLabel(shapeKey))}</span>
            <span class="layout-type-btn-meta">${sectionCount}개 설치공간</span>
          </button>
        `;
      }).join("")}
    </div>
    <div class="layout-section-inputs">
      ${layout.sections
        .map((section, index) => {
          const value = Number(section.lengthMm || 0);
          return `
            <div class="form-row">
              <label for="layoutSectionLength-${index}">${escapeHtml(section.label)} 길이 (mm)</label>
              <div class="field-col">
                <input
                  type="number"
                  id="layoutSectionLength-${index}"
                  data-layout-section-length="${index}"
                  min="${SYSTEM_SECTION_LENGTH_MIN_MM}"
                  placeholder="최소 ${SYSTEM_SECTION_LENGTH_MIN_MM}mm"
                  value="${value > 0 ? value : ""}"
                />
                <div class="error-msg" id="layoutSectionError-${index}"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
    <div class="field-note">설치공간 길이는 최소 ${SYSTEM_SECTION_LENGTH_MIN_MM}mm 이상 입력해주세요.</div>
  `;
  container.appendChild(layoutCard);

  const row = document.createElement("div");
  row.className = "config-card";
  row.innerHTML = `
    <div class="form-section-head">
      <div class="form-section-title">천장 높이 설정</div>
      <button
        type="button"
        class="section-help-btn"
        data-measurement-guide="system-ceiling"
        aria-label="천장 높이 측정법 보기"
      >
        ?
      </button>
    </div>
    <p class="form-section-desc">최소/최대 천장 높이를 입력하고 필요한 경우 개별높이를 추가해주세요.</p>
    <div class="input-tip">
      <ul class="input-tip-list">
        <li>공간에 따라 천장 높이가 크게 차이날 수 있으므로 여러 위치를 측정해주세요.</li>
        <li>창문, 커튼박스 등으로 동일 높이 설치가 어려운 경우에는 개별 높이 포스트바를 추가해 주세요.</li>
        <li>추가하신 개별 높이 포스트바의 갯수를 반영해 포스트바를 제작합니다.</li>
    </ul>
    </div>
    <div class="form-row">
      <label>가장 낮은 천장 높이 (mm)</label>
      <div class="field-col">
        <input type="number" id="spaceMin-${i}" placeholder="${LIMITS.column.minLength}mm 이상" value="${Number(previousSpace.min || 0) > 0 ? Number(previousSpace.min) : ""}" />
      </div>
    </div>
    <div class="form-row">
      <label>가장 높은 천장 높이 (mm)</label>
      <div class="field-col">
        <input type="number" id="spaceMax-${i}" placeholder="${LIMITS.column.minLength}mm 이상" value="${Number(previousSpace.max || 0) > 0 ? Number(previousSpace.max) : ""}" />
        <div class="error-msg" id="spaceHeightError-${i}"></div>
      </div>
    </div>
    <div class="form-row">
      <label>개별높이 (mm)</label>
      <div class="field-col">
        <button type="button" class="ghost-btn space-extra-add-btn" id="addSpaceExtra-${i}">개별높이 추가</button>
        <div id="spaceExtraList-${i}" class="field-stack"></div>
        <div class="error-msg" id="spaceExtraError-${i}"></div>
      </div>
    </div>
  `;
  container.appendChild(row);

  const layoutStatusCard = document.createElement("div");
  layoutStatusCard.className = "config-card";
  layoutStatusCard.innerHTML = `
    <div class="form-section-title">레이아웃 상태 및 상담 안내</div>
    <p class="form-section-desc">입력한 레이아웃 조건에 따라 상담 여부가 실시간으로 안내됩니다.</p>
    <div id="layoutConstraintStatus" class="layout-constraint-status" aria-live="polite"></div>
    <div class="field-note">설치공간 길이 ${SYSTEM_SECTION_LENGTH_CONSULT_AT_MM}mm 이상 또는 가장 높은 높이 ${SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM}mm 초과이면 상담 안내로 처리됩니다.</div>
  `;
  container.appendChild(layoutStatusCard);

  setSpaceExtraHeights(i, previousSpace.extraHeights || []);
  bindLayoutTypeShapeEvents(layoutCard);
  bindLayoutSectionLengthEvents(layoutCard);

  ["#spaceMin-0", "#spaceMax-0"].forEach((sel) => {
    $(sel)?.addEventListener("input", () => {
      refreshBuilderDerivedUI();
    });
  });
  $("#addSpaceExtra-0")?.addEventListener("click", () => {
    const list = $("#spaceExtraList-0");
    if (!list) return;
    const extraRow = document.createElement("div");
    extraRow.className = "space-extra-row";
    extraRow.innerHTML = `
      <input type="number" data-space-extra-height="0" placeholder="개별높이 (${LIMITS.column.minLength}mm 이상)" />
      <button type="button" class="ghost-btn" data-space-extra-remove="0">삭제</button>
    `;
    list.appendChild(extraRow);
    bindSpaceExtraHeightEvents(0);
    refreshBuilderDerivedUI();
  });

  syncLayoutConstraintIndicators();
}

function ensureShapeSizeInputRows() {
  const shape = getSelectedShape();
  const prevSpaces = readSpaceConfigs(shape);
  const currentCount = document.querySelectorAll('[id^="spaceMin-"]').length;
  if (currentCount === 1) return;
  renderShapeSizeInputs();
  const prev = prevSpaces[0] || { min: 0, max: 0, extraHeights: [] };
  const minInput = $("#spaceMin-0");
  const maxInput = $("#spaceMax-0");
  if (minInput) minInput.value = prev.min > 0 ? String(prev.min) : "";
  if (maxInput) maxInput.value = prev.max > 0 ? String(prev.max) : "";
  setSpaceExtraHeights(0, prev.extraHeights || []);
}

function renderBayInputs() {
  ensureShapeSizeInputRows();
  normalizeDanglingAnchorIds();
  const container = $("#bayInputs");
  if (container) {
    container.innerHTML = "";
    const block = document.createElement("div");
    block.className = "config-card";
    block.innerHTML = `
      <div class="form-section-title">모듈 구성</div>
      <p class="form-section-desc">각 모듈의 선반 폭과 개수를 입력해주세요.</p>
      <div class="shelf-list" data-side-index="all"></div>
    `;
    container.appendChild(block);
    const list = block.querySelector(".shelf-list");
    if (list) {
      getPreviewOrderedEdges(getOrderedCommittedGraphEdges()).forEach((edge) => {
        enforceFurnitureAddonPolicyForEdge(edge);
        if (edge.type === "corner") list.appendChild(buildCornerShelfItem(edge));
        else list.appendChild(buildShelfItem(edge));
        renderShelfAddonSelection(edge.id);
      });
    }
  }
  bindShelfInputEvents();
  renderBuilderStructure();
  updateBayAddonAvailability();
  updatePreview();
  autoCalculatePrice();
}

function buildShelfItem(shelf) {
  const clothesRodQty = getShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID);
  const el = document.createElement("div");
  el.className = "shelf-item";
  el.innerHTML = `
    <div class="form-row">
      <label>선반 폭 (mm)</label>
      <div class="field-col">
        <select class="select-caret" data-shelf-preset="${shelf.id}">
          <option value="">선택</option>
          <option value="400">400</option>
          <option value="600">600</option>
          <option value="800">800</option>
          <option value="custom">직접 입력</option>
        </select>
        <input type="number" class="bay-width-input" data-shelf-width="${shelf.id}" min="${MODULE_SHELF_WIDTH_LIMITS.min}" max="${MODULE_SHELF_WIDTH_LIMITS.max}" placeholder="직접 입력 (${MODULE_SHELF_WIDTH_LIMITS.min}~${MODULE_SHELF_WIDTH_LIMITS.max}mm)" value="${shelf.width || ""}" />
        <div class="error-msg" data-shelf-width-error="${shelf.id}"></div>
      </div>
    </div>
    <div class="form-row">
      <label>선반 갯수</label>
      <div class="field-col">
        <input type="number" min="1" value="${shelf.count || 1}" data-shelf-count="${shelf.id}" />
        <div class="error-msg" data-shelf-count-error="${shelf.id}"></div>
      </div>
    </div>
    <div class="form-row">
      <label>구성품 (행거)</label>
      <div class="field-col">
        <input type="number" min="0" value="${clothesRodQty}" data-shelf-rod-count="${shelf.id}" />
      </div>
    </div>
    <div class="bay-addon-section">
      <div class="addon-picker">
        <button type="button" data-shelf-addon-btn="${shelf.id}">가구 선택</button>
        <button type="button" class="ghost-btn" data-shelf-remove="${shelf.id}">삭제</button>
      </div>
      <div id="selectedShelfAddon-${shelf.id}" class="selected-material-card addon-card-display"></div>
    </div>
  `;
  return el;
}

function buildCornerShelfItem(corner) {
  const clothesRodQty = getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID);
  clearFurnitureAddonsForEdge(corner.id);
  const el = document.createElement("div");
  el.className = "shelf-item corner-item";
  el.innerHTML = `
    <div class="form-row">
      <label>코너 선반</label>
      <div class="field-col">
        <select class="select-caret" data-corner-swap="${corner.id}">
          <option value="default"${corner.swap ? "" : " selected"}>800 × 600</option>
          <option value="swap"${corner.swap ? " selected" : ""}>600 × 800</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <label>선반 갯수</label>
      <div class="field-col">
        <input type="number" min="1" value="${corner.count || 1}" data-shelf-count="${corner.id}" />
        <div class="error-msg" data-shelf-count-error="${corner.id}"></div>
      </div>
    </div>
    <div class="form-row">
      <label>구성품 (행거)</label>
      <div class="field-col">
        <input type="number" min="0" value="${clothesRodQty}" data-shelf-rod-count="${corner.id}" />
      </div>
    </div>
  `;
  return el;
}

function renderShelfAddonSelection(id) {
  renderShelfAddonSelectionToTarget(id, `selectedShelfAddon-${id}`);
}

function captureBayOptionModalDraft() {
  if (!activeBayOptionId) return null;
  const presetSelect = $("#bayWidthPresetSelect");
  const customInput = $("#bayWidthCustomInput");
  const countInput = $("#bayCountInput");
  const rodCountInput = $("#bayRodCountInput");
  bayDirectComposeDraft = {
    edgeId: String(activeBayOptionId),
    presetValue: String(presetSelect?.value || ""),
    customWidthValue: String(customInput?.value || ""),
    countValue: String(countInput?.value || ""),
    rodCountValue: String(rodCountInput?.value || ""),
  };
  return bayDirectComposeDraft;
}

function captureCornerOptionModalDraft() {
  if (!activeCornerOptionId) return null;
  const swapSelect = $("#cornerSwapSelect");
  const countInput = $("#cornerCountInput");
  const rodCountInput = $("#cornerRodCountInput");
  const customPrimaryInput = $("#cornerCustomPrimaryInput");
  const customSecondaryInput = $("#cornerCustomSecondaryInput");
  cornerDirectComposeDraft = {
    edgeId: String(activeCornerOptionId),
    swapValue: String(swapSelect?.value || ""),
    countValue: String(countInput?.value || ""),
    rodCountValue: String(rodCountInput?.value || ""),
    customPrimaryValue: String(customPrimaryInput?.value || ""),
    customSecondaryValue: String(customSecondaryInput?.value || ""),
  };
  return cornerDirectComposeDraft;
}

function renderActiveOptionModalAddonSelection() {
  if (activeCornerOptionId) {
    renderShelfAddonSelectionToTarget(activeCornerOptionId, "selectedCornerOptionAddon");
    renderCornerOptionFrontPreview();
  }
  if (activeBayOptionId) {
    renderShelfAddonSelectionToTarget(activeBayOptionId, "selectedBayOptionAddon");
    renderBayOptionFrontPreview();
  }
}

function bindShelfInputEvents() {
  const container = $("#bayInputs");
  if (!container) return;
  container.querySelectorAll("[data-shelf-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.shelfRemove;
      if (!id) return;
      removeBayById(id);
    });
  });

  container.querySelectorAll("[data-shelf-addon-btn]").forEach((btn) => {
    btn.addEventListener("click", () => openShelfAddonModal(btn.dataset.shelfAddonBtn));
  });

  container.querySelectorAll("[data-shelf-preset]").forEach((select) => {
    const id = select.dataset.shelfPreset;
    const widthInput = container.querySelector(`[data-shelf-width="${id}"]`);
    const shelf = findShelfById(id);
    if (!widthInput || !shelf) return;
    const presetValue =
      shelf.width === 400 || shelf.width === 600 || shelf.width === 800
        ? String(shelf.width)
        : shelf.width
        ? "custom"
        : "";
    select.value = presetValue;
    const isCustom = presetValue === "custom";
    widthInput.disabled = !isCustom;
    widthInput.classList.toggle("hidden", !isCustom);
    if (!isCustom) widthInput.value = presetValue || "";
    select.addEventListener("change", () => {
      const prevWidth = Number(shelf.width || 0);
      if (select.value === "custom") {
        widthInput.value = "";
        widthInput.disabled = false;
        widthInput.classList.remove("hidden");
        widthInput.focus();
      } else {
        widthInput.value = select.value || "";
        widthInput.disabled = select.value !== "";
        widthInput.classList.add("hidden");
      }
      const nextWidth = Number(widthInput.value || 0);
      if (nextWidth !== prevWidth) pushBuilderHistory("update-normal-width");
      shelf.width = nextWidth;
      if (enforceFurnitureAddonPolicyForEdge(shelf.id)) {
        renderShelfAddonSelection(shelf.id);
      }
      updatePreview();
      updateBayAddonAvailability();
      autoCalculatePrice();
    });
  });

  container.querySelectorAll("[data-shelf-width]").forEach((input) => {
    input.addEventListener("blur", () => {
      delete input.dataset.historyCaptured;
    });
    input.addEventListener("input", () => {
      if (input.dataset.historyCaptured !== "true") {
        input.dataset.historyCaptured = "true";
        pushBuilderHistory("update-normal-width");
      }
      const id = input.dataset.shelfWidth;
      const shelf = findShelfById(id);
      if (shelf) shelf.width = Number(input.value || 0);
      if (shelf && enforceFurnitureAddonPolicyForEdge(shelf.id)) {
        renderShelfAddonSelection(shelf.id);
      }
      updatePreview();
      updateBayAddonAvailability();
      autoCalculatePrice();
    });
  });

  container.querySelectorAll("[data-shelf-count]").forEach((input) => {
    input.addEventListener("blur", () => {
      delete input.dataset.historyCaptured;
    });
    input.addEventListener("input", () => {
      if (input.dataset.historyCaptured !== "true") {
        input.dataset.historyCaptured = "true";
        pushBuilderHistory("update-count");
      }
      const id = input.dataset.shelfCount;
      const shelf = findShelfById(id);
      if (shelf) shelf.count = Number(input.value || 1);
      updatePreview();
      autoCalculatePrice();
    });
  });

  container.querySelectorAll("[data-shelf-rod-count]").forEach((input) => {
    input.addEventListener("input", () => {
      const id = input.dataset.shelfRodCount;
      if (!id) return;
      const raw = String(input.value || "").trim();
      const parsed = raw === "" ? 0 : Number(raw);
      if (!Number.isFinite(parsed)) return;
      const qty = Math.max(0, Math.floor(parsed));
      const prevQty = getShelfAddonQuantity(id, ADDON_CLOTHES_ROD_ID);
      if (input.dataset.historyCaptured !== "true" && qty !== prevQty) {
        pushBuilderHistory("update-rod-count");
        input.dataset.historyCaptured = "true";
      }
      setShelfAddonQuantity(id, ADDON_CLOTHES_ROD_ID, qty);
      renderShelfAddonSelection(id);
      autoCalculatePrice();
      updateAddItemState();
    });
    input.addEventListener("blur", () => {
      delete input.dataset.historyCaptured;
      if (String(input.value || "").trim() === "") {
        input.value = "0";
      }
    });
  });

  container.querySelectorAll("[data-corner-swap]").forEach((select) => {
    select.addEventListener("change", () => {
      const id = select.dataset.cornerSwap;
      const corner = findShelfById(id);
      if (!corner) return;
      const nextSwap = select.value === "swap";
      if (Boolean(corner.swap) !== nextSwap) pushBuilderHistory("update-corner-swap");
      corner.swap = nextSwap;
      updatePreview();
      autoCalculatePrice();
    });
  });
}

function findShelfById(id) {
  ensureGraph();
  return state.graph?.edges?.[id] || null;
}

function isPendingEdge(edge) {
  return Boolean(edge && edge.pendingAdd);
}

function discardPendingEdge(edgeOrId) {
  const edge = typeof edgeOrId === "string" ? findShelfById(edgeOrId) : edgeOrId;
  if (!edge || !isPendingEdge(edge)) return false;
  const edgeId = String(edge.id || "");
  if (!edgeId) return false;
  reanchorChildrenAfterEdgeRemoval(edge);
  unregisterEdge(edgeId);
  normalizeDanglingAnchorIds();
  delete state.shelfAddons[edgeId];
  return true;
}

function applyDirectComposeButtonState(buttonOrSelector, { canApply = false, message = "" } = {}) {
  const btn =
    typeof buttonOrSelector === "string" ? $(buttonOrSelector) : buttonOrSelector instanceof Element ? buttonOrSelector : null;
  if (!btn) return;
  btn.disabled = !canApply;
  btn.classList.toggle("btn-disabled", !canApply);
  btn.setAttribute("aria-disabled", canApply ? "false" : "true");
  if (!canApply && message) btn.title = String(message);
  else btn.removeAttribute("title");
}

function getBayOptionApplyValidationState() {
  if (!activeBayOptionId) {
    return { canApply: false, message: "맞춤구성 시작 후 적용할 수 있습니다." };
  }
  const countValue = Number($("#bayCountInput")?.value ?? 0);
  if (!Number.isFinite(countValue) || countValue < 1) {
    return { canApply: false, message: "선반 갯수를 1개 이상 입력해주세요." };
  }

  const presetSelect = $("#bayWidthPresetSelect");
  const customInput = $("#bayWidthCustomInput");
  const isCustom = presetSelect?.value === "custom";
  const widthValue = Number((isCustom ? customInput?.value : presetSelect?.value) || 0);
  if (
    !Number.isFinite(widthValue) ||
    widthValue < MODULE_SHELF_WIDTH_LIMITS.min ||
    widthValue > MODULE_SHELF_WIDTH_LIMITS.max
  ) {
    return {
      canApply: false,
      message: `폭은 ${MODULE_SHELF_WIDTH_LIMITS.min}~${MODULE_SHELF_WIDTH_LIMITS.max}mm 범위 내로 입력해주세요.`,
    };
  }

  return { canApply: true, message: "" };
}

function getBayOptionModalWidthMm(fallbackWidth = 0, { edgeId = "" } = {}) {
  const presetSelect = $("#bayWidthPresetSelect");
  const customInput = $("#bayWidthCustomInput");
  const draft =
    bayDirectComposeDraft &&
    (!edgeId || String(bayDirectComposeDraft.edgeId || "") === String(edgeId || ""))
      ? bayDirectComposeDraft
      : null;
  const presetValue = String(presetSelect?.value || draft?.presetValue || "");
  const customValue = String(customInput?.value || draft?.customWidthValue || "");
  const isCustom = presetValue === "custom";
  const raw = isCustom ? customValue : presetValue;
  const width = Number(raw || fallbackWidth || 0);
  if (!Number.isFinite(width)) return 0;
  return Math.max(0, Math.round(width));
}

function syncBayOptionFurnitureSelectionAvailability(fallbackWidth = 0) {
  const addonBtn = $("#bayAddonBtn");
  if (!addonBtn) return false;
  const widthMm = getBayOptionModalWidthMm(fallbackWidth);
  const policy = resolveFurnitureSelectionPolicyForNormalWidth(widthMm);
  const canSelect = policy.canSelect;
  addonBtn.disabled = !canSelect;
  addonBtn.classList.toggle("btn-disabled", !canSelect);
  addonBtn.setAttribute("aria-disabled", canSelect ? "false" : "true");
  if (canSelect) {
    addonBtn.removeAttribute("title");
  } else {
    addonBtn.title = policy.blockedReason || "가구 선택이 불가능합니다.";
  }
  return canSelect;
}

function getCornerOptionApplyValidationState() {
  if (!activeCornerOptionId) {
    return { canApply: false, message: "맞춤구성 시작 후 적용할 수 있습니다." };
  }
  const countValue = Number($("#cornerCountInput")?.value ?? 0);
  if (!Number.isFinite(countValue) || countValue < 1) {
    return { canApply: false, message: "선반 갯수를 1개 이상 입력해주세요." };
  }
  const customValidation = getCornerCustomCutValidationState();
  if (!customValidation.valid) {
    return { canApply: false, message: customValidation.message || "코너 비규격 절단값을 확인해주세요." };
  }
  return { canApply: true, message: "" };
}

function updateBayOptionModalApplyButtonState() {
  const validation = getBayOptionApplyValidationState();
  if (
    isPresetModuleOptionCustomTabActive(
      presetModuleOptionFlowState.modalState,
      presetModuleOptionFlowState.draft,
      "normal"
    )
  ) {
    const saveBtn = $("#savePresetModuleOptionModal");
    if (saveBtn) {
      applyDirectComposeButtonState(saveBtn, validation);
      saveBtn.classList.toggle("hidden", false);
    }
  }
}

function updateCornerOptionModalApplyButtonState() {
  const validation = getCornerOptionApplyValidationState();
  if (
    isPresetModuleOptionCustomTabActive(
      presetModuleOptionFlowState.modalState,
      presetModuleOptionFlowState.draft,
      "corner"
    )
  ) {
    const saveBtn = $("#savePresetModuleOptionModal");
    if (saveBtn) {
      applyDirectComposeButtonState(saveBtn, validation);
      saveBtn.classList.toggle("hidden", false);
    }
  }
}

function syncCornerOptionModal() {
  if (!activeCornerOptionId) return;
  const corner = findShelfById(activeCornerOptionId);
  if (!corner) return;
  clearFurnitureAddonsForEdge(corner.id);
  const swapSelect = $("#cornerSwapSelect");
  const countInput = $("#cornerCountInput");
  const rodCountInput = $("#cornerRodCountInput");
  const customPrimaryInput = $("#cornerCustomPrimaryInput");
  const customSecondaryInput = $("#cornerCustomSecondaryInput");
  const addonBtn = $("#cornerAddonBtn");
  const draft =
    cornerDirectComposeDraft && String(cornerDirectComposeDraft.edgeId || "") === String(corner.id)
      ? cornerDirectComposeDraft
      : null;
  if (swapSelect) {
    const fallbackMode = corner.customProcessing ? "custom" : corner.swap ? "swap" : "default";
    const nextMode = String(draft?.swapValue || fallbackMode);
    swapSelect.value = nextMode === "custom" || nextMode === "swap" || nextMode === "default" ? nextMode : fallbackMode;
  }
  if (countInput) countInput.value = draft?.countValue ?? String(corner.count ?? 0);
  if (rodCountInput) {
    rodCountInput.value =
      draft?.rodCountValue || String(getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID));
  }
  if (customPrimaryInput) {
    customPrimaryInput.value =
      draft?.customPrimaryValue ||
      (Number(corner.customPrimaryMm || 0) > 0 ? String(corner.customPrimaryMm) : "800");
  }
  if (customSecondaryInput) {
    customSecondaryInput.value =
      draft?.customSecondaryValue ||
      (Number(corner.customSecondaryMm || 0) > 0
        ? String(corner.customSecondaryMm)
        : "600");
  }
  syncCornerCustomCutInputsUI();
  const addonRow = addonBtn?.closest(".form-row");
  if (addonRow) addonRow.classList.add("hidden");
  const addonSelectionEl = $("#selectedCornerOptionAddon");
  if (addonSelectionEl) addonSelectionEl.innerHTML = "";
  if (addonBtn) addonBtn.disabled = true;
  setFieldError(countInput, $("#cornerCountError"), "");
  setCornerCustomCutError("");
  updateCornerOptionModalApplyButtonState();
  renderCornerOptionFrontPreview();
}

function openCornerOptionModal(
  cornerId,
  { preserveDraft = false, backContext = null, initialTab = "" } = {}
) {
  const corner = findShelfById(cornerId);
  if (!corner) return;
  if (
    !preserveDraft ||
    !cornerDirectComposeDraft ||
    String(cornerDirectComposeDraft.edgeId || "") !== String(cornerId)
  ) {
    cornerDirectComposeDraft = null;
  }
  const resolvedInitialTab =
    initialTab === "custom" || initialTab === "preset"
      ? initialTab
      : corner.composeTab === "preset" || corner.composeTab === "custom"
        ? corner.composeTab
        : "custom";
  activeCornerOptionId = cornerId;
  const nextOpen = buildPresetModuleOptionOpenFromDirectComposeEdge({
    moduleType: "corner",
    edgeId: cornerId,
    preserveDraft,
    initialTab: resolvedInitialTab,
    backContext,
    cloneTargetSnapshot: clonePreviewAddTargetSnapshot,
    fallbackReturnFocusEl: previewAddFlowState.anchorEl,
  });
  if (!nextOpen) return;
  openPresetModuleOptionModal(nextOpen.moduleType, nextOpen.options);
}

function syncBayOptionModal() {
  if (!activeBayOptionId) return;
  const shelf = findShelfById(activeBayOptionId);
  if (!shelf) return;
  const furnitureCleared = enforceFurnitureAddonPolicyForEdge(shelf.id, { modalReturnTo: "bay" });
  const presetSelect = $("#bayWidthPresetSelect");
  const customInput = $("#bayWidthCustomInput");
  const countInput = $("#bayCountInput");
  const rodCountInput = $("#bayRodCountInput");
  const draft =
    bayDirectComposeDraft && String(bayDirectComposeDraft.edgeId || "") === String(shelf.id)
      ? bayDirectComposeDraft
      : null;

  const width = Number(shelf.width || 0);
  const presetValue = draft?.presetValue || (width === 400 || width === 600 || width === 800 ? String(width) : "custom");

  if (presetSelect) presetSelect.value = presetValue;
  if (customInput) {
    customInput.classList.toggle("hidden", presetValue !== "custom");
    customInput.disabled = presetValue !== "custom";
    customInput.value =
      presetValue === "custom" ? String(draft?.customWidthValue ?? String(width || "")) : "";
  }
  if (countInput) countInput.value = draft?.countValue ?? String(shelf.count ?? 0);
  if (rodCountInput) {
    rodCountInput.value =
      draft?.rodCountValue || String(getShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID));
  }
  renderShelfAddonSelectionToTarget(shelf.id, "selectedBayOptionAddon");
  if (furnitureCleared) {
    renderShelfAddonSelection(shelf.id);
  }
  const initialWidthMm = presetValue === "custom"
    ? Number(customInput?.value || width || 0)
    : Number(presetValue || width || 0);
  syncBayOptionFurnitureSelectionAvailability(initialWidthMm);

  setFieldError(customInput, $("#bayWidthError"), "");
  setFieldError(countInput, $("#bayCountError"), "");
  updateBayOptionModalApplyButtonState();
  renderBayOptionFrontPreview();
}

function openBayOptionModal(
  shelfId,
  { preserveDraft = false, backContext = null, initialTab = "" } = {}
) {
  const shelf = findShelfById(shelfId);
  if (!shelf) return;
  if (
    inlineInsertPendingFirstSaveEdgeId &&
    String(inlineInsertPendingFirstSaveEdgeId) !== String(shelfId)
  ) {
    inlineInsertPendingFirstSaveEdgeId = "";
  }
  if (
    !preserveDraft ||
    !bayDirectComposeDraft ||
    String(bayDirectComposeDraft.edgeId || "") !== String(shelfId)
  ) {
    bayDirectComposeDraft = null;
  }
  const resolvedInitialTab =
    initialTab === "custom" || initialTab === "preset"
      ? initialTab
      : shelf.composeTab === "preset" || shelf.composeTab === "custom"
        ? shelf.composeTab
        : "custom";
  activeBayOptionId = shelfId;
  const nextOpen = buildPresetModuleOptionOpenFromDirectComposeEdge({
    moduleType: "normal",
    edgeId: shelfId,
    preserveDraft,
    initialTab: resolvedInitialTab,
    backContext,
    cloneTargetSnapshot: clonePreviewAddTargetSnapshot,
    fallbackReturnFocusEl: previewAddFlowState.anchorEl,
  });
  if (!nextOpen) return;
  openPresetModuleOptionModal(nextOpen.moduleType, nextOpen.options);
}

function buildModalDraftAddonBreakdown(edgeId, rodCount) {
  const normalizedRodCount = Math.max(0, Math.floor(Number(rodCount || 0)));
  if (!edgeId) {
    return { componentSummary: "-", furnitureSummary: "-", rodCount: normalizedRodCount, furnitureAddonId: "" };
  }
  const baseAddonIds = getShelfAddonIds(edgeId).filter((addonId) => addonId !== ADDON_CLOTHES_ROD_ID);
  return {
    componentSummary: buildRodAddonSummary(normalizedRodCount, "-"),
    furnitureSummary: buildFurnitureAddonSummary(baseAddonIds, "-"),
    rodCount: normalizedRodCount,
    furnitureAddonId: String(baseAddonIds[0] || ""),
  };
}

function getModuleOptionAverageHeightMm() {
  const input = readCurrentInputs();
  const layout = getLayoutConfigSnapshot(input);
  const lowest = Number(layout.lowestHeightMm || 0);
  const highest = Number(layout.highestHeightMm || 0);
  if (lowest > 0 && highest > 0) return Math.round((lowest + highest) / 2);
  if (highest > 0) return Math.round(highest);
  if (lowest > 0) return Math.round(lowest);
  return 0;
}

function buildModuleFrontPreviewGeometry({ shelfWidthMm, averageHeightMm } = {}) {
  const columnThicknessMm = 20;
  const shelfThicknessMm = 20;
  const widthMm = Math.max(200, Math.round(Number(shelfWidthMm || 0) || 600));
  const minHeightMm = Number(LIMITS.column.minLength || MODULE_POST_BAR_HEIGHT_LIMITS.min);
  const heightMm = Math.max(minHeightMm, Math.round(Number(averageHeightMm || 0) || minHeightMm));
  const totalWidthMm = widthMm + columnThicknessMm * 2;
  const widthMinRef = 400;
  const widthMaxRef = 1000;
  const heightMaxRef = Math.max(
    Number(LIMITS.column.maxLength || MODULE_POST_BAR_HEIGHT_LIMITS.max) + 600,
    minHeightMm + 600
  );
  const baselineShelfWidthMm = 400;
  const baselineTotalWidthMm = baselineShelfWidthMm + columnThicknessMm * 2;
  const clamp01 = (value) => Math.min(1, Math.max(0, Number(value || 0)));
  const widthRatio = clamp01((widthMm - widthMinRef) / Math.max(1, widthMaxRef - widthMinRef));
  const heightRatio = clamp01((heightMm - minHeightMm) / Math.max(1, heightMaxRef - minHeightMm));
  const easedWidth = Math.pow(widthRatio, 0.92);
  const easedHeight = Math.pow(heightRatio, 0.86);

  // Schematic mode: horizontal size responds to shelf width, but vertical size is anchored to the 400mm baseline.
  const totalWidthPx = Math.round(154 + easedWidth * 82); // 154 ~ 236
  const baseHeightPx = Math.round(212 + easedHeight * 146); // 212 ~ 358
  const baselineWidthRatio = clamp01((baselineShelfWidthMm - widthMinRef) / Math.max(1, widthMaxRef - widthMinRef));
  const baselineEasedWidth = Math.pow(baselineWidthRatio, 0.92);
  const baselineTotalWidthPx = Math.round(154 + baselineEasedWidth * 82); // 400mm 기준 폭 px
  const actualAspectRatio = heightMm / Math.max(1, baselineTotalWidthMm);
  const aspectRatioNorm = clamp01((actualAspectRatio - 2.0) / 2.8);
  const visualAspectRatio = 1.55 + aspectRatioNorm * 0.72; // 1.55 ~ 2.27
  const aspectDrivenHeightPx = Math.round(baselineTotalWidthPx * visualAspectRatio);
  const heightPx = Math.min(420, Math.max(baseHeightPx, aspectDrivenHeightPx));
  const exactScale = Math.max(0.02, Math.min(totalWidthPx / totalWidthMm, heightPx / heightMm));

  // Thickness is shown as a schematic exaggeration while still based on the 20mm real thickness.
  const exaggeratedThicknessPx = Math.round(columnThicknessMm * exactScale * 2.4);
  const columnThicknessPx = Math.min(14, Math.max(5, exaggeratedThicknessPx));
  const shelfThicknessPx = Math.min(10, Math.max(4, Math.round(shelfThicknessMm * exactScale * 2.2)));
  const shelfWidthPx = Math.max(40, totalWidthPx - columnThicknessPx * 2);
  const scale = exactScale;

  return {
    scale,
    widthMm,
    heightMm,
    totalWidthMm,
    totalWidthPx,
    heightPx,
    columnThicknessMm,
    columnThicknessPx,
    shelfThicknessMm,
    shelfThicknessPx,
    shelfWidthPx,
  };
}

function normalizeModuleFrontPreviewColor(value, fallback) {
  const raw = String(value || "").trim();
  return /^#([0-9a-fA-F]{3,8})$/.test(raw) ? raw : fallback;
}

function buildModuleFrontPreviewAlphaColor(color, alpha, fallback = "rgba(0, 0, 0, 0.2)") {
  const safeAlpha = clampModuleFrontPreviewValue(Number(alpha || 0), 0, 1);
  const raw = String(color || "").trim();
  if (!raw) return fallback;
  const hexMatch = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    const hex = hexMatch[1];
    const expandHex = (value) => (value.length === 1 ? `${value}${value}` : value);
    const isShort = hex.length === 3;
    const r = parseInt(expandHex(isShort ? hex[0] : hex.slice(0, 2)), 16);
    const g = parseInt(expandHex(isShort ? hex[1] : hex.slice(2, 4)), 16);
    const b = parseInt(expandHex(isShort ? hex[2] : hex.slice(4, 6)), 16);
    if ([r, g, b].every((value) => Number.isFinite(value))) {
      return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
    }
  }
  const rgbMatch = raw.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (rgbMatch) {
    const r = clampModuleFrontPreviewValue(Number(rgbMatch[1] || 0), 0, 255);
    const g = clampModuleFrontPreviewValue(Number(rgbMatch[2] || 0), 0, 255);
    const b = clampModuleFrontPreviewValue(Number(rgbMatch[3] || 0), 0, 255);
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${safeAlpha})`;
  }
  return fallback;
}

function getModuleFrontPreviewMaterialColors(input = readCurrentInputs()) {
  const safeInput = input && typeof input === "object" ? input : {};
  const shelfMat = SYSTEM_SHELF_MATERIALS[safeInput?.shelf?.materialId];
  const columnMat = SYSTEM_COLUMN_MATERIALS[safeInput?.column?.materialId];
  return {
    shelfColor: normalizeModuleFrontPreviewColor(shelfMat?.swatch, "rgba(0, 0, 0, 0.28)"),
    postBarColor: normalizeModuleFrontPreviewColor(columnMat?.swatch, "rgba(0, 0, 0, 0.2)"),
  };
}

const MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM = 2300;
const MODULE_FRONT_PREVIEW_TOP_UNDERSIDE_SPAN_MM = 1940;
const MODULE_FRONT_PREVIEW_BOTTOM_SHELF_TOP_FROM_FLOOR_MM = 70;
const MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM = 40;
const MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM = 200;
const MODULE_FRONT_PREVIEW_FLOOR_FURNITURE_LEG_HEIGHT_MM = 35;
const MODULE_FRONT_PREVIEW_MIN_GAP_MM = 80;
const MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM = 180;
const MODULE_FRONT_PREVIEW_GSH1_LOWER_CLEAR_MM = 370;

function getAddonItemById(addonId) {
  const key = String(addonId || "");
  if (!key) return null;
  return SYSTEM_ADDON_ITEMS.find((item) => String(item?.id || "") === key) || null;
}

function getModuleFrontPreviewFurnitureSpec(furnitureAddonId = "") {
  const addon = getAddonItemById(furnitureAddonId);
  if (!addon) return null;
  const addonId = String(addon.id || "");
  const normalizedId = addonId.toLowerCase();
  const isFloating = normalizedId.includes("hanging");
  const isFloor = normalizedId.includes("floor");
  if (!isFloating && !isFloor) return null;
  const tierMatch = normalizedId.match(/(\d+)tier/);
  const tierCount = Math.max(1, Math.floor(Number(tierMatch?.[1] || 1)));
  return {
    addonId,
    kind: isFloor ? "floor" : "floating",
    tierCount,
  };
}

function clampModuleFrontPreviewValue(value, min, max) {
  if (!Number.isFinite(Number(value))) return min;
  return Math.min(max, Math.max(min, Number(value)));
}

function buildModuleFrontPreviewInterpolatedPositionsMm(count, startMm, endMm) {
  const normalizedCount = Math.max(0, Math.floor(Number(count || 0)));
  if (normalizedCount <= 0) return [];
  const safeStart = Number(startMm || 0);
  const safeEnd = Number(endMm || 0);
  if (normalizedCount === 1) return [safeStart];
  const span = safeEnd - safeStart;
  return Array.from({ length: normalizedCount }, (_, index) => safeStart + span * (index / (normalizedCount - 1)));
}

function buildModuleFrontPreviewInteriorPositionsMm(count, startMm, endMm) {
  const normalizedCount = Math.max(0, Math.floor(Number(count || 0)));
  if (normalizedCount <= 0) return [];
  const safeStart = Number(startMm || 0);
  const safeEnd = Number(endMm || 0);
  const span = safeEnd - safeStart;
  return Array.from(
    { length: normalizedCount },
    (_, index) => safeStart + span * ((index + 1) / (normalizedCount + 1))
  );
}

function buildModuleFrontPreviewInteriorSteppedShelfTopPositionsMm({
  shelfCount = 0,
  startUndersideMm = 0,
  endTopMm = 0,
  shelfThicknessMm = 20,
} = {}) {
  const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount || 0)));
  if (normalizedShelfCount <= 0) return [];
  const safeStartUndersideMm = Number(startUndersideMm || 0);
  const safeEndTopMm = Number(endTopMm || 0);
  const safeShelfThicknessMm = Math.max(1, Number(shelfThicknessMm || 20));
  const clearSpanMm = Math.max(0, safeEndTopMm - safeStartUndersideMm);
  const gapCount = normalizedShelfCount + 1;
  const gapMm = Math.max(
    0,
    (clearSpanMm - normalizedShelfCount * safeShelfThicknessMm) / gapCount
  );
  const topClampMin = safeStartUndersideMm;
  const topClampMax = Math.max(topClampMin, safeEndTopMm - safeShelfThicknessMm);
  const positions = [];
  let nextTopMm = safeStartUndersideMm + gapMm;
  for (let index = 0; index < normalizedShelfCount; index += 1) {
    positions.push(clampModuleFrontPreviewValue(nextTopMm, topClampMin, topClampMax));
    nextTopMm += safeShelfThicknessMm + gapMm;
  }
  return positions;
}

function buildModuleFrontPreviewSteppedShelfPositionsMm({
  shelfCount = 0,
  topShelfTopMm = 0,
  bottomShelfTopMm = 0,
  shelfThicknessMm = 20,
} = {}) {
  const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount || 0)));
  if (normalizedShelfCount <= 0) return [];
  const safeTopShelfTopMm = Number(topShelfTopMm || 0);
  const safeBottomShelfTopMm = Number(bottomShelfTopMm || 0);
  const safeShelfThicknessMm = Math.max(1, Number(shelfThicknessMm || 20));
  if (normalizedShelfCount === 1) return [safeTopShelfTopMm];
  const clearSpanMm = Math.max(
    0,
    safeBottomShelfTopMm - (safeTopShelfTopMm + safeShelfThicknessMm)
  );
  const internalShelfCount = Math.max(0, normalizedShelfCount - 2);
  const gapCount = Math.max(1, normalizedShelfCount - 1);
  const gapMm = Math.max(
    0,
    (clearSpanMm - internalShelfCount * safeShelfThicknessMm) / gapCount
  );
  const positions = [safeTopShelfTopMm];
  for (let index = 1; index < normalizedShelfCount; index += 1) {
    const prevTopMm = positions[index - 1];
    positions.push(prevTopMm + safeShelfThicknessMm + gapMm);
  }
  if (positions.length >= 2) {
    positions[positions.length - 1] = safeBottomShelfTopMm;
  }
  return positions;
}

function getModuleFrontPreviewShelfAnchorsMm({ heightMm = 0, shelfThicknessMm = 20 } = {}) {
  const safeHeightMm = Math.max(0, Number(heightMm || 0));
  const safeThicknessMm = Math.max(1, Number(shelfThicknessMm || 20));
  const bottomShelfTopMm = Math.max(
    safeThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM,
    safeHeightMm - MODULE_FRONT_PREVIEW_BOTTOM_SHELF_TOP_FROM_FLOOR_MM
  );
  const scaledSpanMm =
    MODULE_FRONT_PREVIEW_TOP_UNDERSIDE_SPAN_MM *
    (safeHeightMm / Math.max(1, MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM));
  const maxAllowedSpanMm = Math.max(240, bottomShelfTopMm - safeThicknessMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM);
  const topUndersideToBottomTopMm = clampModuleFrontPreviewValue(
    scaledSpanMm,
    240,
    maxAllowedSpanMm
  );
  const topShelfUndersideMm = bottomShelfTopMm - topUndersideToBottomTopMm;
  const topShelfTopMm = Math.max(0, topShelfUndersideMm - safeThicknessMm);
  return {
    topShelfTopMm,
    bottomShelfTopMm,
  };
}

function getModuleFrontPreviewIntervalOverlapMm(aStartMm, aEndMm, bStartMm, bEndMm) {
  const start = Math.max(Number(aStartMm || 0), Number(bStartMm || 0));
  const end = Math.min(Number(aEndMm || 0), Number(bEndMm || 0));
  return Math.max(0, end - start);
}

function getModuleFrontPreviewClearDimensionBetweenShelves({
  upperShelfTopMm = 0,
  lowerShelfTopMm = 0,
  shelfThicknessMm = 20,
  furnitureBox = null,
} = {}) {
  const clearStartMm = Number(upperShelfTopMm || 0) + Number(shelfThicknessMm || 0);
  const clearEndMm = Number(lowerShelfTopMm || 0);
  if (!(clearEndMm > clearStartMm)) {
    return {
      clearMm: 0,
      centerMm: clearStartMm,
    };
  }

  const segments = [{ startMm: clearStartMm, endMm: clearEndMm }];
  if (furnitureBox && typeof furnitureBox === "object") {
    const occupiedStartMm = Number(furnitureBox.topMm || 0);
    const occupiedEndMm = Number(furnitureBox.bottomMm || 0);
    const overlapMm = getModuleFrontPreviewIntervalOverlapMm(
      clearStartMm,
      clearEndMm,
      occupiedStartMm,
      occupiedEndMm
    );
    if (overlapMm > 0) {
      segments.length = 0;
      const leftEndMm = Math.max(clearStartMm, Math.min(clearEndMm, occupiedStartMm));
      const rightStartMm = Math.max(clearStartMm, Math.min(clearEndMm, occupiedEndMm));
      if (leftEndMm > clearStartMm) {
        segments.push({
          startMm: clearStartMm,
          endMm: leftEndMm,
        });
      }
      if (clearEndMm > rightStartMm) {
        segments.push({
          startMm: rightStartMm,
          endMm: clearEndMm,
        });
      }
    }
  }

  const clearMm = segments.reduce(
    (sum, segment) => sum + Math.max(0, Number(segment.endMm || 0) - Number(segment.startMm || 0)),
    0
  );

  if (!segments.length) {
    return {
      clearMm,
      centerMm: clearStartMm + (clearEndMm - clearStartMm) / 2,
    };
  }

  const anchorSegment = [...segments].sort((a, b) => {
    const aLen = Number(a.endMm || 0) - Number(a.startMm || 0);
    const bLen = Number(b.endMm || 0) - Number(b.startMm || 0);
    return bLen - aLen;
  })[0];
  return {
    clearMm,
    centerMm: Number(anchorSegment.startMm || 0) + (Number(anchorSegment.endMm || 0) - Number(anchorSegment.startMm || 0)) / 2,
  };
}

function getModuleFrontPreviewFurnitureGapDimensions({
  shelfTopPositionsMm = [],
  shelfThicknessMm = 20,
  furnitureBox = null,
  heightMm = 0,
} = {}) {
  if (!furnitureBox || typeof furnitureBox !== "object") return [];
  const furnitureTopMm = Number(furnitureBox.topMm || 0);
  const furnitureBottomMm = Number(furnitureBox.bottomMm || 0);
  if (!Number.isFinite(furnitureTopMm) || !Number.isFinite(furnitureBottomMm) || furnitureBottomMm <= furnitureTopMm) {
    return [];
  }
  const shelves = (Array.isArray(shelfTopPositionsMm) ? shelfTopPositionsMm : [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!shelves.length) return [];

  const safeShelfThicknessMm = Math.max(1, Number(shelfThicknessMm || 20));
  const dimensions = [];

  let upperShelfTopMm = null;
  for (const shelfTopMm of shelves) {
    const undersideMm = shelfTopMm + safeShelfThicknessMm;
    if (undersideMm <= furnitureTopMm) {
      upperShelfTopMm = shelfTopMm;
    }
  }
  if (Number.isFinite(upperShelfTopMm)) {
    const upperUndersideMm = Number(upperShelfTopMm) + safeShelfThicknessMm;
    const clearAboveMm = Math.max(0, furnitureTopMm - upperUndersideMm);
    if (clearAboveMm > 0) {
      dimensions.push({
        key: "furniture-above",
        clearMm: clearAboveMm,
        centerMm: upperUndersideMm + clearAboveMm / 2,
      });
    }
  }

  const lowerShelfTopMm = shelves.find((shelfTopMm) => shelfTopMm >= furnitureBottomMm);
  if (Number.isFinite(lowerShelfTopMm)) {
    const clearBelowMm = Math.max(0, Number(lowerShelfTopMm) - furnitureBottomMm);
    if (clearBelowMm > 0) {
      dimensions.push({
        key: "furniture-below",
        clearMm: clearBelowMm,
        centerMm: furnitureBottomMm + clearBelowMm / 2,
      });
    }
  } else {
    const floorMm = Number(heightMm || 0);
    if (Number.isFinite(floorMm) && floorMm > furnitureBottomMm) {
      const clearFloorMm = Math.max(0, floorMm - furnitureBottomMm);
      if (clearFloorMm > 0) {
        dimensions.push({
          key: "furniture-floor",
          clearMm: clearFloorMm,
          centerMm: furnitureBottomMm + clearFloorMm / 2,
        });
      }
    }
  }

  return dimensions;
}

function buildModuleFrontPreviewLayout({
  shelfCount = 0,
  rodCount = 0,
  furnitureAddonId = "",
  moduleType = "bay",
  geometry,
} = {}) {
  const heightMm = Math.max(0, Number(geometry?.heightMm || 0));
  const shelfThicknessMm = Math.max(1, Number(geometry?.shelfThicknessMm || 20));
  const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount || 0)));
  const normalizedRodCount = Math.max(0, Math.floor(Number(rodCount || 0)));
  const furniture = getModuleFrontPreviewFurnitureSpec(furnitureAddonId);
  const shelfRenderLimit = furniture ? 6 : 8;
  const visibleShelfCount = Math.min(normalizedShelfCount, shelfRenderLimit);
  const shelfOverflowCount = Math.max(0, normalizedShelfCount - visibleShelfCount);
  const anchors = getModuleFrontPreviewShelfAnchorsMm({ heightMm, shelfThicknessMm });
  const topShelfTopMm = anchors.topShelfTopMm;
  const bottomShelfTopMm = anchors.bottomShelfTopMm;

  let shelfTopPositionsMm = [];
  let furnitureBox = null;
  if (furniture?.kind === "floor") {
    const requestedDrawerBodyHeightMm = Math.max(
      MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM,
      MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM * furniture.tierCount
    );
    const requestedLegHeightMm = Math.max(0, MODULE_FRONT_PREVIEW_FLOOR_FURNITURE_LEG_HEIGHT_MM);
    const requestedDrawerHeightMm = requestedDrawerBodyHeightMm + requestedLegHeightMm;
    const maxDrawerHeightMm = Math.max(
      MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM + requestedLegHeightMm,
      heightMm - topShelfTopMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM
    );
    const drawerHeightMm = Math.min(requestedDrawerHeightMm, maxDrawerHeightMm);
    const drawerBottomMm = heightMm;
    const drawerTopMm = Math.max(
      topShelfTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM,
      drawerBottomMm - drawerHeightMm
    );
    const actualDrawerHeightMm = Math.max(0, drawerBottomMm - drawerTopMm);
    const legHeightMm = Math.min(
      requestedLegHeightMm,
      Math.max(0, actualDrawerHeightMm - MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM)
    );
    const bodyBottomMm = Math.max(drawerTopMm, drawerBottomMm - legHeightMm);
    if (visibleShelfCount <= 1) {
      shelfTopPositionsMm = visibleShelfCount === 1 ? [topShelfTopMm] : [];
    } else {
      // Floor drawer: evenly distribute lower shelves by equal clear gaps
      // between top shelf underside and furniture top, accounting shelf thickness.
      const topShelfUndersideMm = topShelfTopMm + shelfThicknessMm;
      const dividedPositionsMm = buildModuleFrontPreviewInteriorSteppedShelfTopPositionsMm({
        shelfCount: visibleShelfCount - 1,
        startUndersideMm: topShelfUndersideMm,
        endTopMm: drawerTopMm,
        shelfThicknessMm,
      });
      shelfTopPositionsMm = [topShelfTopMm, ...dividedPositionsMm];
    }
    furnitureBox = {
      ...furniture,
      topMm: drawerTopMm,
      bottomMm: drawerBottomMm,
      heightMm: actualDrawerHeightMm,
      bodyTopMm: drawerTopMm,
      bodyBottomMm,
      bodyHeightMm: Math.max(0, bodyBottomMm - drawerTopMm),
      legHeightMm,
      referenceShelfTopMm: null,
    };
  } else if (furniture?.kind === "floating") {
    const referenceShelfTopMm = topShelfTopMm + (bottomShelfTopMm - topShelfTopMm) / 2;
    const requestedDrawerHeightMm = Math.max(
      MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM,
      MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM * furniture.tierCount
    );
    const maxDrawerBottomMm = Math.max(
      referenceShelfTopMm + MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM,
      bottomShelfTopMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM
    );
    const drawerBottomMm = Math.min(maxDrawerBottomMm, referenceShelfTopMm + requestedDrawerHeightMm);
    const normalizedDrawerBottomMm = Math.max(
      referenceShelfTopMm + MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM,
      drawerBottomMm
    );
    const upperSpanMm = Math.max(0, referenceShelfTopMm - topShelfTopMm);
    const lowerSpanMm = Math.max(0, bottomShelfTopMm - normalizedDrawerBottomMm);
    if (visibleShelfCount <= 1) {
      shelfTopPositionsMm = visibleShelfCount === 1 ? [topShelfTopMm] : [];
    } else {
      const extraShelfCount = Math.max(0, visibleShelfCount - 2);
      const totalSpanMm = upperSpanMm + lowerSpanMm;
      let upperExtraCount = totalSpanMm > 0 ? Math.round((extraShelfCount * upperSpanMm) / totalSpanMm) : 0;
      upperExtraCount = clampModuleFrontPreviewValue(upperExtraCount, 0, extraShelfCount);
      if (upperSpanMm <= 0) upperExtraCount = 0;
      let lowerExtraCount = extraShelfCount - upperExtraCount;
      if (lowerSpanMm <= 0) {
        upperExtraCount = extraShelfCount;
        lowerExtraCount = 0;
      }
      const upperShelves = buildModuleFrontPreviewInteriorPositionsMm(
        upperExtraCount,
        topShelfTopMm,
        referenceShelfTopMm
      );
      const lowerShelves = buildModuleFrontPreviewInteriorPositionsMm(
        lowerExtraCount,
        normalizedDrawerBottomMm,
        bottomShelfTopMm
      );
      shelfTopPositionsMm = [topShelfTopMm, ...upperShelves, ...lowerShelves, bottomShelfTopMm];
    }
    furnitureBox = {
      ...furniture,
      topMm: referenceShelfTopMm,
      bottomMm: normalizedDrawerBottomMm,
      heightMm: Math.max(0, normalizedDrawerBottomMm - referenceShelfTopMm),
      bodyTopMm: referenceShelfTopMm,
      bodyBottomMm: normalizedDrawerBottomMm,
      bodyHeightMm: Math.max(0, normalizedDrawerBottomMm - referenceShelfTopMm),
      legHeightMm: 0,
      referenceShelfTopMm,
    };
  } else {
    shelfTopPositionsMm = buildModuleFrontPreviewSteppedShelfPositionsMm({
      shelfCount: visibleShelfCount,
      topShelfTopMm,
      bottomShelfTopMm,
      shelfThicknessMm,
    });
    if (
      String(moduleType || "bay") === "bay" &&
      visibleShelfCount === 3 &&
      normalizedRodCount === 1
    ) {
      const targetMiddleTopMm =
        bottomShelfTopMm - shelfThicknessMm - MODULE_FRONT_PREVIEW_GSH1_LOWER_CLEAR_MM;
      const minMiddleTopMm =
        topShelfTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const maxMiddleTopMm =
        bottomShelfTopMm - shelfThicknessMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const middleTopMm = clampModuleFrontPreviewValue(
        targetMiddleTopMm,
        minMiddleTopMm,
        Math.max(minMiddleTopMm, maxMiddleTopMm)
      );
      shelfTopPositionsMm = [topShelfTopMm, middleTopMm, bottomShelfTopMm];
    } else if (
      String(moduleType || "bay") === "bay" &&
      visibleShelfCount === 4 &&
      normalizedRodCount === 1
    ) {
      // GSH-3 style: keep top shelf/hanger, place one shelf at middle,
      // and place the remaining shelf at the midpoint between middle and bottom.
      const middleTargetTopMm = topShelfTopMm + (bottomShelfTopMm - topShelfTopMm) / 2;
      const minMiddleTopMm =
        topShelfTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const maxMiddleTopMm =
        bottomShelfTopMm - (shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM) * 2;
      const middleTopMm = clampModuleFrontPreviewValue(
        middleTargetTopMm,
        minMiddleTopMm,
        Math.max(minMiddleTopMm, maxMiddleTopMm)
      );

      const lowerTargetTopMm = middleTopMm + (bottomShelfTopMm - middleTopMm) / 2;
      const minLowerTopMm = middleTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const maxLowerTopMm =
        bottomShelfTopMm - shelfThicknessMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const lowerTopMm = clampModuleFrontPreviewValue(
        lowerTargetTopMm,
        minLowerTopMm,
        Math.max(minLowerTopMm, maxLowerTopMm)
      );

      shelfTopPositionsMm = [topShelfTopMm, middleTopMm, lowerTopMm, bottomShelfTopMm];
    }
  }

  const normalizedShelfTopPositionsMm = shelfTopPositionsMm
    .map((value) => clampModuleFrontPreviewValue(value, 0, heightMm - shelfThicknessMm))
    .sort((a, b) => a - b)
    .reduce((acc, value) => {
      if (!acc.length || Math.abs(acc[acc.length - 1] - value) >= 1) acc.push(value);
      return acc;
    }, []);

  const lowestShelfTopMm = normalizedShelfTopPositionsMm.length
    ? normalizedShelfTopPositionsMm[normalizedShelfTopPositionsMm.length - 1]
    : 0;
  const allowLowestShelfHanger = furnitureBox?.kind === "floor";
  const allowSingleShelfSingleRodHangerUnderShelf =
    !furnitureBox &&
    !allowLowestShelfHanger &&
    normalizedShelfTopPositionsMm.length === 1 &&
    normalizedRodCount === 1;
  const hangerCandidatesMm = [];
  const hangerAnchorShelves = allowLowestShelfHanger || allowSingleShelfSingleRodHangerUnderShelf
    ? normalizedShelfTopPositionsMm
    : normalizedShelfTopPositionsMm.slice(0, -1);
  if (hangerAnchorShelves.length) {
    hangerAnchorShelves.forEach((shelfTopMm) => {
      hangerCandidatesMm.push(shelfTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM);
    });
  }
  if (furnitureBox?.kind === "floating") {
    hangerCandidatesMm.push(furnitureBox.bottomMm + MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM);
  }
  const normalizedHangerCandidatesMm = hangerCandidatesMm
    .filter((value) => Number.isFinite(Number(value)))
    .map((value) => Number(value))
    .filter(
      (value) =>
        value > 0 &&
        value < heightMm &&
        (allowLowestShelfHanger || value < lowestShelfTopMm)
    )
    .sort((a, b) => a - b)
    .reduce((acc, value) => {
      if (!acc.length || Math.abs(acc[acc.length - 1] - value) >= 1) acc.push(value);
      return acc;
    }, []);
  const visibleRodCount = Math.min(normalizedRodCount, normalizedHangerCandidatesMm.length);
  const rodOverflowCount = Math.max(0, normalizedRodCount - visibleRodCount);
  const hangerPositionsMm = normalizedHangerCandidatesMm.slice(0, visibleRodCount);

  return {
    shelfTopPositionsMm: normalizedShelfTopPositionsMm,
    shelfOverflowCount,
    hangerPositionsMm,
    rodOverflowCount,
    furnitureBox,
  };
}

function buildModuleFrontPreviewHtml({
  moduleLabel = "모듈",
  sizeLabel = "",
  shelfCount = 1,
  rodCount = 0,
  furnitureAddonId = "",
  componentSummary = "-",
  furnitureSummary = "-",
  type = "bay",
  averageHeightMm = 0,
  shelfWidthMm = 0,
  shelfColor = "rgba(0, 0, 0, 0.28)",
  postBarColor = "rgba(0, 0, 0, 0.2)",
} = {}) {
  const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount ?? 0) || 0));
  const normalizedRodCount = Math.max(0, Math.floor(Number(rodCount ?? 0) || 0));
  const safeComponentSummary =
    componentSummary && componentSummary !== "-" ? componentSummary : "없음";
  const safeFurnitureSummary =
    furnitureSummary && furnitureSummary !== "-" ? furnitureSummary : "없음";
  const previewHeightMm = MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM;
  const geometry = buildModuleFrontPreviewGeometry({
    shelfWidthMm,
    averageHeightMm: previewHeightMm,
  });
  const layout = buildModuleFrontPreviewLayout({
    shelfCount: normalizedShelfCount,
    rodCount: normalizedRodCount,
    furnitureAddonId,
    moduleType: type,
    geometry,
  });
  const frameHeightPx = Math.max(1, Number(geometry.heightPx || 1));
  const mmToPx = (valueMm) =>
    clampModuleFrontPreviewValue(
      Math.round(Number(valueMm || 0) * Number(geometry.scale || 0)),
      0,
      frameHeightPx
    );
  const shelfLinesHtml = layout.shelfTopPositionsMm
    .map((shelfTopMm) => {
      const topPx = clampModuleFrontPreviewValue(
        mmToPx(shelfTopMm),
        0,
        frameHeightPx - geometry.shelfThicknessPx
      );
      return `
        <div
          class="module-front-preview-shelf-line"
          style="
            top:${topPx}px;
            left:${geometry.columnThicknessPx}px;
            width:${geometry.shelfWidthPx}px;
            height:${geometry.shelfThicknessPx}px;
            background:${shelfColor};
          "
        ></div>
      `;
    })
    .join("");
  const hangerWidthPx = Math.max(40, Math.round(geometry.shelfWidthPx));
  const hangerLeftPx = geometry.columnThicknessPx;
  const hangerThicknessPx = Math.max(3, Math.min(7, Math.round(geometry.shelfThicknessPx * 0.45)));
  const hangerBorderColor = "rgba(0, 0, 0, 0.28)";
  const hangerInnerStrokeColor = "rgba(255, 255, 255, 0.16)";
  const hangerLinesHtml = layout.hangerPositionsMm
    .map((hangerTopMm) => {
      const topPx = clampModuleFrontPreviewValue(mmToPx(hangerTopMm), 0, frameHeightPx - hangerThicknessPx);
      return `
        <div
          class="module-front-preview-hanger-line"
          style="
            top:${topPx}px;
            left:${hangerLeftPx}px;
            width:${hangerWidthPx}px;
            height:${hangerThicknessPx}px;
            background:${postBarColor};
            --module-front-hanger-border:${hangerBorderColor};
            --module-front-hanger-inner-stroke:${hangerInnerStrokeColor};
          "
        ></div>
      `;
    })
    .join("");
  let furnitureHtml = "";
  if (layout.furnitureBox) {
    const furnitureWidthPx = Math.max(40, Math.round(geometry.shelfWidthPx));
    const furnitureLeftPx = geometry.columnThicknessPx;
    const furnitureTopPx = clampModuleFrontPreviewValue(
      mmToPx(layout.furnitureBox.topMm),
      0,
      frameHeightPx - 24
    );
    const furnitureHeightPxRaw = Math.max(
      Math.round(Number(layout.furnitureBox.heightMm || 0) * Number(geometry.scale || 0)),
      Math.max(26, Math.round(layout.furnitureBox.tierCount * 18))
    );
    const furnitureHeightPx = clampModuleFrontPreviewValue(
      furnitureHeightPxRaw,
      24,
      frameHeightPx - furnitureTopPx
    );
    const furnitureBorderColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.66,
      "rgba(0, 0, 0, 0.24)"
    );
    const furnitureFillColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.22,
      "rgba(0, 0, 0, 0.08)"
    );
    const furnitureTierBorderColor = furnitureBorderColor;
    const furnitureTierFillColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.12,
      "rgba(255, 255, 255, 0.78)"
    );
    const furnitureLegBorderColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.52,
      "rgba(0, 0, 0, 0.3)"
    );
    const furnitureLegFillColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.2,
      "rgba(0, 0, 0, 0.1)"
    );
    const hasFloorLegs =
      String(layout.furnitureBox.kind || "") === "floor" && Number(layout.furnitureBox.legHeightMm || 0) > 0;
    const legHeightPx = hasFloorLegs
      ? clampModuleFrontPreviewValue(
          Math.round(Number(layout.furnitureBox.legHeightMm || 0) * Number(geometry.scale || 0)),
          3,
          Math.max(3, Math.round(furnitureHeightPx * 0.32))
        )
      : 0;
    const furnitureBodyHeightPx = Math.max(18, furnitureHeightPx - legHeightPx);
    const furnitureBodyBottomPx = hasFloorLegs ? legHeightPx : 0;
    const tierCellsHtml = Array.from({ length: layout.furnitureBox.tierCount }, () => {
      return `<span class="module-front-preview-furniture-tier"></span>`;
    }).join("");
    const floorLegsHtml = hasFloorLegs
      ? `
        <div class="module-front-preview-furniture-legs">
          <span class="module-front-preview-furniture-leg module-front-preview-furniture-leg--left"></span>
          <span class="module-front-preview-furniture-leg module-front-preview-furniture-leg--right"></span>
        </div>
      `
      : "";
    const furnitureHeightLabelMm = Math.max(0, Math.round(Number(layout.furnitureBox.heightMm || 0)));
    const furnitureHeightChipHtml =
      furnitureHeightLabelMm > 0
        ? `<span class="module-front-preview-dimension-label module-front-preview-furniture-height-chip">${furnitureHeightLabelMm}mm</span>`
        : "";
    furnitureHtml = `
      <div
        class="module-front-preview-furniture module-front-preview-furniture--${escapeHtml(layout.furnitureBox.kind)}"
        style="
          top:${furnitureTopPx}px;
          left:${furnitureLeftPx}px;
          width:${furnitureWidthPx}px;
          height:${furnitureHeightPx}px;
          --module-front-furniture-border:${furnitureBorderColor};
          --module-front-furniture-fill:${furnitureFillColor};
          --module-front-furniture-tier-border:${furnitureTierBorderColor};
          --module-front-furniture-tier-fill:${furnitureTierFillColor};
          --module-front-furniture-leg-border:${furnitureLegBorderColor};
          --module-front-furniture-leg-fill:${furnitureLegFillColor};
          --module-front-furniture-leg-height:${legHeightPx}px;
        "
      >
        <div class="module-front-preview-furniture-body" style="height:${furnitureBodyHeightPx}px; bottom:${furnitureBodyBottomPx}px;">
          ${furnitureHeightChipHtml}
          <div
            class="module-front-preview-furniture-grid"
            style="grid-template-rows:repeat(${layout.furnitureBox.tierCount}, minmax(0, 1fr));"
          >
            ${tierCellsHtml}
          </div>
        </div>
        ${floorLegsHtml}
      </div>
    `;
  }
  const dimensionEntries = [];
  if (layout.shelfTopPositionsMm.length) {
    const topShelfTopMm = Number(layout.shelfTopPositionsMm[0] || 0);
    if (topShelfTopMm > 0) {
      dimensionEntries.push({
        key: "top-remainder",
        label: "나머지",
        centerMm: topShelfTopMm / 2,
      });
    }
  }
  if (layout.shelfTopPositionsMm.length === 1) {
    const onlyShelfTopMm = Number(layout.shelfTopPositionsMm[0] || 0);
    const floorGapDimension = getModuleFrontPreviewClearDimensionBetweenShelves({
      upperShelfTopMm: onlyShelfTopMm,
      lowerShelfTopMm: Number(geometry.heightMm || 0),
      shelfThicknessMm: geometry.shelfThicknessMm,
      furnitureBox: layout.furnitureBox,
    });
    const floorClearMm = Math.max(0, Number(floorGapDimension.clearMm || 0));
    const floorCenterMm = Number(floorGapDimension.centerMm || 0);
    const roundedFloorClearMm = Math.max(0, Math.round(floorClearMm / 10) * 10);
    dimensionEntries.push({
      key: "clear-floor-0",
      label: `${roundedFloorClearMm}mm`,
      centerMm: floorCenterMm,
    });
  }
  for (let index = 0; index < layout.shelfTopPositionsMm.length - 1; index += 1) {
    const upperShelfTopMm = Number(layout.shelfTopPositionsMm[index] || 0);
    const lowerShelfTopMm = Number(layout.shelfTopPositionsMm[index + 1] || 0);
    const clearDimension = getModuleFrontPreviewClearDimensionBetweenShelves({
      upperShelfTopMm,
      lowerShelfTopMm,
      shelfThicknessMm: geometry.shelfThicknessMm,
      furnitureBox: layout.furnitureBox,
    });
    const clearMm = Math.max(0, Number(clearDimension.clearMm || 0));
    const centerMm = Number(clearDimension.centerMm || 0);
    const roundedClearMm = Math.max(0, Math.round(clearMm / 10) * 10);
    dimensionEntries.push({
      key: `clear-${index}`,
      label: `${roundedClearMm}mm`,
      centerMm,
    });
  }
  const furnitureGapDimensions = getModuleFrontPreviewFurnitureGapDimensions({
    shelfTopPositionsMm: layout.shelfTopPositionsMm,
    shelfThicknessMm: geometry.shelfThicknessMm,
    furnitureBox: layout.furnitureBox,
    heightMm: geometry.heightMm,
  });
  furnitureGapDimensions.forEach((entry, index) => {
    const clearMm = Math.max(0, Number(entry.clearMm || 0));
    const centerMm = Number(entry.centerMm || 0);
    const roundedClearMm = Math.max(0, Math.round(clearMm / 10) * 10);
    dimensionEntries.push({
      key: `${String(entry.key || "furniture-gap")}-${index}`,
      label: `${roundedClearMm}mm`,
      centerMm,
    });
  });
  const dimensionAnchorLeftPx = Math.round(geometry.totalWidthPx / 2);
  const dimensionEntriesHtml = dimensionEntries
    .map((entry) => {
      const topPx = clampModuleFrontPreviewValue(mmToPx(entry.centerMm), 6, frameHeightPx - 6);
      return `
        <div
          class="module-front-preview-dimension"
          style="top:${topPx}px; left:${dimensionAnchorLeftPx}px;"
        >
          <span class="module-front-preview-dimension-label">${escapeHtml(entry.label)}</span>
        </div>
      `;
    })
    .join("");
  const dimensionGutterPx = 0;
  const overflowChips = [];
  if (layout.shelfOverflowCount > 0) overflowChips.push(`+${layout.shelfOverflowCount} 선반`);
  if (layout.rodOverflowCount > 0) overflowChips.push(`+${layout.rodOverflowCount} 행거`);
  const overflowChipsHtml = overflowChips.length
    ? `
      <div class="module-front-preview-chip-stack">
        ${overflowChips
          .map((label) => `<span class="module-front-preview-chip">${escapeHtml(label)}</span>`)
          .join("")}
      </div>
    `
    : "";

  return `
    <div class="module-front-preview-card module-front-preview-card--${escapeHtml(type)}">
      <div class="module-front-preview-head">
        <div class="module-front-preview-title">${escapeHtml(moduleLabel)} 정면 미리보기</div>
        ${sizeLabel ? `<span class="module-front-preview-chip">${escapeHtml(sizeLabel)}</span>` : ""}
      </div>
      <div class="module-front-preview-canvas" aria-hidden="true">
        <div
          class="module-front-preview-box module-front-preview-box--${escapeHtml(type)}"
          style="width:${geometry.totalWidthPx}px; height:${geometry.heightPx}px; margin-left:${dimensionGutterPx}px;"
        >
          <div class="module-front-preview-side module-front-preview-side--left" style="width:${geometry.columnThicknessPx}px; background:${postBarColor};"></div>
          <div class="module-front-preview-side module-front-preview-side--right" style="width:${geometry.columnThicknessPx}px; background:${postBarColor};"></div>
          ${furnitureHtml}
          ${shelfLinesHtml}
          ${hangerLinesHtml}
          ${dimensionEntriesHtml}
        </div>
        ${overflowChipsHtml}
      </div>
      <div class="module-front-preview-meta">
        <div class="module-front-preview-row">
          <span class="label">선반 갯수</span>
          <strong>${normalizedShelfCount}개</strong>
        </div>
        <div class="module-front-preview-row">
          <span class="label">구성품</span>
          <span class="value">${escapeHtml(safeComponentSummary)}</span>
        </div>
        <div class="module-front-preview-row">
          <span class="label">가구</span>
          <span class="value">${escapeHtml(safeFurnitureSummary)}</span>
        </div>
      </div>
      <div class="module-front-preview-note">미리보기는 높이 2300을 기준으로 한 예시입니다. 실제 설치 시 현장 상황과 간격 조정에 따라 일부 구성이 달라질 수 있습니다.</div>
    </div>
  `;
}

function renderBayOptionFrontPreview() {
  const container = $("#bayOptionFrontPreview");
  if (!container) return;
  if (!activeBayOptionId) {
    updateBayOptionModalApplyButtonState();
    container.innerHTML = "";
    return;
  }
  const shelf = findShelfById(activeBayOptionId);
  if (!shelf) {
    container.innerHTML = "";
    return;
  }
  const presetSelect = $("#bayWidthPresetSelect");
  const customInput = $("#bayWidthCustomInput");
  const countInput = $("#bayCountInput");
  const rodCountInput = $("#bayRodCountInput");
  const isCustom = presetSelect?.value === "custom";
  const widthErrorEl = $("#bayWidthError");
  const widthValue = Number(
    (isCustom ? customInput?.value : presetSelect?.value) || Number(shelf.width || 0) || 0
  );
  if (customInput && widthErrorEl) {
    const rawCustomWidth = String(customInput.value || "").trim();
    let widthMessage = "";
    if (isCustom && rawCustomWidth) {
      const numericWidth = Number(rawCustomWidth);
      if (
        !Number.isFinite(numericWidth) ||
        numericWidth < MODULE_SHELF_WIDTH_LIMITS.min ||
        numericWidth > MODULE_SHELF_WIDTH_LIMITS.max
      ) {
        widthMessage = `폭은 ${MODULE_SHELF_WIDTH_LIMITS.min}~${MODULE_SHELF_WIDTH_LIMITS.max}mm 범위 내로 입력해주세요.`;
      }
    }
    setFieldError(customInput, widthErrorEl, widthMessage);
  }
  syncBayOptionFurnitureSelectionAvailability(widthValue);
  const shelfCount = Number(countInput?.value ?? shelf.count ?? 0);
  const rodCount = Number(rodCountInput?.value || getShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID) || 0);
  const {
    componentSummary,
    furnitureSummary,
    rodCount: normalizedRodCount,
    furnitureAddonId,
  } = buildModalDraftAddonBreakdown(shelf.id, rodCount);
  const averageHeightMm = getModuleOptionAverageHeightMm();
  const sizeLabel = widthValue > 0 ? `폭 ${Math.round(widthValue)}mm` : "";
  const previewColors = getModuleFrontPreviewMaterialColors();
  updateBayOptionModalApplyButtonState();
  container.innerHTML = buildModuleFrontPreviewHtml({
    moduleLabel: "모듈",
    sizeLabel,
    shelfCount,
    rodCount: normalizedRodCount,
    furnitureAddonId,
    componentSummary,
    furnitureSummary,
    type: "bay",
    averageHeightMm,
    shelfWidthMm: widthValue,
    shelfColor: previewColors.shelfColor,
    postBarColor: previewColors.postBarColor,
  });
}

function renderCornerOptionFrontPreview() {
  const container = $("#cornerOptionFrontPreview");
  if (!container) return;
  if (!activeCornerOptionId) {
    updateCornerOptionModalApplyButtonState();
    container.innerHTML = "";
    return;
  }
  const corner = findShelfById(activeCornerOptionId);
  if (!corner) {
    container.innerHTML = "";
    return;
  }
  const swapSelect = $("#cornerSwapSelect");
  const countInput = $("#cornerCountInput");
  const rodCountInput = $("#cornerRodCountInput");
  const mode = String(swapSelect?.value || (corner.swap ? "swap" : "default"));
  const isSwap = mode === "swap" ? true : mode === "default" ? false : Boolean(corner.swap);
  syncCornerCustomCutInputsUI();
  const customValidation = getCornerCustomCutValidationState();
  const isCustomCut = Boolean(customValidation.enabled);
  const frontShelfWidthMm = isCustomCut && customValidation.valid
    ? Number(customValidation.primaryMm || (isSwap ? 600 : 800))
    : isSwap
      ? 600
      : 800;
  const sizeLabel = isCustomCut
    ? customValidation.valid
      ? `${customValidation.primaryMm} × ${customValidation.secondaryMm}mm (비규격)`
      : "비규격(상담)"
    : isSwap
      ? "600 × 800mm"
      : "800 × 600mm";
  const shelfCount = Number(countInput?.value ?? corner.count ?? 0);
  const rodCount = Number(
    rodCountInput?.value || getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID) || 0
  );
  const {
    componentSummary,
    furnitureSummary,
    rodCount: normalizedRodCount,
    furnitureAddonId,
  } = buildModalDraftAddonBreakdown(corner.id, rodCount);
  const averageHeightMm = getModuleOptionAverageHeightMm();
  const previewColors = getModuleFrontPreviewMaterialColors();
  setCornerCustomCutError(isCustomCut && !customValidation.valid ? customValidation.message : "");
  updateCornerOptionModalApplyButtonState();
  container.innerHTML = buildModuleFrontPreviewHtml({
    moduleLabel: getCornerLabel(corner),
    sizeLabel,
    shelfCount,
    rodCount: normalizedRodCount,
    furnitureAddonId,
    componentSummary,
    furnitureSummary,
    type: "corner",
    averageHeightMm,
    shelfWidthMm: frontShelfWidthMm,
    shelfColor: previewColors.shelfColor,
    postBarColor: previewColors.postBarColor,
  });
}

function bindOptionModalFrontPreviewEvents() {
  const cornerSwapEl = $("#cornerSwapSelect");
  if (cornerSwapEl && cornerSwapEl.dataset.frontPreviewBound !== "true") {
    cornerSwapEl.dataset.frontPreviewBound = "true";
    cornerSwapEl.addEventListener("change", () => {
      syncCornerCustomCutInputsUI();
      renderCornerOptionFrontPreview();
    });
  }
  const cornerCustomPrimaryEl = $("#cornerCustomPrimaryInput");
  if (cornerCustomPrimaryEl && cornerCustomPrimaryEl.dataset.frontPreviewBound !== "true") {
    cornerCustomPrimaryEl.dataset.frontPreviewBound = "true";
    cornerCustomPrimaryEl.addEventListener("input", renderCornerOptionFrontPreview);
  }
  const cornerCustomSecondaryEl = $("#cornerCustomSecondaryInput");
  if (cornerCustomSecondaryEl && cornerCustomSecondaryEl.dataset.frontPreviewBound !== "true") {
    cornerCustomSecondaryEl.dataset.frontPreviewBound = "true";
    cornerCustomSecondaryEl.addEventListener("input", renderCornerOptionFrontPreview);
  }
  [
    ["#cornerCountInput", "input", renderCornerOptionFrontPreview],
    ["#cornerRodCountInput", "input", renderCornerOptionFrontPreview],
    ["#bayWidthPresetSelect", "change", renderBayOptionFrontPreview],
    ["#bayWidthCustomInput", "input", renderBayOptionFrontPreview],
    ["#bayCountInput", "input", renderBayOptionFrontPreview],
    ["#bayRodCountInput", "input", renderBayOptionFrontPreview],
  ].forEach(([selector, eventName, handler]) => {
    const el = $(selector);
    if (!el || el.dataset.frontPreviewBound === "true") return;
    el.dataset.frontPreviewBound = "true";
    el.addEventListener(eventName, handler);
  });
}

function saveBayOptionModal() {
  if (!activeBayOptionId) return;
  const shelf = findShelfById(activeBayOptionId);
  const presetSelect = $("#bayWidthPresetSelect");
  const customInput = $("#bayWidthCustomInput");
  const countInput = $("#bayCountInput");
  const rodCountInput = $("#bayRodCountInput");
  const widthError = $("#bayWidthError");
  const countError = $("#bayCountError");
  if (!shelf || !presetSelect || !countInput || !customInput) return;

  const isCustom = presetSelect.value === "custom";
  const width = Number((isCustom ? customInput.value : presetSelect.value) || 0);
  const count = Number(countInput.value || 0);
  const rodCountRaw = Number(rodCountInput?.value || 0);
  const rodCount = Number.isFinite(rodCountRaw)
    ? Math.max(0, Math.floor(rodCountRaw))
    : 0;

  let hasError = false;
  if (!width || width < MODULE_SHELF_WIDTH_LIMITS.min || width > MODULE_SHELF_WIDTH_LIMITS.max) {
    setFieldError(
      customInput,
      widthError,
      `폭은 ${MODULE_SHELF_WIDTH_LIMITS.min}~${MODULE_SHELF_WIDTH_LIMITS.max}mm 범위 내로 입력해주세요.`
    );
    hasError = true;
  } else {
    setFieldError(customInput, widthError, "");
  }

  if (!count || count < 1) {
    setFieldError(countInput, countError, "선반 갯수는 1개 이상이어야 합니다.");
    hasError = true;
  } else {
    setFieldError(countInput, countError, "");
  }
  if (hasError) return;

  const prevWidth = Number(shelf.width || 0);
  const prevCount = Number(shelf.count || 1);
  const prevRodCount = getShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID);
  const wasPendingAdd = isPendingEdge(shelf);
  const shouldMergeWithInlineInsertHistory =
    !wasPendingAdd &&
    String(inlineInsertPendingFirstSaveEdgeId || "") === String(shelf.id || "");
  if (wasPendingAdd) {
    pushBuilderHistory("add-normal");
  } else if (
    !shouldMergeWithInlineInsertHistory &&
    (prevWidth !== width || prevCount !== count || prevRodCount !== rodCount)
  ) {
    pushBuilderHistory("update-normal");
  }
  if (wasPendingAdd) delete shelf.pendingAdd;
  if (String(inlineInsertPendingFirstSaveEdgeId || "") === String(shelf.id || "")) {
    inlineInsertPendingFirstSaveEdgeId = "";
  }
  shelf.width = width;
  shelf.count = count;
  shelf.composeTab = "custom";
  setShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID, rodCount);
  enforceFurnitureAddonPolicyForEdge(shelf.id);
  bayDirectComposeDraft = null;
  closePresetModuleOptionModal({ returnFocus: false, clearState: true });
  renderBayInputs();
}

function reanchorChildrenAfterEdgeRemoval(removedEdge) {
  if (!removedEdge?.id) return;
  const removedId = String(removedEdge.id);
  const { startAliases, endAliases } = getEdgeEndpointAliasSets(removedEdge);
  const orphanEdges = getOrderedGraphEdges({ includePending: true }).filter((edge) => {
    if (!edge || edge.id === removedId) return false;
    const anchorId = String(edge.anchorEndpointId || "");
    if (!anchorId) return false;
    return (
      startAliases.has(anchorId) ||
      endAliases.has(anchorId) ||
      anchorId.startsWith(`${removedId}:`)
    );
  });

  let replacementAnchor = String(removedEdge.anchorEndpointId || "");
  const removedDir = hasValidPlacement(removedEdge.placement)
    ? normalizeDirection(removedEdge.placement.dirDx, removedEdge.placement.dirDy)
    : null;
  replacementAnchor = resolveAnchorForDirection(replacementAnchor, removedDir);
  if (!replacementAnchor || replacementAnchor.startsWith(`${removedId}:`)) {
    replacementAnchor = "root-endpoint";
  }

  orphanEdges.sort((a, b) => {
    const aTime = Number(a.createdAt || 0);
    const bTime = Number(b.createdAt || 0);
    if (aTime !== bTime) return aTime - bTime;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });

  orphanEdges.forEach((edge) => {
    const preferredDir = hasValidPlacement(edge.placement)
      ? normalizeDirection(edge.placement.dirDx, edge.placement.dirDy)
      : removedDir;
    const preferredInward = hasValidPlacement(edge.placement)
      ? normalizeDirection(edge.placement.inwardX, edge.placement.inwardY)
      : null;
    // Keep removed edge's parent endpoint as the reattach target.
    // Using child direction here can flip to the opposite parent endpoint and cause large jumps.
    const targetAnchor = resolveAnchorForDirection(replacementAnchor);
    edge.anchorEndpointId = targetAnchor || replacementAnchor || "root-endpoint";
    if (edge.anchorEndpointId === "root-endpoint") {
      applyRootAnchorVector(edge, preferredDir || { dx: 1, dy: 0 }, preferredInward);
    } else {
      clearRootAnchorVector(edge);
    }
    edge.placement = null;
  });
}

function removeBayById(id) {
  if (!id) return;
  ensureGraph();
  const removed = state.graph?.edges?.[id];
  if (!removed) return;
  pushBuilderHistory("remove-normal");
  if (removed) reanchorChildrenAfterEdgeRemoval(removed);
  unregisterEdge(id);
  normalizeDanglingAnchorIds();
  delete state.shelfAddons[id];
  if (activeBayOptionId === id) activeBayOptionId = null;
  if (String(inlineInsertPendingFirstSaveEdgeId || "") === String(id || "")) {
    inlineInsertPendingFirstSaveEdgeId = "";
  }
  renderBayInputs();
}

function saveCornerOptionModal() {
  if (!activeCornerOptionId) return;
  const corner = findShelfById(activeCornerOptionId);
  const swapSelect = $("#cornerSwapSelect");
  const countInput = $("#cornerCountInput");
  const rodCountInput = $("#cornerRodCountInput");
  const countError = $("#cornerCountError");
  if (!corner || !swapSelect || !countInput) return;

  const count = Number(countInput.value || 0);
  const rodCountRaw = Number(rodCountInput?.value || 0);
  const rodCount = Number.isFinite(rodCountRaw)
    ? Math.max(0, Math.floor(rodCountRaw))
    : 0;
  if (!count || count < 1) {
    setFieldError(countInput, countError, "선반 갯수는 1개 이상이어야 합니다.");
    return;
  }
  const customValidation = getCornerCustomCutValidationState();
  if (!customValidation.valid) {
    setCornerCustomCutError(customValidation.message);
    return;
  }
  setCornerCustomCutError("");

  const mode = String(swapSelect.value || "default");
  const nextSwap = mode === "swap" ? true : mode === "default" ? false : Boolean(corner.swap);
  const prevSwap = Boolean(corner.swap);
  const prevCount = Number(corner.count || 1);
  const prevRodCount = getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID);
  const prevCustomProcessing = Boolean(corner.customProcessing);
  const prevCustomPrimaryMm = Number(corner.customPrimaryMm || 0);
  const prevCustomSecondaryMm = Number(corner.customSecondaryMm || 0);
  const nextCustomProcessing = mode === "custom" && Boolean(customValidation.enabled);
  const nextCustomPrimaryMm = nextCustomProcessing ? Number(customValidation.primaryMm || 0) : 0;
  const nextCustomSecondaryMm = nextCustomProcessing ? Number(customValidation.secondaryMm || 0) : 0;
  const wasPendingAdd = isPendingEdge(corner);
  if (wasPendingAdd) {
    pushBuilderHistory("add-corner");
  } else if (
    prevSwap !== nextSwap ||
    prevCount !== count ||
    prevRodCount !== rodCount ||
    prevCustomProcessing !== nextCustomProcessing ||
    prevCustomPrimaryMm !== nextCustomPrimaryMm ||
    prevCustomSecondaryMm !== nextCustomSecondaryMm
  ) {
    pushBuilderHistory("update-corner");
  }
  if (wasPendingAdd) delete corner.pendingAdd;
  corner.swap = nextSwap;
  corner.count = count;
  corner.customProcessing = nextCustomProcessing;
  corner.composeTab = "custom";
  if (nextCustomProcessing) {
    corner.customPrimaryMm = nextCustomPrimaryMm;
    corner.customSecondaryMm = nextCustomSecondaryMm;
  } else {
    delete corner.customPrimaryMm;
    delete corner.customSecondaryMm;
  }
  setShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID, rodCount);
  clearFurnitureAddonsForEdge(corner.id);
  cornerDirectComposeDraft = null;
  closePresetModuleOptionModal({ returnFocus: false, clearState: true });
  renderBayInputs();
}

function removeCornerById(id) {
  if (!id) return;
  ensureGraph();
  if (!state.graph?.edges?.[id] || state.graph.edges[id].type !== "corner") return;
  pushBuilderHistory("remove-corner");
  const removed = state.graph.edges[id];
  reanchorChildrenAfterEdgeRemoval(removed);
  unregisterEdge(id);
  normalizeDanglingAnchorIds();
  delete state.shelfAddons[id];
  if (activeCornerOptionId === id) activeCornerOptionId = null;
  renderBayInputs();
}

function renderSystemAddonModalCards() {
  const container = $("#systemAddonCards");
  if (!container) return;
  container.innerHTML = "";
  const allSelectableItems = getSelectableSystemAddonItems();
  const widthPolicy = resolveFurnitureSelectionPolicyForEdge(activeShelfAddonId, {
    modalReturnTo: shelfAddonModalReturnTo,
  });
  renderSystemAddonModalCategoryFilterTabs(allSelectableItems);
  const selectableItems = getFilteredSystemAddonModalItems(allSelectableItems);
  if (!selectableItems.length) {
    container.innerHTML = `<div class="builder-hint">선택 가능한 가구가 없습니다.</div>`;
    container.onchange = null;
    return;
  }
  selectableItems.forEach((item) => {
    const priceInfo = resolveFurnitureAddonDisplayPriceInfo(item, {
      widthPolicy,
      widthMm: Number(widthPolicy?.widthMm || 0),
    });
    const label = document.createElement("label");
    label.className = "card-base option-card";
    label.innerHTML = `
      <input type="checkbox" value="${item.id}" />
      <div class="material-visual"></div>
      <div class="name">${item.name}</div>
      <div class="price${priceInfo.isConsult ? " is-consult" : ""}">${escapeHtml(priceInfo.label)}</div>
      ${item.description ? `<div class="description">${item.description}</div>` : ""}
    `;
    container.appendChild(label);
  });
  container.onchange = (e) => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input || !activeShelfAddonId) return;
    const id = input.value;
    const targetEdge = findShelfById(activeShelfAddonId);
    const currentFurnitureAddonId = getSelectedFurnitureAddonId(activeShelfAddonId);
    const willChangeFurnitureSelection = input.checked
      ? String(currentFurnitureAddonId || "") !== String(id || "")
      : String(currentFurnitureAddonId || "") === String(id || "");
    if (willChangeFurnitureSelection && !isPendingEdge(targetEdge)) {
      pushBuilderHistory("update-furniture-addon");
    }
    if (input.checked) {
      allSelectableItems.forEach((item) => {
        setShelfAddonQuantity(activeShelfAddonId, item.id, item.id === id ? 1 : 0);
      });
    } else {
      setShelfAddonQuantity(activeShelfAddonId, id, 0);
    }
    enforceSingleSelectableAddon(activeShelfAddonId);
    syncSystemAddonModalSelection();
    renderShelfAddonSelection(activeShelfAddonId);
    renderActiveOptionModalAddonSelection();
    autoCalculatePrice();
    updateAddItemState();
    closeShelfAddonModalAndReturn();
  };
  if (activeShelfAddonId) syncSystemAddonModalSelection();
}

function syncSystemAddonModalSelection() {
  const container = $("#systemAddonCards");
  if (!container || !activeShelfAddonId) return;
  enforceSingleSelectableAddon(activeShelfAddonId);
  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const isSelected = getShelfAddonQuantity(activeShelfAddonId, input.value) > 0;
    input.checked = isSelected;
    input.closest(".option-card")?.classList.toggle("selected", isSelected);
  });
}

function openShelfAddonModal(id, { returnTo = "" } = {}) {
  if (returnTo === "bay") captureBayOptionModalDraft();
  if (returnTo === "corner") captureCornerOptionModalDraft();
  const blockedReason = getFurnitureAddonBlockedReason(id, { modalReturnTo: returnTo });
  if (blockedReason) {
    showInfoModal(blockedReason);
    return;
  }
  activeShelfAddonId = id;
  shelfAddonModalReturnTo = returnTo || "";
  renderSystemAddonModalCards();
  syncSystemAddonModalSelection();
  openModal("#systemAddonModal", { focusTarget: "#systemAddonModalTitle" });
}

function closeShelfAddonModalAndReturn() {
  closeModal("#systemAddonModal");
  const returnTo = shelfAddonModalReturnTo;
  shelfAddonModalReturnTo = "";
  if (returnTo === "corner" && activeCornerOptionId) {
    openCornerOptionModal(activeCornerOptionId, { preserveDraft: true });
    return;
  }
  if (returnTo === "bay" && activeBayOptionId) {
    openBayOptionModal(activeBayOptionId, { preserveDraft: true });
  }
}

function updateBayAddonAvailability() {
  document.querySelectorAll("[data-shelf-addon-btn]").forEach((btn) => {
    const edgeId = String(btn.dataset.shelfAddonBtn || "");
    const blockedReason = getFurnitureAddonBlockedReason(edgeId);
    const blocked = Boolean(blockedReason);
    btn.disabled = blocked;
    btn.classList.toggle("btn-disabled", blocked);
    btn.setAttribute("aria-disabled", blocked ? "true" : "false");
    if (blocked) btn.title = blockedReason;
    else btn.removeAttribute("title");
  });
}

function commitBaysToEstimate() {
  const input = readCurrentInputs();
  const bays = readBayInputs();
  const err = validateEstimateInputs(input, bays);
  if (err) {
    showInfoModal(err);
    return;
  }
  const layoutSpec = getLayoutConfigSnapshot(input);
  const layoutConsult = evaluateLayoutConsultState(layoutSpec);
  const groupId = crypto.randomUUID();
  const columnCount = bays.length + 1;
  let columnDetail = calcColumnsDetail({
    column: input.column,
    count: columnCount,
    quantity: 1,
    bays,
  });
  if (isLayoutConsultStatus(layoutConsult)) {
    columnDetail = applyConsultPriceToDetail(columnDetail);
  }
  state.items.push({
    id: `columns-${groupId}`,
    type: "columns",
    groupId,
    count: columnCount,
    column: { ...input.column },
    layoutSpec,
    layoutConsult,
    quantity: 1,
    ...columnDetail,
  });

  bays.forEach((bay) => {
    const shelf = {
      ...input.shelf,
      width: bay.width,
      count: bay.count,
      customProcessing: bay.customProcessing,
      customPrimaryMm: bay.customPrimaryMm,
      customSecondaryMm: bay.customSecondaryMm,
    };
    let detail = calcBayDetail({
      shelf,
      addons: bay.addons,
      quantity: 1,
      isCorner: Boolean(bay.isCorner),
    });
    if (shouldTreatBayFurniturePriceAsConsult(bay)) {
      detail = applyConsultPriceToDetail(detail);
    }
    if (isLayoutConsultStatus(layoutConsult)) {
      detail = applyConsultPriceToDetail(detail);
    }
    state.items.push({
      id: crypto.randomUUID(),
      type: "bay",
      groupId,
      shelf,
      addons: bay.addons,
      isCorner: Boolean(bay.isCorner),
      layoutSpec,
      layoutConsult,
      quantity: 1,
      ...detail,
    });
  });

  refreshBuilderDerivedUI({ preview: true, price: false, addItemState: false });
  renderTable();
  renderSummary();
}

function sumNumericField(items = [], field = "") {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + Number(item?.[field] || 0), 0);
}

function getSystemGroupItems(groupId) {
  const key = String(groupId || "");
  if (!key) return [];
  return state.items.filter((item) => String(item?.groupId || item?.id || "") === key);
}

function buildSystemGroupedShelfBreakdown(entries = []) {
  const normalShelfMap = new Map();
  const cornerShelfMap = new Map();
  const cornerCustomCutMap = new Map();
  const furnitureMap = new Map();
  const basePostBarMap = new Map();
  const cornerPostBarMap = new Map();
  let hangerCount = 0;

  const addShelfCount = (bucket, shelf, qty = 0, materialCost = 0) => {
    const thickness = Math.max(0, Number(shelf?.thickness || 0));
    const width = Math.max(0, Number(shelf?.width || 0));
    // System shelf depth is fixed to 400mm; keep grouped detail-line aligned with spec.
    const length = Math.max(0, Number(SHELF_LENGTH_MM || 0));
    const count = Math.max(0, Number(qty || 0));
    if (!count || !width || !length) return;
    const key = `${thickness}T-${width}x${length}`;
    const prev = bucket.get(key) || { thickness, width, length, count: 0, materialCost: 0 };
    prev.count += count;
    prev.materialCost += Math.max(0, Number(materialCost || 0));
    bucket.set(key, prev);
  };

  const addPostBarCount = (bucket, kindLabel, postBarDetail = null) => {
    if (!postBarDetail || typeof postBarDetail !== "object") return;
    const count = Math.max(0, Number(postBarDetail.count || 0));
    if (!count) return;
    const tierLabel = String(postBarDetail.tierLabel || "");
    const key = `${kindLabel}:${tierLabel || "-"}`;
    const prev = bucket.get(key) || {
      kindLabel,
      tierLabel,
      count: 0,
    };
    prev.count += count;
    bucket.set(key, prev);
  };

  (Array.isArray(entries) ? entries : []).forEach((item) => {
    if (!item || typeof item !== "object") return;
    if (item.type === "bay") {
      addShelfCount(
        item.isCorner ? cornerShelfMap : normalShelfMap,
        item.shelf,
        item.shelf?.count || 1,
        item.materialCost
      );
      if (item.isCorner && item.shelf?.customProcessing) {
        const primaryMm = Math.max(0, Number(item.shelf?.customPrimaryMm || item.shelf?.width || 0));
        const secondaryMm = Math.max(0, Number(item.shelf?.customSecondaryMm || 0));
        const cutCount = Math.max(1, Math.floor(Number(item.shelf?.count || 1)));
        if (primaryMm > 0 && secondaryMm > 0) {
          const key = `${primaryMm}x${secondaryMm}`;
          const prev = cornerCustomCutMap.get(key) || { primaryMm, secondaryMm, count: 0 };
          prev.count += cutCount;
          cornerCustomCutMap.set(key, prev);
        }
      }
      (Array.isArray(item.addons) ? item.addons : []).forEach((addonId) => {
        const key = String(addonId || "");
        if (!key) return;
        if (key === ADDON_CLOTHES_ROD_ID) {
          hangerCount += 1;
          return;
        }
        const addon = SYSTEM_ADDON_ITEMS.find((entry) => String(entry?.id || "") === key);
        const prev = furnitureMap.get(key) || { id: key, label: addon?.name || key, count: 0 };
        prev.count += 1;
        furnitureMap.set(key, prev);
      });
      return;
    }
    if (item.type === "columns") {
      const baseDetails = Array.isArray(item.basePostBars) && item.basePostBars.length
        ? item.basePostBars
        : [item.basePostBar];
      baseDetails.forEach((entry) => addPostBarCount(basePostBarMap, "기본", entry));
      const cornerDetails = Array.isArray(item.cornerPostBars) && item.cornerPostBars.length
        ? item.cornerPostBars
        : [item.cornerPostBar];
      cornerDetails.forEach((entry) => addPostBarCount(cornerPostBarMap, "코너", entry));
    }
  });

  return {
    normalShelf: Array.from(normalShelfMap.values()).sort((a, b) => {
      if (a.width !== b.width) return a.width - b.width;
      if (a.length !== b.length) return a.length - b.length;
      return a.thickness - b.thickness;
    }),
    cornerShelf: Array.from(cornerShelfMap.values()).sort((a, b) => {
      if (a.width !== b.width) return a.width - b.width;
      if (a.length !== b.length) return a.length - b.length;
      return a.thickness - b.thickness;
    }),
    cornerCustomCuts: Array.from(cornerCustomCutMap.values()).sort((a, b) => {
      if (a.primaryMm !== b.primaryMm) return a.primaryMm - b.primaryMm;
      return a.secondaryMm - b.secondaryMm;
    }),
    furniture: Array.from(furnitureMap.values()).sort((a, b) =>
      String(a.label || "").localeCompare(String(b.label || ""), "ko")
    ),
    basePostBars: Array.from(basePostBarMap.values()),
    cornerPostBars: Array.from(cornerPostBarMap.values()),
    hangerCount,
  };
}

function formatSystemGroupedCountText(entries = [], formatter, emptyText = "없음") {
  const rows = (Array.isArray(entries) ? entries : [])
    .map((entry) => formatter(entry))
    .filter(Boolean);
  return rows.length ? rows.join(", ") : emptyText;
}

function buildSystemGroupDisplayItems(items = state.items) {
  const groupMap = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (!item || typeof item !== "object") return;
    const groupKey = String(item.groupId || item.id || "");
    if (!groupKey) return;
    if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
    groupMap.get(groupKey).push(item);
  });

  return Array.from(groupMap.entries()).map(([groupId, entries]) => {
    const columnsItem = entries.find((item) => item.type === "columns") || null;
    const bays = entries.filter((item) => item.type === "bay");
    const quantity = Math.max(
      1,
      Number(columnsItem?.quantity || bays[0]?.quantity || entries[0]?.quantity || 1)
    );
    const addonCost = bays.reduce(
      (acc, bay) => {
        if (!bay || bay.isCustomPrice) return acc;
        const bayQty = Math.max(1, Number(bay.quantity || quantity || 1));
        const costs = calcAddonCostBreakdown(bay.addons, bayQty);
        return {
          componentCost: acc.componentCost + Number(costs.componentCost || 0),
          furnitureCost: acc.furnitureCost + Number(costs.furnitureCost || 0),
        };
      },
      { componentCost: 0, furnitureCost: 0 }
    );
    return {
      id: `group:${groupId}`,
      groupId,
      quantity,
      type: "group",
      total: sumNumericField(entries, "total"),
      materialCost: sumNumericField(entries, "materialCost"),
      processingCost: sumNumericField(entries, "processingCost"),
      componentCost: addonCost.componentCost,
      furnitureCost: addonCost.furnitureCost,
      subtotal: sumNumericField(entries, "subtotal"),
      vat: sumNumericField(entries, "vat"),
      weightKg: sumNumericField(entries, "weightKg"),
      isCustomPrice: entries.some((item) => Boolean(item?.isCustomPrice)),
      column: columnsItem?.column || null,
      layoutSpec: columnsItem?.layoutSpec || bays[0]?.layoutSpec || null,
      layoutConsult: columnsItem?.layoutConsult || bays[0]?.layoutConsult || null,
      breakdown: buildSystemGroupedShelfBreakdown(entries),
    };
  });
}

function buildSystemGroupDetailLines(groupItem, { includeLayout = true } = {}) {
  const breakdown = groupItem?.breakdown || {};
  const column = groupItem?.column || null;
  const columnMat = column ? SYSTEM_COLUMN_MATERIALS[column.materialId] : null;
  const lines = [];

  if (column) {
    lines.push(`포스트바 컬러 ${columnMat?.name || "-"} · ${formatColumnSize(column)}`);
  }

  lines.push(
    `선반 ${formatSystemGroupedCountText(
      breakdown.normalShelf,
      (entry) =>
        `${entry.thickness}T/${entry.width}×${entry.length}mm ${entry.count}개${
          Number(entry.materialCost || 0) > 0 ? ` (${Number(entry.materialCost).toLocaleString()}원)` : ""
        }`
    )}`
  );
  lines.push(
    `코너선반 ${formatSystemGroupedCountText(
      breakdown.cornerShelf,
      (entry) =>
        `${entry.thickness}T/${entry.width}×${entry.length}mm ${entry.count}개${
          Number(entry.materialCost || 0) > 0 ? ` (${Number(entry.materialCost).toLocaleString()}원)` : ""
        }`
    )}`
  );
  if (Array.isArray(breakdown.cornerCustomCuts) && breakdown.cornerCustomCuts.length) {
    lines.push(
      `코너 비규격 절단 ${formatSystemGroupedCountText(
        breakdown.cornerCustomCuts,
        (entry) => `${entry.primaryMm}×${entry.secondaryMm}mm ${entry.count}개`
      )}`
    );
  }
  lines.push(
    `포스트바 ${formatSystemGroupedCountText(
      [...(breakdown.basePostBars || []), ...(breakdown.cornerPostBars || [])],
      (entry) => `${entry.kindLabel} 포스트바${entry.tierLabel ? `(${entry.tierLabel})` : ""} ${entry.count}개`
    )}`
  );
  lines.push(
    `가구 ${formatSystemGroupedCountText(
      breakdown.furniture,
      (entry) => `${entry.label} ${entry.count}개`
    )}`
  );
  lines.push(`행거 ${Number(breakdown.hangerCount || 0) > 0 ? `${breakdown.hangerCount}개` : "없음"}`);

  if (includeLayout) {
    const layoutLines = buildLayoutSpecLinesFromSnapshot(groupItem?.layoutSpec, groupItem?.layoutConsult, {
      includeStatus: true,
    });
    layoutLines.forEach((line) => lines.push(line));
  }

  if (groupItem?.isCustomPrice) {
    lines.push("품목비 상담 안내");
    lines.push("구성품비 상담 안내");
    lines.push("비규격 상담 안내");
  } else {
    const componentCost = Number(groupItem?.componentCost || 0);
    const furnitureCost = Number(groupItem?.furnitureCost || 0);
    const componentTotal = componentCost + furnitureCost;
    const componentParts = [];
    if (componentCost > 0) componentParts.push(`행거 ${componentCost.toLocaleString()}원`);
    if (furnitureCost > 0) componentParts.push(`가구 ${furnitureCost.toLocaleString()}원`);
    lines.push(`품목비 ${Number(groupItem?.materialCost || 0).toLocaleString()}원`);
    lines.push(
      `구성품비 ${componentTotal.toLocaleString()}원${
        componentParts.length ? ` (${componentParts.join(" · ")})` : ""
      }`
    );
  }
  return lines;
}

function removeSystemGroup(groupId) {
  const key = String(groupId || "");
  if (!key) return;
  state.items = state.items.filter((item) => String(item?.groupId || item?.id || "") !== key);
}

function updateSystemGroupQuantity(groupId, quantity) {
  const key = String(groupId || "");
  if (!key) return;
  const nextQty = Math.max(1, Number(quantity) || 1);
  const groupedItems = getSystemGroupItems(key);
  if (!groupedItems.length) return;
  const groupedBays = groupedItems.filter((item) => item.type === "bay");

  state.items = state.items.map((item) => {
    if (String(item?.groupId || item?.id || "") !== key) return item;
    if (item.type === "columns") {
      let detail = calcColumnsDetail({
        column: item.column,
        count: item.count,
        quantity: nextQty,
        bays: groupedBays,
      });
      if (isLayoutConsultStatus(item.layoutConsult)) {
        detail = applyConsultPriceToDetail(detail);
      }
      return { ...item, quantity: nextQty, ...detail };
    }
    if (item.type === "bay") {
      let detail = calcBayDetail({
        shelf: item.shelf,
        addons: item.addons,
        quantity: nextQty,
        isCorner: Boolean(item.isCorner),
      });
      if (shouldTreatBayFurniturePriceAsConsult({
        width: Number(item?.shelf?.width || 0),
        addons: item?.addons,
        isCorner: Boolean(item?.isCorner),
      })) {
        detail = applyConsultPriceToDetail(detail);
      }
      if (isLayoutConsultStatus(item.layoutConsult)) {
        detail = applyConsultPriceToDetail(detail);
      }
      return { ...item, quantity: nextQty, ...detail };
    }
    return { ...item, quantity: nextQty };
  });
}

function renderTable() {
  const displayItems = buildSystemGroupDisplayItems(state.items);
  renderEstimateTable({
    items: displayItems,
    getName: () => "시스템 구성",
    getTotalText: (item) => (item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`),
    getDetailLines: (item) => buildSystemGroupDetailLines(item).map((line) => escapeHtml(line)),
    onQuantityChange: (id, value) => updateItemQuantity(id, value),
    onDelete: (id) => {
      const rawId = String(id || "");
      if (rawId.startsWith("group:")) {
        removeSystemGroup(rawId.slice(6));
        renderTable();
        renderSummary();
        return;
      }
      const removedItem = state.items.find((it) => String(it.id) === rawId);
      if (!removedItem) return;
      if (removedItem.groupId) {
        removeSystemGroup(removedItem.groupId);
        renderTable();
        renderSummary();
      }
    },
  });
  requestStickyOffsetUpdate();
}

function updateItemQuantity(id, quantity) {
  const rawId = String(id || "");
  if (rawId.startsWith("group:")) {
    updateSystemGroupQuantity(rawId.slice(6), quantity);
    renderTable();
    renderSummary();
    return;
  }
  const idx = state.items.findIndex((it) => it.id === id);
  if (idx === -1) return;
  const item = state.items[idx];
  if (item.type === "columns") {
    const groupedBays = item.groupId
      ? state.items.filter((it) => it.type === "bay" && it.groupId === item.groupId)
      : [];
    let detail = calcColumnsDetail({
      column: item.column,
      count: item.count,
      quantity,
      bays: groupedBays,
    });
    if (isLayoutConsultStatus(item.layoutConsult)) {
      detail = applyConsultPriceToDetail(detail);
    }
    state.items[idx] = { ...item, quantity, ...detail };
    renderTable();
    renderSummary();
    return;
  }
  if (item.type === "bay") {
    let detail = calcBayDetail({
      shelf: item.shelf,
      addons: item.addons,
      quantity,
      isCorner: Boolean(item.isCorner),
    });
    if (shouldTreatBayFurniturePriceAsConsult({
      width: Number(item?.shelf?.width || 0),
      addons: item?.addons,
      isCorner: Boolean(item?.isCorner),
    })) {
      detail = applyConsultPriceToDetail(detail);
    }
    if (isLayoutConsultStatus(item.layoutConsult)) {
      detail = applyConsultPriceToDetail(detail);
    }
    state.items[idx] = { ...item, quantity, ...detail };
    renderTable();
    renderSummary();
    return;
  }
}

function renderSummary() {
  const summary = buildGrandSummary();
  const suffix = summary.hasConsult ? "(상담 필요 품목 미포함)" : "";

  const materialsTotalEl = $("#materialsTotal");
  if (materialsTotalEl) materialsTotalEl.textContent = summary.materialsTotal.toLocaleString();
  $("#grandTotal").textContent = `${summary.grandTotal.toLocaleString()}${suffix}`;
  const serviceCostEl = $("#serviceCost");
  if (serviceCostEl) serviceCostEl.textContent = formatServiceCostText(summary.fulfillment);

  const naverUnits = Math.ceil(summary.grandTotal / 1000);
  $("#naverUnits").textContent = `${naverUnits}${suffix}`;
  updateServiceStepUI();
  updateSendButtonEnabled();
}

function buildEmailContent() {
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();
  const displayItems = buildSystemGroupDisplayItems(state.items);

  const lines = [];
  lines.push("[고객 정보]");
  lines.push(`이름: ${customer.name || "-"}`);
  lines.push(`연락처: ${customer.phone || "-"}`);
  lines.push(`이메일: ${customer.email || "-"}`);
  lines.push(`주소: ${customer.postcode || "-"} ${customer.address || ""} ${customer.detailAddress || ""}`.trim());
  lines.push(`요청사항: ${customer.memo || "-"}`);
  lines.push("");
  lines.push("[주문 내역]");

  if (displayItems.length === 0) {
    lines.push("담긴 항목 없음");
  } else {
    displayItems.forEach((item, idx) => {
      const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
      const detailInline = buildSystemGroupDetailLines(item).join(" / ");
      lines.push(
        `${idx + 1}. 시스템 구성 x${item.quantity}${detailInline ? ` | ${detailInline}` : ""} | 금액 ${amountText}`
      );
    });
  }

  lines.push("");
  lines.push("[합계]");
  const suffix = summary.hasConsult ? "(상담 필요 품목 미포함)" : "";
  const naverUnits = Math.ceil(summary.grandTotal / 1000) || 0;
  lines.push(`서비스: ${formatFulfillmentLine(summary.fulfillment)}`);
  lines.push(`예상 결제금액: ${summary.grandTotal.toLocaleString()}원${suffix}`);
  lines.push(`예상 네이버 결제수량: ${naverUnits}개`);

  const subject = `[GGR 견적요청] ${customer.name || "고객명"} (${customer.phone || "연락처"})`;
  return {
    subject,
    body: lines.join("\n"),
    lines,
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
  const completeEl = $("#orderComplete");
  const summaryCard = $("#stepFinal");
  const actionCard = document.querySelector(".action-card");
  ["stepShape", "stepColumnMaterial", "stepShelfMaterial", "stepPreview", "step4"].forEach(
    (id) => document.getElementById(id)?.classList.remove("hidden-step")
  );
  actionCard?.classList.remove("hidden-step");
  navActions?.classList.remove("hidden-step");
  completeEl?.classList.add("hidden-step");
  summaryCard?.classList.remove("order-complete-visible");
  summaryCard?.classList.remove("hidden-step");
  $("#step4")?.classList.add("hidden-step");
  $("#step5")?.classList.add("hidden-step");
}

function showOrderComplete() {
  const navActions = document.querySelector(".nav-actions");
  const completeEl = $("#orderComplete");
  const serviceStep = $("#step4");
  const customerStep = $("#step5");
  const summaryCard = $("#stepFinal");
  renderOrderCompleteDetails();
  orderCompleted = true;
  navActions?.classList.add("hidden-step");
  serviceStep?.classList.add("hidden-step");
  customerStep?.classList.add("hidden-step");
  completeEl?.classList.remove("hidden-step");
  summaryCard?.classList.add("order-complete-visible");
  summaryCard?.classList.add("hidden-step");
}

function updateStepVisibility(scrollTarget) {
  if (!orderCompleted) {
    resetOrderCompleteUI();
  }
  const stepShape = $("#stepShape");
  const stepColumn = $("#stepColumnMaterial");
  const stepShelf = $("#stepShelfMaterial");
  const stepPreview = $("#stepPreview");
  const actionCard = document.querySelector(".action-card");
  const step4 = $("#step4");
  const step5 = $("#step5");
  const summaryCard = $("#stepFinal");
  const sendBtn = $("#sendQuoteBtn");
  const nextBtn = $("#nextStepsBtn");
  const backToCenterBtn = $("#backToCenterBtn");
  const orderComplete = $("#orderComplete");
  const navActions = document.querySelector(".nav-actions");

  const showPhase1 = currentPhase === 1;
  const showPhase2 = currentPhase === 2;
  const showPhase3 = currentPhase === 3;

  if (orderCompleted) {
    [stepShape, stepColumn, stepShelf, stepPreview, step4, step5, actionCard].forEach(
      (el) => el?.classList.add("hidden-step")
    );
    navActions?.classList.add("hidden-step");
    sendBtn?.classList.add("hidden-step");
    nextBtn?.classList.add("hidden-step");
    orderComplete?.classList.remove("hidden-step");
    summaryCard?.classList.add("order-complete-visible");
    summaryCard?.classList.add("hidden-step");
    return;
  }

  [stepShape, stepColumn, stepShelf, stepPreview, actionCard].forEach((el) => {
    if (el) el.classList.toggle("hidden-step", !showPhase1);
  });
  if (step4) step4.classList.toggle("hidden-step", !showPhase2 || orderCompleted);
  if (step5) step5.classList.toggle("hidden-step", !showPhase3 || orderCompleted);
  if (summaryCard) summaryCard.classList.remove("hidden-step");
  if (sendBtn) sendBtn.classList.toggle("hidden-step", !showPhase3 || orderCompleted);
  if (nextBtn) {
    nextBtn.classList.toggle("hidden-step", showPhase3 || orderCompleted);
    nextBtn.style.display = showPhase3 || orderCompleted ? "none" : "";
  }
  if (backToCenterBtn) {
    backToCenterBtn.classList.toggle("hidden-step", !showPhase1 || orderCompleted);
    backToCenterBtn.style.display = showPhase1 && !orderCompleted ? "" : "none";
  }
  if (!orderCompleted) {
    orderComplete?.classList.add("hidden-step");
    summaryCard?.classList.remove("order-complete-visible");
    navActions?.classList.remove("hidden-step");
  }
  updateSendButtonEnabled();

  const prevBtn = $("#prevStepsBtn");
  if (prevBtn) {
    prevBtn.classList.toggle("hidden-step", currentPhase === 1);
    prevBtn.style.display = currentPhase === 1 ? "none" : "";
  }

  if (scrollTarget) {
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function goToNextStep() {
  if (currentPhase === 1) {
    if (!state.items.length) {
      showInfoModal("먼저 시스템 수납장을 구성해주세요.");
      return;
    }
    currentPhase = 2;
    updateStepVisibility($("#step4"));
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
    updateStepVisibility($("#step5"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function goToPrevStep() {
  if (currentPhase === 1) return;
  if (currentPhase === 3) {
    currentPhase = 2;
    updateStepVisibility($("#step4"));
  } else {
    currentPhase = 1;
    updateStepVisibility($("#stepShape"));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showInfoModal(message) {
  const msgEl = $("#infoMessage");
  if (msgEl) msgEl.textContent = message;
  openModal("#infoModal", { focusTarget: "#infoModalTitle" });
}

function closeInfoModal() {
  closeModal("#infoModal");
}

function renderOrderCompleteDetails() {
  const container = $("#orderCompleteDetails");
  if (!container) return;
  const customer = getCustomerInfo();
  const summary = buildGrandSummary();
  const displayItems = buildSystemGroupDisplayItems(state.items);
  const suffix = summary.hasConsult ? "(상담 필요 품목 미포함)" : "";

  const itemsHtml =
    displayItems.length === 0
      ? "<p class=\"item-line\">담긴 항목이 없습니다.</p>"
      : displayItems
          .map((item, idx) => {
            const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
            const detailInline = buildSystemGroupDetailLines(item).join(" · ");
            return `<p class="item-line">${idx + 1}. 시스템 구성 x${item.quantity}${
              detailInline ? ` · ${escapeHtml(detailInline)}` : ""
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
      <p>서비스: ${escapeHtml(formatFulfillmentLine(summary.fulfillment))}</p>
      <p>예상 결제금액: ${summary.grandTotal.toLocaleString()}원${suffix}</p>
      <p>자재비: ${summary.materialsTotal.toLocaleString()}원</p>
      <p>예상무게: ${summary.totalWeight.toFixed(2)}kg</p>
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
  const emailjsInstance = getEmailJSInstance(showInfoModal);
  if (!emailjsInstance) return;

  sendingEmail = true;
  updateSendButtonEnabled();

  const { subject, body, lines } = buildEmailContent();
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

function updateStickyOffset() {
  const summary = $("#stepFinal");
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

let initialized = false;

function init() {
  if (initialized) return;
  const shelfCards = $(materialPickers.shelf.cardsId);
  const columnCards = $(materialPickers.column.cardsId);
  if (!shelfCards || !columnCards) {
    setTimeout(init, 50);
    return;
  }
  initialized = true;

  try {
    initEmailJS();
    resetOrderCompleteUI();
    initCollapsibleSections();
    renderSystemAddonModalCards();
    bindOptionModalFrontPreviewEvents();
    bindPendingOptionModalCleanupOnClose();
  } catch (err) {
    console.error("init base setup failed", err);
  }

  try {
    Object.values(materialPickers).forEach((picker) => {
      picker.categories = buildCategories(picker.materials);
      picker.selectedCategory = picker.categories[0] || "기타";
      renderMaterialTabs(picker);
      renderMaterialCards(picker);
      updateSelectedMaterialCard(picker);
      updateThicknessOptions(picker);
    });
  } catch (err) {
    console.error("init material setup failed", err);
  }

  try {
    initShelfStateForShape(getSelectedShape());
    renderShapeSizeInputs();
    renderBayInputs();
    renderTable();
    renderSummary();
    refreshBuilderDerivedUI();
    updateBayAddonAvailability();
    updateStepVisibility();
    updateBuilderHistoryButtons();
    bindPreviewFrameResizeSync();
    requestStickyOffsetUpdate();
  } catch (err) {
    console.error("init render failed", err);
  }

  $("#addEstimateBtn")?.addEventListener("click", commitBaysToEstimate);
  $("#closeSystemAddonModal")?.addEventListener("click", closeShelfAddonModalAndReturn);
  $("#systemAddonModalBackdrop")?.addEventListener("click", closeShelfAddonModalAndReturn);
  $("#systemAddonCategoryFilterTabs")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-system-addon-category]");
    if (!btn) return;
    const nextKey = String(btn.dataset.systemAddonCategory || "all");
    if (nextKey === String(systemAddonModalCategoryFilterKey || "all")) return;
    systemAddonModalCategoryFilterKey = nextKey || "all";
    renderSystemAddonModalCards();
  });
  $("#cornerAddonBtn")?.addEventListener("click", () => {
    if (!activeCornerOptionId) return;
    const targetEdgeId = activeCornerOptionId;
    captureCornerOptionModalDraft();
    if (isPresetModuleOptionCustomTabActive(presetModuleOptionFlowState.modalState, presetModuleOptionFlowState.draft)) {
      suppressPendingOptionModalCleanupOnce = true;
      closePresetModuleOptionModal({ returnFocus: false, clearState: false });
    }
    openShelfAddonModal(targetEdgeId, { returnTo: "corner" });
  });
  $("#bayWidthPresetSelect")?.addEventListener("change", () => {
    const presetSelect = $("#bayWidthPresetSelect");
    const customInput = $("#bayWidthCustomInput");
    if (!presetSelect || !customInput) return;
    const isCustom = presetSelect.value === "custom";
    customInput.classList.toggle("hidden", !isCustom);
    customInput.disabled = !isCustom;
    if (isCustom) customInput.focus();
    setFieldError(customInput, $("#bayWidthError"), "");
    if (
      isPresetModuleOptionCustomTabActive(
        presetModuleOptionFlowState.modalState,
        presetModuleOptionFlowState.draft,
        "normal"
      )
    ) {
      resetBayComposeInputsOnWidthChange();
    }
    updateBayOptionModalApplyButtonState();
    renderBayOptionFrontPreview();
    autoCalculatePrice();
  });
  $("#bayWidthCustomInput")?.addEventListener("change", () => {
    const presetSelect = $("#bayWidthPresetSelect");
    if (String(presetSelect?.value || "") !== "custom") return;
    if (
      isPresetModuleOptionCustomTabActive(
        presetModuleOptionFlowState.modalState,
        presetModuleOptionFlowState.draft,
        "normal"
      )
    ) {
      resetBayComposeInputsOnWidthChange();
      updateBayOptionModalApplyButtonState();
      renderBayOptionFrontPreview();
      autoCalculatePrice();
    }
  });
  $("#bayAddonBtn")?.addEventListener("click", () => {
    if (!activeBayOptionId) return;
    const targetEdgeId = activeBayOptionId;
    captureBayOptionModalDraft();
    if (isPresetModuleOptionCustomTabActive(presetModuleOptionFlowState.modalState, presetModuleOptionFlowState.draft)) {
      suppressPendingOptionModalCleanupOnce = true;
      closePresetModuleOptionModal({ returnFocus: false, clearState: false });
    }
    openShelfAddonModal(targetEdgeId, { returnTo: "bay" });
  });
  $("#closePreviewAddTypeModal")?.addEventListener("click", () => closePreviewAddTypePicker({ returnFocus: true }));
  $("#previewAddTypeModalBackdrop")?.addEventListener("click", () => closePreviewAddTypePicker());
  $("#previewAddModalNormalBtn")?.addEventListener("click", () => handlePreviewAddModalTypeSelect("normal"));
  $("#previewAddModalCornerBtn")?.addEventListener("click", () => handlePreviewAddModalTypeSelect("corner"));
  $("#previewAddModalRootCornerRightBtn")?.addEventListener("click", () =>
    handlePreviewAddModalRootCornerDirectionSelect("right")
  );
  $("#previewAddModalRootCornerLeftBtn")?.addEventListener("click", () =>
    handlePreviewAddModalRootCornerDirectionSelect("left")
  );
  $("#previewAddModalRootCornerBackBtn")?.addEventListener("click", handlePreviewAddModalBack);
  $("#closePreviewModuleActionModal")?.addEventListener("click", () =>
    closePreviewModuleActionModal({ returnFocus: true })
  );
  $("#previewModuleActionModalBackdrop")?.addEventListener("click", () => closePreviewModuleActionModal());
  $("#previewModuleActionEditBtn")?.addEventListener("click", handlePreviewModuleActionEdit);
  $("#previewModuleActionAddLeftBtn")?.addEventListener("click", () =>
    handlePreviewModuleActionAddSide("left")
  );
  $("#previewModuleActionAddRightBtn")?.addEventListener("click", () =>
    handlePreviewModuleActionAddSide("right")
  );
  $("#closePreviewPresetModuleModal")?.addEventListener("click", () => closePreviewPresetModuleModal());
  $("#previewPresetModuleModalBackdrop")?.addEventListener("click", () => closePreviewPresetModuleModal());
  $("#previewPresetModuleCards")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview-preset-id]");
    if (!btn) return;
    handlePreviewPresetModuleCardClick(btn);
  });
  $("#previewPresetModuleCategoryTabs")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview-preset-category]");
    if (!btn) return;
    const nextKey = String(btn.dataset.previewPresetCategory || "all");
    if (nextKey === String(previewPresetModuleCategoryFilterKey || "all")) return;
    previewPresetModuleCategoryFilterKey = nextKey || "all";
    renderPreviewPresetModuleModalUI();
  });
  $("#openPresetModulePickerBtn")?.addEventListener("click", openPresetPickerFromPresetModuleOptionModal);
  $("#presetModuleOptionPresetTabBtn")?.addEventListener("click", () =>
    handlePresetModuleOptionModalTabClick("preset")
  );
  $("#presetModuleOptionCustomTabBtn")?.addEventListener("click", () =>
    handlePresetModuleOptionModalTabClick("custom")
  );
  $("#presetModuleOptionFilterSelect")?.addEventListener("change", handlePresetModuleOptionFilterChange);
  $("#savePresetModuleOptionModal")?.addEventListener("click", savePresetModuleOptionModal);
  $("#removePresetModuleOptionModal")?.addEventListener("click", handlePresetModuleOptionModalRemove);
  $("#backPresetModuleOptionModal")?.addEventListener("click", handlePresetModuleOptionModalBack);
  $("#closePresetModuleOptionModal")?.addEventListener("click", () =>
    closePresetModuleOptionModal({ returnFocus: true, clearState: true })
  );
  $("#presetModuleOptionModalBackdrop")?.addEventListener("click", () =>
    closePresetModuleOptionModal({ returnFocus: false, clearState: true })
  );
  $("#builderUndoBtn")?.addEventListener("click", undoBuilderHistory);
  $("#builderRedoBtn")?.addEventListener("click", redoBuilderHistory);
  const builderEdgeListEl = $("#builderEdgeList");
  builderEdgeListEl?.addEventListener("click", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const id = row.dataset.builderEdgeId;
    const type = row.dataset.builderEdgeType;
    if (!id) return;
    if (type === "corner") {
      openCornerOptionModal(id);
    } else {
      openBayOptionModal(id);
    }
  });
  builderEdgeListEl?.addEventListener("mouseover", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const id = row.dataset.builderEdgeId;
    setPreviewEdgeHoverState(id, Boolean(id));
  });
  builderEdgeListEl?.addEventListener("mouseout", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const next = e.relatedTarget;
    if (next instanceof Element && row.contains(next)) return;
    setPreviewEdgeHoverState("", false);
  });
  builderEdgeListEl?.addEventListener("focusin", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const id = row.dataset.builderEdgeId;
    setPreviewEdgeHoverState(id, Boolean(id));
  });
  builderEdgeListEl?.addEventListener("focusout", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const next = e.relatedTarget;
    if (next instanceof Element && row.contains(next)) return;
    setPreviewEdgeHoverState("", false);
  });
  $("#closeInfoModal")?.addEventListener("click", closeInfoModal);
  $("#infoModalBackdrop")?.addEventListener("click", closeInfoModal);
  $("#closeMeasurementGuideModal")?.addEventListener("click", closeMeasurementGuideModal);
  $("#measurementGuideModalBackdrop")?.addEventListener("click", closeMeasurementGuideModal);
  $("#measurementGuideModalBody")?.addEventListener("click", handleMeasurementGuideCarouselClick);
  $("#nextStepsBtn")?.addEventListener("click", goToNextStep);
  $("#prevStepsBtn")?.addEventListener("click", goToPrevStep);
  $("#stepFinal .estimate-toggle")?.addEventListener("click", requestStickyOffsetUpdate);
  $("#backToCenterBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  $("#sendQuoteBtn")?.addEventListener("click", sendQuote);
  $("#resetFlowBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  $("#privacyConsent")?.addEventListener("change", updateSendButtonEnabled);
  ["#customerName", "#customerPhone", "#customerEmail"].forEach((sel) => {
    $(sel)?.addEventListener("input", updateSendButtonEnabled);
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
    $(sel)?.addEventListener("input", () => {
      setServiceStepError("");
      updateServiceStepUI();
      renderSummary();
      updateSendButtonEnabled();
    });
  });

  Object.values(materialPickers).forEach((picker) => {
    $(picker.openBtn)?.addEventListener("click", () =>
      openModal(picker.modalId, { focusTarget: `${picker.modalId}Title` })
    );
    $(picker.closeBtn)?.addEventListener("click", () => closeModal(picker.modalId));
    $(picker.backdrop)?.addEventListener("click", () => closeModal(picker.modalId));
    $(picker.thicknessSelectId)?.addEventListener("change", () => {
      refreshBuilderDerivedUI({ preview: true, price: true });
    });
  });

  $("#systemPreviewShelves")?.addEventListener("click", (e) => {
    clearPreviewGhost();
    const eventTarget = e.target instanceof Element ? e.target : null;
    if (!eventTarget?.closest("#previewAddTypeModal")) {
      closePreviewAddTypePicker();
    }
    if (!eventTarget?.closest("#previewModuleActionModal")) {
      closePreviewModuleActionModal();
    }
    const addTarget = eventTarget?.closest("[data-add-shelf]");
    if (addTarget) {
      if (!isPreviewBuilderReady(readCurrentInputs())) return;
      const endpointId = addTarget.dataset.endpointId || "";
      const endpoint = endpointId ? previewOpenEndpoints.get(endpointId) : null;
      if (!endpoint) return;
      const sideIndex = Number(endpoint.sideIndex ?? addTarget.dataset.addShelf);
      const attachSideIndex = Number(endpoint.attachSideIndex ?? sideIndex);
      const cornerId = endpoint.cornerId || "";
      const prepend = endpoint.prepend === true;
      const attachAtStart = Boolean(endpoint.attachAtStart);
      const allowedTypes = endpoint?.allowedTypes || ["normal"];
      closePreviewModuleActionModal();
      openPreviewAddTypeModal(
        sideIndex,
        cornerId,
        prepend,
        attachSideIndex,
        attachAtStart,
        endpointId,
        allowedTypes,
        addTarget
      );
      return;
    }
    const cornerTarget = eventTarget?.closest("[data-corner-preview]");
    if (cornerTarget) {
      const cornerId = cornerTarget.dataset.cornerPreview;
      if (!cornerId) return;
      openPreviewModuleActionModal(cornerId, "corner", cornerTarget);
      return;
    }
    const bayTarget = eventTarget?.closest("[data-bay-preview]");
    if (!bayTarget) return;
    const shelfId = bayTarget.dataset.bayPreview;
    if (!shelfId) return;
    openPreviewModuleActionModal(shelfId, "bay", bayTarget);
  });

  $$("[data-preview-info-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setPreviewInfoMode(btn.dataset.previewInfoMode, { rerender: true });
    });
  });
  syncPreviewInfoModeButtons();

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const guideBtn = target?.closest("[data-measurement-guide]");
    if (!guideBtn) return;
    openMeasurementGuideModal(guideBtn.dataset.measurementGuide || "");
  });

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    if (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
    ) {
      return;
    }
    const key = String(e.key || "").toLowerCase();
    const isMeta = e.metaKey || e.ctrlKey;
    if (!isMeta) return;
    if (key === "z" && e.shiftKey) {
      e.preventDefault();
      redoBuilderHistory();
      return;
    }
    if (key === "z") {
      e.preventDefault();
      undoBuilderHistory();
      return;
    }
    if (key === "y") {
      e.preventDefault();
      redoBuilderHistory();
    }
  });

  setFulfillmentType(getFulfillmentType());
  updateServiceStepUI();
  updateSendButtonEnabled();
  window.addEventListener("scroll", hidePreviewAddTooltip, { passive: true });
  window.addEventListener("resize", () => {
    requestStickyOffsetUpdate();
    requestPreviewFrameRerender();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
} else {
  init();
}
