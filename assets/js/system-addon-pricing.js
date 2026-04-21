function normalizeMm(value) {
  const n = Math.round(Number(value || 0));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function resolveSystemFurniturePriceCategoryKey(materialId = "") {
  const key = String(materialId || "").trim();
  return key || "default";
}

export function buildSystemTierCategoryPriceKey(tierKey = "", categoryKey = "default") {
  return `${String(tierKey || "").trim()}__${String(categoryKey || "default").trim() || "default"}`;
}

export function matchSystemTieredWidthTier(pricingRule, widthMm) {
  const normalizedWidth = normalizeMm(widthMm);
  if (!pricingRule || typeof pricingRule !== "object" || normalizedWidth <= 0) return null;
  const tiers = Array.isArray(pricingRule?.tiers) ? pricingRule.tiers : [];
  return (
    tiers.find((tier) => {
      if (!tier || typeof tier !== "object") return false;
      const minWidthMm = Number(tier?.minWidthMm);
      const maxWidthMm = Number(tier?.maxWidthMm);
      if (Number.isFinite(minWidthMm) && normalizedWidth < minWidthMm) return false;
      if (Number.isFinite(maxWidthMm) && maxWidthMm > 0 && normalizedWidth > maxWidthMm) return false;
      return true;
    }) || null
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

  const normalizedCategoryKey = String(categoryKey || "").trim() || "default";
  const matchedTier = matchSystemTieredWidthTier(pricingRule, widthMm);
  if (!matchedTier) {
    return { matchedTier: null, tierKey: "", unitPrice: 0, isCustomPrice: false };
  }

  const tierKey = String(matchedTier?.key || "").trim();
  const isCustomPrice = Boolean(matchedTier?.isCustomPrice);
  if (isCustomPrice) {
    return { matchedTier, tierKey, unitPrice: 0, isCustomPrice: true };
  }

  const priceByTierKey =
    pricingRule?.priceByTierKey && typeof pricingRule.priceByTierKey === "object"
      ? pricingRule.priceByTierKey
      : null;
  const byTierCategory = priceByTierKey
    ? Number(
        priceByTierKey[buildSystemTierCategoryPriceKey(tierKey, normalizedCategoryKey)] ??
          priceByTierKey[buildSystemTierCategoryPriceKey(tierKey, "default")] ??
          0
      )
    : 0;
  const fallbackTierValue = Number(
    matchedTier?.price ?? matchedTier?.unitPrice ?? matchedTier?.value ?? 0
  );
  const unitPrice = Number(byTierCategory > 0 ? byTierCategory : fallbackTierValue);
  return {
    matchedTier,
    tierKey,
    unitPrice: Number.isFinite(unitPrice) && unitPrice > 0 ? Math.round(unitPrice) : 0,
    isCustomPrice: false,
  };
}
