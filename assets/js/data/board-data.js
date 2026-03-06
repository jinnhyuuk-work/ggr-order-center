import { arrayToMap, COMMON_ADDON_ITEMS } from "./common-data.js";
import { ORDER_PAGE_KEYS } from "./additional-page-map.js";
import { getAdditionalOptionsForPage } from "./additional-options-data.js";
import { getAdditionalProcessingServicesForPage } from "./additional-processing-data.js";

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
  ...getAdditionalProcessingServicesForPage(ORDER_PAGE_KEYS.BOARD),
};

export const BOARD_OPTIONS = getAdditionalOptionsForPage(ORDER_PAGE_KEYS.BOARD);

export const BOARD_ADDON_ITEMS = [...COMMON_ADDON_ITEMS];
