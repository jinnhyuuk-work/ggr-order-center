import { resolveAmountFromPriceRule } from "./shared.js";

export class BaseServiceModel {
  constructor(cfg) {
    this.id = cfg.id;
    this.label = cfg.label;
    this.type = cfg.type || "simple";
    this.pricingRule = cfg.pricingRule || null;
    this.availabilityRule = cfg.availabilityRule;
    this.pricingMode = cfg.pricingMode;
    this.consultOnly = cfg.consultOnly;
    this.forceConsult = cfg.forceConsult;
    this.isConsult = cfg.isConsult;
    this.priceLabel = cfg.priceLabel;
    this.displayPriceText = cfg.displayPriceText;
    this.swatch = cfg.swatch;
    this.description = cfg.description;
  }
  hasDetail() {
    return this.type === "detail";
  }
  defaultDetail() {
    return null;
  }
  normalizeDetail(detail) {
    return detail || this.defaultDetail();
  }
  validateDetail(detail) {
    return { ok: true, detail: this.normalizeDetail(detail), message: "" };
  }
  getCount(detail) {
    return 1;
  }
  formatDetail(detail, { includeNote = false } = {}) {
    if (!this.hasDetail()) return "세부 설정 없음";
    const note = includeNote && detail?.note ? ` (메모: ${detail.note})` : "";
    return `세부 옵션 저장됨${note}`;
  }
  calcProcessingCost(quantity, detail) {
    return resolveAmountFromPriceRule({
      config: this,
      quantity,
      detail,
      metrics: { holeCount: this.getCount(detail) },
    });
  }
}

function formatHoleDetail(detail, { includeNote = false, short = false } = {}) {
  if (!detail) return short ? "세부 옵션을 설정해주세요." : "세부 옵션 미입력";
  const holes = Array.isArray(detail.holes) ? detail.holes : [];
  if (holes.length === 0) {
    return short ? "세부 옵션을 설정해주세요." : "세부 옵션 미입력";
  }
  const count = holes.length || detail.count || 0;
  const positions = holes
    .filter((h) => h && (h.distance || h.verticalDistance))
    .map((h) => {
      const edgeLabel = h.edge === "right" ? "우" : "좌";
      const verticalLabel = h.verticalRef === "bottom" ? "하" : "상";
      const vert = h.verticalDistance ? `${verticalLabel} ${h.verticalDistance}mm` : "";
      const horiz = h.distance ? `${edgeLabel} ${h.distance}mm` : "";
      return [horiz, vert].filter(Boolean).join(" / ");
    })
    .join(", ");
  const noteText = includeNote && detail.note ? ` · 메모: ${detail.note}` : "";
  const suffix = positions ? ` · ${positions}` : "";
  return `${count}개${suffix}${noteText}`;
}

export class HoleServiceModel extends BaseServiceModel {
  constructor(cfg) {
    super({ ...cfg, type: "detail" });
  }
  defaultDetail() {
    return { holes: [], note: "" };
  }
  normalizeDetail(detail) {
    if (!detail || !Array.isArray(detail.holes)) return this.defaultDetail();
    const holes = detail.holes;
    return {
      holes: holes.map((h) => ({
        edge: h.edge === "right" ? "right" : "left",
        distance: Number(h.distance),
        verticalRef: h.verticalRef === "bottom" ? "bottom" : "top",
        verticalDistance: Number(h.verticalDistance),
      })),
      note: detail.note || "",
    };
  }
  validateDetail(detail) {
    const normalized = this.normalizeDetail(detail);
    const validHoles = (normalized.holes || []).filter(
      (h) =>
        h &&
        Number.isFinite(Number(h.distance)) &&
        Number(h.distance) > 0 &&
        Number.isFinite(Number(h.verticalDistance)) &&
        Number(h.verticalDistance) > 0
    );
    if (validHoles.length === 0) {
      return {
        ok: false,
        message: `${this.label}의 가로·세로 위치를 1개 이상 입력해주세요.`,
        detail: normalized,
      };
    }
    return {
      ok: true,
      detail: {
        holes: validHoles,
        note: normalized.note?.trim() || "",
      },
      message: "",
    };
  }
  getCount(detail) {
    const normalized = this.normalizeDetail(detail);
    const holes = Array.isArray(normalized.holes) ? normalized.holes.length : 0;
    const fallback = normalized.count || 0;
    return Math.max(0, holes || fallback || 0);
  }
  formatDetail(detail, { includeNote = false, short = false } = {}) {
    return formatHoleDetail(detail, { includeNote, short });
  }
}

export function buildServiceModels(configs) {
  const models = {};
  Object.values(configs || {}).forEach((cfg) => {
    const ruleType = String(cfg?.pricingRule?.type || "").trim();
    if (cfg.type === "detail" || ruleType === "perHole" || ruleType === "hole") {
      models[cfg.id] = new HoleServiceModel(cfg);
    } else {
      models[cfg.id] = new BaseServiceModel(cfg);
    }
  });
  return models;
}
