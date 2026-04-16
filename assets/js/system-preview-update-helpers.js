export function isCoarsePointerEnvironment(win = typeof window !== "undefined" ? window : null) {
  return Boolean(
    win &&
      typeof win.matchMedia === "function" &&
      win.matchMedia("(pointer: coarse)").matches
  );
}

export function buildPreviewUiMetrics(frameW, frameH, { coarsePointer = false } = {}) {
  const shortSide = Math.min(Number(frameW || 0), Number(frameH || 0));
  const uiScale = Math.max(0.8, Math.min(1.15, shortSide / 520));
  const addBtnMinSize = coarsePointer ? 40 : 22;
  const addBtnMaxSize = coarsePointer ? 44 : 32;
  const addBtnBaseSize = coarsePointer ? 40 : 28;
  const addBtnSize = Math.max(
    addBtnMinSize,
    Math.min(addBtnMaxSize, Math.round(addBtnBaseSize * uiScale))
  );
  const dimFontSize = Math.round(11 * uiScale);
  const dimPaddingX = Math.max(4, Math.round(6 * uiScale));
  const dimPaddingY = Math.max(1, Math.round(2 * uiScale));
  return {
    uiScale,
    addBtnSize,
    dimFontSize,
    dimPaddingX,
    dimPaddingY,
  };
}

export function applyPreviewUiMetricsToShelvesElement(shelvesEl, uiMetrics = {}) {
  if (!shelvesEl) return;
  shelvesEl.style.setProperty("--preview-add-btn-size", `${Math.round(Number(uiMetrics.addBtnSize || 0))}px`);
  shelvesEl.style.setProperty("--preview-dim-font-size", `${Math.round(Number(uiMetrics.dimFontSize || 0))}px`);
  shelvesEl.style.setProperty("--preview-dim-padding-x", `${Math.round(Number(uiMetrics.dimPaddingX || 0))}px`);
  shelvesEl.style.setProperty("--preview-dim-padding-y", `${Math.round(Number(uiMetrics.dimPaddingY || 0))}px`);
}

export function createSectionUsageCollector({
  columnEndpointWidthMm = 20,
  columnWidthMm = 20,
  getEdgeHintFromInward,
} = {}) {
  const sectionColumnMarks = {
    top: new Map(),
    right: new Map(),
    bottom: new Map(),
    left: new Map(),
  };
  const sectionLengthSegments = [];

  const toSectionAxisKey = (value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "0";
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };

  const markSectionColumn = (edgeHint, centerX, centerY, widthMm = columnEndpointWidthMm) => {
    const hint = String(edgeHint || "");
    const bucket = sectionColumnMarks[hint];
    if (!bucket) return;
    const axisValue =
      hint === "top" || hint === "bottom" ? Number(centerX || 0) : Number(centerY || 0);
    const axisKey = toSectionAxisKey(axisValue);
    const normalizedWidthMm = Math.max(1, Number(widthMm || columnEndpointWidthMm));
    const prev = bucket.get(axisKey);
    if (!prev) {
      bucket.set(axisKey, { count: 1, widthMm: normalizedWidthMm });
      return;
    }
    const nextCount = Math.max(1, Number(prev.count || 0)) + 1;
    // Shared posts in the same section line use the same post width.
    const nextWidthMm =
      nextCount > 1
        ? Math.max(columnWidthMm, Number(prev.widthMm || 0), normalizedWidthMm)
        : Math.max(1, Number(prev.widthMm || 0), normalizedWidthMm);
    bucket.set(axisKey, { count: nextCount, widthMm: nextWidthMm });
  };

  const recordSectionSegment = ({
    startX,
    startY,
    endX,
    endY,
    nominalLength = 0,
    inwardX = 0,
    inwardY = 1,
  } = {}) => {
    const sx = Number(startX || 0);
    const sy = Number(startY || 0);
    const ex = Number(endX || 0);
    const ey = Number(endY || 0);
    if (
      !Number.isFinite(sx) ||
      !Number.isFinite(sy) ||
      !Number.isFinite(ex) ||
      !Number.isFinite(ey)
    ) {
      return;
    }
    const horizontal = Math.abs(ex - sx) >= Math.abs(ey - sy);
    sectionLengthSegments.push({
      orientation: horizontal ? "horizontal" : "vertical",
      edgeHint: getEdgeHintFromInward(inwardX, inwardY),
      lineCoord: horizontal ? (sy + ey) / 2 : (sx + ex) / 2,
      axisStart: horizontal ? Math.min(sx, ex) : Math.min(sy, ey),
      axisEnd: horizontal ? Math.max(sx, ex) : Math.max(sy, ey),
      // Section width is calculated as: (sum of shelf widths) + (sum of column widths).
      totalMm: Math.max(0, Number(nominalLength || 0)),
    });
  };

  return {
    sectionColumnMarks,
    sectionLengthSegments,
    markSectionColumn,
    recordSectionSegment,
  };
}

export function createResolvedEndpointRegistry({ buildEndpointStableId } = {}) {
  const resolvedOpenEndpoints = new Map();
  const registerResolvedEndpoint = (entry) => {
    if (!entry) return;
    const semanticId = String(entry.endpointId || "");
    if (semanticId) resolvedOpenEndpoints.set(semanticId, entry);
    const geometricId = buildEndpointStableId(entry);
    if (geometricId) resolvedOpenEndpoints.set(geometricId, entry);
  };
  const consumeResolvedEndpoint = (endpointId) => {
    const key = String(endpointId || "");
    if (!key || key === "root-endpoint") return;
    const endpoint = resolvedOpenEndpoints.get(key);
    if (!endpoint) {
      resolvedOpenEndpoints.delete(key);
      return;
    }
    Array.from(resolvedOpenEndpoints.entries()).forEach(([mapKey, value]) => {
      if (value === endpoint) resolvedOpenEndpoints.delete(mapKey);
    });
  };
  return {
    resolvedOpenEndpoints,
    registerResolvedEndpoint,
    consumeResolvedEndpoint,
  };
}

export function renderRootEndpointAddButton({
  shelvesEl,
  frameW,
  frameH,
  canAddFromPreview,
  previewDisabledReason,
  rootEndpoint,
  applyPreviewAddButtonState,
  bindAddButtonPreviewInteractions,
} = {}) {
  if (!shelvesEl || !rootEndpoint) return null;
  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "system-preview-add-btn";
  startBtn.dataset.addShelf = "0";
  startBtn.dataset.addRootStart = "true";
  startBtn.dataset.attachSide = "0";
  startBtn.dataset.attachAtStart = "true";
  startBtn.dataset.endpointId = "root-endpoint";
  startBtn.title = "첫 모듈 추가";
  startBtn.textContent = "+";
  applyPreviewAddButtonState(startBtn, {
    enabled: canAddFromPreview,
    reason: previewDisabledReason,
  });
  startBtn.style.left = `${Number(frameW || 0) / 2}px`;
  startBtn.style.top = `${Number(frameH || 0) / 2}px`;
  shelvesEl.appendChild(startBtn);
  bindAddButtonPreviewInteractions(startBtn, rootEndpoint, canAddFromPreview);
  return startBtn;
}

export function placePreviewAddButtons({
  addButtons = [],
  addBtnSize = 28,
  shelvesEl,
  edges = [],
  frameW = 0,
  frameH = 0,
  scale = 1,
  tx = 0,
  ty = 0,
  depthMm = 400,
  columnDepthPx = 8,
  shelfBoxesPx = [],
  columnBoxesPx = [],
  canAddFromPreview = false,
  previewDisabledReason = "",
  applyPreviewAddButtonState,
  bindAddButtonPreviewInteractions,
  normalizeDirection,
  getPreviewAddButtonPlacementKey,
  previewAddButtonPlacementHints = new Map(),
  getBoundingRectOnParent,
} = {}) {
  const placedAddBtnBoxes = [];
  const nextPlacementHints = new Map();
  const addBtnRadius = Number(addBtnSize || 0) / 2;
  const infoLabelBoxesPx = Array.from(
    shelvesEl.querySelectorAll(".system-dimension-label, .system-module-label, .system-section-width-label")
  )
    .map((el) => getBoundingRectOnParent(el, shelvesEl))
    .filter((rect) => Boolean(rect));
  const isSingleStraightBayLayout =
    edges.length === 1 && String(edges[0]?.type || "") === "bay" && addButtons.length === 2;
  const framePad = Math.max(8, addBtnRadius + 2);
  const minBtnX = framePad;
  const maxBtnX = Math.max(framePad, Number(frameW || 0) - framePad);
  const minBtnY = framePad;
  const maxBtnY = Math.max(framePad, Number(frameH || 0) - framePad);
  const clampToFrame = (value, min, max) => Math.min(max, Math.max(min, Number(value || 0)));
  const rectOverlapsCircle = (rect, cx, cy, r) =>
    cx + r > rect.left && cx - r < rect.right && cy + r > rect.top && cy - r < rect.bottom;
  const isBlockedPointForPlacement = (
    x,
    y,
    r,
    { ignoreColumns = false, ignoreShelves = false, ignoreInfoLabels = true } = {}
  ) => {
    if (
      x < framePad ||
      x > Number(frameW || 0) - framePad ||
      y < framePad ||
      y > Number(frameH || 0) - framePad
    ) {
      return true;
    }
    if (!ignoreShelves && shelfBoxesPx.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    if (!ignoreColumns && columnBoxesPx.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    if (!ignoreInfoLabels && infoLabelBoxesPx.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    if (placedAddBtnBoxes.some((rect) => rectOverlapsCircle(rect, x, y, r))) return true;
    return false;
  };
  const fallbackAngles = [0, 45, 90, 135, 180, 225, 270, 315].map(
    (deg) => (deg * Math.PI) / 180
  );
  const findNearestAvailablePoint = (
    originX,
    originY,
    r,
    { ignoreColumns = false, ignoreShelves = false, ignoreInfoLabels = true } = {}
  ) => {
    const baseX = clampToFrame(originX, minBtnX, maxBtnX);
    const baseY = clampToFrame(originY, minBtnY, maxBtnY);
    if (!isBlockedPointForPlacement(baseX, baseY, r, { ignoreColumns, ignoreShelves, ignoreInfoLabels })) {
      return { x: baseX, y: baseY };
    }
    const radialSteps = [
      Math.max(8, addBtnSize * 0.55),
      Math.max(14, addBtnSize * 1.05),
      Math.max(20, addBtnSize * 1.65),
      Math.max(26, addBtnSize * 2.25),
    ];
    for (let i = 0; i < radialSteps.length; i += 1) {
      const radius = radialSteps[i];
      for (let j = 0; j < fallbackAngles.length; j += 1) {
        const angle = fallbackAngles[j];
        const candidateX = clampToFrame(baseX + Math.cos(angle) * radius, minBtnX, maxBtnX);
        const candidateY = clampToFrame(baseY + Math.sin(angle) * radius, minBtnY, maxBtnY);
        if (
          !isBlockedPointForPlacement(candidateX, candidateY, r, {
            ignoreColumns,
            ignoreShelves,
            ignoreInfoLabels,
          })
        ) {
          return { x: candidateX, y: candidateY };
        }
      }
    }
    return { x: baseX, y: baseY };
  };

  addButtons.forEach((point) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "system-preview-add-btn";
    btn.dataset.addShelf = String(point.sideIndex);
    if (point.endpointId) btn.dataset.endpointId = point.endpointId;
    btn.dataset.attachSide = String(
      Number.isFinite(point.attachSideIndex) ? point.attachSideIndex : point.sideIndex
    );
    if (point.cornerId) btn.dataset.anchorCorner = point.cornerId;
    btn.dataset.attachAtStart = point.attachAtStart ? "true" : "false";
    btn.title = "끝점에 모듈 추가";
    btn.textContent = "+";
    applyPreviewAddButtonState(btn, {
      enabled: canAddFromPreview,
      reason: previewDisabledReason,
    });
    const inwardX = Number(point.inwardX || 0);
    const inwardY = Number(point.inwardY || 0);
    const inwardLen = Math.hypot(inwardX, inwardY) || 1;
    const columnInsetMm = Number(depthMm || 0) * (2 / 3);
    const columnCenterX = Number(point.x || 0) + (inwardX / inwardLen) * columnInsetMm;
    const columnCenterY = Number(point.y || 0) + (inwardY / inwardLen) * columnInsetMm;
    const outwardX = -inwardX / inwardLen;
    const outwardY = -inwardY / inwardLen;
    const tangentX = -inwardY / inwardLen;
    const tangentY = inwardX / inwardLen;
    const columnCenterPxX = columnCenterX * scale + tx;
    const columnCenterPxY = columnCenterY * scale + ty;
    const extendDir = normalizeDirection(point.extendDx, point.extendDy);
    const singleBayPreferred = isSingleStraightBayLayout
      ? { x: Number(extendDir.dx || 0), y: Number(extendDir.dy || 0) }
      : null;
    const isLinearSingleBayPlacement = Boolean(
      isSingleStraightBayLayout &&
        singleBayPreferred &&
        (Math.abs(Number(singleBayPreferred.x || 0)) >= 0.5 ||
          Math.abs(Number(singleBayPreferred.y || 0)) >= 0.5)
    );
    const ignoreColumnOverlap = isLinearSingleBayPlacement;
    const placementKey = getPreviewAddButtonPlacementKey(point);
    const previousHint = placementKey ? previewAddButtonPlacementHints.get(placementKey) : null;
    const candidateVectors = [];
    if (previousHint && !isLinearSingleBayPlacement) {
      const hintDx = Number(previousHint.dx || 0);
      const hintDy = Number(previousHint.dy || 0);
      const hintLen = Math.hypot(hintDx, hintDy);
      if (hintLen > 0.0001) {
        candidateVectors.push({
          x: hintDx / hintLen,
          y: hintDy / hintLen,
          mul: Number(previousHint.mul || 1),
        });
      }
    }
    if (isLinearSingleBayPlacement && singleBayPreferred) {
      candidateVectors.push(
        { x: singleBayPreferred.x, y: singleBayPreferred.y, mul: 1 },
        { x: singleBayPreferred.x, y: singleBayPreferred.y, mul: 1.25 },
        { x: singleBayPreferred.x, y: singleBayPreferred.y, mul: 0.82 },
        { x: singleBayPreferred.x, y: singleBayPreferred.y, mul: 1.48 }
      );
    } else {
      if (singleBayPreferred) {
        candidateVectors.push(singleBayPreferred);
        if (Math.abs(singleBayPreferred.x) >= Math.abs(singleBayPreferred.y)) {
          candidateVectors.push({ x: singleBayPreferred.x, y: 0, mul: 1.2 });
        } else {
          candidateVectors.push({ x: 0, y: singleBayPreferred.y, mul: 1.2 });
        }
      }
      candidateVectors.push(
        { x: outwardX, y: outwardY },
        { x: tangentX, y: tangentY },
        { x: -tangentX, y: -tangentY },
        { x: outwardX, y: outwardY, mul: 1.35 },
        { x: inwardX / inwardLen, y: inwardY / inwardLen }
      );
    }
    const offsetPx = isLinearSingleBayPlacement
      ? Math.max(addBtnRadius + Math.round(addBtnSize * 0.22), 16)
      : Math.max(columnDepthPx * 0.5 + addBtnSize * 0.65, 20);
    const toClampedPoint = (x, y) => ({
      x: clampToFrame(x, minBtnX, maxBtnX),
      y: clampToFrame(y, minBtnY, maxBtnY),
    });
    const initialPoint = toClampedPoint(
      columnCenterPxX + (singleBayPreferred?.x ?? outwardX) * offsetPx,
      columnCenterPxY + (singleBayPreferred?.y ?? outwardY) * offsetPx
    );
    let btnX = initialPoint.x;
    let btnY = initialPoint.y;
    let placed = !isBlockedPointForPlacement(btnX, btnY, addBtnRadius, {
      ignoreColumns: ignoreColumnOverlap,
    });
    for (let i = 0; i < candidateVectors.length; i += 1) {
      if (placed) break;
      const c = candidateVectors[i];
      const mul = Number(c.mul || 1);
      const candidatePoint = toClampedPoint(
        columnCenterPxX + Number(c.x || 0) * offsetPx * mul,
        columnCenterPxY + Number(c.y || 0) * offsetPx * mul
      );
      if (
        !isBlockedPointForPlacement(candidatePoint.x, candidatePoint.y, addBtnRadius, {
          ignoreColumns: ignoreColumnOverlap,
        })
      ) {
        btnX = candidatePoint.x;
        btnY = candidatePoint.y;
        placed = true;
        break;
      }
    }
    if (
      isBlockedPointForPlacement(btnX, btnY, addBtnRadius, {
        ignoreColumns: ignoreColumnOverlap,
      })
    ) {
      const fallbackPoint = findNearestAvailablePoint(btnX, btnY, addBtnRadius, {
        ignoreColumns: ignoreColumnOverlap,
      });
      btnX = fallbackPoint.x;
      btnY = fallbackPoint.y;
    }
    btn.style.left = `${btnX}px`;
    btn.style.top = `${btnY}px`;
    shelvesEl.appendChild(btn);
    bindAddButtonPreviewInteractions(btn, point, canAddFromPreview);
    if (placementKey && !isLinearSingleBayPlacement) {
      const relX = btnX - columnCenterPxX;
      const relY = btnY - columnCenterPxY;
      const relLen = Math.hypot(relX, relY);
      if (relLen > 0.0001) {
        const safeOffset = Math.max(1, Number(offsetPx || 0));
        nextPlacementHints.set(placementKey, {
          dx: relX / relLen,
          dy: relY / relLen,
          mul: Math.min(2.6, Math.max(0.45, relLen / safeOffset)),
        });
      }
    }
    placedAddBtnBoxes.push({
      left: btnX - addBtnRadius,
      right: btnX + addBtnRadius,
      top: btnY - addBtnRadius,
      bottom: btnY + addBtnRadius,
    });
  });

  return {
    nextPlacementHints,
  };
}

export function resolvePreviewViewportTransform({
  shelves = [],
  addButtons = [],
  addBtnSize = 28,
  frameW = 0,
  frameH = 0,
} = {}) {
  let minX = 0;
  let maxX = 1;
  let minY = 0;
  let maxY = 1;
  if (shelves.length || addButtons.length) {
    const xPoints = shelves.length
      ? shelves.flatMap((s) => [s.minX, s.maxX])
      : addButtons.map((p) => p.x);
    const yPoints = shelves.length
      ? shelves.flatMap((s) => [s.minY, s.maxY])
      : addButtons.map((p) => p.y);
    minX = Math.min(...xPoints);
    maxX = Math.max(...xPoints);
    minY = Math.min(...yPoints);
    maxY = Math.max(...yPoints);
  }

  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);
  // Keep a dedicated safe area at the top so the preview never collides with
  // the toggle/undo-redo controls, and reduce initial module scale slightly.
  const sidePaddingPx = Math.max(22, Math.min(38, Math.round(addBtnSize * 1.1)));
  const topSafeAreaPx = Math.max(72, Math.min(104, Math.round(addBtnSize * 2.4)));
  const bottomPaddingPx = Math.max(22, Math.min(42, Math.round(addBtnSize * 1.0)));
  const availableW = Math.max(1, frameW - sidePaddingPx * 2);
  const availableH = Math.max(1, frameH - topSafeAreaPx - bottomPaddingPx);
  const fitScaleX = availableW / rangeX;
  const fitScaleY = availableH / rangeY;
  const baseScale = Math.max(0.1, Math.min(fitScaleX, fitScaleY));
  const scale = baseScale * 0.86;
  const tx = sidePaddingPx + (availableW - rangeX * scale) / 2 - minX * scale;
  const ty = topSafeAreaPx + (availableH - rangeY * scale) / 2 - minY * scale;
  const shelfBoxesPx = shelves.map((item) => ({
    left: item.minX * scale + tx,
    right: item.maxX * scale + tx,
    top: item.minY * scale + ty,
    bottom: item.maxY * scale + ty,
  }));

  return {
    scale,
    tx,
    ty,
    shelfBoxesPx,
  };
}

export function renderPreviewShelves({
  shelves = [],
  shelvesEl,
  scale = 1,
  tx = 0,
  ty = 0,
  uiScale = 1,
  buildCornerSvgPathData,
  shelfSwatch = "",
  swatchFallback = "#ddd",
  setPreviewEdgeHoverState,
} = {}) {
  if (!shelvesEl) return;
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
    if (item.isCorner && item.cornerGeom) {
      shelf.style.background = "transparent";
      const svgNs = "http://www.w3.org/2000/svg";
      const svgEl = document.createElementNS(svgNs, "svg");
      svgEl.setAttribute("class", "system-corner-shape-svg");
      const widthPx = Math.max(1, (item.maxX - item.minX) * scale);
      const heightPx = Math.max(1, (item.maxY - item.minY) * scale);
      const cornerRadiusPx = Math.max(4, Math.min(10, 6 * uiScale));
      svgEl.setAttribute("viewBox", `0 0 ${widthPx.toFixed(2)} ${heightPx.toFixed(2)}`);
      svgEl.setAttribute("width", `${widthPx.toFixed(2)}`);
      svgEl.setAttribute("height", `${heightPx.toFixed(2)}`);

      const pathEl = document.createElementNS(svgNs, "path");
      pathEl.setAttribute("class", "system-corner-shape-path");
      const pathD = buildCornerSvgPathData(
        item.cornerGeom,
        scale,
        tx,
        ty,
        item.minX * scale + tx,
        item.minY * scale + ty,
        cornerRadiusPx
      );
      pathEl.setAttribute("d", pathD);
      pathEl.setAttribute("fill", shelfSwatch || swatchFallback);
      pathEl.setAttribute("stroke", "rgba(0, 0, 0, 0.28)");
      pathEl.setAttribute("stroke-width", "1.25");
      pathEl.setAttribute("stroke-linejoin", "round");
      pathEl.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(pathEl);
      shelf.appendChild(svgEl);
    } else if (item.isCorner && item.arms?.length) {
      shelf.style.background = "transparent";
      item.arms.forEach((arm) => {
        const armEl = document.createElement("div");
        armEl.className = "system-corner-arm";
        armEl.style.left = `${(arm.minX - item.minX) * scale}px`;
        armEl.style.top = `${(arm.minY - item.minY) * scale}px`;
        armEl.style.width = `${(arm.maxX - arm.minX) * scale}px`;
        armEl.style.height = `${(arm.maxY - arm.minY) * scale}px`;
        armEl.style.background = shelfSwatch || swatchFallback;
        shelf.appendChild(armEl);
      });
    } else {
      shelf.style.background = shelfSwatch || swatchFallback;
    }
    shelf.addEventListener("mouseenter", () => {
      setPreviewEdgeHoverState(item.id, true);
    });
    shelf.addEventListener("mouseleave", () => {
      setPreviewEdgeHoverState("", false);
    });
    shelvesEl.appendChild(shelf);
  });
}

export function renderPreviewColumns({
  columnCenters = [],
  shelvesEl,
  depthMm = 400,
  scale = 1,
  tx = 0,
  ty = 0,
  columnDepthMm = 75,
  columnWidthMm = 20,
  columnEndpointWidthMm = 20,
  columnSwatch = "#d9d9d9",
} = {}) {
  const columnDepthPx = Math.max(columnDepthMm * scale, 8);
  const columnLabelCenters = [];
  const columnBoxesPx = [];
  columnCenters.forEach((point) => {
    const sumInwardX = Number(point.inwardX || 0);
    const sumInwardY = Number(point.inwardY || 0);
    const inwardLen = Math.hypot(sumInwardX, sumInwardY) || 1;
    const normalizedInwardX = sumInwardX / inwardLen;
    const normalizedInwardY = sumInwardY / inwardLen;
    const isCornerPostBar = String(point.columnRole || "") === "corner-post";
    const insetMm = isCornerPostBar ? 0 : depthMm * (2 / 3);
    const shiftedX = point.x + normalizedInwardX * insetMm;
    const shiftedY = point.y + normalizedInwardY * insetMm;
    const renderX = shiftedX * scale + tx;
    const renderY = shiftedY * scale + ty;
    const edgeRefX = point.x * scale + tx;
    const edgeRefY = point.y * scale + ty;
    const tangentX = -normalizedInwardY;
    const tangentY = normalizedInwardX;
    const pointColumnWidthMm = Math.max(
      1,
      Number(point.columnWidthMm || columnWidthMm || columnEndpointWidthMm)
    );
    const pointColumnWidthPx = Math.max(pointColumnWidthMm * scale, 4);
    const angleDeg = Number.isFinite(Number(point.rotationDeg))
      ? Number(point.rotationDeg)
      : (Math.atan2(tangentY, tangentX) * 180) / Math.PI;
    const columnEl = document.createElement("div");
    columnEl.className = "system-column system-preview-column-box";
    columnEl.style.width = `${pointColumnWidthPx}px`;
    columnEl.style.height = `${columnDepthPx}px`;
    columnEl.style.left = `${renderX}px`;
    columnEl.style.top = `${renderY}px`;
    columnEl.style.transform = `translate(-50%, -50%) rotate(${angleDeg.toFixed(2)}deg)`;
    columnEl.style.background = columnSwatch;
    shelvesEl.appendChild(columnEl);
    const halfDiag = Math.hypot(pointColumnWidthPx, columnDepthPx) / 2;
    columnBoxesPx.push({
      left: renderX - halfDiag,
      right: renderX + halfDiag,
      top: renderY - halfDiag,
      bottom: renderY + halfDiag,
    });
    columnLabelCenters.push({
      x: renderX,
      y: renderY,
      edgeRefX,
      edgeRefY,
      widthMm: pointColumnWidthMm,
      showDimensionLabel: !isCornerPostBar,
    });
  });
  return {
    columnDepthPx,
    columnLabelCenters,
    columnBoxesPx,
  };
}

export function renderPreviewOuterAndColumnDimensionLabels({
  shelvesEl,
  sideWidthLabels = [],
  shelves = [],
  scale = 1,
  tx = 0,
  ty = 0,
  frameW = 0,
  frameH = 0,
  showSizeInfo = false,
  columnLabelCenters = [],
  columnWidthMm = 20,
} = {}) {
  const outerBoundsPx = shelves.length
    ? {
        minX: Math.min(...shelves.map((item) => item.minX * scale + tx)),
        maxX: Math.max(...shelves.map((item) => item.maxX * scale + tx)),
        minY: Math.min(...shelves.map((item) => item.minY * scale + ty)),
        maxY: Math.max(...shelves.map((item) => item.maxY * scale + ty)),
      }
    : {
        minX: frameW * 0.2,
        maxX: frameW * 0.8,
        minY: frameH * 0.2,
        maxY: frameH * 0.8,
      };
  const edgeOffset = 14;
  const sectionLabelOffset = 36;

  sideWidthLabels.forEach((info) => {
    const labelEl = document.createElement("div");
    labelEl.className = `system-dimension-label system-section-width-label${
      info.overflow ? " system-section-width-label--overflow" : ""
    }`;
    if (info.edgeHint === "left" || info.edgeHint === "right") {
      labelEl.classList.add("system-section-width-label--vertical");
    }
    const sectionPrefix =
      Number.isFinite(Number(info.sectionIndex)) && Number(info.sectionIndex) >= 0
        ? `S${Number(info.sectionIndex) + 1} `
        : "";
    labelEl.textContent = `${sectionPrefix}${info.text}`;
    if (info.overflow) {
      labelEl.setAttribute("aria-label", `${sectionPrefix.trim()} 사용 너비가 전체를 초과했습니다`);
    }
    const isVerticalSectionLabel = info.edgeHint === "left" || info.edgeHint === "right";
    const labelTextLength = String(labelEl.textContent || "").length;
    if (labelTextLength >= 11) labelEl.classList.add("system-section-width-label--compact");
    if (Number(info.targetMm || 0) > 0) {
      labelEl.title = `설치공간${Number(info.sectionIndex) + 1}: 사용 ${Number(info.totalMm || 0)}mm / 전체 ${Number(info.targetMm)}mm`;
    }
    const dynamicSectionLabelOffset =
      sectionLabelOffset +
      (labelTextLength >= 11 ? 10 : labelTextLength >= 9 ? 6 : 0) +
      (isVerticalSectionLabel ? 6 : 0) +
      (info.overflow ? 4 : 0);
    let placedX = Number.isFinite(info.x)
      ? info.x * scale + tx
      : (outerBoundsPx.minX + outerBoundsPx.maxX) / 2;
    let placedY = Number.isFinite(info.y)
      ? info.y * scale + ty
      : (outerBoundsPx.minY + outerBoundsPx.maxY) / 2;
    if (info.edgeHint === "top") {
      placedY = outerBoundsPx.minY - dynamicSectionLabelOffset;
      if (!Number.isFinite(info.x)) placedX = (outerBoundsPx.minX + outerBoundsPx.maxX) / 2;
    } else if (info.edgeHint === "right") {
      placedX = outerBoundsPx.maxX + dynamicSectionLabelOffset;
      if (!Number.isFinite(info.y)) placedY = (outerBoundsPx.minY + outerBoundsPx.maxY) / 2;
    } else if (info.edgeHint === "bottom") {
      placedY = outerBoundsPx.maxY + dynamicSectionLabelOffset;
      if (!Number.isFinite(info.x)) placedX = (outerBoundsPx.minX + outerBoundsPx.maxX) / 2;
    } else if (info.edgeHint === "left") {
      placedX = outerBoundsPx.minX - dynamicSectionLabelOffset;
      if (!Number.isFinite(info.y)) placedY = (outerBoundsPx.minY + outerBoundsPx.maxY) / 2;
    }
    labelEl.style.left = `${placedX}px`;
    labelEl.style.top = `${placedY}px`;
    shelvesEl.appendChild(labelEl);
  });

  if (showSizeInfo) {
    columnLabelCenters.forEach((point) => {
      if (point.showDimensionLabel === false) return;
      const anchorX = Number(point.x || 0);
      const anchorY = Number(point.y || 0);
      const edgeRefX = Number(point.edgeRefX || anchorX);
      const edgeRefY = Number(point.edgeRefY || anchorY);
      const edgeVotes = point.edgeVotes || {};
      const edgeOrder = ["top", "right", "bottom", "left"];
      const votedEdge = edgeOrder.reduce((best, edge) => {
        const score = Number(edgeVotes[edge] || 0);
        if (!best) return { edge, score };
        if (score > best.score) return { edge, score };
        return best;
      }, null);

      const distTop = Math.abs(edgeRefY - outerBoundsPx.minY);
      const distRight = Math.abs(edgeRefX - outerBoundsPx.maxX);
      const distBottom = Math.abs(edgeRefY - outerBoundsPx.maxY);
      const distLeft = Math.abs(edgeRefX - outerBoundsPx.minX);
      const nearestByDistance = [
        { edge: "top", dist: distTop },
        { edge: "right", dist: distRight },
        { edge: "bottom", dist: distBottom },
        { edge: "left", dist: distLeft },
      ].sort((a, b) => a.dist - b.dist)[0]?.edge;
      const nearest = votedEdge && votedEdge.score > 0 ? votedEdge.edge : nearestByDistance;

      let placedX = anchorX;
      let placedY = anchorY;

      if (nearest === "top") {
        placedY = outerBoundsPx.minY - edgeOffset;
      } else if (nearest === "right") {
        placedX = outerBoundsPx.maxX + edgeOffset;
      } else if (nearest === "bottom") {
        placedY = outerBoundsPx.maxY + edgeOffset;
      } else if (nearest === "left") {
        placedX = outerBoundsPx.minX - edgeOffset;
      }

      const labelEl = document.createElement("div");
      labelEl.className = "system-dimension-label system-dimension-label--column";
      if (nearest === "left" || nearest === "right") {
        labelEl.classList.add("system-dimension-label--vertical");
      }
      const labelWidthMm = Math.max(1, Math.round(Number(point.widthMm || columnWidthMm)));
      labelEl.textContent = `${labelWidthMm}mm`;
      labelEl.style.left = `${placedX}px`;
      labelEl.style.top = `${placedY}px`;
      shelvesEl.appendChild(labelEl);
    });
  }
}

export function renderPreviewModuleAndDimensionLabels({
  shelves = [],
  edges = [],
  scale = 1,
  tx = 0,
  ty = 0,
  supportVisibleMm = 5,
  shelvesEl,
  showSizeInfo = true,
  previewCaptureIndexOnlyMode = false,
  formatAddonCompactBreakdown,
  getShelfAddonIds,
  getComposeTabLabelInfo,
  resolveDimensionLabelCompactStates,
  createDimensionLabelElement,
  resolveModuleLabelDensityLevels,
  createModuleLabelElement,
} = {}) {
  const dimensionLabels = [];
  const moduleInfoLabels = [];
  const edgeById = new Map(
    edges
      .filter((edge) => edge?.id)
      .map((edge) => [String(edge.id), edge])
  );
  shelves.forEach((item, itemIndex) => {
    const edge = edgeById.get(String(item.id || ""));
    const shelfCount = Math.max(1, Number(edge?.count || 1));
    const addonSummary = formatAddonCompactBreakdown(getShelfAddonIds(item.id));
    const composeInfo = getComposeTabLabelInfo(edge);
    const moduleIndex = Math.max(1, itemIndex + 1);
    if (item.isCorner && item.arms?.length) {
      const primaryArm = item.arms[0] || null;
      const secondaryArm = item.arms[1] || null;
      const getArmOrientation = (arm) => {
        if (!arm) return "";
        const spanX = Math.abs(Number(arm.maxX || 0) - Number(arm.minX || 0));
        const spanY = Math.abs(Number(arm.maxY || 0) - Number(arm.minY || 0));
        return spanX >= spanY ? "horizontal" : "vertical";
      };
      const armNominalLength = (arm) => {
        if (!arm) return 0;
        const lengthWithSupport = Math.max(
          Number(arm.maxX || 0) - Number(arm.minX || 0),
          Number(arm.maxY || 0) - Number(arm.minY || 0)
        );
        return Math.max(0, Math.round(lengthWithSupport - supportVisibleMm * 2));
      };
      const primaryLength =
        item.cornerGeom && Number.isFinite(Number(item.cornerGeom.primaryLen))
          ? Math.max(0, Math.round(Number(item.cornerGeom.primaryLen) - supportVisibleMm * 2))
          : armNominalLength(primaryArm);
      const secondaryLength =
        item.cornerGeom && Number.isFinite(Number(item.cornerGeom.secondaryLen))
          ? Math.max(0, Math.round(Number(item.cornerGeom.secondaryLen) - supportVisibleMm * 2))
          : armNominalLength(secondaryArm);
      const cornerText =
        secondaryLength > 0
          ? `${primaryLength} x ${secondaryLength}`
          : `${primaryLength}`;
      // Prefer the horizontal arm so corner labels sit on the same line as straight-module labels.
      const horizontalArm =
        getArmOrientation(primaryArm) === "horizontal"
          ? primaryArm
          : getArmOrientation(secondaryArm) === "horizontal"
            ? secondaryArm
            : null;
      const labelAnchorArm = horizontalArm || primaryArm || secondaryArm;
      const labelXMm = labelAnchorArm
        ? (Number(labelAnchorArm.minX || 0) + Number(labelAnchorArm.maxX || 0)) / 2
        : (Number(item.minX || 0) + Number(item.maxX || 0)) / 2;
      const labelYMm = labelAnchorArm
        ? (Number(labelAnchorArm.minY || 0) + Number(labelAnchorArm.maxY || 0)) / 2
        : (Number(item.minY || 0) + Number(item.maxY || 0)) / 2;
      dimensionLabels.push({
        edgeId: item.id,
        moduleIndex,
        x: labelXMm * scale + tx,
        y: labelYMm * scale + ty,
        text: cornerText,
        corner: true,
      });
      moduleInfoLabels.push({
        edgeId: item.id,
        x: labelXMm * scale + tx,
        y: labelYMm * scale + ty,
        count: shelfCount,
        addons: addonSummary,
        compose: composeInfo,
        corner: true,
      });
      return;
    }
    const lengthWithSupport = Math.max(item.maxX - item.minX, item.maxY - item.minY);
    const nominalLength = Math.max(
      0,
      Math.round(lengthWithSupport - supportVisibleMm * 2)
    );
    dimensionLabels.push({
      edgeId: item.id,
      moduleIndex,
      x: ((item.minX + item.maxX) / 2) * scale + tx,
      y: ((item.minY + item.maxY) / 2) * scale + ty,
      text: `${nominalLength}`,
      corner: false,
    });
    moduleInfoLabels.push({
      edgeId: item.id,
      x: ((item.minX + item.maxX) / 2) * scale + tx,
      y: ((item.minY + item.maxY) / 2) * scale + ty,
      count: shelfCount,
      addons: addonSummary,
      compose: composeInfo,
      corner: false,
    });
  });

  if (showSizeInfo) {
    const compactStates = resolveDimensionLabelCompactStates(dimensionLabels, shelvesEl);
    dimensionLabels.forEach((labelInfo, index) => {
      const labelEl = createDimensionLabelElement(labelInfo, {
        compact: Boolean(compactStates[index]),
      });
      shelvesEl.appendChild(labelEl);
    });
  } else {
    const densityLevels = previewCaptureIndexOnlyMode
      ? moduleInfoLabels.map(() => 1)
      : resolveModuleLabelDensityLevels(moduleInfoLabels, shelvesEl);
    moduleInfoLabels.forEach((labelInfo, index) => {
      const labelEl = createModuleLabelElement(labelInfo, {
        level: densityLevels[index],
        index: index + 1,
      });
      shelvesEl.appendChild(labelEl);
    });
  }
}

export function buildPreviewSectionsAndEndpoints({
  input,
  sectionLengthSegments = [],
  sectionColumnMarks = {},
  endpointCandidates = [],
  columnCenters = [],
  columnEndpointWidthMm = 20,
  buildSectionRunsFromSegments,
  buildOuterSectionLabels,
  getLayoutConfigSnapshot,
  updatePreviewWidthSummary,
  syncLayoutSectionUsageSnapshot,
  isPreviewBuilderReady,
  getPreviewBuilderDisabledReason,
  collectOpenEndpointsFromCandidates,
  getEdgeHintFromDir,
  pushUniquePoint,
} = {}) {
  const sectionRuns = buildSectionRunsFromSegments(sectionLengthSegments);
  const sectionLabels = buildOuterSectionLabels(sectionRuns, sectionColumnMarks);
  const layoutForPreview = getLayoutConfigSnapshot(input);
  const sideWidthLabels = sectionLabels.map((run) => ({
    sectionIndex: 0,
    edgeHint: run.edgeHint,
    x: Number(run.x || 0),
    y: Number(run.y || 0),
    totalMm: Math.round(Math.max(columnEndpointWidthMm, Number(run.totalMm || 0))),
    targetMm: 0,
    text: `${Math.round(Math.max(columnEndpointWidthMm, Number(run.totalMm || 0)))}mm`,
    overflow: false,
  }));
  sideWidthLabels.forEach((label, idx) => {
    label.sectionIndex = idx;
    const targetMm = Number(layoutForPreview.sections?.[idx]?.lengthMm || 0);
    label.targetMm = targetMm > 0 ? targetMm : 0;
    label.overflow = label.targetMm > 0 && Number(label.totalMm || 0) > label.targetMm;
    if (label.targetMm > 0) {
      label.text = `${Math.round(Number(label.totalMm || 0))}/${Math.round(label.targetMm)}`;
    } else {
      label.text = `${Math.round(Number(label.totalMm || 0))}mm`;
    }
  });
  updatePreviewWidthSummary(input, sectionLabels);
  syncLayoutSectionUsageSnapshot(sideWidthLabels, input);
  const canAddFromPreview = isPreviewBuilderReady(input);
  const previewDisabledReason = canAddFromPreview ? "" : getPreviewBuilderDisabledReason(input);

  const addButtons = collectOpenEndpointsFromCandidates(endpointCandidates);
  addButtons.forEach((point) => {
    const edgeHint = getEdgeHintFromDir({
      dx: Number(point.extendDx || 0),
      dy: Number(point.extendDy || 0),
    });
    pushUniquePoint(columnCenters, {
      x: Number(point.x || 0),
      y: Number(point.y || 0),
      inwardX: Number(point.inwardX || 0),
      inwardY: Number(point.inwardY || 0),
      edgeHint,
      columnWidthMm: Math.max(1, Number(point.postBarWidthMm || columnEndpointWidthMm)),
      isStructuralColumn: false,
    });
  });
  const previewOpenEndpoints = new Map(
    addButtons
      .filter((point) => point.endpointId)
      .map((point) => [point.endpointId, { ...point }])
  );

  return {
    sectionLabels,
    sideWidthLabels,
    canAddFromPreview,
    previewDisabledReason,
    addButtons,
    previewOpenEndpoints,
  };
}
