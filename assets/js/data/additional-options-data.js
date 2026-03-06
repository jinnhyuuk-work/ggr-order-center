import { ADDITIONAL_SELECTION_PAGE_MAP, ORDER_PAGE_KEYS } from "./additional-page-map.js";

export const ADDITIONAL_OPTION_ITEMS = [
  {
    id: "board_edge_finish",
    kind: "option",
    name: "엣지 마감",
    label: "엣지 마감",
    price: 5000,
    priceRule: { type: "fixed", value: 5000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.BOARD],
    description: "절단면에 엣지 마감을 추가합니다.",
  },
  {
    id: "board_surface_coating",
    kind: "option",
    name: "표면 코팅",
    label: "표면 코팅",
    price: 7000,
    priceRule: { type: "fixed", value: 7000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.BOARD],
    description: "표면 보호를 위한 코팅 옵션입니다.",
  },
  {
    id: "board_anti_scratch",
    kind: "option",
    name: "스크래치 보호",
    label: "스크래치 보호",
    price: 4000,
    priceRule: { type: "fixed", value: 4000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.BOARD],
    description: "스크래치 보호 필름을 추가합니다.",
  },
  {
    id: "door_edge_finish",
    kind: "option",
    name: "엣지 마감",
    label: "엣지 마감",
    price: 5000,
    priceRule: { type: "fixed", value: 5000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.DOOR],
    description: "절단면에 엣지 마감을 추가합니다.",
  },
  {
    id: "door_surface_coating",
    kind: "option",
    name: "표면 코팅",
    label: "표면 코팅",
    price: 7000,
    priceRule: { type: "fixed", value: 7000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.DOOR],
    description: "표면 보호를 위한 코팅 옵션입니다.",
  },
  {
    id: "door_anti_scratch",
    kind: "option",
    name: "스크래치 보호",
    label: "스크래치 보호",
    price: 4000,
    priceRule: { type: "fixed", value: 4000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.DOOR],
    description: "스크래치 보호 필름을 추가합니다.",
  },
  {
    id: "top_sink_cut",
    kind: "option",
    name: "싱크볼 타공",
    label: "싱크볼 타공",
    price: 30000,
    priceRule: { type: "fixed", value: 30000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.TOP],
    description:
      "싱크볼의 사이즈에 맞춰 타공을 추가합니다.<br>정확한 사이즈와 위치를 위해 상담이 필요합니다.",
  },
  {
    id: "top_faucet_hole",
    kind: "option",
    name: "수전 타공",
    label: "수전 타공",
    price: 10000,
    priceRule: { type: "fixed", value: 10000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.TOP],
    description:
      "싱크볼에 수전 타공을 추가합니다.<br>정확한 사이즈를 위해 상담이 필요합니다.",
  },
  {
    id: "top_cooktop_cut",
    kind: "option",
    name: "쿡탑 타공",
    label: "쿡탑 타공",
    price: 20000,
    priceRule: { type: "fixed", value: 20000, unit: "item" },
    required: false,
    validation: null,
    visibleOn: [ORDER_PAGE_KEYS.TOP],
    description:
      "쿡탑의 사이즈에 맞춰 타공을 추가합니다.<br>정확한 사이즈와 위치를 위해 상담이 필요합니다.",
  },
];

export function getAdditionalOptionsForPage(pageKey) {
  const pageConfig = ADDITIONAL_SELECTION_PAGE_MAP[pageKey];
  const optionIds = pageConfig?.options || [];
  return optionIds
    .map((id) =>
      ADDITIONAL_OPTION_ITEMS.find(
        (item) => item.id === id && Array.isArray(item.visibleOn) && item.visibleOn.includes(pageKey)
      )
    )
    .filter(Boolean)
    .map((item) => ({ ...item }));
}
