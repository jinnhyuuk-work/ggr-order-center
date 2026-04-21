const EMPTY_AVAILABILITY_RULE = Object.freeze({
  excludedCategories: Object.freeze([]),
  excludedIds: Object.freeze([]),
});

function normalizeStringList(values = []) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

export function createAvailabilityRule({ excludedCategories = [], excludedIds = [] } = {}) {
  return Object.freeze({
    excludedCategories: Object.freeze(normalizeStringList(excludedCategories)),
    excludedIds: Object.freeze(normalizeStringList(excludedIds)),
  });
}

function resolveAvailabilityRule(rule) {
  return rule && typeof rule === "object" ? rule : EMPTY_AVAILABILITY_RULE;
}

export function isItemAvailable(item, rule = EMPTY_AVAILABILITY_RULE) {
  if (!item || item.active === false) return false;
  const availabilityRule = resolveAvailabilityRule(rule);
  const category = String(item.category || "기타").trim();
  const id = String(item.id || "").trim();
  if (category && availabilityRule.excludedCategories?.includes(category)) return false;
  if (id && availabilityRule.excludedIds?.includes(id)) return false;
  return true;
}

export function filterAvailableItems(items, rule = EMPTY_AVAILABILITY_RULE) {
  return (Array.isArray(items) ? items : []).filter((item) => isItemAvailable(item, rule));
}

export function filterAvailableMap(map, rule = EMPTY_AVAILABILITY_RULE) {
  return Object.fromEntries(
    Object.entries(map || {}).filter(([id, item]) => isItemAvailable({ ...item, id }, rule))
  );
}

export function buildAvailableCategories(items, rule = EMPTY_AVAILABILITY_RULE) {
  return Array.from(
    new Set(filterAvailableItems(items, rule).map((item) => String(item?.category || "기타").trim()))
  ).filter(Boolean);
}
