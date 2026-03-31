export function createSystemPreviewAddActionHelpers(deps = {}) {
  const {
    previewAddFlowState,
    getShapeCornerLimitState,
    buildPreviewAddTypeModalOpenViewModel,
    getCornerAttachSideBlockedMessage,
    getSelectedShape,
    getCornerLimitBlockedMessage,
    buildPreviewAddTypeModalOpenUiExecutionPlan,
    setPreviewAddFlowTarget,
    applyPreviewAddTypeModalOpenUiView,
    setPreviewAddTypeModalStep,
    openModal,
    focusPreviewAddTypeModalInitialTarget,
    buildPreviewAddSourceResolutionResult,
    resolveActivePreviewAddSourceTarget,
    setPreviewAddTypeErrorMessage,
    addShelfFromEndpoint,
    buildPendingBayComposeAddOptions,
    buildPreviewAddNormalCommitUiExecutionPlan,
    closePreviewAddTypePicker,
    openBayOptionModal,
    buildPreviewAddCornerCommitUiExecutionPlan,
    openCornerOptionModal,
    buildPresetModuleOptionCustomCornerComposeValidation,
    isRootPreviewEndpointTarget,
    hasSelectedRootCornerStartDirection,
    getRootCornerDirectionRequiredMessage,
    canAddCornerAtTarget,
    buildPlacementFromEndpoint,
    buildPendingCornerComposeEdgeCreatePlan,
    normalizeDirection,
    directionToSideIndex,
    buildPendingCornerComposeEdge,
    registerEdge,
  } = deps;

  const openPreviewAddTypeModal = (
    sideIndex,
    cornerId = "",
    prepend = false,
    attachSideIndex = sideIndex,
    attachAtStart = prepend,
    endpointId = "",
    allowedTypes = ["normal"],
    anchorEl = null
  ) => {
    const cornerLimitState = getShapeCornerLimitState();
    const openViewModel = buildPreviewAddTypeModalOpenViewModel({
      sideIndex,
      attachSideIndex,
      cornerId,
      prepend,
      attachAtStart,
      endpointId,
      allowedTypes,
      cornerLimitState,
      getCornerDirectionBlockedMessage: ({ sideIndex, attachSideIndex }) =>
        getCornerAttachSideBlockedMessage({ sideIndex, attachSideIndex }, getSelectedShape()),
      getCornerLimitBlockedMessage,
    });
    const openUiPlan = buildPreviewAddTypeModalOpenUiExecutionPlan({
      openViewModel,
      anchorEl,
    });
    if (openUiPlan.route !== "open" || !openUiPlan.flowTargetPatch || !openUiPlan.openViewState) return;
    const { openViewState } = openUiPlan;
    setPreviewAddFlowTarget(
      previewAddFlowState,
      openUiPlan.flowTargetPatch.target,
      openUiPlan.flowTargetPatch.anchorEl
    );
    const { modal, modalCornerBtn, modalNormalBtn, modalTitleEl } =
      applyPreviewAddTypeModalOpenUiView(openUiPlan);
    if (modal) {
      setPreviewAddTypeModalStep("type", "");
      openModal(modal, { focusTarget: "#previewAddTypeModalTitle", bodySelector: null });
      requestAnimationFrame(() => {
        focusPreviewAddTypeModalInitialTarget(openUiPlan, {
          modalNormalBtn,
          modalCornerBtn,
          modalTitleEl,
        });
      });
      return;
    }
  };

  const commitPreviewAddNormal = () => {
    const sourceResolution = buildPreviewAddSourceResolutionResult({
      source: resolveActivePreviewAddSourceTarget(previewAddFlowState.target),
      errorMessage: "이 끝점에서는 일반 모듈을 추가할 수 없습니다.",
    });
    const source = sourceResolution.source;
    const shelfId = sourceResolution.ok
      ? addShelfFromEndpoint(source, previewAddFlowState.target, buildPendingBayComposeAddOptions())
      : "";
    const normalCommitUiPlan = buildPreviewAddNormalCommitUiExecutionPlan({
      sourceResolution,
      shelfId,
    });
    if (normalCommitUiPlan.route !== "open-bay-option") {
      setPreviewAddTypeErrorMessage(normalCommitUiPlan.errorMessage, { isError: true });
      return;
    }
    closePreviewAddTypePicker();
    if (normalCommitUiPlan.shelfId) openBayOptionModal(normalCommitUiPlan.shelfId);
  };

  const commitPreviewAddCorner = () => {
    const cornerId = previewAddFlowState.target?.cornerId || "";
    if (cornerId) {
      const existingCornerUiPlan = buildPreviewAddCornerCommitUiExecutionPlan({
        existingCornerId: cornerId,
        sourceResolution: null,
        cornerComposeValidation: null,
        edgeCreatePlan: null,
        fallbackErrorMessage: "코너 모듈을 찾을 수 없습니다.",
      });
      if (existingCornerUiPlan.route !== "open-existing-corner") {
        setPreviewAddTypeErrorMessage(existingCornerUiPlan.errorMessage, { isError: true });
        return;
      }
      closePreviewAddTypePicker();
      openCornerOptionModal(existingCornerUiPlan.cornerId);
      return;
    }
    const sourceResolution = buildPreviewAddSourceResolutionResult({
      source: resolveActivePreviewAddSourceTarget(previewAddFlowState.target),
      errorMessage: "이 끝점에는 코너 모듈을 추가할 수 없습니다.",
    });
    const source = sourceResolution.source;
    const cornerLimitState = getShapeCornerLimitState();
    const cornerComposeValidation = buildPresetModuleOptionCustomCornerComposeValidation({
      isRootSource: Boolean(source && isRootPreviewEndpointTarget(source)),
      hasRootCornerStartDirection: hasSelectedRootCornerStartDirection(previewAddFlowState.target),
      rootCornerDirectionRequiredMessage: getRootCornerDirectionRequiredMessage(),
      canAddCornerByLimit: Boolean(cornerLimitState?.canAdd),
      cornerLimitBlockedMessage: getCornerLimitBlockedMessage(cornerLimitState),
      canAddCornerAtTarget: Boolean(source && canAddCornerAtTarget(source, getSelectedShape())),
      cornerAttachSideBlockedMessage: source
        ? getCornerAttachSideBlockedMessage(source, getSelectedShape())
        : sourceResolution.errorMessage,
    });
    let edgeCreatePlan = null;
    if (source) {
      const placement = buildPlacementFromEndpoint(source);
      edgeCreatePlan = buildPendingCornerComposeEdgeCreatePlan({
        source,
        placement,
        normalizeDirection,
        directionToSideIndex,
        createdAt: Date.now(),
      });
    }
    const cornerCommitUiPlan = buildPreviewAddCornerCommitUiExecutionPlan({
      existingCornerId: "",
      sourceResolution,
      cornerComposeValidation,
      edgeCreatePlan,
      fallbackErrorMessage: sourceResolution.errorMessage,
    });
    if (cornerCommitUiPlan.route !== "create-corner") {
      setPreviewAddTypeErrorMessage(cornerCommitUiPlan.errorMessage, { isError: true });
      return;
    }
    const edge = buildPendingCornerComposeEdge(cornerCommitUiPlan.edgeCreatePlan);
    registerEdge(edge);
    closePreviewAddTypePicker();
    openCornerOptionModal(edge.id);
  };

  return {
    openPreviewAddTypeModal,
    commitPreviewAddNormal,
    commitPreviewAddCorner,
  };
}
