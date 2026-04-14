import { bindModalCloseTriggers, bindModalOpenTriggers } from "./shared.js";

export function bindSystemInitEvents({
  $,
  $$,
  materialPickers,
  commitBaysToEstimate,
  closeShelfAddonModalAndReturn,
  getSystemAddonModalCategoryFilterKey,
  setSystemAddonModalCategoryFilterKey,
  renderSystemAddonModalCards,
  getActiveCornerOptionId,
  captureCornerOptionModalDraft,
  isPresetModuleOptionCustomTabActive,
  getPresetModuleOptionModalState,
  getPresetModuleOptionDraft,
  setSuppressPendingOptionModalCleanupOnce,
  closePresetModuleOptionModal,
  openShelfAddonModal,
  resetBayComposeInputsOnWidthChange,
  updateBayOptionModalApplyButtonState,
  renderBayOptionFrontPreview,
  autoCalculatePrice,
  setFieldError,
  getActiveBayOptionId,
  captureBayOptionModalDraft,
  closePreviewAddTypePicker,
  handlePreviewAddModalTypeSelect,
  handlePreviewAddModalRootCornerDirectionSelect,
  handlePreviewAddModalBack,
  closePreviewModuleActionModal,
  handlePreviewModuleActionEdit,
  handlePreviewModuleActionAddSide,
  closePreviewPresetModuleModal,
  handlePreviewPresetModuleCardClick,
  getPreviewPresetModuleCategoryFilterKey,
  setPreviewPresetModuleCategoryFilterKey,
  renderPreviewPresetModuleModalUI,
  openPresetPickerFromPresetModuleOptionModal,
  handlePresetModuleOptionModalTabClick,
  handlePresetModuleOptionFilterChange,
  savePresetModuleOptionModal,
  handlePresetModuleOptionModalRemove,
  handlePresetModuleOptionModalBack,
  undoBuilderHistory,
  redoBuilderHistory,
  openCornerOptionModal,
  openBayOptionModal,
  setPreviewEdgeHoverState,
  handleMeasurementGuideCarouselClick,
  goToNextStep,
  goToPrevStep,
  requestStickyOffsetUpdate,
  sendQuote,
  updateSendButtonEnabled,
  setFulfillmentType,
  setServiceStepError,
  updateServiceStepUI,
  renderSummary,
  refreshBuilderDerivedUI,
  clearPreviewGhost,
  isPreviewBuilderReady,
  readCurrentInputs,
  getPreviewOpenEndpoint,
  openPreviewAddTypeModal,
  openPreviewModuleActionModal,
  setPreviewInfoMode,
  syncPreviewInfoModeButtons,
  openMeasurementGuideModal,
  getFulfillmentType,
  hidePreviewAddTooltip,
  requestPreviewFrameRerender,
} = {}) {
  bindModalOpenTriggers();
  bindModalCloseTriggers();
  $("#addEstimateBtn")?.addEventListener("click", commitBaysToEstimate);
  $("#closeSystemAddonModal")?.addEventListener("click", closeShelfAddonModalAndReturn);
  $("#systemAddonModalBackdrop")?.addEventListener("click", closeShelfAddonModalAndReturn);
  $("#systemAddonCategoryFilterTabs")?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-system-addon-category]");
    if (!btn) return;
    const nextKey = String(btn.dataset.systemAddonCategory || "all");
    if (nextKey === String(getSystemAddonModalCategoryFilterKey() || "all")) return;
    setSystemAddonModalCategoryFilterKey(nextKey || "all");
    renderSystemAddonModalCards();
  });
  $("#cornerAddonBtn")?.addEventListener("click", () => {
    const activeCornerOptionId = getActiveCornerOptionId();
    if (!activeCornerOptionId) return;
    const targetEdgeId = activeCornerOptionId;
    captureCornerOptionModalDraft();
    if (isPresetModuleOptionCustomTabActive(getPresetModuleOptionModalState(), getPresetModuleOptionDraft())) {
      setSuppressPendingOptionModalCleanupOnce(true);
      closePresetModuleOptionModal({ returnFocus: false, clearState: false });
    }
    openShelfAddonModal(targetEdgeId, { returnTo: "corner" });
  });
  $("#bayWidthPresetSelect")?.addEventListener("change", () => {
    const presetSelect = $("#bayWidthPresetSelect");
    const customInput = $("#bayWidthCustomInput");
    if (!presetSelect || !customInput) return;
    const isCustom = presetSelect.value === "custom";
    customInput.classList.toggle("hidden", !isCustom);
    customInput.disabled = !isCustom;
    if (isCustom) customInput.focus();
    setFieldError(customInput, $("#bayWidthError"), "");
    if (
      isPresetModuleOptionCustomTabActive(getPresetModuleOptionModalState(), getPresetModuleOptionDraft(), "normal")
    ) {
      resetBayComposeInputsOnWidthChange();
    }
    updateBayOptionModalApplyButtonState();
    renderBayOptionFrontPreview();
    autoCalculatePrice();
  });
  $("#bayWidthCustomInput")?.addEventListener("change", () => {
    const presetSelect = $("#bayWidthPresetSelect");
    if (String(presetSelect?.value || "") !== "custom") return;
    if (
      isPresetModuleOptionCustomTabActive(getPresetModuleOptionModalState(), getPresetModuleOptionDraft(), "normal")
    ) {
      resetBayComposeInputsOnWidthChange();
      updateBayOptionModalApplyButtonState();
      renderBayOptionFrontPreview();
      autoCalculatePrice();
    }
  });
  $("#bayAddonBtn")?.addEventListener("click", () => {
    const activeBayOptionId = getActiveBayOptionId();
    if (!activeBayOptionId) return;
    const targetEdgeId = activeBayOptionId;
    captureBayOptionModalDraft();
    if (isPresetModuleOptionCustomTabActive(getPresetModuleOptionModalState(), getPresetModuleOptionDraft())) {
      setSuppressPendingOptionModalCleanupOnce(true);
      closePresetModuleOptionModal({ returnFocus: false, clearState: false });
    }
    openShelfAddonModal(targetEdgeId, { returnTo: "bay" });
  });
  $("#closePreviewAddTypeModal")?.addEventListener("click", () => closePreviewAddTypePicker({ returnFocus: true }));
  $("#previewAddTypeModalBackdrop")?.addEventListener("click", () => closePreviewAddTypePicker());
  $("#previewAddModalNormalBtn")?.addEventListener("click", () => handlePreviewAddModalTypeSelect("normal"));
  $("#previewAddModalCornerBtn")?.addEventListener("click", () => handlePreviewAddModalTypeSelect("corner"));
  $("#previewAddModalRootCornerRightBtn")?.addEventListener("click", () =>
    handlePreviewAddModalRootCornerDirectionSelect("right")
  );
  $("#previewAddModalRootCornerLeftBtn")?.addEventListener("click", () =>
    handlePreviewAddModalRootCornerDirectionSelect("left")
  );
  $("#previewAddModalRootCornerBackBtn")?.addEventListener("click", handlePreviewAddModalBack);
  $("#closePreviewModuleActionModal")?.addEventListener("click", () =>
    closePreviewModuleActionModal({ returnFocus: true })
  );
  $("#previewModuleActionModalBackdrop")?.addEventListener("click", () => closePreviewModuleActionModal());
  $("#previewModuleActionEditBtn")?.addEventListener("click", handlePreviewModuleActionEdit);
  $("#previewModuleActionAddLeftBtn")?.addEventListener("click", () => handlePreviewModuleActionAddSide("left"));
  $("#previewModuleActionAddRightBtn")?.addEventListener("click", () => handlePreviewModuleActionAddSide("right"));
  $("#closePreviewPresetModuleModal")?.addEventListener("click", () => closePreviewPresetModuleModal());
  $("#previewPresetModuleModalBackdrop")?.addEventListener("click", () => closePreviewPresetModuleModal());
  $("#previewPresetModuleCards")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview-preset-id]");
    if (!btn) return;
    handlePreviewPresetModuleCardClick(btn);
  });
  $("#previewPresetModuleCategoryTabs")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview-preset-category]");
    if (!btn) return;
    const nextKey = String(btn.dataset.previewPresetCategory || "all");
    if (nextKey === String(getPreviewPresetModuleCategoryFilterKey() || "all")) return;
    setPreviewPresetModuleCategoryFilterKey(nextKey || "all");
    renderPreviewPresetModuleModalUI();
  });
  $("#openPresetModulePickerBtn")?.addEventListener("click", openPresetPickerFromPresetModuleOptionModal);
  $("#presetModuleOptionPresetTabBtn")?.addEventListener("click", () =>
    handlePresetModuleOptionModalTabClick("preset")
  );
  $("#presetModuleOptionCustomTabBtn")?.addEventListener("click", () =>
    handlePresetModuleOptionModalTabClick("custom")
  );
  $("#presetModuleOptionFilterSelect")?.addEventListener("change", handlePresetModuleOptionFilterChange);
  $("#savePresetModuleOptionModal")?.addEventListener("click", savePresetModuleOptionModal);
  $("#removePresetModuleOptionModal")?.addEventListener("click", handlePresetModuleOptionModalRemove);
  $("#backPresetModuleOptionModal")?.addEventListener("click", handlePresetModuleOptionModalBack);
  $("#closePresetModuleOptionModal")?.addEventListener("click", () =>
    closePresetModuleOptionModal({ returnFocus: true, clearState: true })
  );
  $("#presetModuleOptionModalBackdrop")?.addEventListener("click", () =>
    closePresetModuleOptionModal({ returnFocus: false, clearState: true })
  );
  $("#builderUndoBtn")?.addEventListener("click", undoBuilderHistory);
  $("#builderRedoBtn")?.addEventListener("click", redoBuilderHistory);

  const builderEdgeListEl = $("#builderEdgeList");
  builderEdgeListEl?.addEventListener("click", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const id = row.dataset.builderEdgeId;
    const type = row.dataset.builderEdgeType;
    if (!id) return;
    if (type === "corner") {
      openCornerOptionModal(id);
    } else {
      openBayOptionModal(id);
    }
  });
  builderEdgeListEl?.addEventListener("mouseover", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const id = row.dataset.builderEdgeId;
    setPreviewEdgeHoverState(id, Boolean(id));
  });
  builderEdgeListEl?.addEventListener("mouseout", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const next = e.relatedTarget;
    if (next instanceof Element && row.contains(next)) return;
    setPreviewEdgeHoverState("", false);
  });
  builderEdgeListEl?.addEventListener("focusin", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const id = row.dataset.builderEdgeId;
    setPreviewEdgeHoverState(id, Boolean(id));
  });
  builderEdgeListEl?.addEventListener("focusout", (e) => {
    const row = e.target.closest("[data-builder-edge-id]");
    if (!row) return;
    const next = e.relatedTarget;
    if (next instanceof Element && row.contains(next)) return;
    setPreviewEdgeHoverState("", false);
  });

  $("#measurementGuideModalBody")?.addEventListener("click", handleMeasurementGuideCarouselClick);
  $("#nextStepsBtn")?.addEventListener("click", goToNextStep);
  $("#prevStepsBtn")?.addEventListener("click", goToPrevStep);
  $("#stepFinal .estimate-toggle")?.addEventListener("click", requestStickyOffsetUpdate);
  $("#backToCenterBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  $("#sendQuoteBtn")?.addEventListener("click", sendQuote);
  $("#resetFlowBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  $("#privacyConsent")?.addEventListener("change", updateSendButtonEnabled);
  ["#customerName", "#customerPhone", "#customerEmail"].forEach((sel) => {
    $(sel)?.addEventListener("input", updateSendButtonEnabled);
  });
  document.querySelectorAll("[data-fulfillment-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setFulfillmentType(btn.dataset.fulfillmentType);
      setServiceStepError("");
      updateServiceStepUI();
      renderSummary();
    });
  });
  ["#sample6_postcode", "#sample6_address", "#sample6_detailAddress"].forEach((sel) => {
    $(sel)?.addEventListener("input", () => {
      setServiceStepError("");
      updateServiceStepUI();
      renderSummary();
      updateSendButtonEnabled();
    });
  });

  Object.values(materialPickers).forEach((picker) => {
    $(picker.thicknessSelectId)?.addEventListener("change", () => {
      refreshBuilderDerivedUI({ preview: true, price: true });
    });
  });

  $("#systemPreviewShelves")?.addEventListener("click", (e) => {
    clearPreviewGhost();
    const eventTarget = e.target instanceof Element ? e.target : null;
    if (!eventTarget?.closest("#previewAddTypeModal")) {
      closePreviewAddTypePicker();
    }
    if (!eventTarget?.closest("#previewModuleActionModal")) {
      closePreviewModuleActionModal();
    }
    const addTarget = eventTarget?.closest("[data-add-shelf]");
    if (addTarget) {
      if (!isPreviewBuilderReady(readCurrentInputs())) return;
      const endpointId = addTarget.dataset.endpointId || "";
      const endpoint = endpointId ? getPreviewOpenEndpoint(endpointId) : null;
      if (!endpoint) return;
      const sideIndex = Number(endpoint.sideIndex ?? addTarget.dataset.addShelf);
      const attachSideIndex = Number(endpoint.attachSideIndex ?? sideIndex);
      const cornerId = endpoint.cornerId || "";
      const prepend = endpoint.prepend === true;
      const attachAtStart = Boolean(endpoint.attachAtStart);
      const allowedTypes = endpoint?.allowedTypes || ["normal"];
      closePreviewModuleActionModal();
      openPreviewAddTypeModal(
        sideIndex,
        cornerId,
        prepend,
        attachSideIndex,
        attachAtStart,
        endpointId,
        allowedTypes,
        addTarget
      );
      return;
    }
    const cornerTarget = eventTarget?.closest("[data-corner-preview]");
    if (cornerTarget) {
      const cornerId = cornerTarget.dataset.cornerPreview;
      if (!cornerId) return;
      openPreviewModuleActionModal(cornerId, "corner", cornerTarget);
      return;
    }
    const bayTarget = eventTarget?.closest("[data-bay-preview]");
    if (!bayTarget) return;
    const shelfId = bayTarget.dataset.bayPreview;
    if (!shelfId) return;
    openPreviewModuleActionModal(shelfId, "bay", bayTarget);
  });

  $$("[data-preview-info-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setPreviewInfoMode(btn.dataset.previewInfoMode, { rerender: true });
    });
  });
  syncPreviewInfoModeButtons();

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const guideBtn = target?.closest("[data-measurement-guide]");
    if (!guideBtn) return;
    openMeasurementGuideModal(guideBtn.dataset.measurementGuide || "");
  });

  document.addEventListener("keydown", (e) => {
    const target = e.target;
    if (
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")
    ) {
      return;
    }
    const key = String(e.key || "").toLowerCase();
    const isMeta = e.metaKey || e.ctrlKey;
    if (!isMeta) return;
    if (key === "z" && e.shiftKey) {
      e.preventDefault();
      redoBuilderHistory();
      return;
    }
    if (key === "z") {
      e.preventDefault();
      undoBuilderHistory();
      return;
    }
    if (key === "y") {
      e.preventDefault();
      redoBuilderHistory();
    }
  });

  setFulfillmentType(getFulfillmentType());
  updateServiceStepUI();
  updateSendButtonEnabled();
  window.addEventListener("scroll", hidePreviewAddTooltip, { passive: true });
  window.addEventListener("resize", () => {
    requestStickyOffsetUpdate();
    requestPreviewFrameRerender();
  });
}
