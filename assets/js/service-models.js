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
    const detailUi = cfg?.detailUi && typeof cfg.detailUi === "object" ? cfg.detailUi : {};
    this.detailDescription = detailUi.description ?? cfg.detailDescription;
    this.detailTips = Array.isArray(detailUi.tips)
      ? [...detailUi.tips]
      : Array.isArray(cfg.detailTips)
        ? [...cfg.detailTips]
        : cfg.detailTips;
    this.helpGuideKey = detailUi.helpGuideKey ?? cfg.helpGuideKey;
    this.detailMode = cfg.detailMode;
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
  const hingeIncludedText =
    detail.hingeIncluded === false ? "경첩 미포함" : detail.hingeIncluded === true ? "경첩 포함" : "";
  const doorTypeText =
    detail.doorType === "indoor"
      ? "인도어"
      : detail.doorType === "outdoor"
        ? "아웃도어"
        : "";
  const sideText =
    detail.side === "right" ? "좌측문" : detail.side === "left" ? "우측문" : "";
  const sideThicknessText =
    Number(detail.sideThickness) === 18
      ? "측면 18T"
      : Number(detail.sideThickness) === 15
        ? "측면 15T"
        : "";
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
  const prefixParts = [sideThicknessText, doorTypeText, hingeIncludedText, sideText].filter(Boolean);
  const sidePrefix = prefixParts.length ? `${prefixParts.join(" · ")} · ` : "";
  return `${sidePrefix}${count}개${suffix}${noteText}`;
}

export class HoleServiceModel extends BaseServiceModel {
  constructor(cfg) {
    super({ ...cfg, type: "detail" });
  }
  defaultDetail() {
    if (this.detailMode === "side-hinge-list") {
      return {
        side: "right",
        doorType: "",
        hingeIncluded: true,
        sideThickness: "",
        holes: [],
        note: "",
      };
    }
    return { holes: [], note: "" };
  }
  normalizeDetail(detail) {
    if (this.detailMode === "side-hinge-list") {
      const holes = Array.isArray(detail?.holes) ? detail.holes : [];
      const inferredSide =
        detail?.side === "right" || detail?.side === "left"
          ? detail.side
          : holes[0]?.edge === "right"
            ? "right"
            : "right";
      const doorType =
        detail?.doorType === "outdoor" || detail?.doorType === "indoor" ? detail.doorType : "";
      const hingeIncluded = detail?.hingeIncluded !== false;
      const sideThickness =
        Number(detail?.sideThickness) === 18
          ? 18
          : Number(detail?.sideThickness) === 15
            ? 15
            : "";
      return {
        side: inferredSide,
        doorType,
        hingeIncluded,
        sideThickness,
        holes: holes.map((h) => ({
          edge: inferredSide,
          distance: Number(h?.distance ?? 22),
          verticalRef: "top",
          verticalDistance: Number(h?.verticalDistance),
        })),
        note: detail?.note || "",
      };
    }
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
    const isSideHingeList = this.detailMode === "side-hinge-list";
    if (isSideHingeList) {
      const hasDoorType = normalized.doorType === "indoor" || normalized.doorType === "outdoor";
      const hasSideThickness = Number(normalized.sideThickness) === 15 || Number(normalized.sideThickness) === 18;
      if (!hasDoorType || !hasSideThickness) {
        const missingParts = [];
        if (!hasDoorType) missingParts.push("도어 형태");
        if (!hasSideThickness) missingParts.push("측면 두께");
        return {
          ok: false,
          message: `${missingParts.join("와 ")}를 선택해주세요.`,
          detail: normalized,
        };
      }
    }
    const validHoles = (normalized.holes || []).filter((h) =>
      isSideHingeList
        ? h && Number.isFinite(Number(h.verticalDistance)) && Number(h.verticalDistance) > 0
        : h &&
          Number.isFinite(Number(h.distance)) &&
          Number(h.distance) > 0 &&
          Number.isFinite(Number(h.verticalDistance)) &&
          Number(h.verticalDistance) > 0
    );
    if (validHoles.length === 0) {
      return {
        ok: false,
        message: isSideHingeList
          ? `${this.label}의 세로 위치를 1개 이상 입력해주세요.`
          : `${this.label}의 가로·세로 위치를 1개 이상 입력해주세요.`,
        detail: normalized,
      };
    }
    const side = normalized.side === "right" ? "right" : "left";
    return {
      ok: true,
      detail: {
        side: isSideHingeList ? side : normalized.side,
        ...(isSideHingeList ? { doorType: normalized.doorType } : {}),
        ...(isSideHingeList ? { hingeIncluded: normalized.hingeIncluded !== false } : {}),
        ...(isSideHingeList ? { sideThickness: normalized.sideThickness } : {}),
        holes: validHoles.map((hole) =>
          isSideHingeList
            ? {
                edge: side,
                distance: Number(hole.distance || 22),
                verticalRef: "top",
                verticalDistance: Number(hole.verticalDistance),
              }
            : hole
        ),
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
