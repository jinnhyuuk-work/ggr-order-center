import { arrayToMap, COMMON_ADDON_ITEMS } from "./common-data.js";

const LPM_ITEMS = [
  {
    id: "lpm_basic",
    name: "베이직",
    category: "LPM",
    availableThickness: [18],
    pricePerM2: 47000,
    density: 720,
    swatch: "#f1f1f1",
  },
  {
    id: "lpm_natural_walnut",
    name: "네추럴 월넛",
    category: "LPM",
    availableThickness: [18],
    pricePerM2: 47000,
    density: 720,
    swatch: "#b38352",
  },
  {
    id: "lpm_smoke_walnut",
    name: "스모크 월넛",
    category: "LPM",
    availableThickness: [18],
    pricePerM2: 47000,
    density: 720,
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
    swatch: "#c7c7c7",
  },
  {
    id: "pp_white",
    name: "화이트",
    category: "PP",
    availableThickness: [18],
    pricePerM2: 45000,
    density: 720,
    swatch: "#fafafa",
  },
];

export const SYSTEM_SHELF_MATERIALS = {
  ...arrayToMap(LPM_ITEMS),
  ...arrayToMap(PP_ITEMS),
};

export const SYSTEM_COLUMN_MATERIALS = {
  ...arrayToMap(LPM_ITEMS),
  ...arrayToMap(PP_ITEMS),
};

export const SYSTEM_MATERIAL_CATEGORIES_DESC = {
  LPM: "LPM 마감재 카테고리입니다.",
  PP: "PP 마감재 카테고리입니다.",
};

export const SYSTEM_CUSTOM_PROCESSING = {
  shelf_custom: {
    id: "shelf_custom",
    label: "선반 비규격 가공",
    price: 0,
    description: "규격 외 사이즈는 상담 후 견적입니다.",
  },
  column_over_2400: {
    id: "column_over_2400",
    label: "기둥 2400 이상 추가비",
    price: 0,
    description: "기둥 높이가 2400mm 이상이면 추가 비용이 발생합니다.",
  },
};

const SYSTEM_FURNITURE_ITEMS = [
  {
    id: "drawer_1tier",
    name: "서랍장 1단",
    price: 22000,
    description: "서랍장 1단 모듈 1세트",
  },
  {
    id: "drawer_2tier",
    name: "서랍장 2단",
    price: 30000,
    description: "서랍장 2단 모듈 1세트",
  },
  {
    id: "drawer_3tier",
    name: "서랍장 3단",
    price: 38000,
    description: "서랍장 3단 모듈 1세트",
  },
  {
    id: "drawer_4tier",
    name: "서랍장 4단",
    price: 46000,
    description: "서랍장 4단 모듈 1세트",
  },
  {
    id: "clothes_rod",
    name: "옷봉",
    price: 12000,
    description: "알루미늄 옷봉 1개",
  },
];

export const SYSTEM_ADDON_ITEMS = [...SYSTEM_FURNITURE_ITEMS];
