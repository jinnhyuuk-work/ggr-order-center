import { getAdditionalSelectionConfigForPage, resolveSelectionIds } from "./additional-selection-policy.js";
import { createDataItemMetaMap, createDatasetMeta } from "./addon-data.js";

export const ADDITIONAL_PROCESSING_ITEMS = [
  {
    id: "proc_hinge_hole",
    kind: "processing",
    label: "경첩 홀 가공",
    pricingRule: { type: "perHole", value: 2000, unit: "hole" },
    availabilityRule: { type: "ok" },
    type: "detail",
    requiresInput: true,
    inputMode: "hole-list",
    required: false,
    validation: {
      rule: "holes_required",
      minCount: 1,
      fields: ["edge", "distance", "verticalRef", "verticalDistance"],
    },
    thumbnail: null,
    swatch: null,
    description: "경첩 홀 1개당",
  },
  {
    id: "proc_handle_hole",
    kind: "processing",
    label: "피스 홀 타공",
    pricingRule: { type: "perHole", value: 1200, unit: "hole" },
    availabilityRule: { type: "ok" },
    type: "detail",
    requiresInput: true,
    inputMode: "hole-list",
    required: false,
    validation: {
      rule: "holes_required",
      minCount: 1,
      fields: ["edge", "distance", "verticalRef", "verticalDistance"],
    },
    thumbnail: null,
    swatch: null,
    description: "피스 홀 1개당",
  },
  {
    id: "top_back_shelf",
    kind: "processing",
    label: "뒷턱/뒷선반 추가",
    pricingRule: { type: "free", value: 0, unit: "item", label: "가용높이 내 무료" },
    availabilityRule: {
      type: "conditional",
      ruleKey: "top_back_height_limit",
      defaultStatus: "ok",
    },
    type: "simple",
    requiresInput: false,
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description:
      "뒷턱 높이를 입력할 수 있습니다. 가용높이(760 - 상판 깊이) 내 무료, 초과 시 상담안내로 처리됩니다.",
    displayPriceText: "가용높이 내 무료",
  },
];

const PROCESSING_CATALOG_BY_ID = Object.freeze(
  Object.fromEntries(
    ADDITIONAL_PROCESSING_ITEMS.filter((item) => item?.id).map((item) => [item.id, item])
  )
);

export const ADDITIONAL_PROCESSING_DATASET_META = createDatasetMeta({
  id: "additional_processing",
  label: "추가 가공 서비스 데이터",
  description: "페이지별로 재사용되는 추가 가공 서비스 원본 목록입니다.",
  source: "assets/js/data/additional-processing-data.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "selection:processing"],
});

export const ADDITIONAL_PROCESSING_META_BY_ID = createDataItemMetaMap(ADDITIONAL_PROCESSING_ITEMS, {
  dataset: "additional_processing",
  source: "assets/js/data/additional-processing-data.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "kind:processing"],
  labelKey: "label",
});

export function getAdditionalProcessingServicesForPage(pageKey) {
  const pageConfig = getAdditionalSelectionConfigForPage(pageKey);
  const processingIds = pageConfig?.sections?.processing
    ? resolveSelectionIds({
        includeIds: pageConfig.processing?.includeIds,
        excludeIds: pageConfig.processing?.excludeIds,
        catalogById: PROCESSING_CATALOG_BY_ID,
      })
    : [];
  return Object.fromEntries(
    processingIds
      .map((id) => PROCESSING_CATALOG_BY_ID[id])
      .filter(Boolean)
      .map((item) => [item.id, { ...item }])
  );
}
