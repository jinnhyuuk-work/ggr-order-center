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
  setPreviewModuleActionFlowTarget,
  buildPreviewModuleActionRemoveTransition,
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
  CLOUDINARY_CONFIG,
  openModal,
  closeModal,
  showInfoModal,
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
  initCustomerPhotoUploader,
  uploadCustomerPhotoFilesToCloudinary,
  getRuntimeHostBlockedReason,
  UI_COLOR_FALLBACKS,
  validateFulfillmentStepSelection,
  buildCustomerEmailSectionLines,
  buildOrderPayloadBase,
  buildConsultAwarePricing,
  resolveThreePhaseNextTransition,
  resolveThreePhasePrevPhase,
  applyThreePhaseStepVisibility,
  buildSendQuoteTemplateParams,
} from "./shared.js";
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
  SYSTEM_FULFILLMENT_POLICY,
} from "./data/fulfillment-policy-data.js";
import { resolveInstallationTravelZoneByAddress } from "./installation-travel-zone.js";
import { SYSTEM_MEASUREMENT_GUIDES } from "./data/measurement-guides-data.js";
import { createMeasurementGuideModalController } from "./measurement-guide-core.js";
import { createSystemPreviewAnchorHelpers } from "./system-preview-anchor.js";
import { createModuleFrontPreviewHelpers } from "./system-module-front-preview.js";
import { createSystemBayAdjacentHelpers } from "./system-bay-adjacent.js";
import { buildPreviewGeometryFromEdges } from "./system-preview-geometry.js";
import { bindSystemInitEvents } from "./system-init-bindings.js";
import { renderShapeSizeInputsView, bindShelfInputEventsView } from "./system-builder-inputs.js";
import { createSystemOrderHelpers } from "./system-order-helpers.js";
import { createModuleFrontPreviewRuntimeHelpers } from "./system-module-front-preview-runtime.js";
import { createSystemPreviewUploadHelpers } from "./system-preview-upload.js";
import { createSystemPresetRuntimeDispatchHelpers } from "./system-preset-runtime-dispatch.js";
import { createSystemPreviewPresetApplyHelpers } from "./system-preview-preset-apply.js";
import { createSystemPresetAddonHelpers } from "./system-preset-addon-helpers.js";
import { createSystemMaterialPickerHelpers } from "./system-material-picker.js";
import { createSystemFulfillmentSummaryHelpers } from "./system-fulfillment-summary.js";
import { createSystemOptionFrontPreviewHelpers } from "./system-option-front-preview.js";
import { createSystemPreviewController } from "./system-preview-controller.js";
import { createSystemPriceAutocalcHelpers } from "./system-price-autocalc.js";
import { createSystemQuoteFlowHelpers } from "./system-quote-flow.js";
import { createSystemPreviewLabelHelpers } from "./system-preview-label-helpers.js";
import { createSystemOrderUiFlowHelpers } from "./system-order-ui-flow.js";
import { createSystemAddonModalFlowHelpers } from "./system-addon-modal-flow.js";
import { createSystemOptionModalFlowHelpers } from "./system-option-modal-flow.js";
import { createSystemEdgeSaveRemoveHelpers } from "./system-edge-save-remove.js";
import { createSystemPreviewPresetPickerHelpers } from "./system-preview-preset-picker.js";
import { createSystemPreviewAddActionHelpers } from "./system-preview-add-actions.js";
import { isSystemInitMountReady, runSystemInitSequence } from "./system-init-sequence.js";
import {
  isCoarsePointerEnvironment,
  buildPreviewUiMetrics,
  applyPreviewUiMetricsToShelvesElement,
  createSectionUsageCollector,
  createResolvedEndpointRegistry,
  renderRootEndpointAddButton,
  placePreviewAddButtons,
  resolvePreviewViewportTransform,
  renderPreviewShelves,
  renderPreviewColumns,
  renderPreviewOuterAndColumnDimensionLabels,
  renderPreviewModuleAndDimensionLabels,
  buildPreviewSectionsAndEndpoints,
} from "./system-preview-update-helpers.js";
import {
  normalizeDirection,
  directionToSideIndex,
  buildRectBounds,
  projectCornerPoint,
  buildRoundedPolygonPathData,
  buildCornerSvgPathData,
  pushPreviewAddButton,
  pushUniquePoint as pushUniquePointShared,
  hasValidPlacement,
  buildPlacementFromEndpoint as buildPlacementFromEndpointShared,
  getEdgeHintFromDir,
  getEdgeHintFromInward,
  toEndpointKeyNumber,
  buildEndpointStableId,
  isOppositeEndpointDirection,
  collectOpenEndpointsFromCandidates as collectOpenEndpointsFromCandidatesShared,
  buildBayEndpointFromPlacement as buildBayEndpointFromPlacementShared,
  buildRootEndpoint as buildRootEndpointShared,
  getEdgeEndpointDirections,
  applyRootAnchorVector,
  clearRootAnchorVector,
  buildSectionRunsFromSegments,
  calcSectionUsedWidthWithPostBarsMm as calcSectionUsedWidthWithPostBarsMmShared,
  buildOuterSectionLabels as buildOuterSectionLabelsShared,
} from "./system-preview-helpers.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const SWATCH_FALLBACK = UI_COLOR_FALLBACKS.swatch;

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

const POST_BAR_WIDTH_MM = 20;
const COLUMN_WIDTH_MM = POST_BAR_WIDTH_MM;
const COLUMN_ENDPOINT_WIDTH_MM = POST_BAR_WIDTH_MM;
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
  i_single: "ㅡ자",
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
const HTML2CANVAS_CDN_URL = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 15000;
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
const systemOrderHelpers = createSystemOrderHelpers({
  SHELF_LENGTH_MM,
  ADDON_CLOTHES_ROD_ID,
  SYSTEM_ADDON_ITEMS,
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  calcAddonCostBreakdown,
  buildLayoutSpecLinesFromSnapshot,
  formatColumnSize,
  buildCustomerEmailSectionLines,
  buildOrderPayloadBase,
  buildConsultAwarePricing,
  formatFulfillmentLine,
});
const moduleFrontPreviewRuntimeHelpers = createModuleFrontPreviewRuntimeHelpers({
  LIMITS,
  MODULE_POST_BAR_HEIGHT_LIMITS,
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  SYSTEM_ADDON_ITEMS,
  readCurrentInputs,
});
const {
  MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM,
  MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM,
  MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM,
  MODULE_FRONT_PREVIEW_FLOOR_FURNITURE_LEG_HEIGHT_MM,
  MODULE_FRONT_PREVIEW_MIN_GAP_MM,
  MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM,
  MODULE_FRONT_PREVIEW_GSH1_LOWER_CLEAR_MM,
  getAddonItemById,
  getModuleFrontPreviewFurnitureSpec,
  clampModuleFrontPreviewValue,
  buildModuleFrontPreviewGeometry,
  buildModuleFrontPreviewAlphaColor,
  buildModuleFrontPreviewInteriorPositionsMm,
  buildModuleFrontPreviewInteriorSteppedShelfTopPositionsMm,
  buildModuleFrontPreviewSteppedShelfPositionsMm,
  getModuleFrontPreviewShelfAnchorsMm,
  getModuleFrontPreviewClearDimensionBetweenShelves,
  getModuleFrontPreviewFurnitureGapDimensions,
  getModuleFrontPreviewMaterialColors,
} = moduleFrontPreviewRuntimeHelpers;
const systemMaterialPickerHelpers = createSystemMaterialPickerHelpers({
  $,
  closeModal,
  autoCalculatePrice,
  updatePreview,
  renderSelectedCard,
  buildMaterialVisualInlineStyle,
  escapeHtml,
  SYSTEM_MATERIAL_CATEGORIES_DESC,
  SYSTEM_SHELF_TIER_PRICING,
  SYSTEM_POST_BAR_PRICING,
  MODULE_POST_BAR_HEIGHT_LIMITS,
  SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM,
  MODULE_SHELF_WIDTH_LIMITS,
  LIMITS,
  SWATCH_FALLBACK,
});
const fulfillmentSummaryHelpers = createSystemFulfillmentSummaryHelpers({
  getStateItems: () => state.items,
  getCustomerInfo,
  getFulfillmentType,
  evaluateFulfillmentPolicy,
  SYSTEM_FULFILLMENT_POLICY,
  FULFILLMENT_POLICY_MESSAGES,
  ADDON_CLOTHES_ROD_ID,
  calcGroupedAmount,
  calcOrderSummary,
  $,
  formatFulfillmentCardPriceText,
});
const optionFrontPreviewHelpers = createSystemOptionFrontPreviewHelpers({
  $,
  resolveActiveBayOptionId: () => activeBayOptionId,
  resolveActiveCornerOptionId: () => activeCornerOptionId,
  findShelfById,
  updateBayOptionModalApplyButtonState,
  updateCornerOptionModalApplyButtonState,
  setFieldError,
  syncBayOptionFurnitureSelectionAvailability,
  getShelfAddonQuantity,
  ADDON_CLOTHES_ROD_ID,
  buildModalDraftAddonBreakdown,
  getModuleOptionAverageHeightMm,
  getModuleFrontPreviewMaterialColors,
  buildModuleFrontPreviewHtml,
  MODULE_SHELF_WIDTH_LIMITS,
  syncCornerCustomCutInputsUI,
  getCornerCustomCutValidationState,
  setCornerCustomCutError,
  getCornerLabel,
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

function setFulfillmentStepError(message = "") {
  const errorEl = $("#fulfillmentStepError");
  if (!errorEl) return;
  const text = String(message || "").trim();
  errorEl.textContent = text;
  errorEl.classList.toggle("error", Boolean(text));
}

function getSystemColumnsItems() {
  return fulfillmentSummaryHelpers.getSystemColumnsItems();
}

function getSystemBayItems() {
  return fulfillmentSummaryHelpers.getSystemBayItems();
}

function getPostBarRowsForFulfillment(columnItem) {
  return fulfillmentSummaryHelpers.getPostBarRowsForFulfillment(columnItem);
}

function getSystemPostBarSummary() {
  return fulfillmentSummaryHelpers.getSystemPostBarSummary();
}

function getSystemShelfSummary() {
  return fulfillmentSummaryHelpers.getSystemShelfSummary();
}

function hasSystemCornerOrFurniture() {
  return fulfillmentSummaryHelpers.hasSystemCornerOrFurniture();
}

function getSystemSectionLengthSumMm() {
  return fulfillmentSummaryHelpers.getSystemSectionLengthSumMm();
}

function evaluateFulfillment(nextType = getFulfillmentType()) {
  return fulfillmentSummaryHelpers.evaluateFulfillment(nextType);
}

function buildGrandSummary() {
  return fulfillmentSummaryHelpers.buildGrandSummary();
}

function updateFulfillmentCardPriceUI() {
  return fulfillmentSummaryHelpers.updateFulfillmentCardPriceUI();
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

let currentPhase = 1;
let sendingEmail = false;
let orderCompleted = false;
let customerPhotoUploader = null;
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
let previewPresetApplyHelpers = null;
let previewOpenEndpoints = new Map();
let inlineInsertPendingFirstSaveEdgeId = "";
let previewRenderTransform = { scale: 1, tx: 0, ty: 0, depthMm: 400 };
let previewInfoMode = "size";
let previewCaptureIndexOnlyMode = false;
const previewUploadHelpers = createSystemPreviewUploadHelpers({
  getRuntimeHostBlockedReason,
  CLOUDINARY_CONFIG,
  CLOUDINARY_UPLOAD_TIMEOUT_MS,
  HTML2CANVAS_CDN_URL,
  $,
  updatePreview,
  setPreviewInfoMode,
  getPreviewInfoMode: () => previewInfoMode,
  getPreviewCaptureIndexOnlyMode: () => previewCaptureIndexOnlyMode,
  setPreviewCaptureIndexOnlyMode: (nextValue) => {
    previewCaptureIndexOnlyMode = Boolean(nextValue);
  },
});
const {
  buildRodAddonSummary,
  buildFurnitureAddonSummary,
  getPresetFurnitureAddonIds,
  buildPresetAddonBreakdownFromPreset,
} = createSystemPresetAddonHelpers({
  ADDON_CLOTHES_ROD_ID,
  getShelfAddonSummary,
});
const presetRuntimeDispatchHelpers = createSystemPresetRuntimeDispatchHelpers({
  escapeHtml,
  presetModuleOptionFlowState,
  previewAddFlowState,
  previewPresetPickerFlowState,
  previewModuleActionFlowState,
  resolveActiveBayOptionId: () => activeBayOptionId,
  resolveActiveCornerOptionId: () => activeCornerOptionId,
  assignActiveBayOptionId: (nextValue) => {
    activeBayOptionId = String(nextValue || "");
  },
  assignActiveCornerOptionId: (nextValue) => {
    activeCornerOptionId = String(nextValue || "");
  },
  assignPreviewPresetModuleCategoryFilterKey: (nextKey) => {
    previewPresetModuleCategoryFilterKey = String(nextKey || "all");
  },
  getPresetModuleOptionFilterOptions,
  getPresetModuleOptionSelectedPreset,
  getModuleOptionAverageHeightMm,
  buildPresetAddonBreakdownFromPreset,
  getModuleFrontPreviewMaterialColors,
  buildModuleFrontPreviewHtml,
  buildPresetModuleOptionCustomComposeSessionBootstrap,
  buildPresetModuleOptionCustomComposeBootstrapUiExecutionPlan,
  buildPreviewAddSourceResolutionResult,
  resolveActivePreviewAddSourceTarget,
  buildPresetModuleOptionCustomComposeSourceUiExecutionPlan,
  getShapeCornerLimitState,
  buildPresetModuleOptionCustomCornerComposeValidation,
  isRootPreviewEndpointTarget,
  hasSelectedRootCornerStartDirection,
  getRootCornerDirectionRequiredMessage,
  getCornerLimitBlockedMessage,
  canAddCornerAtTarget,
  getSelectedShape,
  getCornerAttachSideBlockedMessage,
  buildPlacementFromEndpoint,
  buildPendingCornerComposeEdgeCreatePlan,
  normalizeDirection,
  directionToSideIndex,
  buildPresetModuleOptionCustomCornerCreationUiExecutionPlan,
  buildPendingCornerComposeEdge,
  registerEdge,
  buildPresetModuleOptionCustomComposeCreationUiExecutionPlan,
  applyDirectComposePendingActivationStateToRuntime,
  addShelfFromEndpoint,
  buildPendingBayComposeAddOptions,
  clonePreviewAddTargetSnapshot,
  buildPresetModuleOptionSyncPreViewModel,
  getDefaultPresetModuleOptionFilterKey,
  isPreviewPresetAvailableForFilter,
  buildPresetModuleOptionCustomSyncPreUiDispatchPlan,
  buildPresetModuleOptionCustomSyncPostUiDispatchPlan,
  buildPresetModuleOptionCustomSyncResolvedViewModel,
  buildPresetModuleOptionSyncDomUiViewModel,
  getBayOptionApplyValidationState,
  getCornerOptionApplyValidationState,
  findShelfById,
  isPendingEdge,
  normalizePresetModuleOptionMode,
  renderPresetModuleOptionSelectionSummary,
  renderPresetModuleOptionFrontPreview,
  ensurePresetModuleOptionCustomComposeSession,
  syncCornerOptionModal,
  syncBayOptionModal,
  setPresetModuleOptionError,
  setPreviewAddFlowTarget,
  closePresetModuleOptionModal,
  setPreviewPresetPickerOpenState,
  applyPreviewPresetByContext,
  patchPresetModuleOptionFlowState,
  openModal,
  $,
  setPreviewAddTypeModalStep,
  setPreviewAddTypeErrorMessage,
  clearPreviewAddFlowTarget,
  setPreviewPresetModuleError,
  resetPreviewPresetPickerFlowState,
  reopenPresetModuleOptionModalAfterPresetPicker,
  resetPresetModuleOptionFlowState,
  setPreviewModuleActionModalError,
  resetPreviewModuleActionFlowState,
  patchPreviewPresetPickerFlowState,
  renderPreviewPresetModuleModalUI,
});
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
  return systemMaterialPickerHelpers.buildCategories(materials);
}

function renderMaterialTabs(picker) {
  return systemMaterialPickerHelpers.renderMaterialTabs(picker);
}

function renderCategoryDesc(picker) {
  return systemMaterialPickerHelpers.renderCategoryDesc(picker);
}

function formatWon(amount) {
  return systemMaterialPickerHelpers.formatWon(amount);
}

function resolveTierUnitPrice(tier, material) {
  return systemMaterialPickerHelpers.resolveTierUnitPrice(tier, material);
}

function formatTierConstraintLabel(tier, { widthKey = "maxWidthMm", heightKey = "maxHeightMm" } = {}) {
  return systemMaterialPickerHelpers.formatTierConstraintLabel(tier, { widthKey, heightKey });
}

function getShelfDisplayWidthRangeText() {
  return systemMaterialPickerHelpers.getShelfDisplayWidthRangeText();
}

function getShelfDisplayDepthText() {
  return systemMaterialPickerHelpers.getShelfDisplayDepthText();
}

function buildShelfTierPriceHtml(material) {
  return systemMaterialPickerHelpers.buildShelfTierPriceHtml(material);
}

function buildPostBarTierPriceHtml() {
  return systemMaterialPickerHelpers.buildPostBarTierPriceHtml();
}

function buildMaterialTierPriceHtml(picker, material) {
  return systemMaterialPickerHelpers.buildMaterialTierPriceHtml(picker, material);
}

function renderMaterialCards(picker) {
  return systemMaterialPickerHelpers.renderMaterialCards(picker);
}

function updateSelectedMaterialCard(picker) {
  return systemMaterialPickerHelpers.updateSelectedMaterialCard(picker);
}

function updateThicknessOptions(picker) {
  return systemMaterialPickerHelpers.updateThicknessOptions(picker);
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
    swatch: SWATCH_FALLBACK,
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
  return presetRuntimeDispatchHelpers.renderPresetModuleOptionFrontPreview();
}

function applyPresetModuleOptionSyncDomUiViewModel({
  domUiViewModel,
  filterOptions,
  elements,
} = {}) {
  return presetRuntimeDispatchHelpers.applyPresetModuleOptionSyncDomUiViewModel({
    domUiViewModel,
    filterOptions,
    elements,
  });
}

function applyPresetModuleOptionCustomSyncPreRuntimePlan(customSyncPreUiPlan) {
  return presetRuntimeDispatchHelpers.applyPresetModuleOptionCustomSyncPreRuntimePlan(customSyncPreUiPlan);
}

function applyPresetModuleOptionCustomSyncPostRuntimePlan(customSyncExecutionPlan) {
  return presetRuntimeDispatchHelpers.applyPresetModuleOptionCustomSyncPostRuntimePlan(customSyncExecutionPlan);
}

function applyPresetModuleOptionPresetSaveRuntimePlan(runtimeUiPlan) {
  return presetRuntimeDispatchHelpers.applyPresetModuleOptionPresetSaveRuntimePlan(runtimeUiPlan);
}

function applyPresetModuleOptionOpenUiDispatchPlanToRuntime(
  openUiPlan,
  debugMeta = {}
) {
  return presetRuntimeDispatchHelpers.applyPresetModuleOptionOpenUiDispatchPlanToRuntime(
    openUiPlan,
    debugMeta
  );
}

function applyPreviewAddCloseUiDispatchPlanToRuntime(closeUiPlan) {
  return presetRuntimeDispatchHelpers.applyPreviewAddCloseUiDispatchPlanToRuntime(closeUiPlan);
}

function applyPreviewPresetPickerCloseUiDispatchPlanToRuntime(closeUiPlan) {
  return presetRuntimeDispatchHelpers.applyPreviewPresetPickerCloseUiDispatchPlanToRuntime(closeUiPlan);
}

function applyPresetModuleOptionCloseUiDispatchPlanToRuntime(closeUiPlan) {
  return presetRuntimeDispatchHelpers.applyPresetModuleOptionCloseUiDispatchPlanToRuntime(closeUiPlan);
}

function applyPreviewModuleActionCloseUiDispatchPlanToRuntime(closeUiPlan) {
  return presetRuntimeDispatchHelpers.applyPreviewModuleActionCloseUiDispatchPlanToRuntime(closeUiPlan);
}

function applyPreviewPresetPickerOpenUiDispatchPlanToRuntime(openDispatchPlan) {
  return presetRuntimeDispatchHelpers.applyPreviewPresetPickerOpenUiDispatchPlanToRuntime(openDispatchPlan);
}

function syncPresetModuleOptionModal() {
  return presetRuntimeDispatchHelpers.syncPresetModuleOptionModal();
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
  return presetRuntimeDispatchHelpers.ensurePresetModuleOptionCustomComposeSession();
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

function reopenPresetModuleOptionModalAfterPresetPicker() {
  if (!presetModuleOptionFlowState.modalState) return;
  patchPresetModuleOptionFlowState(presetModuleOptionFlowState, {
    draft: buildPresetModuleOptionDraftForReopenAfterPresetPicker(
      presetModuleOptionFlowState.draft
    ),
  });
  openModal("#presetModuleOptionModal", { focusTarget: "#presetModuleOptionModalTitle" });
  try {
    syncPresetModuleOptionModal();
  } catch (err) {
    console.error("[system] Failed to reopen preset module option modal after preset picker", err);
    setPresetModuleOptionError("선택한 모듈 정보를 불러오지 못했습니다. 다시 선택해주세요.");
  }
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
  try {
    openPreviewPresetModuleModal(nextOpen.moduleType, nextOpen.options);
  } catch (err) {
    console.error("[system] Failed to open preview preset module modal from preset module option", err);
    reopenPresetModuleOptionModalAfterPresetPicker();
    setPresetModuleOptionError("모듈 선택 창을 열지 못했습니다. 다시 시도해주세요.");
  }
}

const previewPresetPickerHelpers = createSystemPreviewPresetPickerHelpers({
  SYSTEM_MODULE_PRESETS,
  SYSTEM_MODULE_OPTION_CONFIG,
  SYSTEM_MODULE_PRESET_CATEGORIES,
  SWATCH_FALLBACK,
  $,
  escapeHtml,
  buildMaterialVisualInlineStyle,
  resolvePresetModulePriceInfo,
  buildPresetAddonBreakdownFromPreset,
  patchPreviewPresetPickerFlowState,
  buildPreviewPresetPickerVisibleSelectionPatch,
  findShelfById,
  getPreviewPresetPickerFlowState: () => previewPresetPickerFlowState,
  getPreviewPresetModuleCategoryFilterKey: () => previewPresetModuleCategoryFilterKey,
  setPreviewPresetModuleCategoryFilterKey: (nextKey) => {
    previewPresetModuleCategoryFilterKey = String(nextKey || "all");
  },
});

function getPreviewPresetItemsForType(type = "") {
  return previewPresetPickerHelpers.getPreviewPresetItemsForType(type);
}

function getPreviewPresetFilterKeysForItem(item, type = previewPresetPickerFlowState.moduleType) {
  return previewPresetPickerHelpers.getPreviewPresetFilterKeysForItem(item, type);
}

function getPreviewPresetFilterKeyForItem(item, type = previewPresetPickerFlowState.moduleType) {
  return previewPresetPickerHelpers.getPreviewPresetFilterKeyForItem(item, type);
}

function isPreviewPresetAvailableForFilter(item, filterKey, type = previewPresetPickerFlowState.moduleType) {
  return previewPresetPickerHelpers.isPreviewPresetAvailableForFilter(item, filterKey, type);
}

function getPreviewPresetFilterOptions(type = previewPresetPickerFlowState.moduleType) {
  return previewPresetPickerHelpers.getPreviewPresetFilterOptions(type);
}

function getWidthFilteredPreviewPresetItems() {
  return previewPresetPickerHelpers.getWidthFilteredPreviewPresetItems();
}

function getPreviewPresetCategoryFilterOptions(
  widthFilteredItems = getWidthFilteredPreviewPresetItems()
) {
  return previewPresetPickerHelpers.getPreviewPresetCategoryFilterOptions(widthFilteredItems);
}

function renderPreviewPresetModuleCategoryTabs(
  widthFilteredItems = getWidthFilteredPreviewPresetItems()
) {
  return previewPresetPickerHelpers.renderPreviewPresetModuleCategoryTabs(widthFilteredItems);
}

function getFilteredPreviewPresetItems(widthFilteredItems = null) {
  return previewPresetPickerHelpers.getFilteredPreviewPresetItems(widthFilteredItems);
}

function getPreviewPresetSelectedPreset() {
  return previewPresetPickerHelpers.getPreviewPresetSelectedPreset();
}

function getPreviewPresetTargetEdge() {
  return previewPresetPickerHelpers.getPreviewPresetTargetEdge();
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

function renderPreviewPresetModuleCards() {
  return previewPresetPickerHelpers.renderPreviewPresetModuleCards();
}

function syncPreviewPresetSelectionForCurrentFilter() {
  return previewPresetPickerHelpers.syncPreviewPresetSelectionForCurrentFilter();
}

function renderPreviewPresetModuleModalUI() {
  return previewPresetPickerHelpers.renderPreviewPresetModuleModalUI();
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

previewPresetApplyHelpers = createSystemPreviewPresetApplyHelpers({
  previewAddFlowState,
  previewPresetPickerFlowState,
  presetModuleOptionFlowState,
  findShelfById,
  setPreviewPresetModuleError,
  getShelfAddonQuantity,
  ADDON_CLOTHES_ROD_ID,
  getSelectedFurnitureAddonId,
  getPresetFurnitureAddonIds,
  isPendingEdge,
  pushBuilderHistory,
  resolveInlineInsertPendingFirstSaveEdgeId: () => inlineInsertPendingFirstSaveEdgeId,
  clearInlineInsertPendingFirstSaveEdgeId: () => {
    inlineInsertPendingFirstSaveEdgeId = "";
  },
  applyPresetAddonsToEdge,
  closePreviewPresetModuleModal,
  renderBayInputs,
  buildPreviewAddSourceResolutionResult,
  resolveActivePreviewAddSourceTarget,
  addShelfFromEndpoint,
  buildPreviewPresetNormalAddUiExecutionPlan,
  getShapeCornerLimitState,
  buildPresetModuleOptionCustomCornerComposeValidation,
  isRootPreviewEndpointTarget,
  hasSelectedRootCornerStartDirection,
  getRootCornerDirectionRequiredMessage,
  getCornerLimitBlockedMessage,
  canAddCornerAtTarget,
  getSelectedShape,
  getCornerAttachSideBlockedMessage,
  buildPlacementFromEndpoint,
  buildPreviewPresetCornerEdge,
  normalizeDirection,
  directionToSideIndex,
  registerEdge,
  buildPreviewPresetCornerAddUiExecutionPlan,
  buildPreviewPresetPickerCardClickUiExecutionPlan,
  getFilteredPreviewPresetItems,
  patchPreviewPresetPickerFlowState,
  buildPreviewPresetPickerApplyRuntimeUiDispatchPlan,
  getPreviewPresetSelectedPreset,
  patchPresetModuleOptionFlowState,
  buildPreviewPresetApplyRuntimeUiDispatchPlan,
  renderPreviewPresetModuleCards,
});

function handlePreviewPresetModuleCardClick(buttonEl) {
  return previewPresetApplyHelpers?.handlePreviewPresetModuleCardClick(buttonEl);
}

function applyPreviewPresetByContext(
  preset,
  presetContext,
  type = previewPresetPickerFlowState.moduleType,
  selectedFilterKey = previewPresetPickerFlowState.filterKey
) {
  return previewPresetApplyHelpers?.applyPreviewPresetByContext(
    preset,
    presetContext,
    type,
    selectedFilterKey
  );
}

function applySelectedPreviewPresetModule() {
  return previewPresetApplyHelpers?.applySelectedPreviewPresetModule();
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
    deleteBtn: $("#previewModuleActionDeleteBtn"),
  };
}

function applyPreviewModuleActionModalOpenUiView(openDispatchPlan, elements = {}) {
  const viewState = openDispatchPlan?.modalViewState;
  if (!viewState) return;
  const { titleEl, descEl, editBtn, addRightBtn, addLeftBtn, deleteBtn } = elements || {};
  if (titleEl) titleEl.textContent = viewState.title;
  if (descEl) descEl.textContent = viewState.description;
  const buttonResetState = viewState.buttonState || {};
  [editBtn, addRightBtn, addLeftBtn, deleteBtn].forEach((btn) => {
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

const bayAdjacentHelpers = createSystemBayAdjacentHelpers({
  findShelfById,
  clearRootAnchorVector,
  moveEdgeBeforeInOrder,
  normalizeDanglingAnchorIds,
  resolveBayHorizontalEndpointSide,
  buildBayEndpointFromPlacement,
  collectEdgesAnchoredToEndpoint,
  resolveAnchorForDirection,
  parseCanonicalEndpointId,
  areEndpointsNear,
  getEndpointDistanceMm,
  findBayEndpointNeighborsByPlacement,
  insertBayBetweenModulesByTarget,
  renderBayInputs,
  addShelfFromEndpoint,
  setInlineInsertPendingFirstSaveEdgeId: (nextId) => {
    inlineInsertPendingFirstSaveEdgeId = String(nextId || "");
  },
});

function addBayAdjacentToModuleEdge(edgeId, { direction = "right" } = {}) {
  return bayAdjacentHelpers.addBayAdjacentToModuleEdge(edgeId, { direction });
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
        ? "선택한 모듈을 수정하거나 좌/우 추가, 삭제를 실행하세요."
        : "코너 모듈을 수정하거나 삭제할 수 있습니다.";
  }
  if (modalElements.editBtn) modalElements.editBtn.disabled = false;
  if (modalElements.addLeftBtn) modalElements.addLeftBtn.disabled = !canAddSide;
  if (modalElements.addRightBtn) modalElements.addRightBtn.disabled = !canAddSide;
  if (modalElements.deleteBtn) modalElements.deleteBtn.disabled = false;
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

function handlePreviewModuleActionDelete() {
  const transition = buildPreviewModuleActionRemoveTransition(previewModuleActionFlowState);
  if (!transition?.edgeId) return;
  const targetEdge = findShelfById(transition.edgeId);
  if (!targetEdge?.id) return;
  closePreviewModuleActionModal({ returnFocus: false, clearTarget: true });
  if (targetEdge.type === "corner") removeCornerById(targetEdge.id);
  else removeBayById(targetEdge.id);
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

const systemPreviewLabelHelpers = createSystemPreviewLabelHelpers({
  ADDON_CLOTHES_ROD_ID,
  SYSTEM_ADDON_ITEMS,
  getShelfAddonQuantities,
  buildRodAddonSummary,
  buildFurnitureAddonSummary,
  escapeHtml,
  setPreviewEdgeHoverState,
  $,
});

function sortAddonEntriesWithRodFirst(entries = []) {
  return systemPreviewLabelHelpers.sortAddonEntriesWithRodFirst(entries);
}

function getShelfAddonIds(id) {
  return systemPreviewLabelHelpers.getShelfAddonIds(id);
}

function getShelfAddonSummary(addons = []) {
  return systemPreviewLabelHelpers.getShelfAddonSummary(addons);
}

function buildAddonBreakdownFromIds(addonIds = [], emptyText = "없음") {
  return systemPreviewLabelHelpers.buildAddonBreakdownFromIds(addonIds, emptyText);
}

function formatAddonCompactBreakdown(addonIds = [], emptyText = "없음") {
  return systemPreviewLabelHelpers.formatAddonCompactBreakdown(addonIds, emptyText);
}

function getComposeTabLabelInfo(edge = null) {
  return systemPreviewLabelHelpers.getComposeTabLabelInfo(edge);
}

function createModuleLabelElement(
  labelInfo = {},
  {
    level = 2, // 2: badge+shelf+addons, 1: index chip only, 0: index chip only
    index = 1,
  } = {}
) {
  return systemPreviewLabelHelpers.createModuleLabelElement(labelInfo, {
    level,
    index,
  });
}

function getModuleLabelInfoFromElement(labelEl) {
  return systemPreviewLabelHelpers.getModuleLabelInfoFromElement(labelEl);
}

function setModuleLabelExpandedState(labelEl, expanded = false) {
  return systemPreviewLabelHelpers.setModuleLabelExpandedState(labelEl, expanded);
}

function formatDimensionLabelText(
  text = "",
  { compact = false, expanded = false, compactText = "" } = {}
) {
  return systemPreviewLabelHelpers.formatDimensionLabelText(text, {
    compact,
    expanded,
    compactText,
  });
}

function createDimensionLabelElement(labelInfo = {}, { compact = false } = {}) {
  return systemPreviewLabelHelpers.createDimensionLabelElement(labelInfo, { compact });
}

function setDimensionLabelExpandedState(labelEl, expanded = false) {
  return systemPreviewLabelHelpers.setDimensionLabelExpandedState(labelEl, expanded);
}

function resolveDimensionLabelCompactStates(labelInfos = [], parentEl) {
  return systemPreviewLabelHelpers.resolveDimensionLabelCompactStates(labelInfos, parentEl);
}

function syncModuleLabelExpansionByEdge(edgeId = "", active = false) {
  return systemPreviewLabelHelpers.syncModuleLabelExpansionByEdge(edgeId, active);
}

function syncDimensionLabelExpansionByEdge(edgeId = "", active = false) {
  return systemPreviewLabelHelpers.syncDimensionLabelExpansionByEdge(edgeId, active);
}

function isRectOverlapping(a = null, b = null, padding = 0) {
  return systemPreviewLabelHelpers.isRectOverlapping(a, b, padding);
}

function getBoundingRectOnParent(childEl, parentEl) {
  return systemPreviewLabelHelpers.getBoundingRectOnParent(childEl, parentEl);
}

function resolveModuleLabelDensityLevels(labelInfos = [], parentEl) {
  return systemPreviewLabelHelpers.resolveModuleLabelDensityLevels(labelInfos, parentEl);
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
          <div class="material-visual" style="background:${SWATCH_FALLBACK};"></div>
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

function buildBuilderEdgeRows() {
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
    const presetDraft = buildPresetModuleOptionDraftSeedFromEdge(edge.id);
    const moduleLabel =
      presetDraft?.activeTab === "preset" && presetDraft?.presetId
        ? String(
            getPreviewPresetItemsForType(presetDraft.moduleType).find(
              (item) => String(item?.id || "") === String(presetDraft.presetId || "")
            )?.label || ""
          )
        : "";
    const moduleLabelText = moduleLabel ? `모듈명 ${moduleLabel} / ` : "";
    rows.push({
      id: edge.id,
      isCorner,
      moduleLabel,
      title: `${isCorner ? "코너" : "모듈"} ${idx + 1}`,
      meta: `${moduleLabelText}${widthText} / 선반 ${Number(edge.count || 1)}개 / ${addonText}`,
    });
  });
  return rows;
}

function renderBuilderStructure() {
  const listEl = $("#builderEdgeList");
  if (!listEl) return;
  const rows = buildBuilderEdgeRows();
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

function pushUniquePoint(list, entry, threshold = 8) {
  return pushUniquePointShared(list, entry, {
    threshold,
    postBarWidthMm: COLUMN_WIDTH_MM,
  });
}

function buildPlacementFromEndpoint(endpoint) {
  return buildPlacementFromEndpointShared(endpoint, {
    defaultPostBarWidthMm: COLUMN_WIDTH_MM,
  });
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

const previewAnchorHelpers = createSystemPreviewAnchorHelpers({
  hasValidPlacement,
  normalizeDirection,
  directionToSideIndex,
  buildEndpointStableId,
  getResolvedCornerArmLengthsMm,
  getEdgeEndpointDirections,
  getOrderedGraphEdges,
  getOrderedCommittedGraphEdges,
  clearRootAnchorVector,
  supportVisibleMm: SUPPORT_VISIBLE_MM,
  columnEndpointHalfMm: COLUMN_ENDPOINT_HALF_MM,
});

function collectOpenEndpointsFromCandidates(candidates = []) {
  return collectOpenEndpointsFromCandidatesShared(candidates, {
    endpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
  });
}

function buildBayEndpointFromPlacement(edge, endpointSide = "end") {
  return buildBayEndpointFromPlacementShared(edge, endpointSide, {
    supportVisibleMm: SUPPORT_VISIBLE_MM,
    endpointHalfMm: COLUMN_ENDPOINT_HALF_MM,
    endpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
  });
}

function buildRootEndpoint() {
  return buildRootEndpointShared({
    endpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
  });
}

function getEdgeEndpointAliasSets(edge) {
  return previewAnchorHelpers.getEdgeEndpointAliasSets(edge);
}

function resolveAnchorForDirection(anchorId, preferredDir = null, { includePending = false } = {}) {
  return previewAnchorHelpers.resolveAnchorForDirection(anchorId, preferredDir, {
    includePending,
  });
}

function normalizeDanglingAnchorIds() {
  return previewAnchorHelpers.normalizeDanglingAnchorIds();
}

function calcSectionUsedWidthWithPostBarsMm({
  shelfTotalMm = 0,
  postBarCount = 0,
  postBarTotalMm = NaN,
} = {}) {
  return calcSectionUsedWidthWithPostBarsMmShared({
    shelfTotalMm,
    postBarCount,
    postBarTotalMm,
    postBarWidthMm: COLUMN_WIDTH_MM,
    endpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
  });
}

function buildOuterSectionLabels(sectionRuns = [], columnMarksByHint = {}) {
  return buildOuterSectionLabelsShared(sectionRuns, columnMarksByHint, {
    postBarWidthMm: COLUMN_WIDTH_MM,
    endpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
  });
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

const previewControllerHelpers = createSystemPreviewController({
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  SWATCH_FALLBACK,
  COLUMN_ENDPOINT_WIDTH_MM,
  COLUMN_WIDTH_MM,
  COLUMN_DEPTH_MM,
  COLUMN_ENDPOINT_HALF_MM,
  SUPPORT_VISIBLE_MM,
  $,
  readCurrentInputs,
  readBayInputs,
  getPreviewOrderedEdges,
  getOrderedGraphEdges,
  getLayoutConfigSnapshot,
  updatePreviewWidthSummary,
  syncLayoutSectionUsageSnapshot,
  isPreviewBuilderReady,
  getPreviewBuilderDisabledReason,
  buildLayoutPreviewSummaryText,
  buildPreviewOptionText,
  hidePreviewAddTooltip,
  clearPreviewGhost,
  isCoarsePointerEnvironment,
  buildPreviewUiMetrics,
  applyPreviewUiMetricsToShelvesElement,
  createSectionUsageCollector,
  createResolvedEndpointRegistry,
  buildEndpointStableId,
  buildPreviewGeometryFromEdges,
  hasValidPlacement,
  normalizeDirection,
  buildPlacementFromEndpoint,
  directionToSideIndex,
  getEdgeHintFromDir,
  getEdgeHintFromInward,
  getResolvedCornerArmLengthsMm,
  pushUniquePoint,
  buildRectBounds,
  getCornerLabel,
  buildPreviewSectionsAndEndpoints,
  buildSectionRunsFromSegments,
  buildOuterSectionLabels,
  collectOpenEndpointsFromCandidates,
  resolvePreviewViewportTransform,
  setPreviewRenderTransform,
  renderPreviewShelves,
  buildCornerSvgPathData,
  setPreviewEdgeHoverState,
  renderPreviewColumns,
  renderPreviewModuleAndDimensionLabels,
  formatAddonCompactBreakdown,
  getShelfAddonIds,
  getComposeTabLabelInfo,
  resolveDimensionLabelCompactStates,
  createDimensionLabelElement,
  resolveModuleLabelDensityLevels,
  createModuleLabelElement,
  renderPreviewOuterAndColumnDimensionLabels,
  renderRootEndpointAddButton,
  applyPreviewAddButtonState,
  bindAddButtonPreviewInteractions,
  placePreviewAddButtons,
  getPreviewAddButtonPlacementKey,
  getBoundingRectOnParent,
  buildRootEndpoint,
  getPreviewInfoMode: () => previewInfoMode,
  getPreviewCaptureIndexOnlyMode: () => previewCaptureIndexOnlyMode,
  setPreviewFrameLastSize: (nextValue) => {
    previewFrameLastSize = nextValue;
  },
  getPreviewAddButtonPlacementHints: () => previewAddButtonPlacementHints,
  setPreviewAddButtonPlacementHints: (nextValue) => {
    previewAddButtonPlacementHints = nextValue;
  },
  setPreviewOpenEndpoints: (nextValue) => {
    previewOpenEndpoints = nextValue;
  },
});

function updatePreview() {
  return previewControllerHelpers.updatePreview();
}

const previewAddActionHelpers = createSystemPreviewAddActionHelpers({
  previewAddFlowState,
  getShapeCornerLimitState,
  buildPreviewAddTypeModalOpenViewModel,
  getCornerAttachSideBlockedMessage,
  getSelectedShape,
  getCornerLimitBlockedMessage,
  buildPreviewAddTypeModalOpenUiExecutionPlan,
  setPreviewAddFlowTarget,
  applyPreviewAddTypeModalOpenUiView,
  setPreviewAddTypeModalStep,
  openModal,
  focusPreviewAddTypeModalInitialTarget,
  buildPreviewAddSourceResolutionResult,
  resolveActivePreviewAddSourceTarget,
  setPreviewAddTypeErrorMessage,
  addShelfFromEndpoint,
  buildPendingBayComposeAddOptions,
  buildPreviewAddNormalCommitUiExecutionPlan,
  closePreviewAddTypePicker,
  openBayOptionModal,
  buildPreviewAddCornerCommitUiExecutionPlan,
  openCornerOptionModal,
  buildPresetModuleOptionCustomCornerComposeValidation,
  isRootPreviewEndpointTarget,
  hasSelectedRootCornerStartDirection,
  getRootCornerDirectionRequiredMessage,
  canAddCornerAtTarget,
  buildPlacementFromEndpoint,
  buildPendingCornerComposeEdgeCreatePlan,
  normalizeDirection,
  directionToSideIndex,
  buildPendingCornerComposeEdge,
  registerEdge,
});

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
  return previewAddActionHelpers.openPreviewAddTypeModal(
    sideIndex,
    cornerId,
    prepend,
    attachSideIndex,
    attachAtStart,
    endpointId,
    allowedTypes,
    anchorEl
  );
}

function commitPreviewAddNormal() {
  return previewAddActionHelpers.commitPreviewAddNormal();
}

function commitPreviewAddCorner() {
  return previewAddActionHelpers.commitPreviewAddCorner();
}

function updateAddItemState() {
  const btn = $("#addEstimateBtn");
  if (!btn) return;
  const input = readCurrentInputs();
  const bays = readBayInputs();
  const err = validateEstimateInputs(input, bays);
  btn.disabled = Boolean(err);
}

const systemPriceAutocalcHelpers = createSystemPriceAutocalcHelpers({
  readCurrentInputs,
  readBayInputs,
  updateSizeErrorsUI,
  updateShelfAddButtonState,
  getItemPriceDisplayValidationMessage,
  renderItemPriceNotice,
  updateAddItemState,
  calcBayDetail,
  shouldTreatBayFurniturePriceAsConsult,
  applyConsultPriceToDetail,
  calcAddonCostBreakdown,
  calcColumnsDetail,
  evaluateLayoutConsultState,
  getLayoutConfigSnapshot,
  isLayoutConsultStatus,
  renderItemPriceDisplay,
});

function autoCalculatePrice() {
  return systemPriceAutocalcHelpers.autoCalculatePrice();
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
  renderShapeSizeInputsView({
    $,
    readSpaceConfigs,
    getSelectedShape,
    syncLayoutConfigShape,
    normalizeSystemShape,
    SYSTEM_SHAPE_KEYS,
    getSectionCountForShape,
    escapeHtml,
    getLayoutTypeLabel,
    SYSTEM_SECTION_LENGTH_MIN_MM,
    LIMITS,
    SYSTEM_SECTION_LENGTH_CONSULT_AT_MM,
    SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM,
    setSpaceExtraHeights,
    bindLayoutTypeShapeEvents,
    bindLayoutSectionLengthEvents,
    refreshBuilderDerivedUI,
    bindSpaceExtraHeightEvents,
    syncLayoutConstraintIndicators,
  });
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
  const widthPresetId = `shelfWidthPreset-${shelf.id}`;
  const widthInputId = `shelfWidth-${shelf.id}`;
  const countInputId = `shelfCount-${shelf.id}`;
  const rodCountInputId = `shelfRodCount-${shelf.id}`;
  const el = document.createElement("div");
  el.className = "shelf-item";
  el.innerHTML = `
    <div class="form-row">
      <label for="${widthPresetId}">선반 폭 (mm)</label>
      <div class="field-col">
        <select id="${widthPresetId}" class="select-caret" data-shelf-preset="${shelf.id}">
          <option value="">선택</option>
          <option value="400">400</option>
          <option value="600">600</option>
          <option value="800">800</option>
          <option value="custom">직접 입력</option>
        </select>
        <input id="${widthInputId}" type="number" class="bay-width-input" data-shelf-width="${shelf.id}" min="${MODULE_SHELF_WIDTH_LIMITS.min}" max="${MODULE_SHELF_WIDTH_LIMITS.max}" placeholder="직접 입력 (${MODULE_SHELF_WIDTH_LIMITS.min}~${MODULE_SHELF_WIDTH_LIMITS.max}mm)" value="${shelf.width || ""}" />
        <div class="error-msg" data-shelf-width-error="${shelf.id}"></div>
      </div>
    </div>
    <div class="form-row">
      <label for="${countInputId}">선반 갯수</label>
      <div class="field-col">
        <input id="${countInputId}" type="number" min="1" value="${shelf.count || 1}" data-shelf-count="${shelf.id}" />
        <div class="error-msg" data-shelf-count-error="${shelf.id}"></div>
      </div>
    </div>
    <div class="form-row">
      <label for="${rodCountInputId}">구성품 (행거)</label>
      <div class="field-col">
        <input id="${rodCountInputId}" type="number" min="0" value="${clothesRodQty}" data-shelf-rod-count="${shelf.id}" />
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
  const cornerSwapId = `cornerSwap-${corner.id}`;
  const cornerCountInputId = `cornerCount-${corner.id}`;
  const cornerRodCountInputId = `cornerRodCount-${corner.id}`;
  const el = document.createElement("div");
  el.className = "shelf-item corner-item";
  el.innerHTML = `
    <div class="form-row">
      <label for="${cornerSwapId}">코너 선반</label>
      <div class="field-col">
        <select id="${cornerSwapId}" class="select-caret" data-corner-swap="${corner.id}">
          <option value="default"${corner.swap ? "" : " selected"}>800 × 600</option>
          <option value="swap"${corner.swap ? " selected" : ""}>600 × 800</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <label for="${cornerCountInputId}">선반 갯수</label>
      <div class="field-col">
        <input id="${cornerCountInputId}" type="number" min="1" value="${corner.count || 1}" data-shelf-count="${corner.id}" />
        <div class="error-msg" data-shelf-count-error="${corner.id}"></div>
      </div>
    </div>
    <div class="form-row">
      <label for="${cornerRodCountInputId}">구성품 (행거)</label>
      <div class="field-col">
        <input id="${cornerRodCountInputId}" type="number" min="0" value="${clothesRodQty}" data-shelf-rod-count="${corner.id}" />
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
  bindShelfInputEventsView({
    $,
    removeBayById,
    openShelfAddonModal,
    findShelfById,
    enforceFurnitureAddonPolicyForEdge,
    renderShelfAddonSelection,
    updatePreview,
    updateBayAddonAvailability,
    autoCalculatePrice,
    pushBuilderHistory,
    getShelfAddonQuantity,
    ADDON_CLOTHES_ROD_ID,
    setShelfAddonQuantity,
    updateAddItemState,
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

const systemOptionModalFlowHelpers = createSystemOptionModalFlowHelpers({
  $,
  ADDON_CLOTHES_ROD_ID,
  findShelfById,
  getActiveCornerOptionId: () => activeCornerOptionId,
  setActiveCornerOptionId: (nextValue) => {
    activeCornerOptionId = String(nextValue || "");
  },
  getCornerDirectComposeDraft: () => cornerDirectComposeDraft,
  setCornerDirectComposeDraft: (nextValue) => {
    cornerDirectComposeDraft = nextValue;
  },
  clearFurnitureAddonsForEdge,
  getShelfAddonQuantity,
  syncCornerCustomCutInputsUI,
  setFieldError,
  setCornerCustomCutError,
  updateCornerOptionModalApplyButtonState,
  renderCornerOptionFrontPreview,
  buildPresetModuleOptionOpenFromDirectComposeEdge,
  clonePreviewAddTargetSnapshot,
  getPreviewAddAnchorElement: () => previewAddFlowState.anchorEl,
  openPresetModuleOptionModal,
  getActiveBayOptionId: () => activeBayOptionId,
  setActiveBayOptionId: (nextValue) => {
    activeBayOptionId = String(nextValue || "");
  },
  getInlineInsertPendingFirstSaveEdgeId: () => inlineInsertPendingFirstSaveEdgeId,
  setInlineInsertPendingFirstSaveEdgeId: (nextValue) => {
    inlineInsertPendingFirstSaveEdgeId = String(nextValue || "");
  },
  getBayDirectComposeDraft: () => bayDirectComposeDraft,
  setBayDirectComposeDraft: (nextValue) => {
    bayDirectComposeDraft = nextValue;
  },
  enforceFurnitureAddonPolicyForEdge,
  renderShelfAddonSelectionToTarget,
  renderShelfAddonSelection,
  syncBayOptionFurnitureSelectionAvailability,
  updateBayOptionModalApplyButtonState,
  renderBayOptionFrontPreview,
  getShelfAddonIds,
  buildRodAddonSummary,
  buildFurnitureAddonSummary,
  readCurrentInputs,
  getLayoutConfigSnapshot,
});

function syncCornerOptionModal() {
  return systemOptionModalFlowHelpers.syncCornerOptionModal();
}

function openCornerOptionModal(
  cornerId,
  { preserveDraft = false, backContext = null, initialTab = "" } = {}
) {
  return systemOptionModalFlowHelpers.openCornerOptionModal(cornerId, {
    preserveDraft,
    backContext,
    initialTab,
  });
}

function syncBayOptionModal() {
  return systemOptionModalFlowHelpers.syncBayOptionModal();
}

function openBayOptionModal(
  shelfId,
  { preserveDraft = false, backContext = null, initialTab = "" } = {}
) {
  return systemOptionModalFlowHelpers.openBayOptionModal(shelfId, {
    preserveDraft,
    backContext,
    initialTab,
  });
}

function buildModalDraftAddonBreakdown(edgeId, rodCount) {
  return systemOptionModalFlowHelpers.buildModalDraftAddonBreakdown(edgeId, rodCount);
}

function getModuleOptionAverageHeightMm() {
  return systemOptionModalFlowHelpers.getModuleOptionAverageHeightMm();
}

const moduleFrontPreviewHelpers = createModuleFrontPreviewHelpers({
  getModuleFrontPreviewFurnitureSpec,
  MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM,
  MODULE_FRONT_PREVIEW_FLOOR_FURNITURE_LEG_HEIGHT_MM,
  MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM,
  MODULE_FRONT_PREVIEW_MIN_GAP_MM,
  buildModuleFrontPreviewInteriorSteppedShelfTopPositionsMm,
  buildModuleFrontPreviewInteriorPositionsMm,
  buildModuleFrontPreviewSteppedShelfPositionsMm,
  clampModuleFrontPreviewValue,
  MODULE_FRONT_PREVIEW_GSH1_LOWER_CLEAR_MM,
  MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM,
  MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM,
  getModuleFrontPreviewShelfAnchorsMm,
  buildModuleFrontPreviewGeometry,
  buildModuleFrontPreviewAlphaColor,
  escapeHtml,
  getModuleFrontPreviewClearDimensionBetweenShelves,
  getModuleFrontPreviewFurnitureGapDimensions,
});

function buildModuleFrontPreviewLayout(args = {}) {
  return moduleFrontPreviewHelpers.buildModuleFrontPreviewLayout(args);
}

function buildModuleFrontPreviewHtml(args = {}) {
  return moduleFrontPreviewHelpers.buildModuleFrontPreviewHtml(args);
}

function renderBayOptionFrontPreview() {
  return optionFrontPreviewHelpers.renderBayOptionFrontPreview();
}

function renderCornerOptionFrontPreview() {
  return optionFrontPreviewHelpers.renderCornerOptionFrontPreview();
}

function bindOptionModalFrontPreviewEvents() {
  return systemOptionModalFlowHelpers.bindOptionModalFrontPreviewEvents();
}

const systemEdgeSaveRemoveHelpers = createSystemEdgeSaveRemoveHelpers({
  state,
  $,
  MODULE_SHELF_WIDTH_LIMITS,
  ADDON_CLOTHES_ROD_ID,
  getActiveBayOptionId: () => activeBayOptionId,
  setActiveBayOptionId: (nextValue) => {
    activeBayOptionId = String(nextValue || "");
  },
  getActiveCornerOptionId: () => activeCornerOptionId,
  setActiveCornerOptionId: (nextValue) => {
    activeCornerOptionId = String(nextValue || "");
  },
  findShelfById,
  setFieldError,
  getCornerCustomCutValidationState,
  setCornerCustomCutError,
  getShelfAddonQuantity,
  setShelfAddonQuantity,
  isPendingEdge,
  pushBuilderHistory,
  getInlineInsertPendingFirstSaveEdgeId: () => inlineInsertPendingFirstSaveEdgeId,
  setInlineInsertPendingFirstSaveEdgeId: (nextValue) => {
    inlineInsertPendingFirstSaveEdgeId = String(nextValue || "");
  },
  setBayDirectComposeDraft: (nextValue) => {
    bayDirectComposeDraft = nextValue;
  },
  setCornerDirectComposeDraft: (nextValue) => {
    cornerDirectComposeDraft = nextValue;
  },
  enforceFurnitureAddonPolicyForEdge,
  closePresetModuleOptionModal,
  renderBayInputs,
  clearFurnitureAddonsForEdge,
  getEdgeEndpointAliasSets,
  getOrderedGraphEdges,
  hasValidPlacement,
  normalizeDirection,
  resolveAnchorForDirection,
  applyRootAnchorVector,
  clearRootAnchorVector,
  unregisterEdge,
  normalizeDanglingAnchorIds,
  ensureGraph,
});

function saveBayOptionModal() {
  return systemEdgeSaveRemoveHelpers.saveBayOptionModal();
}

function reanchorChildrenAfterEdgeRemoval(removedEdge) {
  return systemEdgeSaveRemoveHelpers.reanchorChildrenAfterEdgeRemoval(removedEdge);
}

function removeBayById(id) {
  return systemEdgeSaveRemoveHelpers.removeBayById(id);
}

function saveCornerOptionModal() {
  return systemEdgeSaveRemoveHelpers.saveCornerOptionModal();
}

function removeCornerById(id) {
  return systemEdgeSaveRemoveHelpers.removeCornerById(id);
}

const systemAddonModalFlowHelpers = createSystemAddonModalFlowHelpers({
  state,
  $,
  getSelectableSystemAddonItems,
  resolveFurnitureSelectionPolicyForEdge,
  renderSystemAddonModalCategoryFilterTabs,
  getFilteredSystemAddonModalItems,
  resolveFurnitureAddonDisplayPriceInfo,
  escapeHtml,
  getActiveShelfAddonId: () => activeShelfAddonId,
  setActiveShelfAddonId: (nextValue) => {
    activeShelfAddonId = String(nextValue || "");
  },
  getShelfAddonModalReturnTo: () => shelfAddonModalReturnTo,
  setShelfAddonModalReturnTo: (nextValue) => {
    shelfAddonModalReturnTo = String(nextValue || "");
  },
  findShelfById,
  getSelectedFurnitureAddonId,
  isPendingEdge,
  pushBuilderHistory,
  setShelfAddonQuantity,
  enforceSingleSelectableAddon,
  renderShelfAddonSelection,
  renderActiveOptionModalAddonSelection,
  autoCalculatePrice,
  updateAddItemState,
  getShelfAddonQuantity,
  captureBayOptionModalDraft,
  captureCornerOptionModalDraft,
  getFurnitureAddonBlockedReason,
  showInfoModal,
  openModal,
  closeModal,
  getActiveCornerOptionId: () => activeCornerOptionId,
  getActiveBayOptionId: () => activeBayOptionId,
  openCornerOptionModal,
  openBayOptionModal,
  readCurrentInputs,
  readBayInputs,
  validateEstimateInputs,
  getLayoutConfigSnapshot,
  evaluateLayoutConsultState,
  calcColumnsDetail,
  isLayoutConsultStatus,
  applyConsultPriceToDetail,
  calcBayDetail,
  shouldTreatBayFurniturePriceAsConsult,
  refreshBuilderDerivedUI,
  renderTable,
  renderSummary,
});

function renderSystemAddonModalCards() {
  return systemAddonModalFlowHelpers.renderSystemAddonModalCards();
}

function syncSystemAddonModalSelection() {
  return systemAddonModalFlowHelpers.syncSystemAddonModalSelection();
}

function openShelfAddonModal(id, { returnTo = "" } = {}) {
  return systemAddonModalFlowHelpers.openShelfAddonModal(id, { returnTo });
}

function closeShelfAddonModalAndReturn() {
  return systemAddonModalFlowHelpers.closeShelfAddonModalAndReturn();
}

function updateBayAddonAvailability() {
  return systemAddonModalFlowHelpers.updateBayAddonAvailability();
}

function commitBaysToEstimate() {
  return systemAddonModalFlowHelpers.commitBaysToEstimate();
}

function getSystemGroupItems(groupId) {
  const key = String(groupId || "");
  if (!key) return [];
  return state.items.filter((item) => String(item?.groupId || item?.id || "") === key);
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

const systemOrderUiFlowHelpers = createSystemOrderUiFlowHelpers({
  state,
  getCurrentPhase: () => currentPhase,
  setCurrentPhase: (nextValue) => {
    currentPhase = Number(nextValue || 1);
  },
  getOrderCompleted: () => orderCompleted,
  setOrderCompleted: (nextValue) => {
    orderCompleted = Boolean(nextValue);
  },
  getSendingEmail: () => sendingEmail,
  systemOrderHelpers,
  renderEstimateTable,
  escapeHtml,
  requestStickyOffsetUpdate,
  removeSystemGroup,
  updateSystemGroupQuantity,
  calcColumnsDetail,
  calcBayDetail,
  shouldTreatBayFurniturePriceAsConsult,
  applyConsultPriceToDetail,
  isLayoutConsultStatus,
  buildGrandSummary,
  $,
  formatFulfillmentCostText,
  updateFulfillmentStepUI,
  getCustomerInfo,
  updateSendButtonEnabledShared,
  isConsentChecked,
  renderOrderCompleteDetails,
  applyThreePhaseStepVisibility,
  resolveThreePhaseNextTransition,
  validateFulfillmentStep,
  setFulfillmentStepError,
  showInfoModal,
  resolveThreePhasePrevPhase,
});

function renderTable() {
  return systemOrderUiFlowHelpers.renderTable();
}

function updateItemQuantity(id, quantity) {
  return systemOrderUiFlowHelpers.updateItemQuantity(id, quantity);
}

function renderSummary() {
  return systemOrderUiFlowHelpers.renderSummary();
}

function updateSendButtonEnabled() {
  return systemOrderUiFlowHelpers.updateSendButtonEnabled();
}

function resetOrderCompleteUI() {
  return systemOrderUiFlowHelpers.resetOrderCompleteUI();
}

function showOrderComplete() {
  return systemOrderUiFlowHelpers.showOrderComplete();
}

function updateStepVisibility(scrollTarget) {
  return systemOrderUiFlowHelpers.updateStepVisibility(scrollTarget);
}

function goToNextStep() {
  return systemOrderUiFlowHelpers.goToNextStep();
}

function goToPrevStep() {
  return systemOrderUiFlowHelpers.goToPrevStep();
}

const systemQuoteFlowHelpers = createSystemQuoteFlowHelpers({
  $,
  getCustomerInfo,
  buildGrandSummary,
  getStateItems: () => state.items,
  systemOrderHelpers,
  escapeHtml,
  formatFulfillmentLine,
  validateCustomerInfo,
  getEmailJSInstance,
  updateSendButtonEnabled,
  setSendingEmail: (nextValue) => {
    sendingEmail = Boolean(nextValue);
  },
  previewUploadHelpers,
  getRuntimeHostBlockedReason,
  getCustomerPhotoUploader: () => customerPhotoUploader,
  uploadCustomerPhotoFilesToCloudinary,
  buildBuilderEdgeRows,
  buildSendQuoteTemplateParams,
  EMAILJS_CONFIG,
  showOrderComplete,
  showInfoModal,
});

function renderOrderCompleteDetails() {
  return systemQuoteFlowHelpers.renderOrderCompleteDetails();
}

async function sendQuote() {
  return systemQuoteFlowHelpers.sendQuote();
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
  if (!isSystemInitMountReady({ $, materialPickers })) {
    setTimeout(init, 50);
    return;
  }
  initialized = true;

  runSystemInitSequence({
    initEmailJS,
    initCustomerPhotoUploader,
    showInfoModal,
    updateSendButtonEnabled,
    assignCustomerPhotoUploader: (uploader) => {
      customerPhotoUploader = uploader;
    },
    resetOrderCompleteUI,
    initCollapsibleSections,
    renderSystemAddonModalCards,
    bindOptionModalFrontPreviewEvents,
    bindPendingOptionModalCleanupOnClose,
    materialPickers,
    buildCategories,
    renderMaterialTabs,
    renderMaterialCards,
    updateSelectedMaterialCard,
    updateThicknessOptions,
    initShelfStateForShape,
    getSelectedShape,
    renderShapeSizeInputs,
    renderBayInputs,
    renderTable,
    renderSummary,
    refreshBuilderDerivedUI,
    updateBayAddonAvailability,
    updateStepVisibility,
    updateBuilderHistoryButtons,
    bindPreviewFrameResizeSync,
    requestStickyOffsetUpdate,
  });

  bindSystemInitEvents({
    $,
    $$,
    materialPickers,
    commitBaysToEstimate,
    closeShelfAddonModalAndReturn,
    getSystemAddonModalCategoryFilterKey: () => systemAddonModalCategoryFilterKey,
    setSystemAddonModalCategoryFilterKey: (nextKey) => {
      systemAddonModalCategoryFilterKey = String(nextKey || "all");
    },
    renderSystemAddonModalCards,
    getActiveCornerOptionId: () => activeCornerOptionId,
    captureCornerOptionModalDraft,
    isPresetModuleOptionCustomTabActive,
    getPresetModuleOptionModalState: () => presetModuleOptionFlowState.modalState,
    getPresetModuleOptionDraft: () => presetModuleOptionFlowState.draft,
    setSuppressPendingOptionModalCleanupOnce: (nextValue) => {
      suppressPendingOptionModalCleanupOnce = Boolean(nextValue);
    },
    closePresetModuleOptionModal,
    openShelfAddonModal,
    resetBayComposeInputsOnWidthChange,
    updateBayOptionModalApplyButtonState,
    renderBayOptionFrontPreview,
    autoCalculatePrice,
    setFieldError,
    getActiveBayOptionId: () => activeBayOptionId,
    captureBayOptionModalDraft,
    closePreviewAddTypePicker,
    handlePreviewAddModalTypeSelect,
    handlePreviewAddModalRootCornerDirectionSelect,
    closePreviewModuleActionModal,
    handlePreviewModuleActionEdit,
    handlePreviewModuleActionAddSide,
    handlePreviewModuleActionDelete,
    closePreviewPresetModuleModal,
    handlePreviewPresetModuleCardClick,
    getPreviewPresetModuleCategoryFilterKey: () => previewPresetModuleCategoryFilterKey,
    setPreviewPresetModuleCategoryFilterKey: (nextKey) => {
      previewPresetModuleCategoryFilterKey = String(nextKey || "all");
    },
    renderPreviewPresetModuleModalUI,
    openPresetPickerFromPresetModuleOptionModal,
    handlePresetModuleOptionModalTabClick,
    handlePresetModuleOptionFilterChange,
    savePresetModuleOptionModal,
    undoBuilderHistory,
    redoBuilderHistory,
    openCornerOptionModal,
    openBayOptionModal,
    setPreviewEdgeHoverState,
    handleMeasurementGuideCarouselClick,
    goToNextStep,
    goToPrevStep,
    requestStickyOffsetUpdate,
    sendQuote,
    updateSendButtonEnabled,
    setFulfillmentType,
    setFulfillmentStepError,
    updateFulfillmentStepUI,
    renderSummary,
    refreshBuilderDerivedUI,
    clearPreviewGhost,
    isPreviewBuilderReady,
    readCurrentInputs,
    getPreviewOpenEndpoint: (endpointId) => previewOpenEndpoints.get(String(endpointId || "")),
    openPreviewAddTypeModal,
    openPreviewModuleActionModal,
    setPreviewInfoMode,
    syncPreviewInfoModeButtons,
    openMeasurementGuideModal,
    getFulfillmentType,
    hidePreviewAddTooltip,
    requestPreviewFrameRerender,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
} else {
  init();
}
