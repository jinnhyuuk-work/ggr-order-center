import {
  arrayToMap,
  COMMON_ADDON_ITEMS,
  createDataEntryMetaMap,
  createDataItemMetaMap,
  createDatasetMeta,
} from "./addon-data.js";
import { ORDER_DIMENSION_LIMITS, withDimensionLimits } from "./dimension-constraints.js";
import { ORDER_PAGE_KEYS } from "./additional-selection-policy.js";
import {
  getAdditionalOptionIdsForPage,
  getAdditionalOptionsForPage,
} from "./additional-options-data.js";
import {
  getAdditionalProcessingServiceIdsForPage,
  getAdditionalProcessingServicesForPage,
} from "./additional-processing-data.js";
import { filterAvailableMap } from "./product-availability.js";
import { PRODUCT_AVAILABILITY_POLICY } from "./product-availability-policy.js";

export const BOARD_DIMENSION_LIMITS = ORDER_DIMENSION_LIMITS.board;
export const BOARD_PRODUCT_AVAILABILITY = PRODUCT_AVAILABILITY_POLICY.board;

const applyBoardDimensionLimits = (items = []) =>
  items.map((item) => withDimensionLimits(item, BOARD_DIMENSION_LIMITS));

const LPM_ITEMS = [
  {
    id: "lpm_basic",
    name: "베이직",
    category: "LPM",
    availableThickness: [18],
    thumbnail: null,
    pricingRule: Object.freeze({ type: "area", value: 47000, unit: "m2" }),
    density: 720,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "#f1f1f1",
  },
  {
    id: "lpm_natural_walnut",
    name: "네추럴 월넛",
    category: "LPM",
    availableThickness: [18],
    thumbnail: null,
    pricingRule: Object.freeze({ type: "area", value: 47000, unit: "m2" }),
    density: 720,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "#b38352",
  },
  {
    id: "lpm_smoke_walnut",
    name: "스모크 월넛",
    category: "LPM",
    availableThickness: [18],
    thumbnail: null,
    pricingRule: Object.freeze({ type: "area", value: 47000, unit: "m2" }),
    density: 720,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "#6b4b36",
  },
];

const PP_ITEMS = [
  {
    id: "pp_twill",
    name: "트윌",
    category: "PP",
    availableThickness: [18],
    thumbnail: null,
    pricingRule: Object.freeze({ type: "area", value: 45000, unit: "m2" }),
    density: 720,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "#c7c7c7",
  },
  {
    id: "pp_white",
    name: "화이트",
    category: "PP",
    availableThickness: [18],
    thumbnail: null,
    pricingRule: Object.freeze({ type: "area", value: 45000, unit: "m2" }),
    density: 720,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "#fafafa",
  },
];

const BOARD_MATERIALS_BASE = {
  ...arrayToMap(applyBoardDimensionLimits(LPM_ITEMS)),
  ...arrayToMap(applyBoardDimensionLimits(PP_ITEMS)),
};

export const MATERIALS = filterAvailableMap(BOARD_MATERIALS_BASE, BOARD_PRODUCT_AVAILABILITY);

export const MATERIAL_CATEGORIES_DESC = {
  LPM: "LPM 마감재 카테고리입니다.",
  PP: "PP 마감재 카테고리입니다.",
};

export const BOARD_PROCESSING_SERVICES = {
  ...getAdditionalProcessingServicesForPage(ORDER_PAGE_KEYS.BOARD, {
    includeAllCategories: true,
  }),
};

export const BOARD_OPTIONS = getAdditionalOptionsForPage(ORDER_PAGE_KEYS.BOARD, {
  includeAllCategories: true,
});

export const getBoardOptionIdsForCategory = (categoryKey = "") =>
  getAdditionalOptionIdsForPage(ORDER_PAGE_KEYS.BOARD, { categoryKey });

export const getBoardProcessingServiceIdsForCategory = (categoryKey = "") =>
  getAdditionalProcessingServiceIdsForPage(ORDER_PAGE_KEYS.BOARD, { categoryKey });

export const BOARD_ADDON_ITEMS = [...COMMON_ADDON_ITEMS];

export const BOARD_DATASETS_META = Object.freeze({
  materials: createDatasetMeta({
    id: "board_materials",
    label: "합판 자재 데이터",
    description: "합판 페이지에서 사용되는 자재/단가 기준 데이터입니다.",
    source: "assets/js/data/board-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board"],
  }),
  processing_services: createDatasetMeta({
    id: "board_processing_services",
    label: "합판 가공 서비스 데이터",
    description: "합판 페이지에서 노출되는 가공 서비스 데이터입니다.",
    source: "assets/js/data/board-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board"],
  }),
  options: createDatasetMeta({
    id: "board_options",
    label: "합판 옵션 데이터",
    description: "합판 페이지에서 선택 가능한 추가 옵션 데이터입니다.",
    source: "assets/js/data/board-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board"],
  }),
  addon_items: createDatasetMeta({
    id: "board_addon_items",
    label: "합판 부자재 데이터",
    description: "합판 페이지에서 공통으로 사용하는 부자재 데이터입니다.",
    source: "assets/js/data/board-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board"],
  }),
});

export const BOARD_DATA_META_BY_ID = Object.freeze({
  materials: createDataEntryMetaMap(MATERIALS, {
    dataset: "board_materials",
    source: "assets/js/data/board-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board", "kind:material"],
  }),
  processing_services: createDataEntryMetaMap(BOARD_PROCESSING_SERVICES, {
    dataset: "board_processing_services",
    source: "assets/js/data/board-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board", "kind:processing"],
    labelKey: "label",
  }),
  options: createDataItemMetaMap(BOARD_OPTIONS, {
    dataset: "board_options",
    source: "assets/js/data/board-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board", "kind:option"],
  }),
  addon_items: createDataItemMetaMap(BOARD_ADDON_ITEMS, {
    dataset: "board_addon_items",
    source: "assets/js/data/board-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board", "kind:addon"],
  }),
});
