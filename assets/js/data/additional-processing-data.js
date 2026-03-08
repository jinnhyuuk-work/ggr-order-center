import { getAdditionalSelectionConfigForPage } from "./additional-page-map.js";

export const ADDITIONAL_PROCESSING_ITEMS = [
  {
    id: "proc_hinge_hole",
    kind: "processing",
    label: "경첩 홀 가공",
    pricePerHole: 1500,
    type: "detail",
    requiresInput: true,
    inputMode: "hole-list",
    required: false,
    validation: {
      rule: "holes_required",
      minCount: 1,
      fields: ["edge", "distance", "verticalRef", "verticalDistance"],
    },
    swatch: "linear-gradient(135deg, #f0f7ff 0%, #c1dbff 100%)",
    description: "경첩 홀 1개당",
  },
  {
    id: "proc_handle_hole",
    kind: "processing",
    label: "피스 홀 타공",
    pricePerHole: 1200,
    type: "detail",
    requiresInput: true,
    inputMode: "hole-list",
    required: false,
    validation: {
      rule: "holes_required",
      minCount: 1,
      fields: ["edge", "distance", "verticalRef", "verticalDistance"],
    },
    swatch: "linear-gradient(135deg, #fef4e6 0%, #ffd9a8 100%)",
    description: "피스 홀 1개당",
  },
  {
    id: "top_back_shelf",
    kind: "processing",
    label: "뒷턱/뒷선반 추가",
    pricePerMeter: 0,
    type: "simple",
    requiresInput: false,
    required: false,
    validation: null,
    swatch: "linear-gradient(135deg, #f4f7e9 0%, #dce9c3 100%)",
    description:
      "뒷턱 높이를 입력할 수 있습니다. 가용높이(760 - 상판 폭) 내 무료, 초과 시 상담안내로 처리됩니다.",
    displayPriceText: "가용높이 내 무료",
  },
];

const PROCESSING_CATALOG_BY_ID = Object.freeze(
  ADDITIONAL_PROCESSING_ITEMS.reduce((acc, item) => {
    if (!item?.id) return acc;
    acc[item.id] = Object.freeze({ ...item });
    return acc;
  }, {})
);

export function getAdditionalProcessingServicesForPage(pageKey) {
  const pageConfig = getAdditionalSelectionConfigForPage(pageKey);
  const processingIds = pageConfig?.sections?.processing ? pageConfig.processingIds : [];
  return processingIds.reduce((acc, id) => {
    const item = PROCESSING_CATALOG_BY_ID[id];
    if (!item) return acc;
    acc[item.id] = { ...item };
    return acc;
  }, {});
}
