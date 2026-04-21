export const arrayToMap = (list) =>
  list.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

const DEFAULT_DATA_META = Object.freeze({
  source: "assets/js/data",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
});

const toMetaText = (value, fallback = "") => {
  const normalized = String(value ?? fallback).trim();
  return normalized || String(fallback || "");
};

const normalizeMetaTags = (tags = []) =>
  Object.freeze(
    Array.isArray(tags)
      ? tags
          .map((tag) => String(tag || "").trim())
          .filter(Boolean)
      : []
  );

const getMetaLabel = (item, preferredLabelKey = "") => {
  if (preferredLabelKey && item?.[preferredLabelKey]) return toMetaText(item[preferredLabelKey]);
  return toMetaText(item?.label || item?.name || item?.title || item?.id || "미지정");
};

const getMetaDescription = (item, preferredDescriptionKey = "") => {
  if (preferredDescriptionKey && item?.[preferredDescriptionKey]) {
    return toMetaText(item[preferredDescriptionKey]);
  }
  return toMetaText(item?.description || item?.summary || "");
};

export const createDatasetMeta = ({
  id = "",
  label = "",
  description = "",
  source = DEFAULT_DATA_META.source,
  owner = DEFAULT_DATA_META.owner,
  updated_at = DEFAULT_DATA_META.updated_at,
  status = DEFAULT_DATA_META.status,
  tags = [],
} = {}) =>
  Object.freeze({
    id: toMetaText(id || "unknown"),
    label: toMetaText(label || id || "미지정"),
    description: toMetaText(description),
    source: toMetaText(source, DEFAULT_DATA_META.source),
    owner: toMetaText(owner, DEFAULT_DATA_META.owner),
    updated_at: toMetaText(updated_at, DEFAULT_DATA_META.updated_at),
    status: toMetaText(status, DEFAULT_DATA_META.status),
    tags: normalizeMetaTags(tags),
  });

export const createDataItemMetaMap = (
  list,
  {
    dataset = "unknown",
    source = DEFAULT_DATA_META.source,
    owner = DEFAULT_DATA_META.owner,
    updated_at = DEFAULT_DATA_META.updated_at,
    status = DEFAULT_DATA_META.status,
    tags = [],
    labelKey = "",
    descriptionKey = "",
  } = {}
) =>
  Object.freeze(
    (Array.isArray(list) ? list : []).reduce((acc, item) => {
      const id = String(item?.id || "").trim();
      if (!id) return acc;
      acc[id] = Object.freeze({
        label: getMetaLabel(item, labelKey),
        description: getMetaDescription(item, descriptionKey),
        source: toMetaText(source, DEFAULT_DATA_META.source),
        owner: toMetaText(owner, DEFAULT_DATA_META.owner),
        updated_at: toMetaText(updated_at, DEFAULT_DATA_META.updated_at),
        status: toMetaText(status, DEFAULT_DATA_META.status),
        tags: normalizeMetaTags([`dataset:${dataset}`, ...(Array.isArray(tags) ? tags : [])]),
      });
      return acc;
    }, {})
  );

export const createDataEntryMetaMap = (entries, options = {}) =>
  createDataItemMetaMap(Object.values(entries || {}), options);

export const COMMON_PROCESSING_SERVICES = {
  proc_hinge_hole: {
    id: "proc_hinge_hole",
    label: "경첩 홀 가공",
    pricingRule: { type: "perHole", value: 1500, unit: "hole" },
    type: "detail",
    thumbnail: null,
    swatch: "linear-gradient(135deg, #f0f7ff 0%, #c1dbff 100%)",
    description: "경첩 홀 1개당",
  },
  proc_handle_hole: {
    id: "proc_handle_hole",
    label: "피스 홀 타공",
    pricingRule: { type: "perHole", value: 1200, unit: "hole" },
    type: "detail",
    thumbnail: null,
    swatch: "linear-gradient(135deg, #fef4e6 0%, #ffd9a8 100%)",
    description: "피스 홀 1개당",
  },
};

export const COMMON_ADDON_ITEMS = [
  {
    id: "hinge_basic",
    name: "경첩(일반)",
    pricingRule: { type: "fixed", value: 2000, unit: "item" },
    description: "소형 캐비닛용 기본 경첩",
  },
  {
    id: "screw_set",
    name: "목재용 피스 세트",
    pricingRule: { type: "fixed", value: 3000, unit: "item" },
    description: "다양한 길이의 피스 50ea",
  },
  {
    id: "handle_simple",
    name: "손잡이(블랙)",
    pricingRule: { type: "fixed", value: 4500, unit: "item" },
    description: "미니멀 블랙 손잡이 2ea",
  },
  {
    id: "soft_close",
    name: "소프트클로징 댐퍼",
    pricingRule: { type: "fixed", value: 6000, unit: "item" },
    description: "도어 닫힘을 부드럽게",
  },
  {
    id: "glide_runner",
    name: "서랍 레일 세트",
    pricingRule: { type: "fixed", value: 8000, unit: "item" },
    description: "볼레일 1세트",
  },
  {
    id: "felt_pad",
    name: "가구 패드",
    pricingRule: { type: "fixed", value: 1500, unit: "item" },
    description: "바닥 긁힘 방지 패드 20개",
  },
  {
    id: "wood_glue",
    name: "목공용 본드",
    pricingRule: { type: "fixed", value: 2500, unit: "item" },
    description: "빠른 경화 목공용 접착제",
  },
];

export const COMMON_DATASETS_META = Object.freeze({
  processing_services: createDatasetMeta({
    id: "common_processing_services",
    label: "공통 가공 서비스 데이터",
    description: "페이지 간 공통으로 재사용 가능한 가공 서비스 원본 데이터입니다.",
    source: "assets/js/data/common-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "shared:data"],
  }),
  addon_items: createDatasetMeta({
    id: "common_addon_items",
    label: "공통 부자재 데이터",
    description: "페이지 간 공통으로 재사용 가능한 부자재 원본 데이터입니다.",
    source: "assets/js/data/common-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "shared:data"],
  }),
});

export const COMMON_DATA_META_BY_ID = Object.freeze({
  processing_services: createDataEntryMetaMap(COMMON_PROCESSING_SERVICES, {
    dataset: "common_processing_services",
    source: "assets/js/data/common-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "shared:data", "kind:processing"],
    labelKey: "label",
  }),
  addon_items: createDataItemMetaMap(COMMON_ADDON_ITEMS, {
    dataset: "common_addon_items",
    source: "assets/js/data/common-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "shared:data", "kind:addon"],
  }),
});
