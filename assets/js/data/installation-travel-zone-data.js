import { createDataItemMetaMap, createDatasetMeta } from "./addon-data.js";

function freezeRule({ sido = "", sigungu = "*", include = [], exclude = [] } = {}) {
  return Object.freeze({
    sido: String(sido || "").trim(),
    sigungu: String(sigungu || "*").trim() || "*",
    include: Object.freeze(Array.isArray(include) ? include.map((item) => String(item || "").trim()).filter(Boolean) : []),
    exclude: Object.freeze(Array.isArray(exclude) ? exclude.map((item) => String(item || "").trim()).filter(Boolean) : []),
  });
}

function freezeZone({ id = "", label = "", travelFee = 0, rules = [] } = {}) {
  return Object.freeze({
    id: String(id || "").trim(),
    label: String(label || "").trim(),
    travelFee: Math.max(0, Number(travelFee) || 0),
    rules: Object.freeze((Array.isArray(rules) ? rules : []).map((rule) => freezeRule(rule))),
  });
}

export const INSTALLATION_TRAVEL_ZONE_POLICY = Object.freeze({
  consultReason: "시공 출장 권역을 확인할 수 없어 상담 안내입니다.",
});

export const INSTALLATION_TRAVEL_ZONE_RULES = Object.freeze([
  freezeZone({
    id: "zone_1",
    label: "1권역",
    travelFee: 0,
    rules: [
      { sido: "경기도", sigungu: "양주시" },
      { sido: "경기도", sigungu: "의정부시" },
      { sido: "경기도", sigungu: "동두천시" },
      { sido: "경기도", sigungu: "포천시" },
      { sido: "경기도", sigungu: "남양주시", include: ["진접", "오남", "별내"] },
    ],
  }),
  freezeZone({
    id: "zone_2",
    label: "2권역",
    travelFee: 40000,
    rules: [
      { sido: "서울특별시", sigungu: "노원구" },
      { sido: "서울특별시", sigungu: "도봉구" },
      { sido: "서울특별시", sigungu: "강북구" },
      { sido: "서울특별시", sigungu: "중랑구" },
      { sido: "경기도", sigungu: "남양주시", exclude: ["진접", "오남", "별내"] },
      { sido: "경기도", sigungu: "구리시" },
      { sido: "경기도", sigungu: "고양시" },
      { sido: "경기도", sigungu: "파주시" },
    ],
  }),
  freezeZone({
    id: "zone_3",
    label: "3권역",
    travelFee: 60000,
    rules: [
      { sido: "서울특별시", sigungu: "종로구" },
      { sido: "서울특별시", sigungu: "중구" },
      { sido: "서울특별시", sigungu: "용산구" },
      { sido: "서울특별시", sigungu: "성북구" },
      { sido: "서울특별시", sigungu: "동대문구" },
      { sido: "서울특별시", sigungu: "성동구" },
      { sido: "서울특별시", sigungu: "광진구" },
      { sido: "서울특별시", sigungu: "마포구" },
      { sido: "서울특별시", sigungu: "은평구" },
      { sido: "서울특별시", sigungu: "서대문구" },
      { sido: "경기도", sigungu: "하남시" },
      { sido: "경기도", sigungu: "김포시" },
      { sido: "경기도", sigungu: "부천시" },
    ],
  }),
  freezeZone({
    id: "zone_4",
    label: "4권역",
    travelFee: 80000,
    rules: [
      { sido: "서울특별시", sigungu: "강남구" },
      { sido: "서울특별시", sigungu: "서초구" },
      { sido: "서울특별시", sigungu: "송파구" },
      { sido: "서울특별시", sigungu: "강동구" },
      { sido: "서울특별시", sigungu: "강서구" },
      { sido: "서울특별시", sigungu: "양천구" },
      { sido: "서울특별시", sigungu: "영등포구" },
      { sido: "서울특별시", sigungu: "동작구" },
      { sido: "서울특별시", sigungu: "관악구" },
      { sido: "서울특별시", sigungu: "구로구" },
      { sido: "서울특별시", sigungu: "금천구" },
      { sido: "경기도", sigungu: "성남시" },
      { sido: "경기도", sigungu: "광주시" },
      { sido: "경기도", sigungu: "시흥시" },
      { sido: "인천광역시", sigungu: "*", exclude: ["강화군", "옹진군"] },
    ],
  }),
  freezeZone({
    id: "zone_5",
    label: "5권역",
    travelFee: 100000,
    rules: [
      { sido: "경기도", sigungu: "군포시" },
      { sido: "경기도", sigungu: "안양시" },
      { sido: "경기도", sigungu: "의왕시" },
      { sido: "경기도", sigungu: "수원시" },
      { sido: "경기도", sigungu: "용인시" },
      { sido: "경기도", sigungu: "화성시" },
      { sido: "경기도", sigungu: "평택시" },
      { sido: "경기도", sigungu: "안성시" },
      { sido: "경기도", sigungu: "오산시" },
      { sido: "경기도", sigungu: "이천시" },
      { sido: "인천광역시", sigungu: "강화군" },
      { sido: "인천광역시", sigungu: "옹진군" },
    ],
  }),
]);

const ZONE_META_ITEMS = Object.freeze(
  INSTALLATION_TRAVEL_ZONE_RULES.map((zone) =>
    Object.freeze({
      id: zone.id,
      name: zone.label,
      description: `${zone.label} 출장비 ${zone.travelFee.toLocaleString()}원`,
    })
  )
);

export const INSTALLATION_TRAVEL_ZONE_DATASET_META = createDatasetMeta({
  id: "installation_travel_zones",
  label: "시공 출장 권역 데이터",
  description: "시공 서비스에 적용하는 권역별 출장비 규칙 데이터입니다.",
  source: "assets/js/data/installation-travel-zone-data.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "policy:installation-travel"],
});

export const INSTALLATION_TRAVEL_ZONE_META_BY_ID = createDataItemMetaMap(ZONE_META_ITEMS, {
  dataset: "installation_travel_zones",
  source: "assets/js/data/installation-travel-zone-data.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "policy:installation-travel"],
});
