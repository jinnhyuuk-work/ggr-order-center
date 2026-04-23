import {
  buildOrderSummary,
  buildStandardProductPricingBreakdown,
  calculateSheetAreaMetrics,
  evaluateProcessingServicePricing,
  formatSelectedItemLabel,
  getTieredPrice,
  evaluateSelectionPricing,
  normalizeQuantity,
} from "./shared.js?v=20260423g-html";
import { getEnabledPromotionRules } from "./data/promotion-data.js";

export function createDoorPricingHelpers({
  materials = {},
  priceTiersByCategory = {},
  processingServices = {},
  optionCatalog = {},
  hingePricePerHole = 0,
  cloneDoorHingeConfig = (config) => JSON.parse(JSON.stringify(config || {})),
} = {}) {
  const promotionRules = getEnabledPromotionRules();
  function getDoorTierPrice(material, width, length) {
    const tiers =
      material?.pricingRule && Array.isArray(material.pricingRule.tiers)
        ? material.pricingRule.tiers
        : priceTiersByCategory[material?.category] || [];
    return getTieredPrice({ tiers, width, length, customLabel: "비규격 상담안내" });
  }

  function formatDoorPriceTierLines(category) {
    const tiers = priceTiersByCategory[category] || [];
    const tierLines = tiers.map(
      (tier) => `${tier.maxWidth}×${tier.maxLength} 이하 ${Number(tier.price || 0).toLocaleString()}원`
    );
    return [...tierLines, "비규격 상담안내"];
  }

  function calcMaterialCost({ materialId, width, length, quantity }) {
    const material = materials[materialId];
    if (!material) {
      return { areaM2: 0, materialCost: 0, error: "도어를 선택해주세요." };
    }
    const { areaM2 } = calculateSheetAreaMetrics({ width, length });
    const { price, isCustom } = getDoorTierPrice(material, width, length);
    const materialCost = Number(price || 0) * Number(quantity || 0);
    return { areaM2, materialCost, price, isCustom };
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

  function getDoorHingeValidHoleCount(doorHingeConfig) {
    const holes = Array.isArray(doorHingeConfig?.holes) ? doorHingeConfig.holes : [];
    return holes.filter((hole) => Number.isFinite(Number(hole?.verticalDistance)) && Number(hole.verticalDistance) > 0)
      .length;
  }

  function calcDoorHingeCost({ quantity, doorHingeConfig }) {
    const holeCount = getDoorHingeValidHoleCount(doorHingeConfig);
    return holeCount * Number(hingePricePerHole || 0) * Number(quantity || 0);
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
      doorHingeConfig = null,
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
    if (Number.isNaN(materialCost)) {
      return { error: "금액 계산에 실패했습니다. 입력값을 확인해주세요." };
    }

    const { processingCost, hasConsult: hasConsultProcessingService } = calcProcessingCost({
      quantity: unitQuantity,
      services,
      serviceDetails,
    });
    const doorHingeCost = calcDoorHingeCost({ quantity: unitQuantity, doorHingeConfig });
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
        {
          key: "doorHingeCost",
          amount: doorHingeCost,
        },
      ],
      isCustomPrice: isCustom,
      hasConsultOption,
      roundingUnit: 10,
      promotionRules,
      promotionContext: {
        page: "door",
        targetType: "material",
        materialId,
        materialCategory: String(materials?.[materialId]?.category || ""),
      },
      includeDiscountMeta,
    });
    const { processingComponentCosts, processingComponentBaseCosts, ...publicPricingBreakdown } = pricingBreakdown;
    const appliedDoorHingeCost = processingComponentCosts.doorHingeCost || 0;
    const appliedProcessingServiceCost =
      (processingComponentCosts.processingServiceCost || 0) + appliedDoorHingeCost;

    return {
      areaM2,
      ...publicPricingBreakdown,
      processingServiceCost: appliedProcessingServiceCost,
      serviceCost: appliedProcessingServiceCost,
      doorHingeCost: appliedDoorHingeCost,
      doorHingeConfig: cloneDoorHingeConfig(doorHingeConfig),
      optionsLabel: formatOptionsLabel(options),
      options,
    };
  }

  const calcOrderSummary = (items) => buildOrderSummary(items);

  return {
    getDoorTierPrice,
    formatDoorPriceTierLines,
    calcMaterialCost,
    calcProcessingCost,
    getDoorHingeValidHoleCount,
    calcDoorHingeCost,
    calcOptionsPrice,
    calcItemDetail,
    calcOrderSummary,
  };
}
