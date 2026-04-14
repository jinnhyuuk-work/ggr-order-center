export function createSystemOrderUiFlowHelpers(deps = {}) {
  const {
    state,
    getCurrentPhase,
    setCurrentPhase,
    getOrderCompleted,
    setOrderCompleted,
    getSendingEmail,
    systemOrderHelpers,
    renderEstimateTable,
    escapeHtml,
    requestStickyOffsetUpdate,
    removeSystemGroup,
    updateSystemGroupQuantity,
    calcColumnsDetail,
    calcBayDetail,
    shouldTreatBayFurniturePriceAsConsult,
    applyConsultPriceToDetail,
    isLayoutConsultStatus,
    buildGrandSummary,
    $,
    formatFulfillmentCostText,
    updateFulfillmentStepUI,
    getCustomerInfo,
    updateSendButtonEnabledShared,
    isConsentChecked,
    renderOrderCompleteDetails,
    applyThreePhaseStepVisibility,
    resolveThreePhaseNextTransition,
    validateFulfillmentStep,
    setFulfillmentStepError,
    showInfoModal,
    resolveThreePhasePrevPhase,
  } = deps;

  const renderTable = () => {
    const displayItems = systemOrderHelpers.buildSystemGroupDisplayItems(state.items);
    renderEstimateTable({
      items: displayItems,
      getName: () => "시스템 구성",
      getTotalText: (item) => (item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`),
      getDetailLines: (item) => systemOrderHelpers.buildSystemGroupDetailLines(item).map((line) => escapeHtml(line)),
      onQuantityChange: (id, value) => updateItemQuantity(id, value),
      onDelete: (id) => {
        const rawId = String(id || "");
        if (rawId.startsWith("group:")) {
          removeSystemGroup(rawId.slice(6));
          renderTable();
          renderSummary();
          return;
        }
        const removedItem = state.items.find((it) => String(it.id) === rawId);
        if (!removedItem) return;
        if (removedItem.groupId) {
          removeSystemGroup(removedItem.groupId);
          renderTable();
          renderSummary();
        }
      },
    });
    requestStickyOffsetUpdate();
  };

  const updateItemQuantity = (id, quantity) => {
    const rawId = String(id || "");
    if (rawId.startsWith("group:")) {
      updateSystemGroupQuantity(rawId.slice(6), quantity);
      renderTable();
      renderSummary();
      return;
    }
    const idx = state.items.findIndex((it) => it.id === id);
    if (idx === -1) return;
    const item = state.items[idx];
    if (item.type === "columns") {
      const groupedBays = item.groupId
        ? state.items.filter((it) => it.type === "bay" && it.groupId === item.groupId)
        : [];
      let detail = calcColumnsDetail({
        column: item.column,
        count: item.count,
        quantity,
        bays: groupedBays,
      });
      if (isLayoutConsultStatus(item.layoutConsult)) {
        detail = applyConsultPriceToDetail(detail);
      }
      state.items[idx] = { ...item, quantity, ...detail };
      renderTable();
      renderSummary();
      return;
    }
    if (item.type === "bay") {
      let detail = calcBayDetail({
        shelf: item.shelf,
        addons: item.addons,
        quantity,
        isCorner: Boolean(item.isCorner),
      });
      if (
        shouldTreatBayFurniturePriceAsConsult({
          width: Number(item?.shelf?.width || 0),
          addons: item?.addons,
          isCorner: Boolean(item?.isCorner),
        })
      ) {
        detail = applyConsultPriceToDetail(detail);
      }
      if (isLayoutConsultStatus(item.layoutConsult)) {
        detail = applyConsultPriceToDetail(detail);
      }
      state.items[idx] = { ...item, quantity, ...detail };
      renderTable();
      renderSummary();
    }
  };

  const updateSendButtonEnabled = () => {
    const customer = getCustomerInfo();
    updateSendButtonEnabledShared({
      customer,
      hasItems: state.items.length > 0,
      onFinalStep: getCurrentPhase() === 3,
      hasConsent: isConsentChecked(),
      sending: getSendingEmail(),
    });
  };

  const renderSummary = () => {
    const summary = buildGrandSummary();
    const suffix = summary.hasConsult ? "(상담 필요 품목 미포함)" : "";
    const productHasConsult = state.items.some((item) => Boolean(item?.isCustomPrice));
    const productSuffix = productHasConsult ? "(상담 필요 품목 미포함)" : "";
    const productTotal = Number(summary.subtotal || 0);

    const productTotalEl = $("#productTotal");
    if (productTotalEl) productTotalEl.textContent = `${productTotal.toLocaleString()}${productSuffix}`;
    const materialsTotalEl = $("#materialsTotal");
    if (materialsTotalEl) materialsTotalEl.textContent = summary.materialsTotal.toLocaleString();
    $("#grandTotal").textContent = `${summary.grandTotal.toLocaleString()}${suffix}`;
    const fulfillmentCostEl = $("#fulfillmentCost");
    if (fulfillmentCostEl) fulfillmentCostEl.textContent = formatFulfillmentCostText(summary.fulfillment);

    const naverUnits = Math.ceil(summary.grandTotal / 1000);
    $("#naverUnits").textContent = `${naverUnits}${suffix}`;
    updateFulfillmentStepUI();
    updateSendButtonEnabled();
  };

  const resetOrderCompleteUI = () => {
    setOrderCompleted(false);
    const navActions = document.querySelector(".nav-actions");
    const completeEl = $("#orderComplete");
    const summaryCard = $("#stepFinal");
    const actionCard = document.querySelector(".action-card");
    ["stepShape", "stepColumnMaterial", "stepShelfMaterial", "stepPreview", "step4"].forEach((id) =>
      document.getElementById(id)?.classList.remove("hidden-step")
    );
    actionCard?.classList.remove("hidden-step");
    navActions?.classList.remove("hidden-step");
    completeEl?.classList.add("hidden-step");
    summaryCard?.classList.remove("order-complete-visible");
    summaryCard?.classList.remove("hidden-step");
    $("#step4")?.classList.add("hidden-step");
    $("#step5")?.classList.add("hidden-step");
  };

  const showOrderComplete = () => {
    const navActions = document.querySelector(".nav-actions");
    const completeEl = $("#orderComplete");
    const fulfillmentStep = $("#step4");
    const customerStep = $("#step5");
    const summaryCard = $("#stepFinal");
    renderOrderCompleteDetails();
    setOrderCompleted(true);
    navActions?.classList.add("hidden-step");
    fulfillmentStep?.classList.add("hidden-step");
    customerStep?.classList.add("hidden-step");
    completeEl?.classList.remove("hidden-step");
    summaryCard?.classList.add("order-complete-visible");
    summaryCard?.classList.add("hidden-step");
  };

  const updateStepVisibility = (scrollTarget) => {
    const stepShape = $("#stepShape");
    const stepColumn = $("#stepColumnMaterial");
    const stepShelf = $("#stepShelfMaterial");
    const stepPreview = $("#stepPreview");
    const actionCard = document.querySelector(".action-card");
    const step4 = $("#step4");
    const step5 = $("#step5");
    const summaryCard = $("#stepFinal");
    const sendBtn = $("#sendQuoteBtn");
    const nextBtn = $("#nextStepsBtn");
    const backToCenterBtn = $("#backToCenterBtn");
    const orderComplete = $("#orderComplete");
    const navActions = document.querySelector(".nav-actions");
    const prevBtn = $("#prevStepsBtn");

    applyThreePhaseStepVisibility({
      currentPhase: getCurrentPhase(),
      orderCompleted: getOrderCompleted(),
      resetOrderCompleteUI,
      phase1Elements: [stepShape, stepColumn, stepShelf, stepPreview, actionCard],
      phase2Element: step4,
      phase3Element: step5,
      summaryCard,
      summaryCompleteClass: "order-complete-visible",
      restoreSummaryOnActive: true,
      orderCompleteElement: orderComplete,
      navActionsElement: navActions,
      prevButton: prevBtn,
      nextButton: nextBtn,
      sendButton: sendBtn,
      backToCenterButton: backToCenterBtn,
      completedHiddenElements: [
        stepShape,
        stepColumn,
        stepShelf,
        stepPreview,
        step4,
        step5,
        actionCard,
        summaryCard,
      ],
      completedActionButtons: [sendBtn, nextBtn],
      onActiveRender: () => updateSendButtonEnabled(),
      scrollTarget,
    });
  };

  const goToNextStep = () => {
    const transition = resolveThreePhaseNextTransition({
      currentPhase: getCurrentPhase(),
      phase1Ready: state.items.length > 0,
      phase1ErrorMessage: "먼저 시스템 수납장을 구성해주세요.",
      validatePhase2: validateFulfillmentStep,
    });

    if (transition.errorMessage) {
      if (transition.errorStage === "phase2") {
        setFulfillmentStepError(transition.errorMessage);
      }
      showInfoModal(transition.errorMessage);
      return;
    }

    if (transition.nextPhase === 2 && getCurrentPhase() !== 2) {
      setCurrentPhase(2);
      updateStepVisibility($("#step4"));
      updateFulfillmentStepUI();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (transition.nextPhase === 3 && getCurrentPhase() !== 3) {
      setCurrentPhase(3);
      updateStepVisibility($("#step5"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPrevStep = () => {
    const prevPhase = resolveThreePhasePrevPhase(getCurrentPhase());
    if (prevPhase === getCurrentPhase()) return;
    setCurrentPhase(prevPhase);
    updateStepVisibility(getCurrentPhase() === 2 ? $("#step4") : $("#stepShape"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    renderTable,
    updateItemQuantity,
    renderSummary,
    updateSendButtonEnabled,
    resetOrderCompleteUI,
    showOrderComplete,
    updateStepVisibility,
    goToNextStep,
    goToPrevStep,
  };
}
