import {
  arrayToMap,
  createDataEntryMetaMap,
  createDataItemMetaMap,
  createDatasetMeta,
} from "./common-data.js";

// 선반 컬러별 단가를 티어 키 기준으로 개별 관리한다.
const LPM_ITEMS = [
  {
    id: "lpm_basic",
    name: "베이직",
    category: "LPM",
    priceByTierKey: Object.freeze({
      lte_400: 22000,
      lte_600: 28000,
      lte_800: 34000,
      corner_standard: 42000,
    }),
    availableThickness: [18],
    density: 720,
    swatch: "#f2f2f2",
    thumbnail: "assets/img/product/system/shelf/basic.jpg",
  },
  {
    id: "lpm_natural_walnut",
    name: "네추럴 월넛",
    category: "LPM",
    priceByTierKey: Object.freeze({
      lte_400: 22000,
      lte_600: 28000,
      lte_800: 34000,
      corner_standard: 42000,
    }),
    availableThickness: [18],
    density: 720,
    swatch: "#b38352",
    thumbnail: "assets/img/product/system/shelf/natural-walnut.jpg",
  },
  {
    id: "lpm_smoke_walnut",
    name: "스모크 월넛",
    category: "LPM",
    priceByTierKey: Object.freeze({
      lte_400: 22000,
      lte_600: 28000,
      lte_800: 34000,
      corner_standard: 42000,
    }),
    availableThickness: [18],
    density: 720,
    swatch: "#6b4b36",
    thumbnail: "assets/img/product/system/shelf/smoke-walnut.jpg",
  },
];

const PP_ITEMS = [
  {
    id: "pp_twill",
    name: "트윌",
    category: "PP",
    priceByTierKey: Object.freeze({
      lte_400: 20000,
      lte_600: 25500,
      lte_800: 31000,
      corner_standard: 39000,
    }),
    availableThickness: [18],
    density: 720,
    swatch: "#ede6e4",
    thumbnail: "assets/img/product/system/shelf/twill.jpg",
  },
];

export const SYSTEM_SHELF_MATERIALS = {
  ...arrayToMap(
    LPM_ITEMS.map((item) => ({
      ...item,
      pricingRule: Object.freeze({
        type: "tieredByWidth",
        priceByTierKey: Object.freeze({ ...item.priceByTierKey }),
      }),
    }))
  ),
  ...arrayToMap(
    PP_ITEMS.map((item) => ({
      ...item,
      pricingRule: Object.freeze({
        type: "tieredByWidth",
        priceByTierKey: Object.freeze({ ...item.priceByTierKey }),
      }),
    }))
  ),
};

const COLUMN_ITEMS = [
  {
    id: "column_white",
    name: "화이트",
    category: "포스트바",
    availableThickness: [18],
    density: 720,
    swatch: "#f6f6f6",
    thumbnail: "assets/img/product/system/post-bar/post-bar-white.jpg",
  },
  {
    id: "column_silver",
    name: "실버",
    category: "포스트바",
    availableThickness: [18],
    density: 720,
    swatch: "#b7bcc6",
    thumbnail: "assets/img/product/system/post-bar/post-bar-silver.jpg",
  },
  {
    id: "column_black",
    name: "블랙",
    category: "포스트바",
    availableThickness: [18],
    density: 720,
    swatch: "#2a2a2a",
    thumbnail: "assets/img/product/system/post-bar/post-bar-black.jpg",
  },
];

const SYSTEM_COLUMN_MATERIALS_BASE = {
  ...arrayToMap(COLUMN_ITEMS),
};

export const SYSTEM_MATERIAL_CATEGORIES_DESC = {
  LPM: "LPM 마감재 카테고리입니다.",
  PP: "PP 마감재 카테고리입니다.",
  포스트바: "포스트바 컬러 카테고리입니다.",
};

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
        isCustomPrice: true,
      }),
    ]),
  }),
});

export const SYSTEM_POST_BAR_PRICING = Object.freeze({
  basic: Object.freeze({
    label: "기본 포스트바",
    tiers: Object.freeze([
      Object.freeze({
        key: "lte_2100",
        label: "2100 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2100,
        unitPrice: 17400,
      }),
      Object.freeze({
        key: "lte_2300",
        label: "2300 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2300,
        unitPrice: 18000,
      }),
      Object.freeze({
        key: "lte_2500",
        label: "2500 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2500,
        unitPrice: 19300,
      }),
    ]),
  }),
  corner: Object.freeze({
    label: "코너 포스트바",
    tiers: Object.freeze([
      Object.freeze({
        key: "lte_2100",
        label: "2100 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2100,
        unitPrice: 8000,
      }),
      Object.freeze({
        key: "lte_2300",
        label: "2300 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2300,
        unitPrice: 8000,
      }),
      Object.freeze({
        key: "lte_2500",
        label: "2500 이하",
        maxHeightMm: SYSTEM_POST_BAR_HEIGHT_LIMITS.pricing.lte2500,
        unitPrice: 8000,
      }),
    ]),
  }),
});

export const SYSTEM_COLUMN_MATERIALS = Object.freeze(
  Object.entries(SYSTEM_COLUMN_MATERIALS_BASE).reduce((acc, [id, item]) => {
    acc[id] = Object.freeze({
      ...item,
      pricingRule: Object.freeze({
        type: "tieredByHeight",
        tiers: Object.freeze({
          basic: SYSTEM_POST_BAR_PRICING.basic.tiers.map((tier) => Object.freeze({ ...tier })),
          corner: SYSTEM_POST_BAR_PRICING.corner.tiers.map((tier) => Object.freeze({ ...tier })),
        }),
      }),
    });
    return acc;
  }, {})
);

export const SYSTEM_ADDON_ITEM_IDS = Object.freeze({
  CLOTHES_ROD: "clothes_rod",
});

export const SYSTEM_ADDON_OPTION_CONFIG = Object.freeze({
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
    description: "코너 포스트바 1개 / 코너선반 6개",
    active: true,
    sortOrder: 550,
  },
];

const SYSTEM_MODULE_PRESET_THUMBNAILS = Object.freeze({
  "GSH-1": "assets/img/product/system/1module/1module-gsh-1.jpg",
  "GSH-2": "assets/img/product/system/1module/1module-gsh-2.jpg",
  "GSH-3": "assets/img/product/system/1module/1module-gsh-3.jpg",
  "GS-1": "assets/img/product/system/1module/1module-gs-1.jpg",
  "GS-3": "assets/img/product/system/1module/1module-gs-3.jpg",
  "GS-5": "assets/img/product/system/1module/1module-gs-5.jpg",
  "GS-6": "assets/img/product/system/1module/1module-gs-6.jpg",
  "GED-1": "assets/img/product/system/1module/1module-ged-1.jpg",
  "GED-2": "assets/img/product/system/1module/1module-ged-2.jpg",
  "GFD-2": "assets/img/product/system/1module/1module-gfd-2.jpg",
  "GFD-3": "assets/img/product/system/1module/1module-gfd-3.jpg",
  "GFD-4": "assets/img/product/system/1module/1module-gfd-4.jpg",
  "GSC-1": "assets/img/product/system/1module/1module-gsc-1.jpg",
  "GSC-2": "assets/img/product/system/1module/1module-gsc-2.jpg",
  "GSC-3": "assets/img/product/system/1module/1module-gsc-3.jpg",
  "GSC-5": "assets/img/product/system/1module/1module-gsc-5.jpg",
  "GSC-6": "assets/img/product/system/1module/1module-gsc-6.jpg",
});

function withModulePresetThumbnail(item) {
  const presetId = String(item?.id || "").toUpperCase();
  const thumbnail = String(SYSTEM_MODULE_PRESET_THUMBNAILS[presetId] || "");
  return {
    ...item,
    thumbnail,
  };
}

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
      .map((item) => Object.freeze(withModulePresetThumbnail(item)))
  ),
  corner: Object.freeze(
    SYSTEM_MODULE_PRESET_ITEMS.filter((item) => item.moduleType === "corner" && item.active !== false)
      .sort(sortByOrderThenName)
      .map((item) => Object.freeze(withModulePresetThumbnail(item)))
  ),
});

export const SYSTEM_FURNITURE_WIDTH_POLICY = Object.freeze({
  selectableRange: Object.freeze({
    min: 401,
    max: 1000,
  }),
  standardWidths: Object.freeze([600, 800]),
  disabledAtOrBelow: 400,
  consultPriceWidths: Object.freeze([]),
  consultPriceAbove: 800,
});

const buildSystemFurniturePricingRule = ({ priceByWidthMm } = {}) => {
  const width600 = Number(priceByWidthMm?.[600] || 0);
  const width800 = Number(priceByWidthMm?.[800] || 0);
  return Object.freeze({
    type: "tieredByWidth",
    unit: "item",
    tiers: Object.freeze([
      Object.freeze({
        key: "w600",
        minWidthMm: 600,
        maxWidthMm: 600,
        ...(width600 > 0
          ? { price: width600, label: "600" }
          : { isCustomPrice: true, label: "600 상담안내" }),
      }),
      Object.freeze({
        key: "w800",
        minWidthMm: 800,
        maxWidthMm: 800,
        ...(width800 > 0
          ? { price: width800, label: "800" }
          : { isCustomPrice: true, label: "800 상담안내" }),
      }),
    ]),
  });
};

const SYSTEM_FURNITURE_ITEMS = [
  {
    id: "drawer_hanging_1tier",
    name: "공중형 서랍 1단",
    categoryKey: "drawer",
    pricingRule: buildSystemFurniturePricingRule({
      priceByWidthMm: {
        600: 0,
        800: 22000,
      },
    }),
    description: "공중형 서랍 1단 모듈 1세트",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 100,
  },
  {
    id: "drawer_hanging_2tier",
    name: "공중형 서랍 2단",
    categoryKey: "drawer",
    pricingRule: buildSystemFurniturePricingRule({
      priceByWidthMm: {
        600: 0,
        800: 30000,
      },
    }),
    description: "공중형 서랍 2단 모듈 1세트",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 110,
  },
  {
    id: "drawer_floor_2tier",
    name: "바닥형 서랍 2단",
    categoryKey: "drawer",
    pricingRule: buildSystemFurniturePricingRule({
      priceByWidthMm: {
        600: 0,
        800: 30000,
      },
    }),
    description: "바닥형 서랍 2단 모듈 1세트",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 120,
  },
  {
    id: "drawer_floor_3tier",
    name: "바닥형 서랍 3단",
    categoryKey: "drawer",
    pricingRule: buildSystemFurniturePricingRule({
      priceByWidthMm: {
        600: 0,
        800: 38000,
      },
    }),
    description: "바닥형 서랍 3단 모듈 1세트",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 130,
  },
  {
    id: "drawer_floor_4tier",
    name: "바닥형 서랍 4단",
    categoryKey: "drawer",
    pricingRule: buildSystemFurniturePricingRule({
      priceByWidthMm: {
        600: 0,
        800: 46000,
      },
    }),
    description: "바닥형 서랍 4단 모듈 1세트",
    selectableInModuleAddonModal: true,
    applicableModuleTypes: ["normal"],
    sortOrder: 140,
  },
  {
    id: SYSTEM_ADDON_ITEM_IDS.CLOTHES_ROD,
    name: "행거",
    categoryKey: "hanger",
    pricingRule: Object.freeze({ type: "fixed", value: 5000, unit: "item" }),
    description: "알루미늄 행거 1개",
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

const SYSTEM_MODULE_PRESET_ITEMS_FLAT = Object.freeze([
  ...SYSTEM_MODULE_PRESETS.normal,
  ...SYSTEM_MODULE_PRESETS.corner,
]);

export const SYSTEM_DATASETS_META = Object.freeze({
  shelf_materials: createDatasetMeta({
    id: "system_shelf_materials",
    label: "시스템 선반 자재 데이터",
    description: "시스템 페이지 선반용 자재/티어 단가 기준 데이터입니다.",
    source: "assets/js/data/system-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system"],
  }),
  column_materials: createDatasetMeta({
    id: "system_column_materials",
    label: "시스템 포스트바 자재 데이터",
    description: "시스템 페이지 포스트바 컬러/기본 정보 데이터입니다.",
    source: "assets/js/data/system-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system"],
  }),
  module_presets: createDatasetMeta({
    id: "system_module_presets",
    label: "시스템 모듈 프리셋 데이터",
    description: "시스템 페이지 모듈/코너 프리셋 템플릿 데이터입니다.",
    source: "assets/js/data/system-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system"],
  }),
  addon_items: createDatasetMeta({
    id: "system_addon_items",
    label: "시스템 부가 가구 데이터",
    description: "시스템 페이지에서 선택 가능한 가구/행거 부자재 데이터입니다.",
    source: "assets/js/data/system-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system"],
  }),
});

export const SYSTEM_DATA_META_BY_ID = Object.freeze({
  shelf_materials: createDataEntryMetaMap(SYSTEM_SHELF_MATERIALS, {
    dataset: "system_shelf_materials",
    source: "assets/js/data/system-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system", "kind:material"],
  }),
  column_materials: createDataEntryMetaMap(SYSTEM_COLUMN_MATERIALS, {
    dataset: "system_column_materials",
    source: "assets/js/data/system-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system", "kind:material"],
  }),
  module_presets: createDataItemMetaMap(SYSTEM_MODULE_PRESET_ITEMS_FLAT, {
    dataset: "system_module_presets",
    source: "assets/js/data/system-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system", "kind:preset"],
    labelKey: "label",
  }),
  addon_items: createDataItemMetaMap(SYSTEM_ADDON_ITEMS, {
    dataset: "system_addon_items",
    source: "assets/js/data/system-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system", "kind:addon"],
  }),
});
