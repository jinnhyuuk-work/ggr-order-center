import { createDataItemMetaMap, createDatasetMeta } from "./common-data.js";

export const ORDER_PAGE_KEYS = Object.freeze({
  BOARD: "board",
  DOOR: "door",
  TOP: "top",
});

function freezePageConfig({ optionIds = [], processingIds = [], sections = {} } = {}) {
  return Object.freeze({
    optionIds: Object.freeze([...optionIds]),
    processingIds: Object.freeze([...processingIds]),
    sections: Object.freeze({
      options: sections.options !== false,
      processing: sections.processing !== false,
    }),
  });
}

// Single source of truth for page-level additional selections.
// To add/remove items per page, edit only this object.
export const ADDITIONAL_SELECTION_PAGE_CONFIG = Object.freeze({
  [ORDER_PAGE_KEYS.BOARD]: freezePageConfig({
    optionIds: ["board_edge_finish", "board_surface_coating", "board_anti_scratch"],
    processingIds: ["proc_hinge_hole", "proc_handle_hole"],
  }),
  [ORDER_PAGE_KEYS.DOOR]: freezePageConfig({
    optionIds: [],
    processingIds: ["proc_handle_hole"],
  }),
  [ORDER_PAGE_KEYS.TOP]: freezePageConfig({
    optionIds: ["top_sink_cut", "top_faucet_hole", "top_cooktop_cut", "top_back_add"],
    processingIds: [],
  }),
});

export function getAdditionalSelectionConfigForPage(pageKey) {
  const cfg = ADDITIONAL_SELECTION_PAGE_CONFIG[pageKey];
  if (!cfg) {
    return {
      optionIds: [],
      processingIds: [],
      sections: { options: false, processing: false },
    };
  }
  return {
    optionIds: [...cfg.optionIds],
    processingIds: [...cfg.processingIds],
    sections: { ...cfg.sections },
  };
}

// Backward-compatible legacy shape (`options` / `processing`).
export const ADDITIONAL_SELECTION_PAGE_MAP = Object.freeze(
  Object.entries(ADDITIONAL_SELECTION_PAGE_CONFIG).reduce((acc, [pageKey, cfg]) => {
    acc[pageKey] = Object.freeze({
      options: [...cfg.optionIds],
      processing: [...cfg.processingIds],
    });
    return acc;
  }, {})
);

const ADDITIONAL_SELECTION_PAGE_ENTRIES = Object.freeze(
  Object.entries(ADDITIONAL_SELECTION_PAGE_CONFIG).map(([pageKey, cfg]) =>
    Object.freeze({
      id: String(pageKey),
      label: `${String(pageKey).toUpperCase()} 페이지 추가 선택 구성`,
      description: `options ${cfg.optionIds.length}개 / processing ${cfg.processingIds.length}개`,
    })
  )
);

export const ADDITIONAL_SELECTION_PAGE_MAP_META = createDatasetMeta({
  id: "additional_selection_page_map",
  label: "페이지별 추가 선택 맵",
  description: "페이지 키 기준 옵션/가공 연결 관계를 정의한 매핑 데이터입니다.",
  source: "assets/js/data/additional-page-map.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "mapping:page-selection"],
});

export const ADDITIONAL_SELECTION_PAGE_META_BY_ID = createDataItemMetaMap(
  ADDITIONAL_SELECTION_PAGE_ENTRIES,
  {
    dataset: "additional_selection_page_map",
    source: "assets/js/data/additional-page-map.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "mapping:page-selection"],
    labelKey: "label",
    descriptionKey: "description",
  }
);
