export function normalizeDirection(dx, dy) {
  const nx = Number(dx || 0);
  const ny = Number(dy || 0);
  if (!Number.isFinite(nx) || !Number.isFinite(ny)) return { dx: 1, dy: 0 };
  if (Math.abs(nx) >= Math.abs(ny)) {
    if (Math.abs(nx) < 1e-6) return { dx: 1, dy: 0 };
    return { dx: nx >= 0 ? 1 : -1, dy: 0 };
  }
  if (Math.abs(ny) < 1e-6) return { dx: 1, dy: 0 };
  return { dx: 0, dy: ny >= 0 ? 1 : -1 };
}

export function directionToSideIndex(dx, dy) {
  const dir = normalizeDirection(dx, dy);
  if (Math.abs(dir.dx) >= Math.abs(dir.dy)) {
    return dir.dx >= 0 ? 0 : 2;
  }
  return dir.dy >= 0 ? 1 : 3;
}

export function buildRectBounds(startX, startY, dir, inward, length, depth) {
  const x1 = startX;
  const y1 = startY;
  const x2 = startX + dir.dx * length;
  const y2 = startY + dir.dy * length;
  const x3 = startX + inward.x * depth;
  const y3 = startY + inward.y * depth;
  const x4 = x2 + inward.x * depth;
  const y4 = y2 + inward.y * depth;
  return {
    minX: Math.min(x1, x2, x3, x4),
    minY: Math.min(y1, y2, y3, y4),
    maxX: Math.max(x1, x2, x3, x4),
    maxY: Math.max(y1, y2, y3, y4),
  };
}

export function projectCornerPoint(cornerGeom, u, v, scale, tx, ty, offsetX, offsetY) {
  const gx = cornerGeom.originX + cornerGeom.u.dx * u + cornerGeom.v.dx * v;
  const gy = cornerGeom.originY + cornerGeom.u.dy * u + cornerGeom.v.dy * v;
  return {
    x: gx * scale + tx - offsetX,
    y: gy * scale + ty - offsetY,
  };
}

export function buildRoundedPolygonPathData(points, radiusPx = 0) {
  if (!Array.isArray(points) || points.length < 3) return "";
  const n = points.length;
  const radius = Math.max(0, Number(radiusPx || 0));
  const rounded = [];

  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const vx1 = Number(prev.x || 0) - Number(curr.x || 0);
    const vy1 = Number(prev.y || 0) - Number(curr.y || 0);
    const vx2 = Number(next.x || 0) - Number(curr.x || 0);
    const vy2 = Number(next.y || 0) - Number(curr.y || 0);
    const len1 = Math.hypot(vx1, vy1);
    const len2 = Math.hypot(vx2, vy2);
    if (!len1 || !len2 || !radius) {
      rounded.push({
        start: { x: curr.x, y: curr.y },
        end: { x: curr.x, y: curr.y },
        corner: { x: curr.x, y: curr.y },
      });
      continue;
    }
    const ux1 = vx1 / len1;
    const uy1 = vy1 / len1;
    const ux2 = vx2 / len2;
    const uy2 = vy2 / len2;
    const cross = ux1 * uy2 - uy1 * ux2;
    if (Math.abs(cross) < 1e-6) {
      rounded.push({
        start: { x: curr.x, y: curr.y },
        end: { x: curr.x, y: curr.y },
        corner: { x: curr.x, y: curr.y },
      });
      continue;
    }
    const trim = Math.min(radius, len1 * 0.45, len2 * 0.45);
    rounded.push({
      start: { x: curr.x + ux1 * trim, y: curr.y + uy1 * trim },
      end: { x: curr.x + ux2 * trim, y: curr.y + uy2 * trim },
      corner: { x: curr.x, y: curr.y },
    });
  }

  const fmt = (num) => Number(num || 0).toFixed(2);
  let d = `M ${fmt(rounded[0].start.x)} ${fmt(rounded[0].start.y)}`;
  for (let i = 0; i < n; i += 1) {
    const seg = rounded[i];
    d += ` Q ${fmt(seg.corner.x)} ${fmt(seg.corner.y)} ${fmt(seg.end.x)} ${fmt(seg.end.y)}`;
    if (i < n - 1) {
      const nextSeg = rounded[i + 1];
      d += ` L ${fmt(nextSeg.start.x)} ${fmt(nextSeg.start.y)}`;
    }
  }
  return `${d} Z`;
}

export function buildCornerSvgPathData(
  cornerGeom,
  scale,
  tx,
  ty,
  offsetX,
  offsetY,
  cornerRadiusPx = 0
) {
  if (!cornerGeom) return "";
  const pLen = Math.max(0, Number(cornerGeom.primaryLen || 0));
  const sLen = Math.max(0, Number(cornerGeom.secondaryLen || 0));
  const depth = Math.max(0, Number(cornerGeom.depth || 0));
  const innerU = Math.max(0, pLen - depth);

  const points = [
    projectCornerPoint(cornerGeom, 0, 0, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, pLen, 0, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, pLen, sLen, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, innerU, sLen, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, innerU, depth, scale, tx, ty, offsetX, offsetY),
    projectCornerPoint(cornerGeom, 0, depth, scale, tx, ty, offsetX, offsetY),
  ];
  return buildRoundedPolygonPathData(points, cornerRadiusPx);
}

export function pushPreviewAddButton(
  list,
  entry,
  { overlapThresholdPx = 10, spreadPx = 12 } = {}
) {
  const exists = list.find((it) => {
    const dx = Math.abs((it.x || 0) - (entry.x || 0));
    const dy = Math.abs((it.y || 0) - (entry.y || 0));
    if (dx >= overlapThresholdPx || dy >= overlapThresholdPx) return false;
    return (
      Number(it.attachSideIndex) === Number(entry.attachSideIndex) &&
      Boolean(it.attachAtStart) === Boolean(entry.attachAtStart) &&
      String(it.cornerId || "") === String(entry.cornerId || "")
    );
  });
  if (exists) return exists;
  const overlaps = list.filter((it) => {
    const dx = Math.abs((it.x || 0) - (entry.x || 0));
    const dy = Math.abs((it.y || 0) - (entry.y || 0));
    return dx < overlapThresholdPx && dy < overlapThresholdPx;
  });
  if (overlaps.length) {
    const angle = (Math.PI * 2 * overlaps.length) / Math.max(2, overlaps.length + 1);
    entry.x = Number(entry.x || 0) + Math.cos(angle) * spreadPx;
    entry.y = Number(entry.y || 0) + Math.sin(angle) * spreadPx;
  }
  list.push(entry);
  return entry;
}

export function pushUniquePoint(
  list,
  entry,
  { threshold = 8, postBarWidthMm = 20 } = {}
) {
  const edgeHint = entry.edgeHint || "";
  const entryIsStructural = entry.isStructuralColumn !== false;
  const exists = list.find((it) => {
    const dx = Math.abs((it.x || 0) - (entry.x || 0));
    const dy = Math.abs((it.y || 0) - (entry.y || 0));
    return dx < threshold && dy < threshold;
  });
  if (exists) {
    exists.inwardX = Number(exists.inwardX || 0) + Number(entry.inwardX || 0);
    exists.inwardY = Number(exists.inwardY || 0) + Number(entry.inwardY || 0);
    const nextCount = Number(exists.count || 1) + 1;
    exists.count = nextCount;
    const prevStructuralCount = Math.max(0, Number(exists.structuralCount || 0));
    const structuralCount = prevStructuralCount + (entryIsStructural ? 1 : 0);
    exists.structuralCount = structuralCount;
    const existsWidthMm = Number(exists.columnWidthMm || 0);
    const entryWidthMm = Number(entry.columnWidthMm || 0);
    const isSharedStructuralColumn = structuralCount > 1;
    if (Number.isFinite(entryWidthMm) && entryWidthMm > 0) {
      const baseWidthMm =
        Number.isFinite(existsWidthMm) && existsWidthMm > 0 ? existsWidthMm : entryWidthMm;
      exists.columnWidthMm = isSharedStructuralColumn
        ? Math.max(postBarWidthMm, baseWidthMm, entryWidthMm)
        : baseWidthMm;
    } else if (isSharedStructuralColumn) {
      exists.columnWidthMm = Math.max(postBarWidthMm, Number(exists.columnWidthMm || 0));
    }
    if (Number.isFinite(Number(entry.rotationDeg)) && !Number.isFinite(Number(exists.rotationDeg))) {
      exists.rotationDeg = Number(entry.rotationDeg);
    }
    if (entry.columnRole && !exists.columnRole) {
      exists.columnRole = String(entry.columnRole);
    }
    if (edgeHint) {
      exists.edgeVotes = exists.edgeVotes || {};
      exists.edgeVotes[edgeHint] = Number(exists.edgeVotes[edgeHint] || 0) + 1;
    }
    return;
  }
  list.push({
    ...entry,
    inwardX: Number(entry.inwardX || 0),
    inwardY: Number(entry.inwardY || 0),
    count: 1,
    columnWidthMm: Number(entry.columnWidthMm || 0),
    structuralCount: entryIsStructural ? 1 : 0,
    edgeVotes: edgeHint ? { [edgeHint]: 1 } : {},
  });
}

export function hasValidPlacement(placement) {
  return Boolean(
    placement &&
      Number.isFinite(Number(placement.startX)) &&
      Number.isFinite(Number(placement.startY)) &&
      Number.isFinite(Number(placement.dirDx)) &&
      Number.isFinite(Number(placement.dirDy)) &&
      Number.isFinite(Number(placement.inwardX)) &&
      Number.isFinite(Number(placement.inwardY))
  );
}

export function buildPlacementFromEndpoint(
  endpoint,
  { defaultPostBarWidthMm = 20 } = {}
) {
  if (!endpoint) return null;
  const centerX = Number(endpoint.x);
  const centerY = Number(endpoint.y);
  const rawDx = Number(endpoint.extendDx);
  const rawDy = Number(endpoint.extendDy);
  let inwardX = Number(endpoint.inwardX);
  let inwardY = Number(endpoint.inwardY);
  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) return null;
  if (!Number.isFinite(rawDx) || !Number.isFinite(rawDy)) return null;
  const dirLen = Math.hypot(rawDx, rawDy);
  if (!dirLen) return null;
  const dirDx = rawDx / dirLen;
  const dirDy = rawDy / dirLen;
  const inwardLen = Math.hypot(inwardX, inwardY);
  if (!inwardLen) {
    inwardX = -dirDy;
    inwardY = dirDx;
  }
  const endpointPostBarWidthMm = Math.max(1, Number(endpoint.postBarWidthMm || defaultPostBarWidthMm));
  return {
    startX: centerX + dirDx * (endpointPostBarWidthMm / 2),
    startY: centerY + dirDy * (endpointPostBarWidthMm / 2),
    dirDx,
    dirDy,
    inwardX,
    inwardY,
  };
}

export function getEdgeHintFromDir(dir) {
  if (!dir) return "";
  if (dir.dx === 1 && dir.dy === 0) return "top";
  if (dir.dx === 0 && dir.dy === 1) return "right";
  if (dir.dx === -1 && dir.dy === 0) return "bottom";
  if (dir.dx === 0 && dir.dy === -1) return "left";
  return "";
}

export function getEdgeHintFromInward(inwardX, inwardY) {
  const inward = normalizeDirection(inwardX, inwardY);
  const outward = { dx: -inward.dx, dy: -inward.dy };
  if (Math.abs(outward.dx) >= Math.abs(outward.dy)) {
    return outward.dx >= 0 ? "right" : "left";
  }
  return outward.dy >= 0 ? "bottom" : "top";
}

export function toEndpointKeyNumber(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(n * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3);
}

export function buildEndpointStableId(entry) {
  const dir = normalizeDirection(entry?.extendDx, entry?.extendDy);
  const inward = normalizeDirection(entry?.inwardX, entry?.inwardY);
  const x = toEndpointKeyNumber(entry?.x);
  const y = toEndpointKeyNumber(entry?.y);
  return `ep-${x}-${y}-${dir.dx}-${dir.dy}-${inward.dx}-${inward.dy}`;
}

export function isOppositeEndpointDirection(a, b) {
  const ad = normalizeDirection(a?.extendDx, a?.extendDy);
  const bd = normalizeDirection(b?.extendDx, b?.extendDy);
  return ad.dx === -bd.dx && ad.dy === -bd.dy;
}

export function collectOpenEndpointsFromCandidates(
  candidates = [],
  { endpointWidthMm = 20 } = {}
) {
  const buckets = [];
  const threshold = 2;
  candidates.forEach((entry) => {
    const x = Number(entry.x || 0);
    const y = Number(entry.y || 0);
    let bucket = buckets.find((b) => Math.abs(b.x - x) < threshold && Math.abs(b.y - y) < threshold);
    if (!bucket) {
      bucket = { x, y, entries: [] };
      buckets.push(bucket);
    }
    bucket.entries.push(entry);
  });

  const endpoints = [];
  buckets.forEach((bucket) => {
    const entries = bucket.entries;
    if (!entries.length) return;
    const used = new Array(entries.length).fill(false);
    for (let i = 0; i < entries.length; i += 1) {
      if (used[i]) continue;
      let matched = false;
      for (let j = i + 1; j < entries.length; j += 1) {
        if (used[j]) continue;
        if (isOppositeEndpointDirection(entries[i], entries[j])) {
          used[i] = true;
          used[j] = true;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }
    const remaining = entries.filter((_, idx) => !used[idx]);
    const uniqueByDirection = [];
    remaining.forEach((entry) => {
      const dir = normalizeDirection(entry.extendDx, entry.extendDy);
      const exists = uniqueByDirection.find((it) => {
        const sameDir = normalizeDirection(it.extendDx, it.extendDy);
        return sameDir.dx === dir.dx && sameDir.dy === dir.dy;
      });
      if (!exists) uniqueByDirection.push(entry);
    });
    uniqueByDirection.forEach((src) => {
      const base = {
        x: bucket.x,
        y: bucket.y,
        sideIndex: Number(src.sideIndex || 0),
        attachSideIndex: Number(src.attachSideIndex ?? src.sideIndex ?? 0),
        attachAtStart: Boolean(src.attachAtStart),
        cornerId: String(src.cornerId || ""),
        prepend: Boolean(src.attachAtStart),
        extendDx: Number(src.extendDx || 0),
        extendDy: Number(src.extendDy || 0),
        inwardX: Number(src.inwardX || 0),
        inwardY: Number(src.inwardY || 0),
        postBarWidthMm: Math.max(1, Number(src.postBarWidthMm || endpointWidthMm)),
        allowedTypes: Array.isArray(src.allowedTypes) ? src.allowedTypes : ["normal", "corner"],
      };
      endpoints.push({
        endpointId: src.endpointId || buildEndpointStableId(base),
        ...base,
      });
    });
  });
  return endpoints;
}

export function buildBayEndpointFromPlacement(
  edge,
  endpointSide = "end",
  {
    supportVisibleMm = 5,
    endpointHalfMm = 10,
    endpointWidthMm = 20,
  } = {}
) {
  if (!edge || edge.type !== "bay" || !hasValidPlacement(edge.placement)) return null;
  const placement = edge.placement;
  const drawDir = normalizeDirection(placement.dirDx, placement.dirDy);
  let drawInwardNorm = normalizeDirection(placement.inwardX, placement.inwardY);
  const dot = drawDir.dx * drawInwardNorm.dx + drawDir.dy * drawInwardNorm.dy;
  if (Math.abs(dot) > 0.9) drawInwardNorm = { dx: -drawDir.dy, dy: drawDir.dx };
  const drawInward = { x: drawInwardNorm.dx, y: drawInwardNorm.dy };
  const px = Number(placement.startX || 0);
  const py = Number(placement.startY || 0);
  const widthMm = (Number(edge.width || 0) || 0) + supportVisibleMm * 2;
  const startCenterX = px + drawDir.dx * (-endpointHalfMm);
  const startCenterY = py + drawDir.dy * (-endpointHalfMm);
  const endCenterX = px + drawDir.dx * (widthMm + endpointHalfMm);
  const endCenterY = py + drawDir.dy * (widthMm + endpointHalfMm);
  const startSideIndex = directionToSideIndex(-drawDir.dx, -drawDir.dy);
  const endSideIndex = directionToSideIndex(drawDir.dx, drawDir.dy);

  if (endpointSide === "start") {
    return {
      x: startCenterX,
      y: startCenterY,
      sideIndex: startSideIndex,
      attachSideIndex: startSideIndex,
      attachAtStart: true,
      prepend: true,
      extendDx: -drawDir.dx,
      extendDy: -drawDir.dy,
      inwardX: drawInward.x,
      inwardY: drawInward.y,
      postBarWidthMm: endpointWidthMm,
      allowedTypes: ["normal", "corner"],
      endpointId: `${String(edge.id || "")}:start`,
    };
  }

  return {
    x: endCenterX,
    y: endCenterY,
    sideIndex: endSideIndex,
    attachSideIndex: endSideIndex,
    attachAtStart: false,
    prepend: false,
    extendDx: drawDir.dx,
    extendDy: drawDir.dy,
    inwardX: drawInward.x,
    inwardY: drawInward.y,
    postBarWidthMm: endpointWidthMm,
    allowedTypes: ["normal", "corner"],
    endpointId: `${String(edge.id || "")}:end`,
  };
}

export function buildRootEndpoint({ endpointWidthMm = 20 } = {}) {
  return {
    endpointId: "root-endpoint",
    x: 0,
    y: 0,
    sideIndex: 0,
    attachSideIndex: 0,
    attachAtStart: true,
    cornerId: "",
    prepend: true,
    extendDx: 1,
    extendDy: 0,
    inwardX: 0,
    inwardY: 1,
    postBarWidthMm: endpointWidthMm,
    allowedTypes: ["normal", "corner"],
  };
}

export function getEdgeEndpointDirections(edge) {
  if (!edge || !hasValidPlacement(edge.placement)) {
    return {
      start: { dx: 1, dy: 0 },
      end: { dx: 1, dy: 0 },
    };
  }
  const placement = edge.placement;
  const drawDir = normalizeDirection(placement.dirDx, placement.dirDy);
  let inward = normalizeDirection(placement.inwardX, placement.inwardY);
  const dot = drawDir.dx * inward.dx + drawDir.dy * inward.dy;
  if (Math.abs(dot) > 0.9) inward = { dx: -drawDir.dy, dy: drawDir.dx };

  if (edge.type === "corner") {
    return {
      start: { dx: -drawDir.dx, dy: -drawDir.dy },
      end: { dx: inward.dx, dy: inward.dy },
    };
  }
  return {
    start: { dx: -drawDir.dx, dy: -drawDir.dy },
    end: { dx: drawDir.dx, dy: drawDir.dy },
  };
}

export function applyRootAnchorVector(edge, preferredDir, preferredInward = null) {
  const dir = normalizeDirection(preferredDir?.dx, preferredDir?.dy);
  let inward = preferredInward
    ? normalizeDirection(preferredInward.dx, preferredInward.dy)
    : { dx: -dir.dy, dy: dir.dx };
  const dot = dir.dx * inward.dx + dir.dy * inward.dy;
  if (Math.abs(dot) > 0.9) inward = { dx: -dir.dy, dy: dir.dx };
  edge.anchorDirDx = dir.dx;
  edge.anchorDirDy = dir.dy;
  edge.anchorInwardX = inward.dx;
  edge.anchorInwardY = inward.dy;
}

export function clearRootAnchorVector(edge) {
  delete edge.anchorDirDx;
  delete edge.anchorDirDy;
  delete edge.anchorInwardX;
  delete edge.anchorInwardY;
}

export function buildSectionRunsFromSegments(segments = []) {
  if (!Array.isArray(segments) || !segments.length) return [];
  const lineBuckets = new Map();
  segments.forEach((seg) => {
    const orientation = seg.orientation === "vertical" ? "vertical" : "horizontal";
    const edgeHint = String(seg.edgeHint || "");
    if (!edgeHint) return;
    const lineCoord = Number(seg.lineCoord || 0);
    const a0 = Number(seg.axisStart || 0);
    const a1 = Number(seg.axisEnd || 0);
    const totalMm = Math.max(0, Number(seg.totalMm || 0));
    if (
      !Number.isFinite(lineCoord) ||
      !Number.isFinite(a0) ||
      !Number.isFinite(a1) ||
      !Number.isFinite(totalMm)
    ) {
      return;
    }
    const axisStart = Math.min(a0, a1);
    const axisEnd = Math.max(a0, a1);
    const lineKey = Math.round(lineCoord * 10) / 10;
    const key = `${orientation}:${lineKey}:${edgeHint}`;
    if (!lineBuckets.has(key)) lineBuckets.set(key, []);
    lineBuckets.get(key).push({
      orientation,
      edgeHint,
      lineCoord: lineKey,
      axisStart,
      axisEnd,
      totalMm,
    });
  });

  const runs = [];
  const mergeGapMm = 2;
  lineBuckets.forEach((items) => {
    const sorted = items.sort((a, b) => {
      if (a.axisStart !== b.axisStart) return a.axisStart - b.axisStart;
      return a.axisEnd - b.axisEnd;
    });
    let current = null;
    sorted.forEach((item) => {
      if (!current) {
        current = { ...item };
        return;
      }
      if (item.axisStart <= current.axisEnd + mergeGapMm) {
        current.axisEnd = Math.max(current.axisEnd, item.axisEnd);
        current.totalMm += item.totalMm;
        return;
      }
      runs.push(current);
      current = { ...item };
    });
    if (current) runs.push(current);
  });
  return runs;
}

export function calcSectionUsedWidthWithPostBarsMm({
  shelfTotalMm = 0,
  postBarCount = 0,
  postBarTotalMm = NaN,
  postBarWidthMm = 20,
  endpointWidthMm = postBarWidthMm,
} = {}) {
  // Section usage is measured with post bars included.
  const safeShelfMm = Math.max(0, Number(shelfTotalMm || 0));
  const explicitPostBarTotalMm = Number(postBarTotalMm);
  if (Number.isFinite(explicitPostBarTotalMm) && explicitPostBarTotalMm >= 0) {
    return safeShelfMm + explicitPostBarTotalMm;
  }
  const safePostBarCount = Math.max(0, Math.floor(Number(postBarCount || 0)));
  if (safePostBarCount <= 0) return safeShelfMm;
  const normalizedPostBarWidthMm = Math.max(1, Number(postBarWidthMm || endpointWidthMm || 20));
  return safeShelfMm + safePostBarCount * normalizedPostBarWidthMm;
}

export function buildOuterSectionLabels(
  sectionRuns = [],
  columnMarksByHint = {},
  { postBarWidthMm = 20, endpointWidthMm = postBarWidthMm } = {}
) {
  if (!Array.isArray(sectionRuns) || !sectionRuns.length) return [];
  const buckets = {
    top: [],
    right: [],
    bottom: [],
    left: [],
  };

  sectionRuns.forEach((run) => {
    const hint = String(run.edgeHint || "");
    if (!hint || !buckets[hint]) return;
    buckets[hint].push(run);
  });

  const order = ["top", "right", "bottom", "left"];
  const labels = [];
  order.forEach((edgeHint) => {
    const runs = buckets[edgeHint] || [];
    if (!runs.length) return;
    const shelfTotalMm = runs.reduce((sum, run) => sum + Math.max(0, Number(run.totalMm || 0)), 0);
    const columnMarks = columnMarksByHint?.[edgeHint];
    const columnCount =
      columnMarks && typeof columnMarks.size === "number" ? Number(columnMarks.size || 0) : 0;
    let postBarTotalMm = NaN;
    if (columnMarks instanceof Map) {
      postBarTotalMm = Array.from(columnMarks.values()).reduce((sum, entry) => {
        const widthMm =
          entry && typeof entry === "object"
            ? Number(entry.widthMm || 0)
            : Number(entry || 0);
        return sum + Math.max(0, widthMm);
      }, 0);
    }
    const totalMm = calcSectionUsedWidthWithPostBarsMm({
      shelfTotalMm,
      postBarCount: columnCount,
      postBarTotalMm,
      postBarWidthMm,
      endpointWidthMm,
    });
    const axisStart = Math.min(...runs.map((run) => Number(run.axisStart || 0)));
    const axisEnd = Math.max(...runs.map((run) => Number(run.axisEnd || 0)));
    const lineCoord = runs.reduce((sum, run) => sum + Number(run.lineCoord || 0), 0) / runs.length;
    const horizontal = edgeHint === "top" || edgeHint === "bottom";
    labels.push({
      edgeHint,
      orientation: horizontal ? "horizontal" : "vertical",
      axisStart,
      axisEnd,
      lineCoord,
      totalMm,
      x: horizontal ? (axisStart + axisEnd) / 2 : lineCoord,
      y: horizontal ? lineCoord : (axisStart + axisEnd) / 2,
      overflow: false,
    });
  });
  return labels;
}
