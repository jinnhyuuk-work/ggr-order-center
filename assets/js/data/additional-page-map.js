export const ORDER_PAGE_KEYS = Object.freeze({
  BOARD: "board",
  DOOR: "door",
  TOP: "top",
});

export const ADDITIONAL_SELECTION_PAGE_MAP = Object.freeze({
  [ORDER_PAGE_KEYS.BOARD]: {
    options: ["board_edge_finish", "board_surface_coating", "board_anti_scratch"],
    processing: ["proc_hinge_hole", "proc_handle_hole"],
  },
  [ORDER_PAGE_KEYS.DOOR]: {
    options: ["door_edge_finish", "door_surface_coating", "door_anti_scratch"],
    processing: ["proc_hinge_hole", "proc_handle_hole"],
  },
  [ORDER_PAGE_KEYS.TOP]: {
    options: ["top_sink_cut", "top_faucet_hole", "top_cooktop_cut"],
    processing: ["proc_hinge_hole", "proc_handle_hole", "top_back_shelf"],
  },
});
