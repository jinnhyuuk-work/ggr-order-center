import { getAdditionalSelectionConfigForPage, resolveSelectionIds } from "./additional-selection-policy.js";
import { createDataItemMetaMap, createDatasetMeta } from "./addon-data.js";

export const ADDITIONAL_OPTION_ITEMS = [
  {
    id: "board_edge_finish",
    kind: "option",
    name: "엣지 마감",
    pricingRule: { type: "fixed", value: 5000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description: "절단면에 엣지 마감을 추가합니다.",
  },
  {
    id: "board_surface_coating",
    kind: "option",
    name: "표면 코팅",
    pricingRule: { type: "fixed", value: 7000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description: "표면 보호를 위한 코팅 옵션입니다.",
  },
  {
    id: "board_anti_scratch",
    kind: "option",
    name: "스크래치 보호",
    pricingRule: { type: "fixed", value: 4000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description: "스크래치 보호 필름을 추가합니다.",
  },
  {
    id: "door_edge_finish",
    kind: "option",
    name: "엣지 마감",
    pricingRule: { type: "fixed", value: 5000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description: "절단면에 엣지 마감을 추가합니다.",
  },
  {
    id: "door_surface_coating",
    kind: "option",
    name: "표면 코팅",
    pricingRule: { type: "fixed", value: 7000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description: "표면 보호를 위한 코팅 옵션입니다.",
  },
  {
    id: "door_anti_scratch",
    kind: "option",
    name: "스크래치 보호",
    pricingRule: { type: "fixed", value: 4000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description: "스크래치 보호 필름을 추가합니다.",
  },
  {
    id: "top_sink_cut",
    kind: "option",
    name: "싱크볼 타공",
    pricingRule: { type: "fixed", value: 30000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description:
      "싱크볼의 사이즈에 맞춰 타공을 추가합니다.<br>정확한 사이즈와 위치를 위해 상담이 필요합니다.",
  },
  {
    id: "top_faucet_hole",
    kind: "option",
    name: "수전 타공",
    pricingRule: { type: "fixed", value: 10000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description:
      "싱크볼에 수전 타공을 추가합니다.<br>정확한 사이즈를 위해 상담이 필요합니다.",
  },
  {
    id: "top_cooktop_cut",
    kind: "option",
    name: "쿡탑 타공",
    pricingRule: { type: "fixed", value: 20000, unit: "item" },
    availabilityRule: { type: "ok" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description:
      "쿡탑의 사이즈에 맞춰 타공을 추가합니다.<br>정확한 사이즈와 위치를 위해 상담이 필요합니다.",
  },
  {
    id: "top_back_add",
    kind: "option",
    name: "뒷턱/뒷선반 추가",
    pricingRule: { type: "fixed", value: 20000, unit: "item" },
    availabilityRule: { type: "consult" },
    required: false,
    validation: null,
    thumbnail: null,
    swatch: null,
    description:
      "상판에 뒷턱과 뒷선반을 추가합니다.<br>정확한 사이즈와 위치를 위해 상담이 필요합니다.",
  },
];

const OPTION_CATALOG_BY_ID = Object.freeze(
  ADDITIONAL_OPTION_ITEMS.reduce((acc, item) => {
    if (!item?.id) return acc;
    acc[item.id] = Object.freeze({ ...item });
    return acc;
  }, {})
);

export const ADDITIONAL_OPTIONS_DATASET_META = createDatasetMeta({
  id: "additional_options",
  label: "추가 옵션 데이터",
  description: "페이지(상판/도어/합판)별로 재사용되는 추가 옵션 원본 목록입니다.",
  source: "assets/js/data/additional-options-data.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "selection:options"],
});

export const ADDITIONAL_OPTIONS_META_BY_ID = createDataItemMetaMap(ADDITIONAL_OPTION_ITEMS, {
  dataset: "additional_options",
  source: "assets/js/data/additional-options-data.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "kind:option"],
});

export function getAdditionalOptionsForPage(pageKey) {
  const pageConfig = getAdditionalSelectionConfigForPage(pageKey);
  const optionIds = pageConfig?.sections?.options
    ? resolveSelectionIds({
        includeIds: pageConfig.options?.includeIds,
        excludeIds: pageConfig.options?.excludeIds,
        catalogById: OPTION_CATALOG_BY_ID,
      })
    : [];
  return optionIds
    .map((id) => OPTION_CATALOG_BY_ID[id])
    .filter(Boolean)
    .map((item) => ({ ...item }));
}
