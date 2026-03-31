export function renderShapeSizeInputsView({
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
} = {}) {
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
      <label for="spaceMin-${i}">가장 낮은 천장 높이 (mm)</label>
      <div class="field-col">
        <input type="number" id="spaceMin-${i}" placeholder="${LIMITS.column.minLength}mm 이상" value="${Number(previousSpace.min || 0) > 0 ? Number(previousSpace.min) : ""}" />
      </div>
    </div>
    <div class="form-row">
      <label for="spaceMax-${i}">가장 높은 천장 높이 (mm)</label>
      <div class="field-col">
        <input type="number" id="spaceMax-${i}" placeholder="${LIMITS.column.minLength}mm 이상" value="${Number(previousSpace.max || 0) > 0 ? Number(previousSpace.max) : ""}" />
        <div class="error-msg" id="spaceHeightError-${i}"></div>
      </div>
    </div>
    <div class="form-row">
      <label for="addSpaceExtra-${i}">개별높이 (mm)</label>
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

export function bindShelfInputEventsView({
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
} = {}) {
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
