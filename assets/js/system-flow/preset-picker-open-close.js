import {
  isElement,
  clonePreviewAddTargetSnapshot,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
  normalizePresetModuleOptionMode,
} from "../system-flow-core.js";

export function setPreviewPresetPickerOpenState(
  flowState,
  moduleType,
  { context = null, fallbackReturnFocusEl = null } = {}
) {
  if (!flowState || typeof flowState !== "object") return;
  const normalizedType = normalizePreviewModuleType(moduleType);
  flowState.moduleType = normalizedType;
  flowState.context =
    context && typeof context === "object"
      ? {
          mode:
            context.mode === "edit" ? "edit" : context.mode === "pick" ? "pick" : "add",
          edgeId: String(context.edgeId || ""),
          edgeType: normalizePreviewEdgeType(context.edgeType),
          returnFocusEl: isElement(context.returnFocusEl) ? context.returnFocusEl : null,
          returnTo: String(context.returnTo || ""),
          initialPresetId: String(context.initialPresetId || ""),
          initialFilterKey: String(context.initialFilterKey || ""),
        }
      : {
          mode: "add",
          edgeId: "",
          edgeType: normalizedType === "corner" ? "corner" : "bay",
          returnFocusEl: isElement(fallbackReturnFocusEl) ? fallbackReturnFocusEl : null,
          returnTo: "",
          initialPresetId: "",
          initialFilterKey: "",
        };
}

export function buildPreviewPresetPickerModalOpenTransition(
  moduleType,
  { context = null, fallbackFocusEl = null } = {}
) {
  const normalizedType = normalizePreviewModuleType(moduleType);
  const moduleLabel = normalizedType === "corner" ? "코너 모듈" : "일반 모듈";
  return {
    moduleType: normalizedType,
    title: `${moduleLabel} 모듈선택`,
    openStateOptions: {
      context,
      fallbackReturnFocusEl: isElement(fallbackFocusEl) ? fallbackFocusEl : null,
    },
  };
}

export function buildPreviewPresetPickerOpenViewModel({
  moduleType,
  context = null,
  fallbackFocusEl = null,
  filterOptions = [],
  allItems = [],
  targetEdge = null,
  resolveTargetFilterKey,
  isItemAvailableForFilter,
  resolveMatchedPresetId,
} = {}) {
  const openTransition = buildPreviewPresetPickerModalOpenTransition(moduleType, {
    context,
    fallbackFocusEl,
  });
  const defaultState = buildPreviewPresetPickerDefaultOpenState({
    moduleType: openTransition.moduleType,
    context,
    filterOptions,
    allItems,
    targetEdge,
    resolveTargetFilterKey,
    isItemAvailableForFilter,
    resolveMatchedPresetId,
  });
  return {
    openTransition,
    defaultState,
  };
}

export function resolvePreviewPresetPickerTargetEdgeForOpenContext(
  context = null,
  getEdgeById
) {
  const normalizedContext = context && typeof context === "object" ? context : null;
  if (!normalizedContext || normalizedContext.mode !== "edit" || !normalizedContext.edgeId) return null;
  if (typeof getEdgeById !== "function") return null;
  return getEdgeById(String(normalizedContext.edgeId || "")) || null;
}

export function buildPreviewPresetPickerOpenUiExecutionPlan(args = {}) {
  const openViewModel = buildPreviewPresetPickerOpenViewModel(args);
  if (!openViewModel) {
    return null;
  }
  const openTransition =
    openViewModel.openTransition && typeof openViewModel.openTransition === "object"
      ? openViewModel.openTransition
      : null;
  const defaultState =
    openViewModel.defaultState && typeof openViewModel.defaultState === "object"
      ? openViewModel.defaultState
      : null;
  return {
    openState: {
      moduleType: normalizePreviewModuleType(openTransition?.moduleType),
      options:
        openTransition && typeof openTransition.openStateOptions === "object"
          ? openTransition.openStateOptions
          : {},
    },
    pickerStatePatch: {
      filterKey: String(defaultState?.filterKey || ""),
      selectedPresetId: String(defaultState?.selectedPresetId || ""),
    },
    title: String(openTransition?.title || ""),
  };
}

export function buildPreviewPresetPickerOpenUiDispatchPlan(openUiPlan = null) {
  const plan = openUiPlan && typeof openUiPlan === "object" ? openUiPlan : null;
  if (!plan?.openState) {
    return {
      route: "abort",
    };
  }
  return {
    route: "open",
    openState: plan.openState,
    pickerStatePatch:
      plan.pickerStatePatch && typeof plan.pickerStatePatch === "object"
        ? plan.pickerStatePatch
        : { filterKey: "", selectedPresetId: "" },
    title: String(plan.title || ""),
    clearErrorMessage: true,
    shouldRenderModalUi: true,
  };
}

export function buildPreviewPresetPickerVisibleSelectionState(
  currentSelectedPresetId = "",
  filteredItems = []
) {
  const normalizedItems = Array.isArray(filteredItems) ? filteredItems : [];
  const currentId = String(currentSelectedPresetId || "");
  const stillVisible = normalizedItems.some((item) => String(item?.id || "") === currentId);
  return {
    selectedPresetId: stillVisible ? currentId : String(normalizedItems[0]?.id || ""),
  };
}

export function buildPreviewPresetPickerVisibleSelectionPatch(
  currentSelectedPresetId = "",
  filteredItems = []
) {
  const nextSelection = buildPreviewPresetPickerVisibleSelectionState(
    currentSelectedPresetId,
    filteredItems
  );
  return {
    selectedPresetId: String(nextSelection.selectedPresetId || ""),
  };
}

export function buildPreviewPresetPickerCardSelectionTransition({
  pickerFlowState = null,
  clickedPresetId = "",
  clickedType = "",
  filteredItems = [],
} = {}) {
  const normalizedType = normalizePreviewModuleType(clickedType || pickerFlowState?.moduleType);
  const presetId = String(clickedPresetId || "");
  const items = Array.isArray(filteredItems) ? filteredItems : [];
  const hasPreset = items.some((item) => String(item?.id || "") === presetId);
  if (!hasPreset) {
    return {
      ok: false,
      errorMessage: "선택한 모듈을 찾을 수 없습니다.",
      normalizedType,
      selectedPresetId: "",
    };
  }
  return {
    ok: true,
    errorMessage: "",
    normalizedType,
    selectedPresetId: presetId,
  };
}

export function buildPreviewPresetPickerCardClickUiExecutionPlan({
  pickerFlowState = null,
  clickedPresetId = "",
  clickedType = "",
  filteredItems = [],
} = {}) {
  const cardSelection = buildPreviewPresetPickerCardSelectionTransition({
    pickerFlowState,
    clickedPresetId,
    clickedType,
    filteredItems,
  });
  if (!cardSelection.ok) {
    return {
      route: "error",
      errorMessage: String(cardSelection.errorMessage || ""),
      pickerStatePatch: null,
      shouldRenderCards: false,
      shouldApplySelectedPreset: false,
    };
  }
  const pickerStatePatch = {};
  if (cardSelection.normalizedType !== normalizePreviewModuleType(pickerFlowState?.moduleType)) {
    pickerStatePatch.moduleType = cardSelection.normalizedType;
  }
  pickerStatePatch.selectedPresetId = String(cardSelection.selectedPresetId || "");
  return {
    route: "select-and-apply",
    errorMessage: "",
    pickerStatePatch,
    shouldRenderCards: true,
    shouldApplySelectedPreset: true,
  };
}

export function buildPreviewPresetPickerDefaultOpenState({
  moduleType = "normal",
  context = null,
  filterOptions = [],
  allItems = [],
  targetEdge = null,
  resolveTargetFilterKey,
  isItemAvailableForFilter,
  resolveMatchedPresetId,
} = {}) {
  const normalizedType = normalizePreviewModuleType(moduleType);
  const options = Array.isArray(filterOptions) ? filterOptions : [];
  const items = Array.isArray(allItems) ? allItems : [];
  const presetContext = context && typeof context === "object" ? context : null;
  const initialFilterKey = String(presetContext?.initialFilterKey || "");
  const initialPresetId = String(presetContext?.initialPresetId || "");

  let preferredFilterKey = "";
  if (initialFilterKey && options.some((option) => String(option?.key || "") === initialFilterKey)) {
    preferredFilterKey = initialFilterKey;
  } else if (typeof resolveTargetFilterKey === "function") {
    preferredFilterKey = String(
      resolveTargetFilterKey({
        moduleType: normalizedType,
        targetEdge,
        filterOptions: options,
      }) || ""
    );
  }
  if (!preferredFilterKey && options.length) {
    preferredFilterKey = String(options[0]?.key || "");
  }

  const filteredItems = items.filter((item) => {
    if (typeof isItemAvailableForFilter !== "function") return true;
    return Boolean(isItemAvailableForFilter(item, preferredFilterKey, normalizedType));
  });

  let matchedPresetId = "";
  if (initialPresetId && filteredItems.some((item) => String(item?.id || "") === initialPresetId)) {
    matchedPresetId = initialPresetId;
  } else if (typeof resolveMatchedPresetId === "function") {
    matchedPresetId = String(
      resolveMatchedPresetId({
        moduleType: normalizedType,
        targetEdge,
        filteredItems,
      }) || ""
    );
  }

  return {
    moduleType: normalizedType,
    filterKey: preferredFilterKey,
    selectedPresetId: matchedPresetId || String(filteredItems[0]?.id || ""),
  };
}

export function resolvePreviewPresetDefaultFilterKeyForTargetEdge({
  moduleType = "normal",
  targetEdge = null,
  filterOptions = [],
} = {}) {
  if (!targetEdge) return "";
  const options = Array.isArray(filterOptions) ? filterOptions : [];
  if (moduleType === "corner" && targetEdge.type === "corner") {
    const targetKey = targetEdge.swap ? "600x800" : "800x600";
    return options.some((option) => String(option?.key || "") === targetKey) ? targetKey : "";
  }
  if (moduleType === "normal" && targetEdge.type === "bay") {
    const widthKey = String(Math.round(Number(targetEdge.width || 0) || 0));
    return options.some((option) => String(option?.key || "") === widthKey) ? widthKey : "";
  }
  return "";
}

export function buildPreviewPresetTargetEdgeComparableSnapshot({
  targetEdge = null,
  rodCount = 0,
  furnitureId = "",
} = {}) {
  if (!targetEdge || typeof targetEdge !== "object") return null;
  return {
    edgeType: String(targetEdge.type || ""),
    swap: Boolean(targetEdge.swap),
    count: Math.max(1, Math.floor(Number(targetEdge.count || 1))),
    rodCount: Math.max(0, Math.floor(Number(rodCount || 0))),
    furnitureId: String(furnitureId || ""),
  };
}

export function buildPreviewPresetComparableSnapshotForItem(item = null, { furnitureId = "" } = {}) {
  return {
    swap: Boolean(item?.swap),
    count: Math.max(1, Math.floor(Number(item?.count || 1))),
    rodCount: Math.max(0, Math.floor(Number(item?.rodCount || 0))),
    furnitureId: String(furnitureId || item?.furnitureId || item?.furnitureAddonId || ""),
  };
}

export function resolvePreviewPresetMatchedIdForTargetEdge({
  moduleType = "normal",
  targetEdge = null,
  filteredItems = [],
  getRodCountForEdge,
  getFurnitureIdForEdge,
  getPresetFurnitureIdForItem,
} = {}) {
  if (!targetEdge) return "";
  const rodCount =
    typeof getRodCountForEdge === "function" ? Number(getRodCountForEdge(targetEdge) || 0) : 0;
  const furnitureId =
    typeof getFurnitureIdForEdge === "function" ? String(getFurnitureIdForEdge(targetEdge) || "") : "";
  return findMatchingPreviewPresetIdForTargetEdge({
    moduleType,
    filteredItems,
    targetEdgeSnapshot: buildPreviewPresetTargetEdgeComparableSnapshot({
      targetEdge,
      rodCount,
      furnitureId,
    }),
    getPresetComparableSnapshot: (item) =>
      buildPreviewPresetComparableSnapshotForItem(item, {
        furnitureId:
          typeof getPresetFurnitureIdForItem === "function"
            ? String(getPresetFurnitureIdForItem(item) || "")
            : "",
      }),
  });
}

export function clonePresetModuleOptionBackContext(backContext, clonePreviewAddTargetSnapshot) {
  if (!backContext || typeof backContext !== "object") return null;
  const kind =
    backContext.kind === "preview-module-action" ? "preview-module-action" : "preview-add-type";
  if (kind === "preview-module-action") {
    return {
      kind,
      edgeId: String(backContext.edgeId || ""),
      edgeType: normalizePreviewEdgeType(backContext.edgeType),
      anchorEl: isElement(backContext.anchorEl) ? backContext.anchorEl : null,
    };
  }
  return {
    kind: "preview-add-type",
    addTarget:
      typeof clonePreviewAddTargetSnapshot === "function"
        ? clonePreviewAddTargetSnapshot(backContext.addTarget)
        : null,
    anchorEl: isElement(backContext.anchorEl) ? backContext.anchorEl : null,
  };
}

export function hasPresetModuleOptionBackContext(modalState) {
  if (!modalState || !modalState.backContext || typeof modalState.backContext !== "object") return false;
  const kind = String(modalState.backContext.kind || "");
  if (kind === "preview-module-action") return Boolean(modalState.backContext.edgeId);
  if (kind === "preview-add-type") return Boolean(modalState.backContext.addTarget);
  return false;
}

export function buildPreviewPresetPickerApplyContextFromPresetModalState(modalState) {
  if (!modalState || typeof modalState !== "object") return null;
  const mode = normalizePresetModuleOptionMode(modalState.mode);
  const moduleType = normalizePreviewModuleType(modalState.moduleType);
  const returnFocusEl = isElement(modalState.returnFocusEl) ? modalState.returnFocusEl : null;

  if (mode === "edit") {
    return {
      mode: "edit",
      edgeId: String(modalState.edgeId || ""),
      edgeType: normalizePreviewEdgeType(modalState.edgeType),
      returnFocusEl,
      returnTo: "",
      initialPresetId: "",
      initialFilterKey: "",
    };
  }

  return {
    mode: "add",
    edgeId: "",
    edgeType: moduleType === "corner" ? "corner" : "bay",
    returnFocusEl,
    returnTo: "",
    initialPresetId: "",
    initialFilterKey: "",
  };
}

export function buildPreviewPresetPickerOpenFromPresetModuleOption(modalState, draft = null) {
  if (!modalState || typeof modalState !== "object") return null;
  const moduleType = normalizePreviewModuleType(modalState.moduleType);
  return {
    moduleType,
    options: {
      context: {
        mode: "pick",
        returnTo: "preset-module-option",
        returnFocusEl: isElement(modalState.returnFocusEl) ? modalState.returnFocusEl : null,
        initialPresetId: String(draft?.presetId || ""),
        initialFilterKey: String(draft?.filterKey || ""),
        edgeId: String(modalState.edgeId || ""),
        edgeType: normalizePreviewEdgeType(modalState.edgeType),
      },
    },
  };
}

export function buildPresetModuleOptionPresetSaveTransition(modalState, draft = null) {
  const applyContext = buildPreviewPresetPickerApplyContextFromPresetModalState(modalState);
  if (!applyContext) return null;
  const isAddMode = normalizePresetModuleOptionMode(modalState?.mode) === "add";
  const addTarget = isAddMode ? clonePreviewAddTargetSnapshot(modalState?.addTarget) : null;
  const returnFocusEl = isElement(modalState?.returnFocusEl) ? modalState.returnFocusEl : null;
  return {
    applyContext,
    isAddMode,
    addTarget,
    returnFocusEl,
    filterKey: String(draft?.filterKey || ""),
  };
}

export function getPreviewPresetPickerCloseTransition(
  pickerFlowState,
  { fallbackFocusEl = null } = {}
) {
  const currentContext =
    pickerFlowState?.context && typeof pickerFlowState.context === "object"
      ? { ...pickerFlowState.context }
      : null;
  const returnsToPresetModuleOption =
    currentContext?.mode === "pick" && currentContext?.returnTo === "preset-module-option";
  const focusTarget = isElement(pickerFlowState?.context?.returnFocusEl)
    ? pickerFlowState.context.returnFocusEl
    : isElement(fallbackFocusEl)
      ? fallbackFocusEl
      : null;
  return {
    currentContext,
    returnsToPresetModuleOption,
    focusTarget,
  };
}

export function buildPreviewPresetPickerClosePlan(
  pickerFlowState,
  { fallbackFocusEl = null, returnFocus = true, clearTarget = true } = {}
) {
  const transition = getPreviewPresetPickerCloseTransition(pickerFlowState, {
    fallbackFocusEl,
  });
  const focusTarget = isElement(transition.focusTarget) ? transition.focusTarget : null;
  return {
    returnsToPresetModuleOption: Boolean(transition.returnsToPresetModuleOption),
    focusTarget,
    shouldRestoreFocus:
      !transition.returnsToPresetModuleOption && Boolean(returnFocus) && Boolean(focusTarget),
    shouldClearPreviewAddTarget: Boolean(clearTarget),
  };
}

export function buildPreviewPresetPickerCloseUiDispatchPlan(
  pickerFlowState,
  { fallbackFocusEl = null, returnFocus = true, clearTarget = true } = {}
) {
  const closePlan = buildPreviewPresetPickerClosePlan(pickerFlowState, {
    fallbackFocusEl,
    returnFocus,
    clearTarget,
  });
  return {
    shouldRestoreFocus: Boolean(closePlan.shouldRestoreFocus),
    focusTarget: isElement(closePlan.focusTarget) ? closePlan.focusTarget : null,
    shouldClearPreviewAddTarget: Boolean(closePlan.shouldClearPreviewAddTarget),
    shouldReopenPresetModuleOption: Boolean(closePlan.returnsToPresetModuleOption),
    shouldResetPreviewPresetPickerFlowState: true,
    clearErrorMessage: true,
  };
}

export function findMatchingPreviewPresetIdForTargetEdge({
  moduleType = "normal",
  filteredItems = [],
  targetEdgeSnapshot = null,
  getPresetComparableSnapshot,
} = {}) {
  const normalizedModuleType = normalizePreviewModuleType(moduleType);
  const target =
    targetEdgeSnapshot && typeof targetEdgeSnapshot === "object" ? targetEdgeSnapshot : null;
  if (!target) return "";
  const items = Array.isArray(filteredItems) ? filteredItems : [];
  const match = items.find((item) => {
    const presetSnapshot =
      typeof getPresetComparableSnapshot === "function"
        ? getPresetComparableSnapshot(item)
        : null;
    if (!presetSnapshot || typeof presetSnapshot !== "object") return false;
    if (normalizedModuleType === "corner" && String(target.edgeType || "") === "corner") {
      return (
        Number(presetSnapshot.count || 0) === Number(target.count || 0) &&
        Number(presetSnapshot.rodCount || 0) === Number(target.rodCount || 0) &&
        String(presetSnapshot.furnitureId || "") === String(target.furnitureId || "")
      );
    }
    if (normalizedModuleType === "normal" && String(target.edgeType || "") === "bay") {
      return (
        Number(presetSnapshot.count || 0) === Number(target.count || 0) &&
        Number(presetSnapshot.rodCount || 0) === Number(target.rodCount || 0) &&
        String(presetSnapshot.furnitureId || "") === String(target.furnitureId || "")
      );
    }
    return false;
  });
  return match ? String(match.id || "") : "";
}
