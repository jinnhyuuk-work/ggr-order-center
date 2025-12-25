import { arrayToMap, COMMON_PROCESSING_SERVICES, COMMON_ADDON_ITEMS } from "./common-data.js";

const LPM_ITEMS = [
  {
    id: "lpm_basic",
    name: "베이직",
    category: "LPM",
    availableThickness: [18],
    pricePerM2: 47000,
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
    pricePerM2: 47000,
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
    pricePerM2: 47000,
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
    pricePerM2: 45000,
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
    pricePerM2: 45000,
    density: 720,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "#fafafa",
  },
];

export const MATERIALS = {
  ...arrayToMap(LPM_ITEMS),
  ...arrayToMap(PP_ITEMS),
};

export const MATERIAL_CATEGORIES_DESC = {
  LPM: "LPM 마감재 카테고리입니다.",
  PP: "PP 마감재 카테고리입니다.",
};

export const BOARD_PROCESSING_SERVICES = {
  ...COMMON_PROCESSING_SERVICES,
};

export const BOARD_OPTIONS = [
  {
    id: "edge_finish",
    name: "엣지 마감",
    price: 5000,
    description: "절단면에 엣지 마감을 추가합니다.",
  },
  {
    id: "surface_coating",
    name: "표면 코팅",
    price: 7000,
    description: "표면 보호를 위한 코팅 옵션입니다.",
  },
  {
    id: "anti_scratch",
    name: "스크래치 보호",
    price: 4000,
    description: "스크래치 보호 필름을 추가합니다.",
  },
];

export const BOARD_ADDON_ITEMS = [...COMMON_ADDON_ITEMS];
