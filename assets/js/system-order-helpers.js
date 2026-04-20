export function createSystemOrderHelpers({
  SHELF_LENGTH_MM = 400,
  ADDON_CLOTHES_ROD_ID = "clothes_rod",
  SYSTEM_ADDON_ITEMS = [],
  SYSTEM_SHELF_MATERIALS = {},
  SYSTEM_COLUMN_MATERIALS = {},
  calcAddonCostBreakdown,
  buildLayoutSpecLinesFromSnapshot,
  formatColumnSize,
  buildCustomerEmailSectionLines,
  buildOrderPayloadBase,
  buildConsultAwarePricing,
  formatFulfillmentLine,
} = {}) {
  const sumNumericField = (items = [], field = "") =>
    (Array.isArray(items) ? items : []).reduce((sum, item) => sum + Number(item?.[field] || 0), 0);

  const buildSystemPricingPayload = (item = {}) => {
    const isCustomPrice = Boolean(item?.isCustomPrice);
    const basePricing =
      typeof buildConsultAwarePricing === "function"
        ? buildConsultAwarePricing({
            materialCost: item?.materialCost,
            processingCost: item?.processingCost,
            total: item?.total,
            isCustomPrice,
          })
        : {
            materialCost: isCustomPrice ? null : Number(item?.materialCost || 0),
            processingCost: isCustomPrice ? null : Number(item?.processingCost || 0),
            total: isCustomPrice ? null : Number(item?.total || 0),
            isCustomPrice,
            displayPriceLabel: isCustomPrice ? "상담안내" : null,
          };

    return {
      materialCost: basePricing.materialCost,
      processingCost: basePricing.processingCost,
      componentCost: basePricing.isCustomPrice ? null : Number(item?.componentCost || 0),
      furnitureCost: basePricing.isCustomPrice ? null : Number(item?.furnitureCost || 0),
      total: basePricing.total,
      isCustomPrice: basePricing.isCustomPrice,
      displayPriceLabel: basePricing.displayPriceLabel,
    };
  };

  const buildSystemGroupedShelfBreakdown = (entries = []) => {
    const normalShelfMap = new Map();
    const cornerShelfMap = new Map();
    const cornerCustomCutMap = new Map();
    const furnitureMap = new Map();
    const basePostBarMap = new Map();
    const cornerPostBarMap = new Map();
    let hangerCount = 0;

    const addShelfCount = (bucket, shelf, qty = 0, materialCost = 0) => {
      const thickness = Math.max(0, Number(shelf?.thickness || 0));
      const width = Math.max(0, Number(shelf?.width || 0));
      const length = Math.max(0, Number(SHELF_LENGTH_MM || 0));
      const count = Math.max(0, Number(qty || 0));
      if (!count || !width || !length) return;
      const materialId = String(shelf?.materialId || "");
      const materialName = SYSTEM_SHELF_MATERIALS[materialId]?.name || materialId || "-";
      const key = `${materialId}:${thickness}T-${width}x${length}`;
      const prev = bucket.get(key) || {
        materialId,
        materialName,
        thickness,
        width,
        length,
        count: 0,
        materialCost: 0,
      };
      prev.count += count;
      prev.materialCost += Math.max(0, Number(materialCost || 0));
      bucket.set(key, prev);
    };

    const addPostBarCount = (bucket, kindLabel, postBarDetail = null) => {
      if (!postBarDetail || typeof postBarDetail !== "object") return;
      const count = Math.max(0, Number(postBarDetail.count || 0));
      if (!count) return;
      const tierLabel = String(postBarDetail.tierLabel || "");
      const key = `${kindLabel}:${tierLabel || "-"}`;
      const prev = bucket.get(key) || {
        kindLabel,
        tierLabel,
        count: 0,
      };
      prev.count += count;
      bucket.set(key, prev);
    };

    (Array.isArray(entries) ? entries : []).forEach((item) => {
      if (!item || typeof item !== "object") return;
      if (item.type === "bay") {
        addShelfCount(
          item.isCorner ? cornerShelfMap : normalShelfMap,
          item.shelf,
          item.shelf?.count || 1,
          item.materialCost
        );
        if (item.isCorner && item.shelf?.customProcessing) {
          const primaryMm = Math.max(0, Number(item.shelf?.customPrimaryMm || item.shelf?.width || 0));
          const secondaryMm = Math.max(0, Number(item.shelf?.customSecondaryMm || 0));
          const cutCount = Math.max(1, Math.floor(Number(item.shelf?.count || 1)));
          if (primaryMm > 0 && secondaryMm > 0) {
            const key = `${primaryMm}x${secondaryMm}`;
            const prev = cornerCustomCutMap.get(key) || { primaryMm, secondaryMm, count: 0 };
            prev.count += cutCount;
            cornerCustomCutMap.set(key, prev);
          }
        }
        (Array.isArray(item.addons) ? item.addons : []).forEach((addonId) => {
          const key = String(addonId || "");
          if (!key) return;
          if (key === ADDON_CLOTHES_ROD_ID) {
            hangerCount += 1;
            return;
          }
          const addon = SYSTEM_ADDON_ITEMS.find((entry) => String(entry?.id || "") === key);
          const prev = furnitureMap.get(key) || { id: key, label: addon?.name || key, count: 0 };
          prev.count += 1;
          furnitureMap.set(key, prev);
        });
        return;
      }
      if (item.type === "columns") {
        const baseDetails = Array.isArray(item.basePostBars) && item.basePostBars.length
          ? item.basePostBars
          : [item.basePostBar];
        baseDetails.forEach((entry) => addPostBarCount(basePostBarMap, "기본", entry));
        const cornerDetails = Array.isArray(item.cornerPostBars) && item.cornerPostBars.length
          ? item.cornerPostBars
          : [item.cornerPostBar];
        cornerDetails.forEach((entry) => addPostBarCount(cornerPostBarMap, "코너", entry));
      }
    });

    return {
      normalShelf: Array.from(normalShelfMap.values()).sort((a, b) => {
        if (a.materialName !== b.materialName) {
          return String(a.materialName || "").localeCompare(String(b.materialName || ""), "ko");
        }
        if (a.width !== b.width) return a.width - b.width;
        if (a.length !== b.length) return a.length - b.length;
        return a.thickness - b.thickness;
      }),
      cornerShelf: Array.from(cornerShelfMap.values()).sort((a, b) => {
        if (a.materialName !== b.materialName) {
          return String(a.materialName || "").localeCompare(String(b.materialName || ""), "ko");
        }
        if (a.width !== b.width) return a.width - b.width;
        if (a.length !== b.length) return a.length - b.length;
        return a.thickness - b.thickness;
      }),
      cornerCustomCuts: Array.from(cornerCustomCutMap.values()).sort((a, b) => {
        if (a.primaryMm !== b.primaryMm) return a.primaryMm - b.primaryMm;
        return a.secondaryMm - b.secondaryMm;
      }),
      furniture: Array.from(furnitureMap.values()).sort((a, b) =>
        String(a.label || "").localeCompare(String(b.label || ""), "ko")
      ),
      basePostBars: Array.from(basePostBarMap.values()),
      cornerPostBars: Array.from(cornerPostBarMap.values()),
      hangerCount,
    };
  };

  const formatSystemGroupedCountText = (entries = [], formatter, emptyText = "없음") => {
    const rows = (Array.isArray(entries) ? entries : [])
      .map((entry) => formatter(entry))
      .filter(Boolean);
    return rows.length ? rows.join(", ") : emptyText;
  };

  const formatMm = (value) => {
    const mm = Math.round(Number(value || 0));
    return Number.isFinite(mm) && mm > 0 ? `${mm}mm` : "-";
  };

  const uniqueTextValues = (values = []) =>
    Array.from(
      new Set(
        (Array.isArray(values) ? values : [])
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      )
    );

  const buildLayoutSectionWidthText = (layoutSpec = null) => {
    const sections = Array.isArray(layoutSpec?.sections) ? layoutSpec.sections : [];
    const rows = sections
      .map((section, idx) => {
        const lengthMm = Math.round(Number(section?.lengthMm || 0));
        if (!Number.isFinite(lengthMm) || lengthMm <= 0) return "";
        const label = String(section?.label || `설치공간${idx + 1}`);
        return sections.length === 1 ? `${lengthMm}mm` : `${label} ${lengthMm}mm`;
      })
      .filter(Boolean);
    return rows.length ? rows.join(" / ") : "-";
  };

  const buildSystemColumnExtraHeightValue = (column = null, layoutSpec = null) => {
    const rawGroups = Array.isArray(column?.spaceExtraHeights) ? column.spaceExtraHeights : [];
    const normalizedGroups = rawGroups
      .map((group, index) => {
        const values = (Array.isArray(group) ? group : [group])
          .map((value) => Math.round(Number(value || 0)))
          .filter((value) => Number.isFinite(value) && value > 0);
        if (!values.length) return "";
        const label = String(layoutSpec?.sections?.[index]?.label || `설치공간${index + 1}`);
        const valuesText = values.map((value) => `${value}mm`).join(", ");
        return `${label} ${valuesText}`;
      })
      .filter(Boolean);
    return normalizedGroups.length ? normalizedGroups.join(" / ") : "없음";
  };

  const buildSystemPostBarInfoText = (groupItem = null) => {
    const breakdown = groupItem?.breakdown || {};
    const column = groupItem?.column || null;
    if (!column) return "없음";
    const columnMat = SYSTEM_COLUMN_MATERIALS[column.materialId] || null;
    const postBarRows = [...(breakdown.basePostBars || []), ...(breakdown.cornerPostBars || [])];
    const countText = formatSystemGroupedCountText(
      postBarRows,
      (entry) => `${entry.kindLabel} 포스트바${entry.tierLabel ? `(${entry.tierLabel})` : ""} ${entry.count}개`
    );
    return `컬러: ${columnMat?.name || "-"} / 수량: ${countText}`;
  };

  const buildSystemShelfInfoText = (entries = []) => {
    const rows = Array.isArray(entries) ? entries : [];
    if (!rows.length) return "없음";
    const colorText = uniqueTextValues(rows.map((entry) => entry.materialName || "-")).join(", ") || "-";
    const sizeText = rows
      .map((entry) => `${entry.thickness}T ${entry.width}×${entry.length}mm ${entry.count}개`)
      .join(", ");
    return `컬러: ${colorText} / 사이즈·수량: ${sizeText}`;
  };

  const buildSystemCornerShelfInfoText = (breakdown = {}) => {
    const rows = Array.isArray(breakdown.cornerShelf) ? breakdown.cornerShelf : [];
    const baseText = buildSystemShelfInfoText(rows);
    const cutText = formatSystemGroupedCountText(
      breakdown.cornerCustomCuts,
      (entry) => `${entry.primaryMm}×${entry.secondaryMm}mm ${entry.count}개`,
      ""
    );
    if (!cutText) return baseText;
    return baseText === "없음" ? `비규격 절단: ${cutText}` : `${baseText} / 비규격 절단: ${cutText}`;
  };

  const buildSystemHangerInfoText = (breakdown = {}) => {
    const hangerCount = Math.max(0, Math.floor(Number(breakdown.hangerCount || 0)));
    if (!hangerCount) return "없음";
    const hangerItem = SYSTEM_ADDON_ITEMS.find((item) => String(item?.id || "") === ADDON_CLOTHES_ROD_ID);
    return `${hangerItem?.name || "행거"} ${hangerCount}개`;
  };

  const buildSystemFurnitureInfoText = (breakdown = {}) =>
    formatSystemGroupedCountText(
      breakdown.furniture,
      (entry) => `${entry.label} ${entry.count}개`
    );

  const buildSystemColumnExtraHeightLine = (column = null, layoutSpec = null) => {
    const valueText = buildSystemColumnExtraHeightValue(column, layoutSpec);
    return valueText === "없음" ? "" : `개별높이 ${valueText}`;
  };

  const buildSystemOrderCompleteDetailRows = (groupItem = {}) => {
    const layoutSpec = groupItem?.layoutSpec || {};
    const column = groupItem?.column || null;
    const breakdown = groupItem?.breakdown || {};
    const quantity = Math.max(1, Math.floor(Number(groupItem?.quantity || 1)));
    const shapeLabel = String(
      layoutSpec?.shapeLabel || layoutSpec?.layoutTypeLabel || layoutSpec?.shapeType || ""
    ).trim();
    return [
      { label: "품목명", value: `시스템 수납장 ${quantity}세트` },
      { label: "레이아웃 타입", value: shapeLabel || "-" },
      { label: "설치공간 너비", value: buildLayoutSectionWidthText(layoutSpec) },
      { label: "가장 낮은 높이", value: formatMm(layoutSpec?.lowestHeightMm) },
      { label: "가장 높은 높이", value: formatMm(layoutSpec?.highestHeightMm) },
      { label: "개별 높이", value: buildSystemColumnExtraHeightValue(column, layoutSpec) },
      { label: "포스트바 정보", value: buildSystemPostBarInfoText(groupItem) },
      { label: "선반 정보", value: buildSystemShelfInfoText(breakdown.normalShelf) },
      { label: "코너선반 정보", value: buildSystemCornerShelfInfoText(breakdown) },
      { label: "행거 정보", value: buildSystemHangerInfoText(breakdown) },
      { label: "가구 정보", value: buildSystemFurnitureInfoText(breakdown) },
    ];
  };

  const buildSystemGroupDisplayItems = (items = []) => {
    const groupMap = new Map();
    (Array.isArray(items) ? items : []).forEach((item) => {
      if (!item || typeof item !== "object") return;
      const groupKey = String(item.groupId || item.id || "");
      if (!groupKey) return;
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey).push(item);
    });

    return Array.from(groupMap.entries()).map(([groupId, entries]) => {
      const columnsItem = entries.find((item) => item.type === "columns") || null;
      const bays = entries.filter((item) => item.type === "bay");
      const quantity = Math.max(
        1,
        Number(columnsItem?.quantity || bays[0]?.quantity || entries[0]?.quantity || 1)
      );
      const addonCost = bays.reduce(
        (acc, bay) => {
          if (!bay || bay.isCustomPrice) return acc;
          const bayQty = Math.max(1, Number(bay.quantity || quantity || 1));
          const costs = calcAddonCostBreakdown(bay.addons, bayQty);
          return {
            componentCost: acc.componentCost + Number(costs.componentCost || 0),
            furnitureCost: acc.furnitureCost + Number(costs.furnitureCost || 0),
          };
        },
        { componentCost: 0, furnitureCost: 0 }
      );
      return {
        id: `group:${groupId}`,
        groupId,
        quantity,
        type: "group",
        total: sumNumericField(entries, "total"),
        materialCost: sumNumericField(entries, "materialCost"),
        processingCost: sumNumericField(entries, "processingCost"),
        componentCost: addonCost.componentCost,
        furnitureCost: addonCost.furnitureCost,
        subtotal: sumNumericField(entries, "subtotal"),
        vat: sumNumericField(entries, "vat"),
        isCustomPrice: entries.some((item) => Boolean(item?.isCustomPrice)),
        column: columnsItem?.column || null,
        layoutSpec: columnsItem?.layoutSpec || bays[0]?.layoutSpec || null,
        layoutConsult: columnsItem?.layoutConsult || bays[0]?.layoutConsult || null,
        breakdown: buildSystemGroupedShelfBreakdown(entries),
      };
    });
  };

  const buildSystemGroupDetailLines = (groupItem, { includeLayout = true } = {}) => {
    const breakdown = groupItem?.breakdown || {};
    const column = groupItem?.column || null;
    const columnMat = column ? SYSTEM_COLUMN_MATERIALS[column.materialId] : null;
    const lines = [];

    if (column) {
      lines.push(`포스트바 컬러 ${columnMat?.name || "-"} · ${formatColumnSize(column)}`);
      const extraHeightLine = buildSystemColumnExtraHeightLine(column, groupItem?.layoutSpec);
      if (extraHeightLine) lines.push(extraHeightLine);
    }

    lines.push(
      `선반 ${formatSystemGroupedCountText(
        breakdown.normalShelf,
        (entry) =>
          `${entry.thickness}T/${entry.width}×${entry.length}mm ${entry.count}개${
            Number(entry.materialCost || 0) > 0 ? ` (${Number(entry.materialCost).toLocaleString()}원)` : ""
          }`
      )}`
    );
    lines.push(
      `코너선반 ${formatSystemGroupedCountText(
        breakdown.cornerShelf,
        (entry) =>
          `${entry.thickness}T/${entry.width}×${entry.length}mm ${entry.count}개${
            Number(entry.materialCost || 0) > 0 ? ` (${Number(entry.materialCost).toLocaleString()}원)` : ""
          }`
      )}`
    );
    if (Array.isArray(breakdown.cornerCustomCuts) && breakdown.cornerCustomCuts.length) {
      lines.push(
        `코너 비규격 절단 ${formatSystemGroupedCountText(
          breakdown.cornerCustomCuts,
          (entry) => `${entry.primaryMm}×${entry.secondaryMm}mm ${entry.count}개`
        )}`
      );
    }
    lines.push(
      `포스트바 ${formatSystemGroupedCountText(
        [...(breakdown.basePostBars || []), ...(breakdown.cornerPostBars || [])],
        (entry) => `${entry.kindLabel} 포스트바${entry.tierLabel ? `(${entry.tierLabel})` : ""} ${entry.count}개`
      )}`
    );
    lines.push(
      `가구 ${formatSystemGroupedCountText(
        breakdown.furniture,
        (entry) => `${entry.label} ${entry.count}개`
      )}`
    );
    lines.push(`행거 ${Number(breakdown.hangerCount || 0) > 0 ? `${breakdown.hangerCount}개` : "없음"}`);

    if (includeLayout) {
      const layoutLines = buildLayoutSpecLinesFromSnapshot(groupItem?.layoutSpec, groupItem?.layoutConsult, {
        includeStatus: true,
      });
      layoutLines.forEach((line) => lines.push(line));
    }

    if (groupItem?.isCustomPrice) {
      lines.push("품목비 상담 안내");
      lines.push("구성품비 상담 안내");
      lines.push("비규격 상담 안내");
    } else {
      const componentCost = Number(groupItem?.componentCost || 0);
      const furnitureCost = Number(groupItem?.furnitureCost || 0);
      const componentTotal = componentCost + furnitureCost;
      const componentParts = [];
      if (componentCost > 0) componentParts.push(`행거 ${componentCost.toLocaleString()}원`);
      if (furnitureCost > 0) componentParts.push(`가구 ${furnitureCost.toLocaleString()}원`);
      lines.push(`품목비 ${Number(groupItem?.materialCost || 0).toLocaleString()}원`);
      lines.push(
        `구성품비 ${componentTotal.toLocaleString()}원${
          componentParts.length ? ` (${componentParts.join(" · ")})` : ""
        }`
      );
    }
    return lines;
  };

  const buildEmailContent = ({
    customer,
    summary,
    displayItems = [],
    builderRows = [],
    previewImageUrl = "",
    previewImageError = "",
    customerPhotoUploads = [],
    customerPhotoErrors = [],
  } = {}) => {
    const lines = buildCustomerEmailSectionLines({
      customer,
      customerPhotoUploads,
      customerPhotoErrors,
    });
    lines.push("");
    lines.push("=== 주문 내역 ===");

    if (displayItems.length === 0) {
      lines.push("- 담긴 항목 없음");
    } else {
      displayItems.forEach((item, idx) => {
        lines.push(`${idx + 1}) 품목`);
        buildSystemOrderCompleteDetailRows(item).forEach((row) => {
          lines.push(`- ${row.label}: ${row.value}`);
        });
        if (idx < displayItems.length - 1) {
          lines.push("");
          lines.push("------------------------------");
          lines.push("");
        }
      });
    }
    lines.push("");
    lines.push("=== 모듈 내역 ===");
    if (!builderRows.length) {
      lines.push("- 구성 내역 없음");
    } else {
      builderRows.forEach((row) => {
        lines.push(`- ${row.title}: ${row.meta}`);
      });
    }
    if (previewImageUrl) {
      lines.push("");
      lines.push("=== 미리보기 ===");
      lines.push(previewImageUrl);
    } else if (previewImageError) {
      lines.push("");
      lines.push("=== 미리보기 ===");
      lines.push(`업로드 실패: ${previewImageError}`);
    }

    lines.push("");
    lines.push("=== 합계 ===");
    const suffix = summary.hasConsult ? "(상담 필요 품목 미포함)" : "";
    const productHasConsult = displayItems.some((item) => Boolean(item?.isCustomPrice));
    const productSuffix = productHasConsult ? "(상담 필요 품목 미포함)" : "";
    const productTotal = Number(summary.subtotal || 0);
    const naverUnits = Math.ceil(summary.grandTotal / 1000) || 0;
    lines.push(`예상 제품금액: ${productTotal.toLocaleString()}원${productSuffix}`);
    lines.push(`배송/시공 서비스: ${formatFulfillmentLine(summary.fulfillment)}`);
    lines.push(`예상 결제금액: ${summary.grandTotal.toLocaleString()}원${suffix}`);
    lines.push(`예상 네이버 결제수량: ${naverUnits}개`);

    const subject = `[GGR 견적요청] ${customer.name || "고객명"} (${customer.phone || "연락처"})`;
    return {
      subject,
      body: lines.join("\n"),
      lines,
    };
  };

  const buildOrderPayload = ({
    customer,
    summary,
    displayItems = [],
    builderRows = [],
    previewImageUrl = "",
    previewImagePublicId = "",
    previewImageError = "",
    customerPhotoUploads = [],
  } = {}) => ({
    ...buildOrderPayloadBase({
      pageKey: "system",
      customer,
      summary,
      customerPhotoUploads,
    }),
    preview: {
      imageUrl: String(previewImageUrl || "").trim(),
      imagePublicId: String(previewImagePublicId || "").trim(),
      imageError: String(previewImageError || "").trim(),
    },
    items: displayItems.map((item) => ({
      lineId: item.id,
      itemType: "system_group",
      name: "시스템 구성",
      groupId: String(item.groupId || ""),
      quantity: Number(item.quantity || 1),
      detailLines: buildSystemGroupDetailLines(item),
      pricing: buildSystemPricingPayload(item),
    })),
    builderRows: builderRows.map((row) => ({
      id: String(row.id || ""),
      title: String(row.title || ""),
      meta: String(row.meta || ""),
      moduleLabel: String(row.moduleLabel || ""),
      isCorner: Boolean(row.isCorner),
    })),
  });

  return {
    buildSystemGroupDisplayItems,
    buildSystemGroupDetailLines,
    buildSystemOrderCompleteDetailRows,
    buildEmailContent,
    buildOrderPayload,
  };
}
