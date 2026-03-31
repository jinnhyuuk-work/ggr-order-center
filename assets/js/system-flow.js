import {
  isElement,
  clonePreviewAddTargetSnapshot,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
  normalizePresetModuleOptionMode,
  normalizePresetModuleOptionTab,
} from "./system-flow-core.js";

import {
  setPreviewAddFlowStep,
  setPreviewAddFlowTarget,
  getPreviewAddCloseTransition,
  buildPreviewAddClosePlan,
  buildPreviewAddCloseUiDispatchPlan,
  buildPreviewAddModalOpenViewState,
  buildPreviewAddModalOpenTransition,
  buildPreviewAddTypeModalOpenViewModel,
  buildPreviewAddTypeModalOpenUiExecutionPlan,
  buildPreviewAddFlowTargetForOpen,
  buildPreviewAddTypeModalStepViewState,
  buildPreviewAddTypeSelectTransition,
  buildRootCornerStartTargetVariant,
  hasSelectedRootCornerStartDirection,
  applyRootCornerStartDirectionToPreviewAddFlow,
  buildPreviewAddRootCornerDirectionBlockedMessages,
  buildPreviewAddRootCornerDirectionApplyResult,
  getPreviewAddTypeStepInitialFocusKey,
  buildPreviewAddTypeBackUiExecutionPlan,
  getPreviewAddRootCornerStepInitialFocusKey,
} from "./system-flow/preview-add-base.js";

import {
  getPreviewModuleActionInitialFocusKey,
  buildPreviewModuleActionOpenTransition,
  buildPreviewModuleActionButtonResetState,
  buildPreviewModuleActionModalOpenViewModel,
  buildPreviewModuleActionModalOpenUiExecutionPlan,
  buildPreviewModuleActionModalOpenUiDispatchPlan,
  buildPreviewModuleActionRemoveTransition,
  setPreviewModuleActionFlowTarget,
  getPreviewModuleActionCloseTransition,
  buildPreviewModuleActionClosePlan,
  buildPreviewModuleActionCloseUiDispatchPlan,
  getClosedModalIdFromEvent,
  buildPendingDirectComposeCleanupPlan,
  buildPendingDirectComposeCleanupRuntimePlan,
  getPresetModuleOptionCloseTransition,
  buildPresetModuleOptionClosePlan,
  buildPresetModuleOptionCloseUiDispatchPlan,
  buildPreviewModuleActionModalViewState,
} from "./system-flow/module-action.js";

import {
  setPreviewPresetPickerOpenState,
  buildPreviewPresetPickerModalOpenTransition,
  buildPreviewPresetPickerOpenViewModel,
  resolvePreviewPresetPickerTargetEdgeForOpenContext,
  buildPreviewPresetPickerOpenUiExecutionPlan,
  buildPreviewPresetPickerOpenUiDispatchPlan,
  buildPreviewPresetPickerVisibleSelectionState,
  buildPreviewPresetPickerVisibleSelectionPatch,
  buildPreviewPresetPickerCardSelectionTransition,
  buildPreviewPresetPickerCardClickUiExecutionPlan,
  buildPreviewPresetPickerDefaultOpenState,
  resolvePreviewPresetDefaultFilterKeyForTargetEdge,
  buildPreviewPresetTargetEdgeComparableSnapshot,
  buildPreviewPresetComparableSnapshotForItem,
  resolvePreviewPresetMatchedIdForTargetEdge,
  clonePresetModuleOptionBackContext,
  hasPresetModuleOptionBackContext,
  buildPreviewPresetPickerApplyContextFromPresetModalState,
  buildPreviewPresetPickerOpenFromPresetModuleOption,
  buildPresetModuleOptionPresetSaveTransition,
  getPreviewPresetPickerCloseTransition,
  buildPreviewPresetPickerClosePlan,
  buildPreviewPresetPickerCloseUiDispatchPlan,
  findMatchingPreviewPresetIdForTargetEdge,
} from "./system-flow/preset-picker-open-close.js";

import {
  buildPreviewModuleActionBackContext,
  buildPresetModuleOptionOpenFromPreviewAddFlow,
  buildPreviewAddPresetModuleOptionOpenPlan,
  buildPresetModuleOptionOpenFromPreviewAddUiDispatchPlan,
  buildPresetModuleOptionOpenFromPreviewAddExceptionUiDispatchPlan,
  buildPreviewAddOpenArgsFromBackContext,
  buildPresetModuleOptionBackNavigation,
  buildPresetModuleOptionBackUiDispatchPlan,
  buildPresetModuleOptionOpenFromModuleActionTarget,
  buildPresetModuleOptionOpenFromPreviewModuleActionFlow,
  buildPresetModuleOptionOpenFromPreviewModuleActionUiDispatchPlan,
  buildPresetModuleOptionOpenFromDirectComposeEdge,
  buildPresetModuleOptionDraftForOpen,
  buildPresetModuleOptionModalStateForOpen,
  buildPresetModuleOptionOpenTransition,
  buildPresetModuleOptionOpenUiDispatchPlan,
  buildPresetModuleOptionCustomComposeSessionBootstrap,
  buildPresetModuleOptionCustomComposeBootstrapUiExecutionPlan,
  buildPendingCornerComposeEdge,
  buildPendingCornerComposeEdgeCreatePlan,
  buildPreviewPresetCornerEdge,
  buildPresetModuleOptionCustomCornerComposeValidation,
  buildDirectComposePendingActivationState,
  buildDirectComposePendingCreationResult,
  buildDirectComposePendingCreationUiExecutionPlan,
  buildPendingBayComposeAddOptions,
  buildPreviewAddSourceResolutionResult,
  buildPreviewAddNormalCommitUiExecutionPlan,
  buildPreviewAddCornerCommitUiExecutionPlan,
  buildPreviewPresetNormalAddUiExecutionPlan,
  buildPreviewPresetCornerAddUiExecutionPlan,
} from "./system-flow/preset-module-option-open-compose.js";

import {
  buildPresetModuleOptionCustomComposeSourceUiExecutionPlan,
  buildPresetModuleOptionCustomCornerCreationUiExecutionPlan,
  buildPresetModuleOptionCustomComposeCreationUiExecutionPlan,
  buildPresetModuleOptionDraftAfterFilterChange,
  buildPresetModuleOptionDraftAfterTabChange,
  buildPresetModuleOptionDraftForReopenAfterPresetPicker,
  buildPresetModuleOptionDraftAfterPresetPickerSelection,
  buildPreviewPresetPickerSelectionTransition,
  buildPreviewPresetPickerUiApplyPlan,
  buildPreviewPresetPickerApplyRuntimeUiDispatchPlan,
  buildPreviewPresetApplyDispatchPlan,
  buildPreviewPresetApplyRuntimeUiDispatchPlan,
  normalizePresetModuleOptionDraftForSync,
  buildPresetModuleOptionTextViewState,
  buildPresetModuleOptionBackButtonViewState,
  buildPresetModuleOptionSaveButtonViewState,
  buildPresetModuleOptionSaveButtonStateForSync,
  buildPresetModuleOptionSyncPreViewModel,
  buildPresetModuleOptionSyncPostViewModel,
  buildPresetModuleOptionSyncDomUiViewModel,
  buildPresetModuleOptionCustomSyncResolvedViewModel,
  buildPresetModuleOptionCustomPanelsViewState,
  buildPresetModuleOptionCustomSyncPlan,
  buildPresetModuleOptionCustomSyncExecutionPlan,
  buildPresetModuleOptionCustomSyncPreUiDispatchPlan,
  buildPresetModuleOptionCustomSyncPostUiDispatchPlan,
  buildPresetModuleOptionCustomSyncActiveTargetsPatch,
  buildPresetModuleOptionCustomSyncRunPlan,
  buildPresetModuleOptionCustomPostSyncPlan,
  buildPresetModuleOptionSaveDispatchPlan,
  buildPresetModuleOptionSaveExecutionPlan,
  buildPresetModuleOptionPresetSaveRuntimePlan,
  buildPresetModuleOptionPresetSaveUiExecutionPlan,
  buildPresetModuleOptionSaveUiDispatchPlan,
  buildPresetModuleOptionSaveRuntimeUiDispatchPlan,
  isPresetModuleOptionCustomTabActive,
} from "./system-flow/preset-module-option-sync-save.js";

export {
  clonePreviewAddTargetSnapshot,
  normalizePreviewModuleType,
  normalizePreviewEdgeType,
  normalizePresetModuleOptionMode,
  normalizePresetModuleOptionTab,
} from "./system-flow-core.js";

export {
  setPreviewAddFlowStep,
  setPreviewAddFlowTarget,
  getPreviewAddCloseTransition,
  buildPreviewAddClosePlan,
  buildPreviewAddCloseUiDispatchPlan,
  buildPreviewAddModalOpenViewState,
  buildPreviewAddModalOpenTransition,
  buildPreviewAddTypeModalOpenViewModel,
  buildPreviewAddTypeModalOpenUiExecutionPlan,
  buildPreviewAddFlowTargetForOpen,
  buildPreviewAddTypeModalStepViewState,
  buildPreviewAddTypeSelectTransition,
  buildRootCornerStartTargetVariant,
  hasSelectedRootCornerStartDirection,
  applyRootCornerStartDirectionToPreviewAddFlow,
  buildPreviewAddRootCornerDirectionBlockedMessages,
  buildPreviewAddRootCornerDirectionApplyResult,
  getPreviewAddTypeStepInitialFocusKey,
  buildPreviewAddTypeBackUiExecutionPlan,
  getPreviewAddRootCornerStepInitialFocusKey,
} from "./system-flow/preview-add-base.js";

export {
  getPreviewModuleActionInitialFocusKey,
  buildPreviewModuleActionOpenTransition,
  buildPreviewModuleActionButtonResetState,
  buildPreviewModuleActionModalOpenViewModel,
  buildPreviewModuleActionModalOpenUiExecutionPlan,
  buildPreviewModuleActionModalOpenUiDispatchPlan,
  buildPreviewModuleActionRemoveTransition,
  setPreviewModuleActionFlowTarget,
  getPreviewModuleActionCloseTransition,
  buildPreviewModuleActionClosePlan,
  buildPreviewModuleActionCloseUiDispatchPlan,
  getClosedModalIdFromEvent,
  buildPendingDirectComposeCleanupPlan,
  buildPendingDirectComposeCleanupRuntimePlan,
  getPresetModuleOptionCloseTransition,
  buildPresetModuleOptionClosePlan,
  buildPresetModuleOptionCloseUiDispatchPlan,
  buildPreviewModuleActionModalViewState,
} from "./system-flow/module-action.js";

export {
  setPreviewPresetPickerOpenState,
  buildPreviewPresetPickerModalOpenTransition,
  buildPreviewPresetPickerOpenViewModel,
  resolvePreviewPresetPickerTargetEdgeForOpenContext,
  buildPreviewPresetPickerOpenUiExecutionPlan,
  buildPreviewPresetPickerOpenUiDispatchPlan,
  buildPreviewPresetPickerVisibleSelectionState,
  buildPreviewPresetPickerVisibleSelectionPatch,
  buildPreviewPresetPickerCardSelectionTransition,
  buildPreviewPresetPickerCardClickUiExecutionPlan,
  buildPreviewPresetPickerDefaultOpenState,
  resolvePreviewPresetDefaultFilterKeyForTargetEdge,
  buildPreviewPresetTargetEdgeComparableSnapshot,
  buildPreviewPresetComparableSnapshotForItem,
  resolvePreviewPresetMatchedIdForTargetEdge,
  clonePresetModuleOptionBackContext,
  hasPresetModuleOptionBackContext,
  buildPreviewPresetPickerApplyContextFromPresetModalState,
  buildPreviewPresetPickerOpenFromPresetModuleOption,
  buildPresetModuleOptionPresetSaveTransition,
  getPreviewPresetPickerCloseTransition,
  buildPreviewPresetPickerClosePlan,
  buildPreviewPresetPickerCloseUiDispatchPlan,
  findMatchingPreviewPresetIdForTargetEdge,
} from "./system-flow/preset-picker-open-close.js";

export {
  buildPreviewModuleActionBackContext,
  buildPresetModuleOptionOpenFromPreviewAddFlow,
  buildPreviewAddPresetModuleOptionOpenPlan,
  buildPresetModuleOptionOpenFromPreviewAddUiDispatchPlan,
  buildPresetModuleOptionOpenFromPreviewAddExceptionUiDispatchPlan,
  buildPreviewAddOpenArgsFromBackContext,
  buildPresetModuleOptionBackNavigation,
  buildPresetModuleOptionBackUiDispatchPlan,
  buildPresetModuleOptionOpenFromModuleActionTarget,
  buildPresetModuleOptionOpenFromPreviewModuleActionFlow,
  buildPresetModuleOptionOpenFromPreviewModuleActionUiDispatchPlan,
  buildPresetModuleOptionOpenFromDirectComposeEdge,
  buildPresetModuleOptionDraftForOpen,
  buildPresetModuleOptionModalStateForOpen,
  buildPresetModuleOptionOpenTransition,
  buildPresetModuleOptionOpenUiDispatchPlan,
  buildPresetModuleOptionCustomComposeSessionBootstrap,
  buildPresetModuleOptionCustomComposeBootstrapUiExecutionPlan,
  buildPendingCornerComposeEdge,
  buildPendingCornerComposeEdgeCreatePlan,
  buildPreviewPresetCornerEdge,
  buildPresetModuleOptionCustomCornerComposeValidation,
  buildDirectComposePendingActivationState,
  buildDirectComposePendingCreationResult,
  buildDirectComposePendingCreationUiExecutionPlan,
  buildPendingBayComposeAddOptions,
  buildPreviewAddSourceResolutionResult,
  buildPreviewAddNormalCommitUiExecutionPlan,
  buildPreviewAddCornerCommitUiExecutionPlan,
  buildPreviewPresetNormalAddUiExecutionPlan,
  buildPreviewPresetCornerAddUiExecutionPlan,
} from "./system-flow/preset-module-option-open-compose.js";

export {
  buildPresetModuleOptionCustomComposeSourceUiExecutionPlan,
  buildPresetModuleOptionCustomCornerCreationUiExecutionPlan,
  buildPresetModuleOptionCustomComposeCreationUiExecutionPlan,
  buildPresetModuleOptionDraftAfterFilterChange,
  buildPresetModuleOptionDraftAfterTabChange,
  buildPresetModuleOptionDraftForReopenAfterPresetPicker,
  buildPresetModuleOptionDraftAfterPresetPickerSelection,
  buildPreviewPresetPickerSelectionTransition,
  buildPreviewPresetPickerUiApplyPlan,
  buildPreviewPresetPickerApplyRuntimeUiDispatchPlan,
  buildPreviewPresetApplyDispatchPlan,
  buildPreviewPresetApplyRuntimeUiDispatchPlan,
  normalizePresetModuleOptionDraftForSync,
  buildPresetModuleOptionTextViewState,
  buildPresetModuleOptionBackButtonViewState,
  buildPresetModuleOptionSaveButtonViewState,
  buildPresetModuleOptionSaveButtonStateForSync,
  buildPresetModuleOptionSyncPreViewModel,
  buildPresetModuleOptionSyncPostViewModel,
  buildPresetModuleOptionSyncDomUiViewModel,
  buildPresetModuleOptionCustomSyncResolvedViewModel,
  buildPresetModuleOptionCustomPanelsViewState,
  buildPresetModuleOptionCustomSyncPlan,
  buildPresetModuleOptionCustomSyncExecutionPlan,
  buildPresetModuleOptionCustomSyncPreUiDispatchPlan,
  buildPresetModuleOptionCustomSyncPostUiDispatchPlan,
  buildPresetModuleOptionCustomSyncActiveTargetsPatch,
  buildPresetModuleOptionCustomSyncRunPlan,
  buildPresetModuleOptionCustomPostSyncPlan,
  buildPresetModuleOptionSaveDispatchPlan,
  buildPresetModuleOptionSaveExecutionPlan,
  buildPresetModuleOptionPresetSaveRuntimePlan,
  buildPresetModuleOptionPresetSaveUiExecutionPlan,
  buildPresetModuleOptionSaveUiDispatchPlan,
  buildPresetModuleOptionSaveRuntimeUiDispatchPlan,
  isPresetModuleOptionCustomTabActive,
} from "./system-flow/preset-module-option-sync-save.js";

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
