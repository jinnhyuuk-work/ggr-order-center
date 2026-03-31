export function createSystemEdgeSaveRemoveHelpers(deps = {}) {
  const {
    state,
    $,
    MODULE_SHELF_WIDTH_LIMITS,
    ADDON_CLOTHES_ROD_ID = "clothes_rod",
    getActiveBayOptionId,
    setActiveBayOptionId,
    getActiveCornerOptionId,
    setActiveCornerOptionId,
    findShelfById,
    setFieldError,
    getCornerCustomCutValidationState,
    setCornerCustomCutError,
    getShelfAddonQuantity,
    setShelfAddonQuantity,
    isPendingEdge,
    pushBuilderHistory,
    getInlineInsertPendingFirstSaveEdgeId,
    setInlineInsertPendingFirstSaveEdgeId,
    setBayDirectComposeDraft,
    setCornerDirectComposeDraft,
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
  } = deps;

  const saveBayOptionModal = () => {
    const activeBayOptionId = getActiveBayOptionId();
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
    const rodCount = Number.isFinite(rodCountRaw) ? Math.max(0, Math.floor(rodCountRaw)) : 0;

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
    const inlineInsertPendingFirstSaveEdgeId = getInlineInsertPendingFirstSaveEdgeId();
    const shouldMergeWithInlineInsertHistory =
      !wasPendingAdd && String(inlineInsertPendingFirstSaveEdgeId || "") === String(shelf.id || "");
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
      setInlineInsertPendingFirstSaveEdgeId("");
    }
    shelf.width = width;
    shelf.count = count;
    shelf.composeTab = "custom";
    setShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID, rodCount);
    enforceFurnitureAddonPolicyForEdge(shelf.id);
    if (typeof setBayDirectComposeDraft === "function") setBayDirectComposeDraft(null);
    closePresetModuleOptionModal({ returnFocus: false, clearState: true });
    renderBayInputs();
  };

  const reanchorChildrenAfterEdgeRemoval = (removedEdge) => {
    if (!removedEdge?.id) return;
    const removedId = String(removedEdge.id);
    const { startAliases, endAliases } = getEdgeEndpointAliasSets(removedEdge);
    const orphanEdges = getOrderedGraphEdges({ includePending: true }).filter((edge) => {
      if (!edge || edge.id === removedId) return false;
      const anchorId = String(edge.anchorEndpointId || "");
      if (!anchorId) return false;
      return startAliases.has(anchorId) || endAliases.has(anchorId) || anchorId.startsWith(`${removedId}:`);
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
      const targetAnchor = resolveAnchorForDirection(replacementAnchor);
      edge.anchorEndpointId = targetAnchor || replacementAnchor || "root-endpoint";
      if (edge.anchorEndpointId === "root-endpoint") {
        applyRootAnchorVector(edge, preferredDir || { dx: 1, dy: 0 }, preferredInward);
      } else {
        clearRootAnchorVector(edge);
      }
      edge.placement = null;
    });
  };

  const removeBayById = (id) => {
    if (!id) return;
    ensureGraph();
    const removed = state.graph?.edges?.[id];
    if (!removed) return;
    pushBuilderHistory("remove-normal");
    reanchorChildrenAfterEdgeRemoval(removed);
    unregisterEdge(id);
    normalizeDanglingAnchorIds();
    delete state.shelfAddons[id];
    if (getActiveBayOptionId() === id) setActiveBayOptionId("");
    if (String(getInlineInsertPendingFirstSaveEdgeId() || "") === String(id || "")) {
      setInlineInsertPendingFirstSaveEdgeId("");
    }
    renderBayInputs();
  };

  const saveCornerOptionModal = () => {
    const activeCornerOptionId = getActiveCornerOptionId();
    if (!activeCornerOptionId) return;
    const corner = findShelfById(activeCornerOptionId);
    const swapSelect = $("#cornerSwapSelect");
    const countInput = $("#cornerCountInput");
    const rodCountInput = $("#cornerRodCountInput");
    const countError = $("#cornerCountError");
    if (!corner || !swapSelect || !countInput) return;

    const count = Number(countInput.value || 0);
    const rodCountRaw = Number(rodCountInput?.value || 0);
    const rodCount = Number.isFinite(rodCountRaw) ? Math.max(0, Math.floor(rodCountRaw)) : 0;
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
    if (typeof setCornerDirectComposeDraft === "function") setCornerDirectComposeDraft(null);
    closePresetModuleOptionModal({ returnFocus: false, clearState: true });
    renderBayInputs();
  };

  const removeCornerById = (id) => {
    if (!id) return;
    ensureGraph();
    if (!state.graph?.edges?.[id] || state.graph.edges[id].type !== "corner") return;
    pushBuilderHistory("remove-corner");
    const removed = state.graph.edges[id];
    reanchorChildrenAfterEdgeRemoval(removed);
    unregisterEdge(id);
    normalizeDanglingAnchorIds();
    delete state.shelfAddons[id];
    if (getActiveCornerOptionId() === id) setActiveCornerOptionId("");
    renderBayInputs();
  };

  return {
    saveBayOptionModal,
    reanchorChildrenAfterEdgeRemoval,
    removeBayById,
    saveCornerOptionModal,
    removeCornerById,
  };
}
