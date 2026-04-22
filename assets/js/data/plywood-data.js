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
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/01-lx-smr-white.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_02",
    name: "SMR 마시멜로",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/02-lx-smr-marshmallow.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_03",
    name: "SMR 포그 그레이",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/03-lx-smr-fog-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_04",
    name: "SMR 그레이",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/04-lx-smr-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_05",
    name: "SMR 머쉬룸",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/05-lx-smr-mushroom.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_06",
    name: "SMR 베이지",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/06-lx-smr-beige.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_07",
    name: "SMR 바닐라",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/07-lx-smr-vanilla.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_08",
    name: "SMR 피치 휩",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/08-lx-smr-peach-whip.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_09",
    name: "SMR 카본 그레이",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/09-lx-smr-carbon-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_10",
    name: "SMR 틸그린",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/10-lx-smr-teal-green.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_11",
    name: "SMR 테라그린",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/11-lx-smr-terra-green.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_smr_pet_12",
    name: "SMR 나이트 블루",
    category: "LX SMR PET",
    thumbnail: "assets/img/product/plywood/01-lx-smr-pet/12-lx-smr-night-blue.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_texture_pet_01",
    name: "슬레이트 그레이",
    category: "LX Texture PET",
    thumbnail: "assets/img/product/plywood/02-lx-texture-pet/01-lx-texture-pet-slate-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_texture_pet_02",
    name: "슬레이트 베이지",
    category: "LX Texture PET",
    thumbnail: "assets/img/product/plywood/02-lx-texture-pet/02-lx-texture-pet-slate-beige.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_01",
    name: "화이트(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/01-lx-pet-white-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_02",
    name: "화이트(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/02-lx-pet-white-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_03",
    name: "아이보리(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/03-lx-pet-ivory-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_04",
    name: "아이보리(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/04-lx-pet-ivory-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_05",
    name: "그레이(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/05-lx-pet-gray-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_06",
    name: "그레이(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/06-lx-pet-gray-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_07",
    name: "연그레이(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/07-lx-pet-light-gray-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_08",
    name: "연그레이(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/08-lx-pet-light-gray-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_09",
    name: "실키 그레이(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/09-lx-pet-silky-gray-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_10",
    name: "실키 그레이(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/10-lx-pet-silky-gray-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_11",
    name: "인디고 블루(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/11-lx-pet-indigo-blue-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_12",
    name: "인디고 블루(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/12-lx-pet-indigo-blue-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_13",
    name: "진그레이(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/13-lx-pet-dark-gray-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_14",
    name: "진그레이(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/14-lx-pet-dark-gray-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_15",
    name: "백색 펄(무광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/15-lx-pet-white-pearl.jpg",
  }),
  createPlywoodMaterial({
    id: "lx_pet_16",
    name: "블루 펄(유광)",
    category: "LX PET",
    thumbnail: "assets/img/product/plywood/03-lx-pet/16-lx-pet-blue-pearl.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_01",
    name: "퍼펙트 화이트",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/01-hansol-pet-perfect-white.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_02",
    name: "퍼펙트 화이트(유광)",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/02-hansol-pet-perfect-white-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_03",
    name: "포그 그레이",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/03-hansol-pet-fog-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_04",
    name: "라이트 그레이",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/04-hansol-pet-light-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_05",
    name: "도브 화이트",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/05-hansol-pet-dove-white.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_06",
    name: "트루 펄 화이트",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/06-hansol-pet-truepearl-white.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_07",
    name: "샌드 그레이",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/07-hansol-pet-sand-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_08",
    name: "샌드 그레이(유광)",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/08-hansol-pet-sand-gray-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_09",
    name: "크림 화이트",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/09-hansol-pet-cream-white.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_10",
    name: "크림 화이트(유광)",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/10-hansol-pet-cream-white-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_11",
    name: "새틴 베이지",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/11-hansol-pet-satin-beige.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_12",
    name: "애쉬 베이지",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/12-hansol-pet-ash-beige.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_13",
    name: "로지 핑크",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/13-hansol-pet-rosy-pink.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_14",
    name: "로투스 핑크",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/14-hansol-pet-lotus-pink.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_15",
    name: "모노 그레이",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/15-hansol-pet-mono-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_16",
    name: "모노 그레이(유광)",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/16-hansol-pet-mono-gray-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_17",
    name: "미스트 그린",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/17-hansol-pet-mist-green.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_18",
    name: "재스퍼 그린",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/18-hansol-pet-jasper-green.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_19",
    name: "다크 그레이",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/19-hansol-pet-dark-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_20",
    name: "다크 그레이(유광)",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/20-hansol-pet-dark-gray-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_21",
    name: "코튼 블루",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/21-hansol-pet-cotton-blue.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_22",
    name: "스모키 올리브",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/22-hansol-pet-smoky-olive.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_23",
    name: "인디고 블루",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/23-hansol-pet-indigo-blue.jpg",
  }),
  createPlywoodMaterial({
    id: "hansol_pet_24",
    name: "럭스 블랙",
    category: "Hansol PET",
    thumbnail: "assets/img/product/plywood/04-hansol-pet/24-hansol-pet-luxe-black.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_01",
    name: "새틴 옐로우(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/01-og-pet-satin-yellow-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_02",
    name: "새틴 옐로우(유광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/02-og-pet-satin-yellow-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_03",
    name: "새틴 코럴(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/03-og-pet-satin-coral-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_04",
    name: "새틴 코럴(유광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/04-og-pet-satin-coral-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_05",
    name: "코타 민트(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/05-og-pet-cotta-mint-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_06",
    name: "코타 민트(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/06-og-pet-cotta-mint-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_07",
    name: "글램 핑크(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/07-og-pet-glam-pink-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_08",
    name: "글램 핑크(유광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/08-og-pet-glam-pink-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_09",
    name: "새틴 스카이블루(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/09-og-pet-satin-sky-blue-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_10",
    name: "새틴 스카이블루(유광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/10-og-pet-satin-sky-blue-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_11",
    name: "글램 라벤더(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/11-og-pet-glam-lavender-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_12",
    name: "글램 라벤더(유광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/12-og-pet-glam-lavender-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_13",
    name: "민트(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/13-og-pet-mint-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_14",
    name: "민트(유광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/14-og-pet-mint-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_15",
    name: "블랙(무광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/15-og-pet-black-matte.jpg",
  }),
  createPlywoodMaterial({
    id: "original_pet_16",
    name: "블랙(유광)",
    category: "Original PET",
    thumbnail: "assets/img/product/plywood/05-original-pet/16-og-pet-black-glossy.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_01",
    name: "화이트 워시",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/01-lpm-white-wash.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_02",
    name: "모나코",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/02-lpm-monaco.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_03",
    name: "DL07",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/03-lpm-dl07.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_04",
    name: "DL05",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/04-lpm-dl05.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_05",
    name: "연우드",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/05-lpm-light-wood.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_06",
    name: "진우드",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/06-lpm-dark-wood.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_07",
    name: "오크 화이트",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/07-lpm-oak-white.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_08",
    name: "오크 브라운",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/08-lpm-oak-brown.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_09",
    name: "터치 화이트",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/09-lpm-touch-white.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_10",
    name: "터치 그레이",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/10-lpm-touch-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_11",
    name: "터치 블랙",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/11-lpm-touch-black.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_12",
    name: "세라 화이트",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/12-lpm-sera-white.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_13",
    name: "세라 그레이",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/13-lpm-sera-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_14",
    name: "콘크리트 연그레이",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/14-lpm-concrete-light-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_15",
    name: "콘크리트 그레이",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/15-lpm-concrete-gray.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_16",
    name: "화이트 엠보",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/16-lpm-white-embo.jpg",
  }),
  createPlywoodMaterial({
    id: "lpm_17",
    name: "그레이 엠보",
    category: "LPM",
    thumbnail: "assets/img/product/plywood/06-lpm/17-lpm-gray-embo.jpg",
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
