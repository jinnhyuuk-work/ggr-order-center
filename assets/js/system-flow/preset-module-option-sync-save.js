import {
  isElement,
  clonePreviewAddTargetSnapshot,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
  normalizePresetModuleOptionMode,
  normalizePresetModuleOptionTab,
} from "../system-flow-core.js";

import {
  hasPresetModuleOptionBackContext,
  buildPreviewPresetPickerApplyContextFromPresetModalState,
  buildPreviewPresetPickerOpenFromPresetModuleOption,
  buildPresetModuleOptionPresetSaveTransition,
} from "./preset-picker-open-close.js";

import {
  buildDirectComposePendingCreationUiExecutionPlan,
} from "./preset-module-option-open-compose.js";

export function buildPresetModuleOptionCustomComposeSourceUiExecutionPlan({
  bootstrapUiPlan = null,
  sourceResolution = null,
} = {}) {
  const bootstrap =
    bootstrapUiPlan && typeof bootstrapUiPlan === "object" ? bootstrapUiPlan : null;
  if (!bootstrap || bootstrap.route !== "resolve-source") {
    return {
      route: "abort",
      moduleType: normalizePreviewModuleType(bootstrap?.moduleType),
      addTarget: null,
      source: null,
      errorMessage: "",
    };
  }
  const resolution =
    sourceResolution && typeof sourceResolution === "object" ? sourceResolution : null;
  if (!resolution?.ok || !resolution?.source) {
    return {
      route: "error",
      moduleType: normalizePreviewModuleType(bootstrap.moduleType),
      addTarget: bootstrap.addTarget || null,
      source: null,
      errorMessage: String(resolution?.errorMessage || ""),
    };
  }
  return {
    route: "create",
    moduleType: normalizePreviewModuleType(bootstrap.moduleType),
    addTarget: bootstrap.addTarget || null,
    source: resolution.source,
    errorMessage: "",
  };
}

export function buildPresetModuleOptionCustomCornerCreationUiExecutionPlan({
  cornerComposeValidation = null,
  edgeCreatePlan = null,
  fallbackErrorMessage = "",
} = {}) {
  const validation =
    cornerComposeValidation && typeof cornerComposeValidation === "object"
      ? cornerComposeValidation
      : null;
  if (!validation?.valid) {
    return {
      route: "error",
      errorMessage: String(validation?.errorMessage || fallbackErrorMessage || ""),
      edgeCreatePlan: null,
    };
  }
  if (!edgeCreatePlan || typeof edgeCreatePlan !== "object") {
    return {
      route: "error",
      errorMessage: String(fallbackErrorMessage || ""),
      edgeCreatePlan: null,
    };
  }
  return {
    route: "create-corner-edge",
    errorMessage: "",
    edgeCreatePlan,
  };
}

export function buildPresetModuleOptionCustomComposeCreationUiExecutionPlan({
  moduleType = "normal",
  edgeId = "",
  fallbackErrorMessage = "이 끝점에서는 모듈을 추가할 수 없습니다.",
} = {}) {
  return buildDirectComposePendingCreationUiExecutionPlan({
    moduleType: normalizePreviewModuleType(moduleType),
    edgeId: String(edgeId || ""),
    errorMessage: String(fallbackErrorMessage || ""),
  });
}

export function buildPresetModuleOptionDraftAfterFilterChange({
  modalState = null,
  currentDraft = null,
  nextFilterKey = "",
  selectedPreset = null,
  isPresetAvailableForFilter,
} = {}) {
  if (!modalState || typeof modalState !== "object") return null;
  const normalizedModuleType = normalizePreviewModuleType(modalState.moduleType);
  const nextDraft =
    currentDraft && typeof currentDraft === "object"
      ? { ...currentDraft }
      : {
          moduleType: normalizedModuleType,
          presetId: "",
          filterKey: "",
          activeTab: "preset",
        };
  nextDraft.moduleType = normalizedModuleType;
  nextDraft.filterKey = String(nextFilterKey || "");

  const selectedPresetIsValid =
    !selectedPreset ||
    typeof isPresetAvailableForFilter !== "function" ||
    isPresetAvailableForFilter(selectedPreset, String(nextDraft.filterKey || ""), normalizedModuleType);
  if (!selectedPresetIsValid) {
    nextDraft.presetId = "";
  }

  return nextDraft;
}

export function buildPresetModuleOptionDraftAfterTabChange(currentDraft = null, nextTab = "preset") {
  if (!currentDraft || typeof currentDraft !== "object") return null;
  return {
    ...currentDraft,
    activeTab: normalizePresetModuleOptionTab(nextTab),
  };
}

export function buildPresetModuleOptionDraftForReopenAfterPresetPicker(currentDraft = null) {
  if (!currentDraft || typeof currentDraft !== "object") return null;
  return {
    ...currentDraft,
    activeTab: "preset",
  };
}

export function buildPresetModuleOptionDraftAfterPresetPickerSelection({
  moduleType = "normal",
  presetId = "",
  filterKey = "",
} = {}) {
  return {
    moduleType: normalizePreviewModuleType(moduleType),
    presetId: String(presetId || ""),
    filterKey: String(filterKey || ""),
    activeTab: "preset",
  };
}

export function buildPreviewPresetPickerSelectionTransition({
  pickerFlowState = null,
  preset = null,
} = {}) {
  if (!preset || typeof preset !== "object") {
    return {
      kind: "error",
      errorMessage: "먼저 적용할 모듈 구성을 선택해주세요.",
    };
  }
  const flowState = pickerFlowState && typeof pickerFlowState === "object" ? pickerFlowState : null;
  const presetContext =
    flowState?.context && typeof flowState.context === "object" ? flowState.context : null;
  if (presetContext?.mode === "pick" && presetContext?.returnTo === "preset-module-option") {
    return {
      kind: "return-to-preset-module-option",
      nextDraft: buildPresetModuleOptionDraftAfterPresetPickerSelection({
        moduleType: flowState?.moduleType,
        presetId: String(preset.id || ""),
        filterKey: String(flowState?.filterKey || ""),
      }),
    };
  }
  return {
    kind: "apply",
    applyType: normalizePreviewModuleType(flowState?.moduleType),
    applyFilterKey: String(flowState?.filterKey || ""),
    applyContext: presetContext,
  };
}

export function buildPreviewPresetPickerUiApplyPlan({
  pickerFlowState = null,
  preset = null,
} = {}) {
  const selectionTransition = buildPreviewPresetPickerSelectionTransition({
    pickerFlowState,
    preset,
  });
  if (!selectionTransition || selectionTransition.kind === "error") {
    return {
      route: "error",
      errorMessage: String(selectionTransition?.errorMessage || ""),
      nextDraft: null,
      applyContext: null,
      applyType: "",
      applyFilterKey: "",
    };
  }
  if (selectionTransition.kind === "return-to-preset-module-option") {
    return {
      route: "return-to-preset-module-option",
      errorMessage: "",
      nextDraft: selectionTransition.nextDraft || null,
      applyContext: null,
      applyType: "",
      applyFilterKey: "",
    };
  }
  return {
    route: "apply",
    errorMessage: "",
    nextDraft: null,
    applyContext: selectionTransition.applyContext || null,
    applyType: String(selectionTransition.applyType || ""),
    applyFilterKey: String(selectionTransition.applyFilterKey || ""),
  };
}

export function buildPreviewPresetPickerApplyRuntimeUiDispatchPlan({
  pickerFlowState = null,
  preset = null,
} = {}) {
  const applyPlan = buildPreviewPresetPickerUiApplyPlan({
    pickerFlowState,
    preset,
  });
  if (!applyPlan || applyPlan.route === "error") {
    return {
      route: "error",
      errorMessage: String(applyPlan?.errorMessage || ""),
    };
  }
  if (applyPlan.route === "return-to-preset-module-option") {
    return {
      route: "return-to-preset-module-option",
      nextDraft: applyPlan.nextDraft || null,
      closePickerOptions: {
        returnFocus: false,
        clearTarget: false,
      },
    };
  }
  return {
    route: "apply",
    applyContext: applyPlan.applyContext || null,
    applyType: normalizePreviewModuleType(applyPlan.applyType),
    applyFilterKey: String(applyPlan.applyFilterKey || ""),
  };
}

export function buildPreviewPresetApplyDispatchPlan({
  presetContext = null,
  moduleType = "normal",
} = {}) {
  const normalizedType = normalizePreviewModuleType(moduleType);
  const context = presetContext && typeof presetContext === "object" ? presetContext : null;
  if (context?.mode === "edit" && context.edgeId) {
    const normalizedEdgeType = normalizePreviewEdgeType(context.edgeType);
    return {
      route: normalizedEdgeType === "corner" ? "edit-corner" : "edit-bay",
      edgeId: String(context.edgeId || ""),
      edgeType: normalizedEdgeType,
      context,
      moduleType: normalizedType,
    };
  }
  return {
    route: normalizedType === "corner" ? "add-corner" : "add-normal",
    edgeId: "",
    edgeType: normalizedType === "corner" ? "corner" : "bay",
    context,
    moduleType: normalizedType,
  };
}

export function buildPreviewPresetApplyRuntimeUiDispatchPlan({
  presetContext = null,
  moduleType = "normal",
} = {}) {
  const dispatchPlan = buildPreviewPresetApplyDispatchPlan({
    presetContext,
    moduleType,
  });
  if (!dispatchPlan || typeof dispatchPlan !== "object") {
    return {
      route: "add-normal",
      edgeId: "",
      applyType: "normal",
    };
  }
  if (dispatchPlan.route === "edit-corner") {
    return {
      route: "edit-corner",
      edgeId: String(dispatchPlan.edgeId || ""),
      applyType: "corner",
    };
  }
  if (dispatchPlan.route === "edit-bay") {
    return {
      route: "edit-bay",
      edgeId: String(dispatchPlan.edgeId || ""),
      applyType: "normal",
    };
  }
  if (dispatchPlan.route === "add-corner") {
    return {
      route: "add-corner",
      edgeId: "",
      applyType: "corner",
    };
  }
  return {
    route: "add-normal",
    edgeId: "",
    applyType: "normal",
  };
}

export function normalizePresetModuleOptionDraftForSync({
  modalState,
  currentDraft = null,
  filterOptions = [],
  selectedPreset = null,
  getDefaultFilterKey,
  isPresetAvailableForFilter,
} = {}) {
  if (!modalState || typeof modalState !== "object") {
    return {
      draft: null,
      activeTab: "preset",
    };
  }

  const normalizedModuleType = normalizePreviewModuleType(modalState.moduleType);
  const nextDraft =
    currentDraft && typeof currentDraft === "object"
      ? { ...currentDraft }
      : {
          moduleType: normalizedModuleType,
          presetId: "",
          filterKey: "",
          activeTab: "preset",
        };

  nextDraft.moduleType = normalizedModuleType;
  if (nextDraft.activeTab !== "custom" && nextDraft.activeTab !== "preset") {
    nextDraft.activeTab = "preset";
  }
  const activeTab = nextDraft.activeTab === "custom" ? "custom" : "preset";
  const optionKeys = Array.isArray(filterOptions)
    ? filterOptions.map((option) => String(option?.key || "")).filter(Boolean)
    : [];
  const hasCurrentFilter = optionKeys.includes(String(nextDraft.filterKey || ""));
  if (!hasCurrentFilter) {
    nextDraft.filterKey =
      typeof getDefaultFilterKey === "function"
        ? String(getDefaultFilterKey(normalizedModuleType, modalState.edgeId) || "")
        : "";
  }
  const selectedPresetIsValid =
    !selectedPreset ||
    typeof isPresetAvailableForFilter !== "function" ||
    isPresetAvailableForFilter(selectedPreset, String(nextDraft.filterKey || ""), normalizedModuleType);
  if (!selectedPresetIsValid) {
    nextDraft.presetId = "";
  }

  return {
    draft: nextDraft,
    activeTab,
  };
}

export function buildPresetModuleOptionTextViewState(modalState, { moduleLabel = "" } = {}) {
  if (!modalState || typeof modalState !== "object") {
    return {
      title: "",
      filterLabel: "선반 폭 (mm)",
      filterNote: "선반 폭을 먼저 선택한 뒤 모듈을 선택하세요.",
    };
  }
  const isCorner = normalizePreviewModuleType(modalState.moduleType) === "corner";
  return {
    title: modalState.mode === "edit" ? `${moduleLabel} 구성 설정` : `${moduleLabel} 구성`,
    filterLabel: isCorner ? "코너 방향" : "선반 폭 (mm)",
    filterNote: isCorner
      ? "코너 방향을 먼저 선택한 뒤 모듈을 선택하세요."
      : "선반 폭을 먼저 선택한 뒤 모듈을 선택하세요.",
  };
}

export function buildPresetModuleOptionBackButtonViewState(modalState) {
  const canGoBack = hasPresetModuleOptionBackContext(modalState);
  return {
    canGoBack,
    hidden: !canGoBack,
    disabled: !canGoBack,
    disabledClass: !canGoBack,
  };
}

export function buildPresetModuleOptionSaveButtonViewState({
  activeTab = "preset",
  hasPreset = false,
  hasActiveCustomEdge = false,
  customValidation = null,
} = {}) {
  if (activeTab !== "custom") {
    const canSavePreset = Boolean(hasPreset);
    return {
      hidden: false,
      disabled: !canSavePreset,
      disabledClass: !canSavePreset,
      title: "",
    };
  }
  const canSaveCustom = Boolean(hasActiveCustomEdge && customValidation?.canApply);
  return {
    hidden: !hasActiveCustomEdge,
    disabled: !canSaveCustom,
    disabledClass: !canSaveCustom,
    title:
      !canSaveCustom && hasActiveCustomEdge
        ? String(customValidation?.message || "입력값을 확인해주세요.")
        : "",
  };
}

export function buildPresetModuleOptionSaveButtonStateForSync({
  modalState = null,
  activeTab = "preset",
  hasPreset = false,
  hasActiveCustomEdge = false,
  bayValidation = null,
  cornerValidation = null,
} = {}) {
  if (activeTab !== "custom") {
    return buildPresetModuleOptionSaveButtonViewState({
      activeTab,
      hasPreset,
    });
  }
  const moduleType = normalizePreviewModuleType(modalState?.moduleType);
  const customValidation = moduleType === "corner" ? cornerValidation : bayValidation;
  return buildPresetModuleOptionSaveButtonViewState({
    activeTab,
    hasActiveCustomEdge,
    customValidation,
  });
}

export function buildPresetModuleOptionSyncPreViewModel({
  modalState = null,
  currentDraft = null,
  filterOptions = [],
  selectedPreset = null,
  getDefaultFilterKey,
  isPresetAvailableForFilter,
  moduleLabel = "",
  activeBayOptionId = "",
  activeCornerOptionId = "",
} = {}) {
  if (!modalState || typeof modalState !== "object") return null;
  const { draft: normalizedDraft, activeTab } = normalizePresetModuleOptionDraftForSync({
    modalState,
    currentDraft,
    filterOptions,
    selectedPreset,
    getDefaultFilterKey,
    isPresetAvailableForFilter,
  });
  const textViewState = buildPresetModuleOptionTextViewState(modalState, { moduleLabel });
  const customSyncRunPlan = buildPresetModuleOptionCustomSyncRunPlan({
    modalState,
    activeTab,
    activeBayOptionId,
    activeCornerOptionId,
  });
  return {
    normalizedDraft,
    activeTab,
    textViewState,
    customSyncRunPlan,
  };
}

export function buildPresetModuleOptionSyncPostViewModel({
  modalState = null,
  activeTab = "preset",
  hasPreset = false,
  hasActiveCustomEdge = false,
  bayValidation = null,
  cornerValidation = null,
} = {}) {
  return {
    backBtnState: buildPresetModuleOptionBackButtonViewState(modalState),
    saveBtnState: buildPresetModuleOptionSaveButtonStateForSync({
      modalState,
      activeTab,
      hasPreset,
      hasActiveCustomEdge,
      bayValidation,
      cornerValidation,
    }),
  };
}

export function buildPresetModuleOptionSyncDomUiViewModel({
  activeTab = "preset",
  textViewState = null,
  customPanelsViewState = null,
  syncPostViewModel = null,
  currentDraft = null,
} = {}) {
  const isPresetTab = activeTab !== "custom";
  const isCustomTab = !isPresetTab;
  const customPanels =
    customPanelsViewState && typeof customPanelsViewState === "object"
      ? customPanelsViewState
      : {
          hideUnifiedPreview: false,
          showCustomBayPanel: false,
          showCustomCornerPanel: false,
        };
  const backBtnState =
    syncPostViewModel?.backBtnState && typeof syncPostViewModel.backBtnState === "object"
      ? syncPostViewModel.backBtnState
      : { hidden: true, disabled: true, disabledClass: true };
  const saveBtnState =
    syncPostViewModel?.saveBtnState && typeof syncPostViewModel.saveBtnState === "object"
      ? syncPostViewModel.saveBtnState
      : { hidden: false, disabled: true, disabledClass: true, title: "" };
  return {
    title: String(textViewState?.title || ""),
    filterLabel: String(textViewState?.filterLabel || ""),
    filterNote: String(textViewState?.filterNote || ""),
    pickerButtonText: "모듈 선택",
    filterSelectValue: String(currentDraft?.filterKey || ""),
    tab: {
      presetActive: isPresetTab,
      customActive: isCustomTab,
    },
    panel: {
      showPresetPanel: isPresetTab,
      showCustomPanel: isCustomTab,
      showUnifiedPreview: !Boolean(customPanels.hideUnifiedPreview),
      showCustomBayPanel: Boolean(customPanels.showCustomBayPanel),
      showCustomCornerPanel: Boolean(customPanels.showCustomCornerPanel),
    },
    backBtnState,
    saveBtnState,
  };
}

export function buildPresetModuleOptionCustomSyncResolvedViewModel({
  modalState = null,
  activeTab = "preset",
  activeBayOptionId = "",
  activeCornerOptionId = "",
  customSyncPlan = null,
  hasPreset = false,
  bayValidation = null,
  cornerValidation = null,
} = {}) {
  const customPostSyncPlan = buildPresetModuleOptionCustomPostSyncPlan({
    modalState,
    activeTab,
    activeBayOptionId,
    activeCornerOptionId,
    customSyncPlan,
  });
  const syncPostViewModel = buildPresetModuleOptionSyncPostViewModel({
    modalState,
    activeTab,
    hasPreset,
    hasActiveCustomEdge: Boolean(customPostSyncPlan?.hasActiveCustomEdge),
    bayValidation,
    cornerValidation,
  });
  return {
    customPostSyncPlan,
    syncPostViewModel,
  };
}

export function buildPresetModuleOptionCustomPanelsViewState({
  modalState = null,
  activeTab = "preset",
  activeBayOptionId = "",
  activeCornerOptionId = "",
} = {}) {
  const isCustomTab = activeTab === "custom";
  const moduleType = normalizePreviewModuleType(modalState?.moduleType);
  const isCornerModule = moduleType === "corner";
  const hasEditTarget = Boolean(
    normalizePresetModuleOptionMode(modalState?.mode) === "edit" && modalState?.edgeId
  );
  const hasActiveCustomEdge =
    isCustomTab &&
    (hasEditTarget ||
      (isCornerModule ? Boolean(activeCornerOptionId) : Boolean(activeBayOptionId)));

  return {
    isCustomTab,
    isCornerModule,
    hideUnifiedPreview: isCustomTab,
    showCustomBayPanel: isCustomTab && !isCornerModule,
    showCustomCornerPanel: isCustomTab && isCornerModule,
    hasActiveCustomEdge,
  };
}

export function buildPresetModuleOptionCustomSyncPlan({
  modalState = null,
  activeTab = "preset",
} = {}) {
  if (!modalState || typeof modalState !== "object" || activeTab !== "custom") {
    return {
      enabled: false,
    };
  }
  const moduleType = normalizePreviewModuleType(modalState.moduleType);
  const isCornerModule = moduleType === "corner";
  const isEditMode =
    normalizePresetModuleOptionMode(modalState.mode) === "edit" && Boolean(modalState.edgeId);

  if (isEditMode) {
    return {
      enabled: true,
      mode: "edit",
      moduleType,
      nextActiveBayOptionId: isCornerModule ? "" : String(modalState.edgeId || ""),
      nextActiveCornerOptionId: isCornerModule ? String(modalState.edgeId || "") : "",
      syncTarget: isCornerModule ? "corner" : "bay",
      requiresEnsureSession: false,
    };
  }

  return {
    enabled: true,
    mode: "add",
    moduleType,
    nextActiveBayOptionId: isCornerModule ? "" : null,
    nextActiveCornerOptionId: isCornerModule ? null : "",
    syncTarget: isCornerModule ? "corner" : "bay",
    requiresEnsureSession: true,
  };
}

export function buildPresetModuleOptionCustomSyncExecutionPlan({
  customSyncPlan = null,
  activeBayOptionId = "",
  activeCornerOptionId = "",
} = {}) {
  const plan = customSyncPlan && typeof customSyncPlan === "object" ? customSyncPlan : null;
  if (!plan?.enabled) {
    return {
      enabled: false,
      shouldSyncBay: false,
      shouldSyncCorner: false,
    };
  }
  return {
    enabled: true,
    shouldSyncCorner:
      plan.syncTarget === "corner" &&
      (plan.mode === "edit" || Boolean(activeCornerOptionId)),
    shouldSyncBay:
      plan.syncTarget === "bay" &&
      (plan.mode === "edit" || Boolean(activeBayOptionId)),
  };
}

export function buildPresetModuleOptionCustomSyncPreUiDispatchPlan(customSyncRunPlan = null) {
  const runPlan =
    customSyncRunPlan && typeof customSyncRunPlan === "object" ? customSyncRunPlan : null;
  const customSyncPlan =
    runPlan?.customSyncPlan && typeof runPlan.customSyncPlan === "object" ? runPlan.customSyncPlan : null;
  const activeTargetsPatch =
    runPlan?.activeTargetsPatch && typeof runPlan.activeTargetsPatch === "object"
      ? runPlan.activeTargetsPatch
      : null;
  if (!customSyncPlan?.enabled) {
    return {
      enabled: false,
      customSyncPlan: null,
      activeTargetsPatch: {
        hasBayPatch: false,
        hasCornerPatch: false,
        nextActiveBayOptionId: null,
        nextActiveCornerOptionId: null,
      },
      shouldEnsureSession: false,
    };
  }
  return {
    enabled: true,
    customSyncPlan,
    activeTargetsPatch: activeTargetsPatch || {
      hasBayPatch: false,
      hasCornerPatch: false,
      nextActiveBayOptionId: null,
      nextActiveCornerOptionId: null,
    },
    shouldEnsureSession: Boolean(customSyncPlan.requiresEnsureSession),
  };
}

export function buildPresetModuleOptionCustomSyncPostUiDispatchPlan({
  customSyncPlan = null,
  activeBayOptionId = "",
  activeCornerOptionId = "",
} = {}) {
  const executionPlan = buildPresetModuleOptionCustomSyncExecutionPlan({
    customSyncPlan,
    activeBayOptionId,
    activeCornerOptionId,
  });
  return {
    enabled: Boolean(executionPlan.enabled),
    shouldSyncBay: Boolean(executionPlan.shouldSyncBay),
    shouldSyncCorner: Boolean(executionPlan.shouldSyncCorner),
  };
}

export function buildPresetModuleOptionCustomSyncActiveTargetsPatch(customSyncPlan = null) {
  const plan = customSyncPlan && typeof customSyncPlan === "object" ? customSyncPlan : null;
  if (!plan?.enabled) {
    return {
      hasBayPatch: false,
      hasCornerPatch: false,
      nextActiveBayOptionId: null,
      nextActiveCornerOptionId: null,
    };
  }
  const hasBayPatch = typeof plan.nextActiveBayOptionId === "string";
  const hasCornerPatch = typeof plan.nextActiveCornerOptionId === "string";
  return {
    hasBayPatch,
    hasCornerPatch,
    nextActiveBayOptionId: hasBayPatch ? String(plan.nextActiveBayOptionId || "") : null,
    nextActiveCornerOptionId: hasCornerPatch ? String(plan.nextActiveCornerOptionId || "") : null,
  };
}

export function buildPresetModuleOptionCustomSyncRunPlan({
  modalState = null,
  activeTab = "preset",
  activeBayOptionId = "",
  activeCornerOptionId = "",
} = {}) {
  const customSyncPlan = buildPresetModuleOptionCustomSyncPlan({
    modalState,
    activeTab,
  });
  return {
    customPanelsViewState: buildPresetModuleOptionCustomPanelsViewState({
      modalState,
      activeTab,
      activeBayOptionId,
      activeCornerOptionId,
    }),
    customSyncPlan,
    activeTargetsPatch: buildPresetModuleOptionCustomSyncActiveTargetsPatch(customSyncPlan),
  };
}

export function buildPresetModuleOptionCustomPostSyncPlan({
  modalState = null,
  activeTab = "preset",
  activeBayOptionId = "",
  activeCornerOptionId = "",
  customSyncPlan = null,
} = {}) {
  const customPanelsViewState = buildPresetModuleOptionCustomPanelsViewState({
    modalState,
    activeTab,
    activeBayOptionId,
    activeCornerOptionId,
  });
  return {
    customPanelsViewState,
    hasActiveCustomEdge: Boolean(customPanelsViewState.hasActiveCustomEdge),
    customSyncExecutionPlan: buildPresetModuleOptionCustomSyncExecutionPlan({
      customSyncPlan,
      activeBayOptionId,
      activeCornerOptionId,
    }),
  };
}

export function buildPresetModuleOptionSaveDispatchPlan({
  modalState = null,
  draft = null,
} = {}) {
  if (!modalState || typeof modalState !== "object") {
    return {
      route: "abort",
      moduleType: "normal",
      activeTab: "preset",
    };
  }
  const activeTab = draft?.activeTab === "custom" ? "custom" : "preset";
  const moduleType = normalizePreviewModuleType(modalState.moduleType);
  if (activeTab === "custom") {
    return {
      route: "custom",
      moduleType,
      activeTab,
    };
  }
  return {
    route: "preset",
    moduleType,
    activeTab,
  };
}

export function buildPresetModuleOptionSaveExecutionPlan({
  modalState = null,
  draft = null,
  selectedPreset = null,
} = {}) {
  const dispatchPlan = buildPresetModuleOptionSaveDispatchPlan({
    modalState,
    draft,
  });
  if (dispatchPlan.route === "abort") {
    return {
      route: "abort",
    };
  }
  if (dispatchPlan.route === "custom") {
    return {
      route: "custom",
      moduleType: dispatchPlan.moduleType,
    };
  }
  if (!selectedPreset) {
    return {
      route: "error",
      errorMessage: "먼저 모듈을 선택해주세요.",
    };
  }
  const saveTransition = buildPresetModuleOptionPresetSaveTransition(modalState, draft);
  if (!saveTransition) {
    return {
      route: "abort",
    };
  }
  if (saveTransition.isAddMode && !saveTransition.addTarget) {
    return {
      route: "error",
      errorMessage: "추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.",
    };
  }
  return {
    route: "preset",
    selectedPreset,
    saveTransition,
  };
}

export function buildPresetModuleOptionPresetSaveRuntimePlan({
  modalState = null,
  saveTransition = null,
} = {}) {
  const transition = saveTransition && typeof saveTransition === "object" ? saveTransition : null;
  if (!transition || !modalState || typeof modalState !== "object") return null;
  return {
    needsPreviewAddTargetPatch: Boolean(transition.isAddMode),
    previewAddTargetPatch: transition.isAddMode
      ? {
          target: clonePreviewAddTargetSnapshot(transition.addTarget),
          anchorEl: isElement(transition.returnFocusEl) ? transition.returnFocusEl : null,
        }
      : null,
    pickerOpen: {
      moduleType: normalizePreviewModuleType(modalState.moduleType),
      options: {
        context: transition.applyContext || null,
      },
    },
    presetApply: {
      applyContext: transition.applyContext || null,
      applyType: normalizePreviewModuleType(modalState.moduleType),
      applyFilterKey: String(transition.filterKey || ""),
    },
  };
}

export function buildPresetModuleOptionPresetSaveUiExecutionPlan({
  modalState = null,
  savePlan = null,
} = {}) {
  const normalizedSavePlan = savePlan && typeof savePlan === "object" ? savePlan : null;
  if (!normalizedSavePlan || normalizedSavePlan.route !== "preset") {
    return {
      route: "abort",
      runtimePlan: null,
      preset: null,
      errorMessage: "",
    };
  }

  const runtimePlan = buildPresetModuleOptionPresetSaveRuntimePlan({
    modalState,
    saveTransition: normalizedSavePlan.saveTransition,
  });
  if (!runtimePlan) {
    return {
      route: "abort",
      runtimePlan: null,
      preset: null,
      errorMessage: "",
    };
  }

  if (runtimePlan.needsPreviewAddTargetPatch && !runtimePlan.previewAddTargetPatch?.target) {
    return {
      route: "error",
      runtimePlan: null,
      preset: null,
      errorMessage: "추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.",
    };
  }

  return {
    route: "preset",
    runtimePlan,
    preset: normalizedSavePlan.selectedPreset || null,
    errorMessage: "",
  };
}

export function buildPresetModuleOptionSaveUiDispatchPlan({
  modalState = null,
  draft = null,
  selectedPreset = null,
} = {}) {
  const savePlan = buildPresetModuleOptionSaveExecutionPlan({
    modalState,
    draft,
    selectedPreset,
  });
  if (!savePlan || savePlan.route === "abort") {
    return {
      route: "abort",
    };
  }
  if (savePlan.route === "error") {
    return {
      route: "error",
      errorMessage: String(savePlan.errorMessage || ""),
    };
  }
  if (savePlan.route === "custom") {
    return {
      route: "custom",
      moduleType: normalizePreviewModuleType(savePlan.moduleType),
    };
  }
  const presetUiPlan = buildPresetModuleOptionPresetSaveUiExecutionPlan({
    modalState,
    savePlan,
  });
  if (!presetUiPlan || presetUiPlan.route === "abort") {
    return {
      route: "abort",
    };
  }
  if (presetUiPlan.route === "error") {
    return {
      route: "error",
      errorMessage: String(presetUiPlan.errorMessage || ""),
    };
  }
  return {
    route: "preset",
    preset: presetUiPlan.preset || null,
    runtimePlan: presetUiPlan.runtimePlan || null,
  };
}

export function buildPresetModuleOptionSaveRuntimeUiDispatchPlan(saveUiPlan = null) {
  const plan = saveUiPlan && typeof saveUiPlan === "object" ? saveUiPlan : null;
  if (!plan || plan.route === "abort") {
    return { route: "abort" };
  }
  if (plan.route === "error") {
    return {
      route: "error",
      errorMessage: String(plan.errorMessage || ""),
    };
  }
  if (plan.route === "custom") {
    return {
      route: "custom",
      moduleType: normalizePreviewModuleType(plan.moduleType),
    };
  }
  const runtimePlan = plan.runtimePlan && typeof plan.runtimePlan === "object" ? plan.runtimePlan : null;
  return {
    route: "preset",
    preset: plan.preset || null,
    shouldPatchPreviewAddTarget: Boolean(runtimePlan?.needsPreviewAddTargetPatch),
    previewAddTargetPatchTarget: runtimePlan?.previewAddTargetPatch?.target || null,
    previewAddTargetPatchAnchorEl: isElement(runtimePlan?.previewAddTargetPatch?.anchorEl)
      ? runtimePlan.previewAddTargetPatch.anchorEl
      : null,
    pickerOpenModuleType: normalizePreviewModuleType(runtimePlan?.pickerOpen?.moduleType),
    pickerOpenOptions:
      runtimePlan?.pickerOpen && typeof runtimePlan.pickerOpen.options === "object"
        ? runtimePlan.pickerOpen.options
        : {},
    presetApplyContext: runtimePlan?.presetApply?.applyContext || null,
    presetApplyType: normalizePreviewModuleType(runtimePlan?.presetApply?.applyType),
    presetApplyFilterKey: String(runtimePlan?.presetApply?.applyFilterKey || ""),
  };
}

export function isPresetModuleOptionCustomTabActive(
  modalState = null,
  draft = null,
  moduleType = ""
) {
  if (!modalState || typeof modalState !== "object") return false;
  if (draft?.activeTab !== "custom") return false;
  if (!moduleType) return true;
  return normalizePreviewModuleType(modalState.moduleType) === normalizePreviewModuleType(moduleType);
}
