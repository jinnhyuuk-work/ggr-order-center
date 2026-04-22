import { createDataItemMetaMap, createDatasetMeta } from "./addon-data.js";

export const ORDER_PAGE_KEYS = Object.freeze({
  BOARD: "board",
  PLYWOOD: "plywood",
  DOOR: "door",
  TOP: "top",
});

function normalizeIdList(ids = []) {
  return Object.freeze(
    Array.isArray(ids)
      ? ids
          .map((id) => String(id || "").trim())
          .filter(Boolean)
      : []
  );
}

function freezeSelectionBucket({ includeIds = [], excludeIds = [] } = {}) {
  return Object.freeze({
    includeIds: normalizeIdList(includeIds),
    excludeIds: normalizeIdList(excludeIds),
  });
}

function freezePageConfig({ options = {}, processing = {}, sections = {} } = {}) {
  return Object.freeze({
    options: freezeSelectionBucket(options),
    processing: freezeSelectionBucket(processing),
    sections: Object.freeze({
      options: sections.options !== false,
      processing: sections.processing !== false,
    }),
  });
}

export function resolveSelectionIds({ includeIds = [], excludeIds = [], catalogById = {} } = {}) {
  const includeList = normalizeIdList(includeIds);
  const excludeSet = new Set(normalizeIdList(excludeIds));
  const resolved = [];
  const seen = new Set();

  includeList.forEach((id) => {
    if (!id || excludeSet.has(id) || seen.has(id)) return;
    if (!catalogById[id]) return;
    seen.add(id);
    resolved.push(id);
  });

  return resolved;
}

// Single source of truth for page-level additional selections.
// Edit includeIds / excludeIds here to add or remove items per page.
export const ADDITIONAL_SELECTION_PAGE_CONFIG = Object.freeze({
  [ORDER_PAGE_KEYS.BOARD]: freezePageConfig({
    options: {
      includeIds: ["board_edge_finish", "board_surface_coating", "board_anti_scratch"],
      excludeIds: [],
    },
    processing: {
      includeIds: ["proc_hinge_hole", "proc_handle_hole"],
      excludeIds: [],
    },
  }),
  [ORDER_PAGE_KEYS.PLYWOOD]: freezePageConfig({
    options: {
      includeIds: ["plywood_edge_finish", "plywood_surface_coating", "plywood_anti_scratch"],
      excludeIds: [],
    },
    processing: {
      includeIds: ["plywood_hinge_hole", "plywood_handle_hole"],
      excludeIds: [],
    },
  }),
  [ORDER_PAGE_KEYS.DOOR]: freezePageConfig({
    options: {
      includeIds: [],
      excludeIds: [],
    },
    processing: {
      includeIds: [],
      excludeIds: [],
    },
  }),
  [ORDER_PAGE_KEYS.TOP]: freezePageConfig({
    options: {
      includeIds: ["top_sink_cut", "top_faucet_hole", "top_cooktop_cut", "top_back_add"],
      excludeIds: [],
    },
    processing: {
      includeIds: [],
      excludeIds: [],
    },
  }),
});

export function getAdditionalSelectionConfigForPage(pageKey) {
  const cfg = ADDITIONAL_SELECTION_PAGE_CONFIG[pageKey];
  if (!cfg) {
    return {
      options: { includeIds: [], excludeIds: [] },
      processing: { includeIds: [], excludeIds: [] },
      sections: { options: false, processing: false },
    };
  }
  return {
    options: {
      includeIds: [...cfg.options.includeIds],
      excludeIds: [...cfg.options.excludeIds],
    },
    processing: {
      includeIds: [...cfg.processing.includeIds],
      excludeIds: [...cfg.processing.excludeIds],
    },
    sections: { ...cfg.sections },
  };
}

// Backward-compatible legacy shape (`options` / `processing`).
export const ADDITIONAL_SELECTION_PAGE_MAP = Object.freeze(
  Object.entries(ADDITIONAL_SELECTION_PAGE_CONFIG).reduce((acc, [pageKey, cfg]) => {
    acc[pageKey] = Object.freeze({
      options: resolveSelectionIds({
        includeIds: cfg.options.includeIds,
        excludeIds: cfg.options.excludeIds,
        catalogById: Object.fromEntries(cfg.options.includeIds.map((id) => [id, true])),
      }),
      processing: resolveSelectionIds({
        includeIds: cfg.processing.includeIds,
        excludeIds: cfg.processing.excludeIds,
        catalogById: Object.fromEntries(cfg.processing.includeIds.map((id) => [id, true])),
      }),
    });
    return acc;
  }, {})
);

const ADDITIONAL_SELECTION_PAGE_ENTRIES = Object.freeze(
  Object.entries(ADDITIONAL_SELECTION_PAGE_CONFIG).map(([pageKey, cfg]) =>
    Object.freeze({
      id: String(pageKey),
      label: `${String(pageKey).toUpperCase()} 페이지 추가 선택 구성`,
      description: `options ${cfg.options.includeIds.length}개 / processing ${cfg.processing.includeIds.length}개`,
    })
  )
);

export const ADDITIONAL_SELECTION_PAGE_MAP_META = createDatasetMeta({
  id: "additional_selection_page_map",
  label: "페이지별 추가 선택 맵",
  description: "페이지 키 기준 옵션/가공 연결 관계를 정의한 매핑 데이터입니다.",
  source: "assets/js/data/additional-selection-policy.js",
  owner: "order-center",
  updated_at: "2026-03-16",
  status: "active",
  tags: ["[internal]", "mapping:page-selection"],
});

export const ADDITIONAL_SELECTION_PAGE_META_BY_ID = createDataItemMetaMap(
  ADDITIONAL_SELECTION_PAGE_ENTRIES,
  {
    dataset: "additional_selection_page_map",
    source: "assets/js/data/additional-selection-policy.js",
    owner: "order-center",
    updated_at: "2026-03-16",
    status: "active",
    tags: ["[internal]", "mapping:page-selection"],
    labelKey: "label",
    descriptionKey: "description",
  }
);
