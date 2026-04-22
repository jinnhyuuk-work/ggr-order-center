import {
  arrayToMap,
  COMMON_ADDON_ITEMS,
  createDataEntryMetaMap,
  createDataItemMetaMap,
  createDatasetMeta,
} from "./addon-data.js";
import { ORDER_DIMENSION_LIMITS, withDimensionLimits } from "./dimension-constraints.js";
import { ORDER_PAGE_KEYS } from "./additional-selection-policy.js";
import { getAdditionalOptionsForPage } from "./additional-options-data.js";
import { getAdditionalProcessingServicesForPage } from "./additional-processing-data.js";
import { filterAvailableMap } from "./product-availability.js";
import { PRODUCT_AVAILABILITY_POLICY } from "./product-availability-policy.js";

export const PLYWOOD_DIMENSION_LIMITS = ORDER_DIMENSION_LIMITS.plywood;
export const PLYWOOD_PRODUCT_AVAILABILITY = PRODUCT_AVAILABILITY_POLICY.plywood;

const applyPlywoodDimensionLimits = (items = []) =>
  items.map((item) => withDimensionLimits(item, PLYWOOD_DIMENSION_LIMITS));

const createPlywoodMaterial = ({ id, name, category, thumbnail }) => ({
  id,
  name,
  category,
  availableThickness: [18],
  density: 720,
  minWidth: 50,
  maxWidth: 1200,
  minLength: 100,
  maxLength: 2400,
  thumbnail,
  swatch: null,
});

const PLYWOOD_MATERIAL_ITEMS = [
  createPlywoodMaterial({
    id: "lx_smr_pet_01",
    name: "SMR 화이트",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/door/01-lx-smr-pet/01-lx-smr-white.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_02",
    name: "SMR 마시멜로",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/door/01-lx-smr-pet/02-lx-smr-marshmallow.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_texture_pet_01",
    name: "슬레이트 그레이",
    category: "LX Texture PET",
    thumbnail: "assets/img/product/door/02-lx-texture-pet/01-lx-texture-pet-slate-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_texture_pet_02",
    name: "슬레이트 베이지",
    category: "LX Texture PET",
    thumbnail: "assets/img/product/door/02-lx-texture-pet/02-lx-texture-pet-slate-beige.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_01",
    name: "화이트(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/door/03-lx-pet/01-lx-pet-white-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_02",
    name: "화이트(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/door/03-lx-pet/02-lx-pet-white-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_01",
    name: "퍼펙트 화이트",
    category: "Hansol PET",
    thumbnail: "assets/img/product/door/04-hansol-pet/01-hansol-pet-perfect-white.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_02",
    name: "크림 화이트",
    category: "Hansol PET",
    thumbnail: "assets/img/product/door/04-hansol-pet/09-hansol-pet-cream-white.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_01",
    name: "새틴 옐로우",
    category: "Original PET",
    thumbnail: "assets/img/product/door/05-original-pet/01-og-pet-satin-yellow-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_02",
    name: "새틴 코랄",
    category: "Original PET",
    thumbnail: "assets/img/product/door/05-original-pet/04-og-pet-satin-coral-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_01",
    name: "화이트 워시",
    category: "LPM",
    thumbnail: "assets/img/product/door/06-lpm/01-lpm-white-wash.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_02",
    name: "오크 브라운",
    category: "LPM",
    thumbnail: "assets/img/product/door/06-lpm/08-lpm-oak-brown.jpg",
  }),
];

const PLYWOOD_MATERIALS_BASE = {
  ...arrayToMap(applyPlywoodDimensionLimits(PLYWOOD_MATERIAL_ITEMS)),
};

export const MATERIAL_CATEGORIES_DESC = Object.freeze({
  "LX SMR PET": "LX SMR PET 마감재 카테고리입니다.",
  "LX Texture PET": "LX Texture PET 마감재 카테고리입니다.",
  "LX PET": "LX PET 마감재 카테고리입니다.",
  "Hansol PET": "한솔 PET 마감재 카테고리입니다.",
  "Original PET": "오리지널 PET 마감재 카테고리입니다.",
  LPM: "LPM 마감재 카테고리입니다.",
});

export const PLYWOOD_MATERIAL_CATEGORIES_DESC = MATERIAL_CATEGORIES_DESC;

export const PLYWOOD_PRICE_TIERS_BY_CATEGORY = {
  "LX SMR PET": [
    { maxWidth: 300, maxLength: 800, price: 18000 },
    { maxWidth: 400, maxLength: 800, price: 23000 },
    { maxWidth: 600, maxLength: 800, price: 33000 },
  ],
  "LX Texture PET": [
    { maxWidth: 300, maxLength: 800, price: 40000 },
    { maxWidth: 400, maxLength: 800, price: 45000 },
    { maxWidth: 600, maxLength: 800, price: 50000 },
  ],
  "LX PET": [
    { maxWidth: 300, maxLength: 800, price: 17000 },
    { maxWidth: 400, maxLength: 800, price: 22000 },
    { maxWidth: 600, maxLength: 800, price: 31000 },
  ],
  "Hansol PET": [
    { maxWidth: 300, maxLength: 800, price: 40000 },
    { maxWidth: 400, maxLength: 800, price: 45000 },
    { maxWidth: 600, maxLength: 800, price: 50000 },
  ],
  "Original PET": [
    { maxWidth: 300, maxLength: 800, price: 35000 },
    { maxWidth: 400, maxLength: 800, price: 40000 },
    { maxWidth: 600, maxLength: 800, price: 45000 },
  ],
  LPM: [
    { maxWidth: 300, maxLength: 800, price: 35000 },
    { maxWidth: 400, maxLength: 800, price: 40000 },
    { maxWidth: 600, maxLength: 800, price: 45000 },
  ],
};

Object.values(PLYWOOD_MATERIALS_BASE).forEach((material) => {
  const tiers = PLYWOOD_PRICE_TIERS_BY_CATEGORY[material?.category] || [];
  material.pricingRule = Object.freeze({
    type: "tieredBySize",
    tiers: Object.freeze(tiers.map((tier) => Object.freeze({ ...tier }))),
  });
});

export const MATERIALS = filterAvailableMap(PLYWOOD_MATERIALS_BASE, PLYWOOD_PRODUCT_AVAILABILITY);

export const PLYWOOD_PRICING_POLICY = Object.freeze({});

export const PLYWOOD_PROCESSING_SERVICES = {
  ...getAdditionalProcessingServicesForPage(ORDER_PAGE_KEYS.PLYWOOD),
};

export const PLYWOOD_OPTIONS = getAdditionalOptionsForPage(ORDER_PAGE_KEYS.PLYWOOD);

export const PLYWOOD_ADDON_ITEMS = [...COMMON_ADDON_ITEMS];

export const PLYWOOD_DATASETS_META = Object.freeze({
  materials: createDatasetMeta({
    id: "plywood_materials",
    label: "합판 자재 데이터",
    description: "합판 페이지에서 사용되는 자재/가격 티어/규격 기준 데이터입니다.",
    source: "assets/js/data/plywood-data.js",
    owner: "order-center",
    updated_at: "2026-04-22",
    status: "active",
    tags: ["[internal]", "page:plywood"],
  }),
  processing_services: createDatasetMeta({
    id: "plywood_processing_services",
    label: "합판 가공 서비스 데이터",
    description: "합판 페이지에서 노출되는 가공 서비스 데이터입니다.",
    source: "assets/js/data/plywood-data.js",
    owner: "order-center",
    updated_at: "2026-04-22",
    status: "active",
    tags: ["[internal]", "page:plywood"],
  }),
  options: createDatasetMeta({
    id: "plywood_options",
    label: "합판 옵션 데이터",
    description: "합판 페이지에서 선택 가능한 추가 옵션 데이터입니다.",
    source: "assets/js/data/plywood-data.js",
    owner: "order-center",
    updated_at: "2026-04-22",
    status: "active",
    tags: ["[internal]", "page:plywood"],
  }),
  addon_items: createDatasetMeta({
    id: "plywood_addon_items",
    label: "합판 부자재 데이터",
    description: "합판 페이지에서 공통으로 사용하는 부자재 데이터입니다.",
    source: "assets/js/data/plywood-data.js",
    owner: "order-center",
    updated_at: "2026-04-22",
    status: "active",
    tags: ["[internal]", "page:plywood"],
  }),
});

export const PLYWOOD_DATA_META_BY_ID = Object.freeze({
  materials: createDataEntryMetaMap(MATERIALS, {
    dataset: "plywood_materials",
    source: "assets/js/data/plywood-data.js",
    owner: "order-center",
    updated_at: "2026-04-22",
    status: "active",
    tags: ["[internal]", "page:plywood", "kind:material"],
  }),
  processing_services: createDataEntryMetaMap(PLYWOOD_PROCESSING_SERVICES, {
    dataset: "plywood_processing_services",
    source: "assets/js/data/plywood-data.js",
    owner: "order-center",
    updated_at: "2026-04-22",
    status: "active",
    tags: ["[internal]", "page:plywood", "kind:processing"],
    labelKey: "label",
  }),
  options: createDataItemMetaMap(PLYWOOD_OPTIONS, {
    dataset: "plywood_options",
    source: "assets/js/data/plywood-data.js",
    owner: "order-center",
    updated_at: "2026-04-22",
    status: "active",
    tags: ["[internal]", "page:plywood", "kind:option"],
  }),
  addon_items: createDataItemMetaMap(PLYWOOD_ADDON_ITEMS, {
    dataset: "plywood_addon_items",
    source: "assets/js/data/plywood-data.js",
    owner: "order-center",
    updated_at: "2026-04-22",
    status: "active",
    tags: ["[internal]", "page:plywood", "kind:addon"],
  }),
});
