import {
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  SYSTEM_MATERIAL_CATEGORIES_DESC,
  SYSTEM_CUSTOM_PROCESSING,
  SYSTEM_ADDON_ITEMS,
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
  renderSelectedAddonChips,
  initCollapsibleSections,
} from "./shared.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const LIMITS = {
  shelf: { minWidth: 100, maxWidth: 1200, minLength: 200, maxLength: 2400 },
  column: { minLength: 1800, maxLength: 2700 },
};

const COLUMN_WIDTH_MM = 50;
const COLUMN_EXTRA_LENGTH_THRESHOLD = 2400;
const SHELF_LENGTH_MM = 600;
const SHELF_THICKNESS_MM = 18;
const COLUMN_THICKNESS_MM = 18;

const SHAPE_LABELS = {
  i_single: "ㅣ자형",
  i_double: "ㅣㅣ자형",
  l_shape: "ㄱ자형",
  u_shape: "ㄷ자형",
  box_shape: "ㅁ자형",
};

const SHAPE_BAY_COUNTS = {
  i_single: 1,
  i_double: 2,
  l_shape: 2,
  u_shape: 3,
  box_shape: 4,
};

const state = {
  items: [],
  bayCount: 1,
  bayAddons: [],
};

let currentPhase = 1;
let sendingEmail = false;
let orderCompleted = false;
let stickyOffsetTimer = null;
let activeBayAddonIndex = null;

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
  return document.querySelector('input[name="systemShape"]:checked')?.value || "i_single";
}

function getBayCountForShape(shape) {
  return SHAPE_BAY_COUNTS[shape] || 1;
}

function readCurrentInputs() {
  const shape = getSelectedShape();
  const columnMinLength = Number($("#columnLengthMinInput")?.value || 0);
  const columnMaxLength = Number($("#columnLengthMaxInput")?.value || 0);
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
  };
  const shapeSizes = readShapeSizes(shape);
  return { shelf, column, shape, shapeSizes };
}

function readShapeSizes(shape) {
  const count = getBayCountForShape(shape);
  const sizes = [];
  for (let i = 0; i < count; i += 1) {
    const length = Number($(`#shapeSize-${i}`)?.value || 0);
    sizes.push(length);
  }
  return sizes;
}

function readBayInputs() {
  const count = state.bayCount;
  const bays = [];
  for (let i = 0; i < count; i += 1) {
    const width = Number($(`#bayWidth-${i}`)?.value || 0);
    const shelfCount = Math.max(1, Number($(`#bayCount-${i}`)?.value || 1));
    const customProcessing = Boolean($(`#bayCustom-${i}`)?.checked);
    const addons = state.bayAddons[i] || [];
    bays.push({
      width,
      count: shelfCount,
      customProcessing,
      addons,
    });
  }
  return bays;
}

function validateInputs(input, bays) {
  const shelfMat = SYSTEM_SHELF_MATERIALS[input.shelf.materialId];
  const columnMat = SYSTEM_COLUMN_MATERIALS[input.column.materialId];
  const shapeSizes = input.shapeSizes || [];
  const columnMin = input.column.minLength || 0;
  const columnMax = input.column.maxLength || 0;

  if (!columnMin || !columnMax) return "가장 낮은/높은 천장 높이를 입력해주세요.";
  if (columnMin > columnMax) return "가장 낮은 천장 높이는 가장 높은 천장 이하로 입력해주세요.";
  if (!shapeSizes.length) return "구성 형태에 맞춰 변 길이를 입력해주세요.";
  for (let i = 0; i < shapeSizes.length; i += 1) {
    if (!shapeSizes[i]) return `변 ${i + 1} 길이를 입력해주세요.`;
    if (shapeSizes[i] < LIMITS.shelf.minWidth) {
      return `변 ${i + 1} 길이는 ${LIMITS.shelf.minWidth}mm 이상 입력해주세요.`;
    }
  }

  if (!input.column.materialId) return "기둥 컬러를 선택해주세요.";
  if (!input.shelf.materialId) return "선반 컬러를 선택해주세요.";

  const shelfLimits = LIMITS.shelf;
  for (let i = 0; i < bays.length; i += 1) {
    const bay = bays[i];
    if (!bay.width) return `칸 ${i + 1} 선반 폭을 입력해주세요.`;
    if (!bay.count || bay.count < 1) return `칸 ${i + 1} 선반 갯수를 입력해주세요.`;
    if (bay.width < shelfLimits.minWidth) {
      return `칸 ${i + 1} 선반 폭은 ${shelfLimits.minWidth}mm 이상 입력해주세요.`;
    }
    if (bay.width > shelfLimits.maxWidth && !bay.customProcessing) {
      return `칸 ${i + 1} 선반 비규격 가공을 선택해주세요.`;
    }
  }
  if (SHELF_LENGTH_MM > shelfLimits.maxLength) {
    return "선반 비규격 가공을 확인해주세요.";
  }

  const columnLimits = LIMITS.column;
  if (columnMin < columnLimits.minLength || columnMax < columnLimits.minLength) {
    return `천장 높이는 ${columnLimits.minLength}mm 이상 입력해주세요.`;
  }
  if (columnMin > columnLimits.maxLength || columnMax > columnLimits.maxLength) {
    return `천장 높이는 ${columnLimits.maxLength}mm 이하입니다.`;
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
  if (!bays.length) return "구성 형태에 맞춰 칸 사이즈를 입력해주세요.";
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
  const shelfLimits = LIMITS.shelf;
  const columnLimits = LIMITS.column;
  const columnMinEl = $("#columnLengthMinInput");
  const columnMaxEl = $("#columnLengthMaxInput");
  const columnLengthError = $("#columnLengthError");
  const shapeSizes = input.shapeSizes || [];
  const columnMin = input.column.minLength || 0;
  const columnMax = input.column.maxLength || 0;

  let columnLengthMsg = "";
  if (columnMin && columnMin < columnLimits.minLength) {
    columnLengthMsg = `천장 높이는 ${columnLimits.minLength}mm 이상 입력해주세요.`;
  } else if (columnMax && columnMax < columnLimits.minLength) {
    columnLengthMsg = `천장 높이는 ${columnLimits.minLength}mm 이상 입력해주세요.`;
  } else if (columnMin && columnMin > columnLimits.maxLength) {
    columnLengthMsg = `천장 높이는 ${columnLimits.maxLength}mm 이하입니다.`;
  } else if (columnMax && columnMax > columnLimits.maxLength) {
    columnLengthMsg = `천장 높이는 ${columnLimits.maxLength}mm 이하입니다.`;
  } else if (columnMin && columnMax && columnMin > columnMax) {
    columnLengthMsg = "가장 낮은 천장 높이는 가장 높은 천장 이하로 입력해주세요.";
  }
  setFieldError(columnMinEl, columnLengthError, columnLengthMsg);
  setFieldError(columnMaxEl, columnLengthError, columnLengthMsg);

  shapeSizes.forEach((length, idx) => {
    const lengthEl = $(`#shapeSize-${idx}`);
    const lengthError = $(`#shapeSizeError-${idx}`);
    const lengthMsg =
      length && length < shelfLimits.minWidth
        ? `변 길이는 ${shelfLimits.minWidth}mm 이상 입력해주세요.`
        : "";
    setFieldError(lengthEl, lengthError, lengthMsg);
  });

  bays.forEach((bay, idx) => {
    const widthEl = $(`#bayWidth-${idx}`);
    const countEl = $(`#bayCount-${idx}`);
    const widthError = $(`#bayWidthError-${idx}`);
    const countError = $(`#bayCountError-${idx}`);
    const widthMsg =
      bay.width && bay.width < shelfLimits.minWidth
        ? `선반 폭은 ${shelfLimits.minWidth}mm 이상 입력해주세요.`
        : bay.width > shelfLimits.maxWidth && !bay.customProcessing
        ? `선반 폭은 ${shelfLimits.maxWidth}mm 이하입니다.`
        : "";
    const countMsg = bay.count < 1 ? "선반 갯수는 1개 이상이어야 합니다." : "";
    setFieldError(widthEl, widthError, widthMsg);
    setFieldError(countEl, countError, countMsg);
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

function calcColumnsDetail({ column, count, quantity }) {
  const columnIsCustom = isColumnCustom(column.length);
  const totalCount = (quantity || 1) * count;
  const extraLengthFee =
    column.length >= COLUMN_EXTRA_LENGTH_THRESHOLD
      ? SYSTEM_CUSTOM_PROCESSING.column_over_2400.price * totalCount
      : 0;
  const columnDetail = calcPartDetail({
    materials: SYSTEM_COLUMN_MATERIALS,
    materialId: column.materialId,
    thickness: column.thickness,
    width: column.width,
    length: column.length,
    quantity,
    partMultiplier: count,
    isCustom: columnIsCustom,
  });

  const materialCost = columnDetail.materialCost;
  const processingCost =
    extraLengthFee;
  const subtotal = materialCost + processingCost;
  const vat = 0;
  const total = Math.round(subtotal);
  const weightKg = columnDetail.weightKg;
  const isCustomPrice = columnIsCustom;

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
  const columnLeftEl = $("#systemPreviewColumnLeft");
  const columnRightEl = $("#systemPreviewColumnRight");
  const textEl = $("#systemPreviewText");
  if (!frame || !shelvesEl || !columnLeftEl || !columnRightEl || !textEl) return;

  const bays = readBayInputs();
  const hasShelf = Boolean(shelfMat && input.shelf.thickness && bays.length);
  const hasColumn = Boolean(
    columnMat &&
      input.column.minLength &&
      input.column.maxLength &&
      input.column.thickness
  );

  if (!hasShelf || !hasColumn) {
    textEl.textContent = "칸 사이즈를 입력하면 미리보기가 표시됩니다.";
    [columnLeftEl, columnRightEl].forEach((el) => {
      el.style.width = "0px";
      el.style.height = "0px";
      el.style.left = "50%";
      el.style.top = "50%";
      el.style.background = "#ddd";
    });
    shelvesEl.innerHTML = "";
    frame.querySelectorAll(".system-column").forEach((col) => {
      if (col !== columnLeftEl && col !== columnRightEl) col.remove();
    });
  } else {
    frame.querySelectorAll(".system-column").forEach((col) => {
      if (col !== columnLeftEl && col !== columnRightEl) col.remove();
    });
    const bayCount = bays.length;
    textEl.textContent =
      `선반 ${shelfMat.name} / ${input.shelf.thickness}T / ` +
      `${SHELF_LENGTH_MM}mm 고정 · ${bayCount}칸 · ` +
      `기둥 ${columnMat.name} / ${input.column.thickness}T / ` +
      `${input.column.width}×${input.column.minLength}~${input.column.maxLength}mm`;

    const frameRect = frame.getBoundingClientRect();
    const frameW = frameRect.width || 260;
    const frameH = frameRect.height || 220;

    const totalShelfWidthMm = bays.reduce((sum, bay) => sum + bay.width, 0);
    const columnHeightMm = input.column.length;
    const columnWidthMm = input.column.width;
    const shelfThicknessMm = input.shelf.thickness;

    let scale = Math.min(
      (frameW * 0.8) / (totalShelfWidthMm + columnWidthMm * (bayCount + 1)),
      (frameH * 0.7) / columnHeightMm
    );
    let columnHeightPx = Math.max(80, columnHeightMm * scale);
    let columnWidthPx = Math.max(10, columnWidthMm * scale);
    const shelfWidthsPx = bays.map((bay) => Math.max(30, bay.width * scale));
    const shelfThicknessPx = Math.min(Math.max(10, shelfThicknessMm * scale * 1.2), columnHeightPx * 0.3);

    const totalWidthPx =
      shelfWidthsPx.reduce((sum, width) => sum + width, 0) +
      columnWidthPx * (bayCount + 1);
    if (totalWidthPx > frameW * 0.9) {
      const shrink = (frameW * 0.9) / totalWidthPx;
      for (let i = 0; i < shelfWidthsPx.length; i += 1) {
        shelfWidthsPx[i] *= shrink;
      }
      columnWidthPx *= shrink;
    }
    if (columnHeightPx > frameH * 0.85) {
      const shrink = (frameH * 0.85) / columnHeightPx;
      columnHeightPx *= shrink;
    }

    const centerX = frameW / 2;
    const baseY = frameH / 2 + columnHeightPx / 2;
    const columnTop = baseY - columnHeightPx;

    shelvesEl.innerHTML = "";
    const totalWidthPxAdjusted =
      shelfWidthsPx.reduce((sum, width) => sum + width, 0) +
      columnWidthPx * (bayCount + 1);
    const startX = centerX - totalWidthPxAdjusted / 2;

    const columnCount = bayCount + 1;
    [columnLeftEl, columnRightEl].forEach((el) => {
      el.style.width = "0px";
      el.style.height = "0px";
    });

    for (let i = 0; i < columnCount; i += 1) {
      const column = i === 0 ? columnLeftEl : i === columnCount - 1 ? columnRightEl : document.createElement("div");
      if (i !== 0 && i !== columnCount - 1) {
        column.className = "system-column";
        frame.appendChild(column);
      }
      const offset = shelfWidthsPx.slice(0, i).reduce((sum, width) => sum + width, 0);
      column.style.width = `${columnWidthPx}px`;
      column.style.height = `${columnHeightPx}px`;
      column.style.left = `${startX + columnWidthPx * i + offset}px`;
      column.style.top = `${columnTop}px`;
      column.style.background = columnMat.swatch || "#ddd";
    }

    let shelfOffsetX = startX + columnWidthPx;
    bays.forEach((bay, bayIndex) => {
      const shelfCount = Math.max(1, Number(bay.count || 1));
      const gap = columnHeightPx / (shelfCount + 1);
      for (let row = 0; row < shelfCount; row += 1) {
        const shelfTop = columnTop + gap * (row + 1) - shelfThicknessPx / 2;
        const shelf = document.createElement("div");
        shelf.className = "system-shelf";
        shelf.style.width = `${shelfWidthsPx[bayIndex]}px`;
        shelf.style.height = `${shelfThicknessPx}px`;
        shelf.style.left = `${shelfOffsetX}px`;
        shelf.style.top = `${shelfTop}px`;
        shelf.style.background = shelfMat.swatch || "#ddd";
        shelvesEl.appendChild(shelf);
      }
      shelfOffsetX += shelfWidthsPx[bayIndex] + columnWidthPx;
    });
  }

  const shapeSummary = $("#previewShapeSummary");
  if (shapeSummary) shapeSummary.textContent = SHAPE_LABELS[input.shape] || "구성 미선택";
  const customSummary = $("#previewCustomSummary");
  if (customSummary) {
    const hasCustom =
      bays.some((bay) => isShelfCustom(bay.width, bay.customProcessing)) ||
      isColumnCustom(input.column.length);
    customSummary.textContent = hasCustom ? "비규격 포함" : "비규격 없음";
  }
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
  const err = validateInputs(input, bays);
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
      return {
        materialCost: acc.materialCost + detail.materialCost,
        processingCost: acc.processingCost + detail.processingCost,
        total: acc.total + detail.total,
        isCustomPrice: acc.isCustomPrice || detail.isCustomPrice,
      };
    },
    { materialCost: 0, processingCost: 0, total: 0, isCustomPrice: false }
  );
  const columnDetail = calcColumnsDetail({
    column: input.column,
    count: bays.length + 1,
    quantity: 1,
  });
  const totalPrice = bayTotals.total + columnDetail.total;
  const isCustom = bayTotals.isCustomPrice || columnDetail.isCustomPrice;
  if (isCustom) {
    $("#itemPriceDisplay").textContent = "금액: 상담 안내";
  } else {
    $("#itemPriceDisplay").textContent =
      `금액: ${totalPrice.toLocaleString()}원 ` +
      `(자재비 ${bayTotals.materialCost.toLocaleString()} + 구성품 ${bayTotals.processingCost.toLocaleString()} + 기둥 ${columnDetail.total.toLocaleString()})`;
  }
  updateAddItemState();
}

function renderShapeSizeInputs() {
  const shape = getSelectedShape();
  const sideCount = getBayCountForShape(shape);
  const container = $("#shapeSizeInputs");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < sideCount; i += 1) {
    const row = document.createElement("div");
    row.className = "form-row";
    row.innerHTML = `
      <label>변 ${i + 1} 길이 (mm)</label>
      <div class="field-col">
        <input type="number" id="shapeSize-${i}" placeholder="길이 100mm 이상" />
        <div class="error-msg" id="shapeSizeError-${i}"></div>
      </div>
    `;
    container.appendChild(row);
  }

  for (let i = 0; i < sideCount; i += 1) {
    $(`#shapeSize-${i}`)?.addEventListener("input", () => {
      autoCalculatePrice();
      updateAddItemState();
    });
  }
}

function renderBayInputs(presetBays = null) {
  const bayCount = state.bayCount;
  const sizeContainer = $("#bayInputs");
  if (!sizeContainer) return;
  const prevBays = presetBays || readBayInputs();
  state.bayAddons = prevBays.map((bay) => bay.addons || []);
  while (state.bayAddons.length < bayCount) {
    state.bayAddons.push([]);
  }
  sizeContainer.innerHTML = "";
  for (let i = 0; i < bayCount; i += 1) {
    const previous = prevBays[i];
    const bayBlock = document.createElement("div");
    bayBlock.className = "bay-input";
    bayBlock.innerHTML = `
      <div class="bay-input-title">칸 ${i + 1}</div>
      <div class="form-row">
        <label>선반 폭 (mm)</label>
        <div class="field-col">
          <select id="bayWidthPreset-${i}" class="thickness-select">
            <option value="">선택</option>
            <option value="400">400</option>
            <option value="600">600</option>
            <option value="800">800</option>
            <option value="custom">직접 입력</option>
          </select>
          <input type="number" id="bayWidth-${i}" placeholder="직접 입력" value="${previous?.width || ""}" />
          <div class="error-msg" id="bayWidthError-${i}"></div>
        </div>
      </div>
      <div class="form-row">
        <label>선반 갯수</label>
        <div class="field-col">
          <input type="number" id="bayCount-${i}" min="1" value="${previous?.count || 1}" />
          <div class="error-msg" id="bayCountError-${i}"></div>
        </div>
      </div>
      <div class="form-row">
        <label>선반 비규격 가공</label>
        <div class="field-col">
          <label class="consent-check">
            <input type="checkbox" id="bayCustom-${i}" ${previous?.customProcessing ? "checked" : ""} />
            규격 외 사이즈 요청
          </label>
        </div>
      </div>
      <div class="bay-addon-section">
        <div class="addon-picker">
          <button type="button" data-bay-addon-btn="${i}">구성품 선택</button>
        </div>
        <div id="selectedBayAddon-${i}" class="selected-material-card addon-card-display"></div>
      </div>
    `;
    sizeContainer.appendChild(bayBlock);
    renderBayAddonSelection(i);
  }

  for (let i = 0; i < bayCount; i += 1) {
    const presetSelect = $(`#bayWidthPreset-${i}`);
    const widthInput = $(`#bayWidth-${i}`);
    const previous = prevBays[i];
    if (presetSelect && widthInput) {
      const presetValue =
        previous?.width === 400 || previous?.width === 600 || previous?.width === 800
          ? String(previous.width)
          : previous?.width
          ? "custom"
          : "";
      presetSelect.value = presetValue;
      const isCustom = presetValue === "custom";
      widthInput.disabled = !isCustom;
      widthInput.classList.toggle("hidden", !isCustom);
      if (!isCustom) {
        widthInput.value = presetValue || "";
      }
      presetSelect.addEventListener("change", () => {
        if (presetSelect.value === "custom") {
          widthInput.value = "";
          widthInput.disabled = false;
          widthInput.classList.remove("hidden");
          widthInput.focus();
        } else {
          widthInput.value = presetSelect.value || "";
          widthInput.disabled = presetSelect.value !== "";
          widthInput.classList.add("hidden");
        }
        syncBayCustomProcessing(i);
        updatePreview();
        autoCalculatePrice();
      });
    }

    widthInput?.addEventListener("input", () => {
      syncBayCustomProcessing(i);
      updatePreview();
      autoCalculatePrice();
    });
    $(`#bayCount-${i}`)?.addEventListener("input", () => {
      updatePreview();
      autoCalculatePrice();
    });
    $(`#bayCustom-${i}`)?.addEventListener("change", () => {
      updatePreview();
      autoCalculatePrice();
    });
    const addonBtn = sizeContainer.querySelector(`[data-bay-addon-btn="${i}"]`);
    addonBtn?.addEventListener("click", () => openBayAddonModal(i));
  }
  updateBayAddonAvailability();
  updatePreview();
  autoCalculatePrice();
  const removeBtn = $("#removeBayBtn");
  if (removeBtn) removeBtn.disabled = state.bayCount <= 1;
}

function renderBayAddonSelection(index) {
  renderSelectedAddonChips({
    targetId: `selectedBayAddon-${index}`,
    emptyText: "선택된 구성품 없음",
    addons: state.bayAddons[index] || [],
    allItems: SYSTEM_ADDON_ITEMS,
  });
}

function renderSystemAddonModalCards() {
  const container = $("#systemAddonCards");
  if (!container) return;
  container.innerHTML = "";
  SYSTEM_ADDON_ITEMS.forEach((item) => {
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
    if (!input || activeBayAddonIndex === null) return;
    const id = input.value;
    const selected = new Set(state.bayAddons[activeBayAddonIndex] || []);
    if (input.checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }
    state.bayAddons[activeBayAddonIndex] = Array.from(selected);
    input.closest(".option-card")?.classList.toggle("selected", input.checked);
    renderBayAddonSelection(activeBayAddonIndex);
    autoCalculatePrice();
    updateAddItemState();
  });
}

function syncSystemAddonModalSelection() {
  const container = $("#systemAddonCards");
  if (!container || activeBayAddonIndex === null) return;
  const selected = new Set(state.bayAddons[activeBayAddonIndex] || []);
  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const isSelected = selected.has(input.value);
    input.checked = isSelected;
    input.closest(".option-card")?.classList.toggle("selected", isSelected);
  });
}

function openBayAddonModal(index) {
  activeBayAddonIndex = index;
  syncSystemAddonModalSelection();
  openModal("#systemAddonModal", { focusTarget: "#systemAddonModalTitle" });
}

function syncBayCustomProcessing(index) {
  const width = Number($(`#bayWidth-${index}`)?.value || 0);
  const checkbox = $(`#bayCustom-${index}`);
  if (!checkbox) return;
  const needsCustom = width > LIMITS.shelf.maxWidth;
  checkbox.checked = needsCustom || checkbox.checked;
  checkbox.disabled = needsCustom;
}

function updateBayAddonAvailability() {
  const columnMin = Number($("#columnLengthMinInput")?.value || 0);
  const columnMax = Number($("#columnLengthMaxInput")?.value || 0);
  const hasColumnHeight = columnMin > 0 && columnMax > 0;
  const bayCount = state.bayCount;
  for (let i = 0; i < bayCount; i += 1) {
    const btn = document.querySelector(`[data-bay-addon-btn="${i}"]`);
    if (btn) btn.disabled = !hasColumnHeight;
    if (!hasColumnHeight) {
      state.bayAddons[i] = [];
      renderBayAddonSelection(i);
    }
  }
  if (!hasColumnHeight) {
    autoCalculatePrice();
    updateAddItemState();
  }
}

function commitBaysToEstimate() {
  const input = readCurrentInputs();
  const bays = readBayInputs();
  const err = validateEstimateInputs(input, bays);
  if (err) {
    showInfoModal(err);
    return;
  }
  const groupId = crypto.randomUUID();
  const columnCount = bays.length + 1;
  const columnDetail = calcColumnsDetail({
    column: input.column,
    count: columnCount,
    quantity: 1,
  });
  state.items.push({
    id: `columns-${groupId}`,
    type: "columns",
    groupId,
    count: columnCount,
    column: { ...input.column },
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
    const detail = calcBayDetail({
      shelf,
      addons: bay.addons,
      quantity: 1,
    });
    state.items.push({
      id: crypto.randomUUID(),
      type: "bay",
      groupId,
      shelf,
      addons: bay.addons,
      quantity: 1,
      ...detail,
    });
  });

  updatePreview();
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
        return "시스템 수납장 칸";
      }
      return "시스템 수납장";
    },
    getTotalText: (item) => (item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`),
    getDetailLines: (item) => {
      if (item.type === "columns") {
        const columnMat = SYSTEM_COLUMN_MATERIALS[item.column.materialId];
        const columnSize = formatColumnSize(item.column);
        const lines = [
          `기둥 ${escapeHtml(columnMat?.name || "-")} · ${escapeHtml(columnSize)} · ${item.count}개`,
        ];
        if (item.isCustomPrice) lines.push("비규격 상담 안내");
        if (Number.isFinite(item.materialCost)) {
          lines.push(`자재비 ${item.materialCost.toLocaleString()}원`);
        }
        if (Number.isFinite(item.processingCost)) {
          lines.push(`가공비 ${item.processingCost.toLocaleString()}원`);
        }
        return lines;
      }
      if (item.type === "bay") {
        const shelfMat = SYSTEM_SHELF_MATERIALS[item.shelf.materialId];
        const shelfSize = `${item.shelf.thickness}T / ${item.shelf.width}×${item.shelf.length}mm`;
        const addons = item.addons
          .map((id) => SYSTEM_ADDON_ITEMS.find((a) => a.id === id)?.name)
          .filter(Boolean)
          .join(", ");
        const lines = [
          `선반 ${escapeHtml(shelfMat?.name || "-")} · ${escapeHtml(shelfSize)} · ${item.shelf.count || 1}개`,
          `구성품 ${escapeHtml(addons || "-")}`,
        ];
        if (item.isCustomPrice) lines.push("비규격 상담 안내");
        if (Number.isFinite(item.materialCost)) {
          lines.push(`자재비 ${item.materialCost.toLocaleString()}원`);
        }
        if (Number.isFinite(item.processingCost)) {
          lines.push(`구성품 ${item.processingCost.toLocaleString()}원`);
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
              const detail = calcColumnsDetail({
                column: columnItem.column,
                count: columnCount,
                quantity: columnItem.quantity,
              });
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
        showInfoModal("기둥 세트는 칸 수에 따라 자동 계산됩니다.");
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
    const detail = calcColumnsDetail({
      column: item.column,
      count: item.count,
      quantity,
    });
    state.items[idx] = { ...item, quantity, ...detail };
    renderTable();
    renderSummary();
    return;
  }
  if (item.type === "bay") {
    const detail = calcBayDetail({
      shelf: item.shelf,
      addons: item.addons,
      quantity,
    });
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
        lines.push(
          `${idx + 1}. 기둥 세트 x${item.quantity} | ${columnMat?.name || "-"} ${columnSize} ${item.count}개 | 금액 ${amountText}`
        );
        return;
      }
      if (item.type === "bay") {
        const shelfMat = SYSTEM_SHELF_MATERIALS[item.shelf.materialId];
        const shelfSize = `${item.shelf.thickness}T / ${item.shelf.width}×${item.shelf.length}mm`;
        const addons = item.addons
          .map((id) => SYSTEM_ADDON_ITEMS.find((a) => a.id === id)?.name)
          .filter(Boolean)
          .join(", ");
        const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
        lines.push(
          `${idx + 1}. 시스템 수납장 칸 x${item.quantity} | ` +
            `선반 ${shelfMat?.name || "-"} ${shelfSize} ${item.shelf.count || 1}개 | ` +
            `구성품 ${addons || "-"} | 금액 ${amountText}`
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
  ["stepShape", "stepColumnMaterial", "stepShelfMaterial", "stepBayConfig", "stepPreview"].forEach(
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
  const stepBayConfig = $("#stepBayConfig");
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
    [stepShape, stepColumn, stepShelf, stepBayConfig, stepPreview, step5, actionCard].forEach(
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

  [stepShape, stepColumn, stepShelf, stepBayConfig, stepPreview, actionCard].forEach((el) => {
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
              return `<p class="item-line">${idx + 1}. 기둥 세트 x${item.quantity} · ${escapeHtml(
                columnMat?.name || "-"
              )} ${escapeHtml(columnSize)} ${item.count}개 · 금액 ${amountText}</p>`;
            }
            if (item.type === "bay") {
              const shelfMat = SYSTEM_SHELF_MATERIALS[item.shelf.materialId];
              const shelfSize = `${item.shelf.thickness}T / ${item.shelf.width}×${item.shelf.length}mm`;
              const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
              const addons = item.addons
                .map((id) => SYSTEM_ADDON_ITEMS.find((a) => a.id === id)?.name)
                .filter(Boolean)
                .join(", ");
              return `<p class="item-line">${idx + 1}. 시스템 수납장 칸 x${item.quantity} · 선반 ${escapeHtml(
                shelfMat?.name || "-"
              )} ${escapeHtml(shelfSize)} ${item.shelf.count || 1}개 · 구성품 ${escapeHtml(
                addons || "-"
              )} · 금액 ${amountText}</p>`;
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

  initEmailJS();
  resetOrderCompleteUI();
  initCollapsibleSections();
  renderSystemAddonModalCards();

  Object.values(materialPickers).forEach((picker) => {
    picker.categories = buildCategories(picker.materials);
    picker.selectedCategory = picker.categories[0] || "기타";
    renderMaterialTabs(picker);
    renderMaterialCards(picker);
    updateSelectedMaterialCard(picker);
    updateThicknessOptions(picker);
  });

  renderShapeSizeInputs();
  renderBayInputs();
  renderTable();
  renderSummary();
  updatePreview();
  autoCalculatePrice();
  updateBayAddonAvailability();
  updateAddItemState();
  updateStepVisibility();
  requestStickyOffsetUpdate();

  $("#addEstimateBtn")?.addEventListener("click", commitBaysToEstimate);
  $("#closeSystemAddonModal")?.addEventListener("click", () => closeModal("#systemAddonModal"));
  $("#systemAddonModalBackdrop")?.addEventListener("click", () => closeModal("#systemAddonModal"));
  $("#addBayBtn")?.addEventListener("click", () => {
    const prevBays = readBayInputs();
    state.bayCount += 1;
    renderBayInputs(prevBays);
  });
  $("#removeBayBtn")?.addEventListener("click", () => {
    if (state.bayCount <= 1) return;
    const prevBays = readBayInputs();
    state.bayCount -= 1;
    renderBayInputs(prevBays.slice(0, state.bayCount));
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
      updatePreview();
      autoCalculatePrice();
    });
  });

  ["#columnLengthMinInput", "#columnLengthMaxInput"].forEach((sel) => {
    $(sel)?.addEventListener("input", () => {
      updatePreview();
      autoCalculatePrice();
      updateBayAddonAvailability();
    });
  });

  document.querySelectorAll('input[name="systemShape"]').forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelectorAll("#shapeCards .material-card").forEach((card) =>
        card.classList.remove("selected")
      );
      input.closest(".material-card")?.classList.add("selected");
      renderShapeSizeInputs();
      renderBayInputs();
      updateBayAddonAvailability();
      updatePreview();
      autoCalculatePrice();
    });
  });

  const initialShape = document.querySelector('input[name="systemShape"]:checked');
  initialShape?.closest(".material-card")?.classList.add("selected");

  window.addEventListener("resize", requestStickyOffsetUpdate);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
} else {
  init();
}
