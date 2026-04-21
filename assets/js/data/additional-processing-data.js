import { getAdditionalSelectionConfigForPage, resolveSelectionIds } from "./additional-page-map.js";
import { createDataItemMetaMap, createDatasetMeta } from "./addon-data.js";

const HOLE_INPUT_FIELDS = Object.freeze(["edge", "distance", "verticalRef", "verticalDistance"]);

const createProcessingItem = (item) => Object.freeze({ ...item });

const createPerHoleProcessingItem = ({
  id,
  label,
  value,
  description,
  displayPriceText = null,
}) =>
  createProcessingItem({
    id,
    kind: "processing",
    label,
    pricingRule: { type: "perHole", value, unit: "hole" },
    availabilityRule: { type: "ok" },
    type: "detail",
    requiresInput: true,
    inputMode: "hole-list",
    required: false,
    validation: {
      rule: "holes_required",
      minCount: 1,
      fields: [...HOLE_INPUT_FIELDS],
    },
    thumbnail: null,
    swatch: null,
    description,
    ...(displayPriceText ? { displayPriceText } : {}),
  });

const createConditionalProcessingItem = ({
  id,
  label,
  description,
  priceLabel,
  ruleKey,
}) =>
  createProcessingItem({
    id,
    kind: "processing",
    label,
    pricingRule: { type: "free", value: 0, unit: "item", label: priceLabel },
    availabilityRule: {
      type: "conditional",
      ruleKey,
      defaultStatus: "ok",
    },
    type: "simple",
    requiresInput: false,
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description,
    displayPriceText: priceLabel,
  });

export const ADDITIONAL_PROCESSING_ITEMS = [
  createPerHoleProcessingItem({
    id: "proc_hinge_hole",
    label: "경첩 홀 가공",
    value: 1500,
    description: "경첩 홀 1개당",
  }),
  createPerHoleProcessingItem({
    id: "proc_handle_hole",
    label: "피스 홀 타공",
    value: 1200,
    description: "피스 홀 1개당",
  }),
  createConditionalProcessingItem({
    id: "top_back_shelf",
    label: "뒷턱/뒷선반 추가",
    description:
      "뒷턱 높이를 입력할 수 있습니다. 가용높이(760 - 상판 깊이) 내 무료, 초과 시 상담안내로 처리됩니다.",
    priceLabel: "가용높이 내 무료",
    ruleKey: "top_back_height_limit",
  }),
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
