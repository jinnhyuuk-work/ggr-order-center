import {
  isElement,
  normalizePreviewModuleType,
} from "../system-flow-core.js";

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
