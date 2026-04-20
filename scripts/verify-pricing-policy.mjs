import assert from "node:assert/strict";

import { MATERIALS as BOARD_MATERIALS } from "../assets/js/data/board-data.js";
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

function run() {
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

  assert.equal(calcTopBaseCost({
    category: "인조대리석",
    shape: "i",
    width: 600,
    length: 1000,
  }), 147000);
  assert.equal(TOP_PRICING_POLICY.standardThicknessMm, 12);
  assert.equal(TOP_PRICING_POLICY.standardWidthMaxMm, 760);
  assert.equal(TOP_PRICING_POLICY.shapeAdditionalFeeByShape.l, 30000);

  assert.deepEqual(getDoorTierPrice("LX PET", 300, 800), {
    price: 35000,
    isConsult: false,
  });
  assert.deepEqual(getDoorTierPrice("LX PET", 601, 800), {
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

  assert.equal(TOP_FULFILLMENT_POLICY.installationAmount, 50000);
  assert.equal(BOARD_FULFILLMENT_POLICY.consultReason, "합판 서비스는 상담 안내입니다.");
  assert.equal(DOOR_FULFILLMENT_POLICY.delivery.groupedFee.groupPrice, 7000);
  assert.equal(SYSTEM_FULFILLMENT_POLICY.delivery.postBarGroupedFee.groupPrice, 8000);
}

run();
console.log("pricing policy verification passed");
