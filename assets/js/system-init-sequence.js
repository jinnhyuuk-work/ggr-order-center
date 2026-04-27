export function isSystemInitMountReady({ $, materialPickers } = {}) {
  const shelfCards = $(materialPickers?.shelf?.cardsId || "");
  const columnCards = $(materialPickers?.column?.cardsId || "");
  return Boolean(shelfCards && columnCards);
}

export function runSystemInitSequence({
  initCustomerPhotoUploader,
  showInfoModal,
  updateSendButtonEnabled,
  assignCustomerPhotoUploader,
  resetOrderCompleteUI,
  initCollapsibleSections,
  renderSystemAddonModalCards,
  bindOptionModalFrontPreviewEvents,
  bindPendingOptionModalCleanupOnClose,
  materialPickers,
  buildCategories,
  renderMaterialTabs,
  renderMaterialCards,
  updateSelectedMaterialCard,
  updateThicknessOptions,
  initShelfStateForShape,
  getSelectedShape,
  renderShapeSizeInputs,
  renderBayInputs,
  renderTable,
  renderSummary,
  refreshBuilderDerivedUI,
  updateBayAddonAvailability,
  updateStepVisibility,
  updateBuilderHistoryButtons,
  bindPreviewFrameResizeSync,
  requestStickyOffsetUpdate,
} = {}) {
  try {
    const uploader =
      typeof initCustomerPhotoUploader === "function"
        ? initCustomerPhotoUploader({
            showInfoModal,
            onChange: () => {
              if (typeof updateSendButtonEnabled === "function") updateSendButtonEnabled();
            },
          })
        : null;
    if (typeof assignCustomerPhotoUploader === "function") assignCustomerPhotoUploader(uploader);
    if (typeof resetOrderCompleteUI === "function") resetOrderCompleteUI();
    if (typeof initCollapsibleSections === "function") initCollapsibleSections();
    if (typeof renderSystemAddonModalCards === "function") renderSystemAddonModalCards();
    if (typeof bindOptionModalFrontPreviewEvents === "function") bindOptionModalFrontPreviewEvents();
    if (typeof bindPendingOptionModalCleanupOnClose === "function") bindPendingOptionModalCleanupOnClose();
  } catch (err) {
    console.error("init base setup failed", err);
  }

  try {
    Object.values(materialPickers || {}).forEach((picker) => {
      picker.categories = buildCategories(picker.materials);
      picker.selectedCategory = picker.categories[0] || "기타";
      renderMaterialTabs(picker);
      renderMaterialCards(picker);
      updateSelectedMaterialCard(picker);
      updateThicknessOptions(picker);
    });
  } catch (err) {
    console.error("init material setup failed", err);
  }

  try {
    if (typeof initShelfStateForShape === "function") initShelfStateForShape(getSelectedShape());
    if (typeof renderShapeSizeInputs === "function") renderShapeSizeInputs();
    if (typeof renderBayInputs === "function") renderBayInputs();
    if (typeof renderTable === "function") renderTable();
    if (typeof renderSummary === "function") renderSummary();
    if (typeof refreshBuilderDerivedUI === "function") refreshBuilderDerivedUI();
    if (typeof updateBayAddonAvailability === "function") updateBayAddonAvailability();
    if (typeof updateStepVisibility === "function") updateStepVisibility();
    if (typeof updateBuilderHistoryButtons === "function") updateBuilderHistoryButtons();
    if (typeof bindPreviewFrameResizeSync === "function") bindPreviewFrameResizeSync();
    if (typeof requestStickyOffsetUpdate === "function") requestStickyOffsetUpdate();
  } catch (err) {
    console.error("init render failed", err);
  }
}
