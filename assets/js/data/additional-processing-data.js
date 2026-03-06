import { ADDITIONAL_SELECTION_PAGE_MAP, ORDER_PAGE_KEYS } from "./additional-page-map.js";

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
    visibleOn: [ORDER_PAGE_KEYS.BOARD, ORDER_PAGE_KEYS.DOOR, ORDER_PAGE_KEYS.TOP],
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
    visibleOn: [ORDER_PAGE_KEYS.BOARD, ORDER_PAGE_KEYS.DOOR, ORDER_PAGE_KEYS.TOP],
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
    visibleOn: [ORDER_PAGE_KEYS.TOP],
    swatch: "linear-gradient(135deg, #f4f7e9 0%, #dce9c3 100%)",
    description:
      "뒷턱 높이를 입력할 수 있습니다. 가용높이(760 - 상판 폭) 내 무료, 초과 시 상담안내로 처리됩니다.",
    displayPriceText: "가용높이 내 무료",
  },
];

export function getAdditionalProcessingServicesForPage(pageKey) {
  const pageConfig = ADDITIONAL_SELECTION_PAGE_MAP[pageKey];
  const processingIds = pageConfig?.processing || [];
  return processingIds.reduce((acc, id) => {
    const item = ADDITIONAL_PROCESSING_ITEMS.find(
      (candidate) =>
        candidate.id === id &&
        Array.isArray(candidate.visibleOn) &&
        candidate.visibleOn.includes(pageKey)
    );
    if (!item) return acc;
    acc[item.id] = { ...item };
    return acc;
  }, {});
}
