import {
  isElement,
  clonePreviewAddTargetSnapshot,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
  normalizePresetModuleOptionMode,
  normalizePresetModuleOptionTab,
} from "./system-flow-core.js";

export {
  clonePreviewAddTargetSnapshot,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
  normalizePresetModuleOptionMode,
  normalizePresetModuleOptionTab,
} from "./system-flow-core.js";

export function setPreviewAddFlowStep(flowState, step = "type", selectedModuleType = "") {
  if (!flowState || typeof flowState !== "object") return;
  const normalizedStep = step === "root-corner-direction" ? "root-corner-direction" : "type";
  const normalizedType =
    selectedModuleType === "corner" || selectedModuleType === "normal" ? selectedModuleType : "";
  flowState.step = normalizedStep;
  flowState.selectedModuleType =
    normalizedStep === "root-corner-direction" ? normalizedType : "";
}

export function setPreviewAddFlowTarget(flowState, target = null, anchorEl = null) {
  if (!flowState || typeof flowState !== "object") return;
  flowState.target = target && typeof target === "object" ? target : null;
  flowState.anchorEl = isElement(anchorEl) ? anchorEl : null;
}

export function getPreviewAddCloseTransition(flowState, { returnFocus = false } = {}) {
  const focusTarget = returnFocus && isElement(flowState?.anchorEl) ? flowState.anchorEl : null;
  return {
    focusTarget,
  };
}

export function buildPreviewAddClosePlan(
  flowState,
  { returnFocus = false, clearTarget = true } = {}
) {
  const transition = getPreviewAddCloseTransition(flowState, { returnFocus });
  const focusTarget = isElement(transition.focusTarget) ? transition.focusTarget : null;
  return {
    focusTarget,
    shouldRestoreFocus: Boolean(focusTarget),
    shouldClearFlowTarget: Boolean(clearTarget),
  };
}

export function buildPreviewAddCloseUiDispatchPlan(
  flowState,
  { returnFocus = false, clearTarget = true } = {}
) {
  const closePlan = buildPreviewAddClosePlan(flowState, { returnFocus, clearTarget });
  return {
    shouldRestoreFocus: Boolean(closePlan.shouldRestoreFocus),
    focusTarget: isElement(closePlan.focusTarget) ? closePlan.focusTarget : null,
    shouldClearFlowTarget: Boolean(closePlan.shouldClearFlowTarget),
    resetStep: "type",
    resetSelectedModuleType: "",
    clearErrorMessage: true,
  };
}

export function buildPreviewAddModalOpenViewState({
  sideIndex,
  attachSideIndex,
  allowedTypes = ["normal"],
  cornerId = "",
  endpointId = "",
  cornerLimitState = { canAdd: true },
  cornerDirectionBlockedMessage = "",
  getCornerLimitBlockedMessage,
} = {}) {
  if (Number.isNaN(Number(sideIndex)) || Number.isNaN(Number(attachSideIndex))) return null;

  const normalizedAllowedTypes = Array.isArray(allowedTypes) ? allowedTypes : ["normal"];
  const hasNormalSlot = normalizedAllowedTypes.includes("normal");
  const hasCornerSlot = normalizedAllowedTypes.includes("corner");
  const canAddNewCorner = Boolean(cornerLimitState?.canAdd);
  const isRootEndpointTarget = !cornerId && endpointId === "root-endpoint";
  const canUseCornerDirection = !String(cornerDirectionBlockedMessage || "");
  const canUseCornerAction = Boolean(
    cornerId || (hasCornerSlot && canAddNewCorner && canUseCornerDirection)
  );

  let cornerBtnTitle = "";
  if (!canUseCornerAction && hasCornerSlot && !cornerId && !canAddNewCorner) {
    cornerBtnTitle =
      typeof getCornerLimitBlockedMessage === "function"
        ? String(getCornerLimitBlockedMessage(cornerLimitState) || "")
        : "";
  } else if (!canUseCornerAction && hasCornerSlot && !cornerId && !canUseCornerDirection) {
    cornerBtnTitle = String(cornerDirectionBlockedMessage || "");
  } else if (!canUseCornerAction && !hasCornerSlot) {
    cornerBtnTitle = "이 끝점에서는 코너 추가가 불가합니다.";
  }

  let errorMessage = "";
  let isError = false;
  if (!cornerId && hasCornerSlot && !canAddNewCorner) {
    errorMessage =
      typeof getCornerLimitBlockedMessage === "function"
        ? String(getCornerLimitBlockedMessage(cornerLimitState) || "")
        : "";
    isError = Boolean(errorMessage);
  } else if (!cornerId && hasCornerSlot && !canUseCornerDirection) {
    errorMessage = String(cornerDirectionBlockedMessage || "");
    isError = Boolean(errorMessage);
  } else if (!cornerId && !hasCornerSlot) {
    errorMessage = "이 끝점에서는 코너 추가가 불가합니다. 일반 모듈을 추가해주세요.";
    isError = true;
  }

  return {
    target: {
      endpointId: String(endpointId || ""),
      sideIndex: Number(sideIndex),
      cornerId: String(cornerId || ""),
      attachSideIndex: Number(attachSideIndex),
      allowedTypes: normalizedAllowedTypes,
    },
    hasNormalSlot,
    hasCornerSlot,
    isRootEndpointTarget,
    canUseCornerAction,
    normalButton: {
      disabled: !hasNormalSlot,
      title: hasNormalSlot ? "" : "이 끝점에서는 일반 모듈 추가가 불가합니다.",
    },
    cornerButton: {
      disabled: !canUseCornerAction,
      title: cornerBtnTitle,
    },
    error: {
      message: errorMessage,
      isError,
    },
  };
}

export function buildPreviewAddModalOpenTransition({
  sideIndex,
  cornerId = "",
  prepend = false,
  attachSideIndex = sideIndex,
  attachAtStart = prepend,
  endpointId = "",
  allowedTypes = ["normal"],
  cornerLimitState = { canAdd: true },
  getCornerDirectionBlockedMessage,
  getCornerLimitBlockedMessage,
} = {}) {
  if (Number.isNaN(Number(sideIndex)) || Number.isNaN(Number(attachSideIndex))) return null;
  const isRootEndpointTarget = !String(cornerId || "") && String(endpointId || "") === "root-endpoint";
  const shouldDeferCornerDirectionCheck = isRootEndpointTarget;
  const cornerDirectionBlockedMessage =
    !String(cornerId || "") && !shouldDeferCornerDirectionCheck
      ? String(
          typeof getCornerDirectionBlockedMessage === "function"
            ? getCornerDirectionBlockedMessage({ sideIndex, attachSideIndex }) || ""
            : ""
        )
      : "";
  const openViewState = buildPreviewAddModalOpenViewState({
    sideIndex,
    attachSideIndex,
    allowedTypes,
    cornerId,
    endpointId,
    cornerLimitState,
    cornerDirectionBlockedMessage,
    getCornerLimitBlockedMessage,
  });
  if (!openViewState) return null;
  const flowTarget = buildPreviewAddFlowTargetForOpen({
    sideIndex,
    cornerId,
    prepend,
    attachSideIndex,
    attachAtStart,
    endpointId,
    allowedTypes: openViewState.target.allowedTypes,
  });
  if (!flowTarget) return null;
  return {
    openViewState,
    flowTarget,
  };
}

export function buildPreviewAddTypeModalOpenViewModel(args = {}) {
  const openTransition = buildPreviewAddModalOpenTransition(args);
  if (!openTransition) return null;
  const initialFocusKey = getPreviewAddTypeStepInitialFocusKey({
    normalDisabled: Boolean(openTransition.openViewState?.normalButton?.disabled),
    cornerDisabled: Boolean(openTransition.openViewState?.cornerButton?.disabled),
  });
  return {
    ...openTransition,
    initialFocusKey,
  };
}

export function buildPreviewAddTypeModalOpenUiExecutionPlan({
  openViewModel = null,
  anchorEl = null,
} = {}) {
  const model = openViewModel && typeof openViewModel === "object" ? openViewModel : null;
  if (!model?.flowTarget || !model?.openViewState) {
    return {
      route: "abort",
      flowTargetPatch: null,
      openViewState: null,
      initialFocusKey: "title",
    };
  }
  return {
    route: "open",
    flowTargetPatch: {
      target: model.flowTarget,
      anchorEl: isElement(anchorEl) ? anchorEl : null,
    },
    openViewState: model.openViewState,
    initialFocusKey:
      model.initialFocusKey === "normal" || model.initialFocusKey === "corner"
        ? model.initialFocusKey
        : "title",
  };
}

export function buildPreviewAddFlowTargetForOpen({
  sideIndex,
  cornerId = "",
  prepend = false,
  attachSideIndex = sideIndex,
  attachAtStart = prepend,
  endpointId = "",
  allowedTypes = ["normal"],
} = {}) {
  if (Number.isNaN(Number(sideIndex)) || Number.isNaN(Number(attachSideIndex))) return null;
  return {
    endpointId: String(endpointId || ""),
    sideIndex: Number(sideIndex),
    cornerId: String(cornerId || ""),
    prepend: Boolean(prepend),
    attachSideIndex: Number(attachSideIndex),
    attachAtStart: Boolean(attachAtStart),
    allowedTypes: Array.isArray(allowedTypes) ? allowedTypes : ["normal"],
  };
}

export function buildPreviewAddTypeModalStepViewState({
  step = "type",
  rightBlockedMessage = "",
  leftBlockedMessage = "",
} = {}) {
  const normalizedStep = step === "root-corner-direction" ? "root-corner-direction" : "type";
  if (normalizedStep === "root-corner-direction") {
    const rightMessage =
      String(rightBlockedMessage || "") || "우측 방향 코너 시작을 사용할 수 없습니다.";
    const leftMessage =
      String(leftBlockedMessage || "") || "좌측 방향 코너 시작을 사용할 수 없습니다.";
    return {
      title: "코너 시작 방향 선택",
      description: "첫 모듈을 코너로 시작할 방향을 선택하세요.",
      rootCornerDirection: {
        enabled: true,
        rightButton: {
          disabled: Boolean(rightBlockedMessage),
          title: Boolean(rightBlockedMessage) ? rightMessage : "",
        },
        leftButton: {
          disabled: Boolean(leftBlockedMessage),
          title: Boolean(leftBlockedMessage) ? leftMessage : "",
        },
        backButton: {
          disabled: false,
        },
      },
    };
  }
  return {
    title: "추가 방식 선택",
    description: "끝점에서 연장할 모듈 유형을 선택하세요.",
    rootCornerDirection: null,
  };
}

export function buildPreviewAddTypeSelectTransition({
  moduleType = "normal",
  target = null,
} = {}) {
  const normalizedType = normalizePreviewModuleType(moduleType);
  const normalizedTarget = target && typeof target === "object" ? target : null;
  const isRootEndpointTarget =
    !String(normalizedTarget?.cornerId || "") &&
    String(normalizedTarget?.endpointId || "") === "root-endpoint";
  const shouldSelectRootCornerDirection =
    normalizedType === "corner" && isRootEndpointTarget;

  if (shouldSelectRootCornerDirection) {
    return {
      route: "root-corner-direction",
      moduleType: normalizedType,
      nextStep: "root-corner-direction",
      selectedModuleType: "corner",
    };
  }

  return {
    route: "open-preset-module-option",
    moduleType: normalizedType,
    nextStep: "type",
    selectedModuleType: "",
  };
}

export function buildPreviewAddTypeSelectionOutcome({
  moduleType = "normal",
  previewAddFlowState = null,
} = {}) {
  const normalizedType = normalizePreviewModuleType(moduleType);
  const typeSelectTransition = buildPreviewAddTypeSelectTransition({
    moduleType: normalizedType,
    target: previewAddFlowState?.target || null,
  });
  if (typeSelectTransition.route === "root-corner-direction") {
    return {
      route: "root-corner-direction",
      normalizedType,
      errorMessage: "",
      nextOpen: null,
    };
  }
  const openPlan = buildPreviewAddPresetModuleOptionOpenPlan(previewAddFlowState, normalizedType);
  if (!openPlan.ok || !openPlan.nextOpen) {
    return {
      route: "error",
      normalizedType,
      errorMessage: String(openPlan.errorMessage || ""),
      nextOpen: null,
    };
  }
  return {
    route: "open-preset-module-option",
    normalizedType,
    errorMessage: "",
    nextOpen: openPlan.nextOpen,
  };
}

export function buildPreviewAddTypeSelectionUiExecutionPlan({
  moduleType = "normal",
  previewAddFlowState = null,
  rootCornerRightDisabled = false,
  rootCornerLeftDisabled = false,
} = {}) {
  const selectionOutcome = buildPreviewAddTypeSelectionOutcome({
    moduleType,
    previewAddFlowState,
  });
  if (selectionOutcome.route === "error") {
    return {
      route: "error",
      errorMessage: String(selectionOutcome.errorMessage || ""),
      nextOpen: null,
      nextStep: "type",
      selectedModuleType: "",
      focusKey: "title",
      normalizedType: selectionOutcome.normalizedType || normalizePreviewModuleType(moduleType),
    };
  }
  if (selectionOutcome.route === "root-corner-direction") {
    return {
      route: "root-corner-direction",
      errorMessage: "",
      nextOpen: null,
      nextStep: "root-corner-direction",
      selectedModuleType: "corner",
      focusKey: getPreviewAddRootCornerStepInitialFocusKey({
        rightDisabled: Boolean(rootCornerRightDisabled),
        leftDisabled: Boolean(rootCornerLeftDisabled),
      }),
      normalizedType: "corner",
    };
  }
  return {
    route: "open-preset-module-option",
    errorMessage: "",
    nextOpen: selectionOutcome.nextOpen,
    nextStep: "type",
    selectedModuleType: "",
    focusKey: "title",
    normalizedType: selectionOutcome.normalizedType || normalizePreviewModuleType(moduleType),
  };
}

export function buildPreviewAddTypeSelectionUiDispatchPlan(uiPlan = null) {
  const plan = uiPlan && typeof uiPlan === "object" ? uiPlan : null;
  if (!plan || !String(plan.route || "")) return { route: "abort" };
  if (plan.route === "error") {
    return {
      route: "error",
      errorMessage: String(plan.errorMessage || ""),
      clearErrorMessage: false,
    };
  }
  if (plan.route === "root-corner-direction") {
    return {
      route: "root-corner-direction",
      nextStep: "root-corner-direction",
      selectedModuleType: "corner",
      focusKey: ["right", "left", "title"].includes(plan.focusKey) ? plan.focusKey : "title",
      clearErrorMessage: true,
    };
  }
  return {
    route: "open-preset-module-option",
    normalizedType: normalizePreviewModuleType(plan.normalizedType),
    nextOpen: plan.nextOpen || null,
    clearErrorMessage: true,
  };
}

export function buildRootCornerStartTargetVariant(target = null, direction = "right") {
  const baseTarget =
    target && typeof target === "object"
      ? target
      : { endpointId: "root-endpoint", allowedTypes: ["normal", "corner"] };
  if (String(baseTarget?.endpointId || "") !== "root-endpoint") return null;
  const normalizedDirection = direction === "left" ? "left" : "right";
  const isLeft = normalizedDirection === "left";
  return {
    ...baseTarget,
    endpointId: "root-endpoint",
    sideIndex: isLeft ? 2 : 0,
    attachSideIndex: isLeft ? 2 : 0,
    attachAtStart: true,
    prepend: true,
    extendDx: isLeft ? -1 : 1,
    extendDy: 0,
    inwardX: 0,
    inwardY: 1,
    rootCornerStartDirection: normalizedDirection,
  };
}

export function hasSelectedRootCornerStartDirection(target = null) {
  return (
    String(target?.endpointId || "") === "root-endpoint" &&
    (target?.rootCornerStartDirection === "left" || target?.rootCornerStartDirection === "right")
  );
}

export function applyRootCornerStartDirectionToPreviewAddFlow(flowState, direction = "right") {
  if (!flowState || typeof flowState !== "object") return false;
  const nextTarget = buildRootCornerStartTargetVariant(flowState.target, direction);
  if (!nextTarget) return false;
  flowState.target = nextTarget;
  return true;
}

export function buildPreviewAddRootCornerDirectionBlockedMessages(
  target = null,
  getBlockedMessage
) {
  const rightTarget = buildRootCornerStartTargetVariant(target, "right");
  const leftTarget = buildRootCornerStartTargetVariant(target, "left");
  const resolveMessage = (previewTarget, fallback) => {
    if (!previewTarget || typeof previewTarget !== "object") return String(fallback || "");
    if (typeof getBlockedMessage !== "function") return "";
    return String(getBlockedMessage(previewTarget) || "");
  };
  return {
    rightBlockedMessage: resolveMessage(rightTarget, "우측 방향 코너 시작을 사용할 수 없습니다."),
    leftBlockedMessage: resolveMessage(leftTarget, "좌측 방향 코너 시작을 사용할 수 없습니다."),
  };
}

export function buildPreviewAddRootCornerDirectionApplyResult({
  hasPreviewTarget = false,
  blockedMessage = "",
  applySucceeded = false,
  requiredMessage = "",
} = {}) {
  const fallbackRequiredMessage =
    String(requiredMessage || "") || "코너 시작 방향을 먼저 선택해주세요.";
  if (!hasPreviewTarget) {
    return {
      ok: false,
      errorMessage: fallbackRequiredMessage,
      reason: "missing-preview-target",
    };
  }
  if (blockedMessage) {
    return {
      ok: false,
      errorMessage: String(blockedMessage || ""),
      reason: "blocked-direction",
    };
  }
  if (!applySucceeded) {
    return {
      ok: false,
      errorMessage: fallbackRequiredMessage,
      reason: "apply-failed",
    };
  }
  return {
    ok: true,
    errorMessage: "",
    reason: "",
  };
}

export function buildPreviewAddRootCornerDirectionSelectionOutcome({
  direction = "right",
  previewAddFlowState = null,
  getBlockedMessageForTarget,
  requiredMessage = "",
} = {}) {
  const normalizedDirection = direction === "left" ? "left" : "right";
  const previewTarget = buildRootCornerStartTargetVariant(
    previewAddFlowState?.target || null,
    normalizedDirection
  );
  const blockedMessage = previewTarget
    ? String(
        typeof getBlockedMessageForTarget === "function"
          ? getBlockedMessageForTarget(previewTarget) || ""
          : ""
      )
    : "";
  const applySucceeded = !blockedMessage && previewTarget
    ? applyRootCornerStartDirectionToPreviewAddFlow(previewAddFlowState, normalizedDirection)
    : false;
  const applyResult = buildPreviewAddRootCornerDirectionApplyResult({
    hasPreviewTarget: Boolean(previewTarget),
    blockedMessage,
    applySucceeded,
    requiredMessage,
  });
  if (!applyResult.ok) {
    return {
      route: "error",
      normalizedDirection,
      errorMessage: String(applyResult.errorMessage || ""),
      nextOpen: null,
    };
  }
  const openPlan = buildPreviewAddPresetModuleOptionOpenPlan(previewAddFlowState, "corner");
  if (!openPlan.ok || !openPlan.nextOpen) {
    return {
      route: "error",
      normalizedDirection,
      errorMessage: String(openPlan.errorMessage || ""),
      nextOpen: null,
    };
  }
  return {
    route: "open-preset-module-option",
    normalizedDirection,
    errorMessage: "",
    nextOpen: openPlan.nextOpen,
  };
}

export function buildPreviewAddRootCornerDirectionSelectionUiExecutionPlan({
  direction = "right",
  previewAddFlowState = null,
  getBlockedMessageForTarget,
  requiredMessage = "",
} = {}) {
  const selectionOutcome = buildPreviewAddRootCornerDirectionSelectionOutcome({
    direction,
    previewAddFlowState,
    getBlockedMessageForTarget,
    requiredMessage,
  });
  if (selectionOutcome.route === "error") {
    return {
      route: "error",
      errorMessage: String(selectionOutcome.errorMessage || ""),
      nextOpen: null,
      normalizedDirection: selectionOutcome.normalizedDirection || (direction === "left" ? "left" : "right"),
    };
  }
  return {
    route: "open-preset-module-option",
    errorMessage: "",
    nextOpen: selectionOutcome.nextOpen,
    normalizedDirection: selectionOutcome.normalizedDirection || (direction === "left" ? "left" : "right"),
  };
}

export function buildPreviewAddRootCornerDirectionSelectionUiDispatchPlan(uiPlan = null) {
  const plan = uiPlan && typeof uiPlan === "object" ? uiPlan : null;
  if (!plan || !String(plan.route || "")) return { route: "abort" };
  if (plan.route === "error") {
    return {
      route: "error",
      errorMessage: String(plan.errorMessage || ""),
      clearErrorMessage: false,
    };
  }
  return {
    route: "open-preset-module-option",
    normalizedType: "corner",
    nextOpen: plan.nextOpen || null,
    clearErrorMessage: true,
  };
}

export function getPreviewAddTypeStepInitialFocusKey({
  normalDisabled = false,
  cornerDisabled = false,
} = {}) {
  if (!normalDisabled) return "normal";
  if (!cornerDisabled) return "corner";
  return "title";
}

export function buildPreviewAddTypeBackUiExecutionPlan({
  normalDisabled = false,
  cornerDisabled = false,
} = {}) {
  return {
    nextStep: "type",
    selectedModuleType: "",
    shouldClearError: true,
    focusKey: getPreviewAddTypeStepInitialFocusKey({
      normalDisabled,
      cornerDisabled,
    }),
  };
}

export function getPreviewAddRootCornerStepInitialFocusKey({
  rightDisabled = false,
  leftDisabled = false,
} = {}) {
  if (!rightDisabled) return "right";
  if (!leftDisabled) return "left";
  return "title";
}

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

export function buildPreviewModuleActionBackContext(target, anchorEl = null) {
  if (!target || typeof target !== "object") return null;
  const edgeId = String(target.edgeId || "");
  if (!edgeId) return null;
  return {
    kind: "preview-module-action",
    edgeId,
    edgeType: normalizePreviewEdgeType(target.edgeType),
    anchorEl: isElement(anchorEl) ? anchorEl : null,
  };
}

export function buildPresetModuleOptionOpenFromPreviewAddFlow(
  previewAddFlowState,
  moduleType = "normal"
) {
  const normalizedModuleType = normalizePreviewModuleType(moduleType);
  const addTarget = clonePreviewAddTargetSnapshot(previewAddFlowState?.target);
  if (!addTarget) return null;
  const anchorEl = isElement(previewAddFlowState?.anchorEl) ? previewAddFlowState.anchorEl : null;
  return {
    moduleType: normalizedModuleType,
    options: {
      mode: "add",
      addTarget,
      backContext: {
        kind: "preview-add-type",
        addTarget,
        anchorEl,
      },
      returnFocusEl: anchorEl,
    },
  };
}

export function buildPreviewAddPresetModuleOptionOpenPlan(
  previewAddFlowState,
  moduleType = "normal"
) {
  const nextOpen = buildPresetModuleOptionOpenFromPreviewAddFlow(previewAddFlowState, moduleType);
  if (!nextOpen) {
    return {
      ok: false,
      errorMessage: "추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.",
      nextOpen: null,
    };
  }
  return {
    ok: true,
    errorMessage: "",
    nextOpen,
  };
}

export function buildPresetModuleOptionOpenFromPreviewAddUiDispatchPlan({
  prebuiltNextOpen = null,
  openPlan = null,
} = {}) {
  if (prebuiltNextOpen && typeof prebuiltNextOpen === "object") {
    return {
      route: "open",
      nextOpen: prebuiltNextOpen,
      errorMessage: "",
      clearErrorMessage: false,
    };
  }
  const normalizedOpenPlan = openPlan && typeof openPlan === "object" ? openPlan : null;
  if (!normalizedOpenPlan?.ok || !normalizedOpenPlan?.nextOpen) {
    return {
      route: "error",
      nextOpen: null,
      errorMessage: String(normalizedOpenPlan?.errorMessage || ""),
      clearErrorMessage: false,
    };
  }
  return {
    route: "open",
    nextOpen: normalizedOpenPlan.nextOpen,
    errorMessage: "",
    clearErrorMessage: false,
  };
}

export function buildPresetModuleOptionOpenFromPreviewAddExceptionUiDispatchPlan(error) {
  const detail =
    error instanceof Error && error.message
      ? ` (${String(error.message)})`
      : "";
  return {
    route: "error",
    errorMessage: `다음 모듈 구성 화면을 여는 중 오류가 발생했습니다.${detail}`,
    clearErrorMessage: false,
  };
}

export function buildPreviewAddOpenArgsFromBackContext(backContext, cloneTargetSnapshot) {
  const target =
    typeof cloneTargetSnapshot === "function"
      ? cloneTargetSnapshot(backContext?.addTarget)
      : null;
  if (!target) return null;
  const sideIndex = Number(target.sideIndex);
  const attachSideIndex = Number.isFinite(Number(target.attachSideIndex))
    ? Number(target.attachSideIndex)
    : sideIndex;
  return {
    sideIndex,
    cornerId: String(target.cornerId || ""),
    prepend: Boolean(target.prepend),
    attachSideIndex,
    attachAtStart: Boolean(target.attachAtStart ?? target.prepend),
    endpointId: String(target.endpointId || ""),
    allowedTypes: Array.isArray(target.allowedTypes) ? target.allowedTypes : ["normal"],
    anchorEl: isElement(backContext?.anchorEl) ? backContext.anchorEl : null,
  };
}

export function buildPresetModuleOptionBackNavigation(modalState, cloneTargetSnapshot) {
  if (!hasPresetModuleOptionBackContext(modalState)) return null;
  const backContext = clonePresetModuleOptionBackContext(
    modalState?.backContext,
    cloneTargetSnapshot
  );
  if (!backContext) return null;
  if (backContext.kind === "preview-module-action") {
    return {
      route: "preview-module-action",
      edgeId: String(backContext.edgeId || ""),
      edgeType: normalizePreviewEdgeType(backContext.edgeType),
      anchorEl: isElement(backContext.anchorEl) ? backContext.anchorEl : null,
    };
  }
  const openArgs = buildPreviewAddOpenArgsFromBackContext(backContext, cloneTargetSnapshot);
  if (!openArgs) return null;
  return {
    route: "preview-add-type",
    ...openArgs,
  };
}

export function buildPresetModuleOptionBackUiDispatchPlan(modalState, cloneTargetSnapshot) {
  const navigation = buildPresetModuleOptionBackNavigation(modalState, cloneTargetSnapshot);
  if (!navigation) return null;
  if (navigation.route === "preview-module-action") {
    return {
      route: "preview-module-action",
      previewModuleActionArgs: [
        String(navigation.edgeId || ""),
        normalizePreviewEdgeType(navigation.edgeType),
        isElement(navigation.anchorEl) ? navigation.anchorEl : null,
      ],
      previewAddArgs: null,
    };
  }
  return {
    route: "preview-add-type",
    previewModuleActionArgs: null,
    previewAddArgs: [
      Number(navigation.sideIndex),
      String(navigation.cornerId || ""),
      Boolean(navigation.prepend),
      Number(navigation.attachSideIndex),
      Boolean(navigation.attachAtStart),
      String(navigation.endpointId || ""),
      Array.isArray(navigation.allowedTypes) ? navigation.allowedTypes : ["normal"],
      isElement(navigation.anchorEl) ? navigation.anchorEl : null,
    ],
  };
}

export function buildPresetModuleOptionOpenFromModuleActionTarget(
  target,
  anchorEl = null,
  { initialTab = "preset" } = {}
) {
  if (!target || typeof target !== "object") return null;
  const edgeId = String(target.edgeId || "");
  if (!edgeId) return null;
  const normalizedEdgeType = normalizePreviewEdgeType(target.edgeType);
  return {
    moduleType: normalizedEdgeType === "corner" ? "corner" : "normal",
    options: {
      mode: "edit",
      edgeId,
      backContext: buildPreviewModuleActionBackContext(target, anchorEl),
      returnFocusEl: isElement(anchorEl) ? anchorEl : null,
      initialTab: normalizePresetModuleOptionTab(initialTab),
    },
  };
}

export function buildPresetModuleOptionOpenFromPreviewModuleActionFlow(
  flowState,
  { initialTab = "preset" } = {}
) {
  if (!flowState || typeof flowState !== "object") return null;
  const target = flowState.target && typeof flowState.target === "object" ? flowState.target : null;
  if (!target?.edgeId) return null;
  const anchorEl = isElement(flowState.anchorEl) ? flowState.anchorEl : null;
  return buildPresetModuleOptionOpenFromModuleActionTarget(target, anchorEl, { initialTab });
}

export function buildPresetModuleOptionOpenFromPreviewModuleActionUiDispatchPlan(nextOpen = null) {
  const normalizedNextOpen = nextOpen && typeof nextOpen === "object" ? nextOpen : null;
  if (!normalizedNextOpen?.moduleType || !normalizedNextOpen?.options) {
    return {
      route: "abort",
      nextOpen: null,
    };
  }
  return {
    route: "open",
    nextOpen: normalizedNextOpen,
  };
}

export function buildPresetModuleOptionOpenFromDirectComposeEdge({
  moduleType = "normal",
  edgeId = "",
  preserveDraft = false,
  backContext = null,
  cloneTargetSnapshot,
  fallbackReturnFocusEl = null,
} = {}) {
  const normalizedModuleType = normalizePreviewModuleType(moduleType);
  const normalizedEdgeId = String(edgeId || "");
  if (!normalizedEdgeId) return null;
  const resolvedBackContext = clonePresetModuleOptionBackContext(
    backContext,
    cloneTargetSnapshot
  );
  return {
    moduleType: normalizedModuleType,
    options: {
      mode: "edit",
      edgeId: normalizedEdgeId,
      preserveDraft: Boolean(preserveDraft),
      initialTab: "custom",
      backContext: resolvedBackContext,
      returnFocusEl: isElement(fallbackReturnFocusEl) ? fallbackReturnFocusEl : null,
    },
  };
}

export function buildPresetModuleOptionDraftForOpen({
  currentDraft = null,
  preserveDraft = false,
  moduleType = "normal",
  initialTab = "preset",
  edgeId = "",
  getDefaultFilterKey,
} = {}) {
  const normalizedModuleType = normalizePreviewModuleType(moduleType);
  const normalizedTab = normalizePresetModuleOptionTab(initialTab);
  const canReuseDraft =
    preserveDraft &&
    currentDraft &&
    typeof currentDraft === "object" &&
    currentDraft.moduleType === normalizedModuleType;

  if (canReuseDraft) {
    return {
      ...currentDraft,
      activeTab: normalizedTab,
    };
  }

  const filterKey =
    typeof getDefaultFilterKey === "function"
      ? String(getDefaultFilterKey(normalizedModuleType, edgeId) || "")
      : "";

  return {
    moduleType: normalizedModuleType,
    presetId: "",
    filterKey,
    activeTab: normalizedTab,
  };
}

export function buildPresetModuleOptionModalStateForOpen({
  moduleType = "normal",
  mode = "add",
  edgeId = "",
  addTarget = null,
  fallbackAddTarget = null,
  backContext = null,
  returnFocusEl = null,
} = {}) {
  const normalizedModuleType = normalizePreviewModuleType(moduleType);
  const normalizedMode = normalizePresetModuleOptionMode(mode);
  return {
    mode: normalizedMode,
    moduleType: normalizedModuleType,
    edgeId: String(edgeId || ""),
    edgeType: normalizePreviewEdgeType(normalizedModuleType),
    addTarget:
      normalizedMode === "add"
        ? clonePreviewAddTargetSnapshot(addTarget || fallbackAddTarget)
        : null,
    backContext: clonePresetModuleOptionBackContext(backContext, clonePreviewAddTargetSnapshot),
    returnFocusEl: isElement(returnFocusEl) ? returnFocusEl : null,
  };
}

export function buildPresetModuleOptionOpenTransition({
  moduleType = "normal",
  options = {},
  currentDraft = null,
  fallbackAddTarget = null,
  getDefaultFilterKey,
} = {}) {
  const normalizedModuleType = normalizePreviewModuleType(moduleType);
  const normalizedMode = normalizePresetModuleOptionMode(options?.mode);
  const normalizedTab = normalizePresetModuleOptionTab(options?.initialTab);

  const draft = buildPresetModuleOptionDraftForOpen({
    currentDraft,
    preserveDraft: Boolean(options?.preserveDraft),
    moduleType: normalizedModuleType,
    initialTab: normalizedTab,
    edgeId: String(options?.edgeId || ""),
    getDefaultFilterKey,
  });

  const modalState = buildPresetModuleOptionModalStateForOpen({
    moduleType: normalizedModuleType,
    mode: normalizedMode,
    edgeId: String(options?.edgeId || ""),
    addTarget: options?.addTarget || null,
    fallbackAddTarget: fallbackAddTarget || null,
    backContext: options?.backContext || null,
    returnFocusEl: options?.returnFocusEl || null,
  });

  return {
    normalizedModuleType,
    normalizedMode,
    normalizedTab,
    draft,
    modalState,
    shouldResetActiveComposeTargets: normalizedMode === "add",
  };
}

export function buildPresetModuleOptionOpenUiDispatchPlan({
  moduleType = "normal",
  options = {},
  currentDraft = null,
  fallbackAddTarget = null,
  getDefaultFilterKey,
} = {}) {
  const openTransition = buildPresetModuleOptionOpenTransition({
    moduleType,
    options,
    currentDraft,
    fallbackAddTarget,
    getDefaultFilterKey,
  });
  if (!openTransition || !openTransition.draft || !openTransition.modalState) {
    return {
      route: "error",
      errorMessage: "통합 모듈구성 모달 전환 상태를 만들지 못했습니다.",
      openTransition: null,
    };
  }
  return {
    route: "open",
    errorMessage: "",
    openTransition,
    flowStatePatch: {
      draft: openTransition.draft,
      modalState: openTransition.modalState,
    },
    shouldResetActiveComposeTargets: Boolean(openTransition.shouldResetActiveComposeTargets),
  };
}

export function buildPresetModuleOptionCustomComposeSessionBootstrap({
  modalState = null,
  draft = null,
  activeBayOptionId = "",
  activeCornerOptionId = "",
  previewAddTarget = null,
  cloneTargetSnapshot,
} = {}) {
  if (!modalState || typeof modalState !== "object") {
    return { kind: "abort" };
  }
  if (draft?.activeTab !== "custom") {
    return { kind: "abort" };
  }
  if (normalizePresetModuleOptionMode(modalState.mode) !== "add") {
    return { kind: "abort" };
  }

  const moduleType = normalizePreviewModuleType(modalState.moduleType);
  const hasActiveCustomEdge =
    moduleType === "corner" ? Boolean(activeCornerOptionId) : Boolean(activeBayOptionId);
  if (hasActiveCustomEdge) {
    return {
      kind: "ready",
      moduleType,
    };
  }

  const addTarget =
    typeof cloneTargetSnapshot === "function"
      ? cloneTargetSnapshot(modalState.addTarget || previewAddTarget)
      : null;
  if (!addTarget) {
    return {
      kind: "error",
      moduleType,
      errorMessage: "추가 대상 끝점을 찾을 수 없습니다. 다시 시도해주세요.",
    };
  }

  return {
    kind: "create",
    moduleType,
    addTarget,
  };
}

export function buildPresetModuleOptionCustomComposeBootstrapUiExecutionPlan(
  sessionBootstrap = null
) {
  const bootstrap =
    sessionBootstrap && typeof sessionBootstrap === "object" ? sessionBootstrap : null;
  const kind = String(bootstrap?.kind || "abort");
  if (kind === "abort") {
    return { route: "abort" };
  }
  if (kind === "ready") {
    return {
      route: "ready",
      moduleType: normalizePreviewModuleType(bootstrap?.moduleType),
    };
  }
  if (kind === "error") {
    return {
      route: "error",
      errorMessage: String(bootstrap?.errorMessage || ""),
    };
  }
  return {
    route: "resolve-source",
    moduleType: normalizePreviewModuleType(bootstrap?.moduleType),
    addTarget:
      bootstrap?.addTarget && typeof bootstrap.addTarget === "object" ? bootstrap.addTarget : null,
  };
}

export function buildPendingCornerComposeEdge({
  id = "",
  sideIndex = 0,
  source = null,
  placement = null,
  anchorDir = { dx: 1, dy: 0 },
  anchorInwardDir = { dx: 0, dy: 1 },
  createdAt = Date.now(),
} = {}) {
  return {
    id: String(id || ""),
    type: "corner",
    sideIndex: Number(sideIndex || 0),
    attachAtStart: Boolean(source?.attachAtStart),
    attachSideIndex: Number(sideIndex || 0),
    anchorEndpointId: String(source?.endpointId || ""),
    anchorDirDx: Number(anchorDir?.dx || 0),
    anchorDirDy: Number(anchorDir?.dy || 0),
    anchorInwardX: Number(anchorInwardDir?.dx || 0),
    anchorInwardY: Number(anchorInwardDir?.dy || 0),
    extendDx: Number(source?.extendDx || 0),
    extendDy: Number(source?.extendDy || 0),
    inwardX: Number(source?.inwardX || 0),
    inwardY: Number(source?.inwardY || 0),
    placement: placement || null,
    swap: false,
    count: 0,
    pendingAdd: true,
    createdAt: Number(createdAt || Date.now()),
  };
}

export function buildPendingCornerComposeEdgeCreatePlan({
  source = null,
  placement = null,
  normalizeDirection: normalizeDirectionFn,
  directionToSideIndex: directionToSideIndexFn,
  createdAt = Date.now(),
  randomSuffix = "",
} = {}) {
  if (!source || typeof source !== "object") return null;
  const normalizeDir =
    typeof normalizeDirectionFn === "function"
      ? normalizeDirectionFn
      : (dx, dy) => ({ dx: Number(dx || 0), dy: Number(dy || 0) });
  const toSideIndex =
    typeof directionToSideIndexFn === "function"
      ? directionToSideIndexFn
      : () => Number(source?.attachSideIndex ?? source?.sideIndex ?? 0);

  const dir = placement ? normalizeDir(placement.dirDx, placement.dirDy) : { dx: 1, dy: 0 };
  const sideIndex = Number(
    source?.attachSideIndex ?? source?.sideIndex ?? toSideIndex(dir.dx, dir.dy)
  );
  const safeCreatedAt = Number(createdAt || Date.now());
  const suffix = String(randomSuffix || Math.random().toString(16).slice(2));

  return {
    id: `corner-${sideIndex}-${safeCreatedAt}-${suffix}`,
    sideIndex,
    source,
    placement: placement || null,
    anchorDir: normalizeDir(source?.extendDx, source?.extendDy),
    anchorInwardDir: normalizeDir(source?.inwardX, source?.inwardY),
    createdAt: safeCreatedAt,
  };
}

export function buildPreviewPresetCornerEdge({
  source = null,
  preset = null,
  selectedFilterKey = "",
  placement = null,
  normalizeDirection: normalizeDirectionFn,
  directionToSideIndex: directionToSideIndexFn,
  createdAt = Date.now(),
  randomSuffix = "",
} = {}) {
  if (!source || typeof source !== "object") return null;
  const normalizeDir =
    typeof normalizeDirectionFn === "function"
      ? normalizeDirectionFn
      : (dx, dy) => ({ dx: Number(dx || 0), dy: Number(dy || 0) });
  const toSideIndex =
    typeof directionToSideIndexFn === "function"
      ? directionToSideIndexFn
      : () => Number(source?.attachSideIndex ?? source?.sideIndex ?? 0);

  const dir = placement ? normalizeDir(placement.dirDx, placement.dirDy) : { dx: 1, dy: 0 };
  const sideIndex = Number(
    source?.attachSideIndex ?? source?.sideIndex ?? toSideIndex(dir.dx, dir.dy)
  );
  const safeCreatedAt = Number(createdAt || Date.now());
  const suffix = String(randomSuffix || Math.random().toString(16).slice(2));
  const anchorDir = normalizeDir(source?.extendDx, source?.extendDy);
  const anchorInwardDir = normalizeDir(source?.inwardX, source?.inwardY);
  const resolvedSwap =
    String(selectedFilterKey || "") === "600x800"
      ? true
      : String(selectedFilterKey || "") === "800x600"
        ? false
        : Boolean(preset?.swap);
  return {
    id: `corner-${sideIndex}-${safeCreatedAt}-${suffix}`,
    type: "corner",
    sideIndex,
    attachAtStart: Boolean(source?.attachAtStart),
    attachSideIndex: sideIndex,
    anchorEndpointId: String(source?.endpointId || ""),
    anchorDirDx: Number(anchorDir?.dx || 0),
    anchorDirDy: Number(anchorDir?.dy || 0),
    anchorInwardX: Number(anchorInwardDir?.dx || 0),
    anchorInwardY: Number(anchorInwardDir?.dy || 0),
    extendDx: Number(source?.extendDx || 0),
    extendDy: Number(source?.extendDy || 0),
    inwardX: Number(source?.inwardX || 0),
    inwardY: Number(source?.inwardY || 0),
    placement: placement || null,
    swap: resolvedSwap,
    count: Math.max(1, Math.floor(Number(preset?.count || 1))),
    createdAt: safeCreatedAt,
  };
}

export function buildPresetModuleOptionCustomCornerComposeValidation({
  isRootSource = false,
  hasRootCornerStartDirection = true,
  rootCornerDirectionRequiredMessage = "",
  canAddCornerByLimit = true,
  cornerLimitBlockedMessage = "",
  canAddCornerAtTarget = true,
  cornerAttachSideBlockedMessage = "",
} = {}) {
  if (isRootSource && !hasRootCornerStartDirection) {
    return {
      valid: false,
      errorMessage: String(rootCornerDirectionRequiredMessage || ""),
      reason: "missing-root-corner-direction",
    };
  }
  if (!canAddCornerByLimit) {
    return {
      valid: false,
      errorMessage: String(cornerLimitBlockedMessage || ""),
      reason: "corner-limit",
    };
  }
  if (!canAddCornerAtTarget) {
    return {
      valid: false,
      errorMessage: String(cornerAttachSideBlockedMessage || ""),
      reason: "corner-attach-side",
    };
  }
  return {
    valid: true,
    errorMessage: "",
    reason: "",
  };
}

export function buildDirectComposePendingActivationState({
  moduleType = "normal",
  edgeId = "",
} = {}) {
  const normalizedModuleType = normalizePreviewModuleType(moduleType);
  const normalizedEdgeId = String(edgeId || "");
  if (!normalizedEdgeId) return null;
  if (normalizedModuleType === "corner") {
    return {
      activeBayOptionId: "",
      activeCornerOptionId: normalizedEdgeId,
      resetBayDirectComposeDraft: false,
      resetCornerDirectComposeDraft: true,
      errorMessage: "",
    };
  }
  return {
    activeBayOptionId: normalizedEdgeId,
    activeCornerOptionId: "",
    resetBayDirectComposeDraft: true,
    resetCornerDirectComposeDraft: false,
    errorMessage: "",
  };
}

export function buildDirectComposePendingCreationResult({
  moduleType = "normal",
  edgeId = "",
  errorMessage = "이 끝점에서는 모듈을 추가할 수 없습니다.",
} = {}) {
  const normalizedEdgeId = String(edgeId || "");
  if (!normalizedEdgeId) {
    return {
      ok: false,
      errorMessage: String(errorMessage || ""),
      activationState: null,
    };
  }
  return {
    ok: true,
    errorMessage: "",
    activationState: buildDirectComposePendingActivationState({
      moduleType,
      edgeId: normalizedEdgeId,
    }),
  };
}

export function buildDirectComposePendingCreationUiExecutionPlan(args = {}) {
  const result = buildDirectComposePendingCreationResult(args);
  if (!result.ok || !result.activationState) {
    return {
      route: "error",
      errorMessage: String(result.errorMessage || ""),
      activationState: null,
    };
  }
  return {
    route: "activate",
    errorMessage: "",
    activationState: result.activationState,
  };
}

export function buildPendingBayComposeAddOptions() {
  return {
    pushHistory: false,
    skipRender: true,
    initialCount: 0,
    pendingAdd: true,
  };
}

export function buildPreviewAddSourceResolutionResult({
  source = null,
  errorMessage = "이 끝점에서는 모듈을 추가할 수 없습니다.",
} = {}) {
  if (!source) {
    return {
      ok: false,
      source: null,
      errorMessage: String(errorMessage || ""),
    };
  }
  return {
    ok: true,
    source,
    errorMessage: "",
  };
}

export function buildPreviewAddNormalCommitUiExecutionPlan({
  sourceResolution = null,
  shelfId = "",
} = {}) {
  const resolution =
    sourceResolution && typeof sourceResolution === "object" ? sourceResolution : null;
  if (!resolution?.ok || !resolution?.source) {
    return {
      route: "error",
      errorMessage: String(resolution?.errorMessage || ""),
      source: null,
      shelfId: "",
    };
  }
  const normalizedShelfId = String(shelfId || "");
  return {
    route: "open-bay-option",
    errorMessage: "",
    source: resolution.source,
    shelfId: normalizedShelfId,
  };
}

export function buildPreviewAddCornerCommitUiExecutionPlan({
  existingCornerId = "",
  sourceResolution = null,
  cornerComposeValidation = null,
  edgeCreatePlan = null,
  fallbackErrorMessage = "",
} = {}) {
  const normalizedExistingCornerId = String(existingCornerId || "");
  if (normalizedExistingCornerId) {
    return {
      route: "open-existing-corner",
      errorMessage: "",
      cornerId: normalizedExistingCornerId,
      edgeCreatePlan: null,
    };
  }
  const resolution =
    sourceResolution && typeof sourceResolution === "object" ? sourceResolution : null;
  if (!resolution?.ok || !resolution?.source) {
    return {
      route: "error",
      errorMessage: String(resolution?.errorMessage || fallbackErrorMessage || ""),
      cornerId: "",
      edgeCreatePlan: null,
    };
  }
  const validation =
    cornerComposeValidation && typeof cornerComposeValidation === "object"
      ? cornerComposeValidation
      : null;
  if (!validation?.valid) {
    return {
      route: "error",
      errorMessage: String(validation?.errorMessage || fallbackErrorMessage || ""),
      cornerId: "",
      edgeCreatePlan: null,
    };
  }
  if (!edgeCreatePlan || typeof edgeCreatePlan !== "object") {
    return {
      route: "error",
      errorMessage: String(fallbackErrorMessage || ""),
      cornerId: "",
      edgeCreatePlan: null,
    };
  }
  return {
    route: "create-corner",
    errorMessage: "",
    cornerId: "",
    edgeCreatePlan,
  };
}

export function buildPreviewPresetNormalAddUiExecutionPlan({
  sourceResolution = null,
  shelfId = "",
  fallbackErrorMessage = "모듈을 추가하지 못했습니다. 다시 시도해주세요.",
} = {}) {
  const resolution =
    sourceResolution && typeof sourceResolution === "object" ? sourceResolution : null;
  if (!resolution?.ok || !resolution?.source) {
    return {
      route: "error",
      errorMessage: String(resolution?.errorMessage || fallbackErrorMessage || ""),
      source: null,
      shelfId: "",
    };
  }
  const normalizedShelfId = String(shelfId || "");
  if (!normalizedShelfId) {
    return {
      route: "error",
      errorMessage: String(fallbackErrorMessage || ""),
      source: resolution.source,
      shelfId: "",
    };
  }
  return {
    route: "apply-normal-preset",
    errorMessage: "",
    source: resolution.source,
    shelfId: normalizedShelfId,
  };
}

export function buildPreviewPresetCornerAddUiExecutionPlan({
  sourceResolution = null,
  cornerComposeValidation = null,
  edge = null,
  fallbackErrorMessage = "모듈을 추가하지 못했습니다. 다시 시도해주세요.",
} = {}) {
  const resolution =
    sourceResolution && typeof sourceResolution === "object" ? sourceResolution : null;
  if (!resolution?.ok || !resolution?.source) {
    return {
      route: "error",
      errorMessage: String(resolution?.errorMessage || fallbackErrorMessage || ""),
      edge: null,
      source: null,
    };
  }
  const validation =
    cornerComposeValidation && typeof cornerComposeValidation === "object"
      ? cornerComposeValidation
      : null;
  if (!validation?.valid) {
    return {
      route: "error",
      errorMessage: String(validation?.errorMessage || fallbackErrorMessage || ""),
      edge: null,
      source: resolution.source,
    };
  }
  if (!edge || typeof edge !== "object" || !String(edge.id || "")) {
    return {
      route: "error",
      errorMessage: String(fallbackErrorMessage || ""),
      edge: null,
      source: resolution.source,
    };
  }
  return {
    route: "apply-corner-preset",
    errorMessage: "",
    edge,
    source: resolution.source,
  };
}

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
        Boolean(presetSnapshot.swap) === Boolean(target.swap) &&
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
