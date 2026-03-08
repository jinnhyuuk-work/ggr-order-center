import {
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  SYSTEM_POST_BAR_PRICING,
  SYSTEM_SHELF_TIER_PRICING,
  SYSTEM_ADDON_ITEMS,
} from "./data/system-data.js";
import { calcShippingCost } from "./shared.js";

const SYSTEM_ADDON_ITEMS_BY_ID = new Map(
  (Array.isArray(SYSTEM_ADDON_ITEMS) ? SYSTEM_ADDON_ITEMS : []).map((item) => [String(item.id || ""), item])
);

function getAddonItemById(addonId) {
  return SYSTEM_ADDON_ITEMS_BY_ID.get(String(addonId || "")) || null;
}

function normalizeCount(value, fallback = 0) {
  const n = Math.floor(Number(value ?? fallback));
  return Number.isFinite(n) ? Math.max(0, n) : Math.max(0, Math.floor(Number(fallback || 0)));
}

function normalizeMm(value) {
  const n = Math.round(Number(value || 0));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function roundWon(value) {
  const n = Math.round(Number(value || 0));
  return Number.isFinite(n) ? n : 0;
}

function sumBy(items, key) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + Number(item?.[key] || 0), 0);
}

export function createSystemPricingHelpers({
  limits,
  shelfLengthMm,
  postBarPriceMaxHeightMm,
  addonClothesRodId,
} = {}) {
  const shelfLimits = limits?.shelf || {};
  const safeShelfLengthMm = Math.max(0, Number(shelfLengthMm || 0));
  const safePostBarPriceMaxHeightMm = normalizeMm(postBarPriceMaxHeightMm);
  const safeAddonClothesRodId = String(addonClothesRodId || "clothes_rod");

  function getShelfPricingConfig(kind = "normal") {
    return kind === "corner" ? SYSTEM_SHELF_TIER_PRICING.corner : SYSTEM_SHELF_TIER_PRICING.normal;
  }

  function matchShelfTierByWidth(tier, widthMm) {
    const width = normalizeMm(widthMm);
    if (!width) return false;
    const matchMode = String(tier?.matchMode || "range");
    if (matchMode !== "range") return false;
    const minExclusiveMm = Number(tier?.minWidthExclusiveMm);
    const maxMm = Number(tier?.maxWidthMm);
    if (Number.isFinite(minExclusiveMm) && !(width > minExclusiveMm)) return false;
    if (Number.isFinite(maxMm) && maxMm > 0 && !(width <= maxMm)) return false;
    return true;
  }

  function getShelfTier({ kind = "normal", widthMm = 0 } = {}) {
    const config = getShelfPricingConfig(kind);
    const tiers = Array.isArray(config?.tiers) ? config.tiers : [];
    return tiers.find((tier) => matchShelfTierByWidth(tier, widthMm)) || null;
  }

  function getShelfTierUnitPrice({ tier = null, material = null } = {}) {
    if (!tier || Boolean(tier?.isCustomPrice)) return 0;
    const materialId = String(material?.id || "");
    const category = String(material?.category || "");
    const priceByMaterialId = tier?.priceByMaterialId && typeof tier.priceByMaterialId === "object"
      ? tier.priceByMaterialId
      : null;
    const priceByCategory = tier?.priceByCategory && typeof tier.priceByCategory === "object"
      ? tier.priceByCategory
      : null;
    const byMaterialPrice = priceByMaterialId ? Number(priceByMaterialId[materialId] || 0) : 0;
    if (byMaterialPrice > 0) return roundWon(byMaterialPrice);
    const byCategoryPrice = priceByCategory ? Number(priceByCategory[category] || 0) : 0;
    if (byCategoryPrice > 0) return roundWon(byCategoryPrice);
    return 0;
  }

  function isShelfLengthCustom() {
    return safeShelfLengthMm > Number(shelfLimits.maxLength || 0);
  }

  function calcAddonCostBreakdown(addonIds = [], quantity = 1) {
    const qtyMultiplier = Math.max(1, normalizeCount(quantity, 1));
    return (Array.isArray(addonIds) ? addonIds : []).reduce(
      (acc, addonId) => {
        const addon = getAddonItemById(addonId);
        const price = Number(addon?.price || 0) * qtyMultiplier;
        if (String(addonId || "") === safeAddonClothesRodId) {
          acc.componentCost += price;
        } else {
          acc.furnitureCost += price;
        }
        return acc;
      },
      { componentCost: 0, furnitureCost: 0 }
    );
  }

  function calcPartDetail({
    materials,
    materialId,
    thickness,
    width,
    length,
    quantity,
    partMultiplier = 1,
  }) {
    const material = materials[materialId];
    const partQuantity = (quantity || 1) * partMultiplier;
    const areaM2 = (Number(width || 0) / 1000) * (Number(length || 0) / 1000);
    const thicknessM = Number(thickness || 0) / 1000;
    const volumeM3 = areaM2 * thicknessM * partQuantity;
    const weightKg = volumeM3 * Number(material?.density || 0);
    return {
      weightKg,
    };
  }

  function isColumnCustom(length) {
    return Number(length || 0) > safePostBarPriceMaxHeightMm;
  }

  function countCornerPostBars(bays = []) {
    return (Array.isArray(bays) ? bays : []).reduce(
      (count, bay) => count + (bay?.isCorner ? 1 : 0),
      0
    );
  }

  function getPostBarPricingConfig(kind = "basic") {
    return kind === "corner" ? SYSTEM_POST_BAR_PRICING.corner : SYSTEM_POST_BAR_PRICING.basic;
  }

  function getPostBarTier(kind, heightMm) {
    const config = getPostBarPricingConfig(kind);
    const height = normalizeMm(heightMm);
    const tiers = Array.isArray(config?.tiers) ? config.tiers : [];
    return tiers.find((tier) => height > 0 && height <= Number(tier?.maxHeightMm || 0)) || null;
  }

  function getPostBarTierUnitPrice(kind, heightMm) {
    const tier = getPostBarTier(kind, heightMm);
    const unitPrice = Number(tier?.unitPrice || 0);
    return {
      tier,
      unitPrice: Number.isFinite(unitPrice) && unitPrice > 0 ? roundWon(unitPrice) : 0,
    };
  }

  function resolveCornerPostBarHeightMm({ column }) {
    return normalizeMm(column?.maxLength || column?.length || column?.minLength);
  }

  function calcAddonsUnitTotal(addons = []) {
    return (Array.isArray(addons) ? addons : []).reduce((sum, id) => {
      const addon = getAddonItemById(id);
      return sum + Number(addon?.price || 0);
    }, 0);
  }

  function calcBayDetail({ shelf, addons = [], quantity, isCorner = false }) {
    const unitQuantity = Math.max(1, normalizeCount(quantity, 1));
    const shelfMaterial = SYSTEM_SHELF_MATERIALS[shelf?.materialId];
    const shelfWidthMm = normalizeMm(shelf?.width);
    const shelfCount = Math.max(1, normalizeCount(shelf?.count, 1));
    const shelfTier = getShelfTier({
      kind: isCorner ? "corner" : "normal",
      widthMm: shelfWidthMm,
    });
    const shelfTierUnitPrice = getShelfTierUnitPrice({
      tier: shelfTier,
      material: shelfMaterial,
    });
    const shelfIsCustom =
      Boolean(shelf?.customProcessing) ||
      isShelfLengthCustom() ||
      !shelfTier ||
      Boolean(shelfTier?.isCustomPrice) ||
      shelfTierUnitPrice <= 0;
    const shelfDetail = calcPartDetail({
      materials: SYSTEM_SHELF_MATERIALS,
      materialId: shelf.materialId,
      thickness: shelf.thickness,
      width: shelf.width,
      length: shelf.length,
      quantity: unitQuantity,
      partMultiplier: shelfCount,
    });
    const addonTotal = calcAddonsUnitTotal(addons);

    const processingCost = shelfIsCustom ? 0 : addonTotal * unitQuantity;
    const materialCost = shelfIsCustom ? 0 : roundWon(shelfTierUnitPrice * shelfCount * unitQuantity);
    const subtotal = materialCost + processingCost;
    const vat = 0;
    const total = roundWon(subtotal);
    const weightKg = shelfDetail.weightKg;
    const isCustomPrice = shelfIsCustom;

    return {
      materialCost,
      processingCost,
      subtotal,
      vat,
      total,
      weightKg,
      isCustomPrice,
      shelfPricing: {
        kind: isCorner ? "corner" : "normal",
        tierKey: String(shelfTier?.key || ""),
        tierLabel: String(shelfTier?.label || ""),
        unitPrice: roundWon(shelfTierUnitPrice),
      },
    };
  }

  function calcColumnsDetail({ column, count, quantity, bays = [] }) {
    const unitQuantity = Math.max(1, normalizeCount(quantity, 1));
    const basePostCount = normalizeCount(count, 0);
    const cornerPostCount = countCornerPostBars(bays);
    const baseHeightMm = normalizeMm(column?.length || column?.maxLength);
    const cornerHeightMm = resolveCornerPostBarHeightMm({ column, bays });

    const basePricing = getPostBarTierUnitPrice("basic", baseHeightMm);
    const cornerPricing = getPostBarTierUnitPrice("corner", cornerHeightMm);
    const baseTier = basePricing.tier;
    const cornerTier = cornerPricing.tier;

    const baseIsCustom =
      basePostCount > 0 &&
      (!baseTier || basePricing.unitPrice <= 0 || isColumnCustom(baseHeightMm));
    const cornerIsCustom =
      cornerPostCount > 0 &&
      (!cornerTier || cornerPricing.unitPrice <= 0 || isColumnCustom(cornerHeightMm));
    const isCustomPrice = baseIsCustom || cornerIsCustom;

    const baseTotalCost = isCustomPrice ? 0 : basePricing.unitPrice * basePostCount * unitQuantity;
    const cornerTotalCost = isCustomPrice ? 0 : cornerPricing.unitPrice * cornerPostCount * unitQuantity;
    const materialCost = roundWon(baseTotalCost + cornerTotalCost);
    const processingCost = 0;
    const subtotal = materialCost + processingCost;
    const vat = 0;
    const total = roundWon(subtotal);

    const baseWeightDetail =
      basePostCount > 0
        ? calcPartDetail({
            materials: SYSTEM_COLUMN_MATERIALS,
            materialId: column.materialId,
            thickness: column.thickness,
            width: column.width,
            length: baseHeightMm,
            quantity: unitQuantity,
            partMultiplier: basePostCount,
          })
        : { weightKg: 0 };
    const cornerWeightDetail =
      cornerPostCount > 0
        ? calcPartDetail({
            materials: SYSTEM_COLUMN_MATERIALS,
            materialId: column.materialId,
            thickness: column.thickness,
            width: column.width,
            length: normalizeMm(cornerHeightMm || baseHeightMm),
            quantity: unitQuantity,
            partMultiplier: cornerPostCount,
          })
        : { weightKg: 0 };
    const weightKg =
      Number(baseWeightDetail.weightKg || 0) + Number(cornerWeightDetail.weightKg || 0);

    return {
      materialCost,
      processingCost,
      subtotal,
      vat,
      total,
      weightKg,
      isCustomPrice,
      basePostBar: {
        kind: "basic",
        label: getPostBarPricingConfig("basic")?.label || "기본 포스트바",
        count: basePostCount,
        heightMm: baseHeightMm,
        tierKey: String(baseTier?.key || ""),
        tierLabel: String(baseTier?.label || ""),
        unitPrice: roundWon(basePricing.unitPrice),
        totalCost: roundWon(baseTotalCost),
      },
      cornerPostBar: {
        kind: "corner",
        label: getPostBarPricingConfig("corner")?.label || "코너 포스트바",
        count: cornerPostCount,
        heightMm: cornerHeightMm,
        tierKey: String(cornerTier?.key || ""),
        tierLabel: String(cornerTier?.label || ""),
        unitPrice: roundWon(cornerPricing.unitPrice),
        totalCost: roundWon(cornerTotalCost),
      },
    };
  }

  function calcOrderSummary(items) {
    const materialsTotal = sumBy(items, "materialCost");
    const processingTotal = sumBy(items, "processingCost");
    const subtotal = sumBy(items, "subtotal");
    const vat = 0;
    const totalWeight = sumBy(items, "weightKg");
    const shippingCost = calcShippingCost(totalWeight);
    const grandTotal = subtotal + shippingCost;

    return {
      materialsTotal,
      processingTotal,
      subtotal,
      vat,
      totalWeight,
      shippingCost,
      grandTotal,
    };
  }

  return {
    calcAddonCostBreakdown,
    calcBayDetail,
    calcColumnsDetail,
    calcOrderSummary,
  };
}
