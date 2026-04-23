import {
  buildTierCategoryPriceKey,
  matchTieredPriceCandidate,
  resolveTieredPriceRule,
} from "./shared.js?v=20260423f-html";

export function resolveSystemFurniturePriceCategoryKey(materialId = "") {
  const key = String(materialId || "").trim();
  return key || "default";
}

export function buildSystemTierCategoryPriceKey(tierKey = "", categoryKey = "default") {
  return buildTierCategoryPriceKey(tierKey, categoryKey);
}

export function matchSystemTieredWidthTier(pricingRule, widthMm) {
  const tiers = Array.isArray(pricingRule?.tiers) ? pricingRule.tiers : [];
  return (
    tiers.find((tier) => matchTieredPriceCandidate(tier, {
      typeToken: "tieredbywidth",
      widthMm,
    })) || null
  );
}

export function resolveSystemTieredWidthPrice(addonItem, widthMm, { categoryKey = "" } = {}) {
  const addon = addonItem && typeof addonItem === "object" ? addonItem : null;
  if (!addon) {
    return { matchedTier: null, tierKey: "", unitPrice: 0, isCustomPrice: false };
  }
  const pricingRule = addon?.pricingRule && typeof addon.pricingRule === "object" ? addon.pricingRule : null;
  const ruleType = String(pricingRule?.type || "").trim().toLowerCase();
  if (ruleType !== "tieredbywidth") {
    const ruleValue = Number(pricingRule?.value || pricingRule?.unitPrice || 0);
    return {
      matchedTier: null,
      tierKey: "",
      unitPrice: Number.isFinite(ruleValue) && ruleValue > 0 ? Math.round(ruleValue) : 0,
      isCustomPrice: false,
    };
  }

  const resolved = resolveTieredPriceRule(pricingRule, {
    typeToken: "tieredbywidth",
    widthMm,
    categoryKey: String(categoryKey || "").trim() || "default",
  });
  return {
    matchedTier: resolved.matchedTier,
    tierKey: resolved.tierKey,
    unitPrice: Number.isFinite(resolved.unitPrice) && resolved.unitPrice > 0 ? Math.round(resolved.unitPrice) : 0,
    isCustomPrice: Boolean(resolved.isCustomPrice),
  };
}
