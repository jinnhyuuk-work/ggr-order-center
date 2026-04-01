export function createSystemPresetAddonHelpers({
  ADDON_CLOTHES_ROD_ID = "",
  getShelfAddonSummary,
} = {}) {
  const buildRodAddonSummary = (rodCount, emptyText = "-") => {
    const normalizedRodCount = Number.isFinite(Number(rodCount))
      ? Math.max(0, Math.floor(Number(rodCount)))
      : 0;
    if (normalizedRodCount <= 0) return emptyText;
    const addonIds = Array.from({ length: normalizedRodCount }, () => ADDON_CLOTHES_ROD_ID);
    return getShelfAddonSummary(addonIds) || emptyText;
  };

  const buildFurnitureAddonSummary = (addonIds = [], emptyText = "-") => {
    const normalizedIds = Array.isArray(addonIds)
      ? addonIds.filter((addonId) => String(addonId || "") !== ADDON_CLOTHES_ROD_ID)
      : [];
    if (!normalizedIds.length) return emptyText;
    return getShelfAddonSummary(normalizedIds) || emptyText;
  };

  const getPresetFurnitureAddonIds = (preset) => {
    const presetFurnitureIds = Array.isArray(preset?.furnitureAddonIds)
      ? preset.furnitureAddonIds
      : preset?.furnitureAddonId
        ? [preset.furnitureAddonId]
        : [];
    return presetFurnitureIds.map((id) => String(id || "")).filter(Boolean);
  };

  const buildPresetAddonBreakdownFromPreset = (preset) => {
    const furnitureAddonIds = getPresetFurnitureAddonIds(preset);
    const isCornerPreset = String(preset?.moduleType || "") === "corner";
    const rodCount = Math.max(0, Math.floor(Number(preset?.rodCount || 0)));
    const furnitureAddonId = isCornerPreset ? "" : String(furnitureAddonIds[0] || "");
    return {
      componentSummary: buildRodAddonSummary(rodCount, "-"),
      furnitureSummary: isCornerPreset ? "적용 불가" : buildFurnitureAddonSummary(furnitureAddonIds, "-"),
      rodCount,
      furnitureAddonId,
    };
  };

  return {
    buildRodAddonSummary,
    buildFurnitureAddonSummary,
    getPresetFurnitureAddonIds,
    buildPresetAddonBreakdownFromPreset,
  };
}
