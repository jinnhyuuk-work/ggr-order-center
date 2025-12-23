export const arrayToMap = (list) =>
  list.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

export const COMMON_PROCESSING_SERVICES = {
  hinge_hole: {
    id: "hinge_hole",
    label: "경첩 홀 가공",
    pricePerHole: 1500,
    type: "detail",
    swatch: "linear-gradient(135deg, #f0f7ff 0%, #c1dbff 100%)",
    description: "경첩 홀 1개당",
  },
  handle_hole: {
    id: "handle_hole",
    label: "피스 홀 타공",
    pricePerHole: 1200,
    type: "detail",
    swatch: "linear-gradient(135deg, #fef4e6 0%, #ffd9a8 100%)",
    description: "피스 홀 1개당",
  },
};

export const COMMON_ADDON_ITEMS = [
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
