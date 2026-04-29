export function createSystemFulfillmentSummaryHelpers(deps = {}) {
  const {
    getStateItems = () => [],
    getCustomerInfo,
    getFulfillmentType,
    evaluateFulfillmentPolicy,
    SYSTEM_FULFILLMENT_POLICY = {},
    FULFILLMENT_POLICY_MESSAGES = {},
    ADDON_CLOTHES_ROD_ID = "clothes_rod",
    calcGroupedAmount,
    calcOrderSummary,
    hasConsultLineItem,
    $,
    formatFulfillmentCardPriceText,
    formatFulfillmentCardDescription,
  } = deps;

  const getSystemColumnsItems = () => getStateItems().filter((item) => item.type === "columns");

  const getSystemBayItems = () => getStateItems().filter((item) => item.type === "bay");

  const getPostBarRowsForFulfillment = (columnItem) => {
    const rows = [];
    const baseRows = Array.isArray(columnItem?.basePostBars) && columnItem.basePostBars.length
      ? columnItem.basePostBars
      : columnItem?.basePostBar
        ? [columnItem.basePostBar]
        : [];
    const cornerRows = Array.isArray(columnItem?.cornerPostBars) && columnItem.cornerPostBars.length
      ? columnItem.cornerPostBars
      : columnItem?.cornerPostBar
        ? [columnItem.cornerPostBar]
        : [];
    [...baseRows, ...cornerRows].forEach((row) => {
      if (!row || typeof row !== "object") return;
      const rowCount = Math.max(0, Number(row.count || 0));
      const rowQty = Math.max(1, Math.floor(Number(row.quantity || columnItem?.quantity || 1)));
      rows.push({
        countTotal: rowCount * rowQty,
        heightMm: Math.max(0, Number(row.heightMm || 0)),
      });
    });
    return rows;
  };

  const getSystemPostBarSummary = () => {
    const rows = getSystemColumnsItems().flatMap((item) => getPostBarRowsForFulfillment(item));
    return {
      totalCount: rows.reduce((sum, row) => sum + Number(row.countTotal || 0), 0),
      hasOverHeight: rows.some((row) => Number(row.countTotal || 0) > 0 && Number(row.heightMm || 0) > 2400),
      hasUnknownHeight: rows.some((row) => Number(row.countTotal || 0) > 0 && Number(row.heightMm || 0) <= 0),
    };
  };

  const getSystemShelfSummary = () => {
    const bays = getSystemBayItems();
    return {
      totalCount: bays.reduce((sum, bay) => {
        const shelfCount = Math.max(1, Math.floor(Number(bay?.shelf?.count || 1)));
        const quantity = Math.max(1, Math.floor(Number(bay?.quantity || 1)));
        return sum + shelfCount * quantity;
      }, 0),
      hasOverWidth: bays.some((bay) => Number(bay?.shelf?.width || 0) > 800),
      hasUnknownWidth: bays.some((bay) => Number(bay?.shelf?.width || 0) <= 0),
    };
  };

  const hasSystemCornerOrFurniture = () =>
    getSystemBayItems().some((bay) => {
      if (bay?.isCorner) return true;
      const addons = Array.isArray(bay?.addons) ? bay.addons : [];
      return addons.some((addonId) => String(addonId || "") && String(addonId || "") !== String(ADDON_CLOTHES_ROD_ID));
    });

  const getSystemSectionLengthSumMm = () =>
    getSystemColumnsItems().reduce((sum, item) => {
      const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
      const sectionUsage = Array.isArray(item?.layoutSpec?.sectionUsage) ? item.layoutSpec.sectionUsage : [];
      const sections = Array.isArray(item?.layoutSpec?.sections) ? item.layoutSpec.sections : [];
      const perUnitLengthByUsage = sectionUsage.reduce(
        (acc, usage) => acc + Math.max(0, Number(usage?.usedMm || 0)),
        0
      );
      const perUnitLengthBySection = sections.reduce(
        (acc, section) => acc + Math.max(0, Number(section?.lengthMm || 0)),
        0
      );
      const perUnitLength = perUnitLengthByUsage > 0 ? perUnitLengthByUsage : perUnitLengthBySection;
      return sum + perUnitLength * quantity;
    }, 0);

  const evaluateFulfillment = (nextType = getFulfillmentType()) => {
    const customer = getCustomerInfo();
    const hasProducts = getStateItems().length > 0;
    return evaluateFulfillmentPolicy({
      nextType,
      customer,
      hasProducts,
      evaluateSupportedPolicy: ({ type }) => {
        const postBar = getSystemPostBarSummary();
        const shelf = getSystemShelfSummary();
        const deliveryPolicy = SYSTEM_FULFILLMENT_POLICY.delivery;

        if (type === "delivery") {
          if (deliveryPolicy.mode === "consult") {
            return {
              amount: 0,
              amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
              isConsult: true,
              reason: deliveryPolicy.consultReason,
            };
          }
          if (deliveryPolicy.mode !== "compositeGroupedFee") {
            return {
              amount: 0,
              amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
              isConsult: true,
              reason: FULFILLMENT_POLICY_MESSAGES.fallbackReason,
            };
          }
          if (hasSystemCornerOrFurniture()) {
            return {
              amount: 0,
              amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
              isConsult: true,
              reason: deliveryPolicy.consultReasons.cornerOrFurniture,
            };
          }
          if (postBar.hasOverHeight || postBar.hasUnknownHeight) {
            return {
              amount: 0,
              amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
              isConsult: true,
              reason: deliveryPolicy.consultReasons.overPostBarHeight,
            };
          }
          if (shelf.hasOverWidth || shelf.hasUnknownWidth) {
            return {
              amount: 0,
              amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
              isConsult: true,
              reason: deliveryPolicy.consultReasons.overShelfWidth,
            };
          }
          const postBarCost = calcGroupedAmount(
            postBar.totalCount,
            deliveryPolicy.postBarGroupedFee.groupSize,
            deliveryPolicy.postBarGroupedFee.groupPrice
          );
          const shelfCost = calcGroupedAmount(
            shelf.totalCount,
            deliveryPolicy.shelfGroupedFee.groupSize,
            deliveryPolicy.shelfGroupedFee.groupPrice
          );
          const amount = postBarCost + shelfCost;
          return {
            amount,
            amountText: `${amount.toLocaleString()}원`,
            isConsult: false,
            reason: "포스트바와 선반 수량 기준으로 배송비가 계산됩니다.",
          };
        }

        const fixedAmount = SYSTEM_FULFILLMENT_POLICY.installation.fixedByPostBarCount[postBar.totalCount];
        if (Number.isFinite(Number(fixedAmount)) && fixedAmount > 0) {
          const reason =
            postBar.totalCount === 2
              ? "포스트바 2개 구성 기준 시공비가 적용됩니다."
              : postBar.totalCount === 3
                ? "포스트바 3개 구성 기준 시공비가 적용됩니다."
                : "포스트바 4개 구성 기준 시공비가 적용됩니다.";
          return {
            amount: Number(fixedAmount),
            amountText:
              SYSTEM_FULFILLMENT_POLICY.installation.fixedAmountTextByPostBarCount[postBar.totalCount] ||
              `${Number(fixedAmount).toLocaleString()}원`,
            isConsult: false,
            reason,
          };
        }
        if (postBar.totalCount >= 5) {
          const sectionLengthSumMm = getSystemSectionLengthSumMm();
          if (!sectionLengthSumMm) {
            return {
              amount: 0,
              amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
              isConsult: true,
              reason: SYSTEM_FULFILLMENT_POLICY.installation.missingSectionLengthConsultReason,
            };
          }
          const amount = calcGroupedAmount(
            sectionLengthSumMm,
            SYSTEM_FULFILLMENT_POLICY.installation.sectionLengthGroupedFee.groupSizeMm,
            SYSTEM_FULFILLMENT_POLICY.installation.sectionLengthGroupedFee.groupPrice
          );
          return {
            amount,
            amountText: `${amount.toLocaleString()}원`,
            isConsult: false,
            reason: "섹션 길이 합산 기준으로 시공비가 계산됩니다.",
          };
        }

        return {
          amount: 0,
          amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
          isConsult: true,
          reason: SYSTEM_FULFILLMENT_POLICY.installation.fallbackConsultReason,
        };
      },
    });
  };

  const buildGrandSummary = () => {
    const baseSummary = calcOrderSummary(getStateItems());
    const fulfillment = evaluateFulfillment();
    const fulfillmentCost = fulfillment.isConsult ? 0 : Number(fulfillment.amount || 0);
    const grandTotal = Number(baseSummary.grandTotal || 0) + fulfillmentCost;
    const hasConsult =
      (typeof hasConsultLineItem === "function"
        ? hasConsultLineItem(getStateItems())
        : getStateItems().some((item) => Boolean(item?.isCustomPrice || item?.hasConsultItems))) ||
      (Boolean(fulfillment.type) && fulfillment.isConsult);
    return {
      ...baseSummary,
      fulfillment,
      fulfillmentCost,
      grandTotal,
      hasConsult,
    };
  };

  const updateFulfillmentCardPriceUI = () => {
    const cardEntries = [
      { id: "#fulfillmentCardPriceDelivery", fulfillment: evaluateFulfillment("delivery") },
      { id: "#fulfillmentCardPriceInstallation", fulfillment: evaluateFulfillment("installation") },
    ];
    cardEntries.forEach(({ id, fulfillment }) => {
      const priceEl = $(id);
      if (!priceEl) return;
      const descEl = priceEl.nextElementSibling;
      const isPlaceholder = fulfillment.amountText === "미선택" || !fulfillment.addressReady;
      priceEl.textContent = formatFulfillmentCardPriceText(fulfillment);
      priceEl.classList.toggle("is-consult", Boolean(fulfillment.isConsult));
      priceEl.classList.toggle("is-placeholder", Boolean(!fulfillment.isConsult && isPlaceholder));
      if (descEl?.classList?.contains("description")) {
        const fallbackText =
          id === "#fulfillmentCardPriceDelivery"
            ? "품목/수량/지역 기준 배송비 계산"
            : "품목/수량/지역 기준 시공비 계산";
        descEl.textContent = formatFulfillmentCardDescription(fulfillment, fallbackText);
      }
    });
  };

  return {
    getSystemColumnsItems,
    getSystemBayItems,
    getPostBarRowsForFulfillment,
    getSystemPostBarSummary,
    getSystemShelfSummary,
    hasSystemCornerOrFurniture,
    getSystemSectionLengthSumMm,
    evaluateFulfillment,
    buildGrandSummary,
    updateFulfillmentCardPriceUI,
  };
}
