export function createSystemPreviewController(deps = {}) {
  const {
    SYSTEM_SHELF_MATERIALS = {},
    SYSTEM_COLUMN_MATERIALS = {},
    SWATCH_FALLBACK = "#d9d9d9",
    COLUMN_ENDPOINT_WIDTH_MM = 25,
    COLUMN_WIDTH_MM = 30,
    COLUMN_DEPTH_MM = 75,
    COLUMN_ENDPOINT_HALF_MM = 12.5,
    SUPPORT_VISIBLE_MM = 5,
    $,
    readCurrentInputs,
    readBayInputs,
    getPreviewOrderedEdges,
    getOrderedGraphEdges,
    getLayoutConfigSnapshot,
    updatePreviewWidthSummary,
    syncLayoutSectionUsageSnapshot,
    isPreviewBuilderReady,
    getPreviewBuilderDisabledReason,
    buildLayoutPreviewSummaryText,
    buildPreviewOptionText,
    hidePreviewAddTooltip,
    clearPreviewGhost,
    isCoarsePointerEnvironment,
    buildPreviewUiMetrics,
    applyPreviewUiMetricsToShelvesElement,
    createSectionUsageCollector,
    createResolvedEndpointRegistry,
    buildEndpointStableId,
    buildPreviewGeometryFromEdges,
    hasValidPlacement,
    normalizeDirection,
    buildPlacementFromEndpoint,
    directionToSideIndex,
    getEdgeHintFromDir,
    getEdgeHintFromInward,
    getResolvedCornerArmLengthsMm,
    pushUniquePoint,
    buildRectBounds,
    getCornerLabel,
    buildPreviewSectionsAndEndpoints,
    buildSectionRunsFromSegments,
    buildOuterSectionLabels,
    collectOpenEndpointsFromCandidates,
    resolvePreviewViewportTransform,
    setPreviewRenderTransform,
    renderPreviewShelves,
    buildCornerSvgPathData,
    setPreviewEdgeHoverState,
    renderPreviewColumns,
    renderPreviewModuleAndDimensionLabels,
    formatAddonCompactBreakdown,
    getShelfAddonIds,
    getComposeTabLabelInfo,
    resolveDimensionLabelCompactStates,
    createDimensionLabelElement,
    resolveModuleLabelDensityLevels,
    createModuleLabelElement,
    renderPreviewOuterAndColumnDimensionLabels,
    renderRootEndpointAddButton,
    applyPreviewAddButtonState,
    bindAddButtonPreviewInteractions,
    placePreviewAddButtons,
    getPreviewAddButtonPlacementKey,
    getBoundingRectOnParent,
    buildRootEndpoint,
    getPreviewInfoMode = () => "size",
    getPreviewCaptureIndexOnlyMode = () => false,
    setPreviewFrameLastSize,
    getPreviewAddButtonPlacementHints,
    setPreviewAddButtonPlacementHints,
    setPreviewOpenEndpoints,
  } = deps;

  const getPlacementHints = () => {
    const hints =
      typeof getPreviewAddButtonPlacementHints === "function"
        ? getPreviewAddButtonPlacementHints()
        : null;
    return hints instanceof Map ? hints : new Map();
  };

  const assignPreviewFrameLastSize = (nextValue) => {
    if (typeof setPreviewFrameLastSize === "function") {
      setPreviewFrameLastSize(nextValue);
    }
  };

  const assignPreviewAddButtonPlacementHints = (nextValue) => {
    if (typeof setPreviewAddButtonPlacementHints === "function") {
      setPreviewAddButtonPlacementHints(nextValue);
    }
  };

  const assignPreviewOpenEndpoints = (nextValue) => {
    if (typeof setPreviewOpenEndpoints === "function") {
      setPreviewOpenEndpoints(nextValue);
    }
  };

  const updatePreview = () => {
    const input = readCurrentInputs();
    const shelfMat = SYSTEM_SHELF_MATERIALS[input.shelf.materialId];
    const columnMat = SYSTEM_COLUMN_MATERIALS[input.column.materialId];
    const frame = $("#systemPreviewFrame");
    const shelvesEl = $("#systemPreviewShelves");
    const textEl = $("#systemPreviewText");
    if (!frame || !shelvesEl || !textEl) return;

    hidePreviewAddTooltip();
    const frameRect = frame.getBoundingClientRect();
    const frameW = frameRect.width || 260;
    const frameH = frameRect.height || 220;
    assignPreviewFrameLastSize({
      width: Math.round(Number(frameW || 0)),
      height: Math.round(Number(frameH || 0)),
    });

    const coarsePointer = isCoarsePointerEnvironment();
    const previewUiMetrics = buildPreviewUiMetrics(frameW, frameH, { coarsePointer });
    const { uiScale, addBtnSize } = previewUiMetrics;
    applyPreviewUiMetricsToShelvesElement(shelvesEl, previewUiMetrics);

    frame.querySelectorAll(".system-column").forEach((col) => {
      col.style.display = "none";
    });

    const bays = readBayInputs({ includePending: true });
    const edges = getPreviewOrderedEdges(getOrderedGraphEdges({ includePending: true }));
    const hasShelfBase = Boolean(shelfMat && input.shelf.thickness);
    const hasColumn = Boolean(columnMat && input.column.minLength && input.column.maxLength);
    let canAddFromPreview = false;
    let previewDisabledReason = "";
    const showModuleInfo = getPreviewInfoMode() === "module";
    const showSizeInfo = !showModuleInfo;

    updatePreviewWidthSummary(input, []);
    syncLayoutSectionUsageSnapshot([], input);
    canAddFromPreview = isPreviewBuilderReady(input);
    previewDisabledReason = canAddFromPreview ? "" : getPreviewBuilderDisabledReason(input);

    if (!hasShelfBase || !hasColumn) {
      textEl.textContent = `${buildLayoutPreviewSummaryText(
        input
      )} · 옵션 선택 후 모듈을 추가하면 미리보기가 표시됩니다.`;
      shelvesEl.innerHTML = "";
      clearPreviewGhost();
      assignPreviewAddButtonPlacementHints(new Map());
      if (!bays.length) {
        const nextOpenEndpoints = new Map();
        const rootEndpoint = buildRootEndpoint();
        renderRootEndpointAddButton({
          shelvesEl,
          frameW,
          frameH,
          canAddFromPreview,
          previewDisabledReason,
          rootEndpoint,
          applyPreviewAddButtonState,
          bindAddButtonPreviewInteractions,
        });
        nextOpenEndpoints.set("root-endpoint", rootEndpoint);
        assignPreviewOpenEndpoints(nextOpenEndpoints);
      }
      return;
    }

    shelvesEl.innerHTML = "";
    clearPreviewGhost();
    textEl.textContent = buildPreviewOptionText(input, shelfMat, columnMat);

    const depthMm = 400;
    const { sectionColumnMarks, sectionLengthSegments, markSectionColumn, recordSectionSegment } =
      createSectionUsageCollector({
        columnEndpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
        columnWidthMm: COLUMN_WIDTH_MM,
        getEdgeHintFromInward,
      });
    const { resolvedOpenEndpoints, registerResolvedEndpoint, consumeResolvedEndpoint } =
      createResolvedEndpointRegistry({
        buildEndpointStableId,
      });

    const rootEndpoint = buildRootEndpoint();
    registerResolvedEndpoint(rootEndpoint);

    const previewGeometry = buildPreviewGeometryFromEdges({
      edges,
      depthMm,
      supportVisibleMm: SUPPORT_VISIBLE_MM,
      columnEndpointHalfMm: COLUMN_ENDPOINT_HALF_MM,
      columnEndpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
      resolvedOpenEndpoints,
      registerResolvedEndpoint,
      consumeResolvedEndpoint,
      hasValidPlacement,
      normalizeDirection,
      buildPlacementFromEndpoint,
      buildRootEndpoint,
      directionToSideIndex,
      getEdgeHintFromDir,
      getEdgeHintFromInward,
      getResolvedCornerArmLengthsMm,
      pushUniquePoint,
      buildRectBounds,
      getCornerLabel,
      markSectionColumn,
      recordSectionSegment,
    });
    const shelves = previewGeometry.shelves;
    const columnCenters = previewGeometry.columnCenters;
    const endpointCandidates = previewGeometry.endpointCandidates;

    const sectionAndEndpointModel = buildPreviewSectionsAndEndpoints({
      input,
      sectionLengthSegments,
      sectionColumnMarks,
      endpointCandidates,
      columnCenters,
      columnEndpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
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
    });
    const sideWidthLabels = sectionAndEndpointModel.sideWidthLabels;
    canAddFromPreview = sectionAndEndpointModel.canAddFromPreview;
    previewDisabledReason = sectionAndEndpointModel.previewDisabledReason;
    const addButtons = sectionAndEndpointModel.addButtons;
    assignPreviewOpenEndpoints(sectionAndEndpointModel.previewOpenEndpoints);

    const { scale, tx, ty, shelfBoxesPx } = resolvePreviewViewportTransform({
      shelves,
      addButtons,
      addBtnSize,
      frameW,
      frameH,
    });
    setPreviewRenderTransform({ scale, tx, ty, depthMm });

    renderPreviewShelves({
      shelves,
      shelvesEl,
      scale,
      tx,
      ty,
      uiScale,
      buildCornerSvgPathData,
      shelfSwatch: shelfMat?.swatch || "",
      swatchFallback: SWATCH_FALLBACK,
      setPreviewEdgeHoverState,
    });

    const { columnDepthPx, columnLabelCenters, columnBoxesPx } = renderPreviewColumns({
      columnCenters,
      shelvesEl,
      depthMm,
      scale,
      tx,
      ty,
      columnDepthMm: COLUMN_DEPTH_MM,
      columnWidthMm: COLUMN_WIDTH_MM,
      columnEndpointWidthMm: COLUMN_ENDPOINT_WIDTH_MM,
      columnSwatch: columnMat?.swatch || "#d9d9d9",
    });

    renderPreviewModuleAndDimensionLabels({
      shelves,
      edges,
      scale,
      tx,
      ty,
      supportVisibleMm: SUPPORT_VISIBLE_MM,
      shelvesEl,
      showSizeInfo,
      previewCaptureIndexOnlyMode: getPreviewCaptureIndexOnlyMode(),
      formatAddonCompactBreakdown,
      getShelfAddonIds,
      getComposeTabLabelInfo,
      resolveDimensionLabelCompactStates,
      createDimensionLabelElement,
      resolveModuleLabelDensityLevels,
      createModuleLabelElement,
    });

    renderPreviewOuterAndColumnDimensionLabels({
      shelvesEl,
      sideWidthLabels,
      shelves,
      scale,
      tx,
      ty,
      frameW,
      frameH,
      showSizeInfo,
      columnLabelCenters,
      columnWidthMm: COLUMN_WIDTH_MM,
    });

    if (!shelves.length && !addButtons.length) {
      const nextOpenEndpoints = new Map();
      const nextRootEndpoint = buildRootEndpoint();
      renderRootEndpointAddButton({
        shelvesEl,
        frameW,
        frameH,
        canAddFromPreview,
        previewDisabledReason,
        rootEndpoint: nextRootEndpoint,
        applyPreviewAddButtonState,
        bindAddButtonPreviewInteractions,
      });
      nextOpenEndpoints.set("root-endpoint", nextRootEndpoint);
      assignPreviewOpenEndpoints(nextOpenEndpoints);
    }

    const addButtonPlacementResult = placePreviewAddButtons({
      addButtons,
      addBtnSize,
      shelvesEl,
      edges,
      frameW,
      frameH,
      scale,
      tx,
      ty,
      depthMm,
      columnDepthPx,
      shelfBoxesPx,
      columnBoxesPx,
      canAddFromPreview,
      previewDisabledReason,
      applyPreviewAddButtonState,
      bindAddButtonPreviewInteractions,
      normalizeDirection,
      getPreviewAddButtonPlacementKey,
      previewAddButtonPlacementHints: getPlacementHints(),
      getBoundingRectOnParent,
    });
    assignPreviewAddButtonPlacementHints(addButtonPlacementResult.nextPlacementHints);
  };

  return {
    updatePreview,
  };
}
