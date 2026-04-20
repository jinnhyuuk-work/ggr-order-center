import { getTieredPrice, evaluateSelectionPricing } from "./shared.js";

export function createDoorPricingHelpers({
  materials = {},
  priceTiersByCategory = {},
  processingServices = {},
  optionCatalog = {},
  hingePricePerHole = 0,
  cloneDoorHingeConfig = (config) => JSON.parse(JSON.stringify(config || {})),
} = {}) {
  function getDoorTierPrice(material, width, length) {
    const tiers = priceTiersByCategory[material?.category] || [];
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
    const areaM2 = (Number(width || 0) / 1000) * (Number(length || 0) / 1000);
    const { price, isCustom } = getDoorTierPrice(material, width, length);
    const materialCost = Number(price || 0) * Number(quantity || 0);
    return { areaM2, materialCost, price, isCustom };
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
      doorHingeConfig = null,
    } = input;

    const { areaM2, materialCost, isCustom } = calcMaterialCost({
      materialId,
      width,
      length,
      quantity,
      thickness,
    });
    if (Number.isNaN(materialCost)) {
      return { error: "금액 계산에 실패했습니다. 입력값을 확인해주세요." };
    }

    const { processingCost, hasConsult: hasConsultProcessingService } = calcProcessingCost({
      quantity,
      services,
      serviceDetails,
    });
    const doorHingeCost = calcDoorHingeCost({ quantity, doorHingeConfig });
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
    const appliedDoorHingeCost = isCustom ? 0 : doorHingeCost;
    const appliedProcessingServiceCost =
      (isCustom || hasConsultProcessingService ? 0 : processingCost) + appliedDoorHingeCost;
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
      doorHingeCost: appliedDoorHingeCost,
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
      doorHingeConfig: cloneDoorHingeConfig(doorHingeConfig),
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
    getDoorTierPrice,
    formatDoorPriceTierLines,
    calcMaterialCost,
    calcProcessingCost,
    calcWeightKg,
    getDoorHingeValidHoleCount,
    calcDoorHingeCost,
    calcOptionsPrice,
    calcItemDetail,
    calcAddonDetail,
    calcOrderSummary,
  };
}
