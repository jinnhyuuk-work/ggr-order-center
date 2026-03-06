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
