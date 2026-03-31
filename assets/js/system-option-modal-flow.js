export function createSystemOptionModalFlowHelpers(deps = {}) {
  const {
    $,
    ADDON_CLOTHES_ROD_ID = "clothes_rod",
    findShelfById,
    getActiveCornerOptionId,
    setActiveCornerOptionId,
    getCornerDirectComposeDraft,
    setCornerDirectComposeDraft,
    clearFurnitureAddonsForEdge,
    getShelfAddonQuantity,
    syncCornerCustomCutInputsUI,
    setFieldError,
    setCornerCustomCutError,
    updateCornerOptionModalApplyButtonState,
    renderCornerOptionFrontPreview,
    buildPresetModuleOptionOpenFromDirectComposeEdge,
    clonePreviewAddTargetSnapshot,
    getPreviewAddAnchorElement,
    openPresetModuleOptionModal,
    getActiveBayOptionId,
    setActiveBayOptionId,
    getInlineInsertPendingFirstSaveEdgeId,
    setInlineInsertPendingFirstSaveEdgeId,
    getBayDirectComposeDraft,
    setBayDirectComposeDraft,
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
  } = deps;

  const syncCornerOptionModal = () => {
    const activeCornerOptionId = getActiveCornerOptionId();
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
    const cornerDirectComposeDraft = getCornerDirectComposeDraft();
    const draft =
      cornerDirectComposeDraft && String(cornerDirectComposeDraft.edgeId || "") === String(corner.id)
        ? cornerDirectComposeDraft
        : null;
    if (swapSelect) {
      const fallbackMode = corner.customProcessing ? "custom" : corner.swap ? "swap" : "default";
      const nextMode = String(draft?.swapValue || fallbackMode);
      swapSelect.value =
        nextMode === "custom" || nextMode === "swap" || nextMode === "default"
          ? nextMode
          : fallbackMode;
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
        (Number(corner.customSecondaryMm || 0) > 0 ? String(corner.customSecondaryMm) : "600");
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
  };

  const openCornerOptionModal = (
    cornerId,
    { preserveDraft = false, backContext = null, initialTab = "" } = {}
  ) => {
    const corner = findShelfById(cornerId);
    if (!corner) return;
    const cornerDirectComposeDraft = getCornerDirectComposeDraft();
    if (
      !preserveDraft ||
      !cornerDirectComposeDraft ||
      String(cornerDirectComposeDraft.edgeId || "") !== String(cornerId)
    ) {
      setCornerDirectComposeDraft(null);
    }
    const resolvedInitialTab =
      initialTab === "custom" || initialTab === "preset"
        ? initialTab
        : corner.composeTab === "preset" || corner.composeTab === "custom"
          ? corner.composeTab
          : "custom";
    setActiveCornerOptionId(cornerId);
    const nextOpen = buildPresetModuleOptionOpenFromDirectComposeEdge({
      moduleType: "corner",
      edgeId: cornerId,
      preserveDraft,
      initialTab: resolvedInitialTab,
      backContext,
      cloneTargetSnapshot: clonePreviewAddTargetSnapshot,
      fallbackReturnFocusEl: getPreviewAddAnchorElement(),
    });
    if (!nextOpen) return;
    openPresetModuleOptionModal(nextOpen.moduleType, nextOpen.options);
  };

  const syncBayOptionModal = () => {
    const activeBayOptionId = getActiveBayOptionId();
    if (!activeBayOptionId) return;
    const shelf = findShelfById(activeBayOptionId);
    if (!shelf) return;
    const furnitureCleared = enforceFurnitureAddonPolicyForEdge(shelf.id, { modalReturnTo: "bay" });
    const presetSelect = $("#bayWidthPresetSelect");
    const customInput = $("#bayWidthCustomInput");
    const countInput = $("#bayCountInput");
    const rodCountInput = $("#bayRodCountInput");
    const bayDirectComposeDraft = getBayDirectComposeDraft();
    const draft =
      bayDirectComposeDraft && String(bayDirectComposeDraft.edgeId || "") === String(shelf.id)
        ? bayDirectComposeDraft
        : null;

    const width = Number(shelf.width || 0);
    const presetValue =
      draft?.presetValue || (width === 400 || width === 600 || width === 800 ? String(width) : "custom");

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
    const initialWidthMm =
      presetValue === "custom"
        ? Number(customInput?.value || width || 0)
        : Number(presetValue || width || 0);
    syncBayOptionFurnitureSelectionAvailability(initialWidthMm);

    setFieldError(customInput, $("#bayWidthError"), "");
    setFieldError(countInput, $("#bayCountError"), "");
    updateBayOptionModalApplyButtonState();
    renderBayOptionFrontPreview();
  };

  const openBayOptionModal = (
    shelfId,
    { preserveDraft = false, backContext = null, initialTab = "" } = {}
  ) => {
    const shelf = findShelfById(shelfId);
    if (!shelf) return;
    const inlineInsertPendingFirstSaveEdgeId = getInlineInsertPendingFirstSaveEdgeId();
    if (inlineInsertPendingFirstSaveEdgeId && String(inlineInsertPendingFirstSaveEdgeId) !== String(shelfId)) {
      setInlineInsertPendingFirstSaveEdgeId("");
    }
    const bayDirectComposeDraft = getBayDirectComposeDraft();
    if (
      !preserveDraft ||
      !bayDirectComposeDraft ||
      String(bayDirectComposeDraft.edgeId || "") !== String(shelfId)
    ) {
      setBayDirectComposeDraft(null);
    }
    const resolvedInitialTab =
      initialTab === "custom" || initialTab === "preset"
        ? initialTab
        : shelf.composeTab === "preset" || shelf.composeTab === "custom"
          ? shelf.composeTab
          : "custom";
    setActiveBayOptionId(shelfId);
    const nextOpen = buildPresetModuleOptionOpenFromDirectComposeEdge({
      moduleType: "normal",
      edgeId: shelfId,
      preserveDraft,
      initialTab: resolvedInitialTab,
      backContext,
      cloneTargetSnapshot: clonePreviewAddTargetSnapshot,
      fallbackReturnFocusEl: getPreviewAddAnchorElement(),
    });
    if (!nextOpen) return;
    openPresetModuleOptionModal(nextOpen.moduleType, nextOpen.options);
  };

  const buildModalDraftAddonBreakdown = (edgeId, rodCount) => {
    const normalizedRodCount = Math.max(0, Math.floor(Number(rodCount || 0)));
    if (!edgeId) {
      return {
        componentSummary: "-",
        furnitureSummary: "-",
        rodCount: normalizedRodCount,
        furnitureAddonId: "",
      };
    }
    const baseAddonIds = getShelfAddonIds(edgeId).filter((addonId) => addonId !== ADDON_CLOTHES_ROD_ID);
    return {
      componentSummary: buildRodAddonSummary(normalizedRodCount, "-"),
      furnitureSummary: buildFurnitureAddonSummary(baseAddonIds, "-"),
      rodCount: normalizedRodCount,
      furnitureAddonId: String(baseAddonIds[0] || ""),
    };
  };

  const getModuleOptionAverageHeightMm = () => {
    const input = readCurrentInputs();
    const layout = getLayoutConfigSnapshot(input);
    const lowest = Number(layout.lowestHeightMm || 0);
    const highest = Number(layout.highestHeightMm || 0);
    if (lowest > 0 && highest > 0) return Math.round((lowest + highest) / 2);
    if (highest > 0) return Math.round(highest);
    if (lowest > 0) return Math.round(lowest);
    return 0;
  };

  const bindOptionModalFrontPreviewEvents = () => {
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
  };

  return {
    syncCornerOptionModal,
    openCornerOptionModal,
    syncBayOptionModal,
    openBayOptionModal,
    buildModalDraftAddonBreakdown,
    getModuleOptionAverageHeightMm,
    bindOptionModalFrontPreviewEvents,
  };
}
