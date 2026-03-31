export function buildPreviewGeometryFromEdges({
  edges = [],
  depthMm = 400,
  supportVisibleMm = 5,
  columnEndpointHalfMm = 12.5,
  columnEndpointWidthMm = 25,
  resolvedOpenEndpoints = new Map(),
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
} = {}) {
  const shelves = [];
  const columnCenters = [];
  const endpointCandidates = [];
  edges.forEach((edge) => {
    const anchorEndpointId = String(edge.anchorEndpointId || "");
    const anchorEndpoint = anchorEndpointId ? resolvedOpenEndpoints.get(anchorEndpointId) || null : null;
    let placement = hasValidPlacement(edge.placement) ? edge.placement : null;
    if (anchorEndpoint) {
      let placementSource = anchorEndpoint;
      const hasAnchorDir =
        Number.isFinite(Number(edge.anchorDirDx)) && Number.isFinite(Number(edge.anchorDirDy));
      const hasAnchorInward =
        Number.isFinite(Number(edge.anchorInwardX)) && Number.isFinite(Number(edge.anchorInwardY));
      if ((hasAnchorDir || hasAnchorInward) && anchorEndpointId === "root-endpoint") {
        const dir = hasAnchorDir
          ? normalizeDirection(edge.anchorDirDx, edge.anchorDirDy)
          : normalizeDirection(anchorEndpoint.extendDx, anchorEndpoint.extendDy);
        let inward = hasAnchorInward
          ? normalizeDirection(edge.anchorInwardX, edge.anchorInwardY)
          : normalizeDirection(anchorEndpoint.inwardX, anchorEndpoint.inwardY);
        const dot = dir.dx * inward.dx + dir.dy * inward.dy;
        if (Math.abs(dot) > 0.9) inward = { dx: -dir.dy, dy: dir.dx };
        placementSource = {
          ...anchorEndpoint,
          extendDx: dir.dx,
          extendDy: dir.dy,
          inwardX: inward.dx,
          inwardY: inward.dy,
        };
      }
      const anchoredPlacement = buildPlacementFromEndpoint(placementSource);
      if (anchoredPlacement) placement = anchoredPlacement;
      consumeResolvedEndpoint(anchorEndpointId);
    }
    if (!placement) {
      const hasAnchorDir =
        Number.isFinite(Number(edge.anchorDirDx)) && Number.isFinite(Number(edge.anchorDirDy));
      const hasAnchorInward =
        Number.isFinite(Number(edge.anchorInwardX)) && Number.isFinite(Number(edge.anchorInwardY));
      const rootSource = buildRootEndpoint();
      const dir = hasAnchorDir
        ? normalizeDirection(edge.anchorDirDx, edge.anchorDirDy)
        : normalizeDirection(rootSource.extendDx, rootSource.extendDy);
      let inward = hasAnchorInward
        ? normalizeDirection(edge.anchorInwardX, edge.anchorInwardY)
        : normalizeDirection(rootSource.inwardX, rootSource.inwardY);
      const dot = dir.dx * inward.dx + dir.dy * inward.dy;
      if (Math.abs(dot) > 0.9) inward = { dx: -dir.dy, dy: dir.dx };
      placement = buildPlacementFromEndpoint({
        ...rootSource,
        extendDx: dir.dx,
        extendDy: dir.dy,
        inwardX: inward.dx,
        inwardY: inward.dy,
      });
    }
    if (!placement) {
      // Keep endpoint model deterministic: unresolved edges are skipped rather than placed by side fallback.
      return;
    }

    const drawDirNormalized = normalizeDirection(placement.dirDx, placement.dirDy);
    let drawInwardNormalized = normalizeDirection(placement.inwardX, placement.inwardY);
    const dot =
      drawDirNormalized.dx * drawInwardNormalized.dx + drawDirNormalized.dy * drawInwardNormalized.dy;
    if (Math.abs(dot) > 0.9) {
      drawInwardNormalized = { dx: -drawDirNormalized.dy, dy: drawDirNormalized.dx };
    }
    const drawDir = { dx: drawDirNormalized.dx, dy: drawDirNormalized.dy };
    const drawInward = { x: drawInwardNormalized.dx, y: drawInwardNormalized.dy };
    const px = Number(placement.startX || 0);
    const py = Number(placement.startY || 0);
    edge.placement = {
      startX: px,
      startY: py,
      dirDx: drawDir.dx,
      dirDy: drawDir.dy,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
    };

    const primarySideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);
    const edgeHint = getEdgeHintFromDir(drawDir);
    const primarySegmentHint = getEdgeHintFromInward(drawInward.x, drawInward.y);

    if (edge.type !== "corner") {
      const widthMm = (Number(edge.width || 0) || 0) + supportVisibleMm * 2;
      recordSectionSegment({
        startX: px,
        startY: py,
        endX: px + drawDir.dx * widthMm,
        endY: py + drawDir.dy * widthMm,
        nominalLength: Number(edge.width || 0),
        inwardX: drawInward.x,
        inwardY: drawInward.y,
      });
      const startCenterX = px + drawDir.dx * (-columnEndpointHalfMm);
      const startCenterY = py + drawDir.dy * (-columnEndpointHalfMm);
      const endCenterX = px + drawDir.dx * (widthMm + columnEndpointHalfMm);
      const endCenterY = py + drawDir.dy * (widthMm + columnEndpointHalfMm);
      markSectionColumn(primarySegmentHint, startCenterX, startCenterY);
      markSectionColumn(primarySegmentHint, endCenterX, endCenterY);
      pushUniquePoint(columnCenters, {
        x: startCenterX,
        y: startCenterY,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        edgeHint,
        columnWidthMm: columnEndpointWidthMm,
      });
      pushUniquePoint(columnCenters, {
        x: endCenterX,
        y: endCenterY,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        edgeHint,
        columnWidthMm: columnEndpointWidthMm,
      });
      const startSideIndex = directionToSideIndex(-drawDir.dx, -drawDir.dy);
      const endSideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);
      const startCandidate = {
        x: startCenterX,
        y: startCenterY,
        sideIndex: startSideIndex,
        attachSideIndex: startSideIndex,
        attachAtStart: true,
        extendDx: -drawDir.dx,
        extendDy: -drawDir.dy,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        postBarWidthMm: columnEndpointWidthMm,
        allowedTypes: ["normal", "corner"],
      };
      startCandidate.endpointId = `${edge.id}:start`;
      endpointCandidates.push(startCandidate);
      registerResolvedEndpoint(startCandidate);
      const endCandidate = {
        x: endCenterX,
        y: endCenterY,
        sideIndex: endSideIndex,
        attachSideIndex: endSideIndex,
        attachAtStart: false,
        extendDx: drawDir.dx,
        extendDy: drawDir.dy,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
        postBarWidthMm: columnEndpointWidthMm,
        allowedTypes: ["normal", "corner"],
        endpointId: `${edge.id}:end`,
      };
      endpointCandidates.push(endCandidate);
      registerResolvedEndpoint(endCandidate);

      const rect = buildRectBounds(px, py, drawDir, drawInward, widthMm, depthMm);
      shelves.push({
        id: edge.id,
        isCorner: false,
        title: "모듈 옵션 수정",
        minX: rect.minX,
        minY: rect.minY,
        maxX: rect.maxX,
        maxY: rect.maxY,
      });
      return;
    }

    const corner = edge;
    const secondDir = { dx: drawInward.x, dy: drawInward.y };
    const secondSideIndex = directionToSideIndex(secondDir.dx, secondDir.dy);
    const { primaryMm: primaryNominal, secondaryMm: secondaryNominal } = getResolvedCornerArmLengthsMm(corner, {
      primarySideIndex,
      secondarySideIndex: secondSideIndex,
    });
    const primaryLen = primaryNominal + supportVisibleMm * 2;
    const secondLen = secondaryNominal + supportVisibleMm * 2;
    recordSectionSegment({
      startX: px,
      startY: py,
      endX: px + drawDir.dx * primaryLen,
      endY: py + drawDir.dy * primaryLen,
      nominalLength: primaryNominal,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
    });

    const secondInward = { x: -drawDir.dx, y: -drawDir.dy };
    const secondarySegmentHint = getEdgeHintFromInward(secondInward.x, secondInward.y);
    const secondStartX = px + drawDir.dx * primaryLen;
    const secondStartY = py + drawDir.dy * primaryLen;
    recordSectionSegment({
      startX: secondStartX,
      startY: secondStartY,
      endX: secondStartX + secondDir.dx * secondLen,
      endY: secondStartY + secondDir.dy * secondLen,
      nominalLength: secondaryNominal,
      inwardX: secondInward.x,
      inwardY: secondInward.y,
    });

    const startCenterX = px + drawDir.dx * (-columnEndpointHalfMm);
    const startCenterY = py + drawDir.dy * (-columnEndpointHalfMm);
    const secondEndCenter = {
      x: secondStartX + secondDir.dx * (secondLen + columnEndpointHalfMm),
      y: secondStartY + secondDir.dy * (secondLen + columnEndpointHalfMm),
    };
    markSectionColumn(primarySegmentHint, startCenterX, startCenterY);
    markSectionColumn(secondarySegmentHint, secondEndCenter.x, secondEndCenter.y);

    const startCandidate = {
      x: startCenterX,
      y: startCenterY,
      sideIndex: directionToSideIndex(-drawDir.dx, -drawDir.dy),
      attachSideIndex: directionToSideIndex(-drawDir.dx, -drawDir.dy),
      attachAtStart: true,
      extendDx: -drawDir.dx,
      extendDy: -drawDir.dy,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
      postBarWidthMm: columnEndpointWidthMm,
      allowedTypes: ["normal", "corner"],
    };
    startCandidate.endpointId = `${edge.id}:start`;
    endpointCandidates.push(startCandidate);
    registerResolvedEndpoint(startCandidate);
    const secondEndCandidate = {
      x: secondEndCenter.x,
      y: secondEndCenter.y,
      sideIndex: secondSideIndex,
      attachSideIndex: secondSideIndex,
      attachAtStart: false,
      extendDx: secondDir.dx,
      extendDy: secondDir.dy,
      inwardX: secondInward.x,
      inwardY: secondInward.y,
      postBarWidthMm: columnEndpointWidthMm,
      allowedTypes: ["normal", "corner"],
    };
    secondEndCandidate.endpointId = `${edge.id}:end`;
    endpointCandidates.push(secondEndCandidate);
    registerResolvedEndpoint(secondEndCandidate);

    pushUniquePoint(columnCenters, {
      x: startCenterX,
      y: startCenterY,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
      edgeHint: getEdgeHintFromDir({ dx: -drawDir.dx, dy: -drawDir.dy }),
      columnWidthMm: columnEndpointWidthMm,
    });
    pushUniquePoint(columnCenters, {
      x: secondEndCenter.x,
      y: secondEndCenter.y,
      inwardX: secondInward.x,
      inwardY: secondInward.y,
      edgeHint: getEdgeHintFromDir(secondDir),
      columnWidthMm: columnEndpointWidthMm,
    });
    const cornerPostAngleDeg = (Math.atan2(drawDir.dy - secondDir.dy, drawDir.dx - secondDir.dx) * 180) / Math.PI;
    pushUniquePoint(columnCenters, {
      x: secondStartX,
      y: secondStartY,
      inwardX: drawInward.x + secondInward.x,
      inwardY: drawInward.y + secondInward.y,
      edgeHint: "",
      rotationDeg: cornerPostAngleDeg,
      columnRole: "corner-post",
    });

    const currentArm = buildRectBounds(px, py, drawDir, drawInward, primaryLen, depthMm);
    const secondArm = buildRectBounds(secondStartX, secondStartY, secondDir, secondInward, secondLen, depthMm);
    shelves.push({
      id: edge.id,
      isCorner: true,
      title: `${getCornerLabel(edge)} 옵션 수정`,
      minX: Math.min(currentArm.minX, secondArm.minX),
      minY: Math.min(currentArm.minY, secondArm.minY),
      maxX: Math.max(currentArm.maxX, secondArm.maxX),
      maxY: Math.max(currentArm.maxY, secondArm.maxY),
      arms: [currentArm, secondArm],
      cornerGeom: {
        originX: px,
        originY: py,
        u: { dx: drawDir.dx, dy: drawDir.dy },
        v: { dx: drawInward.x, dy: drawInward.y },
        primaryLen,
        secondaryLen: secondLen,
        depth: depthMm,
      },
    });
  });

  return {
    shelves,
    columnCenters,
    endpointCandidates,
  };
}
