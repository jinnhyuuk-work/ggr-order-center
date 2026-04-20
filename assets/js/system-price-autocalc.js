export function createSystemPriceAutocalcHelpers(deps = {}) {
  const {
    readCurrentInputs,
    readBayInputs,
    updateSizeErrorsUI,
    updateShelfAddButtonState,
    getItemPriceDisplayValidationMessage,
    renderItemPriceNotice,
    updateAddItemState,
    calcBayDetail,
    shouldTreatBayFurniturePriceAsConsult,
    applyConsultPriceToDetail,
    calcAddonCostBreakdown,
    calcColumnsDetail,
    evaluateLayoutConsultState,
    getLayoutConfigSnapshot,
    isLayoutConsultStatus,
    renderItemPriceDisplay,
  } = deps;

  const autoCalculatePrice = () => {
    const input = readCurrentInputs();
    const bays = readBayInputs();
    updateSizeErrorsUI(input, bays);
    updateShelfAddButtonState(input);
    const err = getItemPriceDisplayValidationMessage(input, bays);
    if (err) {
      renderItemPriceNotice({ target: "#itemPriceDisplay", text: err });
      updateAddItemState();
      return;
    }

    const bayTotals = bays.reduce(
      (acc, bay) => {
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
        if (
          shouldTreatBayFurniturePriceAsConsult({
            ...bay,
            shelfMaterialId: shelf?.materialId,
          })
        ) {
          detail = applyConsultPriceToDetail(detail);
        }
        const addonCost = detail.isCustomPrice
          ? { componentCost: 0, furnitureCost: 0 }
          : calcAddonCostBreakdown(bay.addons, 1, {
              widthMm: Number(bay?.width || 0),
              shelfMaterialId: shelf?.materialId,
            });
        return {
          materialCost: acc.materialCost + detail.materialCost,
          processingCost: acc.processingCost + detail.processingCost,
          componentCost: acc.componentCost + addonCost.componentCost,
          furnitureCost: acc.furnitureCost + addonCost.furnitureCost,
          total: acc.total + detail.total,
          isCustomPrice: acc.isCustomPrice || detail.isCustomPrice,
        };
      },
      {
        materialCost: 0,
        processingCost: 0,
        componentCost: 0,
        furnitureCost: 0,
        total: 0,
        isCustomPrice: false,
      }
    );
    const columnDetail = calcColumnsDetail({
      column: input.column,
      count: bays.length + 1,
      quantity: 1,
      bays,
    });
    const layoutConsult = evaluateLayoutConsultState(getLayoutConfigSnapshot(input));
    const totalPrice = bayTotals.total + columnDetail.total;
    const isCustom =
      bayTotals.isCustomPrice || columnDetail.isCustomPrice || isLayoutConsultStatus(layoutConsult);
    const basePostCost = Number(columnDetail?.basePostBar?.totalCost || 0);
    const cornerPostCost = Number(columnDetail?.cornerPostBar?.totalCost || 0);
    const breakdownRows = isCustom
      ? [
          { label: "선반", isConsult: true },
          { label: "행거", isConsult: true },
          { label: "가구", isConsult: true },
          { label: "기본 포스트바", isConsult: true },
          { label: "코너 포스트바", isConsult: true },
        ]
      : [
          { label: "선반", amount: bayTotals.materialCost },
          { label: "행거", amount: bayTotals.componentCost },
          { label: "가구", amount: bayTotals.furnitureCost },
          { label: "기본 포스트바", amount: basePostCost },
          { label: "코너 포스트바", amount: cornerPostCost },
        ];
    renderItemPriceDisplay({
      target: "#itemPriceDisplay",
      totalLabel: "예상금액",
      totalAmount: totalPrice,
      totalText: isCustom ? "상담 안내" : "",
      breakdownRows,
    });
    updateAddItemState();
  };

  return {
    autoCalculatePrice,
  };
}
