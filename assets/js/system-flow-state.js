export function createPreviewAddFlowState() {
  return {
    target: null,
    anchorEl: null,
    step: "type",
    selectedModuleType: "",
  };
}

export function clearPreviewAddFlowTarget(flowState) {
  if (!flowState || typeof flowState !== "object") return;
  flowState.target = null;
  flowState.anchorEl = null;
}

export function resetPreviewAddFlowState(flowState) {
  if (!flowState || typeof flowState !== "object") return;
  flowState.target = null;
  flowState.anchorEl = null;
  flowState.step = "type";
  flowState.selectedModuleType = "";
}

export function createPreviewPresetPickerFlowState() {
  return {
    moduleType: "",
    context: null,
    filterKey: "",
    selectedPresetId: "",
  };
}

export function resetPreviewPresetPickerFlowState(flowState) {
  if (!flowState || typeof flowState !== "object") return;
  flowState.moduleType = "";
  flowState.context = null;
  flowState.filterKey = "";
  flowState.selectedPresetId = "";
}

export function patchPreviewPresetPickerFlowState(flowState, patch = {}) {
  if (!flowState || typeof flowState !== "object" || !patch || typeof patch !== "object") return;
  if (Object.prototype.hasOwnProperty.call(patch, "moduleType")) {
    flowState.moduleType = patch.moduleType;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "context")) {
    flowState.context = patch.context;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "filterKey")) {
    flowState.filterKey = patch.filterKey;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "selectedPresetId")) {
    flowState.selectedPresetId = patch.selectedPresetId;
  }
}

export function createPresetModuleOptionFlowState() {
  return {
    modalState: null,
    draft: null,
  };
}

export function resetPresetModuleOptionFlowState(flowState) {
  if (!flowState || typeof flowState !== "object") return;
  flowState.modalState = null;
  flowState.draft = null;
}

export function patchPresetModuleOptionFlowState(flowState, patch = {}) {
  if (!flowState || typeof flowState !== "object" || !patch || typeof patch !== "object") return;
  if (Object.prototype.hasOwnProperty.call(patch, "modalState")) {
    flowState.modalState = patch.modalState;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "draft")) {
    flowState.draft = patch.draft;
  }
}

export function createPreviewModuleActionFlowState() {
  return {
    target: null,
    anchorEl: null,
  };
}

export function resetPreviewModuleActionFlowState(flowState) {
  if (!flowState || typeof flowState !== "object") return;
  flowState.target = null;
  flowState.anchorEl = null;
}
