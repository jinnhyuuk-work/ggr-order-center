import {
  isElement,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
} from "../system-flow-core.js";

export function getPreviewModuleActionInitialFocusKey({
  presetDisabled = false,
  customDisabled = false,
} = {}) {
  if (!presetDisabled) return "preset";
  if (!customDisabled) return "custom";
  return "title";
}

export function buildPreviewModuleActionOpenTransition(edge, requestedEdgeType = "bay") {
  if (!edge || typeof edge !== "object") return null;
  const normalizedEdgeType = normalizePreviewEdgeType(
    edge.type === "corner" || requestedEdgeType === "corner" ? "corner" : "bay"
  );
  return {
    normalizedEdgeType,
    viewState: buildPreviewModuleActionModalViewState(normalizedEdgeType),
    fallbackDirectComposeType: normalizedEdgeType === "corner" ? "corner" : "bay",
  };
}

export function buildPreviewModuleActionButtonResetState() {
  return {
    presetDisabled: false,
    customDisabled: false,
    removeDisabled: false,
  };
}

export function buildPreviewModuleActionModalOpenViewModel(edge, requestedEdgeType = "bay") {
  const openTransition = buildPreviewModuleActionOpenTransition(edge, requestedEdgeType);
  if (!openTransition) return null;
  const buttonState = buildPreviewModuleActionButtonResetState();
  const initialFocusKey = getPreviewModuleActionInitialFocusKey({
    presetDisabled: Boolean(buttonState.presetDisabled),
    customDisabled: Boolean(buttonState.customDisabled),
  });
  return {
    ...openTransition,
    buttonState,
    initialFocusKey,
  };
}

export function buildPreviewModuleActionModalOpenUiExecutionPlan({
  edge = null,
  edgeId = "",
  requestedEdgeType = "bay",
  anchorEl = null,
  hasModal = true,
} = {}) {
  const openViewModel = buildPreviewModuleActionModalOpenViewModel(edge, requestedEdgeType);
  if (!openViewModel) {
    return {
      route: "abort",
    };
  }
  const targetPatch = {
    edgeId: String(edgeId || edge?.id || ""),
    edgeType: normalizePreviewEdgeType(openViewModel.normalizedEdgeType),
    anchorEl: isElement(anchorEl) ? anchorEl : null,
  };
  if (!hasModal) {
    return {
      route: "fallback-direct-compose",
      openViewModel,
      targetPatch,
      fallbackDirectComposeType: openViewModel.fallbackDirectComposeType,
    };
  }
  return {
    route: "open-modal",
    openViewModel,
    targetPatch,
  };
}

export function buildPreviewModuleActionModalOpenUiDispatchPlan({
  openUiPlan = null,
} = {}) {
  const plan = openUiPlan && typeof openUiPlan === "object" ? openUiPlan : null;
  if (!plan || !String(plan.route || "")) return { route: "abort" };
  if (plan.route === "abort") return { route: "abort" };
  if (plan.route === "fallback-direct-compose") {
    return {
      route: "fallback-direct-compose",
      targetPatch: plan.targetPatch || null,
      fallbackDirectComposeType: normalizePreviewModuleType(plan.fallbackDirectComposeType),
    };
  }
  const openViewModel = plan.openViewModel && typeof plan.openViewModel === "object" ? plan.openViewModel : null;
  const viewState = openViewModel?.viewState && typeof openViewModel.viewState === "object"
    ? openViewModel.viewState
    : buildPreviewModuleActionModalViewState("bay");
  const buttonState =
    openViewModel?.buttonState && typeof openViewModel.buttonState === "object"
      ? openViewModel.buttonState
      : buildPreviewModuleActionButtonResetState();
  const initialFocusKey = ["preset", "custom", "title"].includes(openViewModel?.initialFocusKey)
    ? openViewModel.initialFocusKey
    : "title";
  return {
    route: "open-modal",
    targetPatch: plan.targetPatch || null,
    modalViewState: {
      title: String(viewState.title || ""),
      description: String(viewState.description || ""),
      selectedTypeText: String(viewState.selectedTypeText || ""),
      buttonState: {
        presetDisabled: Boolean(buttonState.presetDisabled),
        customDisabled: Boolean(buttonState.customDisabled),
        removeDisabled: Boolean(buttonState.removeDisabled),
      },
      initialFocusKey,
    },
    clearErrorMessage: true,
    shouldClosePreviewAddTypePicker: true,
  };
}

export function buildPreviewModuleActionRemoveTransition(flowState) {
  if (!flowState || typeof flowState !== "object") return null;
  const target = flowState.target && typeof flowState.target === "object" ? flowState.target : null;
  if (!target?.edgeId) return null;
  return {
    edgeId: String(target.edgeId || ""),
    edgeType: normalizePreviewEdgeType(target.edgeType),
  };
}

export function setPreviewModuleActionFlowTarget(flowState, edgeId, edgeType = "bay", anchorEl = null) {
  if (!flowState || typeof flowState !== "object") return;
  flowState.target = {
    edgeId: String(edgeId || ""),
    edgeType: normalizePreviewEdgeType(edgeType),
  };
  flowState.anchorEl = isElement(anchorEl) ? anchorEl : null;
}

export function getPreviewModuleActionCloseTransition(
  flowState,
  { returnFocus = false } = {}
) {
  const focusTarget =
    returnFocus && isElement(flowState?.anchorEl) ? flowState.anchorEl : null;
  return {
    focusTarget,
  };
}

export function buildPreviewModuleActionClosePlan(
  flowState,
  { returnFocus = false, clearTarget = true } = {}
) {
  const transition = getPreviewModuleActionCloseTransition(flowState, { returnFocus });
  const focusTarget = isElement(transition.focusTarget) ? transition.focusTarget : null;
  return {
    focusTarget,
    shouldRestoreFocus: Boolean(focusTarget),
    shouldResetFlowState: Boolean(clearTarget),
  };
}

export function buildPreviewModuleActionCloseUiDispatchPlan(
  flowState,
  { returnFocus = false, clearTarget = true } = {}
) {
  const closePlan = buildPreviewModuleActionClosePlan(flowState, { returnFocus, clearTarget });
  return {
    shouldRestoreFocus: Boolean(closePlan.shouldRestoreFocus),
    focusTarget: isElement(closePlan.focusTarget) ? closePlan.focusTarget : null,
    shouldResetFlowState: Boolean(closePlan.shouldResetFlowState),
    clearErrorMessage: true,
  };
}

export function getClosedModalIdFromEvent(event) {
  return String(event?.detail?.modalId || event?.target?.id || "");
}

export function buildPendingDirectComposeCleanupPlan({
  modalId = "",
  activeCornerOptionId = "",
  activeBayOptionId = "",
  discardedEdgeId = "",
  discarded = false,
} = {}) {
  if (String(modalId || "") !== "presetModuleOptionModal") {
    return {
      shouldHandle: false,
      shouldRender: false,
      clearCorner: false,
      clearBay: false,
    };
  }
  if (!discarded || !discardedEdgeId) {
    return {
      shouldHandle: true,
      shouldRender: false,
      clearCorner: false,
      clearBay: false,
    };
  }
  const normalizedDiscardedId = String(discardedEdgeId || "");
  return {
    shouldHandle: true,
    shouldRender: true,
    clearCorner: Boolean(
      activeCornerOptionId && String(activeCornerOptionId || "") === normalizedDiscardedId
    ),
    clearBay: Boolean(activeBayOptionId && String(activeBayOptionId || "") === normalizedDiscardedId),
  };
}

export function buildPendingDirectComposeCleanupRuntimePlan(cleanupPlan = null) {
  const plan = cleanupPlan && typeof cleanupPlan === "object" ? cleanupPlan : null;
  if (!plan?.shouldHandle || !plan?.shouldRender) {
    return {
      shouldApply: false,
      clearCorner: false,
      clearBay: false,
      shouldRender: false,
    };
  }
  return {
    shouldApply: true,
    clearCorner: Boolean(plan.clearCorner),
    clearBay: Boolean(plan.clearBay),
    shouldRender: Boolean(plan.shouldRender),
  };
}

export function getPresetModuleOptionCloseTransition(
  modalState,
  { returnFocus = false } = {}
) {
  const focusTarget =
    returnFocus && isElement(modalState?.returnFocusEl) ? modalState.returnFocusEl : null;
  return {
    focusTarget,
  };
}

export function buildPresetModuleOptionClosePlan(
  modalState,
  { returnFocus = true, clearState = true } = {}
) {
  const transition = getPresetModuleOptionCloseTransition(modalState, { returnFocus });
  const focusTarget = isElement(transition.focusTarget) ? transition.focusTarget : null;
  return {
    focusTarget,
    shouldRestoreFocus: Boolean(focusTarget),
    shouldResetFlowState: Boolean(clearState),
  };
}

export function buildPresetModuleOptionCloseUiDispatchPlan(
  modalState,
  { returnFocus = true, clearState = true } = {}
) {
  const closePlan = buildPresetModuleOptionClosePlan(modalState, { returnFocus, clearState });
  return {
    shouldRestoreFocus: Boolean(closePlan.shouldRestoreFocus),
    focusTarget: isElement(closePlan.focusTarget) ? closePlan.focusTarget : null,
    shouldResetFlowState: Boolean(closePlan.shouldResetFlowState),
    clearErrorMessage: true,
    shouldResetActiveComposeTargets: Boolean(closePlan.shouldResetFlowState),
  };
}

export function buildPreviewModuleActionModalViewState(edgeType = "bay") {
  const normalizedEdgeType = normalizePreviewEdgeType(edgeType);
  const typeLabel = normalizedEdgeType === "corner" ? "코너 모듈" : "일반 모듈";
  return {
    normalizedEdgeType,
    title: "모듈 작업",
    description: "선택한 모듈에 적용할 작업을 선택하세요.",
    selectedTypeText: `선택 대상: ${typeLabel}`,
  };
}
