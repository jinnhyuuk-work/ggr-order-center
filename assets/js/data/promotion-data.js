export const ORDER_PROMOTION_CONFIG = Object.freeze({
  enabled: false,
  rules: Object.freeze([
    Object.freeze({
      id: "sample_monthly_color_10",
      enabled: false,
      pages: Object.freeze(["board", "plywood"]),
      targetTypes: Object.freeze(["material"]),
      materialIds: Object.freeze(["lpm_natural_walnut"]),
      discountRate: 0.1,
      startsOn: "2026-04-01",
      endsOn: "2026-04-30",
    }),
  ]),
});

export function getEnabledPromotionRules() {
  if (!ORDER_PROMOTION_CONFIG.enabled) return [];
  const list = Array.isArray(ORDER_PROMOTION_CONFIG.rules) ? ORDER_PROMOTION_CONFIG.rules : [];
  return list.filter((rule) => rule && typeof rule === "object" && rule.enabled !== false);
}
