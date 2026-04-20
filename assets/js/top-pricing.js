import { evaluateSelectionPricing } from "./shared.js";

export function createTopPricingHelpers({
  topTypes = [],
  pricingPolicy = {},
  customLengthMax = 0,
  processingServices = {},
  optionCatalog = {},
  backShelfServiceId = "top_back_shelf",
  validateTopInputs = () => null,
  formatProcessingServiceList = () => "-",
  getBackHeightFromServiceDetail = (detail) => Number(detail?.height || 0),
} = {}) {
  const standardThicknessMm = Number(pricingPolicy.standardThicknessMm || 0);
  const standardWidthMaxMm = Number(pricingPolicy.standardWidthMaxMm || 0);
  const roundingUnitWon = Number(pricingPolicy.roundingUnitWon || 1);
  const unitPriceByCategory = pricingPolicy.unitPriceByCategory || {};
  const shapeAdditionalFeeByShape = pricingPolicy.shapeAdditionalFeeByShape || {};

  function getBackHeightLimit(width) {
    return Math.max(0, standardWidthMaxMm - Number(width || 0));
  }

  function isBackShelfConsult({ serviceId, detail, width }) {
    if (serviceId !== backShelfServiceId) return false;
    const height = getBackHeightFromServiceDetail(detail);
    if (height <= 0) return false;
    return height > getBackHeightLimit(width);
  }

  function calcProcessingServiceCost({ services = [], serviceDetails = {}, quantity = 1, width = 0 }) {
    const { amount, hasConsult } = evaluateSelectionPricing({
      selectedIds: services,
      resolveById: (id) => processingServices[id],
      quantity,
      availabilityContext: ({ id }) => ({
        serviceId: id,
        detail: serviceDetails?.[id],
        width,
      }),
      resolveAvailability: ({ rule, context }) => {
        if (rule?.ruleKey === "top_back_height_limit") {
          return isBackShelfConsult({
            serviceId: context?.serviceId,
            detail: context?.detail,
            width: context?.width,
          })
            ? "consult"
            : "ok";
        }
        return rule?.defaultStatus || "ok";
      },
      getAmount: ({ id, item, quantity: qty }) => {
        const detail = serviceDetails?.[id];
        return item.calcProcessingCost(qty, detail);
      },
    });
    return { processingCost: amount, hasConsult };
  }

  function getTopUnitPrice(type) {
    if (!type) return 0;
    return unitPriceByCategory[type.category] || 0;
  }

  function getTopStandardPriceLine(type, formatPrice = (value) => Number(value || 0).toLocaleString()) {
    const unitPrice = getTopUnitPrice(type);
    return unitPrice ? `깊이 ${standardWidthMaxMm}mm 이하 m당 ${formatPrice(unitPrice)}원` : "가격 정보 준비중";
  }

  function getChargeableLengthMm({ shape, width, length, length2 = 0, length3 = 0 }) {
    const safeWidth = Number(width || 0);
    const safeLength = Number(length || 0);
    const safeLength2 = Number(length2 || 0);
    const safeLength3 = Number(length3 || 0);
    if (shape === "u") {
      return Math.max(0, safeLength + safeLength2 + safeLength3 - safeWidth * 2);
    }
    if (shape === "l" || shape === "rl") {
      return Math.max(0, safeLength + safeLength2 - safeWidth);
    }
    return Math.max(0, safeLength);
  }

  function ceilToUnit(value, unit = roundingUnitWon) {
    const safeValue = Number(value || 0);
    if (safeValue <= 0) return 0;
    return Math.ceil(safeValue / unit) * unit;
  }

  function isTopCustomSize({ type, shape, thickness, width, length, length2 = 0, length3 = 0 }) {
    if (Number(thickness) !== standardThicknessMm) return true;
    if (Number(width) > standardWidthMaxMm) return true;
    if (length > customLengthMax) return true;
    if ((shape === "l" || shape === "rl" || shape === "u") && length2 > customLengthMax) return true;
    if (shape === "u" && length3 > customLengthMax) return true;
    if (!getTopUnitPrice(type)) return true;
    return false;
  }

  function calcTopDetail(input) {
    const {
      typeId,
      shape,
      width,
      length,
      length2,
      length3,
      thickness,
      options = [],
      backHeight = 0,
      useBackHeight = false,
      services = [],
      serviceDetails = {},
    } = input;
    const type = topTypes.find((t) => t.id === typeId);
    const err = validateTopInputs(input);
    if (!type || err) return { error: err || "필수 정보를 입력해주세요." };

    const isCustomPrice = isTopCustomSize({
      type,
      shape,
      thickness,
      width,
      length,
      length2,
      length3,
    });

    const { amount: optionPrice, hasConsult: hasConsultOption } = evaluateSelectionPricing({
      selectedIds: options,
      resolveById: (id) => optionCatalog[id],
    });
    const {
      processingCost: processingServiceCost,
      hasConsult: hasConsultProcessingService,
    } = calcProcessingServiceCost({
      services,
      serviceDetails,
      quantity: 1,
      width,
    });
    const itemCost = ceilToUnit(
      (getChargeableLengthMm({ shape, width, length, length2, length3 }) / 1000) * getTopUnitPrice(type)
    );
    const shapeFee = Number(shapeAdditionalFeeByShape?.[shape] || 0);
    const processingServiceCostRaw = shapeFee + processingServiceCost;
    const optionHasConsult = Boolean(isCustomPrice || hasConsultOption);
    const processingServiceHasConsult = Boolean(isCustomPrice || hasConsultProcessingService);
    const appliedOptionCost = optionHasConsult ? 0 : optionPrice;
    const appliedProcessingServiceCost = processingServiceHasConsult ? 0 : processingServiceCostRaw;
    const appliedProcessingCost = appliedOptionCost + appliedProcessingServiceCost;
    const materialCost = isCustomPrice ? 0 : itemCost + appliedProcessingCost;
    const subtotal = materialCost;
    const vat = 0;
    const total = isCustomPrice ? 0 : ceilToUnit(subtotal);
    const hasConsultItems = Boolean(isCustomPrice || optionHasConsult || processingServiceHasConsult);

    const displaySize = (() => {
      if (shape === "u") {
        return `${width}×${length} / ${width}×${length2} / ${width}×${length3}×${thickness}mm${
          useBackHeight ? ` · 뒷턱 ${backHeight}mm` : ""
        }`;
      }
      if (shape === "l" || shape === "rl") {
        return `${width}×${length} / ${width}×${length2}×${thickness}mm${
          useBackHeight ? ` · 뒷턱 ${backHeight}mm` : ""
        }`;
      }
      return `${width}×${length}×${thickness}mm${useBackHeight ? ` · 뒷턱 ${backHeight}mm` : ""}`;
    })();

    const optionLabels = options
      .map((id) => optionCatalog[id]?.name || id)
      .filter(Boolean);

    return {
      materialCost,
      subtotal,
      vat,
      total,
      displaySize,
      optionsLabel: optionLabels.length === 0 ? "-" : optionLabels.join(", "),
      servicesLabel: formatProcessingServiceList(services, serviceDetails, { includeNote: true }),
      serviceDetails,
      services,
      isCustomPrice,
      hasConsultItems,
      itemCost: isCustomPrice ? 0 : itemCost,
      optionCost: appliedOptionCost,
      processingServiceCost: appliedProcessingServiceCost,
      serviceCost: appliedProcessingServiceCost,
      itemHasConsult: Boolean(isCustomPrice),
      optionHasConsult,
      processingServiceHasConsult,
      serviceHasConsult: processingServiceHasConsult,
      useBackHeight,
      backHeight,
      processingCost: appliedProcessingCost,
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
    };
  }

  return {
    getBackHeightLimit,
    isBackShelfConsult,
    calcProcessingServiceCost,
    getTopUnitPrice,
    getTopStandardPriceLine,
    getChargeableLengthMm,
    isTopCustomSize,
    calcTopDetail,
    calcAddonDetail,
  };
}
