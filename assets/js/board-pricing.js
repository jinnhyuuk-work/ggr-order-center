import {
  buildOrderSummary,
  buildStandardProductPricingBreakdown,
  calculateSheetAreaMetrics,
  evaluateProcessingServicePricing,
  evaluateSelectionPricing,
  formatSelectedItemLabel,
  normalizeQuantity,
  resolveAmountFromPriceRule,
} from "./shared.js";
import { getEnabledPromotionRules } from "./data/promotion-data.js";

export function createBoardPricingHelpers({
  materials = {},
  processingServices = {},
  optionCatalog = {},
  dimensionLimits = {},
} = {}) {
  const promotionRules = getEnabledPromotionRules();
  const customWidthMax = Number(dimensionLimits.maxWidth || 0);
  const customLengthMax = Number(dimensionLimits.maxLength || 0);

  function isBoardCustomSize(width, length) {
    return Number(width || 0) > customWidthMax || Number(length || 0) > customLengthMax;
  }

  function calcMaterialCost({ materialId, width, length, quantity, thickness }) {
    const material = materials[materialId];
    const { areaM2 } = calculateSheetAreaMetrics({ width, length });
    if (isBoardCustomSize(width, length)) {
      return { areaM2, materialCost: 0, isCustom: true };
    }
    const materialCost = Number(
      resolveAmountFromPriceRule({
        config: material,
        quantity,
        metrics: { areaM2 },
      })
    );
    return { areaM2, materialCost, isCustom: false };
  }

  function calcProcessingCost({
    quantity,
    services = [],
    serviceDetails = {},
  }) {
    const { amount, hasConsult } = evaluateProcessingServicePricing({
      selectedIds: services,
      servicesById: processingServices,
      serviceDetails,
      quantity,
    });
    return { processingCost: amount, hasConsult };
  }

  function formatOptionsLabel(options = []) {
    return formatSelectedItemLabel(options, optionCatalog);
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
      includeDiscountMeta = false,
    } = input;
    const unitQuantity = normalizeQuantity(quantity, 1);

    const { areaM2, materialCost, isCustom } = calcMaterialCost({
      materialId,
      width,
      length,
      quantity: unitQuantity,
      thickness,
    });

    const { processingCost, hasConsult: hasConsultProcessingService } = calcProcessingCost({
      quantity: unitQuantity,
      services,
      serviceDetails,
    });
    const { optionPrice, hasConsult: hasConsultOption } = calcOptionsPrice(options);

    const pricingBreakdown = buildStandardProductPricingBreakdown({
      materialBaseCost: materialCost,
      optionBaseCost: optionPrice,
      processingComponents: [
        {
          key: "processingServiceCost",
          amount: processingCost,
          hasConsult: hasConsultProcessingService,
        },
      ],
      isCustomPrice: isCustom,
      hasConsultOption,
      roundingUnit: 10,
      promotionRules,
      promotionContext: {
        page: "board",
        targetType: "material",
        materialId,
        materialCategory: String(materials?.[materialId]?.category || ""),
      },
      includeDiscountMeta,
    });
    const { processingComponentCosts, processingComponentBaseCosts, ...publicPricingBreakdown } = pricingBreakdown;

    return {
      areaM2,
      ...publicPricingBreakdown,
      processingServiceCost: processingComponentCosts.processingServiceCost || 0,
      serviceCost: processingComponentCosts.processingServiceCost || 0,
      optionsLabel: formatOptionsLabel(options),
      options,
    };
  }

  const calcOrderSummary = (items) => buildOrderSummary(items);

  return {
    isBoardCustomSize,
    calcMaterialCost,
    calcProcessingCost,
    calcOptionsPrice,
    calcItemDetail,
    calcOrderSummary,
  };
}
