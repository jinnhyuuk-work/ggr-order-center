export function createModuleFrontPreviewRuntimeHelpers({
  LIMITS = {},
  MODULE_POST_BAR_HEIGHT_LIMITS = {},
  SYSTEM_SHELF_MATERIALS = {},
  SYSTEM_COLUMN_MATERIALS = {},
  SYSTEM_ADDON_ITEMS = [],
  readCurrentInputs = () => ({}),
} = {}) {
  const MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM = 2300;
  const MODULE_FRONT_PREVIEW_TOP_UNDERSIDE_SPAN_MM = 1940;
  const MODULE_FRONT_PREVIEW_BOTTOM_SHELF_TOP_FROM_FLOOR_MM = 80;
  const MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM = 40;
  const MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM = 200;
  const MODULE_FRONT_PREVIEW_FLOOR_FURNITURE_LEG_HEIGHT_MM = 35;
  const MODULE_FRONT_PREVIEW_MIN_GAP_MM = 80;
  const MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM = 180;
  const MODULE_FRONT_PREVIEW_GSH1_LOWER_CLEAR_MM = 370;

  const clampModuleFrontPreviewValue = (value, min, max) => {
    if (!Number.isFinite(Number(value))) return min;
    return Math.min(max, Math.max(min, Number(value)));
  };

  const buildModuleFrontPreviewGeometry = ({ shelfWidthMm, averageHeightMm } = {}) => {
    const columnThicknessMm = 20;
    const shelfThicknessMm = 20;
    const widthMm = Math.max(200, Math.round(Number(shelfWidthMm || 0) || 600));
    const minHeightMm = Number(LIMITS?.column?.minLength || MODULE_POST_BAR_HEIGHT_LIMITS?.min);
    const heightMm = Math.max(minHeightMm, Math.round(Number(averageHeightMm || 0) || minHeightMm));
    const totalWidthMm = widthMm + columnThicknessMm * 2;
    const widthMinRef = 400;
    const widthMaxRef = 1000;
    const heightMaxRef = Math.max(
      Number(LIMITS?.column?.maxLength || MODULE_POST_BAR_HEIGHT_LIMITS?.max) + 600,
      minHeightMm + 600
    );
    const baselineShelfWidthMm = 400;
    const baselineTotalWidthMm = baselineShelfWidthMm + columnThicknessMm * 2;
    const clamp01 = (value) => Math.min(1, Math.max(0, Number(value || 0)));
    const widthRatio = clamp01((widthMm - widthMinRef) / Math.max(1, widthMaxRef - widthMinRef));
    const heightRatio = clamp01((heightMm - minHeightMm) / Math.max(1, heightMaxRef - minHeightMm));
    const easedWidth = Math.pow(widthRatio, 0.92);
    const easedHeight = Math.pow(heightRatio, 0.86);

    const totalWidthPx = Math.round(154 + easedWidth * 82);
    const baseHeightPx = Math.round(212 + easedHeight * 146);
    const baselineWidthRatio = clamp01((baselineShelfWidthMm - widthMinRef) / Math.max(1, widthMaxRef - widthMinRef));
    const baselineEasedWidth = Math.pow(baselineWidthRatio, 0.92);
    const baselineTotalWidthPx = Math.round(154 + baselineEasedWidth * 82);
    const actualAspectRatio = heightMm / Math.max(1, baselineTotalWidthMm);
    const aspectRatioNorm = clamp01((actualAspectRatio - 2.0) / 2.8);
    const visualAspectRatio = 1.55 + aspectRatioNorm * 0.72;
    const aspectDrivenHeightPx = Math.round(baselineTotalWidthPx * visualAspectRatio);
    const heightPx = Math.min(420, Math.max(baseHeightPx, aspectDrivenHeightPx));
    const exactScale = Math.max(0.02, Math.min(totalWidthPx / totalWidthMm, heightPx / heightMm));

    const exaggeratedThicknessPx = Math.round(columnThicknessMm * exactScale * 2.4);
    const columnThicknessPx = Math.min(14, Math.max(5, exaggeratedThicknessPx));
    const shelfThicknessPx = Math.min(10, Math.max(4, Math.round(shelfThicknessMm * exactScale * 2.2)));
    const shelfWidthPx = Math.max(40, totalWidthPx - columnThicknessPx * 2);
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
  };

  const normalizeModuleFrontPreviewColor = (value, fallback) => {
    const raw = String(value || "").trim();
    return /^#([0-9a-fA-F]{3,8})$/.test(raw) ? raw : fallback;
  };

  const buildModuleFrontPreviewAlphaColor = (color, alpha, fallback = "rgba(0, 0, 0, 0.2)") => {
    const safeAlpha = clampModuleFrontPreviewValue(Number(alpha || 0), 0, 1);
    const raw = String(color || "").trim();
    if (!raw) return fallback;
    const hexMatch = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      const expandHex = (value) => (value.length === 1 ? `${value}${value}` : value);
      const isShort = hex.length === 3;
      const r = parseInt(expandHex(isShort ? hex[0] : hex.slice(0, 2)), 16);
      const g = parseInt(expandHex(isShort ? hex[1] : hex.slice(2, 4)), 16);
      const b = parseInt(expandHex(isShort ? hex[2] : hex.slice(4, 6)), 16);
      if ([r, g, b].every((value) => Number.isFinite(value))) {
        return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
      }
    }
    const rgbMatch = raw.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
    );
    if (rgbMatch) {
      const r = clampModuleFrontPreviewValue(Number(rgbMatch[1] || 0), 0, 255);
      const g = clampModuleFrontPreviewValue(Number(rgbMatch[2] || 0), 0, 255);
      const b = clampModuleFrontPreviewValue(Number(rgbMatch[3] || 0), 0, 255);
      return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${safeAlpha})`;
    }
    return fallback;
  };

  const getModuleFrontPreviewMaterialColors = (input = readCurrentInputs()) => {
    const safeInput = input && typeof input === "object" ? input : {};
    const shelfMat = SYSTEM_SHELF_MATERIALS[safeInput?.shelf?.materialId];
    const columnMat = SYSTEM_COLUMN_MATERIALS[safeInput?.column?.materialId];
    return {
      shelfColor: normalizeModuleFrontPreviewColor(shelfMat?.swatch, "rgba(0, 0, 0, 0.28)"),
      postBarColor: normalizeModuleFrontPreviewColor(columnMat?.swatch, "rgba(0, 0, 0, 0.2)"),
    };
  };

  const getAddonItemById = (addonId) => {
    const key = String(addonId || "");
    if (!key) return null;
    return SYSTEM_ADDON_ITEMS.find((item) => String(item?.id || "") === key) || null;
  };

  const getModuleFrontPreviewFurnitureSpec = (furnitureAddonId = "") => {
    const addon = getAddonItemById(furnitureAddonId);
    if (!addon) return null;
    const addonId = String(addon.id || "");
    const normalizedId = addonId.toLowerCase();
    const isFloating = normalizedId.includes("hanging");
    const isFloor = normalizedId.includes("floor");
    if (!isFloating && !isFloor) return null;
    const tierMatch = normalizedId.match(/(\d+)tier/);
    const tierCount = Math.max(1, Math.floor(Number(tierMatch?.[1] || 1)));
    return {
      addonId,
      kind: isFloor ? "floor" : "floating",
      tierCount,
    };
  };

  const buildModuleFrontPreviewInteriorPositionsMm = (count, startMm, endMm) => {
    const normalizedCount = Math.max(0, Math.floor(Number(count || 0)));
    if (normalizedCount <= 0) return [];
    const safeStart = Number(startMm || 0);
    const safeEnd = Number(endMm || 0);
    const span = safeEnd - safeStart;
    return Array.from(
      { length: normalizedCount },
      (_, index) => safeStart + span * ((index + 1) / (normalizedCount + 1))
    );
  };

  const buildModuleFrontPreviewInteriorSteppedShelfTopPositionsMm = ({
    shelfCount = 0,
    startUndersideMm = 0,
    endTopMm = 0,
    shelfThicknessMm = 20,
  } = {}) => {
    const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount || 0)));
    if (normalizedShelfCount <= 0) return [];
    const safeStartUndersideMm = Number(startUndersideMm || 0);
    const safeEndTopMm = Number(endTopMm || 0);
    const safeShelfThicknessMm = Math.max(1, Number(shelfThicknessMm || 20));
    const clearSpanMm = Math.max(0, safeEndTopMm - safeStartUndersideMm);
    const gapCount = normalizedShelfCount + 1;
    const gapMm = Math.max(
      0,
      (clearSpanMm - normalizedShelfCount * safeShelfThicknessMm) / gapCount
    );
    const topClampMin = safeStartUndersideMm;
    const topClampMax = Math.max(topClampMin, safeEndTopMm - safeShelfThicknessMm);
    const positions = [];
    let nextTopMm = safeStartUndersideMm + gapMm;
    for (let index = 0; index < normalizedShelfCount; index += 1) {
      positions.push(clampModuleFrontPreviewValue(nextTopMm, topClampMin, topClampMax));
      nextTopMm += safeShelfThicknessMm + gapMm;
    }
    return positions;
  };

  const buildModuleFrontPreviewSteppedShelfPositionsMm = ({
    shelfCount = 0,
    topShelfTopMm = 0,
    bottomShelfTopMm = 0,
    shelfThicknessMm = 20,
  } = {}) => {
    const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount || 0)));
    if (normalizedShelfCount <= 0) return [];
    const safeTopShelfTopMm = Number(topShelfTopMm || 0);
    const safeBottomShelfTopMm = Number(bottomShelfTopMm || 0);
    const safeShelfThicknessMm = Math.max(1, Number(shelfThicknessMm || 20));
    if (normalizedShelfCount === 1) return [safeTopShelfTopMm];
    const clearSpanMm = Math.max(
      0,
      safeBottomShelfTopMm - (safeTopShelfTopMm + safeShelfThicknessMm)
    );
    const internalShelfCount = Math.max(0, normalizedShelfCount - 2);
    const gapCount = Math.max(1, normalizedShelfCount - 1);
    const gapMm = Math.max(
      0,
      (clearSpanMm - internalShelfCount * safeShelfThicknessMm) / gapCount
    );
    const positions = [safeTopShelfTopMm];
    for (let index = 1; index < normalizedShelfCount; index += 1) {
      const prevTopMm = positions[index - 1];
      positions.push(prevTopMm + safeShelfThicknessMm + gapMm);
    }
    if (positions.length >= 2) {
      positions[positions.length - 1] = safeBottomShelfTopMm;
    }
    return positions;
  };

  const getModuleFrontPreviewShelfAnchorsMm = ({ heightMm = 0, shelfThicknessMm = 20 } = {}) => {
    const safeHeightMm = Math.max(0, Number(heightMm || 0));
    const safeThicknessMm = Math.max(1, Number(shelfThicknessMm || 20));
    const bottomShelfTopMm = Math.max(
      safeThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM,
      safeHeightMm - MODULE_FRONT_PREVIEW_BOTTOM_SHELF_TOP_FROM_FLOOR_MM
    );
    const scaledSpanMm =
      MODULE_FRONT_PREVIEW_TOP_UNDERSIDE_SPAN_MM *
      (safeHeightMm / Math.max(1, MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM));
    const maxAllowedSpanMm = Math.max(240, bottomShelfTopMm - safeThicknessMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM);
    const topUndersideToBottomTopMm = clampModuleFrontPreviewValue(
      scaledSpanMm,
      240,
      maxAllowedSpanMm
    );
    const topShelfUndersideMm = bottomShelfTopMm - topUndersideToBottomTopMm;
    const topShelfTopMm = Math.max(0, topShelfUndersideMm - safeThicknessMm);
    return {
      topShelfTopMm,
      bottomShelfTopMm,
    };
  };

  const getModuleFrontPreviewIntervalOverlapMm = (aStartMm, aEndMm, bStartMm, bEndMm) => {
    const start = Math.max(Number(aStartMm || 0), Number(bStartMm || 0));
    const end = Math.min(Number(aEndMm || 0), Number(bEndMm || 0));
    return Math.max(0, end - start);
  };

  const getModuleFrontPreviewClearDimensionBetweenShelves = ({
    upperShelfTopMm = 0,
    lowerShelfTopMm = 0,
    shelfThicknessMm = 20,
    furnitureBox = null,
  } = {}) => {
    const clearStartMm = Number(upperShelfTopMm || 0) + Number(shelfThicknessMm || 0);
    const clearEndMm = Number(lowerShelfTopMm || 0);
    if (!(clearEndMm > clearStartMm)) {
      return {
        clearMm: 0,
        centerMm: clearStartMm,
      };
    }

    const segments = [{ startMm: clearStartMm, endMm: clearEndMm }];
    if (furnitureBox && typeof furnitureBox === "object") {
      const occupiedStartMm = Number(furnitureBox.topMm || 0);
      const occupiedEndMm = Number(furnitureBox.bottomMm || 0);
      const overlapMm = getModuleFrontPreviewIntervalOverlapMm(
        clearStartMm,
        clearEndMm,
        occupiedStartMm,
        occupiedEndMm
      );
      if (overlapMm > 0) {
        segments.length = 0;
        const leftEndMm = Math.max(clearStartMm, Math.min(clearEndMm, occupiedStartMm));
        const rightStartMm = Math.max(clearStartMm, Math.min(clearEndMm, occupiedEndMm));
        if (leftEndMm > clearStartMm) {
          segments.push({
            startMm: clearStartMm,
            endMm: leftEndMm,
          });
        }
        if (clearEndMm > rightStartMm) {
          segments.push({
            startMm: rightStartMm,
            endMm: clearEndMm,
          });
        }
      }
    }

    const clearMm = segments.reduce(
      (sum, segment) => sum + Math.max(0, Number(segment.endMm || 0) - Number(segment.startMm || 0)),
      0
    );

    if (!segments.length) {
      return {
        clearMm,
        centerMm: clearStartMm + (clearEndMm - clearStartMm) / 2,
      };
    }

    const anchorSegment = [...segments].sort((a, b) => {
      const aLen = Number(a.endMm || 0) - Number(a.startMm || 0);
      const bLen = Number(b.endMm || 0) - Number(b.startMm || 0);
      return bLen - aLen;
    })[0];
    return {
      clearMm,
      centerMm:
        Number(anchorSegment.startMm || 0) +
        (Number(anchorSegment.endMm || 0) - Number(anchorSegment.startMm || 0)) / 2,
    };
  };

  const getModuleFrontPreviewFurnitureGapDimensions = ({
    shelfTopPositionsMm = [],
    shelfThicknessMm = 20,
    furnitureBox = null,
    heightMm = 0,
  } = {}) => {
    if (!furnitureBox || typeof furnitureBox !== "object") return [];
    const furnitureTopMm = Number(furnitureBox.topMm || 0);
    const furnitureBottomMm = Number(furnitureBox.bottomMm || 0);
    if (!Number.isFinite(furnitureTopMm) || !Number.isFinite(furnitureBottomMm) || furnitureBottomMm <= furnitureTopMm) {
      return [];
    }
    const shelves = (Array.isArray(shelfTopPositionsMm) ? shelfTopPositionsMm : [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    if (!shelves.length) return [];

    const safeShelfThicknessMm = Math.max(1, Number(shelfThicknessMm || 20));
    const dimensions = [];

    let upperShelfTopMm = null;
    for (const shelfTopMm of shelves) {
      const undersideMm = shelfTopMm + safeShelfThicknessMm;
      if (undersideMm <= furnitureTopMm) {
        upperShelfTopMm = shelfTopMm;
      }
    }
    if (Number.isFinite(upperShelfTopMm)) {
      const upperUndersideMm = Number(upperShelfTopMm) + safeShelfThicknessMm;
      const clearAboveMm = Math.max(0, furnitureTopMm - upperUndersideMm);
      if (clearAboveMm > 0) {
        dimensions.push({
          key: "furniture-above",
          clearMm: clearAboveMm,
          centerMm: upperUndersideMm + clearAboveMm / 2,
        });
      }
    }

    const lowerShelfTopMm = shelves.find((shelfTopMm) => shelfTopMm >= furnitureBottomMm);
    if (Number.isFinite(lowerShelfTopMm)) {
      const clearBelowMm = Math.max(0, Number(lowerShelfTopMm) - furnitureBottomMm);
      if (clearBelowMm > 0) {
        dimensions.push({
          key: "furniture-below",
          clearMm: clearBelowMm,
          centerMm: furnitureBottomMm + clearBelowMm / 2,
        });
      }
    } else {
      const floorMm = Number(heightMm || 0);
      if (Number.isFinite(floorMm) && floorMm > furnitureBottomMm) {
        const clearFloorMm = Math.max(0, floorMm - furnitureBottomMm);
        if (clearFloorMm > 0) {
          dimensions.push({
            key: "furniture-floor",
            clearMm: clearFloorMm,
            centerMm: furnitureBottomMm + clearFloorMm / 2,
          });
        }
      }
    }

    return dimensions;
  };

  return {
    MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM,
    MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM,
    MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM,
    MODULE_FRONT_PREVIEW_FLOOR_FURNITURE_LEG_HEIGHT_MM,
    MODULE_FRONT_PREVIEW_MIN_GAP_MM,
    MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM,
    MODULE_FRONT_PREVIEW_GSH1_LOWER_CLEAR_MM,
    getAddonItemById,
    getModuleFrontPreviewFurnitureSpec,
    clampModuleFrontPreviewValue,
    buildModuleFrontPreviewGeometry,
    buildModuleFrontPreviewAlphaColor,
    buildModuleFrontPreviewInteriorPositionsMm,
    buildModuleFrontPreviewInteriorSteppedShelfTopPositionsMm,
    buildModuleFrontPreviewSteppedShelfPositionsMm,
    getModuleFrontPreviewShelfAnchorsMm,
    getModuleFrontPreviewClearDimensionBetweenShelves,
    getModuleFrontPreviewFurnitureGapDimensions,
    getModuleFrontPreviewMaterialColors,
  };
}
