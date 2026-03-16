import {
  INSTALLATION_TRAVEL_ZONE_POLICY,
  INSTALLATION_TRAVEL_ZONE_RULES,
} from "./data/installation-travel-zone-data.js";

const SIDO_ALIAS_MAP = Object.freeze({
  "서울특별시": Object.freeze(["서울특별시", "서울시", "서울"]),
  경기도: Object.freeze(["경기도", "경기"]),
  "인천광역시": Object.freeze(["인천광역시", "인천시", "인천"]),
});

const SIDO_ALIAS_ENTRIES = Object.freeze(
  Object.entries(SIDO_ALIAS_MAP).map(([canonical, aliases]) =>
    Object.freeze({
      canonical,
      aliases: Object.freeze((aliases || []).map((item) => String(item || "").trim()).filter(Boolean)),
    })
  )
);

const SIDO_ALIAS_SET = Object.freeze(
  new Set(SIDO_ALIAS_ENTRIES.flatMap((entry) => [entry.canonical, ...entry.aliases]))
);

const SIGUNGU_TOKEN_PATTERN = /(시|군|구)$/;

function normalizeCompactText(value) {
  return String(value || "")
    .trim()
    .replace(/[()]/g, " ")
    .replace(/[·,]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function normalizeSido(value) {
  const token = String(value || "").trim();
  if (!token) return "";
  const compact = normalizeCompactText(token);
  const matched = SIDO_ALIAS_ENTRIES.find((entry) =>
    entry.aliases.some((alias) => compact === normalizeCompactText(alias))
  );
  return matched ? matched.canonical : "";
}

function tokenizeAddress(address = "") {
  return String(address || "")
    .trim()
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .map((token) => String(token || "").trim())
    .filter(Boolean);
}

function extractSidoFromTokens(tokens = []) {
  for (const token of tokens) {
    const normalized = normalizeSido(token);
    if (normalized) return normalized;
  }
  return "";
}

function extractSigunguFromTokens(tokens = []) {
  for (const token of tokens) {
    if (!token || SIDO_ALIAS_SET.has(token)) continue;
    if (SIGUNGU_TOKEN_PATTERN.test(token)) return token;
  }
  return "";
}

function hasKeyword(text, keywords = []) {
  const compactText = normalizeCompactText(text);
  if (!compactText) return false;
  return (Array.isArray(keywords) ? keywords : []).some((keyword) => {
    const compactKeyword = normalizeCompactText(keyword);
    return Boolean(compactKeyword && compactText.includes(compactKeyword));
  });
}

function isInstallationTravelRuleMatched(rule, parsed) {
  if (!rule || typeof rule !== "object") return false;
  const ruleSido = normalizeSido(rule.sido);
  if (!ruleSido || ruleSido !== parsed.sido) return false;

  const ruleSigungu = String(rule.sigungu || "*").trim();
  if (ruleSigungu !== "*") {
    const normalizedRuleSigungu = normalizeCompactText(ruleSigungu);
    const normalizedAddressSigungu = normalizeCompactText(parsed.sigungu);
    if (!normalizedAddressSigungu || normalizedRuleSigungu !== normalizedAddressSigungu) return false;
  }

  const keywordTarget = [
    parsed.address,
    parsed.sido,
    parsed.sigungu,
    parsed.bname,
    parsed.roadname,
  ]
    .filter(Boolean)
    .join(" ");

  if (Array.isArray(rule.include) && rule.include.length > 0 && !hasKeyword(keywordTarget, rule.include)) {
    return false;
  }
  if (Array.isArray(rule.exclude) && rule.exclude.length > 0 && hasKeyword(keywordTarget, rule.exclude)) {
    return false;
  }

  return true;
}

export function parseInstallationTravelAddress(input = "") {
  const hasObjectInput = Boolean(input && typeof input === "object");
  const raw = hasObjectInput ? String(input.address || "").trim() : String(input || "").trim();
  const meta = hasObjectInput && input?.addressMeta && typeof input.addressMeta === "object"
    ? input.addressMeta
    : {};
  const rawSido = hasObjectInput
    ? String(input.sido || meta.sido || "").trim()
    : "";
  const rawSigungu = hasObjectInput
    ? String(input.sigungu || meta.sigungu || "").trim()
    : "";
  const rawBname = hasObjectInput
    ? String(input.bname || meta.bname || "").trim()
    : "";
  const rawRoadname = hasObjectInput
    ? String(input.roadname || meta.roadname || "").trim()
    : "";

  const tokens = tokenizeAddress(raw);
  const sido = normalizeSido(rawSido) || extractSidoFromTokens(tokens);
  const sigungu = String(rawSigungu || extractSigunguFromTokens(tokens) || "").trim();
  const bname = rawBname;
  const roadname = rawRoadname;
  return Object.freeze({
    address: raw,
    tokens: Object.freeze([...tokens]),
    sido,
    sigungu,
    bname,
    roadname,
  });
}

export function resolveInstallationTravelZoneByAddress(input = "") {
  const parsed = parseInstallationTravelAddress(input);
  const normalizedSido = normalizeSido(parsed.sido);
  if (!parsed.address && !normalizedSido) {
    return Object.freeze({
      isMatched: false,
      zoneId: "",
      zoneLabel: "",
      travelFee: 0,
      parsed,
      reason: INSTALLATION_TRAVEL_ZONE_POLICY.consultReason,
    });
  }
  if (!normalizedSido) {
    return Object.freeze({
      isMatched: false,
      zoneId: "",
      zoneLabel: "",
      travelFee: 0,
      parsed,
      reason: INSTALLATION_TRAVEL_ZONE_POLICY.consultReason,
    });
  }

  for (const zone of INSTALLATION_TRAVEL_ZONE_RULES) {
    const matchedRule = (zone.rules || []).find((rule) => isInstallationTravelRuleMatched(rule, parsed));
    if (!matchedRule) continue;
    return Object.freeze({
      isMatched: true,
      zoneId: zone.id,
      zoneLabel: zone.label,
      travelFee: Number(zone.travelFee || 0),
      parsed,
      matchedRule,
      reason: "",
    });
  }

  return Object.freeze({
    isMatched: false,
    zoneId: "",
    zoneLabel: "",
    travelFee: 0,
    parsed,
    reason: INSTALLATION_TRAVEL_ZONE_POLICY.consultReason,
  });
}
