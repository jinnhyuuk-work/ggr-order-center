export function createSystemPresetRuntimeDispatchHelpers(deps = {}) {
  const {
    escapeHtml,
    presetModuleOptionFlowState,
    previewAddFlowState,
    previewPresetPickerFlowState,
    previewModuleActionFlowState,
    resolveActiveBayOptionId,
    resolveActiveCornerOptionId,
    assignActiveBayOptionId,
    assignActiveCornerOptionId,
    assignPreviewPresetModuleCategoryFilterKey,
    getPresetModuleOptionFilterOptions,
    getPresetModuleOptionSelectedPreset,
    getModuleOptionAverageHeightMm,
    buildPresetAddonBreakdownFromPreset,
    getModuleFrontPreviewMaterialColors,
    buildModuleFrontPreviewHtml,
    buildPresetModuleOptionCustomComposeSessionBootstrap,
    buildPresetModuleOptionCustomComposeBootstrapUiExecutionPlan,
    buildPreviewAddSourceResolutionResult,
    resolveActivePreviewAddSourceTarget,
    buildPresetModuleOptionCustomComposeSourceUiExecutionPlan,
    getShapeCornerLimitState,
    buildPresetModuleOptionCustomCornerComposeValidation,
    isRootPreviewEndpointTarget,
    hasSelectedRootCornerStartDirection,
    getRootCornerDirectionRequiredMessage,
    getCornerLimitBlockedMessage,
    canAddCornerAtTarget,
    getSelectedShape,
    getCornerAttachSideBlockedMessage,
    buildPlacementFromEndpoint,
    buildPendingCornerComposeEdgeCreatePlan,
    normalizeDirection,
    directionToSideIndex,
    buildPresetModuleOptionCustomCornerCreationUiExecutionPlan,
    buildPendingCornerComposeEdge,
    registerEdge,
    buildPresetModuleOptionCustomComposeCreationUiExecutionPlan,
    applyDirectComposePendingActivationStateToRuntime,
    addShelfFromEndpoint,
    buildPendingBayComposeAddOptions,
    clonePreviewAddTargetSnapshot,
    buildPresetModuleOptionSyncPreViewModel,
    getDefaultPresetModuleOptionFilterKey,
    isPreviewPresetAvailableForFilter,
    buildPresetModuleOptionCustomSyncPreUiDispatchPlan,
    buildPresetModuleOptionCustomSyncPostUiDispatchPlan,
    buildPresetModuleOptionCustomSyncResolvedViewModel,
    buildPresetModuleOptionSyncDomUiViewModel,
    getBayOptionApplyValidationState,
    getCornerOptionApplyValidationState,
    findShelfById,
    isPendingEdge,
    normalizePresetModuleOptionMode,
    renderPresetModuleOptionSelectionSummary,
    syncCornerOptionModal,
    syncBayOptionModal,
    setPresetModuleOptionError,
    setPreviewAddFlowTarget,
    closePresetModuleOptionModal,
    setPreviewPresetPickerOpenState,
    applyPreviewPresetByContext,
    patchPresetModuleOptionFlowState,
    openModal,
    $,
    setPreviewAddTypeModalStep,
    setPreviewAddTypeErrorMessage,
    clearPreviewAddFlowTarget,
    setPreviewPresetModuleError,
    resetPreviewPresetPickerFlowState,
    reopenPresetModuleOptionModalAfterPresetPicker,
    resetPresetModuleOptionFlowState,
    setPreviewModuleActionModalError,
    resetPreviewModuleActionFlowState,
    patchPreviewPresetPickerFlowState,
    renderPreviewPresetModuleModalUI,
  } = deps;

  const getActiveBayOptionId = () => String(resolveActiveBayOptionId?.() || "");
  const getActiveCornerOptionId = () => String(resolveActiveCornerOptionId?.() || "");
  const setActiveBayOptionId = (nextValue = "") => {
    if (typeof assignActiveBayOptionId === "function") assignActiveBayOptionId(String(nextValue || ""));
  };
  const setActiveCornerOptionId = (nextValue = "") => {
    if (typeof assignActiveCornerOptionId === "function") assignActiveCornerOptionId(String(nextValue || ""));
  };

  const applyPresetModuleOptionSyncDomUiViewModel = ({
    domUiViewModel,
    filterOptions,
    elements,
  } = {}) => {
    const viewModel = domUiViewModel && typeof domUiViewModel === "object" ? domUiViewModel : null;
    if (!viewModel) return;
    const {
      titleEl,
      pickerBtn,
      filterLabelEl,
      filterNoteEl,
      filterSelectEl,
      backBtn,
      presetTabBtn,
      customTabBtn,
      presetPanelEl,
      customPanelEl,
      customBayPanelEl,
      customCornerPanelEl,
      unifiedPreviewEl,
      saveBtn,
    } = elements || {};

    if (titleEl) titleEl.textContent = viewModel.title;
    if (presetTabBtn) {
      presetTabBtn.classList.toggle("active", viewModel.tab.presetActive);
      presetTabBtn.setAttribute("aria-selected", viewModel.tab.presetActive ? "true" : "false");
    }
    if (customTabBtn) {
      customTabBtn.classList.toggle("active", viewModel.tab.customActive);
      customTabBtn.setAttribute("aria-selected", viewModel.tab.customActive ? "true" : "false");
    }
    if (presetPanelEl) presetPanelEl.classList.toggle("hidden", !viewModel.panel.showPresetPanel);
    if (customPanelEl) customPanelEl.classList.toggle("hidden", !viewModel.panel.showCustomPanel);
    if (unifiedPreviewEl) {
      unifiedPreviewEl.classList.toggle("hidden", !viewModel.panel.showUnifiedPreview);
    }
    if (customBayPanelEl) {
      customBayPanelEl.classList.toggle("hidden", !viewModel.panel.showCustomBayPanel);
    }
    if (customCornerPanelEl) {
      customCornerPanelEl.classList.toggle("hidden", !viewModel.panel.showCustomCornerPanel);
    }
    if (filterLabelEl) filterLabelEl.textContent = viewModel.filterLabel;
    if (filterNoteEl) filterNoteEl.textContent = viewModel.filterNote;
    if (filterSelectEl) {
      filterSelectEl.innerHTML = (Array.isArray(filterOptions) ? filterOptions : [])
        .map((option) => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`)
        .join("");
      filterSelectEl.value = viewModel.filterSelectValue;
    }
    if (pickerBtn) pickerBtn.textContent = viewModel.pickerButtonText;
    if (backBtn) {
      const backBtnState = viewModel.backBtnState;
      backBtn.classList.toggle("hidden", backBtnState.hidden);
      backBtn.disabled = backBtnState.disabled;
      backBtn.classList.toggle("btn-disabled", backBtnState.disabledClass);
    }
    if (saveBtn) {
      const saveBtnState = viewModel.saveBtnState;
      saveBtn.disabled = saveBtnState.disabled;
      saveBtn.classList.toggle("btn-disabled", saveBtnState.disabledClass);
      saveBtn.classList.toggle("hidden", saveBtnState.hidden);
      if (saveBtnState.title) saveBtn.title = saveBtnState.title;
      else saveBtn.removeAttribute("title");
    }
  };

  const applyPresetModuleOptionCustomSyncPreRuntimePlan = (customSyncPreUiPlan) => {
    if (!customSyncPreUiPlan?.enabled) return;
    const customSyncActivePatch = customSyncPreUiPlan.activeTargetsPatch;
    if (customSyncActivePatch?.hasBayPatch) {
      setActiveBayOptionId(customSyncActivePatch.nextActiveBayOptionId);
    }
    if (customSyncActivePatch?.hasCornerPatch) {
      setActiveCornerOptionId(customSyncActivePatch.nextActiveCornerOptionId);
    }
    if (customSyncPreUiPlan.shouldEnsureSession) {
      ensurePresetModuleOptionCustomComposeSession();
    }
  };

  const applyPresetModuleOptionCustomSyncPostRuntimePlan = (customSyncExecutionPlan) => {
    if (!customSyncExecutionPlan) return;
    if (customSyncExecutionPlan.shouldSyncCorner) syncCornerOptionModal();
    if (customSyncExecutionPlan.shouldSyncBay) syncBayOptionModal();
  };

  const applyPresetModuleOptionPresetSaveRuntimePlan = (runtimeUiPlan) => {
    if (!runtimeUiPlan || runtimeUiPlan.route !== "preset") return;
    const preset = runtimeUiPlan.preset;
    setPresetModuleOptionError("");

    if (runtimeUiPlan.shouldPatchPreviewAddTarget) {
      setPreviewAddFlowTarget(
        previewAddFlowState,
        runtimeUiPlan.previewAddTargetPatchTarget,
        runtimeUiPlan.previewAddTargetPatchAnchorEl
      );
    }

    closePresetModuleOptionModal({ returnFocus: false, clearState: true });
    setPreviewPresetPickerOpenState(
      previewPresetPickerFlowState,
      runtimeUiPlan.pickerOpenModuleType,
      runtimeUiPlan.pickerOpenOptions
    );
    applyPreviewPresetByContext(
      preset,
      runtimeUiPlan.presetApplyContext,
      runtimeUiPlan.presetApplyType,
      runtimeUiPlan.presetApplyFilterKey
    );
  };

  const syncPresetModuleOptionModal = () => {
    const modalState = presetModuleOptionFlowState.modalState;
    if (!modalState) return;
    const titleEl = $("#presetModuleOptionModalTitle");
    const pickerBtn = $("#openPresetModulePickerBtn");
    const filterLabelEl = $("#presetModuleOptionFilterLabel");
    const filterNoteEl = $("#presetModuleOptionFilterNote");
    const filterSelectEl = $("#presetModuleOptionFilterSelect");
    const backBtn = $("#backPresetModuleOptionModal");
    const presetTabBtn = $("#presetModuleOptionPresetTabBtn");
    const customTabBtn = $("#presetModuleOptionCustomTabBtn");
    const presetPanelEl = $("#presetModuleOptionPresetTabPanel");
    const customPanelEl = $("#presetModuleOptionCustomTabPanel");
    const customBayPanelEl = $("#presetModuleOptionCustomBayPanel");
    const customCornerPanelEl = $("#presetModuleOptionCustomCornerPanel");
    const unifiedPreviewEl = $("#presetModuleOptionFrontPreview");
    const removeBtn = $("#removePresetModuleOptionModal");
    const moduleLabel = modalState.moduleType === "corner" ? "코너 모듈" : "일반 모듈";
    const filterOptions = getPresetModuleOptionFilterOptions(modalState.moduleType);
    const selectedPreset = getPresetModuleOptionSelectedPreset();
    let activeBayOptionId = getActiveBayOptionId();
    let activeCornerOptionId = getActiveCornerOptionId();
    const syncPreViewModel = buildPresetModuleOptionSyncPreViewModel({
      modalState,
      currentDraft: presetModuleOptionFlowState.draft,
      filterOptions,
      selectedPreset,
      getDefaultFilterKey: getDefaultPresetModuleOptionFilterKey,
      isPresetAvailableForFilter: isPreviewPresetAvailableForFilter,
      moduleLabel,
      activeBayOptionId,
      activeCornerOptionId,
    });
    if (!syncPreViewModel) return;
    const {
      normalizedDraft,
      activeTab,
      textViewState,
      customSyncRunPlan,
    } = syncPreViewModel;
    patchPresetModuleOptionFlowState(presetModuleOptionFlowState, { draft: normalizedDraft });
    const customPanelsViewState = customSyncRunPlan.customPanelsViewState;
    const customSyncPreUiPlan = buildPresetModuleOptionCustomSyncPreUiDispatchPlan(customSyncRunPlan);
    const customSyncPlan = customSyncPreUiPlan.customSyncPlan;
    if (customSyncPreUiPlan.enabled) {
      applyPresetModuleOptionCustomSyncPreRuntimePlan(customSyncPreUiPlan);
      activeBayOptionId = getActiveBayOptionId();
      activeCornerOptionId = getActiveCornerOptionId();
      const customSyncExecutionPlan = buildPresetModuleOptionCustomSyncPostUiDispatchPlan({
        customSyncPlan,
        activeBayOptionId,
        activeCornerOptionId,
      });
      applyPresetModuleOptionCustomSyncPostRuntimePlan(customSyncExecutionPlan);
    }
    activeBayOptionId = getActiveBayOptionId();
    activeCornerOptionId = getActiveCornerOptionId();
    const customResolvedViewModel = buildPresetModuleOptionCustomSyncResolvedViewModel({
      modalState,
      activeTab,
      activeBayOptionId,
      activeCornerOptionId,
      customSyncPlan,
      hasPreset: Boolean(getPresetModuleOptionSelectedPreset()),
      bayValidation: activeTab === "custom" ? getBayOptionApplyValidationState() : null,
      cornerValidation: activeTab === "custom" ? getCornerOptionApplyValidationState() : null,
    });
    const customPostSyncPlan = customResolvedViewModel.customPostSyncPlan;
    const refreshedCustomPanelsViewState = customPostSyncPlan.customPanelsViewState;
    const syncPostViewModel = customResolvedViewModel.syncPostViewModel;
    const domUiViewModel = buildPresetModuleOptionSyncDomUiViewModel({
      activeTab,
      textViewState,
      customPanelsViewState: refreshedCustomPanelsViewState,
      syncPostViewModel,
      currentDraft: presetModuleOptionFlowState.draft,
    });
    const saveBtn = $("#savePresetModuleOptionModal");
    applyPresetModuleOptionSyncDomUiViewModel({
      domUiViewModel,
      filterOptions,
      elements: {
        titleEl,
        pickerBtn,
        filterLabelEl,
        filterNoteEl,
        filterSelectEl,
        backBtn,
        presetTabBtn,
        customTabBtn,
        presetPanelEl,
        customPanelEl,
        customBayPanelEl,
        customCornerPanelEl,
        unifiedPreviewEl,
        saveBtn,
      },
    });
    if (removeBtn) {
      const modalEdgeId = String(modalState?.edgeId || "");
      const modalEdge = modalEdgeId ? findShelfById(modalEdgeId) : null;
      const isPendingComposeTarget = Boolean(modalEdge && isPendingEdge(modalEdge));
      const isAddMode = normalizePresetModuleOptionMode(modalState?.mode) === "add";
      removeBtn.classList.toggle("hidden", false);
      removeBtn.disabled = false;
      removeBtn.classList.toggle("btn-disabled", false);
      removeBtn.setAttribute("aria-disabled", "false");
      removeBtn.textContent = isAddMode || isPendingComposeTarget ? "추가 취소" : "모듈 삭제";
    }
    renderPresetModuleOptionSelectionSummary();
    renderPresetModuleOptionFrontPreview();
    setPresetModuleOptionError("");
  };

  const applyPresetModuleOptionOpenUiDispatchPlanToRuntime = (openUiPlan, debugMeta = {}) => {
    if (!openUiPlan?.openTransition) {
      throw new Error("통합 모듈구성 모달 전환 상태를 만들지 못했습니다.");
    }
    const openTransition = openUiPlan.openTransition;
    patchPresetModuleOptionFlowState(presetModuleOptionFlowState, openUiPlan.flowStatePatch);
    if (openUiPlan.shouldResetActiveComposeTargets) {
      setActiveBayOptionId("");
      setActiveCornerOptionId("");
    }
    try {
      syncPresetModuleOptionModal();
    } catch (err) {
      console.error("[system] Failed while syncing preset module option modal", {
        ...debugMeta,
        openTransition,
      }, err);
      throw err;
    }
    openModal("#presetModuleOptionModal", { focusTarget: "#presetModuleOptionModalTitle" });
    const modalEl = $("#presetModuleOptionModal");
    if (!modalEl || modalEl.classList.contains("hidden")) {
      throw new Error("통합 모듈구성 모달이 열리지 않았습니다.");
    }
  };

  const applyPreviewAddCloseUiDispatchPlanToRuntime = (closeUiPlan) => {
    if (!closeUiPlan) return;
    setPreviewAddTypeModalStep(closeUiPlan.resetStep, closeUiPlan.resetSelectedModuleType);
    if (closeUiPlan.clearErrorMessage) {
      setPreviewAddTypeErrorMessage("", { isError: false });
    }
    if (closeUiPlan.shouldRestoreFocus && closeUiPlan.focusTarget?.isConnected) {
      closeUiPlan.focusTarget.focus();
    }
    if (closeUiPlan.shouldClearFlowTarget) {
      clearPreviewAddFlowTarget(previewAddFlowState);
    }
  };

  const applyPreviewPresetPickerCloseUiDispatchPlanToRuntime = (closeUiPlan) => {
    if (!closeUiPlan) return;
    if (closeUiPlan.clearErrorMessage) setPreviewPresetModuleError("");
    if (closeUiPlan.shouldResetPreviewPresetPickerFlowState) {
      resetPreviewPresetPickerFlowState(previewPresetPickerFlowState);
    }
    if (closeUiPlan.shouldRestoreFocus && closeUiPlan.focusTarget?.isConnected) {
      closeUiPlan.focusTarget.focus();
    }
    if (closeUiPlan.shouldClearPreviewAddTarget) {
      clearPreviewAddFlowTarget(previewAddFlowState);
    }
    if (closeUiPlan.shouldReopenPresetModuleOption) {
      reopenPresetModuleOptionModalAfterPresetPicker();
    }
  };

  const applyPresetModuleOptionCloseUiDispatchPlanToRuntime = (closeUiPlan) => {
    if (!closeUiPlan) return;
    if (closeUiPlan.clearErrorMessage) setPresetModuleOptionError("");
    if (closeUiPlan.shouldRestoreFocus && closeUiPlan.focusTarget?.isConnected) {
      closeUiPlan.focusTarget.focus();
    }
    if (closeUiPlan.shouldResetActiveComposeTargets) {
      setActiveBayOptionId("");
      setActiveCornerOptionId("");
    }
    if (closeUiPlan.shouldResetFlowState) {
      resetPresetModuleOptionFlowState(presetModuleOptionFlowState);
    }
  };

  const applyPreviewModuleActionCloseUiDispatchPlanToRuntime = (closeUiPlan) => {
    if (!closeUiPlan) return;
    if (closeUiPlan.clearErrorMessage) setPreviewModuleActionModalError("", { isError: false });
    if (closeUiPlan.shouldRestoreFocus && closeUiPlan.focusTarget?.isConnected) {
      closeUiPlan.focusTarget.focus();
    }
    if (closeUiPlan.shouldResetFlowState) {
      resetPreviewModuleActionFlowState(previewModuleActionFlowState);
    }
  };

  const applyPreviewPresetPickerOpenUiDispatchPlanToRuntime = (openDispatchPlan) => {
    if (!openDispatchPlan || openDispatchPlan.route !== "open") return;
    setPreviewPresetPickerOpenState(
      previewPresetPickerFlowState,
      openDispatchPlan.openState.moduleType,
      openDispatchPlan.openState.options
    );
    patchPreviewPresetPickerFlowState(previewPresetPickerFlowState, openDispatchPlan.pickerStatePatch);
    assignPreviewPresetModuleCategoryFilterKey("all");
    const titleEl = $("#previewPresetModuleModalTitle");
    if (titleEl) {
      titleEl.textContent = openDispatchPlan.title;
    }
    if (openDispatchPlan.clearErrorMessage) setPreviewPresetModuleError("");
    if (openDispatchPlan.shouldRenderModalUi) renderPreviewPresetModuleModalUI();
    openModal("#previewPresetModuleModal", { focusTarget: "#previewPresetModuleModalTitle" });
  };

  const renderPresetModuleOptionFrontPreview = () => {
    const container = $("#presetModuleOptionFrontPreview");
    if (!container) return;
    const modalState = presetModuleOptionFlowState.modalState;
    const preset = getPresetModuleOptionSelectedPreset();
    const activeTab = presetModuleOptionFlowState.draft?.activeTab === "custom" ? "custom" : "preset";
    if (!modalState) {
      container.innerHTML = "";
      return;
    }
    if (activeTab === "custom") {
      container.innerHTML = `
        <div class="module-front-preview-card">
          <div class="module-front-preview-head">
            <div class="module-front-preview-title">모듈 미리보기</div>
          </div>
          <div class="module-front-preview-canvas" aria-hidden="true">
            <div class="module-front-preview-empty-guide">맞춤구성에서 선반/행거/가구를 직접 설정할 수 있습니다.</div>
          </div>
          <div class="module-front-preview-meta">
            <div class="module-front-preview-row">
              <span class="label">구성 방식</span>
              <span class="value">맞춤구성</span>
            </div>
          </div>
          <div class="module-front-preview-note">맞춤구성 탭에서 바로 편집할 수 있습니다.</div>
        </div>
      `;
      return;
    }
    if (!preset) {
      const widthLabel = presetModuleOptionFlowState.draft?.filterKey
        ? (modalState.moduleType === "corner"
            ? (presetModuleOptionFlowState.draft.filterKey === "600x800" ? "600 × 800" : "800 × 600")
            : `${presetModuleOptionFlowState.draft.filterKey}mm`)
        : "";
      container.innerHTML = `
        <div class="module-front-preview-card">
          <div class="module-front-preview-head">
            <div class="module-front-preview-title">모듈 미리보기</div>
          </div>
          <div class="module-front-preview-canvas" aria-hidden="true">
            <div class="module-front-preview-empty-guide">
              ${
                widthLabel
                  ? "모듈 선택 버튼을 눌러 미리 구성된 모듈을 선택하세요."
                  : "모듈 선택 버튼을 눌러 미리 구성된 모듈을 선택하세요."
              }
            </div>
          </div>
          <div class="module-front-preview-meta">
            <div class="module-front-preview-row">
              <span class="label">선택 기준</span>
              <span class="value">${widthLabel ? escapeHtml(widthLabel) : "-"}</span>
            </div>
          </div>
          <div class="module-front-preview-note">모듈 선택 후 정면 미리보기가 표시됩니다.</div>
        </div>
      `;
      return;
    }
    const moduleType = modalState.moduleType === "corner" ? "corner" : "normal";
    const averageHeightMm = getModuleOptionAverageHeightMm();
    const normalWidthFromFilter = Math.max(
      1,
      Math.round(Number(presetModuleOptionFlowState.draft?.filterKey || preset.width || 400) || 400)
    );
    const shelfWidthMm = moduleType === "corner" ? (preset.swap ? 600 : 800) : normalWidthFromFilter;
    const sizeLabel =
      moduleType === "corner"
        ? (preset.swap ? "600 × 800mm" : "800 × 600mm")
        : `폭 ${normalWidthFromFilter}mm`;
    const { componentSummary, furnitureSummary, rodCount, furnitureAddonId } =
      buildPresetAddonBreakdownFromPreset(preset);
    const previewColors = getModuleFrontPreviewMaterialColors();
    try {
      container.innerHTML = buildModuleFrontPreviewHtml({
        moduleLabel: moduleType === "corner" ? "코너 모듈" : "일반 모듈",
        sizeLabel,
        shelfCount: Number(preset.count || 1),
        rodCount,
        furnitureAddonId,
        layoutPresetId: String(preset.id || ""),
        isExtendedModule: String(preset.categoryKey || "") === "etc",
        componentSummary,
        furnitureSummary,
        type: moduleType === "corner" ? "corner" : "bay",
        averageHeightMm,
        shelfWidthMm,
        shelfColor: previewColors.shelfColor,
        postBarColor: previewColors.postBarColor,
      });
    } catch (err) {
      console.error("[system] Failed to render preset module front preview", {
        presetId: String(preset?.id || ""),
        moduleType,
      }, err);
      container.innerHTML = `
        <div class="module-front-preview-card">
          <div class="module-front-preview-head">
            <div class="module-front-preview-title">모듈 미리보기</div>
            ${sizeLabel ? `<span class="module-front-preview-chip">${escapeHtml(sizeLabel)}</span>` : ""}
          </div>
          <div class="module-front-preview-canvas" aria-hidden="true">
            <div class="module-front-preview-empty-guide">선택한 모듈 미리보기를 불러오지 못했습니다.</div>
          </div>
          <div class="module-front-preview-meta">
            <div class="module-front-preview-row">
              <span class="label">선택 모듈</span>
              <span class="value">${escapeHtml(String(preset?.label || "-"))}</span>
            </div>
          </div>
          <div class="module-front-preview-note">다시 선택하거나 맞춤구성 탭에서 직접 구성할 수 있습니다.</div>
        </div>
      `;
    }
  };

  const ensurePresetModuleOptionCustomComposeSession = () => {
    const composeSourceErrorMessage = "이 끝점에서는 모듈을 추가할 수 없습니다.";
    const modalState = presetModuleOptionFlowState.modalState;
    const sessionBootstrap = buildPresetModuleOptionCustomComposeSessionBootstrap({
      modalState,
      draft: presetModuleOptionFlowState.draft,
      activeBayOptionId: getActiveBayOptionId(),
      activeCornerOptionId: getActiveCornerOptionId(),
      previewAddTarget: previewAddFlowState.target,
      cloneTargetSnapshot: clonePreviewAddTargetSnapshot,
    });
    const bootstrapUiPlan =
      buildPresetModuleOptionCustomComposeBootstrapUiExecutionPlan(sessionBootstrap);
    if (bootstrapUiPlan.route === "abort") return false;
    if (bootstrapUiPlan.route === "ready") return true;
    if (bootstrapUiPlan.route === "error") {
      setPresetModuleOptionError(bootstrapUiPlan.errorMessage);
      return false;
    }
    const normalizedModuleType = bootstrapUiPlan.moduleType;
    const addTarget = bootstrapUiPlan.addTarget;

    const sourceResolution = buildPreviewAddSourceResolutionResult({
      source: resolveActivePreviewAddSourceTarget(addTarget),
      errorMessage: composeSourceErrorMessage,
    });
    const sourceUiPlan = buildPresetModuleOptionCustomComposeSourceUiExecutionPlan({
      bootstrapUiPlan,
      sourceResolution,
    });
    if (sourceUiPlan.route !== "create") {
      setPresetModuleOptionError(sourceUiPlan.errorMessage);
      return false;
    }
    const source = sourceUiPlan.source;

    if (normalizedModuleType === "corner") {
      const cornerLimitState = getShapeCornerLimitState();
      const cornerComposeValidation = buildPresetModuleOptionCustomCornerComposeValidation({
        isRootSource: isRootPreviewEndpointTarget(source),
        hasRootCornerStartDirection: hasSelectedRootCornerStartDirection(addTarget),
        rootCornerDirectionRequiredMessage: getRootCornerDirectionRequiredMessage(),
        canAddCornerByLimit: Boolean(cornerLimitState?.canAdd),
        cornerLimitBlockedMessage: getCornerLimitBlockedMessage(cornerLimitState),
        canAddCornerAtTarget: canAddCornerAtTarget(source, getSelectedShape()),
        cornerAttachSideBlockedMessage: getCornerAttachSideBlockedMessage(source, getSelectedShape()),
      });
      const placement = buildPlacementFromEndpoint(source);
      const edgeCreatePlan = buildPendingCornerComposeEdgeCreatePlan({
        source,
        placement,
        normalizeDirection,
        directionToSideIndex,
        createdAt: Date.now(),
      });
      const cornerCreationUiPlan = buildPresetModuleOptionCustomCornerCreationUiExecutionPlan({
        cornerComposeValidation,
        edgeCreatePlan,
        fallbackErrorMessage: composeSourceErrorMessage,
      });
      if (cornerCreationUiPlan.route !== "create-corner-edge") {
        setPresetModuleOptionError(cornerCreationUiPlan.errorMessage);
        return false;
      }
      const edge = buildPendingCornerComposeEdge(cornerCreationUiPlan.edgeCreatePlan);
      registerEdge(edge);
      const creationUiPlan = buildPresetModuleOptionCustomComposeCreationUiExecutionPlan({
        moduleType: "corner",
        edgeId: edge.id,
        fallbackErrorMessage: composeSourceErrorMessage,
      });
      if (creationUiPlan.route === "error") {
        setPresetModuleOptionError(creationUiPlan.errorMessage);
        return false;
      }
      applyDirectComposePendingActivationStateToRuntime(creationUiPlan.activationState);
      return true;
    }

    const shelfId = addShelfFromEndpoint(source, addTarget, buildPendingBayComposeAddOptions());
    const creationUiPlan = buildPresetModuleOptionCustomComposeCreationUiExecutionPlan({
      moduleType: "normal",
      edgeId: shelfId,
      fallbackErrorMessage: composeSourceErrorMessage,
    });
    if (creationUiPlan.route === "error") {
      setPresetModuleOptionError(creationUiPlan.errorMessage);
      return false;
    }
    applyDirectComposePendingActivationStateToRuntime(creationUiPlan.activationState);
    return true;
  };

  return {
    applyPresetModuleOptionSyncDomUiViewModel,
    applyPresetModuleOptionCustomSyncPreRuntimePlan,
    applyPresetModuleOptionCustomSyncPostRuntimePlan,
    applyPresetModuleOptionPresetSaveRuntimePlan,
    applyPresetModuleOptionOpenUiDispatchPlanToRuntime,
    applyPreviewAddCloseUiDispatchPlanToRuntime,
    applyPreviewPresetPickerCloseUiDispatchPlanToRuntime,
    applyPresetModuleOptionCloseUiDispatchPlanToRuntime,
    applyPreviewModuleActionCloseUiDispatchPlanToRuntime,
    applyPreviewPresetPickerOpenUiDispatchPlanToRuntime,
    syncPresetModuleOptionModal,
    renderPresetModuleOptionFrontPreview,
    ensurePresetModuleOptionCustomComposeSession,
    getActiveBayOptionId,
    getActiveCornerOptionId,
  };
}
