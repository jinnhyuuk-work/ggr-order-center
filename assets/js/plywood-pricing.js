import {
  buildOrderSummary,
  buildStandardProductPricingBreakdown,
  calculateSheetAreaMetrics,
  evaluateProcessingServicePricing,
  evaluateSelectionPricing,
  formatSelectedItemLabel,
  normalizeQuantity,
  getTieredPrice,
} from "./shared.js";
import { getEnabledPromotionRules } from "./data/promotion-data.js";

export function createPlywoodPricingHelpers({
  materials = {},
  processingServices = {},
  optionCatalog = {},
  priceTiersByCategory = {},
  dimensionLimits = {},
} = {}) {
  const promotionRules = getEnabledPromotionRules();
  const customWidthMax = Number(dimensionLimits.maxWidth || 0);
  const customLengthMax = Number(dimensionLimits.maxLength || 0);

  function isPlywoodCustomSize(width, length) {
    return Number(width || 0) > customWidthMax || Number(length || 0) > customLengthMax;
  }

  function getPlywoodTierPrice(material, width, length) {
    const tiers =
      material?.pricingRule && Array.isArray(material.pricingRule.tiers)
        ? material.pricingRule.tiers
        : priceTiersByCategory[material?.category] || [];
    return getTieredPrice({ tiers, width, length, customLabel: "비규격 상담안내" });
  }

  function formatPlywoodPriceTierLines(category) {
    const tiers = priceTiersByCategory[category] || [];
    const tierLines = tiers.map(
      (tier) => `${tier.maxWidth}×${tier.maxLength} 이하 ${Number(tier.price || 0).toLocaleString()}원`
    );
    return [...tierLines, "비규격 상담안내"];
  }

  function calcMaterialCost({ materialId, width, length, quantity, thickness }) {
    const material = materials[materialId];
    const { areaM2 } = calculateSheetAreaMetrics({ width, length });
    if (isPlywoodCustomSize(width, length)) {
      return { areaM2, materialCost: 0, isCustom: true };
    }
    const { price, isCustom } = getPlywoodTierPrice(material, width, length);
    const materialCost = Number(price || 0) * Number(quantity || 0);
    return { areaM2, materialCost, isCustom };
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
        page: "plywood",
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
    isPlywoodCustomSize,
    getPlywoodTierPrice,
    formatPlywoodPriceTierLines,
    calcMaterialCost,
    calcProcessingCost,
    calcOptionsPrice,
    calcItemDetail,
    calcOrderSummary,
  };
}
