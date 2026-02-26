export function isElement(value) {
  return typeof Element !== "undefined" && value instanceof Element;
}

export function clonePreviewAddTargetSnapshot(target) {
  if (!target || typeof target !== "object") return null;
  try {
    return JSON.parse(JSON.stringify(target));
  } catch (_err) {
    return {
      endpointId: String(target.endpointId || ""),
      sideIndex: Number(target.sideIndex),
      cornerId: String(target.cornerId || ""),
      prepend: Boolean(target.prepend),
      attachSideIndex: Number(target.attachSideIndex),
      attachAtStart: Boolean(target.attachAtStart),
      allowedTypes: Array.isArray(target.allowedTypes) ? [...target.allowedTypes] : ["normal"],
      extendDx: Number(target.extendDx),
      extendDy: Number(target.extendDy),
      inwardX: Number(target.inwardX),
      inwardY: Number(target.inwardY),
      rootCornerStartDirection: String(target.rootCornerStartDirection || ""),
    };
  }
}

export function normalizePreviewModuleType(value) {
  return value === "corner" ? "corner" : "normal";
}

export function normalizePreviewEdgeType(value) {
  return value === "corner" ? "corner" : "bay";
}

export function normalizePresetModuleOptionMode(value) {
  return value === "edit" ? "edit" : "add";
}

export function normalizePresetModuleOptionTab(value) {
  return value === "custom" ? "custom" : "preset";
}
