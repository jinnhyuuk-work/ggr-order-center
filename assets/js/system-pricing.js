import {
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  SYSTEM_POST_BAR_PRICING,
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

export function getPricePerM2(material, thickness) {
  if (!material) return 0;
  if (material.pricePerM2ByThickness) {
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
  return material.pricePerM2 || 0;
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
    isCustom,
  }) {
    const material = materials[materialId];
    const partQuantity = (quantity || 1) * partMultiplier;
    const areaM2 = (width / 1000) * (length / 1000);
    const pricePerM2 = getPricePerM2(material, thickness);
    const thicknessM = thickness / 1000;
    const volumeM3 = areaM2 * thicknessM * partQuantity;
    const weightKg = volumeM3 * (material?.density || 0);
    const materialCost = areaM2 * pricePerM2 * partQuantity;
    return {
      areaM2,
      materialCost: isCustom ? 0 : materialCost,
      weightKg,
      isCustomPrice: isCustom,
    };
  }

  function isShelfCustom(width, customFlag) {
    return (
      customFlag ||
      Number(width || 0) > Number(shelfLimits.maxWidth || 0) ||
      safeShelfLengthMm > Number(shelfLimits.maxLength || 0)
    );
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

  function calcLegacyPostBarUnitCost({ column, heightMm }) {
    const lengthMm = normalizeMm(heightMm);
    if (!column?.materialId || !lengthMm) return 0;
    const detail = calcPartDetail({
      materials: SYSTEM_COLUMN_MATERIALS,
      materialId: column.materialId,
      thickness: column.thickness,
      width: column.width,
      length: lengthMm,
      quantity: 1,
      partMultiplier: 1,
      isCustom: false,
    });
    return roundWon(detail.materialCost);
  }

  function getPostBarTierUnitPrice(kind, column, heightMm) {
    const tier = getPostBarTier(kind, heightMm);
    if (tier && Number(tier.unitPrice || 0) > 0) {
      return {
        tier,
        unitPrice: roundWon(tier.unitPrice),
        usesLegacyFallback: false,
      };
    }
    return {
      tier,
      unitPrice: calcLegacyPostBarUnitCost({ column, heightMm }),
      usesLegacyFallback: true,
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

  function calcBayDetail({ shelf, addons = [], quantity }) {
    const shelfIsCustom = isShelfCustom(shelf.width, shelf.customProcessing);
    const shelfDetail = calcPartDetail({
      materials: SYSTEM_SHELF_MATERIALS,
      materialId: shelf.materialId,
      thickness: shelf.thickness,
      width: shelf.width,
      length: shelf.length,
      quantity,
      partMultiplier: shelf.count || 1,
      isCustom: shelfIsCustom,
    });
    const addonTotal = calcAddonsUnitTotal(addons);

    const processingCost = addonTotal * quantity;
    const materialCost = shelfDetail.materialCost;
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
    };
  }

  function calcColumnsDetail({ column, count, quantity, bays = [] }) {
    const unitQuantity = Math.max(1, normalizeCount(quantity, 1));
    const basePostCount = normalizeCount(count, 0);
    const cornerPostCount = countCornerPostBars(bays);
    const baseHeightMm = normalizeMm(column?.length || column?.maxLength);
    const cornerHeightMm = resolveCornerPostBarHeightMm({ column, bays });

    const basePricing = getPostBarTierUnitPrice("basic", column, baseHeightMm);
    const cornerPricing = getPostBarTierUnitPrice("corner", column, cornerHeightMm);
    const baseTier = basePricing.tier;
    const cornerTier = cornerPricing.tier;

    const baseIsCustom = basePostCount > 0 && (!baseTier || isColumnCustom(baseHeightMm));
    const cornerIsCustom = cornerPostCount > 0 && (!cornerTier || isColumnCustom(cornerHeightMm));
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
            isCustom: false,
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
            isCustom: false,
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
        usesLegacyFallback: Boolean(basePricing.usesLegacyFallback),
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
        usesLegacyFallback: Boolean(cornerPricing.usesLegacyFallback),
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
