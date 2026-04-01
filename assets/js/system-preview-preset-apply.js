export function createSystemPreviewPresetApplyHelpers(deps = {}) {
  const {
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
    resolveInlineInsertPendingFirstSaveEdgeId,
    clearInlineInsertPendingFirstSaveEdgeId,
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
  } = deps;

  const resolveFilterKey = (selectedFilterKey, preset, fallbackValue) =>
    Math.max(1, Math.round(Number(selectedFilterKey || preset?.width || fallbackValue || 400) || 400));

  const applyPreviewPresetToExistingBay = (edgeId, preset, selectedFilterKey = "") => {
    const shelf = findShelfById(edgeId);
    if (!shelf || shelf.type !== "bay") {
      setPreviewPresetModuleError("변경 대상 일반 모듈을 찾을 수 없습니다.");
      return;
    }
    const nextWidth = resolveFilterKey(selectedFilterKey, preset, shelf.width);
    const nextCount = Math.max(1, Math.floor(Number(preset?.count || shelf.count || 1)));
    const nextRodCount = Math.max(0, Math.floor(Number(preset?.rodCount || 0)));
    const prevWidth = Number(shelf.width || 0);
    const prevCount = Number(shelf.count || 0);
    const prevRodCount = getShelfAddonQuantity(shelf.id, ADDON_CLOTHES_ROD_ID);
    const prevFurnitureAddonId = getSelectedFurnitureAddonId(shelf.id);
    const nextFurnitureAddonId = String(getPresetFurnitureAddonIds(preset)[0] || "");
    const wasPendingAdd = isPendingEdge(shelf);
    const shouldMergeWithInlineInsertHistory =
      String(resolveInlineInsertPendingFirstSaveEdgeId?.() || "") === String(shelf.id || "");

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
    if (shouldMergeWithInlineInsertHistory) clearInlineInsertPendingFirstSaveEdgeId?.();

    shelf.width = nextWidth;
    shelf.count = nextCount;
    shelf.composeTab = "preset";
    applyPresetAddonsToEdge(shelf.id, preset);
    closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
    renderBayInputs();
  };

  const applyPreviewPresetToExistingCorner = (edgeId, preset, selectedFilterKey = "") => {
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
  };

  const applyPreviewPresetNormalModule = (preset, selectedFilterKey = "") => {
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
      shelf.width = resolveFilterKey(selectedFilterKey, preset, shelf.width);
      shelf.count = Math.max(1, Math.floor(Number(preset?.count || shelf.count || 1)));
      shelf.composeTab = "preset";
      applyPresetAddonsToEdge(shelf.id, preset);
    }
    closePreviewPresetModuleModal({ returnFocus: false, clearTarget: true });
    renderBayInputs();
  };

  const applyPreviewPresetCornerModule = (preset, selectedFilterKey = "") => {
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
  };

  const applyPreviewPresetByContext = (
    preset,
    presetContext,
    type = previewPresetPickerFlowState.moduleType,
    selectedFilterKey = previewPresetPickerFlowState.filterKey
  ) => {
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
  };

  const applySelectedPreviewPresetModule = () => {
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
  };

  const handlePreviewPresetModuleCardClick = (buttonEl) => {
    if (typeof Element !== "undefined" && !(buttonEl instanceof Element)) return;
    const presetId = String(buttonEl?.dataset?.previewPresetId || "");
    const type = String(buttonEl?.dataset?.previewPresetType || previewPresetPickerFlowState.moduleType || "normal");
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
  };

  return {
    handlePreviewPresetModuleCardClick,
    applyPreviewPresetByContext,
    applySelectedPreviewPresetModule,
  };
}
