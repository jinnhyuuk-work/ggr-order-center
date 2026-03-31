export function createSystemBayAdjacentHelpers(deps = {}) {
  const {
    findShelfById,
    clearRootAnchorVector,
    moveEdgeBeforeInOrder,
    normalizeDanglingAnchorIds,
    resolveBayHorizontalEndpointSide,
    buildBayEndpointFromPlacement,
    collectEdgesAnchoredToEndpoint,
    resolveAnchorForDirection,
    parseCanonicalEndpointId,
    areEndpointsNear,
    getEndpointDistanceMm,
    findBayEndpointNeighborsByPlacement,
    insertBayBetweenModulesByTarget,
    renderBayInputs,
    addShelfFromEndpoint,
    setInlineInsertPendingFirstSaveEdgeId,
  } = deps;

function collectUniqueBayEdgeIds(edgeIds = []) {
  const seen = new Set();
  return (Array.isArray(edgeIds) ? edgeIds : [])
    .map((edgeId) => String(edgeId || ""))
    .filter((edgeId) => {
      if (!edgeId || seen.has(edgeId)) return false;
      const edge = findShelfById(edgeId);
      if (!edge || edge.type !== "bay") return false;
      seen.add(edgeId);
      return true;
    });
}

function reanchorBayChildChain(parentEdgeId, childEdgeIds = []) {
  const parentId = String(parentEdgeId || "");
  if (!parentId) return [];
  const chainIds = collectUniqueBayEdgeIds(childEdgeIds).filter((edgeId) => edgeId !== parentId);
  let anchorParentId = parentId;
  chainIds.forEach((childId) => {
    const child = findShelfById(childId);
    if (!child || child.type !== "bay") return;
    child.anchorEndpointId = `${anchorParentId}:end`;
    child.attachAtStart = false;
    clearRootAnchorVector(child);
    child.placement = null;
    anchorParentId = childId;
  });
  for (let i = chainIds.length - 2; i >= 0; i -= 1) {
    moveEdgeBeforeInOrder(chainIds[i], chainIds[i + 1]);
  }
  return chainIds;
}

function addBayAdjacentToModuleEdge(edgeId, { direction = "right" } = {}) {
  const targetId = String(edgeId || "");
  normalizeDanglingAnchorIds();
  const targetEdge = targetId ? findShelfById(targetId) : null;
  if (!targetEdge || targetEdge.type !== "bay") {
    return {
      ok: false,
      message: "일반 모듈에서만 좌/우 추가가 가능합니다.",
      shelfId: "",
    };
  }

  const endpointSide = resolveBayHorizontalEndpointSide(targetEdge, direction);
  const canonicalTargetEndpointId = `${targetId}:${endpointSide}`;
  const sourceEndpoint = buildBayEndpointFromPlacement(targetEdge, endpointSide);
  if (!sourceEndpoint) {
    return {
      ok: false,
      message: "추가할 기준 위치를 찾지 못했습니다.",
      shelfId: "",
    };
  }

  const anchoredEdges = collectEdgesAnchoredToEndpoint(targetId, endpointSide);
  const anchoredBayChildIds = collectUniqueBayEdgeIds(
    anchoredEdges
      .filter((edge) => String(edge?.type || "") === "bay")
      .map((edge) => String(edge?.id || ""))
  );
  if (anchoredEdges.some((edge) => edge && edge.type !== "bay")) {
    return {
      ok: false,
      message: "코너가 연결된 방향은 좌/우 추가를 지원하지 않습니다.",
      shelfId: "",
    };
  }

  const targetAnchorCanonical = resolveAnchorForDirection(String(targetEdge.anchorEndpointId || ""));
  const targetAnchorInfo = parseCanonicalEndpointId(targetAnchorCanonical);
  let parentNeighbor = null;
  if (targetAnchorInfo) {
    const parentEdge = findShelfById(targetAnchorInfo.edgeId);
    if (parentEdge?.type === "bay") {
      const targetStartEndpoint = buildBayEndpointFromPlacement(targetEdge, "start");
      const targetEndEndpoint = buildBayEndpointFromPlacement(targetEdge, "end");
      const alternateSide = targetAnchorInfo.side === "start" ? "end" : "start";
      const candidateSides = [targetAnchorInfo.side, alternateSide];
      let bestParentCandidate = null;
      candidateSides.forEach((candidateSide) => {
        const parentEndpoint = buildBayEndpointFromPlacement(parentEdge, candidateSide);
        if (!parentEndpoint) return;
        let connectedTargetSide = "";
        if (targetStartEndpoint && areEndpointsNear(parentEndpoint, targetStartEndpoint, 2.5)) {
          connectedTargetSide = "start";
        } else if (targetEndEndpoint && areEndpointsNear(parentEndpoint, targetEndEndpoint, 2.5)) {
          connectedTargetSide = "end";
        }
        if (connectedTargetSide !== endpointSide) return;
        const distanceMm = getEndpointDistanceMm(parentEndpoint, sourceEndpoint);
        if (
          !bestParentCandidate ||
          distanceMm < bestParentCandidate.distanceMm ||
          (Math.abs(distanceMm - bestParentCandidate.distanceMm) < 1e-6 &&
            candidateSide === targetAnchorInfo.side)
        ) {
          bestParentCandidate = {
            side: candidateSide,
            endpoint: parentEndpoint,
            distanceMm,
          };
        }
      });
      if (!bestParentCandidate && typeof targetEdge.attachAtStart === "boolean") {
        const connectedTargetSide = targetEdge.attachAtStart ? "start" : "end";
        if (connectedTargetSide === endpointSide) {
          const fallbackParentEndpoint = buildBayEndpointFromPlacement(parentEdge, targetAnchorInfo.side);
          if (fallbackParentEndpoint) {
            bestParentCandidate = {
              side: targetAnchorInfo.side,
              endpoint: fallbackParentEndpoint,
              distanceMm: getEndpointDistanceMm(fallbackParentEndpoint, sourceEndpoint),
            };
          }
        }
      }
      if (bestParentCandidate) {
        const parentEndpointId = `${targetAnchorInfo.edgeId}:${bestParentCandidate.side}`;
        parentNeighbor = {
          edge: parentEdge,
          parentEndpointId,
          sourceEndpoint: {
            ...bestParentCandidate.endpoint,
            endpointId: parentEndpointId,
          },
        };
      }
    }
  }

  let betweenPlan = null;
  let betweenChainChildIds = [];
  if (anchoredBayChildIds.length) {
    const anchoredChildId = anchoredBayChildIds[0];
    betweenPlan = {
      parentEdgeId: targetId,
      childEdgeId: anchoredChildId,
      parentEndpointId: canonicalTargetEndpointId,
      sourceEndpoint: {
        ...sourceEndpoint,
        endpointId: canonicalTargetEndpointId,
      },
      insertId: `insert:${targetId}:${endpointSide}:${anchoredChildId}`,
    };
    betweenChainChildIds = anchoredBayChildIds.slice();
  } else if (parentNeighbor) {
    betweenPlan = {
      parentEdgeId: String(parentNeighbor.edge.id || ""),
      childEdgeId: targetId,
      parentEndpointId: parentNeighbor.parentEndpointId,
      sourceEndpoint: parentNeighbor.sourceEndpoint,
      insertId: `insert:${String(parentNeighbor.edge.id || "")}:${targetId}`,
    };
    betweenChainChildIds = [targetId];
  }

  if (!betweenPlan) {
    const geometryNeighborsResult = findBayEndpointNeighborsByPlacement(targetEdge, endpointSide, 2.5);
    const geometryNeighbors = Array.isArray(geometryNeighborsResult.neighbors)
      ? geometryNeighborsResult.neighbors
      : [];
    const geometryBayNeighbors = geometryNeighbors.filter(
      (info) => info?.edge && info.edge.type === "bay" && String(info.edge.id || "") !== targetId
    );
    const geometryNeighborIds = collectUniqueBayEdgeIds(
      geometryBayNeighbors.map((info) => String(info?.edge?.id || ""))
    );
    if (geometryNeighborIds.length) {
      const geometryMetaById = new Map(
        geometryNeighborIds.map((neighborId) => {
          const neighborEdge = findShelfById(neighborId);
          const neighborAnchorCanonical = resolveAnchorForDirection(
            String(neighborEdge?.anchorEndpointId || "")
          );
          const neighborAnchorInfo = parseCanonicalEndpointId(neighborAnchorCanonical);
          return [
            neighborId,
            {
              neighborId,
              neighborEdge,
              neighborAnchorCanonical,
              neighborAnchorInfo,
            },
          ];
        })
      );

      const endpointAnchoredChildIds = geometryNeighborIds.filter((neighborId) => {
        const meta = geometryMetaById.get(neighborId);
        return Boolean(meta && meta.neighborAnchorCanonical === canonicalTargetEndpointId);
      });
      if (endpointAnchoredChildIds.length) {
        const firstChildId = endpointAnchoredChildIds[0];
        betweenPlan = {
          parentEdgeId: targetId,
          childEdgeId: firstChildId,
          parentEndpointId: canonicalTargetEndpointId,
          sourceEndpoint: {
            ...sourceEndpoint,
            endpointId: canonicalTargetEndpointId,
          },
          insertId: `insert:${targetId}:${endpointSide}:${firstChildId}`,
        };
        betweenChainChildIds = endpointAnchoredChildIds.slice();
      } else {
        const targetParentId = String(targetAnchorInfo?.edgeId || "");
        const targetParentMeta = targetParentId ? geometryMetaById.get(targetParentId) : null;
        const targetParentAnchorInfo = parseCanonicalEndpointId(targetAnchorCanonical);
        const canInsertBetweenParentAndTarget =
          Boolean(targetParentMeta?.neighborEdge) &&
          Boolean(targetParentAnchorInfo?.edgeId) &&
          String(targetParentAnchorInfo.edgeId || "") === targetParentId;
        if (canInsertBetweenParentAndTarget) {
          const parentEndpointSide = targetParentAnchorInfo.side === "start" ? "start" : "end";
          const parentSourceEndpoint = buildBayEndpointFromPlacement(
            targetParentMeta.neighborEdge,
            parentEndpointSide
          );
          if (parentSourceEndpoint) {
            const siblingChildIds = geometryNeighborIds.filter((neighborId) => {
              if (neighborId === targetParentId || neighborId === targetId) return false;
              const meta = geometryMetaById.get(neighborId);
              return Boolean(meta && meta.neighborAnchorCanonical === targetAnchorCanonical);
            });
            betweenPlan = {
              parentEdgeId: targetParentId,
              childEdgeId: targetId,
              parentEndpointId: targetAnchorCanonical,
              sourceEndpoint: {
                ...parentSourceEndpoint,
                endpointId: targetAnchorCanonical,
              },
              insertId: `insert:${targetParentId}:${targetId}`,
            };
            betweenChainChildIds = [targetId, ...siblingChildIds];
          }
        }
      }

      if (!betweenPlan) {
        const fallbackChildId = geometryNeighborIds[0];
        betweenPlan = {
          parentEdgeId: targetId,
          childEdgeId: fallbackChildId,
          parentEndpointId: canonicalTargetEndpointId,
          sourceEndpoint: {
            ...sourceEndpoint,
            endpointId: canonicalTargetEndpointId,
          },
          insertId: `insert:${targetId}:${endpointSide}:${fallbackChildId}`,
        };
        betweenChainChildIds = geometryNeighborIds.slice();
      }
    }
  }

  if (betweenPlan) {
    const insertedShelfId = insertBayBetweenModulesByTarget({
      id: betweenPlan.insertId,
      parentEdgeId: betweenPlan.parentEdgeId,
      childEdgeId: betweenPlan.childEdgeId,
      parentEndpointId: betweenPlan.parentEndpointId,
      sourceEndpoint: betweenPlan.sourceEndpoint,
      pushHistory: false,
      initialCount: 1,
      pendingAdd: true,
    });
    if (!insertedShelfId) {
      return {
        ok: false,
        message: "모듈 사이 추가에 실패했습니다.",
        shelfId: "",
      };
    }
    if (betweenChainChildIds.length > 1) {
      reanchorBayChildChain(insertedShelfId, betweenChainChildIds);
      normalizeDanglingAnchorIds();
      renderBayInputs();
    }
    return {
      ok: true,
      message: "",
      shelfId: insertedShelfId,
    };
  }

  const insertedShelfId = addShelfFromEndpoint(
    {
      ...sourceEndpoint,
      endpointId: canonicalTargetEndpointId,
    },
    {
      endpointId: canonicalTargetEndpointId,
      attachAtStart: Boolean(sourceEndpoint.attachAtStart),
    },
    { pushHistory: false, skipRender: true, initialCount: 1, pendingAdd: true }
  );
  if (!insertedShelfId) {
    return {
      ok: false,
      message: "모듈 추가에 실패했습니다.",
      shelfId: "",
    };
  }
  if (typeof setInlineInsertPendingFirstSaveEdgeId === "function") {
    setInlineInsertPendingFirstSaveEdgeId(insertedShelfId);
  }
  normalizeDanglingAnchorIds();
  renderBayInputs();
  return {
    ok: true,
    message: "",
    shelfId: insertedShelfId,
  };
}

  return {
    addBayAdjacentToModuleEdge,
  };
}
