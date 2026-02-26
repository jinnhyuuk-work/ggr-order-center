import {
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  SYSTEM_MATERIAL_CATEGORIES_DESC,
  SYSTEM_CUSTOM_PROCESSING,
  SYSTEM_POST_BAR_PRICING,
  SYSTEM_ADDON_ITEM_IDS,
  SYSTEM_ADDON_OPTION_CONFIG,
  SYSTEM_ADDON_ITEMS,
  SYSTEM_MODULE_OPTION_CONFIG,
  SYSTEM_MODULE_PRESETS,
} from "./data/system-data.js";
import {
  calcShippingCost,
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
  initCollapsibleSections,
} from "./shared.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const LIMITS = {
  shelf: { minWidth: 460, maxWidth: 1200, minLength: 200, maxLength: 2400 },
  column: { minLength: 1800, maxLength: 2700 },
};

const COLUMN_WIDTH_MM = 30;
const COLUMN_DEPTH_MM = 75;
const COLUMN_EXTRA_LENGTH_THRESHOLD = 2400;
const SHELF_LENGTH_MM = 600;
const SHELF_THICKNESS_MM = 18;
const COLUMN_THICKNESS_MM = 18;
const BAY_WIDTH_LIMITS = { min: 400, max: 1000 };
const SUPPORT_BRACKET_WIDTH_MM = 15;
const SUPPORT_BRACKET_INSERT_MM = 10;
const SUPPORT_VISIBLE_MM = SUPPORT_BRACKET_WIDTH_MM - SUPPORT_BRACKET_INSERT_MM;
const ADDON_CLOTHES_ROD_ID = SYSTEM_ADDON_ITEM_IDS.CLOTHES_ROD || "clothes_rod";
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
const SYSTEM_LOWEST_HEIGHT_CONSULT_AT_MM = 2700;

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
    // S-01: 신규 타입/섹션 기능을 위한 상태 모델만 먼저 준비한다.
    sections: Array.from({ length: sectionCount }, (_, idx) => ({
      id: `section-${idx + 1}`,
      lengthMm: 0,
      label: `섹션${idx + 1}`,
    })),
    lowestHeightMm: 0,
    highestHeightMm: 0,
    sectionUsage: [],
    status: "ok", // ok | consult | invalid (S-04에서 판정 연결)
    consultReasons: [],
    constraints: {
      sectionLengthMinMm: SYSTEM_SECTION_LENGTH_MIN_MM,
      consultSectionLengthAtMm: SYSTEM_SECTION_LENGTH_CONSULT_AT_MM,
      consultLowestHeightAtMm: SYSTEM_LOWEST_HEIGHT_CONSULT_AT_MM,
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
      label: prevSection?.label || `섹션${idx + 1}`,
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
      consultLowestHeightAtMm: SYSTEM_LOWEST_HEIGHT_CONSULT_AT_MM,
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
      label: String(section?.label || `섹션${idx + 1}`),
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
  if (Number(layout?.lowestHeightMm || 0) >= SYSTEM_LOWEST_HEIGHT_CONSULT_AT_MM) {
    reasons.push(`가장 낮은 높이 ${SYSTEM_LOWEST_HEIGHT_CONSULT_AT_MM}mm 이상`);
  }
  if (Number(layout?.highestHeightMm || 0) > LIMITS.column.maxLength) {
    reasons.push(`가장 높은 높이 ${LIMITS.column.maxLength}mm 초과`);
  }
  const longSections = (layout?.sections || []).filter(
    (section) => Number(section?.lengthMm || 0) >= SYSTEM_SECTION_LENGTH_CONSULT_AT_MM
  );
  if (longSections.length) {
    reasons.push(`섹션 길이 ${SYSTEM_SECTION_LENGTH_CONSULT_AT_MM}mm 이상`);
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
    lines.push(`섹션 길이: ${sectionParts.join(" | ")}`);
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
      const label = String(section?.label || `섹션${idx + 1}`);
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
      sectionErrors[idx] = `섹션 길이는 최소 ${SYSTEM_SECTION_LENGTH_MIN_MM}mm 이상 입력해주세요.`;
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
    messages.push("섹션 길이를 모두 입력해주세요.");
  }

  if (tooShortSections.length) {
    status = "invalid";
    messages.push(`섹션 길이는 최소 ${SYSTEM_SECTION_LENGTH_MIN_MM}mm 이상이어야 합니다.`);
  }

  if (overflowSections.length) {
    status = "invalid";
    const overflowNames = overflowSections
      .map((entry) => `섹션${Number(entry.sectionIndex) + 1}`)
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

let currentPhase = 1;
let sendingEmail = false;
let orderCompleted = false;
let stickyOffsetTimer = null;
let activeShelfAddonId = null;
let activeCornerOptionId = null;
let activeBayOptionId = null;
let shelfAddonModalReturnTo = "";
let bayOptionModalDraft = null;
let cornerOptionModalDraft = null;
let activePreviewAddTarget = null;
let activePreviewAddAnchorEl = null;
let previewAddPopoverStep = "type";
let previewAddPopoverSelectedModuleType = "";
let previewPresetModuleType = "";
let previewPresetModuleContext = null;
let previewPresetModuleFilterKey = "";
let previewPresetSelectedPresetId = "";
let presetModuleOptionModalState = null;
let presetModuleOptionDraft = null;
let activePreviewModuleActionTarget = null;
let activePreviewModuleActionAnchorEl = null;
let previewOpenEndpoints = new Map();
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

function formatColumnSize(column) {
  const maxLength = Number(column?.maxLength || 0);
  const minLength = Number(column?.minLength || 0);
  const displayLength = maxLength || Number(column?.length || 0);
  const lengthText =
    minLength && maxLength ? `${minLength}~${maxLength}mm` : `${displayLength}mm`;
  return `${column.thickness}T / ${column.width}×${lengthText}`;
}

function getPricePerM2(material, thickness) {
  if (!material) return 0;
  if (material.pricePerM2ByThickness) {
    if (thickness && material.pricePerM2ByThickness[thickness]) {
      return material.pricePerM2ByThickness[thickness];
    }
    const firstAvailable = material.availableThickness?.find(
      (t) => material.pricePerM2ByThickness[t]
    );
    if (firstAvailable !== undefined) {
      return material.pricePerM2ByThickness[firstAvailable];
    }
    const firstPrice = Object.values(material.pricePerM2ByThickness)[0];
    if (firstPrice) return firstPrice;
  }
  return material.pricePerM2 || 0;
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
    emptyTitle: "선택된 기둥 컬러 없음",
    emptyMeta: "기둥 컬러를 선택해주세요.",
    selectedCategory: "",
    selectedMaterialId: "",
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

function renderMaterialCards(picker) {
  const container = $(picker.cardsId);
  if (!container) return;
  container.innerHTML = "";

  const list = Object.values(picker.materials).filter(
    (mat) => (mat.category || "기타") === picker.selectedCategory
  );

  list.forEach((mat) => {
    const label = document.createElement("label");
    label.className = `card-base material-card${
      picker.selectedMaterialId === mat.id ? " selected" : ""
    }`;
    const limits = LIMITS[picker.key];
    const sizeLine =
      picker.key === "column"
        ? `두께 ${COLUMN_THICKNESS_MM}T 고정 / 폭 ${COLUMN_WIDTH_MM}mm 고정 / 높이 ${limits.minLength}~${limits.maxLength}mm`
        : `두께 ${SHELF_THICKNESS_MM}T 고정 / 폭 ${limits.minWidth}~${limits.maxWidth}mm / 길이 ${SHELF_LENGTH_MM}mm 고정`;
    label.innerHTML = `
      <input type="radio" name="${picker.inputName}" value="${mat.id}" ${
        picker.selectedMaterialId === mat.id ? "checked" : ""
      } />
      <div class="material-visual" style="background: ${mat.swatch || "#ddd"}"></div>
      <div class="name">${mat.name}</div>
      <div class="price">㎡당 ${getPricePerM2(mat).toLocaleString()}원</div>
      <div class="size">가능 두께: ${(mat.availableThickness || [])
        .map((t) => `${t}T`)
        .join(", ")}</div>
      <div class="size">${sizeLine}</div>
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
  const sizeLine =
    picker.key === "column"
      ? `두께 ${COLUMN_THICKNESS_MM}T 고정 / 폭 ${COLUMN_WIDTH_MM}mm 고정 / 높이 ${limits.minLength}~${limits.maxLength}mm`
      : `두께 ${SHELF_THICKNESS_MM}T 고정 / 폭 ${limits.minWidth}~${limits.maxWidth}mm / 길이 ${SHELF_LENGTH_MM}mm 고정`;
  renderSelectedCard({
    cardId: picker.selectedCardId,
    emptyTitle: picker.emptyTitle,
    emptyMeta: picker.emptyMeta,
    swatch: mat?.swatch,
    name: mat ? escapeHtml(mat.name) : "",
    metaLines: mat
      ? [
          `가능 두께: ${(mat.availableThickness || []).map((t) => `${t}T`).join(", ")}`,
          sizeLine,
        ]
      : [],
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

function getOrderedGraphEdges() {
  ensureGraph();
  const order = ensureEdgeOrder();
  return order
    .map((id) => state.graph.edges[id])
    .filter((edge) => edge && (edge.type === "bay" || edge.type === "corner") && !edge.pendingAdd);
}

function countCurrentCornerModules() {
  return getOrderedGraphEdges().filter((edge) => edge?.type === "corner").length;
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

function buildRootCornerStartTargetVariant(target = activePreviewAddTarget, direction = "right") {
  const baseTarget =
    target && typeof target === "object" ? target : { endpointId: "root-endpoint", allowedTypes: ["normal", "corner"] };
  if (!isRootPreviewEndpointTarget(baseTarget)) return null;
  const normalizedDirection = direction === "left" ? "left" : "right";
  const isLeft = normalizedDirection === "left";
  return {
    ...baseTarget,
    endpointId: "root-endpoint",
    sideIndex: isLeft ? 2 : 0,
    attachSideIndex: isLeft ? 2 : 0,
    attachAtStart: true,
    prepend: true,
    extendDx: isLeft ? -1 : 1,
    extendDy: 0,
    inwardX: 0,
    inwardY: 1,
    rootCornerStartDirection: normalizedDirection,
  };
}

function hasSelectedRootCornerStartDirection(target = activePreviewAddTarget) {
  return (
    isRootPreviewEndpointTarget(target) &&
    (target?.rootCornerStartDirection === "left" || target?.rootCornerStartDirection === "right")
  );
}

function applyRootCornerStartDirectionToActiveTarget(direction = "right") {
  const nextTarget = buildRootCornerStartTargetVariant(activePreviewAddTarget, direction);
  if (!nextTarget) return false;
  activePreviewAddTarget = nextTarget;
  return true;
}

function resolveActivePreviewAddSourceTarget(target = activePreviewAddTarget) {
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
  ["#previewAddTypeError", "#previewAddTypePopoverError"].forEach((selector) => {
    const errorEl = $(selector);
    if (!errorEl) return;
    errorEl.textContent = String(message || "");
    errorEl.classList.toggle("error", Boolean(isError && message));
  });
}

function getPreviewAddTypePopoverElements() {
  return {
    popover: $("#previewAddTypePopover"),
    normalBtn: $("#previewAddPopoverNormalBtn"),
    cornerBtn: $("#previewAddPopoverCornerBtn"),
    rootCornerRightBtn: $("#previewAddPopoverRootCornerRightBtn"),
    rootCornerLeftBtn: $("#previewAddPopoverRootCornerLeftBtn"),
    rootCornerBackBtn: $("#previewAddPopoverRootCornerBackBtn"),
    presetBtn: $("#previewAddPopoverPresetBtn"),
    customBtn: $("#previewAddPopoverCustomBtn"),
    backBtn: $("#previewAddPopoverBackBtn"),
    descEl: $("#previewAddTypePopoverDesc"),
    typeStepEl: $("#previewAddTypePopoverTypeStep"),
    rootCornerStepEl: $("#previewAddTypePopoverRootCornerStep"),
    modeStepEl: $("#previewAddTypePopoverModeStep"),
    selectedTypeEl: $("#previewAddTypePopoverSelectedType"),
    titleEl: $("#previewAddTypePopoverTitle"),
  };
}

function getPreviewAddPopoverModuleTypeLabel(type) {
  if (type === "corner") return "코너 모듈";
  return "일반 모듈";
}

function setPreviewAddTypePopoverStep(step = "type", selectedModuleType = "") {
  const normalizedStep =
    step === "mode" || step === "root-corner-direction" ? step : "type";
  const normalizedType =
    selectedModuleType === "corner" || selectedModuleType === "normal"
      ? selectedModuleType
      : "";
  previewAddPopoverStep = normalizedStep;
  previewAddPopoverSelectedModuleType =
    normalizedStep === "mode" || normalizedStep === "root-corner-direction" ? normalizedType : "";

  const {
    popover,
    titleEl,
    descEl,
    typeStepEl,
    rootCornerStepEl,
    modeStepEl,
    selectedTypeEl,
    rootCornerRightBtn,
    rootCornerLeftBtn,
    rootCornerBackBtn,
    presetBtn,
    customBtn,
    backBtn,
  } = getPreviewAddTypePopoverElements();
  if (!popover) return;

  popover.dataset.step = previewAddPopoverStep;
  popover.dataset.moduleType = previewAddPopoverSelectedModuleType;
  typeStepEl?.classList.toggle("hidden", previewAddPopoverStep !== "type");
  rootCornerStepEl?.classList.toggle("hidden", previewAddPopoverStep !== "root-corner-direction");
  modeStepEl?.classList.toggle("hidden", previewAddPopoverStep !== "mode");

  if (previewAddPopoverStep === "root-corner-direction") {
    if (titleEl) titleEl.textContent = "코너 시작 방향 선택";
    if (descEl) {
      descEl.textContent = "첫 모듈을 코너로 시작할 방향을 선택하세요.";
    }
    if (selectedTypeEl) {
      selectedTypeEl.textContent = "";
    }
    const rightTarget = buildRootCornerStartTargetVariant(activePreviewAddTarget, "right");
    const leftTarget = buildRootCornerStartTargetVariant(activePreviewAddTarget, "left");
    const rightBlockedMessage =
      rightTarget && typeof rightTarget === "object"
        ? getCornerAttachSideBlockedMessage(rightTarget, getSelectedShape())
        : "우측 방향 코너 시작을 사용할 수 없습니다.";
    const leftBlockedMessage =
      leftTarget && typeof leftTarget === "object"
        ? getCornerAttachSideBlockedMessage(leftTarget, getSelectedShape())
        : "좌측 방향 코너 시작을 사용할 수 없습니다.";
    if (rootCornerRightBtn) {
      rootCornerRightBtn.disabled = Boolean(rightBlockedMessage);
      if (rightBlockedMessage) rootCornerRightBtn.title = rightBlockedMessage;
      else rootCornerRightBtn.removeAttribute("title");
    }
    if (rootCornerLeftBtn) {
      rootCornerLeftBtn.disabled = Boolean(leftBlockedMessage);
      if (leftBlockedMessage) rootCornerLeftBtn.title = leftBlockedMessage;
      else rootCornerLeftBtn.removeAttribute("title");
    }
    if (rootCornerBackBtn) rootCornerBackBtn.disabled = false;
    return;
  }

  if (previewAddPopoverStep === "mode") {
    const typeLabel = getPreviewAddPopoverModuleTypeLabel(previewAddPopoverSelectedModuleType);
    if (titleEl) titleEl.textContent = `${typeLabel} 추가`;
    if (descEl) {
      descEl.textContent = `${typeLabel} 추가 방식을 선택하세요.`;
    }
    if (selectedTypeEl) {
      selectedTypeEl.textContent = `선택 유형: ${typeLabel}`;
    }
    if (presetBtn) presetBtn.disabled = false;
    if (customBtn) customBtn.disabled = false;
    if (backBtn) backBtn.disabled = false;
    return;
  }

  if (titleEl) titleEl.textContent = "추가 방식 선택";
  if (descEl) {
    descEl.textContent = "끝점에서 연장할 모듈 유형을 선택하세요.";
  }
  if (selectedTypeEl) {
    selectedTypeEl.textContent = "";
  }
}

function handlePreviewAddPopoverTypeSelect(moduleType) {
  const normalizedType = moduleType === "corner" ? "corner" : "normal";
  const { normalBtn, cornerBtn, customBtn, rootCornerRightBtn, rootCornerLeftBtn, titleEl } =
    getPreviewAddTypePopoverElements();
  const sourceBtn = normalizedType === "corner" ? cornerBtn : normalBtn;
  if (!sourceBtn || sourceBtn.disabled) return;
  setPreviewAddTypeErrorMessage("", { isError: false });
  if (
    normalizedType === "corner" &&
    isRootPreviewEndpointTarget(activePreviewAddTarget) &&
    !String(activePreviewAddTarget?.cornerId || "")
  ) {
    setPreviewAddTypePopoverStep("root-corner-direction", "corner");
    positionPreviewAddTypePopover();
    requestAnimationFrame(() => {
      if (rootCornerRightBtn && !rootCornerRightBtn.disabled) {
        rootCornerRightBtn.focus();
        positionPreviewAddTypePopover();
        return;
      }
      if (rootCornerLeftBtn && !rootCornerLeftBtn.disabled) {
        rootCornerLeftBtn.focus();
        positionPreviewAddTypePopover();
        return;
      }
      titleEl?.focus();
      positionPreviewAddTypePopover();
    });
    return;
  }
  setPreviewAddTypePopoverStep("mode", normalizedType);
  positionPreviewAddTypePopover();
  requestAnimationFrame(() => {
    customBtn?.focus();
    positionPreviewAddTypePopover();
  });
}

function handlePreviewAddPopoverRootCornerDirectionSelect(direction = "right") {
  const normalizedDirection = direction === "left" ? "left" : "right";
  const { rootCornerRightBtn, rootCornerLeftBtn, customBtn, titleEl } = getPreviewAddTypePopoverElements();
  const sourceBtn = normalizedDirection === "left" ? rootCornerLeftBtn : rootCornerRightBtn;
  if (!sourceBtn || sourceBtn.disabled) return;
  const previewTarget = buildRootCornerStartTargetVariant(activePreviewAddTarget, normalizedDirection);
  if (!previewTarget) {
    setPreviewAddTypeErrorMessage(getRootCornerDirectionRequiredMessage(), { isError: true });
    return;
  }
  const blockedMessage = getCornerAttachSideBlockedMessage(previewTarget, getSelectedShape());
  if (blockedMessage) {
    setPreviewAddTypeErrorMessage(blockedMessage, { isError: true });
    return;
  }
  if (!applyRootCornerStartDirectionToActiveTarget(normalizedDirection)) {
    setPreviewAddTypeErrorMessage(getRootCornerDirectionRequiredMessage(), { isError: true });
    return;
  }
  setPreviewAddTypeErrorMessage("", { isError: false });
  setPreviewAddTypePopoverStep("mode", "corner");
  positionPreviewAddTypePopover();
  requestAnimationFrame(() => {
    if (customBtn && !customBtn.disabled) {
      customBtn.focus();
    } else {
      titleEl?.focus();
    }
    positionPreviewAddTypePopover();
  });
}

function handlePreviewAddPopoverBack() {
  setPreviewAddTypeErrorMessage("", { isError: false });
  const { normalBtn, cornerBtn, rootCornerRightBtn, rootCornerLeftBtn, titleEl } =
    getPreviewAddTypePopoverElements();
  if (
    previewAddPopoverStep === "mode" &&
    previewAddPopoverSelectedModuleType === "corner" &&
    isRootPreviewEndpointTarget(activePreviewAddTarget) &&
    !String(activePreviewAddTarget?.cornerId || "")
  ) {
    setPreviewAddTypePopoverStep("root-corner-direction", "corner");
    positionPreviewAddTypePopover();
    requestAnimationFrame(() => {
      if (rootCornerRightBtn && !rootCornerRightBtn.disabled) {
        rootCornerRightBtn.focus();
        return;
      }
      if (rootCornerLeftBtn && !rootCornerLeftBtn.disabled) {
        rootCornerLeftBtn.focus();
        return;
      }
      titleEl?.focus();
    });
    return;
  }

  setPreviewAddTypePopoverStep("type", "");
  positionPreviewAddTypePopover();
  requestAnimationFrame(() => {
    if (normalBtn && !normalBtn.disabled) {
      normalBtn.focus();
      return;
    }
    if (cornerBtn && !cornerBtn.disabled) {
      cornerBtn.focus();
      return;
    }
    titleEl?.focus();
  });
}

function handlePreviewAddPopoverCustomCompose() {
  if (previewAddPopoverSelectedModuleType === "corner") {
    commitPreviewAddCorner();
    return;
  }
  commitPreviewAddNormal();
}

function handlePreviewAddPopoverPresetSelect() {
  if (previewAddPopoverSelectedModuleType !== "normal" && previewAddPopoverSelectedModuleType !== "corner") {
    return;
  }
  closePreviewAddTypePicker({ clearTarget: false });
  openPresetModuleOptionModal(previewAddPopoverSelectedModuleType, {
    mode: "add",
    addTarget: activePreviewAddTarget,
    returnFocusEl: activePreviewAddAnchorEl instanceof Element ? activePreviewAddAnchorEl : null,
  });
}

function setPreviewPresetModuleError(message = "") {
  const errorEl = $("#previewPresetModuleError");
  if (!errorEl) return;
  errorEl.textContent = String(message || "");
  errorEl.classList.toggle("error", Boolean(message));
}

function closePreviewPresetModuleModal({ returnFocus = true, clearTarget = true } = {}) {
  const currentContext =
    previewPresetModuleContext && typeof previewPresetModuleContext === "object"
      ? { ...previewPresetModuleContext }
      : null;
  const returnsToPresetModuleOption =
    currentContext?.mode === "pick" && currentContext?.returnTo === "preset-module-option";
  closeModal("#previewPresetModuleModal");
  setPreviewPresetModuleError("");
  previewPresetModuleType = "";
  previewPresetModuleFilterKey = "";
  previewPresetSelectedPresetId = "";
  const previewEl = $("#previewPresetModuleFrontPreview");
  if (previewEl) previewEl.innerHTML = "";
  const focusTarget =
    previewPresetModuleContext?.returnFocusEl instanceof Element
      ? previewPresetModuleContext.returnFocusEl
      : activePreviewAddAnchorEl;
  if (!returnsToPresetModuleOption && returnFocus && focusTarget instanceof Element && focusTarget.isConnected) {
    focusTarget.focus();
  }
  previewPresetModuleContext = null;
  if (clearTarget) {
    activePreviewAddTarget = null;
    activePreviewAddAnchorEl = null;
  }
  if (returnsToPresetModuleOption) {
    reopenPresetModuleOptionModalAfterPresetPicker();
  }
}

function setPresetModuleOptionError(message = "") {
  const errorEl = $("#presetModuleOptionError");
  if (!errorEl) return;
  errorEl.textContent = String(message || "");
  errorEl.classList.toggle("error", Boolean(message));
}

function clonePreviewAddTargetSnapshot(target) {
  if (!target || typeof target !== "object") return null;
  try {
    return JSON.parse(JSON.stringify(target));
  } catch (_err) {
      return {
        endpointId: String(target.endpointId || ""),
        sideIndex: Number(target.sideIndex),
        cornerId: String(target.cornerId || ""),
        prepend: Boolean(target.prepend),
        attachSideIndex: Number(target.attachSideIndex),
        attachAtStart: Boolean(target.attachAtStart),
        allowedTypes: Array.isArray(target.allowedTypes) ? [...target.allowedTypes] : ["normal"],
        extendDx: Number(target.extendDx),
        extendDy: Number(target.extendDy),
        inwardX: Number(target.inwardX),
        inwardY: Number(target.inwardY),
        rootCornerStartDirection: String(target.rootCornerStartDirection || ""),
      };
    }
  }

function getPresetModuleOptionSelectedPreset() {
  const presetId = String(presetModuleOptionDraft?.presetId || "");
  if (!presetId) return null;
  const items = getPreviewPresetItemsForType(presetModuleOptionDraft?.moduleType || "");
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
  const moduleType = presetModuleOptionDraft?.moduleType === "corner" ? "corner" : "normal";
  const filterLabel =
    moduleType === "corner"
      ? (preset.swap ? "600 × 800" : "800 × 600")
      : `${String(presetModuleOptionDraft?.filterKey || Math.round(Number(preset.width || 0) || 0) || "")}mm`;
  const { componentSummary, furnitureSummary } = buildPresetAddonBreakdownFromPreset(preset);
  const meta = `${moduleType === "corner" ? "코너" : "일반"} · ${filterLabel} · 선반 ${Math.max(
    1,
    Math.floor(Number(preset.count || 1))
  )}개 · 구성품 ${componentSummary === "-" ? "없음" : componentSummary} · 가구 ${
    furnitureSummary === "-" ? "없음" : furnitureSummary
  }`;
  target.innerHTML = `
    <div class="addon-chip">
      <div class="material-visual" style="background:#ddd;"></div>
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
  const modalState = presetModuleOptionModalState;
  const preset = getPresetModuleOptionSelectedPreset();
  if (!modalState) {
    container.innerHTML = "";
    return;
  }
  if (!preset) {
    const widthLabel = presetModuleOptionDraft?.filterKey
      ? (modalState.moduleType === "corner"
          ? (presetModuleOptionDraft.filterKey === "600x800" ? "600 × 800" : "800 × 600")
          : `${presetModuleOptionDraft.filterKey}mm`)
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
    Math.round(Number(presetModuleOptionDraft?.filterKey || preset.width || 400) || 400)
  );
  const shelfWidthMm = moduleType === "corner" ? (preset.swap ? 600 : 800) : normalWidthFromFilter;
  const sizeLabel =
    moduleType === "corner"
      ? (preset.swap ? "600 × 800mm" : "800 × 600mm")
      : `폭 ${normalWidthFromFilter}mm`;
  const { componentSummary, furnitureSummary } = buildPresetAddonBreakdownFromPreset(preset);
  container.innerHTML = buildModuleFrontPreviewHtml({
    moduleLabel: moduleType === "corner" ? "코너 모듈" : "일반 모듈",
    sizeLabel,
    shelfCount: Number(preset.count || 1),
    componentSummary,
    furnitureSummary,
    type: moduleType === "corner" ? "corner" : "bay",
    averageHeightMm,
    shelfWidthMm,
  });
}

function syncPresetModuleOptionModal() {
  const modalState = presetModuleOptionModalState;
  if (!modalState) return;
  const titleEl = $("#presetModuleOptionModalTitle");
  const pickerBtn = $("#openPresetModulePickerBtn");
  const filterLabelEl = $("#presetModuleOptionFilterLabel");
  const filterNoteEl = $("#presetModuleOptionFilterNote");
  const filterSelectEl = $("#presetModuleOptionFilterSelect");
  const moduleLabel = modalState.moduleType === "corner" ? "코너 모듈" : "일반 모듈";
  if (!presetModuleOptionDraft) {
    presetModuleOptionDraft = {
      moduleType: modalState.moduleType,
      presetId: "",
      filterKey: getDefaultPresetModuleOptionFilterKey(modalState.moduleType, modalState.edgeId),
    };
  }
  const filterOptions = getPresetModuleOptionFilterOptions(modalState.moduleType);
  if (!filterOptions.some((option) => String(option.key) === String(presetModuleOptionDraft.filterKey || ""))) {
    presetModuleOptionDraft.filterKey = String(
      getDefaultPresetModuleOptionFilterKey(modalState.moduleType, modalState.edgeId)
    );
  }
  const selectedPreset = getPresetModuleOptionSelectedPreset();
  if (
    selectedPreset &&
    !isPreviewPresetAvailableForFilter(
      selectedPreset,
      String(presetModuleOptionDraft.filterKey || ""),
      modalState.moduleType
    )
  ) {
    presetModuleOptionDraft.presetId = "";
  }
  if (titleEl) {
    titleEl.textContent =
      modalState.mode === "edit" ? `${moduleLabel} 모듈선택 설정` : `${moduleLabel} 모듈선택`;
  }
  if (filterLabelEl) {
    filterLabelEl.textContent = modalState.moduleType === "corner" ? "코너 방향" : "선반 폭 (mm)";
  }
  if (filterNoteEl) {
    filterNoteEl.textContent =
      modalState.moduleType === "corner"
        ? "코너 방향을 먼저 선택한 뒤 모듈을 선택하세요."
        : "선반 폭을 먼저 선택한 뒤 모듈을 선택하세요.";
  }
  if (filterSelectEl) {
    filterSelectEl.innerHTML = filterOptions
      .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
      .join("");
    filterSelectEl.value = String(presetModuleOptionDraft.filterKey || "");
  }
  if (pickerBtn) {
    pickerBtn.textContent = "모듈 선택";
  }
  renderPresetModuleOptionSelectionSummary();
  renderPresetModuleOptionFrontPreview();
  setPresetModuleOptionError("");
  const saveBtn = $("#savePresetModuleOptionModal");
  if (saveBtn) {
    const hasPreset = Boolean(getPresetModuleOptionSelectedPreset());
    saveBtn.disabled = !hasPreset;
    saveBtn.classList.toggle("btn-disabled", !hasPreset);
  }
}

function openPresetModuleOptionModal(moduleType, { mode = "add", edgeId = "", returnFocusEl = null, addTarget = null, preserveDraft = false } = {}) {
  const normalizedModuleType = moduleType === "corner" ? "corner" : "normal";
  const normalizedMode = mode === "edit" ? "edit" : "add";
  if (!preserveDraft || !presetModuleOptionDraft || presetModuleOptionDraft.moduleType !== normalizedModuleType) {
    presetModuleOptionDraft = {
      moduleType: normalizedModuleType,
      presetId: "",
      filterKey: getDefaultPresetModuleOptionFilterKey(normalizedModuleType, edgeId),
    };
  }
  presetModuleOptionModalState = {
    mode: normalizedMode,
    moduleType: normalizedModuleType,
    edgeId: String(edgeId || ""),
    edgeType: normalizedModuleType === "corner" ? "corner" : "bay",
    addTarget: normalizedMode === "add" ? clonePreviewAddTargetSnapshot(addTarget || activePreviewAddTarget) : null,
    returnFocusEl: returnFocusEl instanceof Element ? returnFocusEl : null,
  };
  syncPresetModuleOptionModal();
  openModal("#presetModuleOptionModal", { focusTarget: "#presetModuleOptionModalTitle" });
}

function closePresetModuleOptionModal({ returnFocus = true, clearState = true } = {}) {
  closeModal("#presetModuleOptionModal");
  setPresetModuleOptionError("");
  const focusEl = presetModuleOptionModalState?.returnFocusEl;
  if (returnFocus && focusEl instanceof Element && focusEl.isConnected) {
    focusEl.focus();
  }
  if (clearState) {
    presetModuleOptionModalState = null;
    presetModuleOptionDraft = null;
  }
}

function reopenPresetModuleOptionModalAfterPresetPicker() {
  if (!presetModuleOptionModalState) return;
  syncPresetModuleOptionModal();
  openModal("#presetModuleOptionModal", { focusTarget: "#presetModuleOptionModalTitle" });
}

function handlePresetModuleOptionFilterChange() {
  const modalState = presetModuleOptionModalState;
  const filterSelectEl = $("#presetModuleOptionFilterSelect");
  if (!modalState || !filterSelectEl) return;
  if (!presetModuleOptionDraft) {
    presetModuleOptionDraft = {
      moduleType: modalState.moduleType,
      presetId: "",
      filterKey: "",
    };
  }
  presetModuleOptionDraft.moduleType = modalState.moduleType;
  presetModuleOptionDraft.filterKey = String(filterSelectEl.value || "");
  const preset = getPresetModuleOptionSelectedPreset();
  if (
    preset &&
    !isPreviewPresetAvailableForFilter(
      preset,
      String(presetModuleOptionDraft.filterKey || ""),
      modalState.moduleType
    )
  ) {
    presetModuleOptionDraft.presetId = "";
  }
  syncPresetModuleOptionModal();
}

function openPresetPickerFromPresetModuleOptionModal() {
  const modalState = presetModuleOptionModalState;
  if (!modalState) return;
  closePresetModuleOptionModal({ returnFocus: false, clearState: false });
  openPreviewPresetModuleModal(modalState.moduleType, {
    context: {
      mode: "pick",
      returnTo: "preset-module-option",
      returnFocusEl: modalState.returnFocusEl instanceof Element ? modalState.returnFocusEl : null,
      initialPresetId: String(presetModuleOptionDraft?.presetId || ""),
      initialFilterKey: String(presetModuleOptionDraft?.filterKey || ""),
      edgeId: String(modalState.edgeId || ""),
      edgeType: modalState.edgeType === "corner" ? "corner" : "bay",
    },
  });
}

function getPreviewPresetItemsForType(type = "") {
  const key = type === "corner" ? "corner" : "normal";
  return Array.isArray(SYSTEM_MODULE_PRESETS[key]) ? SYSTEM_MODULE_PRESETS[key] : [];
}

function getPreviewPresetFilterKeysForItem(item, type = previewPresetModuleType) {
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

function getPreviewPresetFilterKeyForItem(item, type = previewPresetModuleType) {
  return String(getPreviewPresetFilterKeysForItem(item, type)[0] || "");
}

function isPreviewPresetAvailableForFilter(item, filterKey, type = previewPresetModuleType) {
  const key = String(filterKey || "");
  if (!key) return true;
  return getPreviewPresetFilterKeysForItem(item, type).includes(key);
}

function getPreviewPresetFilterOptions(type = previewPresetModuleType) {
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

function getFilteredPreviewPresetItems() {
  const items = getPreviewPresetItemsForType(previewPresetModuleType);
  if (!previewPresetModuleFilterKey) return items;
  return items.filter((item) =>
    isPreviewPresetAvailableForFilter(item, previewPresetModuleFilterKey, previewPresetModuleType)
  );
}

function getPreviewPresetSelectedPreset() {
  if (!previewPresetSelectedPresetId) return null;
  const allItems = getPreviewPresetItemsForType(previewPresetModuleType);
  return allItems.find((item) => String(item.id) === String(previewPresetSelectedPresetId)) || null;
}

function getPreviewPresetTargetEdge() {
  const ctx = previewPresetModuleContext;
  if (!ctx || ctx.mode !== "edit" || !ctx.edgeId) return null;
  return findShelfById(ctx.edgeId);
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
  return {
    componentSummary: buildRodAddonSummary(preset?.rodCount, "-"),
    furnitureSummary: buildFurnitureAddonSummary(furnitureAddonIds, "-"),
  };
}

function syncPreviewPresetModuleApplyButton() {
  const applyBtn = $("#applyPreviewPresetModuleModal");
  if (!applyBtn) return;
  const hasSelection = Boolean(getPreviewPresetSelectedPreset());
  applyBtn.disabled = !hasSelection;
  applyBtn.classList.toggle("btn-disabled", !hasSelection);
}

function renderPreviewPresetModuleFilterOptions() {
  const container = $("#previewPresetModuleFilterOptions");
  const labelEl = $("#previewPresetModuleFilterLabel");
  if (!container) return;
  const isCorner = previewPresetModuleType === "corner";
  if (labelEl) labelEl.textContent = isCorner ? "코너 방향" : "선반 폭 (mm)";
  const options = getPreviewPresetFilterOptions(previewPresetModuleType);
  if (!options.length) {
    container.innerHTML = `<div class="builder-hint">선택 가능한 기준이 없습니다.</div>`;
    return;
  }
  container.innerHTML = options
    .map((option) => {
      const active = String(option.key) === String(previewPresetModuleFilterKey);
      return `
        <button
          type="button"
          class="preview-preset-filter-btn${active ? " is-active" : ""}"
          data-preview-preset-filter="${escapeHtml(option.key)}"
          aria-pressed="${active ? "true" : "false"}"
        >
          ${escapeHtml(option.label)}
        </button>
      `;
    })
    .join("");
}

function renderPreviewPresetModuleCards() {
  const container = $("#previewPresetModuleCards");
  if (!container) return;
  const items = getFilteredPreviewPresetItems();
  if (!items.length) {
    container.innerHTML = `<div class="builder-hint">표시할 모듈이 없습니다.</div>`;
    syncPreviewPresetModuleApplyButton();
    return;
  }
  container.innerHTML = items
    .map((item) => {
      const type = previewPresetModuleType === "corner" ? "corner" : "normal";
      const selected = String(item.id) === String(previewPresetSelectedPresetId);
      const { componentSummary, furnitureSummary } = buildPresetAddonBreakdownFromPreset(item);
      const meta = `선반 ${Number(item.count || 1)}개 · 구성품 ${
        componentSummary === "-" ? "없음" : componentSummary
      } · 가구 ${furnitureSummary === "-" ? "없음" : furnitureSummary}`;
      return `
        <button
          type="button"
          class="card-base preview-preset-card${selected ? " is-selected" : ""}"
          data-preview-preset-id="${escapeHtml(item.id)}"
          data-preview-preset-type="${escapeHtml(type)}"
          aria-pressed="${selected ? "true" : "false"}"
        >
          <span class="preset-title">${escapeHtml(item.label)}</span>
          <span class="preset-meta">${escapeHtml(meta)}</span>
          ${item.description ? `<span class="preset-desc">${escapeHtml(item.description)}</span>` : ""}
        </button>
      `;
    })
    .join("");
  syncPreviewPresetModuleApplyButton();
}

function renderPreviewPresetModuleSelectionPreview() {
  const container = $("#previewPresetModuleFrontPreview");
  if (!container) return;
  const preset = getPreviewPresetSelectedPreset();
  if (!preset) {
    container.innerHTML = `
      <div class="module-front-preview-card">
        <div class="module-front-preview-head">
          <div class="module-front-preview-title">모듈 미리보기</div>
        </div>
        <div class="builder-hint">좌측에서 폭/방향과 구성을 선택하면 미리보기가 표시됩니다.</div>
      </div>
    `;
    return;
  }

  const isCorner = previewPresetModuleType === "corner";
  const averageHeightMm = getModuleOptionAverageHeightMm();
  const normalWidthFromFilter = Math.max(
    1,
    Math.round(Number(previewPresetModuleFilterKey || preset.width || 400) || 400)
  );
  const shelfWidthMm = isCorner ? (preset.swap ? 600 : 800) : normalWidthFromFilter;
  const sizeLabel = isCorner
    ? (preset.swap ? "600 × 800mm" : "800 × 600mm")
    : `폭 ${normalWidthFromFilter}mm`;
  const { componentSummary, furnitureSummary } = buildPresetAddonBreakdownFromPreset(preset);
  const headerNote = previewPresetModuleContext?.mode === "edit" ? "현재 모듈에 적용 예정" : "새 모듈 추가 예정";

  container.innerHTML = `
    <div class="field-note preview-preset-preview-note">
      ${escapeHtml(headerNote)}
    </div>
    ${buildModuleFrontPreviewHtml({
      moduleLabel: isCorner ? "코너 모듈" : "일반 모듈",
      sizeLabel,
      shelfCount: Number(preset.count || 1),
      componentSummary,
      furnitureSummary,
      type: isCorner ? "corner" : "bay",
      averageHeightMm,
      shelfWidthMm,
    })}
  `;
}

function chooseDefaultPreviewPresetFilterAndSelection() {
  const type = previewPresetModuleType;
  const options = getPreviewPresetFilterOptions(type);
  const allItems = getPreviewPresetItemsForType(type);
  const targetEdge = getPreviewPresetTargetEdge();
  const presetContext =
    previewPresetModuleContext && typeof previewPresetModuleContext === "object"
      ? previewPresetModuleContext
      : null;
  const initialFilterKey = String(presetContext?.initialFilterKey || "");
  const initialPresetId = String(presetContext?.initialPresetId || "");

  let preferredFilterKey = "";
  if (initialFilterKey && options.some((option) => option.key === initialFilterKey)) {
    preferredFilterKey = initialFilterKey;
  } else if (targetEdge && type === "corner" && targetEdge.type === "corner") {
    preferredFilterKey = targetEdge.swap ? "600x800" : "800x600";
  } else if (targetEdge && type === "normal" && targetEdge.type === "bay") {
    const widthKey = String(Math.round(Number(targetEdge.width || 0) || 0));
    if (options.some((option) => option.key === widthKey)) preferredFilterKey = widthKey;
  }
  if (!preferredFilterKey && options.length) preferredFilterKey = options[0].key;
  previewPresetModuleFilterKey = preferredFilterKey;

  const filteredItems = allItems.filter(
    (item) => isPreviewPresetAvailableForFilter(item, previewPresetModuleFilterKey, type)
  );

  let matchedPresetId = "";
  if (initialPresetId && filteredItems.some((item) => String(item.id) === initialPresetId)) {
    matchedPresetId = initialPresetId;
  } else if (targetEdge) {
    const match = filteredItems.find((item) => {
      const itemCount = Math.max(1, Math.floor(Number(item.count || 1)));
      const itemRodCount = Math.max(0, Math.floor(Number(item.rodCount || 0)));
      const itemFurnitureId = String(getPresetFurnitureAddonIds(item)[0] || "");
      const edgeCount = Math.max(1, Math.floor(Number(targetEdge.count || 1)));
      const edgeRodCount = getShelfAddonQuantity(targetEdge.id, ADDON_CLOTHES_ROD_ID);
      const edgeFurnitureId = getSelectedFurnitureAddonId(targetEdge.id);
      if (type === "corner" && targetEdge.type === "corner") {
        return (
          Boolean(item.swap) === Boolean(targetEdge.swap) &&
          itemCount === edgeCount &&
          itemRodCount === edgeRodCount &&
          itemFurnitureId === edgeFurnitureId
        );
      }
      if (type === "normal" && targetEdge.type === "bay") {
        return (
          itemCount === edgeCount &&
          itemRodCount === edgeRodCount &&
          itemFurnitureId === edgeFurnitureId
        );
      }
      return false;
    });
    matchedPresetId = match ? String(match.id) : "";
  }
  previewPresetSelectedPresetId = matchedPresetId || String(filteredItems[0]?.id || "");
}

function syncPreviewPresetSelectionForCurrentFilter() {
  const filteredItems = getFilteredPreviewPresetItems();
  const stillVisible = filteredItems.some(
    (item) => String(item.id) === String(previewPresetSelectedPresetId)
  );
  if (!stillVisible) {
    previewPresetSelectedPresetId = String(filteredItems[0]?.id || "");
  }
}

function renderPreviewPresetModuleModalUI() {
  renderPreviewPresetModuleFilterOptions();
  syncPreviewPresetSelectionForCurrentFilter();
  renderPreviewPresetModuleCards();
  renderPreviewPresetModuleSelectionPreview();
}

function openPreviewPresetModuleModal(moduleType, { context = null } = {}) {
  const normalizedType = moduleType === "corner" ? "corner" : "normal";
  previewPresetModuleType = normalizedType;
  previewPresetModuleContext =
    context && typeof context === "object"
      ? {
          mode:
            context.mode === "edit" ? "edit" : context.mode === "pick" ? "pick" : "add",
          edgeId: String(context.edgeId || ""),
          edgeType: context.edgeType === "corner" ? "corner" : "bay",
          returnFocusEl: context.returnFocusEl instanceof Element ? context.returnFocusEl : null,
          returnTo: String(context.returnTo || ""),
          initialPresetId: String(context.initialPresetId || ""),
          initialFilterKey: String(context.initialFilterKey || ""),
        }
      : {
          mode: "add",
          edgeId: "",
          edgeType: normalizedType === "corner" ? "corner" : "bay",
          returnFocusEl: activePreviewAddAnchorEl instanceof Element ? activePreviewAddAnchorEl : null,
          returnTo: "",
          initialPresetId: "",
          initialFilterKey: "",
        };
  const isEditMode = previewPresetModuleContext.mode === "edit";
  const moduleLabel = getPreviewAddPopoverModuleTypeLabel(normalizedType);
  const titleEl = $("#previewPresetModuleModalTitle");
  const descEl = $("#previewPresetModuleModalDesc");
  if (titleEl) {
    titleEl.textContent = `${moduleLabel} 모듈선택`;
  }
  if (descEl) {
    descEl.textContent = isEditMode
      ? `현재 ${moduleLabel}을(를) 미리 구성된 조합으로 변경합니다.`
      : `미리 구성된 ${moduleLabel} 조합을 선택하세요.`;
  }
  setPreviewPresetModuleError("");
  chooseDefaultPreviewPresetFilterAndSelection();
  renderPreviewPresetModuleModalUI();
  openModal("#previewPresetModuleModal", { focusTarget: "#previewPresetModuleModalTitle" });
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
  if (prevWidth !== nextWidth || prevCount !== nextCount || prevRodCount !== nextRodCount) {
    pushBuilderHistory("update-normal-preset");
  } else if (prevFurnitureAddonId !== nextFurnitureAddonId) {
    pushBuilderHistory("update-normal-preset");
  }
  shelf.width = nextWidth;
  shelf.count = nextCount;
  applyPresetAddonsToEdge(shelf.id, preset);
  closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
  renderBayInputs();
}

function applyPreviewPresetToExistingCorner(edgeId, preset) {
  const corner = findShelfById(edgeId);
  if (!corner || corner.type !== "corner") {
    setPreviewPresetModuleError("변경 대상 코너 모듈을 찾을 수 없습니다.");
    return;
  }
  const nextSwap = Boolean(preset?.swap);
  const nextCount = Math.max(1, Math.floor(Number(preset?.count || corner.count || 1)));
  const nextRodCount = Math.max(0, Math.floor(Number(preset?.rodCount || 0)));
  const prevSwap = Boolean(corner.swap);
  const prevCount = Number(corner.count || 0);
  const prevRodCount = getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID);
  const prevFurnitureAddonId = getSelectedFurnitureAddonId(corner.id);
  const nextFurnitureAddonId = String(getPresetFurnitureAddonIds(preset)[0] || "");
  if (prevSwap !== nextSwap || prevCount !== nextCount || prevRodCount !== nextRodCount) {
    pushBuilderHistory("update-corner-preset");
  } else if (prevFurnitureAddonId !== nextFurnitureAddonId) {
    pushBuilderHistory("update-corner-preset");
  }
  corner.swap = nextSwap;
  corner.count = nextCount;
  applyPresetAddonsToEdge(corner.id, preset);
  closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
  renderBayInputs();
}

function applyPreviewPresetNormalModule(preset, selectedFilterKey = "") {
  const endpointId = activePreviewAddTarget?.endpointId || "";
  const endpoint = endpointId ? previewOpenEndpoints.get(endpointId) : null;
  const source = endpoint || activePreviewAddTarget;
  if (!source) {
    setPreviewPresetModuleError("추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.");
    return;
  }
  const shelfId = addShelfFromEndpoint(source, activePreviewAddTarget);
  if (!shelfId) {
    setPreviewPresetModuleError("모듈을 추가하지 못했습니다. 다시 시도해주세요.");
    return;
  }
  const shelf = findShelfById(shelfId);
  if (shelf) {
    shelf.width = Math.max(
      1,
      Math.round(Number(selectedFilterKey || preset?.width || shelf.width || 400) || 400)
    );
    shelf.count = Math.max(1, Math.floor(Number(preset?.count || shelf.count || 1)));
    applyPresetAddonsToEdge(shelf.id, preset);
  }
  closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
  renderBayInputs();
}

function applyPreviewPresetCornerModule(preset) {
  const source = resolveActivePreviewAddSourceTarget(activePreviewAddTarget);
  if (!source) {
    setPreviewPresetModuleError("추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.");
    return;
  }
  if (isRootPreviewEndpointTarget(source) && !hasSelectedRootCornerStartDirection(activePreviewAddTarget)) {
    setPreviewPresetModuleError(getRootCornerDirectionRequiredMessage());
    return;
  }
  const cornerLimitState = getShapeCornerLimitState();
  if (!cornerLimitState.canAdd) {
    setPreviewPresetModuleError(getCornerLimitBlockedMessage(cornerLimitState));
    return;
  }
  if (!canAddCornerAtTarget(source, getSelectedShape())) {
    setPreviewPresetModuleError(getCornerAttachSideBlockedMessage(source, getSelectedShape()));
    return;
  }
  const placement = buildPlacementFromEndpoint(source);
  const dir = placement ? normalizeDirection(placement.dirDx, placement.dirDy) : { dx: 1, dy: 0 };
  const sideIndex = Number(
    source?.attachSideIndex ?? source?.sideIndex ?? directionToSideIndex(dir.dx, dir.dy)
  );
  const edge = {
    id: `corner-${sideIndex}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "corner",
    sideIndex,
    attachAtStart: Boolean(source?.attachAtStart),
    attachSideIndex: sideIndex,
    anchorEndpointId: String(source?.endpointId || ""),
    anchorDirDx: Number(normalizeDirection(source?.extendDx, source?.extendDy).dx),
    anchorDirDy: Number(normalizeDirection(source?.extendDx, source?.extendDy).dy),
    anchorInwardX: Number(normalizeDirection(source?.inwardX, source?.inwardY).dx),
    anchorInwardY: Number(normalizeDirection(source?.inwardX, source?.inwardY).dy),
    extendDx: Number(source?.extendDx || 0),
    extendDy: Number(source?.extendDy || 0),
    inwardX: Number(source?.inwardX || 0),
    inwardY: Number(source?.inwardY || 0),
    placement: placement || null,
    swap: Boolean(preset?.swap),
    count: Math.max(1, Math.floor(Number(preset?.count || 1))),
    createdAt: Date.now(),
  };
  pushBuilderHistory("add-corner-preset");
  registerEdge(edge);
  applyPresetAddonsToEdge(edge.id, preset);
  closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
  renderBayInputs();
}

function handlePreviewPresetModuleCardClick(buttonEl) {
  if (!(buttonEl instanceof Element)) return;
  const presetId = String(buttonEl.dataset.previewPresetId || "");
  const type = String(buttonEl.dataset.previewPresetType || previewPresetModuleType || "normal");
  const presetContext =
    previewPresetModuleContext && typeof previewPresetModuleContext === "object"
      ? previewPresetModuleContext
      : null;
  if ((type === "corner" ? "corner" : "normal") !== previewPresetModuleType) {
    previewPresetModuleType = type === "corner" ? "corner" : "normal";
  }
  const items = getFilteredPreviewPresetItems();
  const hasPreset = items.some((item) => String(item.id) === presetId);
  if (!hasPreset) {
    setPreviewPresetModuleError("선택한 모듈을 찾을 수 없습니다.");
    return;
  }
  setPreviewPresetModuleError("");
  previewPresetSelectedPresetId = presetId;
  if (presetContext?.mode === "pick" && presetContext?.returnTo === "preset-module-option") {
    applySelectedPreviewPresetModule();
    return;
  }
  renderPreviewPresetModuleCards();
  renderPreviewPresetModuleSelectionPreview();
}

function handlePreviewPresetModuleFilterSelect(filterKey) {
  previewPresetModuleFilterKey = String(filterKey || "");
  setPreviewPresetModuleError("");
  renderPreviewPresetModuleModalUI();
}

function applyPreviewPresetByContext(
  preset,
  presetContext,
  type = previewPresetModuleType,
  selectedFilterKey = previewPresetModuleFilterKey
) {
  const normalizedType = type === "corner" ? "corner" : "normal";
  const context = presetContext && typeof presetContext === "object" ? presetContext : null;
  if (context?.mode === "edit" && context.edgeId) {
    if (context.edgeType === "corner") {
      applyPreviewPresetToExistingCorner(context.edgeId, preset);
      return;
    }
    applyPreviewPresetToExistingBay(context.edgeId, preset, selectedFilterKey);
    return;
  }
  if (normalizedType === "corner") {
    applyPreviewPresetCornerModule(preset);
    return;
  }
  applyPreviewPresetNormalModule(preset, selectedFilterKey);
}

function applySelectedPreviewPresetModule() {
  const preset = getPreviewPresetSelectedPreset();
  if (!preset) {
    setPreviewPresetModuleError("먼저 적용할 모듈 구성을 선택해주세요.");
    return;
  }
  setPreviewPresetModuleError("");
  const presetContext =
    previewPresetModuleContext && typeof previewPresetModuleContext === "object"
      ? previewPresetModuleContext
      : null;
  if (presetContext?.mode === "pick" && presetContext?.returnTo === "preset-module-option") {
    presetModuleOptionDraft = {
      moduleType: previewPresetModuleType === "corner" ? "corner" : "normal",
      presetId: String(preset.id || ""),
      filterKey: String(previewPresetModuleFilterKey || ""),
    };
    closePreviewPresetModuleModal({ returnFocus: false, clearTarget: false });
    return;
  }
  applyPreviewPresetByContext(preset, presetContext, previewPresetModuleType, previewPresetModuleFilterKey);
}

function savePresetModuleOptionModal() {
  const modalState = presetModuleOptionModalState;
  const preset = getPresetModuleOptionSelectedPreset();
  if (!modalState) return;
  if (!preset) {
    setPresetModuleOptionError("먼저 모듈을 선택해주세요.");
    return;
  }
  setPresetModuleOptionError("");
  const applyContext =
    modalState.mode === "edit"
      ? {
          mode: "edit",
          edgeId: String(modalState.edgeId || ""),
          edgeType: modalState.edgeType === "corner" ? "corner" : "bay",
          returnFocusEl: modalState.returnFocusEl instanceof Element ? modalState.returnFocusEl : null,
          returnTo: "",
          initialPresetId: "",
          initialFilterKey: "",
        }
      : {
          mode: "add",
          edgeId: "",
          edgeType: modalState.moduleType === "corner" ? "corner" : "bay",
          returnFocusEl: modalState.returnFocusEl instanceof Element ? modalState.returnFocusEl : null,
          returnTo: "",
          initialPresetId: "",
          initialFilterKey: "",
        };

  if (modalState.mode === "add") {
    activePreviewAddTarget = clonePreviewAddTargetSnapshot(modalState.addTarget);
    activePreviewAddAnchorEl = modalState.returnFocusEl instanceof Element ? modalState.returnFocusEl : null;
    if (!activePreviewAddTarget) {
      setPresetModuleOptionError("추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.");
      return;
    }
  }

  closePresetModuleOptionModal({ returnFocus: false, clearState: true });
  previewPresetModuleType = modalState.moduleType === "corner" ? "corner" : "normal";
  previewPresetModuleContext = applyContext;
  applyPreviewPresetByContext(
    preset,
    applyContext,
    previewPresetModuleType,
    String(presetModuleOptionDraft?.filterKey || "")
  );
}

function isPreviewAddTypePopoverOpen() {
  const { popover } = getPreviewAddTypePopoverElements();
  return Boolean(popover && !popover.classList.contains("hidden"));
}

function positionPreviewAddTypePopover(anchorEl = activePreviewAddAnchorEl) {
  const { popover } = getPreviewAddTypePopoverElements();
  if (!popover || popover.classList.contains("hidden")) return;
  if (!(anchorEl instanceof Element) || !anchorEl.isConnected) return;

  const rect = anchorEl.getBoundingClientRect();
  const margin = 8;
  const viewportPadding = 8;
  const popoverWidth = popover.offsetWidth || 300;
  const popoverHeight = popover.offsetHeight || 180;
  let left = rect.left + rect.width / 2 - popoverWidth / 2;
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverWidth - viewportPadding));
  let top = rect.bottom + margin;
  if (top + popoverHeight > window.innerHeight - viewportPadding) {
    top = Math.max(viewportPadding, rect.top - popoverHeight - margin);
  }
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function closePreviewAddTypePicker({ returnFocus = false, clearTarget = true } = {}) {
  const { popover } = getPreviewAddTypePopoverElements();
  if (popover) {
    popover.classList.add("hidden");
    popover.setAttribute("aria-hidden", "true");
  }
  setPreviewAddTypePopoverStep("type", "");
  closeModal("#previewAddTypeModal");
  setPreviewAddTypeErrorMessage("", { isError: false });
  if (returnFocus && activePreviewAddAnchorEl instanceof Element && activePreviewAddAnchorEl.isConnected) {
    activePreviewAddAnchorEl.focus();
  }
  if (clearTarget) {
    activePreviewAddTarget = null;
    activePreviewAddAnchorEl = null;
  }
}

function bindPreviewAddTypePopoverDismissEvents() {
  if (document.body.dataset.previewAddPopoverBound === "true") return;
  document.body.dataset.previewAddPopoverBound = "true";

  document.addEventListener("pointerdown", (e) => {
    if (!isPreviewAddTypePopoverOpen()) return;
    const { popover } = getPreviewAddTypePopoverElements();
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (popover?.contains(target)) return;
    if (activePreviewAddAnchorEl instanceof Element && activePreviewAddAnchorEl.contains(target)) return;
    closePreviewAddTypePicker();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!isPreviewAddTypePopoverOpen()) return;
    e.preventDefault();
    closePreviewAddTypePicker({ returnFocus: true });
  });

  window.addEventListener("resize", () => positionPreviewAddTypePopover());
  window.addEventListener(
    "scroll",
    () => {
      if (!isPreviewAddTypePopoverOpen()) return;
      positionPreviewAddTypePopover();
    },
    true
  );
}

function bindPendingOptionModalCleanupOnClose() {
  if (document.body.dataset.pendingOptionModalCleanupBound === "true") return;
  document.body.dataset.pendingOptionModalCleanupBound = "true";
  document.addEventListener("app:modal-closed", (event) => {
    if (builderHistory.applying) return;
    const modalId = String(event?.detail?.modalId || event?.target?.id || "");
    if (modalId === "bayOptionModal") {
      const edge = activeBayOptionId ? findShelfById(activeBayOptionId) : null;
      if (discardPendingEdge(edge)) {
        bayOptionModalDraft = null;
        activeBayOptionId = null;
        renderBayInputs();
      }
      return;
    }
    if (modalId === "cornerOptionModal") {
      const edge = activeCornerOptionId ? findShelfById(activeCornerOptionId) : null;
      if (discardPendingEdge(edge)) {
        cornerOptionModalDraft = null;
        activeCornerOptionId = null;
        renderBayInputs();
      }
    }
  });
}

function setPreviewModuleActionPopoverError(message = "", { isError = false } = {}) {
  const errorEl = $("#previewModuleActionPopoverError");
  if (!errorEl) return;
  errorEl.textContent = String(message || "");
  errorEl.classList.toggle("error", Boolean(isError && message));
}

function getPreviewModuleActionPopoverElements() {
  return {
    popover: $("#previewModuleActionPopover"),
    titleEl: $("#previewModuleActionPopoverTitle"),
    descEl: $("#previewModuleActionPopoverDesc"),
    selectedTypeEl: $("#previewModuleActionPopoverSelectedType"),
    presetBtn: $("#previewModuleActionPresetBtn"),
    customBtn: $("#previewModuleActionCustomBtn"),
    removeBtn: $("#previewModuleActionRemoveBtn"),
  };
}

function isPreviewModuleActionPopoverOpen() {
  const { popover } = getPreviewModuleActionPopoverElements();
  return Boolean(popover && !popover.classList.contains("hidden"));
}

function positionPreviewModuleActionPopover(anchorEl = activePreviewModuleActionAnchorEl) {
  const { popover } = getPreviewModuleActionPopoverElements();
  if (!popover || popover.classList.contains("hidden")) return;
  if (!(anchorEl instanceof Element) || !anchorEl.isConnected) return;

  const rect = anchorEl.getBoundingClientRect();
  const margin = 8;
  const viewportPadding = 8;
  const popoverWidth = popover.offsetWidth || 300;
  const popoverHeight = popover.offsetHeight || 180;
  let left = rect.left + rect.width / 2 - popoverWidth / 2;
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - popoverWidth - viewportPadding));
  let top = rect.bottom + margin;
  if (top + popoverHeight > window.innerHeight - viewportPadding) {
    top = Math.max(viewportPadding, rect.top - popoverHeight - margin);
  }
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function closePreviewModuleActionPopover({ returnFocus = false, clearTarget = true } = {}) {
  const { popover } = getPreviewModuleActionPopoverElements();
  if (popover) {
    popover.classList.add("hidden");
    popover.setAttribute("aria-hidden", "true");
  }
  setPreviewModuleActionPopoverError("", { isError: false });
  if (
    returnFocus &&
    activePreviewModuleActionAnchorEl instanceof Element &&
    activePreviewModuleActionAnchorEl.isConnected
  ) {
    activePreviewModuleActionAnchorEl.focus();
  }
  if (clearTarget) {
    activePreviewModuleActionTarget = null;
    activePreviewModuleActionAnchorEl = null;
  }
}

function bindPreviewModuleActionPopoverDismissEvents() {
  if (document.body.dataset.previewModuleActionPopoverBound === "true") return;
  document.body.dataset.previewModuleActionPopoverBound = "true";

  document.addEventListener("pointerdown", (e) => {
    if (!isPreviewModuleActionPopoverOpen()) return;
    const { popover } = getPreviewModuleActionPopoverElements();
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (popover?.contains(target)) return;
    if (activePreviewModuleActionAnchorEl instanceof Element && activePreviewModuleActionAnchorEl.contains(target)) {
      return;
    }
    closePreviewModuleActionPopover();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!isPreviewModuleActionPopoverOpen()) return;
    e.preventDefault();
    closePreviewModuleActionPopover({ returnFocus: true });
  });

  window.addEventListener("resize", () => positionPreviewModuleActionPopover());
  window.addEventListener(
    "scroll",
    () => {
      if (!isPreviewModuleActionPopoverOpen()) return;
      positionPreviewModuleActionPopover();
    },
    true
  );
}

function openPreviewModuleActionPopover(edgeId, edgeType = "bay", anchorEl = null) {
  const targetId = String(edgeId || "");
  const edge = targetId ? findShelfById(targetId) : null;
  if (!edge) return;
  const normalizedEdgeType = edge.type === "corner" || edgeType === "corner" ? "corner" : "bay";
  activePreviewModuleActionTarget = {
    edgeId: targetId,
    edgeType: normalizedEdgeType,
  };
  activePreviewModuleActionAnchorEl = anchorEl instanceof Element ? anchorEl : null;

  const { popover, titleEl, descEl, selectedTypeEl, presetBtn, customBtn, removeBtn } =
    getPreviewModuleActionPopoverElements();
  if (!popover) {
    if (normalizedEdgeType === "corner") openCornerOptionModal(targetId);
    else openBayOptionModal(targetId);
    return;
  }

  const typeLabel = normalizedEdgeType === "corner" ? "코너 모듈" : "일반 모듈";
  if (titleEl) titleEl.textContent = "모듈 작업";
  if (descEl) descEl.textContent = "선택한 모듈에 적용할 작업을 선택하세요.";
  if (selectedTypeEl) selectedTypeEl.textContent = `선택 대상: ${typeLabel}`;
  [presetBtn, customBtn, removeBtn].forEach((btn) => {
    if (!btn) return;
    btn.disabled = false;
  });
  setPreviewModuleActionPopoverError("", { isError: false });

  closePreviewAddTypePicker();
  popover.classList.remove("hidden");
  popover.setAttribute("aria-hidden", "false");
  positionPreviewModuleActionPopover(activePreviewModuleActionAnchorEl);
  requestAnimationFrame(() => positionPreviewModuleActionPopover(activePreviewModuleActionAnchorEl));
  requestAnimationFrame(() => {
    if (presetBtn && !presetBtn.disabled) {
      presetBtn.focus();
      return;
    }
    if (customBtn && !customBtn.disabled) {
      customBtn.focus();
      return;
    }
    titleEl?.focus();
  });
}

function handlePreviewModuleActionPresetSelect() {
  const target = activePreviewModuleActionTarget;
  if (!target?.edgeId) return;
  const moduleType = target.edgeType === "corner" ? "corner" : "normal";
  const focusEl = activePreviewModuleActionAnchorEl instanceof Element ? activePreviewModuleActionAnchorEl : null;
  closePreviewModuleActionPopover();
  openPresetModuleOptionModal(moduleType, {
    mode: "edit",
    edgeId: target.edgeId,
    returnFocusEl: focusEl,
  });
}

function handlePreviewModuleActionCustomCompose() {
  const target = activePreviewModuleActionTarget;
  if (!target?.edgeId) return;
  const edgeId = String(target.edgeId);
  const edgeType = target.edgeType === "corner" ? "corner" : "bay";
  closePreviewModuleActionPopover();
  if (edgeType === "corner") {
    openCornerOptionModal(edgeId);
    return;
  }
  openBayOptionModal(edgeId);
}

function handlePreviewModuleActionRemove() {
  const target = activePreviewModuleActionTarget;
  if (!target?.edgeId) return;
  const edgeId = String(target.edgeId);
  const edgeType = target.edgeType === "corner" ? "corner" : "bay";
  closePreviewModuleActionPopover();
  if (edgeType === "corner") {
    removeCornerById(edgeId);
    return;
  }
  removeBayById(edgeId);
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
      if (!anchorId || anchorId === "root-endpoint") {
        ordered.push(edge);
        remaining.delete(id);
        placed.add(id);
        progressed = true;
        return;
      }
      const match = anchorId.match(/^(.+):(start|end)$/);
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

function applyPresetAddonsToEdge(edgeId, preset) {
  if (!edgeId) return;
  const rodCount = Math.max(0, Math.floor(Number(preset?.rodCount || 0)));
  const furnitureAddonIds = getPresetFurnitureAddonIds(preset);
  const targetFurnitureId = String(furnitureAddonIds[0] || "");
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
  return SYSTEM_ADDON_ITEMS.filter((item) => item.selectableInModuleAddonModal !== false).sort((a, b) => {
    const aCategoryOrder = categoryOrderMap.get(String(a?.categoryKey || "")) ?? 999;
    const bCategoryOrder = categoryOrderMap.get(String(b?.categoryKey || "")) ?? 999;
    if (aCategoryOrder !== bCategoryOrder) return aCategoryOrder - bCategoryOrder;
    const aOrder = Number(a?.sortOrder || 0);
    const bOrder = Number(b?.sortOrder || 0);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a?.name || "").localeCompare(String(b?.name || ""), "ko");
  });
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

function calcAddonCostBreakdown(addonIds = [], quantity = 1) {
  const qtyMultiplier = Math.max(1, Math.floor(Number(quantity || 1)));
  return (Array.isArray(addonIds) ? addonIds : []).reduce(
    (acc, addonId) => {
      const addon = SYSTEM_ADDON_ITEMS.find((item) => item.id === addonId);
      const price = Number(addon?.price || 0) * qtyMultiplier;
      if (String(addonId || "") === ADDON_CLOTHES_ROD_ID) {
        acc.componentCost += price;
      } else {
        acc.furnitureCost += price;
      }
      return acc;
    },
    { componentCost: 0, furnitureCost: 0 }
  );
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
  const rows = sortAddonEntriesWithRodFirst(Object.entries(quantities))
    .map(([addonId, qty]) => {
      if (addonId === ADDON_CLOTHES_ROD_ID) return "";
      const addon = SYSTEM_ADDON_ITEMS.find((item) => item.id === addonId);
      const count = Math.max(0, Math.floor(Number(qty || 0)));
      if (!addon || count < 1) return "";
      const name = `${addon.name}${count > 1 ? ` x${count}` : ""}`;
      const totalPrice = (addon.price || 0) * count;
      return `
        <div class="addon-chip">
          <div class="material-visual" style="background:#ddd;"></div>
          <div class="info">
            <div class="name">${escapeHtml(name)}</div>
            <div class="meta">${totalPrice.toLocaleString()}원</div>
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
  if (!active) return;
  const targetId = String(edgeId || "");
  if (!targetId) return;
  const target = Array.from(
    container.querySelectorAll("[data-bay-preview], [data-corner-preview]")
  ).find(
    (el) =>
      String(el?.dataset?.bayPreview || "") === targetId ||
      String(el?.dataset?.cornerPreview || "") === targetId
  );
  if (target) target.classList.add("is-edge-hovered");
}

function renderBuilderStructure() {
  const listEl = $("#builderEdgeList");
  if (!listEl) return;
  const rows = [];
  const edges = getPreviewOrderedEdges(getOrderedGraphEdges());
  edges.forEach((edge, idx) => {
    const placement = edge.placement;
    const dir = hasValidPlacement(placement)
      ? normalizeDirection(placement.dirDx, placement.dirDy)
      : { dx: 1, dy: 0 };
    const sideIndex = directionToSideIndex(dir.dx, dir.dy);
    const isCorner = edge.type === "corner";
    const addonText = formatAddonCompactBreakdown(getShelfAddonIds(edge.id));
    const widthText = isCorner
      ? `${getCornerSizeAlongSide(sideIndex, edge.swap)} × ${getCornerSizeAlongSide(
          directionToSideIndex(-dir.dy, dir.dx),
          edge.swap
        )}mm`
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
  const exists = list.find((it) => {
    const dx = Math.abs((it.x || 0) - (entry.x || 0));
    const dy = Math.abs((it.y || 0) - (entry.y || 0));
    return dx < threshold && dy < threshold;
  });
  if (exists) {
    exists.inwardX = Number(exists.inwardX || 0) + Number(entry.inwardX || 0);
    exists.inwardY = Number(exists.inwardY || 0) + Number(entry.inwardY || 0);
    exists.count = Number(exists.count || 1) + 1;
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
  return {
    startX: centerX + dirDx * (COLUMN_WIDTH_MM / 2),
    startY: centerY + dirDy * (COLUMN_WIDTH_MM / 2),
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

function readBayInputs() {
  return getOrderedGraphEdges().map((edge) => {
    const isCorner = edge.type === "corner";
    const dir = hasValidPlacement(edge.placement)
      ? normalizeDirection(edge.placement.dirDx, edge.placement.dirDy)
      : { dx: 1, dy: 0 };
    const sideIndex = directionToSideIndex(dir.dx, dir.dy);
    return {
      id: edge.id,
      width: isCorner ? getCornerSizeAlongSide(sideIndex, edge.swap) : edge.width || 0,
      count: edge.count || 1,
      addons: getShelfAddonIds(edge.id),
      isCorner,
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

  if (!input.column.materialId) return "기둥 컬러를 선택해주세요.";
  if (!input.shelf.materialId) return "선반 컬러를 선택해주세요.";

  const shelfLimits = LIMITS.shelf;
  for (let i = 0; i < bays.length; i += 1) {
    const bay = bays[i];
    if (!bay.width) return `선반 폭을 입력해주세요.`;
    if (!bay.count || bay.count < 1) return `선반 갯수를 입력해주세요.`;
    if (!bay.isCorner && (bay.width < BAY_WIDTH_LIMITS.min || bay.width > BAY_WIDTH_LIMITS.max)) {
      return `폭은 ${BAY_WIDTH_LIMITS.min}~${BAY_WIDTH_LIMITS.max}mm 범위 내로 입력해주세요.`;
    }
  }
  if (SHELF_LENGTH_MM > shelfLimits.maxLength) {
    return `선반 길이는 ${shelfLimits.maxLength}mm 이하입니다.`;
  }

  if (!shelfMat?.availableThickness?.includes(input.shelf.thickness)) {
    return `선택한 선반 컬러는 ${shelfMat.availableThickness.join(", ")}T만 가능합니다.`;
  }
  if (!columnMat?.availableThickness?.includes(input.column.thickness)) {
    return `선택한 기둥 컬러는 ${columnMat.availableThickness.join(", ")}T만 가능합니다.`;
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
    extraMsg = "창문, 커튼박스 등으로 동일 높이 설치가 어려운 경우에는 구간별 개별 높이 기둥을 추가해 주세요.";
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
      !bay.isCorner && bay.width && (bay.width < BAY_WIDTH_LIMITS.min || bay.width > BAY_WIDTH_LIMITS.max)
        ? `폭은 ${BAY_WIDTH_LIMITS.min}~${BAY_WIDTH_LIMITS.max}mm 범위 내로 입력해주세요.`
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
          <input type="number" data-space-extra-height="${spaceIndex}" placeholder="개별높이 (1800mm 이상)" value="${Number(value)}" />
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
  if (!input?.column?.materialId) return "기둥 컬러를 먼저 선택해주세요.";
  if (!input?.shelf?.materialId) return "선반 컬러를 먼저 선택해주세요.";
  const layoutValidation = evaluateLayoutValidationState(getLayoutConfigSnapshot(input));
  if (layoutValidation.status === "invalid") {
    return layoutValidation.messages[0] || "레이아웃 섹션 입력값을 확인해주세요.";
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
  if (!input?.column?.materialId) return "기둥 컬러를 선택해주세요.";
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
  return `탑뷰 · ${layoutText} · 선반 ${shelfMat?.name || "-"} · 기둥 ${columnMat?.name || "-"} · 천장 ${heightText}${extraText}`;
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
    return;
  }
  btn.disabled = true;
  btn.classList.add("is-disabled");
  btn.classList.add("btn-disabled");
  if (!reason) {
    delete btn.dataset.disabledReason;
    btn.removeAttribute("aria-disabled");
    return;
  }
  btn.dataset.disabledReason = reason;
  btn.setAttribute("aria-disabled", "true");
}

function setPreviewRenderTransform(next) {
  previewRenderTransform = {
    scale: Number(next?.scale || 1),
    tx: Number(next?.tx || 0),
    ty: Number(next?.ty || 0),
    depthMm: Number(next?.depthMm || 400),
  };
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

function bindAddButtonPreviewInteractions(btn, endpoint, canAddFromPreview) {
  if (!btn || !endpoint) return;
  const allowedTypes = Array.isArray(endpoint.allowedTypes)
    ? endpoint.allowedTypes
    : ["normal", "corner"];
  btn.dataset.allowedTypes = allowedTypes.join(",");
  const preferredType =
    allowedTypes.includes("normal") || !allowedTypes.length ? "normal" : allowedTypes[0];
  const show = () => {
    if (!canAddFromPreview || btn.disabled) return;
    showPreviewGhostForEndpoint(endpoint, preferredType);
  };
  const hide = () => clearPreviewGhost();
  btn.addEventListener("mouseenter", show);
  btn.addEventListener("focus", show);
  btn.addEventListener("mouseleave", hide);
  btn.addEventListener("blur", hide);
}

function cloneBuilderStateSnapshot() {
  const graphClone = state.graph ? JSON.parse(JSON.stringify(state.graph)) : null;
  const addonClone = state.shelfAddons ? JSON.parse(JSON.stringify(state.shelfAddons)) : {};
  if (graphClone?.edges && typeof graphClone.edges === "object") {
    Object.keys(graphClone.edges).forEach((edgeId) => {
      const edge = graphClone.edges[edgeId];
      if (edge?.pendingAdd) {
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
    closeModal("#bayOptionModal");
    closeModal("#cornerOptionModal");
    closeModal("#presetModuleOptionModal");
    closePreviewAddTypePicker();
    closePreviewModuleActionPopover();
    closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
    activePreviewAddTarget = null;
    activePreviewAddAnchorEl = null;
    presetModuleOptionModalState = null;
    presetModuleOptionDraft = null;
    activePreviewModuleActionTarget = null;
    activePreviewModuleActionAnchorEl = null;
    activeCornerOptionId = null;
    activeBayOptionId = null;
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
    const startCenterX = px + drawDir.dx * (-COLUMN_WIDTH_MM / 2);
    const startCenterY = py + drawDir.dy * (-COLUMN_WIDTH_MM / 2);
    const endCenterX = px + drawDir.dx * (widthMm + COLUMN_WIDTH_MM / 2);
    const endCenterY = py + drawDir.dy * (widthMm + COLUMN_WIDTH_MM / 2);
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

  const primarySideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);
  const primaryNominal = getCornerSizeAlongSide(primarySideIndex, Boolean(edge.swap));
  const primaryLen = primaryNominal + SUPPORT_VISIBLE_MM * 2;
  const secondDir = { dx: drawInward.x, dy: drawInward.y };
  const secondSideIndex = directionToSideIndex(secondDir.dx, secondDir.dy);
  const secondaryNominal = getCornerSizeAlongSide(secondSideIndex, Boolean(edge.swap));
  const secondLen = secondaryNominal + SUPPORT_VISIBLE_MM * 2;
  const secondInward = { x: -drawDir.dx, y: -drawDir.dy };
  const secondStartX = px + drawDir.dx * primaryLen;
  const secondStartY = py + drawDir.dy * primaryLen;
  const startCenterX = px + drawDir.dx * (-COLUMN_WIDTH_MM / 2);
  const startCenterY = py + drawDir.dy * (-COLUMN_WIDTH_MM / 2);
  const secondEndCenterX = secondStartX + secondDir.dx * (secondLen + COLUMN_WIDTH_MM / 2);
  const secondEndCenterY = secondStartY + secondDir.dy * (secondLen + COLUMN_WIDTH_MM / 2);

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

function resolveAnchorForDirection(anchorId, preferredDir = null) {
  const raw = String(anchorId || "");
  if (!raw || raw === "root-endpoint") return "root-endpoint";
  const edges = getOrderedGraphEdges();
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
  const edges = getOrderedGraphEdges();
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
    const normalizedAnchor = resolveAnchorForDirection(currentAnchor, preferredDir);
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
    const columnSet = columnMarksByHint?.[edgeHint];
    const columnCount =
      columnSet && typeof columnSet.size === "number" ? Number(columnSet.size || 0) : 0;
    const totalMm = shelfTotalMm + columnCount * COLUMN_WIDTH_MM;
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
      label: section.label || `섹션${idx + 1}`,
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
    const used = Math.round(Math.max(COLUMN_WIDTH_MM, Number(run.totalMm || 0)));
    const targetLength = Number(targetSections[idx]?.lengthMm || 0);
    if (targetLength > 0) {
      segments.push(`섹션${idx + 1} ${used}/${targetLength}mm`);
      return;
    }
    segments.push(`섹션${idx + 1} ${used}mm`);
  });
  if (!segments.length) {
    widthSummaryEl.textContent = "적용 너비 합계: -";
    return;
  }
  widthSummaryEl.textContent = `사용/전체(기둥 포함): ${segments.join(" | ")}`;
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

function calcPartDetail({
  materials,
  materialId,
  thickness,
  width,
  length,
  quantity,
  partMultiplier = 1,
  isCustom,
}) {
  const material = materials[materialId];
  const partQuantity = (quantity || 1) * partMultiplier;
  const areaM2 = (width / 1000) * (length / 1000);
  const pricePerM2 = getPricePerM2(material, thickness);
  const thicknessM = thickness / 1000;
  const volumeM3 = areaM2 * thicknessM * partQuantity;
  const weightKg = volumeM3 * (material?.density || 0);
  const materialCost = areaM2 * pricePerM2 * partQuantity;
  return {
    areaM2,
    materialCost: isCustom ? 0 : materialCost,
    weightKg,
    isCustomPrice: isCustom,
  };
}

function isShelfCustom(width, customFlag) {
  return (
    customFlag ||
    width > LIMITS.shelf.maxWidth ||
    SHELF_LENGTH_MM > LIMITS.shelf.maxLength
  );
}

function isColumnCustom(length) {
  return length > LIMITS.column.maxLength;
}

function countCornerPostBars(bays = []) {
  return (Array.isArray(bays) ? bays : []).reduce(
    (count, bay) => count + (bay?.isCorner ? 1 : 0),
    0
  );
}

function getPostBarPricingConfig(kind = "basic") {
  return kind === "corner" ? SYSTEM_POST_BAR_PRICING.corner : SYSTEM_POST_BAR_PRICING.basic;
}

function getPostBarTier(kind, heightMm) {
  const config = getPostBarPricingConfig(kind);
  const height = Math.max(0, Math.round(Number(heightMm || 0)));
  const tiers = Array.isArray(config?.tiers) ? config.tiers : [];
  return tiers.find((tier) => height > 0 && height <= Number(tier?.maxHeightMm || 0)) || null;
}

function calcLegacyPostBarUnitCost({ column, heightMm }) {
  const lengthMm = Math.max(0, Math.round(Number(heightMm || 0)));
  if (!column?.materialId || !lengthMm) return 0;
  const detail = calcPartDetail({
    materials: SYSTEM_COLUMN_MATERIALS,
    materialId: column.materialId,
    thickness: column.thickness,
    width: column.width,
    length: lengthMm,
    quantity: 1,
    partMultiplier: 1,
    isCustom: false,
  });
  return Math.round(Number(detail.materialCost || 0));
}

function getPostBarTierUnitPrice(kind, column, heightMm) {
  const tier = getPostBarTier(kind, heightMm);
  if (tier && Number(tier.unitPrice || 0) > 0) {
    return {
      tier,
      unitPrice: Math.round(Number(tier.unitPrice || 0)),
      usesLegacyFallback: false,
    };
  }
  return {
    tier,
    unitPrice: calcLegacyPostBarUnitCost({ column, heightMm }),
    usesLegacyFallback: true,
  };
}

function resolveCornerPostBarHeightMm({ column }) {
  // 코너 포스트바 높이는 내부 규칙으로 적용되며 고객에게 별도 노출하지 않는다.
  // 현재는 기둥 최대 높이를 기준으로 계산하고, 추후 현장조건 규칙이 정해지면 이 함수에서만 교체한다.
  return Math.max(
    0,
    Math.round(Number(column?.maxLength || column?.length || column?.minLength || 0))
  );
}

function calcBayDetail({ shelf, addons = [], quantity }) {
  const shelfIsCustom = isShelfCustom(shelf.width, shelf.customProcessing);
  const shelfDetail = calcPartDetail({
    materials: SYSTEM_SHELF_MATERIALS,
    materialId: shelf.materialId,
    thickness: shelf.thickness,
    width: shelf.width,
    length: shelf.length,
    quantity,
    partMultiplier: shelf.count || 1,
    isCustom: shelfIsCustom,
  });
  const addonTotal = addons.reduce((sum, id) => {
    const addon = SYSTEM_ADDON_ITEMS.find((item) => item.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const processingCost = addonTotal * quantity;
  const materialCost = shelfDetail.materialCost;
  const subtotal = materialCost + processingCost;
  const vat = 0;
  const total = Math.round(subtotal);
  const weightKg = shelfDetail.weightKg;
  const isCustomPrice = shelfIsCustom;

  return {
    materialCost,
    processingCost,
    subtotal,
    vat,
    total,
    weightKg,
    isCustomPrice,
  };
}

function calcColumnsDetail({ column, count, quantity, bays = [] }) {
  const unitQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
  const basePostCount = Math.max(0, Math.floor(Number(count || 0)));
  const cornerPostCount = countCornerPostBars(bays);
  const baseHeightMm = Math.max(0, Math.round(Number(column?.length || column?.maxLength || 0)));
  const cornerHeightMm = resolveCornerPostBarHeightMm({ column, bays });

  const basePricing = getPostBarTierUnitPrice("basic", column, baseHeightMm);
  const cornerPricing = getPostBarTierUnitPrice("corner", column, cornerHeightMm);
  const baseTier = basePricing.tier;
  const cornerTier = cornerPricing.tier;

  const baseIsCustom = basePostCount > 0 && (!baseTier || isColumnCustom(baseHeightMm));
  const cornerIsCustom = cornerPostCount > 0 && (!cornerTier || isColumnCustom(cornerHeightMm));
  const isCustomPrice = baseIsCustom || cornerIsCustom;

  const baseTotalCost = isCustomPrice ? 0 : basePricing.unitPrice * basePostCount * unitQuantity;
  const cornerTotalCost = isCustomPrice ? 0 : cornerPricing.unitPrice * cornerPostCount * unitQuantity;
  const materialCost = Math.round(baseTotalCost + cornerTotalCost);
  const processingCost = 0;
  const subtotal = materialCost + processingCost;
  const vat = 0;
  const total = Math.round(subtotal);

  const baseWeightDetail =
    basePostCount > 0
      ? calcPartDetail({
          materials: SYSTEM_COLUMN_MATERIALS,
          materialId: column.materialId,
          thickness: column.thickness,
          width: column.width,
          length: Math.max(0, baseHeightMm),
          quantity: unitQuantity,
          partMultiplier: basePostCount,
          isCustom: false,
        })
      : { weightKg: 0 };
  const cornerWeightDetail =
    cornerPostCount > 0
      ? calcPartDetail({
          materials: SYSTEM_COLUMN_MATERIALS,
          materialId: column.materialId,
          thickness: column.thickness,
          width: column.width,
          length: Math.max(0, cornerHeightMm || baseHeightMm),
          quantity: unitQuantity,
          partMultiplier: cornerPostCount,
          isCustom: false,
        })
      : { weightKg: 0 };
  const weightKg = Number(baseWeightDetail.weightKg || 0) + Number(cornerWeightDetail.weightKg || 0);

  return {
    materialCost,
    processingCost,
    subtotal,
    vat,
    total,
    weightKg,
    isCustomPrice,
    basePostBar: {
      kind: "basic",
      label: getPostBarPricingConfig("basic")?.label || "기본 포스트바",
      count: basePostCount,
      heightMm: baseHeightMm,
      tierKey: String(baseTier?.key || ""),
      tierLabel: String(baseTier?.label || ""),
      unitPrice: Math.round(Number(basePricing.unitPrice || 0)),
      totalCost: Math.round(baseTotalCost),
      usesLegacyFallback: Boolean(basePricing.usesLegacyFallback),
    },
    cornerPostBar: {
      kind: "corner",
      label: getPostBarPricingConfig("corner")?.label || "코너 포스트바",
      count: cornerPostCount,
      heightMm: cornerHeightMm,
      tierKey: String(cornerTier?.key || ""),
      tierLabel: String(cornerTier?.label || ""),
      unitPrice: Math.round(Number(cornerPricing.unitPrice || 0)),
      totalCost: Math.round(cornerTotalCost),
      usesLegacyFallback: Boolean(cornerPricing.usesLegacyFallback),
    },
  };
}

function calcOrderSummary(items) {
  const materialsTotal = items.reduce((s, i) => s + i.materialCost, 0);
  const processingTotal = items.reduce((s, i) => s + i.processingCost, 0);
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const vat = 0;
  const totalWeight = items.reduce((s, i) => s + i.weightKg, 0);
  const shippingCost = calcShippingCost(totalWeight);
  const grandTotal = subtotal + shippingCost;

  return {
    materialsTotal,
    processingTotal,
    subtotal,
    vat,
    totalWeight,
    shippingCost,
    grandTotal,
  };
}

function updatePreview() {
  const input = readCurrentInputs();
  const shelfMat = SYSTEM_SHELF_MATERIALS[input.shelf.materialId];
  const columnMat = SYSTEM_COLUMN_MATERIALS[input.column.materialId];
  const frame = $("#systemPreviewFrame");
  const shelvesEl = $("#systemPreviewShelves");
  const textEl = $("#systemPreviewText");
  if (!frame || !shelvesEl || !textEl) return;
  const frameRect = frame.getBoundingClientRect();
  const frameW = frameRect.width || 260;
  const frameH = frameRect.height || 220;
  const shortSide = Math.min(frameW, frameH);
  const uiScale = Math.max(0.8, Math.min(1.15, shortSide / 520));
  const addBtnSize = Math.round(26 * uiScale);
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

  const bays = readBayInputs();
  const edges = getPreviewOrderedEdges(getOrderedGraphEdges());
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
    top: new Set(),
    right: new Set(),
    bottom: new Set(),
    left: new Set(),
  };
  const toSectionAxisKey = (value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "0";
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  const markSectionColumn = (edgeHint, centerX, centerY) => {
    const hint = String(edgeHint || "");
    const bucket = sectionColumnMarks[hint];
    if (!bucket) return;
    const axisValue =
      hint === "top" || hint === "bottom" ? Number(centerX || 0) : Number(centerY || 0);
    bucket.add(toSectionAxisKey(axisValue));
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
      const startCenterX = px + drawDir.dx * (-COLUMN_WIDTH_MM / 2);
      const startCenterY = py + drawDir.dy * (-COLUMN_WIDTH_MM / 2);
      const endCenterX = px + drawDir.dx * (widthMm + COLUMN_WIDTH_MM / 2);
      const endCenterY = py + drawDir.dy * (widthMm + COLUMN_WIDTH_MM / 2);
      markSectionColumn(primarySegmentHint, startCenterX, startCenterY);
      markSectionColumn(primarySegmentHint, endCenterX, endCenterY);
      pushUniquePoint(columnCenters, {
        x: startCenterX,
        y: startCenterY,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        edgeHint,
      });
      pushUniquePoint(columnCenters, {
        x: endCenterX,
        y: endCenterY,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        edgeHint,
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
    const primaryNominal = getCornerSizeAlongSide(primarySideIndex, corner.swap);
    const primaryLen = primaryNominal + SUPPORT_VISIBLE_MM * 2;
    const secondDir = { dx: drawInward.x, dy: drawInward.y };
    const secondSideIndex = directionToSideIndex(secondDir.dx, secondDir.dy);
    const secondaryNominal = getCornerSizeAlongSide(secondSideIndex, corner.swap);
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

    const startCenterX = px + drawDir.dx * (-COLUMN_WIDTH_MM / 2);
    const startCenterY = py + drawDir.dy * (-COLUMN_WIDTH_MM / 2);
    const secondEndCenter = {
      x: secondStartX + secondDir.dx * (secondLen + COLUMN_WIDTH_MM / 2),
      y: secondStartY + secondDir.dy * (secondLen + COLUMN_WIDTH_MM / 2),
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
    });
    pushUniquePoint(columnCenters, {
      x: secondEndCenter.x,
      y: secondEndCenter.y,
      inwardX: secondInward.x,
      inwardY: secondInward.y,
      edgeHint: getEdgeHintFromDir(secondDir),
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
    totalMm: Math.round(Math.max(COLUMN_WIDTH_MM, Number(run.totalMm || 0))),
    targetMm: 0,
    text: `${Math.round(Math.max(COLUMN_WIDTH_MM, Number(run.totalMm || 0)))}mm`,
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
  const sidePaddingPx = Math.max(22, Math.round(addBtnSize * 1.1));
  const topSafeAreaPx = Math.max(78, Math.round(addBtnSize * 2.8));
  const bottomPaddingPx = Math.max(24, Math.round(addBtnSize * 1.0));
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
      shelvesEl.appendChild(shelf);
  });

  const columnWidthPx = Math.max(COLUMN_WIDTH_MM * scale, 4);
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
    const angleDeg = Number.isFinite(Number(point.rotationDeg))
      ? Number(point.rotationDeg)
      : (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
    const columnEl = document.createElement("div");
    columnEl.className = "system-column system-preview-column-box";
    columnEl.style.width = `${columnWidthPx}px`;
    columnEl.style.height = `${columnDepthPx}px`;
    columnEl.style.left = `${renderX}px`;
    columnEl.style.top = `${renderY}px`;
    columnEl.style.transform = `translate(-50%, -50%) rotate(${angleDeg.toFixed(2)}deg)`;
    columnEl.style.background = columnMat?.swatch || "#d9d9d9";
    shelvesEl.appendChild(columnEl);
    const halfDiag = Math.hypot(columnWidthPx, columnDepthPx) / 2;
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
    });
  });

  const dimensionLabels = [];
  const moduleInfoLabels = [];
  const edgeById = new Map(
    edges
      .filter((edge) => edge?.id)
      .map((edge) => [String(edge.id), edge])
  );
  shelves.forEach((item) => {
    const edge = edgeById.get(String(item.id || ""));
    const shelfCount = Math.max(1, Number(edge?.count || 1));
    const addonSummary = formatAddonCompactBreakdown(getShelfAddonIds(item.id));
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
      // Corner option text should follow the option order (800x600 / 600x800),
      // not the absolute placed orientation (horizontal/vertical side).
      const optionPrimaryLength = edge?.swap ? 600 : 800;
      const optionSecondaryLength = edge?.swap ? 800 : 600;
      const cornerText =
        secondaryLength > 0
          ? `${optionPrimaryLength} x ${optionSecondaryLength}`
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
        x: labelXMm * scale + tx,
        y: labelYMm * scale + ty,
        text: cornerText,
        corner: true,
      });
      moduleInfoLabels.push({
        x: labelXMm * scale + tx,
        y: labelYMm * scale + ty,
        count: shelfCount,
        addons: addonSummary,
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
      x: ((item.minX + item.maxX) / 2) * scale + tx,
      y: ((item.minY + item.maxY) / 2) * scale + ty,
      text: `${nominalLength}`,
      corner: false,
    });
    moduleInfoLabels.push({
      x: ((item.minX + item.maxX) / 2) * scale + tx,
      y: ((item.minY + item.maxY) / 2) * scale + ty,
      count: shelfCount,
      addons: addonSummary,
      corner: false,
    });
  });

  if (showSizeInfo) {
    dimensionLabels.forEach((labelInfo) => {
      const labelEl = document.createElement("div");
      labelEl.className = `system-dimension-label${
        labelInfo.corner ? " system-dimension-label--corner" : ""
      }`;
      labelEl.textContent = `${labelInfo.text}mm`;
      labelEl.style.left = `${labelInfo.x}px`;
      labelEl.style.top = `${labelInfo.y}px`;
      shelvesEl.appendChild(labelEl);
    });
  } else {
    moduleInfoLabels.forEach((labelInfo) => {
      const labelEl = document.createElement("div");
      labelEl.className = `system-module-label${
        labelInfo.corner ? " system-module-label--corner" : ""
      }`;
      const shelfLine = document.createElement("span");
      shelfLine.className = "system-module-label-line";
      shelfLine.textContent = `선반 ${labelInfo.count}개`;
      const addonLine = document.createElement("span");
      addonLine.className = "system-module-label-line";
      addonLine.textContent = `${labelInfo.addons}`;
      labelEl.appendChild(shelfLine);
      labelEl.appendChild(addonLine);
      labelEl.style.left = `${labelInfo.x}px`;
      labelEl.style.top = `${labelInfo.y}px`;
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
      labelEl.title = `섹션${Number(info.sectionIndex) + 1}: 사용 ${Number(info.totalMm || 0)}mm / 전체 ${Number(info.targetMm)}mm`;
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
      labelEl.textContent = `${COLUMN_WIDTH_MM}mm`;
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
  const addBtnRadius = addBtnSize / 2;
  const isSingleStraightBayLayout =
    edges.length === 1 && String(edges[0]?.type || "") === "bay" && addButtons.length === 2;
  const framePad = Math.max(8, addBtnRadius + 2);
  const rectOverlapsCircle = (rect, cx, cy, r) =>
    cx + r > rect.left && cx - r < rect.right && cy + r > rect.top && cy - r < rect.bottom;
  const isBlockedPoint = (x, y, r) => {
    if (x < framePad || x > frameW - framePad || y < framePad || y > frameH - framePad) {
      return true;
    }
    if (shelfBoxesPx.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    if (columnBoxesPx.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    if (placedAddBtnBoxes.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    return false;
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
    const offsetPx = Math.max(columnDepthPx * 0.5 + addBtnSize * 0.65, 20);
    const extendDir = normalizeDirection(point.extendDx, point.extendDy);
    const singleBayPreferred = isSingleStraightBayLayout
      ? { x: Number(extendDir.dx || 0), y: Number(extendDir.dy || 0) }
      : null;
    const candidateVectors = [];
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
    let btnX = columnCenterPxX + (singleBayPreferred?.x ?? outwardX) * offsetPx;
    let btnY = columnCenterPxY + (singleBayPreferred?.y ?? outwardY) * offsetPx;
    for (let i = 0; i < candidateVectors.length; i += 1) {
      const c = candidateVectors[i];
      const mul = Number(c.mul || 1);
      const cx = columnCenterPxX + Number(c.x || 0) * offsetPx * mul;
      const cy = columnCenterPxY + Number(c.y || 0) * offsetPx * mul;
      if (!isBlockedPoint(cx, cy, addBtnRadius)) {
        btnX = cx;
        btnY = cy;
        break;
      }
    }
    btn.style.left = `${btnX}px`;
    btn.style.top = `${btnY}px`;
    shelvesEl.appendChild(btn);
    bindAddButtonPreviewInteractions(btn, point, canAddFromPreview);
    placedAddBtnBoxes.push({
      left: btnX - addBtnRadius,
      right: btnX + addBtnRadius,
      top: btnY - addBtnRadius,
      bottom: btnY + addBtnRadius,
    });
  });
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
  if (Number.isNaN(sideIndex) || Number.isNaN(attachSideIndex)) return;
  const normalizedAllowedTypes = Array.isArray(allowedTypes) ? allowedTypes : ["normal"];
  const hasNormalSlot = normalizedAllowedTypes.includes("normal");
  const hasCornerSlot = normalizedAllowedTypes.includes("corner");
  const cornerLimitState = getShapeCornerLimitState();
  const canAddNewCorner = cornerLimitState.canAdd;
  const isRootEndpointTarget = !cornerId && endpointId === "root-endpoint";
  const shouldDeferCornerDirectionCheck = isRootEndpointTarget;
  const cornerDirectionBlockedMessage = !cornerId && !shouldDeferCornerDirectionCheck
    ? getCornerAttachSideBlockedMessage({ sideIndex, attachSideIndex }, getSelectedShape())
    : "";
  const canUseCornerDirection = !cornerDirectionBlockedMessage;
  activePreviewAddTarget = {
    endpointId: endpointId || "",
    sideIndex,
    cornerId: cornerId || "",
    prepend: Boolean(prepend),
    attachSideIndex,
    attachAtStart: Boolean(attachAtStart),
    allowedTypes: normalizedAllowedTypes,
  };
  activePreviewAddAnchorEl = anchorEl instanceof Element ? anchorEl : null;
  const {
    popover,
    cornerBtn: popoverCornerBtn,
    normalBtn: popoverNormalBtn,
    titleEl: popoverTitleEl,
  } = getPreviewAddTypePopoverElements();
  const modalNormalBtn = $("#previewAddNormalBtn");
  const modalCornerBtn = $("#previewAddCornerBtn");
  const normalBtnTargets = [popoverNormalBtn, modalNormalBtn].filter(Boolean);
  const cornerBtnTargets = [popoverCornerBtn, modalCornerBtn].filter(Boolean);
  normalBtnTargets.forEach((btn) => {
    btn.disabled = !hasNormalSlot;
    if (!hasNormalSlot) {
      btn.title = "이 끝점에서는 일반 모듈 추가가 불가합니다.";
    } else {
      btn.removeAttribute("title");
    }
  });
  const canUseCornerAction = Boolean(
    cornerId || (hasCornerSlot && canAddNewCorner && canUseCornerDirection)
  );
  cornerBtnTargets.forEach((btn) => {
    btn.disabled = !canUseCornerAction;
    if (!canUseCornerAction && hasCornerSlot && !cornerId && !canAddNewCorner) {
      btn.title = getCornerLimitBlockedMessage(cornerLimitState);
    } else if (!canUseCornerAction && hasCornerSlot && !cornerId && !canUseCornerDirection) {
      btn.title = cornerDirectionBlockedMessage;
    } else if (!canUseCornerAction && !hasCornerSlot) {
      btn.title = "이 끝점에서는 코너 추가가 불가합니다.";
    } else {
      btn.removeAttribute("title");
    }
  });
  if (!cornerId && hasCornerSlot && !canAddNewCorner) {
    setPreviewAddTypeErrorMessage(getCornerLimitBlockedMessage(cornerLimitState), { isError: true });
  } else if (!cornerId && hasCornerSlot && !canUseCornerDirection) {
    setPreviewAddTypeErrorMessage(cornerDirectionBlockedMessage, { isError: true });
  } else if (!cornerId && !hasCornerSlot) {
    setPreviewAddTypeErrorMessage("이 끝점에서는 코너 추가가 불가합니다. 일반 모듈을 추가해주세요.", {
      isError: true,
    });
  } else {
    setPreviewAddTypeErrorMessage("", { isError: false });
  }
  if (popover) {
    setPreviewAddTypePopoverStep("type", "");
    closeModal("#previewAddTypeModal");
    popover.classList.remove("hidden");
    popover.setAttribute("aria-hidden", "false");
    positionPreviewAddTypePopover(activePreviewAddAnchorEl);
    requestAnimationFrame(() => positionPreviewAddTypePopover(activePreviewAddAnchorEl));
    requestAnimationFrame(() => {
      if (popoverNormalBtn && !popoverNormalBtn.disabled) {
        popoverNormalBtn.focus();
        return;
      }
      if (popoverCornerBtn && !popoverCornerBtn.disabled) {
        popoverCornerBtn.focus();
        return;
      }
      popoverTitleEl?.focus();
    });
    return;
  }
  openModal("#previewAddTypeModal", { focusTarget: "#previewAddTypeModalTitle" });
}

function commitPreviewAddNormal() {
  const source = resolveActivePreviewAddSourceTarget(activePreviewAddTarget);
  if (!source) return;
  const shelfId = addShelfFromEndpoint(source, activePreviewAddTarget, {
    pushHistory: false,
    skipRender: true,
    initialCount: 0,
    pendingAdd: true,
  });
  closePreviewAddTypePicker();
  if (shelfId) openBayOptionModal(shelfId);
}

function commitPreviewAddCorner() {
  const cornerId = activePreviewAddTarget?.cornerId || "";
  if (cornerId) {
    closePreviewAddTypePicker();
    openCornerOptionModal(cornerId);
    return;
  }
  const source = resolveActivePreviewAddSourceTarget(activePreviewAddTarget);
  if (source && isRootPreviewEndpointTarget(source) && !hasSelectedRootCornerStartDirection(activePreviewAddTarget)) {
    setPreviewAddTypeErrorMessage(getRootCornerDirectionRequiredMessage(), { isError: true });
    return;
  }
  const cornerLimitState = getShapeCornerLimitState();
  if (!cornerLimitState.canAdd) {
    setPreviewAddTypeErrorMessage(getCornerLimitBlockedMessage(cornerLimitState), { isError: true });
    return;
  }
  if (source && !canAddCornerAtTarget(source, getSelectedShape())) {
    setPreviewAddTypeErrorMessage(getCornerAttachSideBlockedMessage(source, getSelectedShape()), {
      isError: true,
    });
    return;
  }
  if (source) {
    const placement = buildPlacementFromEndpoint(source);
    const dir = placement ? normalizeDirection(placement.dirDx, placement.dirDy) : { dx: 1, dy: 0 };
    const sideIndex = Number(
      source?.attachSideIndex ?? source?.sideIndex ?? directionToSideIndex(dir.dx, dir.dy)
    );
    const edge = {
      id: `corner-${sideIndex}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: "corner",
      sideIndex,
      attachAtStart: Boolean(source?.attachAtStart),
      attachSideIndex: sideIndex,
      anchorEndpointId: String(source?.endpointId || ""),
      anchorDirDx: Number(normalizeDirection(source?.extendDx, source?.extendDy).dx),
      anchorDirDy: Number(normalizeDirection(source?.extendDx, source?.extendDy).dy),
      anchorInwardX: Number(normalizeDirection(source?.inwardX, source?.inwardY).dx),
      anchorInwardY: Number(normalizeDirection(source?.inwardX, source?.inwardY).dy),
      extendDx: Number(source?.extendDx || 0),
      extendDy: Number(source?.extendDy || 0),
      inwardX: Number(source?.inwardX || 0),
      inwardY: Number(source?.inwardY || 0),
      placement: placement || null,
      swap: false,
      count: 0,
      pendingAdd: true,
      createdAt: Date.now(),
    };
    registerEdge(edge);
    closePreviewAddTypePicker();
    openCornerOptionModal(edge.id);
    return;
  }
  setPreviewAddTypeErrorMessage("이 끝점에는 코너 모듈을 추가할 수 없습니다.", { isError: true });
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
    $("#itemPriceDisplay").textContent = err;
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
      };
      const detail = calcBayDetail({
        shelf,
        addons: bay.addons,
        quantity: 1,
      });
      const addonCost = calcAddonCostBreakdown(bay.addons, 1);
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
  if (isCustom) {
    $("#itemPriceDisplay").textContent = "금액: 상담 안내";
  } else {
    const basePostCost = Number(columnDetail?.basePostBar?.totalCost || 0);
    const cornerPostCost = Number(columnDetail?.cornerPostBar?.totalCost || 0);
    $("#itemPriceDisplay").textContent =
      `금액: ${totalPrice.toLocaleString()}원 ` +
      `(자재비 ${bayTotals.materialCost.toLocaleString()} + 구성품 ${bayTotals.componentCost.toLocaleString()} + 가구 ${bayTotals.furnitureCost.toLocaleString()} + 기본 포스트바 ${basePostCost.toLocaleString()} + 코너 포스트바 ${cornerPostCost.toLocaleString()})`;
  }
  updateAddItemState();
}

function applyLayoutShapeTypeChange(nextShape) {
  const normalizedNextShape = normalizeSystemShape(nextShape);
  const currentShape = getSelectedShape();
  if (normalizedNextShape === currentShape) return;

  const hasExistingModules = getOrderedGraphEdges().length > 0;
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
  activePreviewAddTarget = null;
  previewOpenEndpoints = new Map();
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
  layoutCard.className = "bay-input system-layout-config-card";
  layoutCard.innerHTML = `
    <div class="bay-input-title">레이아웃 타입 및 섹션 설정</div>
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
            <span class="layout-type-btn-meta">${sectionCount}섹션</span>
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
    <div class="field-note">섹션 길이는 최소 ${SYSTEM_SECTION_LENGTH_MIN_MM}mm 이상 입력해주세요.</div>
  `;
  container.appendChild(layoutCard);

  const row = document.createElement("div");
  row.className = "bay-input";
  row.innerHTML = `
    <div class="bay-input-title">천장 높이 설정</div>
    <div class="form-row">
      <label>가장 낮은 천장 높이 (mm)</label>
      <div class="field-col">
        <input type="number" id="spaceMin-${i}" placeholder="1800mm 이상" value="${Number(previousSpace.min || 0) > 0 ? Number(previousSpace.min) : ""}" />
      </div>
    </div>
    <div class="form-row">
      <label>가장 높은 천장 높이 (mm)</label>
      <div class="field-col">
        <input type="number" id="spaceMax-${i}" placeholder="1800mm 이상" value="${Number(previousSpace.max || 0) > 0 ? Number(previousSpace.max) : ""}" />
        <div class="error-msg" id="spaceHeightError-${i}"></div>
      </div>
    </div>
    <div class="form-row">
      <label>개별높이 (mm)</label>
      <div class="field-col">
        <button type="button" class="ghost-btn space-extra-add-btn" id="addSpaceExtra-${i}">개별높이 추가</button>
        <div id="spaceExtraList-${i}" class="field-stack"></div>
        <div class="field-note">창문, 커튼박스 등으로 동일 높이 설치가 어려운 경우에는 구간별 개별 높이 기둥을 추가해 주세요.</div>
        <div class="error-msg" id="spaceExtraError-${i}"></div>
      </div>
    </div>
  `;
  container.appendChild(row);

  const layoutStatusCard = document.createElement("div");
  layoutStatusCard.className = "bay-input";
  layoutStatusCard.innerHTML = `
    <div class="bay-input-title">레이아웃 상태 및 상담 안내</div>
    <div id="layoutConstraintStatus" class="layout-constraint-status" aria-live="polite"></div>
    <div class="field-note">섹션 길이 ${SYSTEM_SECTION_LENGTH_CONSULT_AT_MM}mm 이상 또는 가장 낮은 높이 ${SYSTEM_LOWEST_HEIGHT_CONSULT_AT_MM}mm 이상이면 상담 안내로 처리됩니다.</div>
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
      <input type="number" data-space-extra-height="0" placeholder="개별높이 (1800mm 이상)" />
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
    block.className = "bay-input";
    block.innerHTML = `
      <div class="bay-input-title">모듈 구성</div>
      <div class="shelf-list" data-side-index="all"></div>
    `;
    container.appendChild(block);
    const list = block.querySelector(".shelf-list");
    if (list) {
      getPreviewOrderedEdges(getOrderedGraphEdges()).forEach((edge) => {
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
        <input type="number" class="bay-width-input" data-shelf-width="${shelf.id}" min="${BAY_WIDTH_LIMITS.min}" max="${BAY_WIDTH_LIMITS.max}" placeholder="직접 입력 (${BAY_WIDTH_LIMITS.min}~${BAY_WIDTH_LIMITS.max}mm)" value="${shelf.width || ""}" />
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
    <div class="bay-addon-section">
      <div class="addon-picker">
        <button type="button" data-shelf-addon-btn="${corner.id}">가구 선택</button>
      </div>
      <div id="selectedShelfAddon-${corner.id}" class="selected-material-card addon-card-display"></div>
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
  bayOptionModalDraft = {
    edgeId: String(activeBayOptionId),
    presetValue: String(presetSelect?.value || ""),
    customWidthValue: String(customInput?.value || ""),
    countValue: String(countInput?.value || ""),
    rodCountValue: String(rodCountInput?.value || ""),
  };
  return bayOptionModalDraft;
}

function captureCornerOptionModalDraft() {
  if (!activeCornerOptionId) return null;
  const swapSelect = $("#cornerSwapSelect");
  const countInput = $("#cornerCountInput");
  const rodCountInput = $("#cornerRodCountInput");
  cornerOptionModalDraft = {
    edgeId: String(activeCornerOptionId),
    swapValue: String(swapSelect?.value || ""),
    countValue: String(countInput?.value || ""),
    rodCountValue: String(rodCountInput?.value || ""),
  };
  return cornerOptionModalDraft;
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
      updatePreview();
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
      updatePreview();
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
      setShelfAddonQuantity(id, ADDON_CLOTHES_ROD_ID, qty);
      renderShelfAddonSelection(id);
      autoCalculatePrice();
      updateAddItemState();
    });
    input.addEventListener("blur", () => {
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
  unregisterEdge(edgeId);
  normalizeDanglingAnchorIds();
  delete state.shelfAddons[edgeId];
  return true;
}

function closeBayOptionModalWithCleanup({ returnFocus = false } = {}) {
  const edge = activeBayOptionId ? findShelfById(activeBayOptionId) : null;
  const removedPending = discardPendingEdge(edge);
  if (removedPending) {
    bayOptionModalDraft = null;
    activeBayOptionId = null;
  }
  closeModal("#bayOptionModal");
  if (removedPending) {
    renderBayInputs();
  }
  if (returnFocus && activePreviewAddAnchorEl instanceof Element && activePreviewAddAnchorEl.isConnected) {
    activePreviewAddAnchorEl.focus();
  }
}

function closeCornerOptionModalWithCleanup({ returnFocus = false } = {}) {
  const edge = activeCornerOptionId ? findShelfById(activeCornerOptionId) : null;
  const removedPending = discardPendingEdge(edge);
  if (removedPending) {
    cornerOptionModalDraft = null;
    activeCornerOptionId = null;
  }
  closeModal("#cornerOptionModal");
  if (removedPending) {
    renderBayInputs();
  }
  if (returnFocus && activePreviewAddAnchorEl instanceof Element && activePreviewAddAnchorEl.isConnected) {
    activePreviewAddAnchorEl.focus();
  }
}

function setDirectComposeApplyButtonState(buttonId, countInputId, activeEdgeId) {
  const btn = $(buttonId);
  if (!btn) return;
  const countInput = $(countInputId);
  const countValue = Number(countInput?.value ?? 0);
  const canApply = Boolean(activeEdgeId) && Number.isFinite(countValue) && countValue >= 1;
  btn.disabled = !canApply;
  btn.classList.toggle("btn-disabled", !canApply);
  btn.setAttribute("aria-disabled", canApply ? "false" : "true");
  if (!canApply) {
    btn.title = "선반 갯수를 1개 이상 입력해주세요.";
  } else {
    btn.removeAttribute("title");
  }
}

function updateBayOptionModalApplyButtonState() {
  setDirectComposeApplyButtonState("#saveBayOptionModal", "#bayCountInput", activeBayOptionId);
}

function updateCornerOptionModalApplyButtonState() {
  setDirectComposeApplyButtonState("#saveCornerOptionModal", "#cornerCountInput", activeCornerOptionId);
}

function syncCornerOptionModal() {
  if (!activeCornerOptionId) return;
  const corner = findShelfById(activeCornerOptionId);
  if (!corner) return;
  const titleEl = $("#cornerOptionModalTitle");
  const swapSelect = $("#cornerSwapSelect");
  const countInput = $("#cornerCountInput");
  const rodCountInput = $("#cornerRodCountInput");
  const addonBtn = $("#cornerAddonBtn");
  const draft =
    cornerOptionModalDraft && String(cornerOptionModalDraft.edgeId || "") === String(corner.id)
      ? cornerOptionModalDraft
      : null;
  if (titleEl) titleEl.textContent = `${getCornerLabel(corner)} 옵션 설정`;
  if (swapSelect) swapSelect.value = draft?.swapValue || (corner.swap ? "swap" : "default");
  if (countInput) countInput.value = draft?.countValue ?? String(corner.count ?? 0);
  if (rodCountInput) {
    rodCountInput.value =
      draft?.rodCountValue || String(getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID));
  }
  renderShelfAddonSelectionToTarget(corner.id, "selectedCornerOptionAddon");
  if (addonBtn) addonBtn.disabled = false;
  setFieldError(countInput, $("#cornerCountError"), "");
  updateCornerOptionModalApplyButtonState();
  renderCornerOptionFrontPreview();
}

function openCornerOptionModal(cornerId, { preserveDraft = false } = {}) {
  const corner = findShelfById(cornerId);
  if (!corner) return;
  if (
    !preserveDraft ||
    !cornerOptionModalDraft ||
    String(cornerOptionModalDraft.edgeId || "") !== String(cornerId)
  ) {
    cornerOptionModalDraft = null;
  }
  activeCornerOptionId = cornerId;
  syncCornerOptionModal();
  openModal("#cornerOptionModal", { focusTarget: "#cornerOptionModalTitle" });
}

function syncBayOptionModal() {
  if (!activeBayOptionId) return;
  const shelf = findShelfById(activeBayOptionId);
  if (!shelf) return;
  const titleEl = $("#bayOptionModalTitle");
  const presetSelect = $("#bayWidthPresetSelect");
  const customInput = $("#bayWidthCustomInput");
  const countInput = $("#bayCountInput");
  const rodCountInput = $("#bayRodCountInput");
  const addonBtn = $("#bayAddonBtn");
  const draft =
    bayOptionModalDraft && String(bayOptionModalDraft.edgeId || "") === String(shelf.id)
      ? bayOptionModalDraft
      : null;

  const width = Number(shelf.width || 0);
  const presetValue = draft?.presetValue || (width === 400 || width === 600 || width === 800 ? String(width) : "custom");

  if (titleEl) titleEl.textContent = "모듈 옵션 설정";
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
  if (addonBtn) addonBtn.disabled = false;

  setFieldError(customInput, $("#bayWidthError"), "");
  setFieldError(countInput, $("#bayCountError"), "");
  updateBayOptionModalApplyButtonState();
  renderBayOptionFrontPreview();
}

function openBayOptionModal(shelfId, { preserveDraft = false } = {}) {
  const shelf = findShelfById(shelfId);
  if (!shelf) return;
  if (
    !preserveDraft ||
    !bayOptionModalDraft ||
    String(bayOptionModalDraft.edgeId || "") !== String(shelfId)
  ) {
    bayOptionModalDraft = null;
  }
  activeBayOptionId = shelfId;
  syncBayOptionModal();
  openModal("#bayOptionModal", { focusTarget: "#bayOptionModalTitle" });
}

function buildModalDraftAddonBreakdown(edgeId, rodCount) {
  if (!edgeId) {
    return { componentSummary: "-", furnitureSummary: "-" };
  }
  const baseAddonIds = getShelfAddonIds(edgeId).filter((addonId) => addonId !== ADDON_CLOTHES_ROD_ID);
  return {
    componentSummary: buildRodAddonSummary(rodCount, "-"),
    furnitureSummary: buildFurnitureAddonSummary(baseAddonIds, "-"),
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
  const minHeightMm = Number(LIMITS.column.minLength || 1800);
  const heightMm = Math.max(minHeightMm, Math.round(Number(averageHeightMm || 0) || minHeightMm));
  const totalWidthMm = widthMm + columnThicknessMm * 2;
  const widthMinRef = 400;
  const widthMaxRef = 1000;
  const heightMaxRef = Math.max(Number(LIMITS.column.maxLength || 2700) + 600, minHeightMm + 600);
  const baselineShelfWidthMm = 400;
  const baselineTotalWidthMm = baselineShelfWidthMm + columnThicknessMm * 2;
  const clamp01 = (value) => Math.min(1, Math.max(0, Number(value || 0)));
  const widthRatio = clamp01((widthMm - widthMinRef) / Math.max(1, widthMaxRef - widthMinRef));
  const heightRatio = clamp01((heightMm - minHeightMm) / Math.max(1, heightMaxRef - minHeightMm));
  const easedWidth = Math.pow(widthRatio, 0.82);
  const easedHeight = Math.pow(heightRatio, 0.72);

  // Schematic mode: horizontal size responds to shelf width, but vertical size is anchored to the 400mm baseline.
  const totalWidthPx = Math.round(160 + easedWidth * 96); // 160 ~ 256
  const baseHeightPx = Math.round(220 + easedHeight * 188); // 220 ~ 408
  const baselineWidthRatio = clamp01((baselineShelfWidthMm - widthMinRef) / Math.max(1, widthMaxRef - widthMinRef));
  const baselineEasedWidth = Math.pow(baselineWidthRatio, 0.82);
  const baselineTotalWidthPx = Math.round(160 + baselineEasedWidth * 96); // 400mm 기준 폭 px
  const actualAspectRatio = heightMm / Math.max(1, baselineTotalWidthMm);
  const aspectRatioNorm = clamp01((actualAspectRatio - 2.0) / 2.8);
  const visualAspectRatio = 1.65 + aspectRatioNorm * 0.95; // 1.65 ~ 2.60
  const aspectDrivenHeightPx = Math.round(baselineTotalWidthPx * visualAspectRatio);
  const heightPx = Math.min(460, Math.max(baseHeightPx, aspectDrivenHeightPx));
  const exactScale = Math.max(0.02, Math.min(totalWidthPx / totalWidthMm, heightPx / heightMm));

  // Thickness is shown as a schematic exaggeration while still based on the 20mm real thickness.
  const exaggeratedThicknessPx = Math.round(columnThicknessMm * exactScale * 3.2);
  const columnThicknessPx = Math.min(18, Math.max(7, exaggeratedThicknessPx));
  const shelfThicknessPx = Math.min(14, Math.max(6, Math.round(shelfThicknessMm * exactScale * 3.0)));
  const shelfWidthPx = Math.max(44, totalWidthPx - columnThicknessPx * 2);
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

function buildModuleFrontPreviewHtml({
  moduleLabel = "모듈",
  sizeLabel = "",
  shelfCount = 1,
  componentSummary = "-",
  furnitureSummary = "-",
  type = "bay",
  averageHeightMm = 0,
  shelfWidthMm = 0,
} = {}) {
  const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount ?? 0) || 0));
  const visibleShelfLineCount = Math.max(0, Math.min(8, normalizedShelfCount));
  const overflowCount = normalizedShelfCount - visibleShelfLineCount;
  const overflowBadge =
    overflowCount > 0
      ? `<span class="module-front-preview-chip">+${overflowCount}단 추가</span>`
      : "";
  const safeComponentSummary =
    componentSummary && componentSummary !== "-" ? componentSummary : "없음";
  const safeFurnitureSummary =
    furnitureSummary && furnitureSummary !== "-" ? furnitureSummary : "없음";
  const avgHeight = Math.max(0, Math.round(Number(averageHeightMm || 0)));
  const geometry = buildModuleFrontPreviewGeometry({ shelfWidthMm, averageHeightMm: avgHeight });
  const shelfLinesHtml = Array.from({ length: visibleShelfLineCount }, (_, idx) => {
    const ratio = visibleShelfLineCount === 1 ? 0.55 : (idx + 1) / (visibleShelfLineCount + 1);
    return `
      <div
        class="module-front-preview-shelf-line"
        style="
          top:${Math.round(ratio * 100)}%;
          left:${geometry.columnThicknessPx}px;
          width:${geometry.shelfWidthPx}px;
          height:${geometry.shelfThicknessPx}px;
        "
      ></div>
    `;
  }).join("");

  return `
    <div class="module-front-preview-card module-front-preview-card--${escapeHtml(type)}">
      <div class="module-front-preview-head">
        <div class="module-front-preview-title">${escapeHtml(moduleLabel)} 정면 미리보기</div>
        ${sizeLabel ? `<span class="module-front-preview-chip">${escapeHtml(sizeLabel)}</span>` : ""}
      </div>
      <div class="module-front-preview-canvas" aria-hidden="true">
        <div
          class="module-front-preview-box module-front-preview-box--${escapeHtml(type)}"
          style="width:${geometry.totalWidthPx}px; height:${geometry.heightPx}px;"
        >
          <div class="module-front-preview-side module-front-preview-side--left" style="width:${geometry.columnThicknessPx}px;"></div>
          <div class="module-front-preview-side module-front-preview-side--right" style="width:${geometry.columnThicknessPx}px;"></div>
          ${shelfLinesHtml}
        </div>
        ${overflowBadge}
      </div>
      <div class="module-front-preview-meta">
        <div class="module-front-preview-row">
          <span class="label">선반 갯수</span>
          <strong>${normalizedShelfCount}개</strong>
        </div>
        <div class="module-front-preview-row">
          <span class="label">평균 높이</span>
          <span class="value">${avgHeight > 0 ? `${avgHeight}mm` : "-"}</span>
        </div>
        <div class="module-front-preview-row">
          <span class="label">두께 기준</span>
          <span class="value">기둥 ${geometry.columnThicknessMm}mm / 선반 ${geometry.shelfThicknessMm}mm</span>
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
      <div class="module-front-preview-note">도식화 미리보기 (가독성 우선, 실제 치수는 라벨 기준)</div>
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
  const widthValue = Number(
    (isCustom ? customInput?.value : presetSelect?.value) || Number(shelf.width || 0) || 0
  );
  const shelfCount = Number(countInput?.value ?? shelf.count ?? 0);
  const rodCount = Number(rodCountInput?.value || getShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID) || 0);
  const { componentSummary, furnitureSummary } = buildModalDraftAddonBreakdown(shelf.id, rodCount);
  const averageHeightMm = getModuleOptionAverageHeightMm();
  const sizeLabel = widthValue > 0 ? `폭 ${Math.round(widthValue)}mm` : "";
  updateBayOptionModalApplyButtonState();
  container.innerHTML = buildModuleFrontPreviewHtml({
    moduleLabel: "모듈",
    sizeLabel,
    shelfCount,
    componentSummary,
    furnitureSummary,
    type: "bay",
    averageHeightMm,
    shelfWidthMm: widthValue,
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
  const isSwap = swapSelect ? swapSelect.value === "swap" : Boolean(corner.swap);
  const frontShelfWidthMm = isSwap ? 600 : 800;
  const sizeLabel = isSwap ? "600 × 800mm" : "800 × 600mm";
  const shelfCount = Number(countInput?.value ?? corner.count ?? 0);
  const rodCount = Number(
    rodCountInput?.value || getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID) || 0
  );
  const { componentSummary, furnitureSummary } = buildModalDraftAddonBreakdown(corner.id, rodCount);
  const averageHeightMm = getModuleOptionAverageHeightMm();
  updateCornerOptionModalApplyButtonState();
  container.innerHTML = buildModuleFrontPreviewHtml({
    moduleLabel: getCornerLabel(corner),
    sizeLabel,
    shelfCount,
    componentSummary,
    furnitureSummary,
    type: "corner",
    averageHeightMm,
    shelfWidthMm: frontShelfWidthMm,
  });
}

function bindOptionModalFrontPreviewEvents() {
  [
    ["#cornerSwapSelect", "change", renderCornerOptionFrontPreview],
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
  if (!width || width < BAY_WIDTH_LIMITS.min || width > BAY_WIDTH_LIMITS.max) {
    setFieldError(
      customInput,
      widthError,
      `폭은 ${BAY_WIDTH_LIMITS.min}~${BAY_WIDTH_LIMITS.max}mm 범위 내로 입력해주세요.`
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
  if (wasPendingAdd) {
    pushBuilderHistory("add-normal");
  } else if (prevWidth !== width || prevCount !== count || prevRodCount !== rodCount) {
    pushBuilderHistory("update-normal");
  }
  if (wasPendingAdd) delete shelf.pendingAdd;
  shelf.width = width;
  shelf.count = count;
  setShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID, rodCount);
  bayOptionModalDraft = null;
  closeModal("#bayOptionModal");
  renderBayInputs();
}

function reanchorChildrenAfterEdgeRemoval(removedEdge) {
  if (!removedEdge?.id) return;
  const removedId = String(removedEdge.id);
  const { startAliases, endAliases } = getEdgeEndpointAliasSets(removedEdge);
  const orphanEdges = getOrderedGraphEdges().filter((edge) => {
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
    const targetAnchor = resolveAnchorForDirection(replacementAnchor, preferredDir);
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
  renderBayInputs();
}

function removeBayFromModal() {
  if (!activeBayOptionId) return;
  const id = activeBayOptionId;
  const edge = findShelfById(id);
  activeBayOptionId = null;
  closeModal("#bayOptionModal");
  if (discardPendingEdge(edge)) {
    renderBayInputs();
    return;
  }
  removeBayById(id);
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

  const nextSwap = swapSelect.value === "swap";
  const prevSwap = Boolean(corner.swap);
  const prevCount = Number(corner.count || 1);
  const prevRodCount = getShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID);
  const wasPendingAdd = isPendingEdge(corner);
  if (wasPendingAdd) {
    pushBuilderHistory("add-corner");
  } else if (
    prevSwap !== nextSwap ||
    prevCount !== count ||
    prevRodCount !== rodCount
  ) {
    pushBuilderHistory("update-corner");
  }
  if (wasPendingAdd) delete corner.pendingAdd;
  corner.swap = nextSwap;
  corner.count = count;
  setShelfAddonQuantity(corner.id, ADDON_CLOTHES_ROD_ID, rodCount);
  cornerOptionModalDraft = null;
  closeModal("#cornerOptionModal");
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

function removeCornerFromModal() {
  if (!activeCornerOptionId) return;
  const id = activeCornerOptionId;
  const edge = findShelfById(id);
  activeCornerOptionId = null;
  closeModal("#cornerOptionModal");
  if (discardPendingEdge(edge)) {
    renderBayInputs();
    return;
  }
  removeCornerById(id);
}

function renderSystemAddonModalCards() {
  const container = $("#systemAddonCards");
  if (!container) return;
  container.innerHTML = "";
  const selectableItems = getSelectableSystemAddonItems();
  selectableItems.forEach((item) => {
    const label = document.createElement("label");
    label.className = "card-base option-card";
    label.innerHTML = `
      <input type="checkbox" value="${item.id}" />
      <div class="material-visual"></div>
      <div class="name">${item.name}</div>
      <div class="price">${item.price.toLocaleString()}원</div>
      ${item.description ? `<div class="description">${item.description}</div>` : ""}
    `;
    container.appendChild(label);
  });
  container.addEventListener("change", (e) => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input || !activeShelfAddonId) return;
    const id = input.value;
    if (input.checked) {
      selectableItems.forEach((item) => {
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
  });
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
  activeShelfAddonId = id;
  shelfAddonModalReturnTo = returnTo || "";
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
    btn.disabled = false;
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
    };
    let detail = calcBayDetail({
      shelf,
      addons: bay.addons,
      quantity: 1,
    });
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

function renderTable() {
  renderEstimateTable({
    items: state.items,
    getName: (item) => {
      if (item.type === "columns") {
        return "기둥 세트";
      }
      if (item.type === "bay") {
        return "시스템 수납장 모듈";
      }
      return "시스템 수납장";
    },
    getTotalText: (item) => (item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`),
    getDetailLines: (item) => {
      if (item.type === "columns") {
        const columnMat = SYSTEM_COLUMN_MATERIALS[item.column.materialId];
        const columnSize = formatColumnSize(item.column);
        const basePostBar = item.basePostBar || {};
        const cornerPostBar = item.cornerPostBar || {};
        const baseCount = Math.max(0, Number(basePostBar.count || item.count || 0));
        const cornerCount = Math.max(0, Number(cornerPostBar.count || 0));
        const baseTierLabel = String(basePostBar.tierLabel || (baseCount > 0 ? "-" : ""));
        const cornerTierLabel = String(cornerPostBar.tierLabel || (cornerCount > 0 ? "-" : ""));
        const lines = [
          `기둥 컬러 ${escapeHtml(columnMat?.name || "-")} · ${escapeHtml(columnSize)}`,
          `기본 포스트바 · ${baseTierLabel ? escapeHtml(baseTierLabel) : "-"} · ${baseCount}개`,
        ];
        if (cornerCount > 0) {
          lines.push(`코너 포스트바 · ${cornerTierLabel ? escapeHtml(cornerTierLabel) : "-"} · ${cornerCount}개`);
        }
        const layoutLines = buildLayoutSpecLinesFromSnapshot(item.layoutSpec, item.layoutConsult, {
          includeStatus: true,
        });
        layoutLines.forEach((line) => lines.push(escapeHtml(line)));
        if (item.isCustomPrice) lines.push("비규격 상담 안내");
        if (Number.isFinite(basePostBar.totalCost) && Number(basePostBar.totalCost || 0) > 0) {
          lines.push(`기본 포스트바 ${Number(basePostBar.totalCost).toLocaleString()}원`);
        }
        if (Number.isFinite(cornerPostBar.totalCost) && Number(cornerPostBar.totalCost || 0) > 0) {
          lines.push(`코너 포스트바 ${Number(cornerPostBar.totalCost).toLocaleString()}원`);
        }
        if (
          Number.isFinite(item.materialCost) &&
          (!Number(basePostBar.totalCost || 0) && !Number(cornerPostBar.totalCost || 0))
        ) {
          lines.push(`기둥 ${item.materialCost.toLocaleString()}원`);
        }
        return lines;
      }
      if (item.type === "bay") {
        const shelfMat = SYSTEM_SHELF_MATERIALS[item.shelf.materialId];
        const shelfSize = `${item.shelf.thickness}T / ${item.shelf.width}×${item.shelf.length}mm`;
        const { componentSummary, furnitureSummary } = buildAddonBreakdownFromIds(item.addons, "없음");
        const { componentCost, furnitureCost } = calcAddonCostBreakdown(item.addons, item.quantity);
        const lines = [
          `선반 ${escapeHtml(shelfMat?.name || "-")} · ${escapeHtml(shelfSize)} · ${item.shelf.count || 1}개`,
          `구성품 ${escapeHtml(componentSummary)}`,
          `가구 ${escapeHtml(furnitureSummary)}`,
        ];
        if (item.isCustomPrice) lines.push("비규격 상담 안내");
        if (Number.isFinite(item.materialCost)) {
          lines.push(`자재비 ${item.materialCost.toLocaleString()}원`);
        }
        if (Number.isFinite(componentCost) && componentCost > 0) {
          lines.push(`구성품 ${componentCost.toLocaleString()}원`);
        }
        if (Number.isFinite(furnitureCost) && furnitureCost > 0) {
          lines.push(`가구 ${furnitureCost.toLocaleString()}원`);
        }
        return lines;
      }
      return [];
    },
    onQuantityChange: (id, value) => updateItemQuantity(id, value),
    onDelete: (id) => {
      const removedItem = state.items.find((it) => it.id === id);
      if (!removedItem) return;
      if (removedItem.type === "bay") {
        state.items = state.items.filter((it) => it.id !== id);
        const groupId = removedItem.groupId;
        if (groupId) {
          const remainingBays = state.items.filter(
            (it) => it.type === "bay" && it.groupId === groupId
          );
          if (!remainingBays.length) {
            state.items = state.items.filter(
              (it) => !(it.type === "columns" && it.groupId === groupId)
            );
          } else {
            const columnItem = state.items.find(
              (it) => it.type === "columns" && it.groupId === groupId
            );
            if (columnItem) {
              const columnCount = remainingBays.length + 1;
              let detail = calcColumnsDetail({
                column: columnItem.column,
                count: columnCount,
                quantity: columnItem.quantity,
                bays: remainingBays,
              });
              if (isLayoutConsultStatus(columnItem.layoutConsult)) {
                detail = applyConsultPriceToDetail(detail);
              }
              Object.assign(columnItem, { count: columnCount, ...detail });
            }
          }
        }
        renderTable();
        renderSummary();
        return;
      }
      if (removedItem.type === "columns") {
        const groupId = removedItem.groupId;
        if (groupId) {
          state.items = state.items.filter((it) => it.groupId !== groupId);
          renderTable();
          renderSummary();
          return;
        }
        showInfoModal("기둥 세트는 모듈 수에 따라 자동 계산됩니다.");
      }
    },
  });
  requestStickyOffsetUpdate();
}

function updateItemQuantity(id, quantity) {
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
    });
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
  const summary = calcOrderSummary(state.items);
  const hasCustom = state.items.some((item) => item.isCustomPrice);
  const suffix = hasCustom ? "(상담 필요 품목 미포함)" : "";

  const materialsTotalEl = $("#materialsTotal");
  if (materialsTotalEl) materialsTotalEl.textContent = summary.materialsTotal.toLocaleString();
  $("#grandTotal").textContent = `${summary.grandTotal.toLocaleString()}${suffix}`;

  const shippingEl = $("#shippingCost");
  if (shippingEl) shippingEl.textContent = summary.shippingCost.toLocaleString();

  const naverUnits = Math.ceil(summary.grandTotal / 1000);
  $("#naverUnits").textContent = `${naverUnits}${suffix}`;
  updateSendButtonEnabled();
}

function buildEmailContent() {
  const customer = getCustomerInfo();
  const summary = calcOrderSummary(state.items);

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
      if (item.type === "columns") {
        const columnMat = SYSTEM_COLUMN_MATERIALS[item.column.materialId];
        const columnSize = formatColumnSize(item.column);
        const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
        const basePostBar = item.basePostBar || {};
        const cornerPostBar = item.cornerPostBar || {};
        const baseCount = Math.max(0, Number(basePostBar.count || item.count || 0));
        const cornerCount = Math.max(0, Number(cornerPostBar.count || 0));
        const postBarInline = [
          `기본 포스트바 ${baseCount}개${basePostBar.tierLabel ? `(${basePostBar.tierLabel})` : ""}`,
          cornerCount > 0
            ? `코너 포스트바 ${cornerCount}개${cornerPostBar.tierLabel ? `(${cornerPostBar.tierLabel})` : ""}`
            : "",
        ]
          .filter(Boolean)
          .join(" / ");
        const layoutInline = buildLayoutSpecLinesFromSnapshot(item.layoutSpec, item.layoutConsult, {
          includeStatus: true,
        }).join(" / ");
        lines.push(
          `${idx + 1}. 기둥 세트 x${item.quantity} | ${columnMat?.name || "-"} ${columnSize}${
            postBarInline ? ` | ${postBarInline}` : ""
          }${
            layoutInline ? ` | ${layoutInline}` : ""
          } | 금액 ${amountText}`
        );
        return;
      }
      if (item.type === "bay") {
        const shelfMat = SYSTEM_SHELF_MATERIALS[item.shelf.materialId];
        const shelfSize = `${item.shelf.thickness}T / ${item.shelf.width}×${item.shelf.length}mm`;
        const { componentSummary, furnitureSummary } = buildAddonBreakdownFromIds(item.addons, "없음");
        const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
        lines.push(
          `${idx + 1}. 시스템 수납장 모듈 x${item.quantity} | ` +
            `선반 ${shelfMat?.name || "-"} ${shelfSize} ${item.shelf.count || 1}개 | ` +
            `구성품 ${componentSummary} | 가구 ${furnitureSummary} | 금액 ${amountText}`
        );
      }
    });
  }

  lines.push("");
  lines.push("[합계]");
  const hasCustom = state.items.some((item) => item.isCustomPrice);
  const suffix = hasCustom ? "(상담 필요 품목 미포함)" : "";
  const naverUnits = Math.ceil(summary.grandTotal / 1000) || 0;
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
    onFinalStep: currentPhase === 2,
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
  ["stepShape", "stepColumnMaterial", "stepShelfMaterial", "stepPreview"].forEach(
    (id) => document.getElementById(id)?.classList.remove("hidden-step")
  );
  actionCard?.classList.remove("hidden-step");
  navActions?.classList.remove("hidden-step");
  completeEl?.classList.add("hidden-step");
  summaryCard?.classList.remove("order-complete-visible");
  summaryCard?.classList.remove("hidden-step");
  $("#step5")?.classList.add("hidden-step");
}

function showOrderComplete() {
  const navActions = document.querySelector(".nav-actions");
  const completeEl = $("#orderComplete");
  const customerStep = $("#step5");
  const summaryCard = $("#stepFinal");
  renderOrderCompleteDetails();
  orderCompleted = true;
  navActions?.classList.add("hidden-step");
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
  const step5 = $("#step5");
  const summaryCard = $("#stepFinal");
  const sendBtn = $("#sendQuoteBtn");
  const nextBtn = $("#nextStepsBtn");
  const backToCenterBtn = $("#backToCenterBtn");
  const orderComplete = $("#orderComplete");
  const navActions = document.querySelector(".nav-actions");

  const showPhase1 = currentPhase === 1;
  const showPhase2 = currentPhase === 2;

  if (orderCompleted) {
    [stepShape, stepColumn, stepShelf, stepPreview, step5, actionCard].forEach(
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
  if (step5) step5.classList.toggle("hidden-step", !showPhase2 || orderCompleted);
  if (summaryCard) summaryCard.classList.remove("hidden-step");
  if (sendBtn) sendBtn.classList.toggle("hidden-step", !showPhase2 || orderCompleted);
  if (nextBtn) {
    nextBtn.classList.toggle("hidden-step", showPhase2 || orderCompleted);
    nextBtn.style.display = showPhase2 || orderCompleted ? "none" : "";
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
      showInfoModal("견적 담기를 완료해주세요.");
      return;
    }
    currentPhase = 2;
    updateStepVisibility($("#step5"));
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
}

function goToPrevStep() {
  if (currentPhase === 1) return;
  currentPhase = 1;
  updateStepVisibility($("#stepShape"));
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
  const summary = calcOrderSummary(state.items);

  const itemsHtml =
    state.items.length === 0
      ? "<p class=\"item-line\">담긴 항목이 없습니다.</p>"
      : state.items
          .map((item, idx) => {
            if (item.type === "columns") {
              const columnMat = SYSTEM_COLUMN_MATERIALS[item.column.materialId];
              const columnSize = formatColumnSize(item.column);
              const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
              const basePostBar = item.basePostBar || {};
              const cornerPostBar = item.cornerPostBar || {};
              const baseCount = Math.max(0, Number(basePostBar.count || item.count || 0));
              const cornerCount = Math.max(0, Number(cornerPostBar.count || 0));
              const postBarInline = [
                `기본 포스트바 ${baseCount}개${basePostBar.tierLabel ? `(${basePostBar.tierLabel})` : ""}`,
                cornerCount > 0
                  ? `코너 포스트바 ${cornerCount}개${cornerPostBar.tierLabel ? `(${cornerPostBar.tierLabel})` : ""}`
                  : "",
              ]
                .filter(Boolean)
                .join(" · ");
              const layoutInline = buildLayoutSpecLinesFromSnapshot(item.layoutSpec, item.layoutConsult, {
                includeStatus: true,
              }).join(" / ");
              return `<p class="item-line">${idx + 1}. 기둥 세트 x${item.quantity} · ${escapeHtml(
                columnMat?.name || "-"
              )} ${escapeHtml(columnSize)}${postBarInline ? ` · ${escapeHtml(postBarInline)}` : ""}${
                layoutInline ? ` · ${escapeHtml(layoutInline)}` : ""
              } · 금액 ${amountText}</p>`;
            }
            if (item.type === "bay") {
              const shelfMat = SYSTEM_SHELF_MATERIALS[item.shelf.materialId];
              const shelfSize = `${item.shelf.thickness}T / ${item.shelf.width}×${item.shelf.length}mm`;
              const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
              const { componentSummary, furnitureSummary } = buildAddonBreakdownFromIds(
                item.addons,
                "없음"
              );
              return `<p class="item-line">${idx + 1}. 시스템 수납장 모듈 x${item.quantity} · 선반 ${escapeHtml(
                shelfMat?.name || "-"
              )} ${escapeHtml(shelfSize)} ${item.shelf.count || 1}개 · 구성품 ${escapeHtml(
                componentSummary
              )} · 가구 ${escapeHtml(furnitureSummary)} · 금액 ${amountText}</p>`;
            }
            return "";
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
      <p>예상 결제금액: ${summary.grandTotal.toLocaleString()}원${
        state.items.some((item) => item.isCustomPrice) ? "(상담 필요 품목 미포함)" : ""
      }</p>
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
    bindPreviewAddTypePopoverDismissEvents();
    bindPreviewModuleActionPopoverDismissEvents();
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
    requestStickyOffsetUpdate();
  } catch (err) {
    console.error("init render failed", err);
  }

  $("#addEstimateBtn")?.addEventListener("click", commitBaysToEstimate);
  $("#closeSystemAddonModal")?.addEventListener("click", closeShelfAddonModalAndReturn);
  $("#systemAddonModalBackdrop")?.addEventListener("click", closeShelfAddonModalAndReturn);
  $("#closeCornerOptionModal")?.addEventListener("click", () => closeCornerOptionModalWithCleanup({ returnFocus: true }));
  $("#cornerOptionModalBackdrop")?.addEventListener("click", () => closeCornerOptionModalWithCleanup());
  $("#saveCornerOptionModal")?.addEventListener("click", saveCornerOptionModal);
  $("#removeCornerOptionModal")?.addEventListener("click", removeCornerFromModal);
  $("#cornerAddonBtn")?.addEventListener("click", () => {
    if (!activeCornerOptionId) return;
    closeModal("#cornerOptionModal");
    openShelfAddonModal(activeCornerOptionId, { returnTo: "corner" });
  });
  $("#closeBayOptionModal")?.addEventListener("click", () => closeBayOptionModalWithCleanup({ returnFocus: true }));
  $("#bayOptionModalBackdrop")?.addEventListener("click", () => closeBayOptionModalWithCleanup());
  $("#saveBayOptionModal")?.addEventListener("click", saveBayOptionModal);
  $("#removeBayOptionModal")?.addEventListener("click", removeBayFromModal);
  $("#bayWidthPresetSelect")?.addEventListener("change", () => {
    const presetSelect = $("#bayWidthPresetSelect");
    const customInput = $("#bayWidthCustomInput");
    if (!presetSelect || !customInput) return;
    const isCustom = presetSelect.value === "custom";
    customInput.classList.toggle("hidden", !isCustom);
    customInput.disabled = !isCustom;
    if (isCustom) customInput.focus();
    setFieldError(customInput, $("#bayWidthError"), "");
    renderBayOptionFrontPreview();
  });
  $("#bayAddonBtn")?.addEventListener("click", () => {
    if (!activeBayOptionId) return;
    closeModal("#bayOptionModal");
    openShelfAddonModal(activeBayOptionId, { returnTo: "bay" });
  });
  $("#closePreviewAddTypeModal")?.addEventListener("click", () => closePreviewAddTypePicker({ returnFocus: true }));
  $("#previewAddTypeModalBackdrop")?.addEventListener("click", () => closePreviewAddTypePicker());
  $("#previewAddNormalBtn")?.addEventListener("click", commitPreviewAddNormal);
  $("#previewAddCornerBtn")?.addEventListener("click", commitPreviewAddCorner);
  $("#closePreviewAddTypePopover")?.addEventListener("click", () => closePreviewAddTypePicker({ returnFocus: true }));
  $("#previewAddPopoverNormalBtn")?.addEventListener("click", () => handlePreviewAddPopoverTypeSelect("normal"));
  $("#previewAddPopoverCornerBtn")?.addEventListener("click", () => handlePreviewAddPopoverTypeSelect("corner"));
  $("#previewAddPopoverRootCornerRightBtn")?.addEventListener("click", () =>
    handlePreviewAddPopoverRootCornerDirectionSelect("right")
  );
  $("#previewAddPopoverRootCornerLeftBtn")?.addEventListener("click", () =>
    handlePreviewAddPopoverRootCornerDirectionSelect("left")
  );
  $("#previewAddPopoverPresetBtn")?.addEventListener("click", handlePreviewAddPopoverPresetSelect);
  $("#previewAddPopoverCustomBtn")?.addEventListener("click", handlePreviewAddPopoverCustomCompose);
  $("#previewAddPopoverBackBtn")?.addEventListener("click", handlePreviewAddPopoverBack);
  $("#previewAddPopoverRootCornerBackBtn")?.addEventListener("click", handlePreviewAddPopoverBack);
  $("#closePreviewModuleActionPopover")?.addEventListener("click", () =>
    closePreviewModuleActionPopover({ returnFocus: true })
  );
  $("#previewModuleActionPresetBtn")?.addEventListener("click", handlePreviewModuleActionPresetSelect);
  $("#previewModuleActionCustomBtn")?.addEventListener("click", handlePreviewModuleActionCustomCompose);
  $("#previewModuleActionRemoveBtn")?.addEventListener("click", handlePreviewModuleActionRemove);
  $("#closePreviewPresetModuleModal")?.addEventListener("click", () => closePreviewPresetModuleModal());
  $("#previewPresetModuleModalBackdrop")?.addEventListener("click", () => closePreviewPresetModuleModal());
  $("#applyPreviewPresetModuleModal")?.addEventListener("click", applySelectedPreviewPresetModule);
  $("#previewPresetModuleFilterOptions")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview-preset-filter]");
    if (!btn) return;
    handlePreviewPresetModuleFilterSelect(btn.dataset.previewPresetFilter);
  });
  $("#previewPresetModuleCards")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview-preset-id]");
    if (!btn) return;
    handlePreviewPresetModuleCardClick(btn);
  });
  $("#openPresetModulePickerBtn")?.addEventListener("click", openPresetPickerFromPresetModuleOptionModal);
  $("#presetModuleOptionFilterSelect")?.addEventListener("change", handlePresetModuleOptionFilterChange);
  $("#savePresetModuleOptionModal")?.addEventListener("click", savePresetModuleOptionModal);
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
  ["#sample6_postcode", "#sample6_address", "#sample6_detailAddress"].forEach((sel) => {
    $(sel)?.addEventListener("input", updateSendButtonEnabled);
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
    if (!eventTarget?.closest("#previewAddTypePopover")) {
      closePreviewAddTypePicker();
    }
    if (!eventTarget?.closest("#previewModuleActionPopover")) {
      closePreviewModuleActionPopover();
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
      closePreviewModuleActionPopover();
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
      openPreviewModuleActionPopover(cornerId, "corner", cornerTarget);
      return;
    }
    const bayTarget = eventTarget?.closest("[data-bay-preview]");
    if (!bayTarget) return;
    const shelfId = bayTarget.dataset.bayPreview;
    if (!shelfId) return;
    openPreviewModuleActionPopover(shelfId, "bay", bayTarget);
  });

  $$("[data-preview-info-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setPreviewInfoMode(btn.dataset.previewInfoMode, { rerender: true });
    });
  });
  syncPreviewInfoModeButtons();

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

  window.addEventListener("resize", requestStickyOffsetUpdate);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
} else {
  init();
}
