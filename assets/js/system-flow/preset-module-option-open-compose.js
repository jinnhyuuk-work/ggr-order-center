import {
  isElement,
  clonePreviewAddTargetSnapshot,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
  normalizePresetModuleOptionMode,
  normalizePresetModuleOptionTab,
} from "../system-flow-core.js";

import {
  clonePresetModuleOptionBackContext,
  hasPresetModuleOptionBackContext,
} from "./preset-picker-open-close.js";

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
  initialTab = "custom",
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
      initialTab: normalizePresetModuleOptionTab(initialTab),
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
