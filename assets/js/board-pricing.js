import { evaluateSelectionPricing, resolveAmountFromPriceRule } from "./shared.js";

export function createBoardPricingHelpers({
  materials = {},
  processingServices = {},
  optionCatalog = {},
  dimensionLimits = {},
} = {}) {
  const customWidthMax = Number(dimensionLimits.maxWidth || 0);
  const customLengthMax = Number(dimensionLimits.maxLength || 0);

  function getPricePerM2(material, thickness) {
    if (material?.pricingRule && typeof material.pricingRule === "object") {
      const ruleValue = Number(material.pricingRule.value || material.pricingRule.unitPrice || 0);
      if (ruleValue > 0) return ruleValue;
    }
    if (material?.pricePerM2ByThickness) {
      if (thickness && material.pricePerM2ByThickness[thickness]) {
        return material.pricePerM2ByThickness[thickness];
      }
      const firstAvailable = material.availableThickness?.find(
        (t) => material.pricePerM2ByThickness[t]
      );
      if (firstAvailable !== undefined) {
        return material.pricePerM2ByThickness[firstAvailable];
      }
      const firstPrice = Object.values(material.pricePerM2ByThickness)[0];
      if (firstPrice) return firstPrice;
    }
    return Number(material?.pricePerM2 || 0);
  }

  function isBoardCustomSize(width, length) {
    return Number(width || 0) > customWidthMax || Number(length || 0) > customLengthMax;
  }

  function calcMaterialCost({ materialId, width, length, quantity, thickness }) {
    const material = materials[materialId];
    const areaM2 = (Number(width || 0) / 1000) * (Number(length || 0) / 1000);
    const pricePerM2 = getPricePerM2(material, thickness);
    if (isBoardCustomSize(width, length)) {
      return { areaM2, materialCost: 0, isCustom: true };
    }
    const materialCost = Number(
      resolveAmountFromPriceRule({
        config: material,
        quantity,
        metrics: { areaM2 },
      }) || areaM2 * pricePerM2 * Number(quantity || 0)
    );
    return { areaM2, materialCost, isCustom: false };
  }

  function calcProcessingCost({
    quantity,
    services = [],
    serviceDetails = {},
  }) {
    const { amount, hasConsult } = evaluateSelectionPricing({
      selectedIds: services,
      resolveById: (id) => processingServices[id],
      quantity,
      getAmount: ({ id, item, quantity: qty }) => {
        const detail = serviceDetails?.[id];
        return item.calcProcessingCost(qty, detail);
      },
    });
    return { processingCost: amount, hasConsult };
  }

  function calcWeightKg({ materialId, width, length, thickness, quantity }) {
    const material = materials[materialId];
    const areaM2 = (Number(width || 0) / 1000) * (Number(length || 0) / 1000);
    const thicknessM = Number(thickness || 0) / 1000;
    const volumeM3 = areaM2 * thicknessM * Number(quantity || 0);
    const weightKg = volumeM3 * Number(material?.density || 0);
    return { weightKg };
  }

  function formatOptionsLabel(options = []) {
    if (!options || options.length === 0) return "-";
    return options
      .map((id) => optionCatalog[id]?.name || id)
      .join(", ");
  }

  function calcOptionsPrice(options = []) {
    const { amount, hasConsult } = evaluateSelectionPricing({
      selectedIds: options,
      resolveById: (id) => optionCatalog[id],
    });
    return { optionPrice: amount, hasConsult };
  }

  function calcItemDetail(input) {
    const {
      materialId,
      width,
      length,
      thickness,
      quantity,
      options = [],
      services = [],
      serviceDetails = {},
    } = input;

    const { areaM2, materialCost, isCustom } = calcMaterialCost({
      materialId,
      width,
      length,
      quantity,
      thickness,
    });

    const { processingCost, hasConsult: hasConsultProcessingService } = calcProcessingCost({
      quantity,
      services,
      serviceDetails,
    });
    const { optionPrice, hasConsult: hasConsultOption } = calcOptionsPrice(options);

    const { weightKg } = calcWeightKg({
      materialId,
      width,
      length,
      thickness,
      quantity,
    });

    const appliedMaterialCost = isCustom ? 0 : materialCost;
    const appliedOptionCost = isCustom || hasConsultOption ? 0 : optionPrice;
    const appliedProcessingServiceCost = isCustom || hasConsultProcessingService ? 0 : processingCost;
    const appliedProcessingCost = appliedProcessingServiceCost + appliedOptionCost;
    const subtotal = appliedMaterialCost + appliedProcessingCost;
    const vat = 0;
    const total = Math.round(subtotal);
    const hasConsultItems = Boolean(isCustom || hasConsultOption || hasConsultProcessingService);

    return {
      areaM2,
      materialCost: appliedMaterialCost,
      processingCost: appliedProcessingCost,
      optionCost: appliedOptionCost,
      processingServiceCost: appliedProcessingServiceCost,
      serviceCost: appliedProcessingServiceCost,
      subtotal,
      vat,
      total,
      weightKg,
      isCustomPrice: isCustom,
      hasConsultItems,
      itemHasConsult: Boolean(isCustom),
      optionHasConsult: Boolean(isCustom || hasConsultOption),
      processingServiceHasConsult: Boolean(isCustom || hasConsultProcessingService),
      serviceHasConsult: Boolean(isCustom || hasConsultProcessingService),
      optionsLabel: formatOptionsLabel(options),
      options,
    };
  }

  function calcAddonDetail(price) {
    const subtotal = Number(price || 0);
    const vat = 0;
    const total = subtotal;
    return {
      materialCost: subtotal,
      processingCost: 0,
      subtotal,
      vat,
      total,
      weightKg: 0,
    };
  }

  function calcOrderSummary(items) {
    const list = Array.isArray(items) ? items : [];
    const materialsTotal = list
      .filter((i) => i.type !== "addon")
      .reduce((s, i) => s + Number(i.materialCost || 0), 0);
    const processingTotal = list.reduce((s, i) => s + Number(i.processingCost || 0), 0);
    const subtotal = list.reduce((s, i) => s + Number(i.subtotal || 0), 0);
    const vat = 0;
    const totalWeight = list.reduce((s, i) => s + Number(i.weightKg || 0), 0);
    const grandTotal = subtotal;

    return {
      materialsTotal,
      processingTotal,
      subtotal,
      vat,
      totalWeight,
      grandTotal,
    };
  }

  return {
    getPricePerM2,
    isBoardCustomSize,
    calcMaterialCost,
    calcProcessingCost,
    calcWeightKg,
    calcOptionsPrice,
    calcItemDetail,
    calcAddonDetail,
    calcOrderSummary,
  };
}
