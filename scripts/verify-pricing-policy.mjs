import assert from "node:assert/strict";

import {
  BOARD_DIMENSION_LIMITS,
  BOARD_OPTIONS,
  MATERIALS as BOARD_MATERIALS,
} from "../assets/js/data/board-data.js";
import { createBoardPricingHelpers } from "../assets/js/board-pricing.js";
import { TOP_PRICING_POLICY } from "../assets/js/data/top-data.js";
import {
  DOOR_PRICE_TIERS_BY_CATEGORY,
  DOOR_PRICING_POLICY,
} from "../assets/js/data/door-data.js";
import {
  SYSTEM_ADDON_ITEM_IDS,
  SYSTEM_POST_BAR_HEIGHT_LIMITS,
} from "../assets/js/data/system-data.js";
import { createSystemPricingHelpers } from "../assets/js/system-pricing.js";
import { createSystemOrderHelpers } from "../assets/js/system-order-helpers.js";
import {
  buildConsultAwarePricing,
  CONSULT_DISPLAY_PRICE_LABEL,
  hasConsultLineItem,
  isConsultLineItem,
} from "../assets/js/shared.js";
import {
  TOP_FULFILLMENT_POLICY,
  BOARD_FULFILLMENT_POLICY,
  DOOR_FULFILLMENT_POLICY,
  SYSTEM_FULFILLMENT_POLICY,
} from "../assets/js/data/fulfillment-policy-data.js";

function ceilToUnit(value, unit = 1) {
  if (!value) return 0;
  return Math.ceil(value / unit) * unit;
}

function calcBoardMaterialCost({ materialId, width, length, quantity }) {
  const material = BOARD_MATERIALS[materialId];
  return (width / 1000) * (length / 1000) * Number(material.pricePerM2 || 0) * quantity;
}

function getDoorTierPrice(category, width, length) {
  const tier = DOOR_PRICE_TIERS_BY_CATEGORY[category].find(
    (candidate) => width <= candidate.maxWidth && length <= candidate.maxLength
  );
  return tier ? { price: tier.price, isConsult: false } : { price: 0, isConsult: true };
}

function getTopChargeableLengthMm({ shape, width, length, length2 = 0, length3 = 0 }) {
  if (shape === "u") return Math.max(0, length + length2 + length3 - width * 2);
  if (shape === "l" || shape === "rl") return Math.max(0, length + length2 - width);
  return Math.max(0, length);
}

function calcTopBaseCost({ category, shape, width, length, length2 = 0, length3 = 0 }) {
  const chargeableLengthMm = getTopChargeableLengthMm({ shape, width, length, length2, length3 });
  const unitPrice = TOP_PRICING_POLICY.unitPriceByCategory[category] || 0;
  return ceilToUnit(
    (chargeableLengthMm / 1000) * unitPrice,
    TOP_PRICING_POLICY.roundingUnitWon
  );
}

function calcTopShapeAdditionalFee(shape) {
  return Number(TOP_PRICING_POLICY.shapeAdditionalFeeByShape?.[shape] || 0);
}

function run() {
  const boardPricing = createBoardPricingHelpers({
    materials: BOARD_MATERIALS,
    optionCatalog: BOARD_OPTIONS.reduce((acc, option) => {
      if (option?.id) acc[option.id] = option;
      return acc;
    }, {}),
    dimensionLimits: BOARD_DIMENSION_LIMITS,
  });
  assert.equal(calcBoardMaterialCost({
    materialId: "lpm_basic",
    width: 1000,
    length: 1000,
    quantity: 1,
  }), 47000);
  assert.equal(calcBoardMaterialCost({
    materialId: "pp_twill",
    width: 1000,
    length: 1000,
    quantity: 1,
  }), 45000);
  assert.equal(boardPricing.getPricePerM2(BOARD_MATERIALS.lpm_basic, 18), 47000);
  const boardDetail = boardPricing.calcItemDetail({
    materialId: "lpm_basic",
    width: 1000,
    length: 1000,
    thickness: 18,
    quantity: 1,
  });
  assert.deepEqual({
    ...boardDetail,
    weightKg: Math.round(Number(boardDetail.weightKg || 0) * 100) / 100,
  }, {
    areaM2: 1,
    materialCost: 47000,
    processingCost: 0,
    optionCost: 0,
    processingServiceCost: 0,
    serviceCost: 0,
    subtotal: 47000,
    vat: 0,
    total: 47000,
    weightKg: 12.96,
    isCustomPrice: false,
    hasConsultItems: false,
    itemHasConsult: false,
    optionHasConsult: false,
    processingServiceHasConsult: false,
    serviceHasConsult: false,
    optionsLabel: "-",
    options: [],
  });
  assert.equal(boardPricing.calcItemDetail({
    materialId: "lpm_basic",
    width: BOARD_DIMENSION_LIMITS.maxWidth + 1,
    length: 1000,
    thickness: 18,
    quantity: 1,
  }).isCustomPrice, true);

  assert.equal(calcTopBaseCost({
    category: "인조대리석",
    shape: "i",
    width: 600,
    length: 1000,
  }), 147000);
  assert.equal(calcTopBaseCost({
    category: "하이막스",
    shape: "l",
    width: 600,
    length: 1200,
    length2: 1000,
  }), 336000);
  assert.equal(TOP_PRICING_POLICY.standardThicknessMm, 12);
  assert.equal(TOP_PRICING_POLICY.standardWidthMaxMm, 760);
  assert.equal(TOP_PRICING_POLICY.shapeAdditionalFeeByShape.l, 30000);
  assert.equal(calcTopShapeAdditionalFee("l"), 30000);
  assert.equal(calcTopShapeAdditionalFee("rl"), 30000);
  assert.equal(calcTopShapeAdditionalFee("u"), 0);
  assert.equal(
    TOP_PRICING_POLICY.categoryDescriptionByCategory["인조대리석"],
    `${TOP_PRICING_POLICY.standardThicknessMm}T 기준 · 깊이 ${TOP_PRICING_POLICY.standardWidthMaxMm}mm 이하 m당 147,000원`
  );

  assert.deepEqual(getDoorTierPrice("LX PET", 300, 800), {
    price: 35000,
    isConsult: false,
  });
  assert.deepEqual(getDoorTierPrice("LX PET", 601, 800), {
    price: 0,
    isConsult: true,
  });
  assert.deepEqual(getDoorTierPrice("LX PET", 600, 801), {
    price: 0,
    isConsult: true,
  });
  assert.equal(DOOR_PRICING_POLICY.hingePricePerHole, 1500);

  const systemPricing = createSystemPricingHelpers({
    limits: {
      shelf: { maxLength: 2400 },
    },
    shelfLengthMm: 400,
    postBarPriceMaxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.consultAt,
    addonClothesRodId: SYSTEM_ADDON_ITEM_IDS.CLOTHES_ROD,
  });
  const shelfDetail = systemPricing.calcBayDetail({
    shelf: {
      materialId: "lpm_basic",
      width: 600,
      length: 400,
      thickness: 18,
      count: 1,
    },
    quantity: 1,
    addons: [],
    isCorner: false,
  });
  assert.equal(shelfDetail.materialCost, 28000);
  assert.equal(shelfDetail.isCustomPrice, false);

  const shelfWithAddonDetail = systemPricing.calcBayDetail({
    shelf: {
      materialId: "lpm_basic",
      width: 600,
      length: 400,
      thickness: 18,
      count: 1,
    },
    quantity: 1,
    addons: [SYSTEM_ADDON_ITEM_IDS.CLOTHES_ROD],
    isCorner: false,
  });
  assert.equal(shelfWithAddonDetail.materialCost, 28000);
  assert.equal(shelfWithAddonDetail.processingCost, 5000);
  assert.equal(shelfWithAddonDetail.total, 33000);

  const wideShelfDetail = systemPricing.calcBayDetail({
    shelf: {
      materialId: "lpm_basic",
      width: 801,
      length: 400,
      thickness: 18,
      count: 1,
    },
    quantity: 1,
    addons: [],
    isCorner: false,
  });
  assert.equal(wideShelfDetail.materialCost, 0);
  assert.equal(wideShelfDetail.isCustomPrice, true);

  const postBarDetail = systemPricing.calcColumnsDetail({
    column: {
      materialId: "post_bar_white",
      width: 20,
      thickness: 18,
      length: 2600,
    },
    count: 1,
    quantity: 1,
    bays: [],
  });
  assert.equal(postBarDetail.isCustomPrice, true);

  assert.deepEqual(buildConsultAwarePricing({
    materialCost: 1000,
    processingCost: 500,
    total: 1500,
    isCustomPrice: false,
  }), {
    materialCost: 1000,
    processingCost: 500,
    total: 1500,
    isCustomPrice: false,
    displayPriceLabel: null,
  });
  assert.deepEqual(buildConsultAwarePricing({
    materialCost: 1000,
    processingCost: 500,
    total: 5000,
    isCustomPrice: false,
    extraCosts: {
      componentCost: 1500,
      furnitureCost: 2000,
    },
  }), {
    materialCost: 1000,
    processingCost: 500,
    componentCost: 1500,
    furnitureCost: 2000,
    total: 5000,
    isCustomPrice: false,
    displayPriceLabel: null,
  });
  assert.deepEqual(buildConsultAwarePricing({
    materialCost: 1000,
    processingCost: 500,
    total: 1500,
    isCustomPrice: true,
  }), {
    materialCost: null,
    processingCost: null,
    total: null,
    isCustomPrice: true,
    displayPriceLabel: CONSULT_DISPLAY_PRICE_LABEL,
  });
  assert.deepEqual(buildConsultAwarePricing({
    materialCost: 1000,
    processingCost: 500,
    total: 5000,
    isCustomPrice: true,
    extraCosts: {
      componentCost: 1500,
      furnitureCost: 2000,
    },
  }), {
    materialCost: null,
    processingCost: null,
    componentCost: null,
    furnitureCost: null,
    total: null,
    isCustomPrice: true,
    displayPriceLabel: CONSULT_DISPLAY_PRICE_LABEL,
  });
  assert.equal(isConsultLineItem({ isCustomPrice: true }), true);
  assert.equal(isConsultLineItem({ hasConsultItems: true }), true);
  assert.equal(isConsultLineItem({ isCustomPrice: false, hasConsultItems: false }), false);
  assert.equal(hasConsultLineItem([{ isCustomPrice: false }, { hasConsultItems: true }]), true);

  const systemOrderHelpers = createSystemOrderHelpers({
    buildConsultAwarePricing,
    hasConsultLineItem,
    calcAddonCostBreakdown: () => ({ componentCost: 0, furnitureCost: 0 }),
    buildOrderPayloadBase: ({ pageKey, customer, summary }) => ({
      pageKey,
      customer,
      totals: summary,
    }),
    buildLayoutSpecLinesFromSnapshot: () => [],
    formatColumnSize: () => "-",
    buildCustomerEmailSectionLines: () => [],
    formatFulfillmentLine: () => "",
  });
  const systemPayload = systemOrderHelpers.buildOrderPayload({
    customer: {},
    summary: {},
    displayItems: [
      {
        id: "system-consult-line",
        groupId: "group-1",
        quantity: 1,
        isCustomPrice: true,
        materialCost: 1000,
        processingCost: 2000,
        componentCost: 3000,
        furnitureCost: 4000,
        total: 10000,
      },
    ],
  });
  assert.deepEqual(systemPayload.items[0].pricing, {
    materialCost: null,
    processingCost: null,
    componentCost: null,
    furnitureCost: null,
    total: null,
    isCustomPrice: true,
    displayPriceLabel: CONSULT_DISPLAY_PRICE_LABEL,
  });

  const groupedSystemItems = systemOrderHelpers.buildSystemGroupDisplayItems([
    {
      id: "system-consult-part",
      type: "bay",
      groupId: "group-2",
      quantity: 1,
      hasConsultItems: true,
      isCustomPrice: false,
      shelf: {
        materialId: "lpm_basic",
        width: 600,
        length: 400,
        thickness: 18,
        count: 1,
      },
      addons: [],
    },
  ]);
  assert.equal(groupedSystemItems[0].isCustomPrice, false);
  assert.equal(groupedSystemItems[0].hasConsultItems, true);

  assert.equal(TOP_FULFILLMENT_POLICY.installationAmount, 50000);
  assert.equal(BOARD_FULFILLMENT_POLICY.consultReason, "합판 서비스는 상담 안내입니다.");
  assert.equal(DOOR_FULFILLMENT_POLICY.delivery.groupedFee.groupPrice, 7000);
  assert.equal(SYSTEM_FULFILLMENT_POLICY.delivery.postBarGroupedFee.groupPrice, 8000);
}

run();
console.log("pricing policy verification passed");
