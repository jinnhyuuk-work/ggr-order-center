export function createSystemPreviewPresetPickerHelpers(deps = {}) {
  const {
    SYSTEM_MODULE_PRESETS = {},
    SYSTEM_MODULE_OPTION_CONFIG = {},
    SYSTEM_MODULE_PRESET_CATEGORIES = [],
    SWATCH_FALLBACK = "#d9d9d9",
    $,
    escapeHtml,
    buildMaterialVisualInlineStyle,
    resolvePresetModulePriceInfo,
    buildPresetAddonBreakdownFromPreset,
    patchPreviewPresetPickerFlowState,
    buildPreviewPresetPickerVisibleSelectionPatch,
    findShelfById,
    getPreviewPresetPickerFlowState,
    getPreviewPresetModuleCategoryFilterKey,
    setPreviewPresetModuleCategoryFilterKey,
  } = deps;

  const getPreviewPresetItemsForType = (type = "") => {
    const key = type === "corner" ? "corner" : "normal";
    return Array.isArray(SYSTEM_MODULE_PRESETS[key]) ? SYSTEM_MODULE_PRESETS[key] : [];
  };

  const getPreviewPresetFilterKeysForItem = (
    item,
    type = getPreviewPresetPickerFlowState().moduleType
  ) => {
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
  };

  const getPreviewPresetFilterKeyForItem = (
    item,
    type = getPreviewPresetPickerFlowState().moduleType
  ) => String(getPreviewPresetFilterKeysForItem(item, type)[0] || "");

  const isPreviewPresetAvailableForFilter = (
    item,
    filterKey,
    type = getPreviewPresetPickerFlowState().moduleType
  ) => {
    const key = String(filterKey || "");
    if (!key) return true;
    return getPreviewPresetFilterKeysForItem(item, type).includes(key);
  };

  const getPreviewPresetFilterOptions = (type = getPreviewPresetPickerFlowState().moduleType) => {
    if (type === "corner") {
      const keys = new Set(
        getPreviewPresetItemsForType("corner").flatMap((item) =>
          getPreviewPresetFilterKeysForItem(item, "corner")
        )
      );
      return (SYSTEM_MODULE_OPTION_CONFIG.corner?.directionOptions || [])
        .map((option) => ({
          key: String(option.key || ""),
          label: String(option.label || option.key || ""),
        }))
        .filter((option) => keys.has(option.key));
    }
    const keys = new Set(
      getPreviewPresetItemsForType("normal").flatMap((item) =>
        getPreviewPresetFilterKeysForItem(item, "normal")
      )
    );
    return (SYSTEM_MODULE_OPTION_CONFIG.normal?.widthOptions || [])
      .map((width) => String(Math.round(Number(width || 0))))
      .filter((key) => key && keys.has(key))
      .map((key) => ({ key, label: key }));
  };

  const getWidthFilteredPreviewPresetItems = () => {
    const flowState = getPreviewPresetPickerFlowState();
    const items = getPreviewPresetItemsForType(flowState.moduleType);
    if (!flowState.filterKey) return items;
    return items.filter((item) =>
      isPreviewPresetAvailableForFilter(item, flowState.filterKey, flowState.moduleType)
    );
  };

  const getPreviewPresetCategoryFilterOptions = (
    widthFilteredItems = getWidthFilteredPreviewPresetItems()
  ) => {
    const items = Array.isArray(widthFilteredItems) ? widthFilteredItems : [];
    const usedCategoryKeys = new Set(items.map((item) => String(item?.categoryKey || "")).filter(Boolean));
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
  };

  const renderPreviewPresetModuleCategoryTabs = (
    widthFilteredItems = getWidthFilteredPreviewPresetItems()
  ) => {
    const container = $("#previewPresetModuleCategoryTabs");
    if (!container) return;
    const options = getPreviewPresetCategoryFilterOptions(widthFilteredItems);
    const currentKey = String(getPreviewPresetModuleCategoryFilterKey() || "all");
    if (!options.some((option) => option.key === currentKey)) {
      setPreviewPresetModuleCategoryFilterKey("all");
    }
    container.classList.toggle("hidden", options.length <= 1);
    container.innerHTML = options
      .map((option) => {
        const key = String(option.key || "");
        const isActive = key === String(getPreviewPresetModuleCategoryFilterKey() || "all");
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
  };

  const getFilteredPreviewPresetItems = (widthFilteredItems = null) => {
    const items = Array.isArray(widthFilteredItems)
      ? widthFilteredItems
      : getWidthFilteredPreviewPresetItems();
    const categoryKey = String(getPreviewPresetModuleCategoryFilterKey() || "all");
    if (!categoryKey || categoryKey === "all") return [...items];
    return items.filter((item) => String(item?.categoryKey || "") === categoryKey);
  };

  const getPreviewPresetSelectedPreset = () => {
    const flowState = getPreviewPresetPickerFlowState();
    if (!flowState.selectedPresetId) return null;
    const allItems = getPreviewPresetItemsForType(flowState.moduleType);
    return allItems.find((item) => String(item.id) === String(flowState.selectedPresetId)) || null;
  };

  const getPreviewPresetTargetEdge = () => {
    const flowState = getPreviewPresetPickerFlowState();
    const ctx = flowState.context;
    if (!ctx || ctx.mode !== "edit" || !ctx.edgeId) return null;
    return findShelfById(ctx.edgeId);
  };

  const renderPreviewPresetModuleCards = () => {
    const container = $("#previewPresetModuleCards");
    if (!container) return;
    const flowState = getPreviewPresetPickerFlowState();
    const widthFilteredItems = getWidthFilteredPreviewPresetItems();
    renderPreviewPresetModuleCategoryTabs(widthFilteredItems);
    const items = getFilteredPreviewPresetItems(widthFilteredItems);
    if (!items.length) {
      container.innerHTML = '<div class="builder-hint">표시할 모듈이 없습니다.</div>';
      return;
    }
    container.innerHTML = items
      .map((item) => {
        const type = flowState.moduleType === "corner" ? "corner" : "normal";
        const selected = String(item.id) === String(flowState.selectedPresetId);
        const selectedFilterKey = String(
          flowState.filterKey || getPreviewPresetFilterKeyForItem(item, type) || ""
        );
        const priceInfo = resolvePresetModulePriceInfo(item, {
          moduleType: type,
          selectedFilterKey,
        });
        const { componentSummary, furnitureSummary } = buildPresetAddonBreakdownFromPreset(item);
        const meta = `선반 ${Number(item.count || 1)}개 · 구성품 ${
          componentSummary === "-" ? "없음" : componentSummary
        } · 가구 ${furnitureSummary === "-" ? "없음" : furnitureSummary}`;
        const visualStyle = buildMaterialVisualInlineStyle({
          swatch: SWATCH_FALLBACK,
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
  };

  const syncPreviewPresetSelectionForCurrentFilter = () => {
    const flowState = getPreviewPresetPickerFlowState();
    const filteredItems = getFilteredPreviewPresetItems();
    patchPreviewPresetPickerFlowState(
      flowState,
      buildPreviewPresetPickerVisibleSelectionPatch(flowState.selectedPresetId, filteredItems)
    );
  };

  const renderPreviewPresetModuleModalUI = () => {
    syncPreviewPresetSelectionForCurrentFilter();
    renderPreviewPresetModuleCards();
  };

  return {
    getPreviewPresetItemsForType,
    getPreviewPresetFilterKeysForItem,
    getPreviewPresetFilterKeyForItem,
    isPreviewPresetAvailableForFilter,
    getPreviewPresetFilterOptions,
    getWidthFilteredPreviewPresetItems,
    getPreviewPresetCategoryFilterOptions,
    renderPreviewPresetModuleCategoryTabs,
    getFilteredPreviewPresetItems,
    getPreviewPresetSelectedPreset,
    getPreviewPresetTargetEdge,
    renderPreviewPresetModuleCards,
    syncPreviewPresetSelectionForCurrentFilter,
    renderPreviewPresetModuleModalUI,
  };
}
