import {
  SYSTEM_SHELF_MATERIALS,
  SYSTEM_COLUMN_MATERIALS,
  SYSTEM_POST_BAR_PRICING,
  SYSTEM_SHELF_TIER_PRICING,
  SYSTEM_ADDON_ITEMS,
} from "./data/system-data.js";

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
    const tierKey = String(tier?.key || "");
    const materialId = String(material?.id || "");
    const category = String(material?.category || "");
    const pricingRule = material?.pricingRule && typeof material.pricingRule === "object" ? material.pricingRule : null;
    const byPricingRule = pricingRule?.priceByTierKey ? Number(pricingRule.priceByTierKey[tierKey] || 0) : 0;
    if (byPricingRule > 0) return roundWon(byPricingRule);
    const materialPriceByTierKey =
      material?.priceByTierKey && typeof material.priceByTierKey === "object"
        ? material.priceByTierKey
        : null;
    const priceByMaterialId = tier?.priceByMaterialId && typeof tier.priceByMaterialId === "object"
      ? tier.priceByMaterialId
      : null;
    const priceByCategory = tier?.priceByCategory && typeof tier.priceByCategory === "object"
      ? tier.priceByCategory
      : null;
    const byMaterialTierKey = materialPriceByTierKey ? Number(materialPriceByTierKey[tierKey] || 0) : 0;
    if (byMaterialTierKey > 0) return roundWon(byMaterialTierKey);
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

  function getPostBarPricingConfig(kind = "basic", pricingRule = null) {
    if (pricingRule && typeof pricingRule === "object" && pricingRule.tiers) {
      return kind === "corner"
        ? { label: "코너 포스트바", tiers: pricingRule.tiers.corner || [] }
        : { label: "기본 포스트바", tiers: pricingRule.tiers.basic || [] };
    }
    return kind === "corner" ? SYSTEM_POST_BAR_PRICING.corner : SYSTEM_POST_BAR_PRICING.basic;
  }

  function getPostBarTier(kind, heightMm, pricingRule = null) {
    const config = getPostBarPricingConfig(kind, pricingRule);
    const height = normalizeMm(heightMm);
    const tiers = Array.isArray(config?.tiers) ? config.tiers : [];
    return tiers.find((tier) => height > 0 && height <= Number(tier?.maxHeightMm || 0)) || null;
  }

  function getPostBarTierUnitPrice(kind, heightMm, pricingRule = null) {
    const tier = getPostBarTier(kind, heightMm, pricingRule);
    const unitPrice = Number(tier?.unitPrice || 0);
    return {
      tier,
      unitPrice: Number.isFinite(unitPrice) && unitPrice > 0 ? roundWon(unitPrice) : 0,
    };
  }

  function resolveCornerPostBarHeightMm({ column }) {
    return normalizeMm(column?.maxLength || column?.length || column?.minLength);
  }

  function collectPositiveHeightsMm(value, collector = []) {
    if (Array.isArray(value)) {
      value.forEach((entry) => collectPositiveHeightsMm(entry, collector));
      return collector;
    }
    const mm = normalizeMm(value);
    if (mm > 0) collector.push(mm);
    return collector;
  }

  function getColumnExtraPostBarHeightsMm(column) {
    return collectPositiveHeightsMm(column?.spaceExtraHeights, []);
  }

  function buildPostBarRows({ kind, heightCountMap, unitQuantity = 1, pricingRule = null }) {
    const label = getPostBarPricingConfig(kind, pricingRule)?.label || (kind === "corner" ? "코너 포스트바" : "기본 포스트바");
    return Array.from(heightCountMap.entries())
      .map(([heightMm, count]) => {
        const normalizedHeightMm = normalizeMm(heightMm);
        const normalizedCount = normalizeCount(count, 0);
        const pricing = getPostBarTierUnitPrice(kind, normalizedHeightMm, pricingRule);
        const tier = pricing.tier;
        const unitPrice = roundWon(pricing.unitPrice);
        const isCustomPrice =
          normalizedCount > 0 &&
          (!tier || unitPrice <= 0 || isColumnCustom(normalizedHeightMm));
        return {
          kind,
          label,
          count: normalizedCount,
          heightMm: normalizedHeightMm,
          tierKey: String(tier?.key || ""),
          tierLabel: String(tier?.label || ""),
          unitPrice,
          totalCost: 0,
          isCustomPrice,
          quantity: Math.max(1, normalizeCount(unitQuantity, 1)),
        };
      })
      .filter((row) => row.count > 0);
  }

  function summarizePostBarRows(rows = [], fallbackKind = "basic") {
    const list = Array.isArray(rows) ? rows : [];
    const kind = fallbackKind === "corner" ? "corner" : "basic";
    const tierKeys = Array.from(new Set(list.map((row) => String(row?.tierKey || "")).filter(Boolean)));
    const tierLabels = Array.from(new Set(list.map((row) => String(row?.tierLabel || "")).filter(Boolean)));
    const unitPrices = Array.from(
      new Set(
        list
          .map((row) => roundWon(row?.unitPrice))
          .filter((price) => Number.isFinite(price) && price > 0)
      )
    );
    return {
      kind,
      label: getPostBarPricingConfig(kind)?.label || (kind === "corner" ? "코너 포스트바" : "기본 포스트바"),
      count: list.reduce((sum, row) => sum + normalizeCount(row?.count, 0), 0),
      heightMm: list.length === 1 ? normalizeMm(list[0]?.heightMm) : 0,
      tierKey: tierKeys.length === 1 ? tierKeys[0] : "",
      tierLabel: tierLabels.length === 1 ? tierLabels[0] : tierLabels.length > 1 ? "복수 티어" : "",
      unitPrice: unitPrices.length === 1 ? unitPrices[0] : 0,
      totalCost: roundWon(sumBy(list, "totalCost")),
    };
  }

  function calcAddonsUnitTotal(addons = []) {
    return (Array.isArray(addons) ? addons : []).reduce((sum, id) => {
      const addon = getAddonItemById(id);
      const ruleValue = Number(addon?.pricingRule?.value || addon?.pricingRule?.unitPrice || 0);
      return sum + Number(ruleValue > 0 ? ruleValue : addon?.price || 0);
    }, 0);
  }

  function calcBayDetail({ shelf, addons = [], quantity, isCorner = false }) {
    const unitQuantity = Math.max(1, normalizeCount(quantity, 1));
    const shelfMaterial = SYSTEM_SHELF_MATERIALS[shelf?.materialId];
    const shelfWidthMm = normalizeMm(shelf?.width);
    const shelfLengthMm = normalizeMm(safeShelfLengthMm || shelf?.length);
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
      length: shelfLengthMm,
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

    const baseHeightCountMap = new Map();
    const extraHeights = getColumnExtraPostBarHeightsMm(column);
    const replacedCount = Math.min(basePostCount, extraHeights.length);
    const defaultHeightCount = Math.max(0, basePostCount - replacedCount);
    if (defaultHeightCount > 0 && baseHeightMm > 0) {
      baseHeightCountMap.set(baseHeightMm, defaultHeightCount);
    }
    extraHeights.slice(0, replacedCount).forEach((heightMm) => {
      if (heightMm <= 0) return;
      const prev = Number(baseHeightCountMap.get(heightMm) || 0);
      baseHeightCountMap.set(heightMm, prev + 1);
    });

    const cornerHeightCountMap = new Map();
    if (cornerPostCount > 0 && cornerHeightMm > 0) {
      cornerHeightCountMap.set(cornerHeightMm, cornerPostCount);
    }

    const basePostBars = buildPostBarRows({
      kind: "basic",
      heightCountMap: baseHeightCountMap,
      unitQuantity,
      pricingRule: column?.pricingRule,
    });
    const cornerPostBars = buildPostBarRows({
      kind: "corner",
      heightCountMap: cornerHeightCountMap,
      unitQuantity,
      pricingRule: column?.pricingRule,
    });

    const baseIsCustom = basePostBars.some((row) => Boolean(row?.isCustomPrice));
    const cornerIsCustom = cornerPostBars.some((row) => Boolean(row?.isCustomPrice));
    const isCustomPrice = baseIsCustom || cornerIsCustom;

    const pricedBasePostBars = basePostBars.map((row) => ({
      ...row,
      totalCost: isCustomPrice ? 0 : roundWon(row.unitPrice * row.count * unitQuantity),
    }));
    const pricedCornerPostBars = cornerPostBars.map((row) => ({
      ...row,
      totalCost: isCustomPrice ? 0 : roundWon(row.unitPrice * row.count * unitQuantity),
    }));

    const baseTotalCost = roundWon(sumBy(pricedBasePostBars, "totalCost"));
    const cornerTotalCost = roundWon(sumBy(pricedCornerPostBars, "totalCost"));
    const materialCost = roundWon(baseTotalCost + cornerTotalCost);
    const processingCost = 0;
    const subtotal = materialCost + processingCost;
    const vat = 0;
    const total = roundWon(subtotal);

    const calcPostBarWeightKg = (heightCountMap) =>
      Array.from(heightCountMap.entries()).reduce((sum, [heightMm, rowCount]) => {
        const normalizedHeightMm = normalizeMm(heightMm);
        const normalizedCount = normalizeCount(rowCount, 0);
        if (!normalizedHeightMm || !normalizedCount) return sum;
        const detail = calcPartDetail({
          materials: SYSTEM_COLUMN_MATERIALS,
          materialId: column.materialId,
          thickness: column.thickness,
          width: column.width,
          length: normalizedHeightMm,
          quantity: unitQuantity,
          partMultiplier: normalizedCount,
        });
        return sum + Number(detail.weightKg || 0);
      }, 0);
    const weightKg = calcPostBarWeightKg(baseHeightCountMap) + calcPostBarWeightKg(cornerHeightCountMap);

    const summarizedBasePostBar = summarizePostBarRows(pricedBasePostBars, "basic");
    const summarizedCornerPostBar = summarizePostBarRows(pricedCornerPostBars, "corner");

    return {
      materialCost,
      processingCost,
      subtotal,
      vat,
      total,
      weightKg,
      isCustomPrice,
      basePostBar: summarizedBasePostBar,
      cornerPostBar: summarizedCornerPostBar,
      basePostBars: pricedBasePostBars,
      cornerPostBars: pricedCornerPostBars,
    };
  }

  function calcOrderSummary(items) {
    const materialsTotal = sumBy(items, "materialCost");
    const processingTotal = sumBy(items, "processingCost");
    const subtotal = sumBy(items, "subtotal");
    const vat = 0;
    const totalWeight = sumBy(items, "weightKg");
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
    calcAddonCostBreakdown,
    calcBayDetail,
    calcColumnsDetail,
    calcOrderSummary,
  };
}
