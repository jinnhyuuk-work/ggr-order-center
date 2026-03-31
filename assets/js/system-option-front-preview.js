export function createSystemOptionFrontPreviewHelpers(deps = {}) {
  const {
    $,
    resolveActiveBayOptionId,
    resolveActiveCornerOptionId,
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
  } = deps;

  const renderBayOptionFrontPreview = () => {
    const container = $("#bayOptionFrontPreview");
    if (!container) return;
    const activeBayOptionId = resolveActiveBayOptionId();
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
  };

  const renderCornerOptionFrontPreview = () => {
    const container = $("#cornerOptionFrontPreview");
    if (!container) return;
    const activeCornerOptionId = resolveActiveCornerOptionId();
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
  };

  return {
    renderBayOptionFrontPreview,
    renderCornerOptionFrontPreview,
  };
}
