export function createSystemPreviewAnchorHelpers({
  hasValidPlacement,
  normalizeDirection,
  directionToSideIndex,
  buildEndpointStableId,
  getResolvedCornerArmLengthsMm,
  getEdgeEndpointDirections,
  getOrderedGraphEdges,
  getOrderedCommittedGraphEdges,
  clearRootAnchorVector,
  supportVisibleMm = 5,
  columnEndpointHalfMm = 12.5,
} = {}) {
  function getEdgeEndpointAliasSets(edge) {
    const startAliases = new Set([`${String(edge?.id || "")}:start`]);
    const endAliases = new Set([`${String(edge?.id || "")}:end`]);
    if (!edge || !hasValidPlacement(edge.placement)) {
      return { startAliases, endAliases };
    }

    const placement = edge.placement;
    const drawDir = normalizeDirection(placement.dirDx, placement.dirDy);
    let drawInwardNorm = normalizeDirection(placement.inwardX, placement.inwardY);
    const dot = drawDir.dx * drawInwardNorm.dx + drawDir.dy * drawInwardNorm.dy;
    if (Math.abs(dot) > 0.9) drawInwardNorm = { dx: -drawDir.dy, dy: drawDir.dx };
    const drawInward = { x: drawInwardNorm.dx, y: drawInwardNorm.dy };
    const px = Number(placement.startX || 0);
    const py = Number(placement.startY || 0);

    if (edge.type !== "corner") {
      const widthMm = (Number(edge.width || 0) || 0) + supportVisibleMm * 2;
      const startCenterX = px + drawDir.dx * (-columnEndpointHalfMm);
      const startCenterY = py + drawDir.dy * (-columnEndpointHalfMm);
      const endCenterX = px + drawDir.dx * (widthMm + columnEndpointHalfMm);
      const endCenterY = py + drawDir.dy * (widthMm + columnEndpointHalfMm);
      startAliases.add(
        buildEndpointStableId({
          x: startCenterX,
          y: startCenterY,
          extendDx: -drawDir.dx,
          extendDy: -drawDir.dy,
          inwardX: drawInward.x,
          inwardY: drawInward.y,
        })
      );
      endAliases.add(
        buildEndpointStableId({
          x: endCenterX,
          y: endCenterY,
          extendDx: drawDir.dx,
          extendDy: drawDir.dy,
          inwardX: drawInward.x,
          inwardY: drawInward.y,
        })
      );
      return { startAliases, endAliases };
    }

    const secondDir = { dx: drawInward.x, dy: drawInward.y };
    const primarySideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);
    const { primaryMm: primaryNominal, secondaryMm: secondaryNominal } = getResolvedCornerArmLengthsMm(edge, {
      primarySideIndex,
      secondarySideIndex: directionToSideIndex(secondDir.dx, secondDir.dy),
    });
    const primaryLen = primaryNominal + supportVisibleMm * 2;
    const secondLen = secondaryNominal + supportVisibleMm * 2;
    const secondInward = { x: -drawDir.dx, y: -drawDir.dy };
    const secondStartX = px + drawDir.dx * primaryLen;
    const secondStartY = py + drawDir.dy * primaryLen;
    const startCenterX = px + drawDir.dx * (-columnEndpointHalfMm);
    const startCenterY = py + drawDir.dy * (-columnEndpointHalfMm);
    const secondEndCenterX = secondStartX + secondDir.dx * (secondLen + columnEndpointHalfMm);
    const secondEndCenterY = secondStartY + secondDir.dy * (secondLen + columnEndpointHalfMm);

    startAliases.add(
      buildEndpointStableId({
        x: startCenterX,
        y: startCenterY,
        extendDx: -drawDir.dx,
        extendDy: -drawDir.dy,
        inwardX: drawInward.x,
        inwardY: drawInward.y,
      })
    );
    endAliases.add(
      buildEndpointStableId({
        x: secondEndCenterX,
        y: secondEndCenterY,
        extendDx: secondDir.dx,
        extendDy: secondDir.dy,
        inwardX: secondInward.x,
        inwardY: secondInward.y,
      })
    );
    return { startAliases, endAliases };
  }

  function resolveAnchorForDirection(anchorId, preferredDir = null, { includePending = false } = {}) {
    const raw = String(anchorId || "");
    if (!raw || raw === "root-endpoint") return "root-endpoint";
    const edges = includePending
      ? getOrderedGraphEdges({ includePending: true })
      : getOrderedCommittedGraphEdges();
    let parent = null;
    let canonical = "";

    const directMatch = raw.match(/^(.+):(start|end)$/);
    if (directMatch) {
      const edgeId = String(directMatch[1] || "");
      const edge = edges.find((it) => String(it?.id || "") === edgeId);
      if (edge) {
        parent = edge;
        canonical = `${edgeId}:${directMatch[2]}`;
      }
    }

    if (!parent) {
      for (let i = 0; i < edges.length; i += 1) {
        const edge = edges[i];
        const { startAliases, endAliases } = getEdgeEndpointAliasSets(edge);
        if (startAliases.has(raw)) {
          parent = edge;
          canonical = `${String(edge.id || "")}:start`;
          break;
        }
        if (endAliases.has(raw)) {
          parent = edge;
          canonical = `${String(edge.id || "")}:end`;
          break;
        }
      }
    }

    if (!parent) return "";
    if (!preferredDir) return canonical || raw;
    const pref = normalizeDirection(preferredDir.dx, preferredDir.dy);
    const dirs = getEdgeEndpointDirections(parent);
    const scoreStart = pref.dx * dirs.start.dx + pref.dy * dirs.start.dy;
    const scoreEnd = pref.dx * dirs.end.dx + pref.dy * dirs.end.dy;
    if (Math.abs(scoreEnd - scoreStart) < 1e-6) {
      return canonical || raw;
    }
    return `${String(parent.id || "")}:${scoreEnd > scoreStart ? "end" : "start"}`;
  }

  function normalizeDanglingAnchorIds() {
    const edges = getOrderedGraphEdges({ includePending: true });
    const existingIds = new Set(edges.map((it) => String(it?.id || "")));
    edges.forEach((edge) => {
      const currentAnchor = String(edge.anchorEndpointId || "");
      if (!currentAnchor || currentAnchor === "root-endpoint") return;
      const explicitMatch = currentAnchor.match(/^(.+):(start|end)$/);
      if (explicitMatch) {
        const parentId = String(explicitMatch[1] || "");
        if (!existingIds.has(parentId)) {
          edge.anchorEndpointId = "root-endpoint";
          edge.placement = null;
          return;
        }
        if (parentId === String(edge.id || "")) {
          edge.anchorEndpointId = "root-endpoint";
          edge.placement = null;
          return;
        }
        return;
      }
      const preferredDir = hasValidPlacement(edge.placement)
        ? normalizeDirection(edge.placement.dirDx, edge.placement.dirDy)
        : null;
      const normalizedAnchor = resolveAnchorForDirection(currentAnchor, preferredDir, {
        includePending: true,
      });
      if (!normalizedAnchor) {
        edge.anchorEndpointId = "root-endpoint";
        edge.placement = null;
        return;
      }
      if (normalizedAnchor.startsWith(`${String(edge.id || "")}:`)) {
        edge.anchorEndpointId = "root-endpoint";
        edge.placement = null;
        return;
      }
      edge.anchorEndpointId = normalizedAnchor;
      if (normalizedAnchor !== "root-endpoint") {
        clearRootAnchorVector(edge);
      }
    });
  }

  return {
    getEdgeEndpointAliasSets,
    resolveAnchorForDirection,
    normalizeDanglingAnchorIds,
  };
}
