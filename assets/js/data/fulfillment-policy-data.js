import { createDatasetMeta } from "./addon-data.js";

export const FULFILLMENT_POLICY_MESSAGES = Object.freeze({
  noSelectionAmountText: "미선택",
  addressRequiredAmountText: "주소 입력 필요",
  consultAmountText: "상담 안내",
  needsAddressReason: "주소를 입력하면 서비스비를 확인할 수 있습니다.",
  unsupportedRegionReason: "수도권 외 지역은 상담 안내입니다.",
  fallbackReason: "서비스 정책을 확인해주세요.",
});

export const TOP_FULFILLMENT_POLICY = Object.freeze({
  delivery: Object.freeze({
    mode: "consult",
    consultReason: "상판 배송 서비스는 상담 안내입니다.",
  }),
  installationAmount: 50000,
  installationAmountText: "50,000원",
});

export const BOARD_FULFILLMENT_POLICY = Object.freeze({
  delivery: Object.freeze({
    mode: "consult",
    consultReason: "합판 서비스는 상담 안내입니다.",
  }),
});

export const PLYWOOD_FULFILLMENT_POLICY = Object.freeze({
  delivery: Object.freeze({
    mode: "consult",
    consultReason: "합판 서비스는 상담 안내입니다.",
  }),
});

export const DOOR_FULFILLMENT_POLICY = Object.freeze({
  delivery: Object.freeze({
    mode: "consult",
    consultReason: "도어 배송 서비스는 상담 안내입니다.",
    maxWidthMm: 600,
    maxLengthMm: 800,
    groupedFee: Object.freeze({
      groupSize: 3,
      groupPrice: 7000,
    }),
    oversizeConsultReason: "600×800mm 초과 규격은 배송 상담 안내입니다.",
  }),
  installation: Object.freeze({
    baseQuantity: 5,
    baseAmount: 50000,
    additionalUnitAmount: 10000,
  }),
});

export const SYSTEM_FULFILLMENT_POLICY = Object.freeze({
  delivery: Object.freeze({
    mode: "consult",
    consultReason: "시스템 배송 서비스는 상담 안내입니다.",
    consultReasons: Object.freeze({
      cornerOrFurniture: "코너/가구 포함 구성은 배송 상담 안내입니다.",
      overPostBarHeight: "포스트바 2400mm 초과 규격은 배송 상담 안내입니다.",
      overShelfWidth: "선반 800mm 초과 규격은 배송 상담 안내입니다.",
    }),
    postBarGroupedFee: Object.freeze({
      groupSize: 5,
      groupPrice: 8000,
    }),
    shelfGroupedFee: Object.freeze({
      groupSize: 3,
      groupPrice: 7000,
    }),
  }),
  installation: Object.freeze({
    fixedByPostBarCount: Object.freeze({
      2: 50000,
      3: 70000,
      4: 90000,
    }),
    fixedAmountTextByPostBarCount: Object.freeze({
      2: "50,000원",
      3: "70,000원",
      4: "90,000원",
    }),
    sectionLengthGroupedFee: Object.freeze({
      groupSizeMm: 100,
      groupPrice: 3500,
    }),
    missingSectionLengthConsultReason: "섹션 길이 정보가 없어 시공 상담 안내입니다.",
    fallbackConsultReason: "포스트바 수량 조건을 확인해주세요.",
  }),
});

export const FULFILLMENT_POLICY_DATASET_META = createDatasetMeta({
  id: "fulfillment_policies",
  label: "서비스 정책 데이터",
  description: "페이지별 배송/시공/상담 정책 메시지와 계산 규칙 데이터입니다.",
  source: "assets/js/data/fulfillment-policy-data.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "policy:fulfillment"],
});

export const FULFILLMENT_POLICY_META_BY_KEY = Object.freeze({
  FULFILLMENT_POLICY_MESSAGES: createDatasetMeta({
    id: "fulfillment_policy_messages",
    label: "서비스 정책 공통 메시지",
    description: "서비스 정책 공통 문구(미선택/상담안내/주소 필요 등) 모음입니다.",
    source: "assets/js/data/fulfillment-policy-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "policy:message"],
  }),
  TOP_FULFILLMENT_POLICY: createDatasetMeta({
    id: "top_fulfillment_policy",
    label: "상판 서비스 정책",
    description: "상판 페이지 배송/시공 정책 데이터입니다.",
    source: "assets/js/data/fulfillment-policy-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:top", "policy:fulfillment"],
  }),
  BOARD_FULFILLMENT_POLICY: createDatasetMeta({
    id: "board_fulfillment_policy",
    label: "합판 서비스 정책",
    description: "합판 페이지 배송/시공 정책 데이터입니다.",
    source: "assets/js/data/fulfillment-policy-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:board", "policy:fulfillment"],
  }),
  PLYWOOD_FULFILLMENT_POLICY: createDatasetMeta({
    id: "plywood_fulfillment_policy",
    label: "합판 서비스 정책",
    description: "합판 페이지 배송/시공 정책 데이터입니다.",
    source: "assets/js/data/fulfillment-policy-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:plywood", "policy:fulfillment"],
  }),
  DOOR_FULFILLMENT_POLICY: createDatasetMeta({
    id: "door_fulfillment_policy",
    label: "도어 서비스 정책",
    description: "도어 페이지 배송/시공 정책 데이터입니다.",
    source: "assets/js/data/fulfillment-policy-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:door", "policy:fulfillment"],
  }),
  SYSTEM_FULFILLMENT_POLICY: createDatasetMeta({
    id: "system_fulfillment_policy",
    label: "시스템 서비스 정책",
    description: "시스템 페이지 배송/시공 정책 데이터입니다.",
    source: "assets/js/data/fulfillment-policy-data.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "page:system", "policy:fulfillment"],
  }),
});
