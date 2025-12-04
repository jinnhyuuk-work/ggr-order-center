export const MATERIALS = {
  /* LX SMR PET */
  ...(() => {
    const items = {};
    for (let i = 1; i <= 12; i++) {
      const id = `lx_smr_pet_${String(i).padStart(2, "0")}`;
      items[id] = {
        id,
        name: `LX SMR PET ${i}`,
        category: "LX SMR PET",
        availableThickness: [18],
        pricePerM2: 52000,
        density: 720,
        minWidth: 50,
        maxWidth: 1200,
        minLength: 100,
        maxLength: 2400,
        swatch: "linear-gradient(135deg, #f9f9f9 0%, #dcdcdc 100%)",
      };
    }
    return items;
  })(),
  /* LX Texture PET */
  ...(() => {
    const items = {};
    for (let i = 1; i <= 2; i++) {
      const id = `lx_texture_pet_${String(i).padStart(2, "0")}`;
      items[id] = {
        id,
        name: `LX Texture PET ${i}`,
        category: "LX Texture PET",
        availableThickness: [18],
        pricePerM2: 54000,
        density: 720,
        minWidth: 50,
        maxWidth: 1200,
        minLength: 100,
        maxLength: 2400,
        swatch: "linear-gradient(135deg, #f5f0e9 0%, #d3c4b5 100%)",
      };
    }
    return items;
  })(),
  /* LX PET */
  ...(() => {
    const items = {};
    for (let i = 1; i <= 16; i++) {
      const id = `lx_pet_${String(i).padStart(2, "0")}`;
      items[id] = {
        id,
        name: `LX PET ${i}`,
        category: "LX PET",
        availableThickness: [18],
        pricePerM2: 50000,
        density: 720,
        minWidth: 50,
        maxWidth: 1200,
        minLength: 100,
        maxLength: 2400,
        swatch: "linear-gradient(135deg, #eef2ff 0%, #cdd8ff 100%)",
      };
    }
    return items;
  })(),
  /* Hansol PET */
  ...(() => {
    const items = {};
    for (let i = 1; i <= 24; i++) {
      const id = `hansol_pet_${String(i).padStart(2, "0")}`;
      items[id] = {
        id,
        name: `Hansol PET ${i}`,
        category: "Hansol PET",
        availableThickness: [18],
        pricePerM2: 51000,
        density: 720,
        minWidth: 50,
        maxWidth: 1200,
        minLength: 100,
        maxLength: 2400,
        swatch: "linear-gradient(135deg, #f0f6ff 0%, #d1e6ff 100%)",
      };
    }
    return items;
  })(),
  /* Original PET */
  ...(() => {
    const items = {};
    for (let i = 1; i <= 16; i++) {
      const id = `original_pet_${String(i).padStart(2, "0")}`;
      items[id] = {
        id,
        name: `Original PET ${i}`,
        category: "Original PET",
        availableThickness: [18],
        pricePerM2: 49000,
        density: 720,
        minWidth: 50,
        maxWidth: 1200,
        minLength: 100,
        maxLength: 2400,
        swatch: "linear-gradient(135deg, #f7f7f7 0%, #dcdde0 100%)",
      };
    }
    return items;
  })(),
  /* LPM */
  ...(() => {
    const items = {};
    for (let i = 1; i <= 17; i++) {
      const id = `lpm_${String(i).padStart(2, "0")}`;
      items[id] = {
        id,
        name: `LPM ${i}`,
        category: "LPM",
        availableThickness: [18],
        pricePerM2: 47000,
        density: 720,
        minWidth: 50,
        maxWidth: 1200,
        minLength: 100,
        maxLength: 2400,
        swatch: "linear-gradient(135deg, #f8f3ea 0%, #e3d4bc 100%)",
      };
    }
    return items;
  })(),
  misong: {
    id: "misong",
    name: "미송집성목",
    category: "집성목",
    availableThickness: [15, 18, 24],
    pricePerM2ByThickness: { 15: 35000, 18: 38000, 24: 42000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #f3d9b1 0%, #c89b5e 100%)",
  },
  misong_01: {
    id: "misong_01",
    name: "미송집성목 샌드",
    category: "집성목",
    availableThickness: [15, 18],
    pricePerM2ByThickness: { 15: 35000, 18: 38000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #f0d9c0 0%, #d9a976 100%)",
  },
  misong_02: {
    id: "misong_02",
    name: "미송집성목 허니",
    category: "집성목",
    availableThickness: [18, 24],
    pricePerM2ByThickness: { 18: 38000, 24: 42000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #f6e2b3 0%, #e3b05f 100%)",
  },
  misong_03: {
    id: "misong_03",
    name: "미송집성목 토피",
    category: "집성목",
    availableThickness: [15, 24],
    pricePerM2ByThickness: { 15: 35000, 24: 42000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #e7c69e 0%, #b0763f 100%)",
  },
  misong_04: {
    id: "misong_04",
    name: "미송집성목 웜그레이",
    category: "집성목",
    availableThickness: [15, 18, 24],
    pricePerM2ByThickness: { 15: 35000, 18: 38000, 24: 42000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #e3d6c8 0%, #b9a996 100%)",
  },
  misong_05: {
    id: "misong_05",
    name: "미송집성목 캄포",
    category: "집성목",
    availableThickness: [18],
    pricePerM2ByThickness: { 18: 38000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #f5decc 0%, #d0a482 100%)",
  },
  misong_06: {
    id: "misong_06",
    name: "미송집성목 브라운",
    category: "집성목",
    availableThickness: [24],
    pricePerM2ByThickness: { 24: 42000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #d6b49d 0%, #8a5a3b 100%)",
  },
  misong_07: {
    id: "misong_07",
    name: "미송집성목 코코아",
    category: "집성목",
    availableThickness: [15, 18],
    pricePerM2ByThickness: { 15: 35000, 18: 38000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #c5a48a 0%, #7b4c2c 100%)",
  },
  misong_08: {
    id: "misong_08",
    name: "미송집성목 딥브라운",
    category: "집성목",
    availableThickness: [18, 24],
    pricePerM2ByThickness: { 18: 38000, 24: 42000 },
    pricePerM2: 35000,
    density: 450,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #b88f70 0%, #5a341e 100%)",
  },

  mdf: {
    id: "mdf",
    name: "MDF",
    category: "MDF",
    availableThickness: [15, 18, 24],
    pricePerM2ByThickness: { 15: 25000, 18: 27000, 24: 30000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #d8d8d8 0%, #b0b0b0 100%)",
  },
  mdf_01: {
    id: "mdf_01",
    name: "MDF 소프트화이트",
    category: "MDF",
    availableThickness: [15, 18],
    pricePerM2ByThickness: { 15: 25000, 18: 27000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #f2f2f2 0%, #d9d9d9 100%)",
  },
  mdf_02: {
    id: "mdf_02",
    name: "MDF 라이트그레이",
    category: "MDF",
    availableThickness: [18, 24],
    pricePerM2ByThickness: { 18: 27000, 24: 30000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #e4e4e4 0%, #bcbcbc 100%)",
  },
  mdf_03: {
    id: "mdf_03",
    name: "MDF 웜그레이",
    category: "MDF",
    availableThickness: [24],
    pricePerM2ByThickness: { 24: 30000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #ded8d1 0%, #b0a69c 100%)",
  },
  mdf_04: {
    id: "mdf_04",
    name: "MDF 베이지",
    category: "MDF",
    availableThickness: [15, 18, 24],
    pricePerM2ByThickness: { 15: 25000, 18: 27000, 24: 30000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #efe3d5 0%, #c8b39f 100%)",
  },
  mdf_05: {
    id: "mdf_05",
    name: "MDF 머드",
    category: "MDF",
    availableThickness: [18],
    pricePerM2ByThickness: { 18: 27000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #d1c6b8 0%, #9a8c7d 100%)",
  },
  mdf_06: {
    id: "mdf_06",
    name: "MDF 차콜",
    category: "MDF",
    availableThickness: [24],
    pricePerM2ByThickness: { 24: 30000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #c1c1c1 0%, #7a7a7a 100%)",
  },
  mdf_07: {
    id: "mdf_07",
    name: "MDF 스틸그레이",
    category: "MDF",
    availableThickness: [15, 18],
    pricePerM2ByThickness: { 15: 25000, 18: 27000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #cfd6dd 0%, #8c9dad 100%)",
  },
  mdf_08: {
    id: "mdf_08",
    name: "MDF 네이비",
    category: "MDF",
    availableThickness: [18, 24],
    pricePerM2ByThickness: { 18: 27000, 24: 30000 },
    pricePerM2: 25000,
    density: 700,
    minWidth: 50,
    maxWidth: 1200,
    minLength: 100,
    maxLength: 2400,
    swatch: "linear-gradient(135deg, #c8d0de 0%, #30405a 100%)",
  },
};

export const MATERIAL_CATEGORIES_DESC = {
  집성목: "집성목은 여러 목재를 접합하여 안정성과 강도를 높인 판재입니다.",
  MDF: "MDF는 섬유를 압축해 만든 판재로 가공과 도장이 용이합니다.",
  "LX SMR PET": "LX SMR PET 마감재 카테고리입니다.",
  "LX Texture PET": "LX Texture PET 마감재 카테고리입니다.",
  "LX PET": "LX PET 마감재 카테고리입니다.",
  "Hansol PET": "한솔 PET 마감재 카테고리입니다.",
  "Original PET": "오리지널 PET 마감재 카테고리입니다.",
  LPM: "LPM 마감재 카테고리입니다.",
};

export const PROCESSING_SERVICES = {
  hinge_hole: {
    id: "hinge_hole",
    label: "경첩 홀 가공",
    pricePerHole: 1500,
    swatch: "linear-gradient(135deg, #f0f7ff 0%, #c1dbff 100%)",
    description: "경첩 홀 1개당",
  },
  handle_hole: {
    id: "handle_hole",
    label: "손잡이 홀 가공",
    pricePerHole: 1200,
    swatch: "linear-gradient(135deg, #fef4e6 0%, #ffd9a8 100%)",
    description: "손잡이 홀 1개당",
  },
};

export const ADDON_ITEMS = [
  {
    id: "hinge_basic",
    name: "경첩(일반)",
    price: 2000,
    description: "소형 캐비닛용 기본 경첩",
  },
  {
    id: "screw_set",
    name: "목재용 피스 세트",
    price: 3000,
    description: "다양한 길이의 피스 50ea",
  },
  {
    id: "handle_simple",
    name: "손잡이(블랙)",
    price: 4500,
    description: "미니멀 블랙 손잡이 2ea",
  },
  {
    id: "soft_close",
    name: "소프트클로징 댐퍼",
    price: 6000,
    description: "도어 닫힘을 부드럽게",
  },
  {
    id: "glide_runner",
    name: "서랍 레일 세트",
    price: 8000,
    description: "볼레일 1세트",
  },
  {
    id: "felt_pad",
    name: "가구 패드",
    price: 1500,
    description: "바닥 긁힘 방지 패드 20개",
  },
  {
    id: "wood_glue",
    name: "목공용 본드",
    price: 2500,
    description: "빠른 경화 목공용 접착제",
  },
];

export const PACKING_SETTINGS = {
  packingPricePerKg: 400,
  basePackingPrice: 2000,
};
