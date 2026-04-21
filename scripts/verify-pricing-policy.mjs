import assert from "node:assert/strict";

import {
  BOARD_DIMENSION_LIMITS,
  BOARD_OPTIONS,
  MATERIALS as BOARD_MATERIALS,
} from "../assets/js/data/board-data.js";
import { createBoardPricingHelpers } from "../assets/js/board-pricing.js";
import {
  TOP_DIMENSION_LIMITS,
  TOP_OPTIONS,
  TOP_PRICING_POLICY,
  TOP_TYPES,
} from "../assets/js/data/top-data.js";
import { createTopPricingHelpers } from "../assets/js/top-pricing.js";
import {
  DOOR_MATERIALS,
  DOOR_OPTIONS,
  DOOR_PRICE_TIERS_BY_CATEGORY,
  DOOR_PRICING_POLICY,
} from "../assets/js/data/door-data.js";
import { createDoorPricingHelpers } from "../assets/js/door-pricing.js";
import {
  SYSTEM_ADDON_ITEM_IDS,
  SYSTEM_ADDON_ITEMS,
  SYSTEM_POST_BAR_PRICING,
  SYSTEM_POST_BAR_HEIGHT_LIMITS,
  SYSTEM_SHELF_MATERIALS,
} from "../assets/js/data/system-data.js";
import { COMMON_ADDON_ITEMS } from "../assets/js/data/addon-data.js";
import { createSystemPricingHelpers } from "../assets/js/system-pricing.js";
import { createSystemOrderHelpers } from "../assets/js/system-order-helpers.js";
import {
  buildAddonLineItemDetail,
  buildConsultAwarePricing,
  CONSULT_DISPLAY_PRICE_LABEL,
  hasConsultLineItem,
  isConsultLineItem,
  resolveAmountFromPriceRule,
} from "../assets/js/shared.js";
import {
  TOP_FULFILLMENT_POLICY,
  BOARD_FULFILLMENT_POLICY,
  DOOR_FULFILLMENT_POLICY,
  SYSTEM_FULFILLMENT_POLICY,
} from "../assets/js/data/fulfillment-policy-data.js";

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
  const boardMaterialDetail = boardPricing.calcMaterialCost({
    materialId: "lpm_basic",
    width: 1000,
    length: 1000,
    quantity: 1,
  });
  assert.equal(boardMaterialDetail.materialCost, 47000);
  const boardMaterialDetailPp = boardPricing.calcMaterialCost({
    materialId: "pp_twill",
    width: 1000,
    length: 1000,
    quantity: 1,
  });
  assert.equal(boardMaterialDetailPp.materialCost, 45000);
  assert.equal(
    boardMaterialDetail.materialCost,
    Number(BOARD_MATERIALS.lpm_basic.pricingRule.value || 0)
  );
  const boardDetail = boardPricing.calcItemDetail({
    materialId: "lpm_basic",
    width: 1000,
    length: 1000,
    thickness: 18,
    quantity: 1,
  });
  assert.deepEqual(boardDetail, {
    areaM2: 1,
    materialCost: 47000,
    processingCost: 0,
    optionCost: 0,
    processingServiceCost: 0,
    serviceCost: 0,
    subtotal: 47000,
    vat: 0,
    total: 47000,
    roundingUnit: 10,
    consult: {
      status: "ok",
      hasItems: false,
      displayLabel: null,
      item: false,
      option: false,
      processingService: false,
    },
    consultStatus: "ok",
    consultDisplayLabel: null,
    displayPriceLabel: null,
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
  const artificialTopType = TOP_TYPES.find((type) => type.category === "인조대리석");
  const himacsTopType = TOP_TYPES.find((type) => type.category === "하이막스");
  const topPricing = createTopPricingHelpers({
    topTypes: TOP_TYPES,
    pricingPolicy: TOP_PRICING_POLICY,
    customLengthMax: TOP_DIMENSION_LIMITS.maxLength,
    optionCatalog: TOP_OPTIONS.reduce((acc, option) => {
      if (option?.id) acc[option.id] = option;
      return acc;
    }, {}),
  });
  assert.equal(topPricing.calcTopDetail({
    typeId: artificialTopType.id,
    shape: "i",
    width: 600,
    length: 1000,
    thickness: 12,
  }).itemCost, 147000);
  assert.equal(topPricing.calcTopDetail({
    typeId: himacsTopType.id,
    shape: "l",
    width: 600,
    length: 1200,
    length2: 1000,
    thickness: 12,
  }).itemCost, 336000);
  assert.equal(topPricing.getChargeableLengthMm({
    shape: "i",
    width: 600,
    length: 1000,
  }), 1000);
  assert.equal(topPricing.getChargeableLengthMm({
    shape: "l",
    width: 600,
    length: 1200,
    length2: 1000,
  }), 1600);
  assert.equal(topPricing.getChargeableLengthMm({
    shape: "u",
    width: 600,
    length: 1200,
    length2: 1000,
    length3: 800,
  }), 1800);
  assert.equal(
    topPricing.getTopStandardPriceLine({ category: "인조대리석" }, (value) => value.toLocaleString()),
    "깊이 760mm 이하 m당 147,000원"
  );
  assert.equal(topPricing.isTopCustomSize({
    type: artificialTopType,
    shape: "i",
    thickness: 24,
    width: 600,
    length: 1000,
  }), true);

  const topDetail = topPricing.calcTopDetail({
    typeId: artificialTopType.id,
    shape: "l",
    width: 600,
    length: 1200,
    length2: 1000,
    thickness: 12,
    options: [],
  });
  assert.equal(topDetail.itemCost, 235200);
  assert.equal(topDetail.materialCost, 235200);
  assert.equal(topDetail.processingServiceCost, 30000);
  assert.equal(topDetail.processingCost, 30000);
  assert.equal(topDetail.total, 265200);
  const topConsultDetail = topPricing.calcTopDetail({
    typeId: artificialTopType.id,
    shape: "i",
    width: 600,
    length: 1000,
    thickness: 24,
    options: [],
  });
  assert.equal(topConsultDetail.isCustomPrice, true);

  const fixedAddonDetail = buildAddonLineItemDetail({
    addon: COMMON_ADDON_ITEMS.find((item) => item.id === "hinge_basic"),
    quantity: 2,
  });
  assert.equal(fixedAddonDetail.materialCost, 4000);
  assert.equal(fixedAddonDetail.total, 4000);
  assert.equal(fixedAddonDetail.consultStatus, "ok");

  const doorPricing = createDoorPricingHelpers({
    materials: DOOR_MATERIALS,
    priceTiersByCategory: DOOR_PRICE_TIERS_BY_CATEGORY,
    optionCatalog: DOOR_OPTIONS.reduce((acc, option) => {
      if (option?.id) acc[option.id] = option;
      return acc;
    }, {}),
    hingePricePerHole: DOOR_PRICING_POLICY.hingePricePerHole,
    cloneDoorHingeConfig: (config) => JSON.parse(JSON.stringify(config || { holes: [] })),
  });
  const lxPetMaterial = Object.values(DOOR_MATERIALS).find((material) => material.category === "LX PET");
  assert.deepEqual(doorPricing.getDoorTierPrice(lxPetMaterial, 300, 800), {
    price: 35000,
    isCustom: false,
    label: "",
  });
  assert.deepEqual(doorPricing.getDoorTierPrice(lxPetMaterial, 601, 800), {
    price: 0,
    isCustom: true,
    label: "비규격 상담안내",
  });
  assert.deepEqual(doorPricing.getDoorTierPrice(lxPetMaterial, 600, 801), {
    price: 0,
    isCustom: true,
    label: "비규격 상담안내",
  });
  assert.deepEqual(doorPricing.formatDoorPriceTierLines("LX PET"), [
    "300×800 이하 35,000원",
    "400×800 이하 40,000원",
    "600×800 이하 45,000원",
    "비규격 상담안내",
  ]);
  assert.equal(DOOR_PRICING_POLICY.hingePricePerHole, 1500);
  const doorDetail = doorPricing.calcItemDetail({
    materialId: lxPetMaterial.id,
    width: 300,
    length: 800,
    thickness: 18,
    quantity: 1,
    doorHingeConfig: {
      holes: [
        { verticalDistance: 100 },
        { verticalDistance: 700 },
      ],
    },
  });
  assert.equal(doorDetail.materialCost, 35000);
  assert.equal(doorDetail.doorHingeCost, 3000);
  assert.equal(doorDetail.total, 38000);
  assert.equal(doorPricing.calcItemDetail({
    materialId: lxPetMaterial.id,
    width: 601,
    length: 800,
    thickness: 18,
    quantity: 1,
  }).isCustomPrice, true);

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
  assert.equal(
    shelfDetail.materialCost,
    Number(SYSTEM_SHELF_MATERIALS.lpm_basic?.priceByTierKey?.lte_600 || 0)
  );
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
  assert.equal(
    shelfWithAddonDetail.materialCost,
    Number(SYSTEM_SHELF_MATERIALS.lpm_basic?.priceByTierKey?.lte_600 || 0)
  );
  assert.equal(shelfWithAddonDetail.processingCost, 4000);
  assert.equal(
    shelfWithAddonDetail.total,
    Number(SYSTEM_SHELF_MATERIALS.lpm_basic?.priceByTierKey?.lte_600 || 0) + 4000
  );

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
  assert.equal(
    Number(SYSTEM_POST_BAR_PRICING.basic?.tiers?.[0]?.unitPrice || 0),
    17400
  );
  const systemFurnitureItem = SYSTEM_ADDON_ITEMS.find((item) => item.id === "drawer_hanging_1tier");
  assert.equal(
    resolveAmountFromPriceRule({
      config: systemFurnitureItem,
      quantity: 2,
      metrics: {
        widthMm: 600,
        categoryKey: "lpm_basic",
      },
    }),
    116000
  );
  assert.equal(
    resolveAmountFromPriceRule({
      config: systemFurnitureItem,
      quantity: 1,
      metrics: {
        widthMm: 700,
        categoryKey: "lpm_basic",
      },
    }),
    0
  );

  assert.deepEqual(buildConsultAwarePricing({
    materialCost: 1000,
    processingCost: 500,
    total: 1500,
    isCustomPrice: false,
  }), {
    materialCost: 1000,
    processingCost: 500,
    total: 1500,
    consult: {
      status: "ok",
      hasItems: false,
      displayLabel: null,
      item: false,
      option: false,
      processingService: false,
    },
    consultStatus: "ok",
    consultDisplayLabel: null,
    displayPriceLabel: null,
    isCustomPrice: false,
    hasConsultItems: false,
    itemHasConsult: false,
    optionHasConsult: false,
    processingServiceHasConsult: false,
    serviceHasConsult: false,
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
    consult: {
      status: "ok",
      hasItems: false,
      displayLabel: null,
      item: false,
      option: false,
      processingService: false,
    },
    consultStatus: "ok",
    consultDisplayLabel: null,
    displayPriceLabel: null,
    isCustomPrice: false,
    hasConsultItems: false,
    itemHasConsult: false,
    optionHasConsult: false,
    processingServiceHasConsult: false,
    serviceHasConsult: false,
  });
  assert.deepEqual(buildConsultAwarePricing({
    materialCost: 1000,
    processingCost: 500,
    total: 5000,
    isCustomPrice: false,
    extraCosts: {
      materialDiscountRate: 0.1,
      promotionRuleId: "sample_monthly_color_10",
    },
  }), {
    materialCost: 1000,
    processingCost: 500,
    materialDiscountRate: 0.1,
    promotionRuleId: "sample_monthly_color_10",
    total: 5000,
    consult: {
      status: "ok",
      hasItems: false,
      displayLabel: null,
      item: false,
      option: false,
      processingService: false,
    },
    consultStatus: "ok",
    consultDisplayLabel: null,
    displayPriceLabel: null,
    isCustomPrice: false,
    hasConsultItems: false,
    itemHasConsult: false,
    optionHasConsult: false,
    processingServiceHasConsult: false,
    serviceHasConsult: false,
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
    consult: {
      status: "consult",
      hasItems: true,
      displayLabel: CONSULT_DISPLAY_PRICE_LABEL,
      item: true,
      option: false,
      processingService: false,
    },
    consultStatus: "consult",
    consultDisplayLabel: CONSULT_DISPLAY_PRICE_LABEL,
    displayPriceLabel: CONSULT_DISPLAY_PRICE_LABEL,
    isCustomPrice: true,
    hasConsultItems: true,
    itemHasConsult: true,
    optionHasConsult: false,
    processingServiceHasConsult: false,
    serviceHasConsult: false,
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
    consult: {
      status: "consult",
      hasItems: true,
      displayLabel: CONSULT_DISPLAY_PRICE_LABEL,
      item: true,
      option: false,
      processingService: false,
    },
    consultStatus: "consult",
    consultDisplayLabel: CONSULT_DISPLAY_PRICE_LABEL,
    displayPriceLabel: CONSULT_DISPLAY_PRICE_LABEL,
    isCustomPrice: true,
    hasConsultItems: true,
    itemHasConsult: true,
    optionHasConsult: false,
    processingServiceHasConsult: false,
    serviceHasConsult: false,
  });
  assert.equal(isConsultLineItem({ isCustomPrice: true }), true);
  assert.equal(isConsultLineItem({ hasConsultItems: true }), true);
  assert.equal(isConsultLineItem({ consultStatus: "consult" }), true);
  assert.equal(isConsultLineItem({ isCustomPrice: false, hasConsultItems: false }), false);
  assert.equal(hasConsultLineItem([{ isCustomPrice: false }, { hasConsultItems: true }]), true);

  const systemOrderHelpers = createSystemOrderHelpers({
    buildConsultAwarePricing,
    hasConsultLineItem,
    calcAddonCostBreakdown: () => ({
      componentBaseCost: 0,
      componentCost: 0,
      componentDiscountCost: 0,
      furnitureBaseCost: 0,
      furnitureCost: 0,
      furnitureDiscountCost: 0,
    }),
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
    materialBaseCost: null,
    materialDiscountCost: null,
    materialDiscountRate: null,
    processingBaseCost: null,
    processingDiscountCost: null,
    componentBaseCost: null,
    componentCost: null,
    componentDiscountCost: null,
    furnitureBaseCost: null,
    furnitureCost: null,
    furnitureDiscountCost: null,
    total: null,
    consult: {
      status: "consult",
      hasItems: true,
      displayLabel: CONSULT_DISPLAY_PRICE_LABEL,
      item: true,
      option: false,
      processingService: false,
    },
    consultStatus: "consult",
    consultDisplayLabel: CONSULT_DISPLAY_PRICE_LABEL,
    displayPriceLabel: CONSULT_DISPLAY_PRICE_LABEL,
    isCustomPrice: true,
    hasConsultItems: true,
    itemHasConsult: true,
    optionHasConsult: false,
    processingServiceHasConsult: false,
    serviceHasConsult: false,
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
