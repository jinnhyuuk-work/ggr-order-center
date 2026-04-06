export function createModuleFrontPreviewHelpers(deps = {}) {
  const {
    getModuleFrontPreviewFurnitureSpec,
    MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM,
    MODULE_FRONT_PREVIEW_FLOOR_FURNITURE_LEG_HEIGHT_MM,
    MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM,
    MODULE_FRONT_PREVIEW_MIN_GAP_MM,
    buildModuleFrontPreviewInteriorSteppedShelfTopPositionsMm,
    buildModuleFrontPreviewInteriorPositionsMm,
    buildModuleFrontPreviewSteppedShelfPositionsMm,
    clampModuleFrontPreviewValue,
    MODULE_FRONT_PREVIEW_GSH1_LOWER_CLEAR_MM,
    MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM,
    MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM,
    getModuleFrontPreviewShelfAnchorsMm,
    buildModuleFrontPreviewGeometry,
    buildModuleFrontPreviewAlphaColor,
    escapeHtml,
    getModuleFrontPreviewClearDimensionBetweenShelves,
    getModuleFrontPreviewFurnitureGapDimensions,
  } = deps;

function buildModuleFrontPreviewLayout({
  shelfCount = 0,
  rodCount = 0,
  furnitureAddonId = "",
  layoutPresetId = "",
  moduleType = "bay",
  geometry,
} = {}) {
  const heightMm = Math.max(0, Number(geometry?.heightMm || 0));
  const shelfThicknessMm = Math.max(1, Number(geometry?.shelfThicknessMm || 20));
  const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount || 0)));
  const normalizedRodCount = Math.max(0, Math.floor(Number(rodCount || 0)));
  const furniture = getModuleFrontPreviewFurnitureSpec(furnitureAddonId);
  const shelfRenderLimit = furniture ? 6 : 8;
  const visibleShelfCount = Math.min(normalizedShelfCount, shelfRenderLimit);
  const shelfOverflowCount = Math.max(0, normalizedShelfCount - visibleShelfCount);
  const anchors = getModuleFrontPreviewShelfAnchorsMm({ heightMm, shelfThicknessMm });
  const topShelfTopMm = anchors.topShelfTopMm;
  const bottomShelfTopMm = anchors.bottomShelfTopMm;

  let shelfTopPositionsMm = [];
  let furnitureBox = null;
  if (furniture?.kind === "floor") {
    const requestedDrawerBodyHeightMm = Math.max(
      MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM,
      MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM * furniture.tierCount
    );
    const requestedLegHeightMm = Math.max(0, MODULE_FRONT_PREVIEW_FLOOR_FURNITURE_LEG_HEIGHT_MM);
    const requestedDrawerHeightMm = requestedDrawerBodyHeightMm + requestedLegHeightMm;
    const maxDrawerHeightMm = Math.max(
      MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM + requestedLegHeightMm,
      heightMm - topShelfTopMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM
    );
    const drawerHeightMm = Math.min(requestedDrawerHeightMm, maxDrawerHeightMm);
    const drawerBottomMm = heightMm;
    const drawerTopMm = Math.max(
      topShelfTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM,
      drawerBottomMm - drawerHeightMm
    );
    const actualDrawerHeightMm = Math.max(0, drawerBottomMm - drawerTopMm);
    const legHeightMm = Math.min(
      requestedLegHeightMm,
      Math.max(0, actualDrawerHeightMm - MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM)
    );
    const bodyBottomMm = Math.max(drawerTopMm, drawerBottomMm - legHeightMm);
    if (visibleShelfCount <= 1) {
      shelfTopPositionsMm = visibleShelfCount === 1 ? [topShelfTopMm] : [];
    } else {
      // Floor drawer: evenly distribute lower shelves by equal clear gaps
      // between top shelf underside and furniture top, accounting shelf thickness.
      const topShelfUndersideMm = topShelfTopMm + shelfThicknessMm;
      const dividedPositionsMm = buildModuleFrontPreviewInteriorSteppedShelfTopPositionsMm({
        shelfCount: visibleShelfCount - 1,
        startUndersideMm: topShelfUndersideMm,
        endTopMm: drawerTopMm,
        shelfThicknessMm,
      });
      shelfTopPositionsMm = [topShelfTopMm, ...dividedPositionsMm];
    }
    furnitureBox = {
      ...furniture,
      topMm: drawerTopMm,
      bottomMm: drawerBottomMm,
      heightMm: actualDrawerHeightMm,
      bodyTopMm: drawerTopMm,
      bodyBottomMm,
      bodyHeightMm: Math.max(0, bodyBottomMm - drawerTopMm),
      legHeightMm,
      referenceShelfTopMm: null,
    };
  } else if (furniture?.kind === "floating") {
    const referenceShelfTopMm = topShelfTopMm + (bottomShelfTopMm - topShelfTopMm) / 2;
    const requestedDrawerHeightMm = Math.max(
      MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM,
      MODULE_FRONT_PREVIEW_DRAWER_TIER_HEIGHT_MM * furniture.tierCount
    );
    const maxDrawerBottomMm = Math.max(
      referenceShelfTopMm + MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM,
      bottomShelfTopMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM
    );
    const drawerBottomMm = Math.min(maxDrawerBottomMm, referenceShelfTopMm + requestedDrawerHeightMm);
    const normalizedDrawerBottomMm = Math.max(
      referenceShelfTopMm + MODULE_FRONT_PREVIEW_MIN_DRAWER_HEIGHT_MM,
      drawerBottomMm
    );
    const upperSpanMm = Math.max(0, referenceShelfTopMm - topShelfTopMm);
    const lowerSpanMm = Math.max(0, bottomShelfTopMm - normalizedDrawerBottomMm);
    if (visibleShelfCount <= 1) {
      shelfTopPositionsMm = visibleShelfCount === 1 ? [topShelfTopMm] : [];
    } else {
      const extraShelfCount = Math.max(0, visibleShelfCount - 2);
      const totalSpanMm = upperSpanMm + lowerSpanMm;
      let upperExtraCount = totalSpanMm > 0 ? Math.round((extraShelfCount * upperSpanMm) / totalSpanMm) : 0;
      upperExtraCount = clampModuleFrontPreviewValue(upperExtraCount, 0, extraShelfCount);
      if (upperSpanMm <= 0) upperExtraCount = 0;
      let lowerExtraCount = extraShelfCount - upperExtraCount;
      if (lowerSpanMm <= 0) {
        upperExtraCount = extraShelfCount;
        lowerExtraCount = 0;
      }
      const upperShelves = buildModuleFrontPreviewInteriorPositionsMm(
        upperExtraCount,
        topShelfTopMm,
        referenceShelfTopMm
      );
      const lowerShelves = buildModuleFrontPreviewInteriorPositionsMm(
        lowerExtraCount,
        normalizedDrawerBottomMm,
        bottomShelfTopMm
      );
      shelfTopPositionsMm = [topShelfTopMm, ...upperShelves, ...lowerShelves, bottomShelfTopMm];
    }
    furnitureBox = {
      ...furniture,
      topMm: referenceShelfTopMm,
      bottomMm: normalizedDrawerBottomMm,
      heightMm: Math.max(0, normalizedDrawerBottomMm - referenceShelfTopMm),
      bodyTopMm: referenceShelfTopMm,
      bodyBottomMm: normalizedDrawerBottomMm,
      bodyHeightMm: Math.max(0, normalizedDrawerBottomMm - referenceShelfTopMm),
      legHeightMm: 0,
      referenceShelfTopMm,
    };
  } else {
    shelfTopPositionsMm = buildModuleFrontPreviewSteppedShelfPositionsMm({
      shelfCount: visibleShelfCount,
      topShelfTopMm,
      bottomShelfTopMm,
      shelfThicknessMm,
    });
    if (
      String(moduleType || "bay") === "bay" &&
      String(layoutPresetId || "").toUpperCase() === "GS-3" &&
      visibleShelfCount === 3 &&
      normalizedRodCount === 0
    ) {
      const gs5TopShelfPositionsMm = buildModuleFrontPreviewSteppedShelfPositionsMm({
        shelfCount: 5,
        topShelfTopMm,
        bottomShelfTopMm,
        shelfThicknessMm,
      });
      shelfTopPositionsMm = gs5TopShelfPositionsMm.slice(0, 3);
    }
    if (
      String(moduleType || "bay") === "bay" &&
      visibleShelfCount === 3 &&
      normalizedRodCount === 1
    ) {
      const targetMiddleTopMm =
        bottomShelfTopMm - shelfThicknessMm - MODULE_FRONT_PREVIEW_GSH1_LOWER_CLEAR_MM;
      const minMiddleTopMm =
        topShelfTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const maxMiddleTopMm =
        bottomShelfTopMm - shelfThicknessMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const middleTopMm = clampModuleFrontPreviewValue(
        targetMiddleTopMm,
        minMiddleTopMm,
        Math.max(minMiddleTopMm, maxMiddleTopMm)
      );
      shelfTopPositionsMm = [topShelfTopMm, middleTopMm, bottomShelfTopMm];
    } else if (
      String(moduleType || "bay") === "bay" &&
      visibleShelfCount === 4 &&
      normalizedRodCount === 1
    ) {
      // GSH-3 style: keep top shelf/hanger, place one shelf at middle,
      // and place the remaining shelf at the midpoint between middle and bottom.
      const middleTargetTopMm = topShelfTopMm + (bottomShelfTopMm - topShelfTopMm) / 2;
      const minMiddleTopMm =
        topShelfTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const maxMiddleTopMm =
        bottomShelfTopMm - (shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM) * 2;
      const middleTopMm = clampModuleFrontPreviewValue(
        middleTargetTopMm,
        minMiddleTopMm,
        Math.max(minMiddleTopMm, maxMiddleTopMm)
      );

      const lowerTargetTopMm = middleTopMm + (bottomShelfTopMm - middleTopMm) / 2;
      const minLowerTopMm = middleTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const maxLowerTopMm =
        bottomShelfTopMm - shelfThicknessMm - MODULE_FRONT_PREVIEW_MIN_GAP_MM;
      const lowerTopMm = clampModuleFrontPreviewValue(
        lowerTargetTopMm,
        minLowerTopMm,
        Math.max(minLowerTopMm, maxLowerTopMm)
      );

      shelfTopPositionsMm = [topShelfTopMm, middleTopMm, lowerTopMm, bottomShelfTopMm];
    }
  }

  const normalizedShelfTopPositionsMm = shelfTopPositionsMm
    .map((value) => clampModuleFrontPreviewValue(value, 0, heightMm - shelfThicknessMm))
    .sort((a, b) => a - b)
    .reduce((acc, value) => {
      if (!acc.length || Math.abs(acc[acc.length - 1] - value) >= 1) acc.push(value);
      return acc;
    }, []);

  const lowestShelfTopMm = normalizedShelfTopPositionsMm.length
    ? normalizedShelfTopPositionsMm[normalizedShelfTopPositionsMm.length - 1]
    : 0;
  const allowLowestShelfHanger = furnitureBox?.kind === "floor";
  const allowSingleShelfSingleRodHangerUnderShelf =
    !furnitureBox &&
    !allowLowestShelfHanger &&
    normalizedShelfTopPositionsMm.length === 1 &&
    normalizedRodCount === 1;
  const hangerCandidatesMm = [];
  const hangerAnchorShelves = allowLowestShelfHanger || allowSingleShelfSingleRodHangerUnderShelf
    ? normalizedShelfTopPositionsMm
    : normalizedShelfTopPositionsMm.slice(0, -1);
  if (hangerAnchorShelves.length) {
    hangerAnchorShelves.forEach((shelfTopMm) => {
      hangerCandidatesMm.push(shelfTopMm + shelfThicknessMm + MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM);
    });
  }
  if (furnitureBox?.kind === "floating") {
    hangerCandidatesMm.push(furnitureBox.bottomMm + MODULE_FRONT_PREVIEW_HANGER_OFFSET_MM);
  }
  const normalizedHangerCandidatesMm = hangerCandidatesMm
    .filter((value) => Number.isFinite(Number(value)))
    .map((value) => Number(value))
    .filter(
      (value) =>
        value > 0 &&
        value < heightMm &&
        (allowLowestShelfHanger || value < lowestShelfTopMm)
    )
    .sort((a, b) => a - b)
    .reduce((acc, value) => {
      if (!acc.length || Math.abs(acc[acc.length - 1] - value) >= 1) acc.push(value);
      return acc;
    }, []);
  const visibleRodCount = Math.min(normalizedRodCount, normalizedHangerCandidatesMm.length);
  const rodOverflowCount = Math.max(0, normalizedRodCount - visibleRodCount);
  const hangerPositionsMm = normalizedHangerCandidatesMm.slice(0, visibleRodCount);

  return {
    shelfTopPositionsMm: normalizedShelfTopPositionsMm,
    shelfOverflowCount,
    hangerPositionsMm,
    rodOverflowCount,
    furnitureBox,
  };
}

function buildModuleFrontPreviewHtml({
  moduleLabel = "모듈",
  sizeLabel = "",
  shelfCount = 1,
  rodCount = 0,
  furnitureAddonId = "",
  layoutPresetId = "",
  isExtendedModule = false,
  componentSummary = "-",
  furnitureSummary = "-",
  type = "bay",
  averageHeightMm = 0,
  shelfWidthMm = 0,
  shelfColor = "rgba(0, 0, 0, 0.28)",
  postBarColor = "rgba(0, 0, 0, 0.2)",
} = {}) {
  const normalizedShelfCount = Math.max(0, Math.floor(Number(shelfCount ?? 0) || 0));
  const normalizedRodCount = Math.max(0, Math.floor(Number(rodCount ?? 0) || 0));
  const safeComponentSummary =
    componentSummary && componentSummary !== "-" ? componentSummary : "없음";
  const safeFurnitureSummary =
    furnitureSummary && furnitureSummary !== "-" ? furnitureSummary : "없음";
  const previewHeightMm = MODULE_FRONT_PREVIEW_REFERENCE_HEIGHT_MM;
  const geometry = buildModuleFrontPreviewGeometry({
    shelfWidthMm,
    averageHeightMm: previewHeightMm,
  });
  const layout = buildModuleFrontPreviewLayout({
    shelfCount: normalizedShelfCount,
    rodCount: normalizedRodCount,
    furnitureAddonId,
    layoutPresetId,
    moduleType: type,
    geometry,
  });
  const frameHeightPx = Math.max(1, Number(geometry.heightPx || 1));
  const mmToPx = (valueMm) =>
    clampModuleFrontPreviewValue(
      Math.round(Number(valueMm || 0) * Number(geometry.scale || 0)),
      0,
      frameHeightPx
    );
  const shelfLinesHtml = layout.shelfTopPositionsMm
    .map((shelfTopMm) => {
      const topPx = clampModuleFrontPreviewValue(
        mmToPx(shelfTopMm),
        0,
        frameHeightPx - geometry.shelfThicknessPx
      );
      return `
        <div
          class="module-front-preview-shelf-line"
          style="
            top:${topPx}px;
            left:${geometry.columnThicknessPx}px;
            width:${geometry.shelfWidthPx}px;
            height:${geometry.shelfThicknessPx}px;
            background:${shelfColor};
          "
        ></div>
      `;
    })
    .join("");
  const hangerWidthPx = Math.max(40, Math.round(geometry.shelfWidthPx));
  const hangerLeftPx = geometry.columnThicknessPx;
  const hangerThicknessPx = Math.max(3, Math.min(7, Math.round(geometry.shelfThicknessPx * 0.45)));
  const hangerBorderColor = "rgba(0, 0, 0, 0.28)";
  const hangerInnerStrokeColor = "rgba(255, 255, 255, 0.16)";
  const hangerLinesHtml = layout.hangerPositionsMm
    .map((hangerTopMm) => {
      const topPx = clampModuleFrontPreviewValue(mmToPx(hangerTopMm), 0, frameHeightPx - hangerThicknessPx);
      return `
        <div
          class="module-front-preview-hanger-line"
          style="
            top:${topPx}px;
            left:${hangerLeftPx}px;
            width:${hangerWidthPx}px;
            height:${hangerThicknessPx}px;
            background:${postBarColor};
            --module-front-hanger-border:${hangerBorderColor};
            --module-front-hanger-inner-stroke:${hangerInnerStrokeColor};
          "
        ></div>
      `;
    })
    .join("");
  let furnitureHtml = "";
  if (layout.furnitureBox) {
    const furnitureWidthPx = Math.max(40, Math.round(geometry.shelfWidthPx));
    const furnitureLeftPx = geometry.columnThicknessPx;
    const furnitureTopPx = clampModuleFrontPreviewValue(
      mmToPx(layout.furnitureBox.topMm),
      0,
      frameHeightPx - 24
    );
    const furnitureHeightPxRaw = Math.max(
      Math.round(Number(layout.furnitureBox.heightMm || 0) * Number(geometry.scale || 0)),
      Math.max(26, Math.round(layout.furnitureBox.tierCount * 18))
    );
    const furnitureHeightPx = clampModuleFrontPreviewValue(
      furnitureHeightPxRaw,
      24,
      frameHeightPx - furnitureTopPx
    );
    const furnitureBorderColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.66,
      "rgba(0, 0, 0, 0.24)"
    );
    const furnitureFillColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.22,
      "rgba(0, 0, 0, 0.08)"
    );
    const furnitureTierBorderColor = furnitureBorderColor;
    const furnitureTierFillColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.12,
      "rgba(255, 255, 255, 0.78)"
    );
    const furnitureLegBorderColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.52,
      "rgba(0, 0, 0, 0.3)"
    );
    const furnitureLegFillColor = buildModuleFrontPreviewAlphaColor(
      shelfColor,
      0.2,
      "rgba(0, 0, 0, 0.1)"
    );
    const hasFloorLegs =
      String(layout.furnitureBox.kind || "") === "floor" && Number(layout.furnitureBox.legHeightMm || 0) > 0;
    const legHeightPx = hasFloorLegs
      ? clampModuleFrontPreviewValue(
          Math.round(Number(layout.furnitureBox.legHeightMm || 0) * Number(geometry.scale || 0)),
          3,
          Math.max(3, Math.round(furnitureHeightPx * 0.32))
        )
      : 0;
    const furnitureBodyHeightPx = Math.max(18, furnitureHeightPx - legHeightPx);
    const furnitureBodyBottomPx = hasFloorLegs ? legHeightPx : 0;
    const tierCellsHtml = Array.from({ length: layout.furnitureBox.tierCount }, () => {
      return `<span class="module-front-preview-furniture-tier"></span>`;
    }).join("");
    const floorLegsHtml = hasFloorLegs
      ? `
        <div class="module-front-preview-furniture-legs">
          <span class="module-front-preview-furniture-leg module-front-preview-furniture-leg--left"></span>
          <span class="module-front-preview-furniture-leg module-front-preview-furniture-leg--right"></span>
        </div>
      `
      : "";
    const furnitureHeightLabelMm = Math.max(0, Math.round(Number(layout.furnitureBox.heightMm || 0)));
    const furnitureHeightChipHtml =
      furnitureHeightLabelMm > 0
        ? `<span class="module-front-preview-dimension-label module-front-preview-furniture-height-chip">${furnitureHeightLabelMm}mm</span>`
        : "";
    furnitureHtml = `
      <div
        class="module-front-preview-furniture module-front-preview-furniture--${escapeHtml(layout.furnitureBox.kind)}"
        style="
          top:${furnitureTopPx}px;
          left:${furnitureLeftPx}px;
          width:${furnitureWidthPx}px;
          height:${furnitureHeightPx}px;
          --module-front-furniture-border:${furnitureBorderColor};
          --module-front-furniture-fill:${furnitureFillColor};
          --module-front-furniture-tier-border:${furnitureTierBorderColor};
          --module-front-furniture-tier-fill:${furnitureTierFillColor};
          --module-front-furniture-leg-border:${furnitureLegBorderColor};
          --module-front-furniture-leg-fill:${furnitureLegFillColor};
          --module-front-furniture-leg-height:${legHeightPx}px;
        "
      >
        <div class="module-front-preview-furniture-body" style="height:${furnitureBodyHeightPx}px; bottom:${furnitureBodyBottomPx}px;">
          ${furnitureHeightChipHtml}
          <div
            class="module-front-preview-furniture-grid"
            style="grid-template-rows:repeat(${layout.furnitureBox.tierCount}, minmax(0, 1fr));"
          >
            ${tierCellsHtml}
          </div>
        </div>
        ${floorLegsHtml}
      </div>
    `;
  }
  const dimensionEntries = [];
  if (layout.shelfTopPositionsMm.length) {
    const topShelfTopMm = Number(layout.shelfTopPositionsMm[0] || 0);
    if (topShelfTopMm > 0) {
      dimensionEntries.push({
        key: "top-remainder",
        label: "나머지",
        centerMm: topShelfTopMm / 2,
      });
    }
  }
  for (let index = 0; index < layout.shelfTopPositionsMm.length - 1; index += 1) {
    const upperShelfTopMm = Number(layout.shelfTopPositionsMm[index] || 0);
    const lowerShelfTopMm = Number(layout.shelfTopPositionsMm[index + 1] || 0);
    const clearDimension = getModuleFrontPreviewClearDimensionBetweenShelves({
      upperShelfTopMm,
      lowerShelfTopMm,
      shelfThicknessMm: geometry.shelfThicknessMm,
      furnitureBox: layout.furnitureBox,
    });
    const clearMm = Math.max(0, Number(clearDimension.clearMm || 0));
    const centerMm = Number(clearDimension.centerMm || 0);
    const roundedClearMm = Math.max(0, Math.round(clearMm / 10) * 10);
    dimensionEntries.push({
      key: `clear-${index}`,
      label: `${roundedClearMm}mm`,
      centerMm,
    });
  }
  const furnitureGapDimensions = getModuleFrontPreviewFurnitureGapDimensions({
    shelfTopPositionsMm: layout.shelfTopPositionsMm,
    shelfThicknessMm: geometry.shelfThicknessMm,
    furnitureBox: layout.furnitureBox,
    heightMm: geometry.heightMm,
  });
  furnitureGapDimensions.forEach((entry, index) => {
    const clearMm = Math.max(0, Number(entry.clearMm || 0));
    const centerMm = Number(entry.centerMm || 0);
    const roundedClearMm = Math.max(0, Math.round(clearMm / 10) * 10);
    dimensionEntries.push({
      key: `${String(entry.key || "furniture-gap")}-${index}`,
      label: `${roundedClearMm}mm`,
      centerMm,
    });
  });
  const lowestShelfTopMm = layout.shelfTopPositionsMm.length
    ? Number(layout.shelfTopPositionsMm[layout.shelfTopPositionsMm.length - 1] || 0)
    : null;
  const lowestShelfUndersideMm =
    Number.isFinite(lowestShelfTopMm) && lowestShelfTopMm !== null
      ? lowestShelfTopMm + Number(geometry.shelfThicknessMm || 0)
      : null;
  const hasFloorFurniture = String(layout.furnitureBox?.kind || "") === "floor";
  const hasFurnitureBelowLowestShelf =
    Number.isFinite(lowestShelfUndersideMm) &&
    layout.furnitureBox &&
    Number(layout.furnitureBox.bottomMm || 0) > Number(lowestShelfUndersideMm || 0) &&
    Number(layout.furnitureBox.topMm || 0) < Number(geometry.heightMm || 0);
  if (
    Number.isFinite(lowestShelfUndersideMm) &&
    !hasFloorFurniture &&
    !hasFurnitureBelowLowestShelf
  ) {
    const floorClearMm = Math.max(
      0,
      Number(geometry.heightMm || 0) - Number(lowestShelfUndersideMm || 0)
    );
    const roundedFloorClearMm = Math.max(0, Math.round(floorClearMm / 10) * 10);
    if (roundedFloorClearMm > 0) {
      dimensionEntries.push({
        key: "clear-floor",
        label: `${roundedFloorClearMm}mm`,
        centerMm: Number(lowestShelfUndersideMm || 0) + floorClearMm / 2,
        className: "module-front-preview-dimension--floor-clear",
        renderBelowFrame: true,
      });
    }
  }
  const dimensionAnchorLeftPx = Math.round(geometry.totalWidthPx / 2);
  const hasBelowFrameDimension = dimensionEntries.some((entry) => Boolean(entry.renderBelowFrame));
  const belowFrameDimensionGutterPx = hasBelowFrameDimension ? 24 : 0;
  const dimensionEntriesHtml = dimensionEntries
    .map((entry) => {
      const topPx = entry.renderBelowFrame
        ? frameHeightPx + 8
        : clampModuleFrontPreviewValue(mmToPx(entry.centerMm), 6, frameHeightPx - 6);
      const className = [
        "module-front-preview-dimension",
        String(entry.className || "").trim(),
      ]
        .filter(Boolean)
        .join(" ");
      return `
        <div
          class="${className}"
          style="top:${topPx}px; left:${dimensionAnchorLeftPx}px;"
        >
          <span class="module-front-preview-dimension-label">${escapeHtml(entry.label)}</span>
        </div>
      `;
    })
    .join("");
  const dimensionGutterPx = 0;
  const overflowChips = [];
  if (layout.shelfOverflowCount > 0) overflowChips.push(`+${layout.shelfOverflowCount} 선반`);
  if (layout.rodOverflowCount > 0) overflowChips.push(`+${layout.rodOverflowCount} 행거`);
  const overflowChipsHtml = overflowChips.length
    ? `
      <div class="module-front-preview-chip-stack">
        ${overflowChips
          .map((label) => `<span class="module-front-preview-chip">${escapeHtml(label)}</span>`)
          .join("")}
      </div>
    `
    : "";

  return `
    <div class="module-front-preview-card module-front-preview-card--${escapeHtml(type)}">
      <div class="module-front-preview-head">
        <div class="module-front-preview-title">${escapeHtml(moduleLabel)} 정면 미리보기</div>
        ${sizeLabel ? `<span class="module-front-preview-chip">${escapeHtml(sizeLabel)}</span>` : ""}
      </div>
      <div class="module-front-preview-canvas" aria-hidden="true">
        <div
          class="module-front-preview-stage"
          style="width:${geometry.totalWidthPx}px; height:${geometry.heightPx + belowFrameDimensionGutterPx}px; margin-left:${dimensionGutterPx}px;"
        >
          <div
            class="module-front-preview-box module-front-preview-box--${escapeHtml(type)}"
            style="width:${geometry.totalWidthPx}px; height:${geometry.heightPx}px;"
          >
            <div class="module-front-preview-side module-front-preview-side--left" style="width:${geometry.columnThicknessPx}px; background:${postBarColor};"></div>
            <div class="module-front-preview-side module-front-preview-side--right" style="width:${geometry.columnThicknessPx}px; background:${postBarColor};"></div>
            ${furnitureHtml}
            ${shelfLinesHtml}
            ${hangerLinesHtml}
            ${dimensionEntriesHtml}
          </div>
        </div>
        ${overflowChipsHtml}
      </div>
      <div class="module-front-preview-meta">
        <div class="module-front-preview-row">
          <span class="label">선반 갯수</span>
          <strong>${normalizedShelfCount}개</strong>
        </div>
        <div class="module-front-preview-row">
          <span class="label">구성품</span>
          <span class="value">${escapeHtml(safeComponentSummary)}</span>
        </div>
        <div class="module-front-preview-row">
          <span class="label">가구</span>
          <span class="value">${escapeHtml(safeFurnitureSummary)}</span>
        </div>
      </div>
      <div class="module-front-preview-note">미리보기는 높이 2300을 기준으로 한 예시입니다. 실제 설치 시 현장 상황과 간격 조정에 따라 일부 구성이 달라질 수 있습니다.</div>
    </div>
  `;
}

  return {
    buildModuleFrontPreviewLayout,
    buildModuleFrontPreviewHtml,
  };
}
