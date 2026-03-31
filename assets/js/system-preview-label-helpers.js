export function createSystemPreviewLabelHelpers(deps = {}) {
  const {
    ADDON_CLOTHES_ROD_ID = "clothes_rod",
    SYSTEM_ADDON_ITEMS = [],
    getShelfAddonQuantities,
    buildRodAddonSummary,
    buildFurnitureAddonSummary,
    escapeHtml,
    setPreviewEdgeHoverState,
    $,
  } = deps;

  const sortAddonEntriesWithRodFirst = (entries = []) =>
    [...entries].sort((a, b) => {
      const aId = String(a?.[0] || "");
      const bId = String(b?.[0] || "");
      const aIsRod = aId === ADDON_CLOTHES_ROD_ID;
      const bIsRod = bId === ADDON_CLOTHES_ROD_ID;
      if (aIsRod !== bIsRod) return aIsRod ? -1 : 1;
      return aId.localeCompare(bId, "ko");
    });

  const getShelfAddonIds = (id) => {
    const quantities = getShelfAddonQuantities(id);
    const ids = [];
    sortAddonEntriesWithRodFirst(Object.entries(quantities)).forEach(([addonId, qty]) => {
      for (let i = 0; i < Number(qty || 0); i += 1) ids.push(addonId);
    });
    return ids;
  };

  const getShelfAddonSummary = (addons = []) => {
    if (!Array.isArray(addons) || !addons.length) return "-";
    const counts = addons.reduce((acc, addonId) => {
      const key = String(addonId || "");
      if (!key) return acc;
      acc[key] = Number(acc[key] || 0) + 1;
      return acc;
    }, {});
    return sortAddonEntriesWithRodFirst(Object.entries(counts))
      .map(([addonId, qty]) => {
        const addon = SYSTEM_ADDON_ITEMS.find((item) => item.id === addonId);
        if (!addon) return "";
        return `${addon.name}${qty > 1 ? ` x${qty}` : ""}`;
      })
      .filter(Boolean)
      .join(", ");
  };

  const buildAddonBreakdownFromIds = (addonIds = [], emptyText = "없음") => {
    const normalizedIds = Array.isArray(addonIds) ? addonIds : [];
    const rodCount = normalizedIds.reduce(
      (count, addonId) => count + (String(addonId || "") === ADDON_CLOTHES_ROD_ID ? 1 : 0),
      0
    );
    return {
      componentSummary: buildRodAddonSummary(rodCount, emptyText),
      furnitureSummary: buildFurnitureAddonSummary(normalizedIds, emptyText),
    };
  };

  const formatAddonCompactBreakdown = (addonIds = [], emptyText = "없음") => {
    const { componentSummary, furnitureSummary } = buildAddonBreakdownFromIds(addonIds, emptyText);
    return `구성품 ${componentSummary} / 가구 ${furnitureSummary}`;
  };

  const getComposeTabLabelInfo = (edge = null) => {
    const tab = String(edge?.composeTab || "");
    if (tab === "preset") {
      return { key: "preset", label: "모듈선택" };
    }
    if (tab === "custom") {
      return { key: "custom", label: "맞춤구성" };
    }
    return { key: "unknown", label: "미지정" };
  };

  const createModuleLabelElement = (
    labelInfo = {},
    {
      level = 2,
      index = 1,
    } = {}
  ) => {
    const normalizedLevel = Math.max(0, Math.min(2, Math.floor(Number(level) || 0)));
    const labelEl = document.createElement("div");
    labelEl.className = `system-module-label${
      labelInfo.corner ? " system-module-label--corner" : ""
    }`;
    if (normalizedLevel < 2) labelEl.classList.add("system-module-label--compact");
    if (normalizedLevel <= 1) labelEl.classList.add("system-module-label--index-only");
    labelEl.dataset.densityLevel = String(normalizedLevel);
    labelEl.dataset.restoreLevel = String(normalizedLevel);
    labelEl.dataset.labelIndex = String(Math.max(1, Number(index || 1)));
    labelEl.dataset.shelfCount = String(Math.max(1, Number(labelInfo.count || 1)));
    labelEl.dataset.addons = String(labelInfo.addons || "");
    const composeInfo =
      labelInfo.compose && typeof labelInfo.compose === "object"
        ? labelInfo.compose
        : { key: "unknown", label: "미지정" };
    labelEl.dataset.composeKey = String(composeInfo.key || "unknown");
    labelEl.dataset.composeLabel = String(composeInfo.label || "미지정");
    const edgeId = String(labelInfo.edgeId || "");
    labelEl.dataset.edgeId = edgeId;
    if (labelInfo.corner) labelEl.dataset.cornerPreview = edgeId;
    else labelEl.dataset.bayPreview = edgeId;
    labelEl.style.left = `${Number(labelInfo.x || 0)}px`;
    labelEl.style.top = `${Number(labelInfo.y || 0)}px`;

    if (normalizedLevel <= 1) {
      const chip = document.createElement("span");
      chip.className = "system-module-index-chip";
      chip.textContent = String(Math.max(1, Number(index || 1)));
      labelEl.appendChild(chip);
      return labelEl;
    }

    const composeBadge = document.createElement("span");
    composeBadge.className = `system-module-label-compose system-module-label-compose--${escapeHtml(
      String(composeInfo.key || "unknown")
    )}`;
    composeBadge.textContent = String(composeInfo.label || "미지정");

    const shelfLine = document.createElement("span");
    shelfLine.className = "system-module-label-line";
    shelfLine.textContent = `선반 ${labelInfo.count}개`;

    labelEl.appendChild(composeBadge);
    labelEl.appendChild(shelfLine);

    if (normalizedLevel >= 2) {
      const addonLine = document.createElement("span");
      addonLine.className = "system-module-label-line";
      addonLine.textContent = `${labelInfo.addons}`;
      labelEl.appendChild(addonLine);
    }
    return labelEl;
  };

  const getModuleLabelInfoFromElement = (labelEl) => {
    if (!(labelEl instanceof Element)) return null;
    const composeKey = String(labelEl.dataset.composeKey || "unknown");
    const composeLabel = String(labelEl.dataset.composeLabel || "미지정");
    return {
      edgeId: String(labelEl.dataset.edgeId || ""),
      corner: labelEl.classList.contains("system-module-label--corner"),
      count: Math.max(1, Number(labelEl.dataset.shelfCount || 1)),
      addons: String(labelEl.dataset.addons || ""),
      compose: {
        key: composeKey,
        label: composeLabel,
      },
      x: Number(labelEl.style.left.replace("px", "") || 0),
      y: Number(labelEl.style.top.replace("px", "") || 0),
    };
  };

  const setModuleLabelExpandedState = (labelEl, expanded = false) => {
    if (!(labelEl instanceof Element)) return;
    const restoreLevel = Math.max(
      0,
      Math.min(2, Math.floor(Number(labelEl.dataset.restoreLevel || labelEl.dataset.densityLevel || 2)))
    );
    if (restoreLevel >= 2) return;
    const index = Math.max(1, Math.floor(Number(labelEl.dataset.labelIndex || 1)));
    const targetLevel = expanded ? 2 : restoreLevel;
    const info = getModuleLabelInfoFromElement(labelEl);
    if (!info) return;
    const rebuilt = createModuleLabelElement(info, {
      level: targetLevel,
      index,
    });
    rebuilt.dataset.restoreLevel = String(restoreLevel);
    rebuilt.dataset.densityLevel = String(targetLevel);
    rebuilt.classList.toggle("system-module-label--expanded", Boolean(expanded));
    labelEl.replaceWith(rebuilt);
  };

  const formatDimensionLabelText = (
    text = "",
    { compact = false, expanded = false, compactText = "" } = {}
  ) => {
    const raw = String(text || "").trim();
    if (!raw) return "";
    if (compact && !expanded) {
      const compactRaw = String(compactText || "").trim();
      if (compactRaw) return compactRaw;
      return raw;
    }
    return `${raw}mm`;
  };

  const createDimensionLabelElement = (labelInfo = {}, { compact = false } = {}) => {
    const labelEl = document.createElement("div");
    labelEl.className = `system-dimension-label${
      labelInfo.corner ? " system-dimension-label--corner" : ""
    }`;
    const isCompact = Boolean(compact);
    if (isCompact) {
      labelEl.classList.add("system-dimension-label--compact");
    }
    const edgeId = String(labelInfo.edgeId || "");
    labelEl.dataset.edgeId = edgeId;
    labelEl.dataset.rawText = String(labelInfo.text || "");
    const compactText =
      Number.isFinite(Number(labelInfo.moduleIndex)) && Number(labelInfo.moduleIndex) > 0
        ? String(Math.max(1, Math.floor(Number(labelInfo.moduleIndex))))
        : "";
    labelEl.dataset.compactText = compactText;
    labelEl.dataset.restoreCompact = isCompact ? "true" : "false";
    labelEl.textContent = formatDimensionLabelText(labelInfo.text, {
      compact: isCompact,
      expanded: false,
      compactText,
    });
    labelEl.style.left = `${Number(labelInfo.x || 0)}px`;
    labelEl.style.top = `${Number(labelInfo.y || 0)}px`;
    if (isCompact && edgeId) {
      labelEl.addEventListener("mouseenter", () => {
        setDimensionLabelExpandedState(labelEl, true);
        setPreviewEdgeHoverState(edgeId, true);
      });
      labelEl.addEventListener("mouseleave", () => {
        setDimensionLabelExpandedState(labelEl, false);
        setPreviewEdgeHoverState("", false);
      });
    }
    return labelEl;
  };

  const setDimensionLabelExpandedState = (labelEl, expanded = false) => {
    if (!(labelEl instanceof Element)) return;
    const restoreCompact = String(labelEl.dataset.restoreCompact || "") === "true";
    if (!restoreCompact) return;
    const rawText = String(labelEl.dataset.rawText || "");
    const compactText = String(labelEl.dataset.compactText || "");
    const shouldExpand = Boolean(expanded);
    labelEl.textContent = formatDimensionLabelText(rawText, {
      compact: restoreCompact,
      expanded: shouldExpand,
      compactText,
    });
    labelEl.classList.toggle("system-dimension-label--expanded", shouldExpand);
  };

  const isRectOverlapping = (a = null, b = null, padding = 0) => {
    if (!a || !b) return false;
    const pad = Math.max(0, Number(padding || 0));
    return !(
      a.right + pad <= b.left - pad ||
      a.left - pad >= b.right + pad ||
      a.bottom + pad <= b.top - pad ||
      a.top - pad >= b.bottom + pad
    );
  };

  const getBoundingRectOnParent = (childEl, parentEl) => {
    if (!(childEl instanceof Element) || !(parentEl instanceof Element)) return null;
    const childRect = childEl.getBoundingClientRect();
    const parentRect = parentEl.getBoundingClientRect();
    return {
      left: childRect.left - parentRect.left,
      right: childRect.right - parentRect.left,
      top: childRect.top - parentRect.top,
      bottom: childRect.bottom - parentRect.top,
    };
  };

  const resolveDimensionLabelCompactStates = (labelInfos = [], parentEl) => {
    const infos = Array.isArray(labelInfos) ? labelInfos : [];
    if (!(parentEl instanceof Element) || infos.length <= 1) return infos.map(() => false);
    const overlapPadding = 2;
    const tempLabels = [];
    const tempRects = [];
    infos.forEach((info) => {
      const tempEl = createDimensionLabelElement(info, { compact: false });
      tempEl.style.visibility = "hidden";
      tempEl.style.opacity = "0";
      tempEl.style.pointerEvents = "none";
      parentEl.appendChild(tempEl);
      tempLabels.push(tempEl);
      tempRects.push(getBoundingRectOnParent(tempEl, parentEl));
    });

    let hasOverlap = false;
    for (let i = 0; i < tempRects.length; i += 1) {
      for (let j = i + 1; j < tempRects.length; j += 1) {
        if (isRectOverlapping(tempRects[i], tempRects[j], overlapPadding)) {
          hasOverlap = true;
        }
      }
    }

    tempLabels.forEach((el) => el.remove());
    return infos.map(() => hasOverlap);
  };

  const resolveModuleLabelDensityLevels = (labelInfos = [], parentEl) => {
    const infos = Array.isArray(labelInfos) ? labelInfos : [];
    if (!(parentEl instanceof Element) || infos.length <= 1) return infos.map(() => 2);
    let globalLevel = 2;
    const levels = infos.map(() => globalLevel);
    const maxPass = 3;
    const overlapPadding = 2;
    for (let pass = 0; pass < maxPass; pass += 1) {
      const tempLabels = [];
      const tempRects = [];
      infos.forEach((info, index) => {
        const tempEl = createModuleLabelElement(info, {
          level: levels[index],
          index: index + 1,
        });
        tempEl.classList.add("system-module-label--measure");
        parentEl.appendChild(tempEl);
        tempLabels.push(tempEl);
        tempRects.push(getBoundingRectOnParent(tempEl, parentEl));
      });

      let hasOverlap = false;
      for (let i = 0; i < tempRects.length; i += 1) {
        for (let j = i + 1; j < tempRects.length; j += 1) {
          if (isRectOverlapping(tempRects[i], tempRects[j], overlapPadding)) {
            hasOverlap = true;
          }
        }
      }

      tempLabels.forEach((el) => el.remove());
      if (!hasOverlap) break;
      if (globalLevel <= 0) break;
      globalLevel -= 1;
      for (let i = 0; i < levels.length; i += 1) levels[i] = globalLevel;
    }
    return levels;
  };

  const syncModuleLabelExpansionByEdge = (edgeId = "", active = false) => {
    const container = $("#systemPreviewShelves");
    if (!container) return;
    const targetId = String(edgeId || "");
    const labels = Array.from(container.querySelectorAll(".system-module-label"));
    labels.forEach((labelEl) => {
      if (!(labelEl instanceof Element)) return;
      const shouldExpand =
        Boolean(active) && Boolean(targetId) && String(labelEl.dataset.edgeId || "") === targetId;
      setModuleLabelExpandedState(labelEl, shouldExpand);
    });
  };

  const syncDimensionLabelExpansionByEdge = (edgeId = "", active = false) => {
    const container = $("#systemPreviewShelves");
    if (!container) return;
    const targetId = String(edgeId || "");
    const labels = Array.from(container.querySelectorAll(".system-dimension-label[data-edge-id]"));
    labels.forEach((labelEl) => {
      if (!(labelEl instanceof Element)) return;
      const shouldExpand =
        Boolean(active) && Boolean(targetId) && String(labelEl.dataset.edgeId || "") === targetId;
      setDimensionLabelExpandedState(labelEl, shouldExpand);
    });
  };

  return {
    sortAddonEntriesWithRodFirst,
    getShelfAddonIds,
    getShelfAddonSummary,
    buildAddonBreakdownFromIds,
    formatAddonCompactBreakdown,
    getComposeTabLabelInfo,
    createModuleLabelElement,
    getModuleLabelInfoFromElement,
    setModuleLabelExpandedState,
    formatDimensionLabelText,
    createDimensionLabelElement,
    setDimensionLabelExpandedState,
    resolveDimensionLabelCompactStates,
    syncModuleLabelExpansionByEdge,
    syncDimensionLabelExpansionByEdge,
    isRectOverlapping,
    getBoundingRectOnParent,
    resolveModuleLabelDensityLevels,
  };
}
