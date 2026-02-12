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
  shelf: { minWidth: 460, maxWidth: 1200, minLength: 200, maxLength: 2400 },
  column: { minLength: 1800, maxLength: 2700 },
};

const COLUMN_WIDTH_MM = 20;
const COLUMN_EXTRA_LENGTH_THRESHOLD = 2400;
const SHELF_LENGTH_MM = 600;
const SHELF_THICKNESS_MM = 18;
const COLUMN_THICKNESS_MM = 18;
const BAY_WIDTH_LIMITS = { min: 400, max: 800 };
const SUPPORT_THICKNESS_MM = 20;

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
  sides: [],
  corners: [],
  shelfAddons: {},
};

let currentPhase = 1;
let sendingEmail = false;
let orderCompleted = false;
let stickyOffsetTimer = null;
let activeShelfAddonId = null;
let activeCornerOptionId = null;
let activeBayOptionId = null;
let activePreviewAddTarget = null;

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

function getCornerFlags(shape) {
  const sideCount = getBayCountForShape(shape);
  if (shape === "box_shape") return new Array(sideCount).fill(true);
  if (shape === "u_shape") return [false, true, true];
  if (shape === "l_shape") return [false, true];
  return new Array(sideCount).fill(false);
}

function initShelfStateForShape(shape) {
  const sideCount = getBayCountForShape(shape);
  state.sides = Array.from({ length: sideCount }, (_, idx) => ({
    id: `side-${idx}`,
    shelves: [],
  }));
  state.corners = Array.from({ length: sideCount }, () => null);
}

function readCurrentInputs() {
  const shape = getSelectedShape();
  const spaces = readSpaceConfigs(shape);
  const shapeSizes = spaces.map((space) => Number(space.width || 0));
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
  return { shelf, column, shape, shapeSizes, spaces };
}

function readSpaceConfigs(shape) {
  const count = getBayCountForShape(shape);
  const spaces = [];
  for (let i = 0; i < count; i += 1) {
    const min = Number($(`#spaceMin-${i}`)?.value || 0);
    const max = Number($(`#spaceMax-${i}`)?.value || 0);
    const width = Number($(`#spaceWidth-${i}`)?.value || 0);
    const extraHeights = Array.from(
      document.querySelectorAll(`[data-space-extra-height="${i}"]`)
    )
      .map((input) => Number(input.value || 0))
      .filter((value) => value > 0);
    spaces.push({ min, max, width, extraHeights });
  }
  return spaces;
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

function getShapeLengthError(length) {
  if (!length) return "";
  if (length < LIMITS.shelf.minWidth) {
    return `구성 너비는 ${LIMITS.shelf.minWidth}mm 이상 입력해주세요.`;
  }
  return "";
}

function getShelfAddonIds(id) {
  return state.shelfAddons[id] || [];
}

function getCornerSizeAlongSide(sideIndex, swap) {
  const isHorizontal = sideIndex === 0 || sideIndex === 2;
  if (isHorizontal) return swap ? 600 : 800;
  return swap ? 800 : 600;
}

function getCornerAtEnd(sideIndex, shape) {
  const sideCount = getBayCountForShape(shape);
  const nextIndex = sideIndex + 1;
  if (shape !== "box_shape" && nextIndex >= sideCount) return null;
  return state.corners[nextIndex % sideCount];
}

function buildSideLengthItems(sideIndex, shape) {
  const items = [];
  const startCorner = state.corners[sideIndex];
  if (startCorner) {
    items.push({ width: getCornerSizeAlongSide(sideIndex, startCorner.swap) });
  }
  (state.sides[sideIndex]?.shelves || []).forEach((shelf) => {
    items.push({ width: shelf.width || 0 });
  });
  const endCorner = getCornerAtEnd(sideIndex, shape);
  if (endCorner && endCorner !== startCorner) {
    items.push({ width: getCornerSizeAlongSide(sideIndex, endCorner.swap) });
  }
  return items;
}

function buildSideShelfSequence(sideIndex) {
  const corner = state.corners[sideIndex];
  const shelves = state.sides[sideIndex]?.shelves || [];
  const sequence = [];
  if (corner) {
    const width = getCornerSizeAlongSide(sideIndex, corner.swap);
    sequence.push({
      id: corner.id,
      width,
      count: corner.count || 1,
      addons: getShelfAddonIds(corner.id),
      isCorner: true,
      sideIndex: corner.sideIndex,
    });
  }
  shelves.forEach((shelf) => {
    sequence.push({
      id: shelf.id,
      width: shelf.width || 0,
      count: shelf.count || 1,
      addons: getShelfAddonIds(shelf.id),
      isCorner: false,
    });
  });
  return sequence;
}

function getCornerLabel(corner) {
  const sideNumber = Number(corner?.sideIndex) + 1;
  return Number.isFinite(sideNumber) ? `코너 ${sideNumber}` : "코너";
}

function transitionShapeWithState(nextShape, ensureCornerIndex = null) {
  const currentShape = getSelectedShape();
  const prevSpaces = readSpaceConfigs(currentShape);
  const prevSides = state.sides.map((side) => ({
    shelves: (side.shelves || []).map((shelf) => ({ ...shelf })),
  }));
  const prevCorners = state.corners.map((corner) => (corner ? { ...corner } : null));

  initShelfStateForShape(nextShape);

  for (let i = 0; i < Math.min(prevSides.length, state.sides.length); i += 1) {
    state.sides[i].shelves = prevSides[i].shelves;
  }
  for (let i = 0; i < Math.min(prevCorners.length, state.corners.length); i += 1) {
    if (prevCorners[i] && state.corners[i]) {
      state.corners[i].swap = Boolean(prevCorners[i].swap);
      state.corners[i].count = Number(prevCorners[i].count || 1);
      if (prevCorners[i].id && prevCorners[i].id !== state.corners[i].id) {
        state.shelfAddons[state.corners[i].id] = state.shelfAddons[prevCorners[i].id] || [];
      }
    }
  }
  if (ensureCornerIndex !== null && state.corners[ensureCornerIndex]) {
    const corner = state.corners[ensureCornerIndex];
    corner.swap = false;
    corner.count = corner.count || 1;
  } else if (ensureCornerIndex !== null) {
    state.corners[ensureCornerIndex] = {
      id: `corner-${ensureCornerIndex}`,
      sideIndex: ensureCornerIndex,
      swap: false,
      count: 1,
    };
  }

  renderShapeSizeInputs();
  const nextCount = getBayCountForShape(nextShape);
  for (let i = 0; i < nextCount; i += 1) {
    const prev = prevSpaces[i] || { min: 0, max: 0, width: 0, extraHeights: [] };
    const minInput = $(`#spaceMin-${i}`);
    const maxInput = $(`#spaceMax-${i}`);
    const widthInput = $(`#spaceWidth-${i}`);
    if (minInput) minInput.value = prev.min > 0 ? String(prev.min) : "";
    if (maxInput) maxInput.value = prev.max > 0 ? String(prev.max) : "";
    if (widthInput) widthInput.value = prev.width > 0 ? String(prev.width) : "";
    setSpaceExtraHeights(i, prev.extraHeights || []);
  }
  document.querySelectorAll("#shapeCards .material-card").forEach((card) =>
    card.classList.remove("selected")
  );
  const nextShapeInput = document.querySelector(`input[name="systemShape"][value="${nextShape}"]`);
  if (nextShapeInput) {
    nextShapeInput.checked = true;
    nextShapeInput.closest(".material-card")?.classList.add("selected");
  }
  renderBayInputs();
}

function addShelfToSide(sideIndex, { atStart = false } = {}) {
  if (Number.isNaN(sideIndex)) return;
  const newShelf = {
    id: `shelf-${sideIndex}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    width: 400,
    count: 1,
  };
  if (atStart) {
    state.sides[sideIndex].shelves.unshift(newShelf);
  } else {
    state.sides[sideIndex].shelves.push(newShelf);
  }
  renderBayInputs();
  return newShelf.id;
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

function pushPreviewAddButton(list, entry) {
  const exists = list.some((it) => {
    if (it.sideIndex !== entry.sideIndex) return false;
    const dx = Math.abs((it.x || 0) - (entry.x || 0));
    const dy = Math.abs((it.y || 0) - (entry.y || 0));
    return dx < 10 && dy < 10;
  });
  if (!exists) list.push(entry);
}

function readBayInputs() {
  const bays = [];
  state.sides.forEach((_, sideIndex) => {
    buildSideShelfSequence(sideIndex).forEach((item) => bays.push(item));
  });
  return bays;
}

function validateInputs(input, bays) {
  const shelfMat = SYSTEM_SHELF_MATERIALS[input.shelf.materialId];
  const columnMat = SYSTEM_COLUMN_MATERIALS[input.column.materialId];
  const shapeSizes = input.shapeSizes || [];
  const spaces = input.spaces || [];

  if (!shapeSizes.length) return "구성 형태에 맞춰 너비를 입력해주세요.";
  for (let i = 0; i < spaces.length; i += 1) {
    const space = spaces[i];
    if (!space.min || !space.max) {
      return `섹션 ${i + 1}의 가장 낮은/높은 천장 높이를 입력해주세요.`;
    }
    if (space.min > space.max) {
      return `섹션 ${i + 1}의 가장 낮은 천장 높이는 가장 높은 천장 이하로 입력해주세요.`;
    }
    if (space.min < LIMITS.column.minLength || space.max < LIMITS.column.minLength) {
      return `섹션 ${i + 1}의 천장 높이는 ${LIMITS.column.minLength}mm 이상 입력해주세요.`;
    }
    if (space.min > LIMITS.column.maxLength || space.max > LIMITS.column.maxLength) {
      return `최대 천장 높이는 ${LIMITS.column.maxLength}mm 이하입니다.`;
    }
    if (!space.width) return `섹션 ${i + 1}의 너비를 입력해주세요.`;
    const shapeLengthError = getShapeLengthError(space.width);
    if (shapeLengthError) return shapeLengthError;
    const extraHeights = space.extraHeights || [];
    for (let j = 0; j < extraHeights.length; j += 1) {
      const h = Number(extraHeights[j] || 0);
      if (h < LIMITS.column.minLength || h > LIMITS.column.maxLength) {
        return `섹션 ${i + 1}의 개별높이는 ${LIMITS.column.minLength}~${LIMITS.column.maxLength}mm 범위여야 합니다.`;
      }
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
  for (let sideIndex = 0; sideIndex < state.sides.length; sideIndex += 1) {
    const sideLength = shapeSizes[sideIndex] || 0;
    const items = buildSideLengthItems(sideIndex, input.shape);
    const required =
      COLUMN_WIDTH_MM +
      items.reduce(
        (sum, item) => sum + (item.width + SUPPORT_THICKNESS_MM * 2) + COLUMN_WIDTH_MM,
        0
      );
    if (sideLength && required > sideLength) {
      return `너비 ${sideIndex + 1}의 선반 구성 길이가 너비를 초과했습니다.`;
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
  const spaces = input.spaces || [];
  spaces.forEach((space, idx) => {
    const minEl = $(`#spaceMin-${idx}`);
    const maxEl = $(`#spaceMax-${idx}`);
    const widthEl = $(`#spaceWidth-${idx}`);
    const heightError = $(`#spaceHeightError-${idx}`);
    const widthError = $(`#spaceWidthError-${idx}`);
    const extraError = $(`#spaceExtraError-${idx}`);

    let heightMsg = "";
    if (!space.min || !space.max) {
      heightMsg = `섹션 ${idx + 1}의 가장 낮은/높은 천장 높이를 입력해주세요.`;
    } else if (space.min > space.max) {
      heightMsg = `섹션 ${idx + 1}의 가장 낮은 천장 높이는 가장 높은 천장 이하로 입력해주세요.`;
    } else if (space.min < LIMITS.column.minLength || space.max < LIMITS.column.minLength) {
      heightMsg = `섹션 ${idx + 1}의 천장 높이는 ${LIMITS.column.minLength}mm 이상 입력해주세요.`;
    } else if (space.min > LIMITS.column.maxLength || space.max > LIMITS.column.maxLength) {
      heightMsg = `최대 천장 높이는 ${LIMITS.column.maxLength}mm 이하입니다.`;
    }
    setFieldError(minEl, heightError, heightMsg);
    setFieldError(maxEl, heightError, heightMsg);

    const widthMsg = getShapeLengthError(space.width);
    setFieldError(widthEl, widthError, widthMsg);

    const extraInputs = Array.from(document.querySelectorAll(`[data-space-extra-height="${idx}"]`));
    let extraMsg = "";
    extraInputs.forEach((inputEl) => {
      const value = Number(inputEl.value || 0);
      const invalid =
        value &&
        (value < LIMITS.column.minLength || value > LIMITS.column.maxLength);
      inputEl.classList.toggle("input-error", Boolean(invalid));
      if (!extraMsg && invalid) {
        extraMsg = `개별높이는 ${LIMITS.column.minLength}~${LIMITS.column.maxLength}mm 범위여야 합니다.`;
      }
    });
    if (!extraMsg && (space.extraHeights || []).length > 1) {
      extraMsg = "개별높이 2개 이상 입력 시 추가 비용이 발생합니다.";
    }
    if (extraError) {
      extraError.textContent = extraMsg;
      extraError.classList.toggle("error", Boolean(extraMsg));
    }
  });

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
        autoCalculatePrice();
        updateAddItemState();
      });
    });
  document
    .querySelectorAll(`[data-space-extra-remove="${spaceIndex}"]`)
    .forEach((btn) => {
      if (btn.dataset.bound === "true") return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", () => {
        btn.closest(".space-extra-row")?.remove();
        autoCalculatePrice();
        updateAddItemState();
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
          <input type="number" data-space-extra-height="${spaceIndex}" placeholder="개별높이 (1800~2700mm)" value="${Number(value)}" />
          <button type="button" class="ghost-btn" data-space-extra-remove="${spaceIndex}">삭제</button>
        </div>
      `
    )
    .join("");
  bindSpaceExtraHeightEvents(spaceIndex);
}

function getSideRequiredLength(sideIndex, shape, additionalShelfWidth = 0) {
  const items = buildSideLengthItems(sideIndex, shape);
  if (additionalShelfWidth > 0) {
    items.push({ width: additionalShelfWidth });
  }
  return (
    COLUMN_WIDTH_MM +
    items.reduce(
      (sum, item) => sum + (item.width + SUPPORT_THICKNESS_MM * 2) + COLUMN_WIDTH_MM,
      0
    )
  );
}

function updateShelfAddButtonState(input) {
  const shape = input.shape;
  const shapeSizes = (input.spaces || []).map((space) => Number(space.width || 0));
  document.querySelectorAll("[data-add-shelf]").forEach((btn) => {
    const sideIndex = Number(btn.dataset.addShelf);
    if (Number.isNaN(sideIndex)) return;
    const sideLength = Number(shapeSizes[sideIndex] || 0);
    const errorEl = document.querySelector(`[data-side-length-error="${sideIndex}"]`);
    let errorMsg = "";
    let disabled = false;

    if (!sideLength) {
      disabled = true;
      errorMsg = `너비 ${sideIndex + 1}을 입력하면 칸을 추가할 수 있습니다.`;
    } else {
      const currentRequired = getSideRequiredLength(sideIndex, shape, 0);
      const requiredWithNew = getSideRequiredLength(sideIndex, shape, BAY_WIDTH_LIMITS.min);
      if (currentRequired > sideLength) {
        disabled = true;
        errorMsg = `너비 ${sideIndex + 1}의 칸 구성 길이가 너비를 초과했습니다.`;
      } else if (requiredWithNew > sideLength) {
        disabled = true;
        errorMsg = `너비 ${sideIndex + 1}에 더 이상 칸을 추가할 수 없습니다.`;
      }
    }

    btn.disabled = disabled;
    setErrorMessage(errorEl, errorMsg);
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
  const textEl = $("#systemPreviewText");
  if (!frame || !shelvesEl || !textEl) return;
  frame.querySelectorAll(".system-column").forEach((col) => {
    col.style.display = "none";
  });

  const bays = readBayInputs();
  const hasShelfBase = Boolean(shelfMat && input.shelf.thickness);
  const hasColumn = Boolean(columnMat && input.column.minLength && input.column.maxLength);

  if (!hasShelfBase || !hasColumn) {
    textEl.textContent = "칸 사이즈를 입력하면 미리보기가 표시됩니다.";
    shelvesEl.innerHTML = "";
    return;
  }

  shelvesEl.innerHTML = "";
  textEl.textContent = `탑뷰 · 선반 깊이 400mm · 기둥 ${COLUMN_WIDTH_MM}mm`;

  const sideCount = getBayCountForShape(input.shape);
  const sideLengths = input.shapeSizes || [];
  const frameRect = frame.getBoundingClientRect();
  const frameW = frameRect.width || 260;
  const frameH = frameRect.height || 220;
  const depthMm = 400;

  const directions = [
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: -1 },
  ];

  const toInward = (dir) => ({ x: -dir.dy, y: dir.dx });
  const shelves = [];
  const addButtons = [];
  let cursorX = 0;
  let cursorY = 0;

  for (let sideIndex = 0; sideIndex < sideCount; sideIndex += 1) {
    const length = sideLengths[sideIndex] || 0;
    const dir = directions[sideIndex];
    const inward = toInward(dir);
    const sideEndX = cursorX + dir.dx * length;
    const sideEndY = cursorY + dir.dy * length;
    const hasStartCorner = Boolean(state.corners[sideIndex]);
    const hasEndCorner = Boolean(getCornerAtEnd(sideIndex, input.shape));
    const renderFromCornerEnd = !hasStartCorner && hasEndCorner;
    const renderDir = renderFromCornerEnd ? { dx: -dir.dx, dy: -dir.dy } : dir;
    const anchorX = renderFromCornerEnd ? sideEndX : cursorX;
    const anchorY = renderFromCornerEnd ? sideEndY : cursorY;
    const sequence = buildSideShelfSequence(sideIndex);
    const cornerAtEnd = getCornerAtEnd(sideIndex, input.shape);
    const cornerLenAtEnd = cornerAtEnd
      ? getCornerSizeAlongSide(sideIndex, cornerAtEnd.swap) + SUPPORT_THICKNESS_MM * 2
      : 0;
    const startOffset =
      COLUMN_WIDTH_MM +
      (renderFromCornerEnd && cornerLenAtEnd > 0 ? cornerLenAtEnd + COLUMN_WIDTH_MM : 0);
    let offset = startOffset;
    sequence.forEach((item) => {
      const widthMm = (item.width || 0) + SUPPORT_THICKNESS_MM * 2;
      const px = anchorX + renderDir.dx * offset;
      const py = anchorY + renderDir.dy * offset;

      if (item.isCorner) {
        const corner = state.corners[sideIndex];
        const prevSideIndex = (sideIndex - 1 + sideCount) % sideCount;
        const prevDir = directions[prevSideIndex];
        const prevInward = toInward(prevDir);
        const prevLegDir = { dx: -prevDir.dx, dy: -prevDir.dy };
        const prevLen =
          (corner ? getCornerSizeAlongSide(prevSideIndex, corner.swap) : item.width || 0) +
          SUPPORT_THICKNESS_MM * 2;
        const currentArm = buildRectBounds(
          anchorX + renderDir.dx * COLUMN_WIDTH_MM,
          anchorY + renderDir.dy * COLUMN_WIDTH_MM,
          renderDir,
          inward,
          widthMm,
          depthMm
        );
        const prevArmAnchorX = renderFromCornerEnd
          ? anchorX + renderDir.dx * COLUMN_WIDTH_MM
          : cursorX + prevLegDir.dx * COLUMN_WIDTH_MM;
        const prevArmAnchorY = renderFromCornerEnd
          ? anchorY + renderDir.dy * COLUMN_WIDTH_MM
          : cursorY + prevLegDir.dy * COLUMN_WIDTH_MM;
        const prevArm = buildRectBounds(
          prevArmAnchorX,
          prevArmAnchorY,
          prevLegDir,
          prevInward,
          prevLen,
          depthMm
        );
        shelves.push({
          id: item.id,
          isCorner: true,
          title: `${getCornerLabel(item)} 옵션 수정`,
          minX: Math.min(currentArm.minX, prevArm.minX),
          minY: Math.min(currentArm.minY, prevArm.minY),
          maxX: Math.max(currentArm.maxX, prevArm.maxX),
          maxY: Math.max(currentArm.maxY, prevArm.maxY),
          arms: [currentArm, prevArm],
        });
      } else {
        const rect = buildRectBounds(px, py, renderDir, inward, widthMm, depthMm);
        shelves.push({
          id: item.id,
          isCorner: false,
          title: "Bay 옵션 수정",
          minX: rect.minX,
          minY: rect.minY,
          maxX: rect.maxX,
          maxY: rect.maxY,
        });
      }
      offset += widthMm + COLUMN_WIDTH_MM;
    });

    if (sequence.length > 0) {
      const rawStartCornerIndex = renderFromCornerEnd ? sideIndex + 1 : sideIndex;
      const startCornerIndex =
        rawStartCornerIndex >= 0 && rawStartCornerIndex < sideCount
          ? rawStartCornerIndex
          : input.shape === "box_shape"
          ? ((rawStartCornerIndex % sideCount) + sideCount) % sideCount
          : -1;
      const rawEndCornerIndex = renderFromCornerEnd ? sideIndex : sideIndex + 1;
      const endCornerIndex =
        rawEndCornerIndex >= 0 && rawEndCornerIndex < sideCount
          ? rawEndCornerIndex
          : input.shape === "box_shape"
          ? ((rawEndCornerIndex % sideCount) + sideCount) % sideCount
          : -1;
      const startCorner = startCornerIndex >= 0 ? state.corners[startCornerIndex] : null;
      const endCorner = endCornerIndex >= 0 ? state.corners[endCornerIndex] : null;

      // Corner 접합부(닫힌 끝)에는 버튼을 만들지 않는다.
      if (!startCorner) {
        pushPreviewAddButton(addButtons, {
          sideIndex,
          cornerId: "",
          cornerIndex: startCornerIndex,
          prepend: true,
          x: anchorX + renderDir.dx * startOffset + inward.x * (depthMm / 2),
          y: anchorY + renderDir.dy * startOffset + inward.y * (depthMm / 2),
        });
      }

      if (!endCorner) {
        pushPreviewAddButton(addButtons, {
          sideIndex,
          cornerId: "",
          cornerIndex: endCornerIndex,
          prepend: false,
          x: anchorX + renderDir.dx * offset + inward.x * (depthMm / 2),
          y: anchorY + renderDir.dy * offset + inward.y * (depthMm / 2),
        });
      }
    }
    cursorX = sideEndX;
    cursorY = sideEndY;
  }

  let minX = 0;
  let maxX = 1;
  let minY = 0;
  let maxY = 1;
  if (shelves.length || addButtons.length) {
    const xPoints = [
      ...shelves.flatMap((s) => [s.minX, s.maxX]),
      ...addButtons.map((p) => p.x),
    ];
    const yPoints = [
      ...shelves.flatMap((s) => [s.minY, s.maxY]),
      ...addButtons.map((p) => p.y),
    ];
    minX = Math.min(...xPoints);
    maxX = Math.max(...xPoints);
    minY = Math.min(...yPoints);
    maxY = Math.max(...yPoints);
  }

  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);
  const scale = Math.min((frameW * 0.75) / rangeX, (frameH * 0.75) / rangeY);
  const tx = (frameW - rangeX * scale) / 2 - minX * scale;
  const ty = (frameH - rangeY * scale) / 2 - minY * scale;

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
      if (item.isCorner && item.arms?.length) {
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

  if (!shelves.length && !addButtons.length) {
    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "system-preview-add-btn";
    startBtn.dataset.addShelf = "0";
    startBtn.dataset.addRootStart = "true";
    startBtn.title = "첫 Bay 추가";
    startBtn.textContent = "+";
    startBtn.style.left = `${frameW / 2}px`;
    startBtn.style.top = `${frameH / 2}px`;
    shelvesEl.appendChild(startBtn);
  }

  addButtons.forEach((point) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "system-preview-add-btn";
    btn.dataset.addShelf = String(point.sideIndex);
    if (point.cornerId) btn.dataset.anchorCorner = point.cornerId;
    if (Number.isFinite(point.cornerIndex) && point.cornerIndex >= 0) {
      btn.dataset.anchorCornerIndex = String(point.cornerIndex);
    }
    if (point.prepend) btn.dataset.addPrepend = "true";
    btn.title = `너비 ${point.sideIndex + 1}에 칸 추가`;
    btn.textContent = "+";
    btn.style.left = `${point.x * scale + tx}px`;
    btn.style.top = `${point.y * scale + ty}px`;
    shelvesEl.appendChild(btn);
  });
}

function openPreviewAddTypeModal(sideIndex, cornerId = "", prepend = false, cornerIndex = -1) {
  if (Number.isNaN(sideIndex)) return;
  const hasCornerSlot = Number.isFinite(cornerIndex) && cornerIndex >= 0;
  activePreviewAddTarget = {
    sideIndex,
    cornerId: cornerId || "",
    prepend: Boolean(prepend),
    cornerIndex: hasCornerSlot ? cornerIndex : -1,
  };
  const cornerBtn = $("#previewAddCornerBtn");
  const errorEl = $("#previewAddTypeError");
  if (cornerBtn) cornerBtn.disabled = !(cornerId || hasCornerSlot);
  if (errorEl) {
    const hasCornerAction = Boolean(cornerId || hasCornerSlot);
    errorEl.textContent = hasCornerAction
      ? ""
      : "이 끝점에서는 코너 추가가 불가합니다. 일반 Bay를 추가해주세요.";
    errorEl.classList.toggle("error", !hasCornerAction);
  }
  openModal("#previewAddTypeModal", { focusTarget: "#previewAddTypeModalTitle" });
}

function commitPreviewAddNormal() {
  const sideIndex = Number(activePreviewAddTarget?.sideIndex);
  if (Number.isNaN(sideIndex)) return;
  const shelfId = addShelfToSide(sideIndex, {
    atStart: Boolean(activePreviewAddTarget?.prepend),
  });
  closeModal("#previewAddTypeModal");
  if (shelfId) openBayOptionModal(shelfId);
}

function commitPreviewAddCorner() {
  const cornerId = activePreviewAddTarget?.cornerId || "";
  if (cornerId) {
    closeModal("#previewAddTypeModal");
    openCornerOptionModal(cornerId);
    return;
  }
  const cornerIndex = Number(activePreviewAddTarget?.cornerIndex);
  if (Number.isFinite(cornerIndex) && cornerIndex >= 0) {
    if (!state.corners[cornerIndex]) {
      state.corners[cornerIndex] = {
        id: `corner-${cornerIndex}`,
        sideIndex: cornerIndex,
        swap: false,
        count: 1,
      };
    }
    closeModal("#previewAddTypeModal");
    renderBayInputs();
    openCornerOptionModal(state.corners[cornerIndex].id);
    return;
  }
  const errorEl = $("#previewAddTypeError");
  if (errorEl) {
    errorEl.textContent = "이 끝점에는 코너 Bay를 추가할 수 없습니다.";
    errorEl.classList.add("error");
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
  updateShelfAddButtonState(input);
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
    row.className = "bay-input";
    row.innerHTML = `
      <div class="bay-input-title">섹션 ${i + 1}</div>
      <div class="form-row">
        <label>가장 낮은 천장 높이 (mm)</label>
        <div class="field-col">
          <input type="number" id="spaceMin-${i}" placeholder="1800~2700mm" />
        </div>
      </div>
      <div class="form-row">
        <label>가장 높은 천장 높이 (mm)</label>
        <div class="field-col">
          <input type="number" id="spaceMax-${i}" placeholder="1800~2700mm" />
          <div class="error-msg" id="spaceHeightError-${i}"></div>
        </div>
      </div>
      <div class="form-row">
        <label>개별높이 (mm)</label>
        <div class="field-col">
          <button type="button" class="ghost-btn space-extra-add-btn" id="addSpaceExtra-${i}">개별높이 추가</button>
          <div id="spaceExtraList-${i}" class="field-stack"></div>
          <div class="field-note">개별높이 2개 이상 입력 시 추가 비용이 발생합니다.</div>
          <div class="error-msg" id="spaceExtraError-${i}"></div>
        </div>
      </div>
      <div class="form-row">
        <label>너비 (mm)</label>
        <div class="field-col">
          <input type="number" id="spaceWidth-${i}" placeholder="구성 너비 460mm 이상" />
          <div class="error-msg" id="spaceWidthError-${i}"></div>
        </div>
      </div>
    `;
    container.appendChild(row);
  }

  for (let i = 0; i < sideCount; i += 1) {
    [`#spaceMin-${i}`, `#spaceMax-${i}`, `#spaceWidth-${i}`].forEach((sel) => {
      $(sel)?.addEventListener("input", () => {
        autoCalculatePrice();
        updateAddItemState();
      });
    });
    $(`#addSpaceExtra-${i}`)?.addEventListener("click", () => {
      const list = $(`#spaceExtraList-${i}`);
      if (!list) return;
      const row = document.createElement("div");
      row.className = "space-extra-row";
      row.innerHTML = `
        <input type="number" data-space-extra-height="${i}" placeholder="개별높이 (1800~2700mm)" />
        <button type="button" class="ghost-btn" data-space-extra-remove="${i}">삭제</button>
      `;
      list.appendChild(row);
      bindSpaceExtraHeightEvents(i);
      autoCalculatePrice();
      updateAddItemState();
    });
  }
}

function renderBayInputs() {
  const container = $("#bayInputs");
  if (container) {
    container.innerHTML = "";
    const sideCount = state.sides.length;
    for (let sideIndex = 0; sideIndex < sideCount; sideIndex += 1) {
      const side = state.sides[sideIndex];
      const sideBlock = document.createElement("div");
      sideBlock.className = "bay-input";
      sideBlock.innerHTML = `
        <div class="bay-input-title">너비 ${sideIndex + 1} 선반</div>
        <div class="shelf-list" data-side-index="${sideIndex}"></div>
        <div class="error-msg" data-side-length-error="${sideIndex}"></div>
      `;
      container.appendChild(sideBlock);

      const list = sideBlock.querySelector(".shelf-list");
      if (!list) continue;

      const corner = state.corners[sideIndex];
      if (corner) {
        list.appendChild(buildCornerShelfItem(corner));
        renderShelfAddonSelection(corner.id);
      }

      side.shelves.forEach((shelf) => {
        list.appendChild(buildShelfItem(shelf));
        renderShelfAddonSelection(shelf.id);
      });
    }
  }
  bindShelfInputEvents();
  updateBayAddonAvailability();
  updatePreview();
  autoCalculatePrice();
}

function buildShelfItem(shelf) {
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
        <input type="number" class="bay-width-input" data-shelf-width="${shelf.id}" placeholder="직접 입력 (400~800mm)" value="${shelf.width || ""}" />
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
    <div class="bay-addon-section">
      <div class="addon-picker">
        <button type="button" data-shelf-addon-btn="${shelf.id}">구성품 선택</button>
        <button type="button" class="ghost-btn" data-shelf-remove="${shelf.id}">삭제</button>
      </div>
      <div id="selectedShelfAddon-${shelf.id}" class="selected-material-card addon-card-display"></div>
    </div>
  `;
  return el;
}

function buildCornerShelfItem(corner) {
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
    <div class="bay-addon-section">
      <div class="addon-picker">
        <button type="button" data-shelf-addon-btn="${corner.id}">구성품 선택</button>
      </div>
      <div id="selectedShelfAddon-${corner.id}" class="selected-material-card addon-card-display"></div>
    </div>
  `;
  return el;
}

function renderShelfAddonSelection(id) {
  renderSelectedAddonChips({
    targetId: `selectedShelfAddon-${id}`,
    emptyText: "선택된 구성품 없음",
    addons: getShelfAddonIds(id),
    allItems: SYSTEM_ADDON_ITEMS,
  });
}

function bindShelfInputEvents() {
  const container = $("#bayInputs");
  if (!container) return;
  container.querySelectorAll("[data-shelf-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.shelfRemove;
      if (!id) return;
      state.sides.forEach((side) => {
        side.shelves = side.shelves.filter((shelf) => shelf.id !== id);
      });
      delete state.shelfAddons[id];
      renderBayInputs();
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
      shelf.width = Number(widthInput.value || 0);
      updatePreview();
      autoCalculatePrice();
    });
  });

  container.querySelectorAll("[data-shelf-width]").forEach((input) => {
    input.addEventListener("input", () => {
      const id = input.dataset.shelfWidth;
      const shelf = findShelfById(id);
      if (shelf) shelf.width = Number(input.value || 0);
      updatePreview();
      autoCalculatePrice();
    });
  });

  container.querySelectorAll("[data-shelf-count]").forEach((input) => {
    input.addEventListener("input", () => {
      const id = input.dataset.shelfCount;
      const shelf = findShelfById(id);
      if (shelf) shelf.count = Number(input.value || 1);
      updatePreview();
      autoCalculatePrice();
    });
  });

  container.querySelectorAll("[data-corner-swap]").forEach((select) => {
    select.addEventListener("change", () => {
      const id = select.dataset.cornerSwap;
      const corner = state.corners.find((c) => c && c.id === id);
      if (!corner) return;
      corner.swap = select.value === "swap";
      updatePreview();
      autoCalculatePrice();
    });
  });
}

function findShelfById(id) {
  const corner = state.corners.find((c) => c && c.id === id);
  if (corner) return corner;
  for (const side of state.sides) {
    const shelf = side.shelves.find((s) => s.id === id);
    if (shelf) return shelf;
  }
  return null;
}

function syncCornerOptionModal() {
  if (!activeCornerOptionId) return;
  const corner = state.corners.find((c) => c && c.id === activeCornerOptionId);
  if (!corner) return;
  const titleEl = $("#cornerOptionModalTitle");
  const swapSelect = $("#cornerSwapSelect");
  const countInput = $("#cornerCountInput");
  const addonBtn = $("#cornerAddonBtn");
  const spaces = readSpaceConfigs(getSelectedShape());
  const hasColumnHeight =
    spaces.length > 0 &&
    spaces.every((space) => Number(space.min || 0) > 0 && Number(space.max || 0) > 0);
  if (titleEl) titleEl.textContent = `${getCornerLabel(corner)} 옵션 설정`;
  if (swapSelect) swapSelect.value = corner.swap ? "swap" : "default";
  if (countInput) countInput.value = String(corner.count || 1);
  if (addonBtn) addonBtn.disabled = !hasColumnHeight;
  setFieldError(countInput, $("#cornerCountError"), "");
}

function openCornerOptionModal(cornerId) {
  const corner = state.corners.find((c) => c && c.id === cornerId);
  if (!corner) return;
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
  const addonBtn = $("#bayAddonBtn");
  const spaces = readSpaceConfigs(getSelectedShape());
  const hasColumnHeight =
    spaces.length > 0 &&
    spaces.every((space) => Number(space.min || 0) > 0 && Number(space.max || 0) > 0);

  const width = Number(shelf.width || 0);
  const presetValue =
    width === 400 || width === 600 || width === 800 ? String(width) : "custom";

  if (titleEl) titleEl.textContent = "Bay 옵션 설정";
  if (presetSelect) presetSelect.value = presetValue;
  if (customInput) {
    customInput.classList.toggle("hidden", presetValue !== "custom");
    customInput.disabled = presetValue !== "custom";
    customInput.value = presetValue === "custom" ? String(width || "") : "";
  }
  if (countInput) countInput.value = String(shelf.count || 1);
  if (addonBtn) addonBtn.disabled = !hasColumnHeight;

  setFieldError(customInput, $("#bayWidthError"), "");
  setFieldError(countInput, $("#bayCountError"), "");
}

function openBayOptionModal(shelfId) {
  const shelf = findShelfById(shelfId);
  if (!shelf) return;
  activeBayOptionId = shelfId;
  syncBayOptionModal();
  openModal("#bayOptionModal", { focusTarget: "#bayOptionModalTitle" });
}

function saveBayOptionModal() {
  if (!activeBayOptionId) return;
  const shelf = findShelfById(activeBayOptionId);
  const presetSelect = $("#bayWidthPresetSelect");
  const customInput = $("#bayWidthCustomInput");
  const countInput = $("#bayCountInput");
  const widthError = $("#bayWidthError");
  const countError = $("#bayCountError");
  if (!shelf || !presetSelect || !countInput || !customInput) return;

  const isCustom = presetSelect.value === "custom";
  const width = Number((isCustom ? customInput.value : presetSelect.value) || 0);
  const count = Number(countInput.value || 0);

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

  shelf.width = width;
  shelf.count = count;
  closeModal("#bayOptionModal");
  renderBayInputs();
}

function removeBayFromModal() {
  if (!activeBayOptionId) return;
  const id = activeBayOptionId;
  state.sides.forEach((side) => {
    side.shelves = side.shelves.filter((shelf) => shelf.id !== id);
  });
  delete state.shelfAddons[id];
  activeBayOptionId = null;
  closeModal("#bayOptionModal");
  renderBayInputs();
}

function saveCornerOptionModal() {
  if (!activeCornerOptionId) return;
  const corner = state.corners.find((c) => c && c.id === activeCornerOptionId);
  const swapSelect = $("#cornerSwapSelect");
  const countInput = $("#cornerCountInput");
  const countError = $("#cornerCountError");
  if (!corner || !swapSelect || !countInput) return;

  const count = Number(countInput.value || 0);
  if (!count || count < 1) {
    setFieldError(countInput, countError, "선반 갯수는 1개 이상이어야 합니다.");
    return;
  }

  corner.swap = swapSelect.value === "swap";
  corner.count = count;
  closeModal("#cornerOptionModal");
  renderBayInputs();
}

function removeCornerFromModal() {
  if (!activeCornerOptionId) return;
  const idx = state.corners.findIndex((corner) => corner && corner.id === activeCornerOptionId);
  if (idx === -1) return;
  delete state.shelfAddons[activeCornerOptionId];
  state.corners[idx] = null;
  activeCornerOptionId = null;
  closeModal("#cornerOptionModal");
  renderBayInputs();
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
    if (!input || !activeShelfAddonId) return;
    const id = input.value;
    const selected = new Set(state.shelfAddons[activeShelfAddonId] || []);
    if (input.checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }
    state.shelfAddons[activeShelfAddonId] = Array.from(selected);
    input.closest(".option-card")?.classList.toggle("selected", input.checked);
    renderShelfAddonSelection(activeShelfAddonId);
    autoCalculatePrice();
    updateAddItemState();
  });
}

function syncSystemAddonModalSelection() {
  const container = $("#systemAddonCards");
  if (!container || !activeShelfAddonId) return;
  const selected = new Set(state.shelfAddons[activeShelfAddonId] || []);
  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const isSelected = selected.has(input.value);
    input.checked = isSelected;
    input.closest(".option-card")?.classList.toggle("selected", isSelected);
  });
}

function openShelfAddonModal(id) {
  activeShelfAddonId = id;
  syncSystemAddonModalSelection();
  openModal("#systemAddonModal", { focusTarget: "#systemAddonModalTitle" });
}

function updateBayAddonAvailability() {
  const spaces = readSpaceConfigs(getSelectedShape());
  const hasColumnHeight =
    spaces.length > 0 &&
    spaces.every((space) => {
      if (!space.min || !space.max) return false;
      if (space.min > space.max) return false;
      if (space.min < LIMITS.column.minLength || space.max < LIMITS.column.minLength) return false;
      if (space.min > LIMITS.column.maxLength || space.max > LIMITS.column.maxLength) return false;
      return true;
    });
  document.querySelectorAll("[data-shelf-addon-btn]").forEach((btn) => {
    btn.disabled = !hasColumnHeight;
  });
  if (!hasColumnHeight) {
    state.shelfAddons = {};
    state.sides.forEach((side) => {
      side.shelves.forEach((shelf) => renderShelfAddonSelection(shelf.id));
    });
    state.corners.forEach((corner) => {
      if (corner) renderShelfAddonSelection(corner.id);
    });
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

  initShelfStateForShape(getSelectedShape());
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
  $("#closeCornerOptionModal")?.addEventListener("click", () => closeModal("#cornerOptionModal"));
  $("#cornerOptionModalBackdrop")?.addEventListener("click", () => closeModal("#cornerOptionModal"));
  $("#saveCornerOptionModal")?.addEventListener("click", saveCornerOptionModal);
  $("#removeCornerOptionModal")?.addEventListener("click", removeCornerFromModal);
  $("#cornerAddonBtn")?.addEventListener("click", () => {
    if (!activeCornerOptionId) return;
    closeModal("#cornerOptionModal");
    openShelfAddonModal(activeCornerOptionId);
  });
  $("#closeBayOptionModal")?.addEventListener("click", () => closeModal("#bayOptionModal"));
  $("#bayOptionModalBackdrop")?.addEventListener("click", () => closeModal("#bayOptionModal"));
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
  });
  $("#bayAddonBtn")?.addEventListener("click", () => {
    if (!activeBayOptionId) return;
    closeModal("#bayOptionModal");
    openShelfAddonModal(activeBayOptionId);
  });
  $("#closePreviewAddTypeModal")?.addEventListener("click", () => closeModal("#previewAddTypeModal"));
  $("#previewAddTypeModalBackdrop")?.addEventListener("click", () => closeModal("#previewAddTypeModal"));
  $("#previewAddNormalBtn")?.addEventListener("click", commitPreviewAddNormal);
  $("#previewAddCornerBtn")?.addEventListener("click", commitPreviewAddCorner);
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

  $("#systemPreviewShelves")?.addEventListener("click", (e) => {
    const addTarget = e.target.closest("[data-add-shelf]");
    if (addTarget) {
      const sideIndex = Number(addTarget.dataset.addShelf);
      const cornerId = addTarget.dataset.anchorCorner || "";
      const prepend = addTarget.dataset.addPrepend === "true";
      const cornerIndex = Number(addTarget.dataset.anchorCornerIndex || -1);
      openPreviewAddTypeModal(sideIndex, cornerId, prepend, cornerIndex);
      return;
    }
    const cornerTarget = e.target.closest("[data-corner-preview]");
    if (cornerTarget) {
      const cornerId = cornerTarget.dataset.cornerPreview;
      if (!cornerId) return;
      openCornerOptionModal(cornerId);
      return;
    }
    const bayTarget = e.target.closest("[data-bay-preview]");
    if (!bayTarget) return;
    const shelfId = bayTarget.dataset.bayPreview;
    if (!shelfId) return;
    openBayOptionModal(shelfId);
  });

  document.querySelectorAll('input[name="systemShape"]').forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelectorAll("#shapeCards .material-card").forEach((card) =>
        card.classList.remove("selected")
      );
      input.closest(".material-card")?.classList.add("selected");
      initShelfStateForShape(getSelectedShape());
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
