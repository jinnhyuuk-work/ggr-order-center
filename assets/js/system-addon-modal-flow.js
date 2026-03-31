export function createSystemAddonModalFlowHelpers(deps = {}) {
  const {
    state,
    $,
    getSelectableSystemAddonItems,
    resolveFurnitureSelectionPolicyForEdge,
    renderSystemAddonModalCategoryFilterTabs,
    getFilteredSystemAddonModalItems,
    resolveFurnitureAddonDisplayPriceInfo,
    escapeHtml,
    getActiveShelfAddonId,
    setActiveShelfAddonId,
    getShelfAddonModalReturnTo,
    setShelfAddonModalReturnTo,
    findShelfById,
    getSelectedFurnitureAddonId,
    isPendingEdge,
    pushBuilderHistory,
    setShelfAddonQuantity,
    enforceSingleSelectableAddon,
    renderShelfAddonSelection,
    renderActiveOptionModalAddonSelection,
    autoCalculatePrice,
    updateAddItemState,
    getShelfAddonQuantity,
    captureBayOptionModalDraft,
    captureCornerOptionModalDraft,
    getFurnitureAddonBlockedReason,
    showInfoModal,
    openModal,
    closeModal,
    getActiveCornerOptionId,
    getActiveBayOptionId,
    openCornerOptionModal,
    openBayOptionModal,
    readCurrentInputs,
    readBayInputs,
    validateEstimateInputs,
    getLayoutConfigSnapshot,
    evaluateLayoutConsultState,
    calcColumnsDetail,
    isLayoutConsultStatus,
    applyConsultPriceToDetail,
    calcBayDetail,
    shouldTreatBayFurniturePriceAsConsult,
    refreshBuilderDerivedUI,
    renderTable,
    renderSummary,
  } = deps;

  const syncSystemAddonModalSelection = () => {
    const container = $("#systemAddonCards");
    const activeShelfAddonId = getActiveShelfAddonId();
    if (!container || !activeShelfAddonId) return;
    enforceSingleSelectableAddon(activeShelfAddonId);
    container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      const isSelected = getShelfAddonQuantity(activeShelfAddonId, input.value) > 0;
      input.checked = isSelected;
      input.closest(".option-card")?.classList.toggle("selected", isSelected);
    });
  };

  const closeShelfAddonModalAndReturn = () => {
    closeModal("#systemAddonModal");
    const returnTo = getShelfAddonModalReturnTo();
    setShelfAddonModalReturnTo("");
    const activeCornerOptionId = getActiveCornerOptionId();
    const activeBayOptionId = getActiveBayOptionId();
    if (returnTo === "corner" && activeCornerOptionId) {
      openCornerOptionModal(activeCornerOptionId, { preserveDraft: true });
      return;
    }
    if (returnTo === "bay" && activeBayOptionId) {
      openBayOptionModal(activeBayOptionId, { preserveDraft: true });
    }
  };

  const renderSystemAddonModalCards = () => {
    const container = $("#systemAddonCards");
    if (!container) return;
    container.innerHTML = "";
    const activeShelfAddonId = getActiveShelfAddonId();
    const allSelectableItems = getSelectableSystemAddonItems();
    const widthPolicy = resolveFurnitureSelectionPolicyForEdge(activeShelfAddonId, {
      modalReturnTo: getShelfAddonModalReturnTo(),
    });
    renderSystemAddonModalCategoryFilterTabs(allSelectableItems);
    const selectableItems = getFilteredSystemAddonModalItems(allSelectableItems);
    if (!selectableItems.length) {
      container.innerHTML = '<div class="builder-hint">선택 가능한 가구가 없습니다.</div>';
      container.onchange = null;
      return;
    }
    selectableItems.forEach((item) => {
      const priceInfo = resolveFurnitureAddonDisplayPriceInfo(item, {
        widthPolicy,
        widthMm: Number(widthPolicy?.widthMm || 0),
      });
      const label = document.createElement("label");
      label.className = "card-base option-card";
      label.innerHTML = `
        <input type="checkbox" value="${item.id}" />
        <div class="material-visual"></div>
        <div class="name">${item.name}</div>
        <div class="price${priceInfo.isConsult ? " is-consult" : ""}">${escapeHtml(priceInfo.label)}</div>
        ${item.description ? `<div class="description">${item.description}</div>` : ""}
      `;
      container.appendChild(label);
    });
    container.onchange = (e) => {
      const input = e.target.closest('input[type="checkbox"]');
      const activeEdgeId = getActiveShelfAddonId();
      if (!input || !activeEdgeId) return;
      const id = input.value;
      const targetEdge = findShelfById(activeEdgeId);
      const currentFurnitureAddonId = getSelectedFurnitureAddonId(activeEdgeId);
      const willChangeFurnitureSelection = input.checked
        ? String(currentFurnitureAddonId || "") !== String(id || "")
        : String(currentFurnitureAddonId || "") === String(id || "");
      if (willChangeFurnitureSelection && !isPendingEdge(targetEdge)) {
        pushBuilderHistory("update-furniture-addon");
      }
      if (input.checked) {
        allSelectableItems.forEach((item) => {
          setShelfAddonQuantity(activeEdgeId, item.id, item.id === id ? 1 : 0);
        });
      } else {
        setShelfAddonQuantity(activeEdgeId, id, 0);
      }
      enforceSingleSelectableAddon(activeEdgeId);
      syncSystemAddonModalSelection();
      renderShelfAddonSelection(activeEdgeId);
      renderActiveOptionModalAddonSelection();
      autoCalculatePrice();
      updateAddItemState();
      closeShelfAddonModalAndReturn();
    };
    if (activeShelfAddonId) syncSystemAddonModalSelection();
  };

  const openShelfAddonModal = (id, { returnTo = "" } = {}) => {
    if (returnTo === "bay") captureBayOptionModalDraft();
    if (returnTo === "corner") captureCornerOptionModalDraft();
    const blockedReason = getFurnitureAddonBlockedReason(id, { modalReturnTo: returnTo });
    if (blockedReason) {
      showInfoModal(blockedReason);
      return;
    }
    setActiveShelfAddonId(id);
    setShelfAddonModalReturnTo(returnTo || "");
    renderSystemAddonModalCards();
    syncSystemAddonModalSelection();
    openModal("#systemAddonModal", { focusTarget: "#systemAddonModalTitle" });
  };

  const updateBayAddonAvailability = () => {
    document.querySelectorAll("[data-shelf-addon-btn]").forEach((btn) => {
      const edgeId = String(btn.dataset.shelfAddonBtn || "");
      const blockedReason = getFurnitureAddonBlockedReason(edgeId);
      const blocked = Boolean(blockedReason);
      btn.disabled = blocked;
      btn.classList.toggle("btn-disabled", blocked);
      btn.setAttribute("aria-disabled", blocked ? "true" : "false");
      if (blocked) btn.title = blockedReason;
      else btn.removeAttribute("title");
    });
  };

  const commitBaysToEstimate = () => {
    const input = readCurrentInputs();
    const bays = readBayInputs();
    const err = validateEstimateInputs(input, bays);
    if (err) {
      showInfoModal(err);
      return;
    }
    const layoutSpec = getLayoutConfigSnapshot(input);
    const layoutConsult = evaluateLayoutConsultState(layoutSpec);
    const groupId = crypto.randomUUID();
    const columnCount = bays.length + 1;
    let columnDetail = calcColumnsDetail({
      column: input.column,
      count: columnCount,
      quantity: 1,
      bays,
    });
    if (isLayoutConsultStatus(layoutConsult)) {
      columnDetail = applyConsultPriceToDetail(columnDetail);
    }
    state.items.push({
      id: `columns-${groupId}`,
      type: "columns",
      groupId,
      count: columnCount,
      column: { ...input.column },
      layoutSpec,
      layoutConsult,
      quantity: 1,
      ...columnDetail,
    });

    bays.forEach((bay) => {
      const shelf = {
        ...input.shelf,
        width: bay.width,
        count: bay.count,
        customProcessing: bay.customProcessing,
        customPrimaryMm: bay.customPrimaryMm,
        customSecondaryMm: bay.customSecondaryMm,
      };
      let detail = calcBayDetail({
        shelf,
        addons: bay.addons,
        quantity: 1,
        isCorner: Boolean(bay.isCorner),
      });
      if (shouldTreatBayFurniturePriceAsConsult(bay)) {
        detail = applyConsultPriceToDetail(detail);
      }
      if (isLayoutConsultStatus(layoutConsult)) {
        detail = applyConsultPriceToDetail(detail);
      }
      state.items.push({
        id: crypto.randomUUID(),
        type: "bay",
        groupId,
        shelf,
        addons: bay.addons,
        isCorner: Boolean(bay.isCorner),
        layoutSpec,
        layoutConsult,
        quantity: 1,
        ...detail,
      });
    });

    refreshBuilderDerivedUI({ preview: true, price: false, addItemState: false });
    renderTable();
    renderSummary();
  };

  return {
    renderSystemAddonModalCards,
    syncSystemAddonModalSelection,
    openShelfAddonModal,
    closeShelfAddonModalAndReturn,
    updateBayAddonAvailability,
    commitBaysToEstimate,
  };
}
