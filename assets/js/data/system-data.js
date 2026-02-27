import { arrayToMap, COMMON_ADDON_ITEMS } from "./common-data.js";

const LPM_ITEMS = [
  {
    id: "lpm_basic",
    name: "베이직",
    category: "LPM",
    availableThickness: [18],
    pricePerM2: 47000,
    density: 720,
    swatch: "#d9d9d9",
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

const COLUMN_ITEMS = [
  {
    id: "column_white",
    name: "화이트",
    category: "포스트바",
    availableThickness: [18],
    pricePerM2: 45000,
    density: 720,
    swatch: "#f6f6f6",
  },
  {
    id: "column_silver",
    name: "실버",
    category: "포스트바",
    availableThickness: [18],
    pricePerM2: 45000,
    density: 720,
    swatch: "#b7bcc6",
  },
  {
    id: "column_black",
    name: "블랙",
    category: "포스트바",
    availableThickness: [18],
    pricePerM2: 45000,
    density: 720,
    swatch: "#2a2a2a",
  },
];

export const SYSTEM_COLUMN_MATERIALS = {
  ...arrayToMap(COLUMN_ITEMS),
};

export const SYSTEM_MATERIAL_CATEGORIES_DESC = {
  LPM: "LPM 마감재 카테고리입니다.",
  PP: "PP 마감재 카테고리입니다.",
  포스트바: "포스트바 컬러 카테고리입니다.",
};

export const SYSTEM_CUSTOM_PROCESSING = {
  shelf_custom: {
    id: "shelf_custom",
    label: "선반 비규격 가공",
    price: 0,
    description: "규격 외 사이즈는 상담 후 견적입니다.",
  },
};

export const SYSTEM_SHELF_TIER_GUIDE = Object.freeze({
  normal: "일반 선반: 400 이하 / 600 이하 / 800 이하 / 비규격(상담)",
  corner: "코너 선반: 코너 표준 / 비규격(상담)",
  cornerCustomNote: "코너 비규격은 800×600 이하 절단만 가능",
});

export const SYSTEM_POST_BAR_HEIGHT_LIMITS = Object.freeze({
  min: 1800,
  max: 2700,
  pricing: Object.freeze({
    lte2100: 2100,
    lte2300: 2300,
    lte2500: 2500,
  }),
  consultAt: 2500,
});

export const SYSTEM_SHELF_TIER_PRICING = Object.freeze({
  normal: Object.freeze({
    id: "normal_shelf_pricing",
    label: "일반 선반",
    tiers: Object.freeze([
      Object.freeze({
        key: "lte_400",
        label: "400 이하",
        matchMode: "range",
        maxWidthMm: 400,
        priceByCategory: Object.freeze({
          LPM: 22000,
          PP: 20000,
        }),
      }),
      Object.freeze({
        key: "lte_600",
        label: "600 이하",
        matchMode: "range",
        maxWidthMm: 600,
        priceByCategory: Object.freeze({
          LPM: 28000,
          PP: 25500,
        }),
      }),
      Object.freeze({
        key: "lte_800",
        label: "800 이하",
        matchMode: "range",
        maxWidthMm: 800,
        priceByCategory: Object.freeze({
          LPM: 34000,
          PP: 31000,
        }),
      }),
      Object.freeze({
        key: "gt_800_custom",
        label: "비규격(상담)",
        matchMode: "range",
        minWidthExclusiveMm: 800,
        isCustomPrice: true,
      }),
    ]),
  }),
  corner: Object.freeze({
    id: "corner_shelf_pricing",
    label: "코너 선반",
    tiers: Object.freeze([
      Object.freeze({
        key: "corner_standard",
        label: "코너 표준",
        matchMode: "range",
        maxWidthMm: 800,
        priceByCategory: Object.freeze({
          LPM: 42000,
          PP: 39000,
        }),
      }),
      Object.freeze({
        key: "corner_custom",
        label: "비규격(상담)",
        matchMode: "manual",
        mode: "trim_only",
        baseSizeMm: Object.freeze({ primary: 800, secondary: 600 }),
        isCustomPrice: true,
      }),
    ]),
  }),
});

export const SYSTEM_POST_BAR_PRICING = Object.freeze({
  basic: Object.freeze({
    id: "basic_post_bar",
    label: "기본 포스트바",
    tiers: Object.freeze([
      Object.freeze({
        key: "lte_2100",
        label: "2100 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2100,
        unitPrice: 28000,
      }),
      Object.freeze({
        key: "lte_2300",
        label: "2300 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2300,
        unitPrice: 28000,
      }),
      Object.freeze({
        key: "lte_2500",
        label: "2500 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2500,
        unitPrice: 31000,
      }),
    ]),
  }),
  corner: Object.freeze({
    id: "corner_post_bar",
    label: "코너 포스트바",
    tiers: Object.freeze([
      Object.freeze({
        key: "lte_2100",
        label: "2100 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2100,
        unitPrice: 14000,
      }),
      Object.freeze({
        key: "lte_2300",
        label: "2300 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2300,
        unitPrice: 14000,
      }),
      Object.freeze({
        key: "lte_2500",
        label: "2500 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2500,
        unitPrice: 14000,
      }),
    ]),
  }),
});

export const SYSTEM_ADDON_ITEM_IDS = Object.freeze({
  CLOTHES_ROD: "clothes_rod",
});

export const SYSTEM_ADDON_OPTION_CONFIG = Object.freeze({
  selectionMode: "single",
  categories: [
    { key: "drawer", label: "서랍장", order: 10 },
    { key: "open", label: "오픈장", order: 20 },
    { key: "hanger", label: "행거", order: 30 },
    { key: "etc", label: "기타", order: 99 },
  ],
});

export const SYSTEM_MODULE_OPTION_CONFIG = Object.freeze({
  normal: Object.freeze({
    widthOptions: Object.freeze([400, 600, 800]),
  }),
  corner: Object.freeze({
    directionOptions: Object.freeze([
      Object.freeze({ key: "800x600", label: "800 × 600", swap: false }),
      Object.freeze({ key: "600x800", label: "600 × 800", swap: true }),
    ]),
  }),
});

export const SYSTEM_MODULE_PRESET_CATEGORIES = Object.freeze([
  Object.freeze({ key: "hanger", label: "행거형", order: 10 }),
  Object.freeze({ key: "shelf", label: "선반형", order: 20 }),
  Object.freeze({ key: "furniture", label: "가구형", order: 30 }),
  Object.freeze({ key: "etc", label: "확장형", order: 99 }),
]);

const SYSTEM_MODULE_PRESET_ITEMS = [
  {
    id: "GSH-1",
    moduleType: "normal",
    categoryKey: "hanger",
    label: "GSH-1",
    filterKeys: ["400", "600", "800"],
    count: 3,
    rodCount: 1,
    price: 0,
    description: "선반 3개 / 행거 1개",
    active: true,
    sortOrder: 110,
  },
  {
    id: "GSH-2",
    moduleType: "normal",
    categoryKey: "hanger",
    label: "GSH-2",
    filterKeys: ["400", "600", "800"],
    count: 3,
    rodCount: 2,
    price: 0,
    description: "선반 3개 / 행거 2개",
    active: true,
    sortOrder: 120,
  },
  {
    id: "GSH-3",
    moduleType: "normal",
    categoryKey: "hanger",
    label: "GSH-3",
    filterKeys: ["400", "600", "800"],
    count: 4,
    rodCount: 1,
    price: 0,
    description: "선반 4개 / 행거 1개",
    active: true,
    sortOrder: 130,
  },
  {
    id: "GS-5",
    moduleType: "normal",
    categoryKey: "shelf",
    label: "GS-5",
    filterKeys: ["400", "600", "800"],
    count: 5,
    rodCount: 0,
    price: 0,
    description: "선반 5개",
    active: true,
    sortOrder: 210,
  },
  {
    id: "GS-6",
    moduleType: "normal",
    categoryKey: "shelf",
    label: "GS-6",
    filterKeys: ["400", "600", "800"],
    count: 6,
    rodCount: 0,
    price: 0,
    description: "선반 6개",
    active: true,
    sortOrder: 220,
  },
  {
    id: "GED-1",
    moduleType: "normal",
    categoryKey: "furniture",
    label: "GED-1",
    filterKeys: ["600", "800"],
    count: 2,
    rodCount: 2,
    furnitureAddonId: "drawer_hanging_1tier",
    price: 0,
    description: "1단 공중형 서랍 / 선반 2개 / 행거 2개",
    active: true,
    sortOrder: 310,
  },
  {
    id: "GED-2",
    moduleType: "normal",
    categoryKey: "furniture",
    label: "GED-2",
    filterKeys: ["600", "800"],
    count: 2,
    rodCount: 1,
    furnitureAddonId: "drawer_hanging_2tier",
    price: 0,
    description: "2단 공중형 서랍 / 선반 2개 / 행거 1개",
    active: true,
    sortOrder: 320,
  },
  {
    id: "GFD-2",
    moduleType: "normal",
    categoryKey: "furniture",
    label: "GFD-2",
    filterKeys: ["600", "800"],
    count: 1,
    rodCount: 1,
    furnitureAddonId: "drawer_floor_2tier",
    price: 0,
    description: "2단 바닥형 서랍 / 선반 1개 / 행거 1개",
    active: true,
    sortOrder: 330,
  },
  {
    id: "GFD-3",
    moduleType: "normal",
    categoryKey: "furniture",
    label: "GFD-3",
    filterKeys: ["600", "800"],
    count: 1,
    rodCount: 1,
    furnitureAddonId: "drawer_floor_3tier",
    price: 0,
    description: "3단 바닥형 서랍 / 선반 1개 / 행거 1개",
    active: true,
    sortOrder: 340,
  },
  {
    id: "GFD-4",
    moduleType: "normal",
    categoryKey: "furniture",
    label: "GFD-4",
    filterKeys: ["600", "800"],
    count: 1,
    rodCount: 1,
    furnitureAddonId: "drawer_floor_4tier",
    price: 0,
    description: "4단 바닥형 서랍 / 선반 1개 / 행거 1개",
    active: true,
    sortOrder: 350,
  },
  {
    id: "GS-1",
    moduleType: "normal",
    categoryKey: "etc",
    label: "GS-1",
    filterKeys: ["400", "600", "800"],
    count: 1,
    rodCount: 0,
    price: 0,
    description: "선반 1개",
    active: true,
    sortOrder: 410,
  },
  {
    id: "GS-3",
    moduleType: "normal",
    categoryKey: "etc",
    label: "GS-3",
    filterKeys: ["400", "600", "800"],
    count: 3,
    rodCount: 0,
    price: 0,
    description: "선반 3개",
    active: true,
    sortOrder: 420,
  },
  {
    id: "GSC-1",
    moduleType: "corner",
    categoryKey: "hanger",
    label: "GSC-1",
    filterKeys: ["800x600", "600x800"],
    count: 3,
    rodCount: 1,
    price: 0,
    description: "코너 포스트바 1개 / 코너선반 3개 / 행거 1개",
    active: true,
    sortOrder: 510,
  },
  {
    id: "GSC-2",
    moduleType: "corner",
    categoryKey: "hanger",
    label: "GSC-2",
    filterKeys: ["800x600", "600x800"],
    count: 3,
    rodCount: 2,
    price: 0,
    description: "코너 포스트바 1개 / 코너선반 3개 / 행거 2개",
    active: true,
    sortOrder: 520,
  },
  {
    id: "GSC-3",
    moduleType: "corner",
    categoryKey: "hanger",
    label: "GSC-3",
    filterKeys: ["800x600", "600x800"],
    count: 4,
    rodCount: 2,
    price: 0,
    description: "코너 포스트바 1개 / 코너선반 4개 / 행거 2개",
    active: true,
    sortOrder: 530,
  },
  {
    id: "GSC-5",
    moduleType: "corner",
    categoryKey: "shelf",
    label: "GSC-5",
    filterKeys: ["800x600", "600x800"],
    count: 5,
    rodCount: 0,
    price: 0,
    description: "코너 포스트바 1개 / 코너선반 5개",
    active: true,
    sortOrder: 540,
  },
  {
    id: "GSC-6",
    moduleType: "corner",
    categoryKey: "shelf",
    label: "GSC-6",
    filterKeys: ["800x600", "600x800"],
    count: 6,
    rodCount: 0,
    price: 0,
    description: "코너 포스트바 1개 / 코너선반 6개",
    active: true,
    sortOrder: 550,
  },
];

const sortByOrderThenName = (a, b) => {
  const aOrder = Number(a?.sortOrder || 0);
  const bOrder = Number(b?.sortOrder || 0);
  if (aOrder !== bOrder) return aOrder - bOrder;
  return String(a?.label || "").localeCompare(String(b?.label || ""), "ko");
};

export const SYSTEM_MODULE_PRESETS = Object.freeze({
  normal: Object.freeze(
    SYSTEM_MODULE_PRESET_ITEMS.filter((item) => item.moduleType === "normal" && item.active !== false)
      .sort(sortByOrderThenName)
      .map((item) => Object.freeze({ ...item }))
  ),
  corner: Object.freeze(
    SYSTEM_MODULE_PRESET_ITEMS.filter((item) => item.moduleType === "corner" && item.active !== false)
      .sort(sortByOrderThenName)
      .map((item) => Object.freeze({ ...item }))
  ),
});

const SYSTEM_FURNITURE_ITEMS = [
  {
    id: "drawer_hanging_1tier",
    name: "공중형 서랍 1단",
    categoryKey: "drawer",
    price: 22000,
    description: "공중형 서랍 1단 모듈 1세트",
    optionMode: "single",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 100,
  },
  {
    id: "drawer_hanging_2tier",
    name: "공중형 서랍 2단",
    categoryKey: "drawer",
    price: 30000,
    description: "공중형 서랍 2단 모듈 1세트",
    optionMode: "single",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 110,
  },
  {
    id: "drawer_floor_2tier",
    name: "바닥형 서랍 2단",
    categoryKey: "drawer",
    price: 30000,
    description: "바닥형 서랍 2단 모듈 1세트",
    optionMode: "single",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 120,
  },
  {
    id: "drawer_floor_3tier",
    name: "바닥형 서랍 3단",
    categoryKey: "drawer",
    price: 38000,
    description: "바닥형 서랍 3단 모듈 1세트",
    optionMode: "single",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 130,
  },
  {
    id: "drawer_floor_4tier",
    name: "바닥형 서랍 4단",
    categoryKey: "drawer",
    price: 46000,
    description: "바닥형 서랍 4단 모듈 1세트",
    optionMode: "single",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 140,
  },
  {
    id: SYSTEM_ADDON_ITEM_IDS.CLOTHES_ROD,
    name: "행거",
    categoryKey: "hanger",
    price: 5000,
    description: "알루미늄 행거 1개",
    optionMode: "counter",
    selectableInModuleAddonModal: false,
    applicableModuleTypes: ["normal", "corner"],
    sortOrder: 10,
  },
];

export const SYSTEM_ADDON_ITEMS = Object.freeze(
  [...SYSTEM_FURNITURE_ITEMS]
    .sort((a, b) => {
      const aOrder = Number(a?.sortOrder || 0);
      const bOrder = Number(b?.sortOrder || 0);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a?.name || "").localeCompare(String(b?.name || ""), "ko");
    })
    .map((item) => Object.freeze({ ...item }))
);
