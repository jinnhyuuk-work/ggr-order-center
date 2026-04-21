export function createSystemMaterialPickerHelpers(deps = {}) {
  const {
    $,
    closeModal,
    autoCalculatePrice,
    updatePreview,
    renderSelectedCard,
    buildMaterialVisualMarkup,
    escapeHtml,
    SYSTEM_MATERIAL_CATEGORIES_DESC = {},
    SYSTEM_SHELF_TIER_PRICING = {},
    SYSTEM_POST_BAR_PRICING = {},
    MODULE_POST_BAR_HEIGHT_LIMITS = {},
    SYSTEM_POST_BAR_PRICE_MAX_HEIGHT_MM = 0,
    MODULE_SHELF_WIDTH_LIMITS = {},
    LIMITS = {},
    SWATCH_FALLBACK = "#d9d9d9",
  } = deps;

  const buildCategories = (materials) => {
    const list = Object.values(materials).map((m) => m.category || "기타");
    return Array.from(new Set(list));
  };

  const renderCategoryDesc = (picker) => {
    const descEl = $(picker.categoryDescId);
    const titleEl = $(picker.categoryNameId);
    if (!descEl || !titleEl) return;
    const desc = SYSTEM_MATERIAL_CATEGORIES_DESC[picker.selectedCategory] || "";
    titleEl.textContent = picker.selectedCategory || "";
    descEl.textContent = desc;
  };

  const formatWon = (amount) => {
    const value = Math.round(Number(amount || 0));
    if (!Number.isFinite(value) || value <= 0) return "-";
    return `${value.toLocaleString()}원`;
  };

  const resolveTierUnitPrice = (tier, material) => {
    if (!tier || !material || Boolean(tier.isCustomPrice)) return 0;
    const tierKey = String(tier.key || "");
    const pricingRule = material.pricingRule && typeof material.pricingRule === "object" ? material.pricingRule : null;
    const byPricingRule = pricingRule?.priceByTierKey ? Number(pricingRule.priceByTierKey[tierKey] || 0) : 0;
    if (Number.isFinite(byPricingRule) && byPricingRule > 0) return Math.round(byPricingRule);
    const materialPriceByTierKey =
      material.priceByTierKey && typeof material.priceByTierKey === "object" ? material.priceByTierKey : null;
    const byMaterialTierKey = materialPriceByTierKey ? Number(materialPriceByTierKey[tierKey] || 0) : 0;
    if (Number.isFinite(byMaterialTierKey) && byMaterialTierKey > 0) return Math.round(byMaterialTierKey);
    const unitPrice = Number(tier.unitPrice || 0);
    if (Number.isFinite(unitPrice) && unitPrice > 0) return Math.round(unitPrice);
    return 0;
  };

  const formatTierConstraintLabel = (tier, { widthKey = "maxWidthMm", heightKey = "maxHeightMm" } = {}) => {
    const rawLabel = String(tier?.label || "").trim();
    if (!rawLabel) return "-";
    if (rawLabel.includes("이하") || rawLabel.includes("이상")) return rawLabel;
    const maxWidth = Number(tier?.[widthKey] || 0);
    if (Number.isFinite(maxWidth) && maxWidth > 0) return `${rawLabel} (${maxWidth} 이하)`;
    const maxHeight = Number(tier?.[heightKey] || 0);
    if (Number.isFinite(maxHeight) && maxHeight > 0) return `${rawLabel} (${maxHeight} 이하)`;
    return rawLabel;
  };

  const getShelfDisplayWidthRangeText = () => {
    const minWidthMm = Number(MODULE_SHELF_WIDTH_LIMITS.min || 400) || 400;
    const maxWidthMm = Number(MODULE_SHELF_WIDTH_LIMITS.max || 1000) || 1000;
    return `${minWidthMm}~${maxWidthMm}mm`;
  };

  const getShelfDisplayDepthText = () => "400mm";

  const buildShelfTierPriceHtml = (material) => {
    const groups = [
      { title: "일반 선반", tiers: SYSTEM_SHELF_TIER_PRICING?.normal?.tiers || [] },
      { title: "코너 선반", tiers: SYSTEM_SHELF_TIER_PRICING?.corner?.tiers || [] },
    ];
    const groupHtml = groups
      .map((group) => {
        const tiers = Array.isArray(group.tiers) ? group.tiers : [];
        if (!tiers.length) return "";
        const rows = tiers
          .map((tier) => {
            const label = String(tier?.label || "-");
            if (Boolean(tier?.isCustomPrice)) {
              const consultLabel = String(label || "").includes("비규격")
                ? "비규격 상담안내"
                : `${label} 상담안내`;
              return `<div class="material-tier-line is-consult">${escapeHtml(consultLabel)}</div>`;
            }
            return `<div class="material-tier-line">${escapeHtml(label)} ${formatWon(
              resolveTierUnitPrice(tier, material)
            )}</div>`;
          })
          .join("");
        return `
          <div class="material-tier-heading">${escapeHtml(group.title)}</div>
          ${rows}
        `;
      })
      .filter(Boolean)
      .join("");
    return groupHtml || `<div class="material-tier-line">가격 정보 준비중</div>`;
  };

  const buildPostBarTierPriceHtml = () => {
    const groups = [
      {
        title: SYSTEM_POST_BAR_PRICING?.basic?.label || "기본 포스트바",
        tiers: Array.isArray(SYSTEM_POST_BAR_PRICING?.basic?.tiers) ? SYSTEM_POST_BAR_PRICING.basic.tiers : [],
      },
      {
        title: SYSTEM_POST_BAR_PRICING?.corner?.label || "코너 포스트바",
        tiers: Array.isArray(SYSTEM_POST_BAR_PRICING?.corner?.tiers) ? SYSTEM_POST_BAR_PRICING.corner.tiers : [],
      },
    ];
    const groupHtml = groups
      .map((group) => {
        const tiers = Array.isArray(group.tiers) ? group.tiers : [];
        if (!tiers.length) return "";
        const rows = tiers
          .map((tier) => {
            const label = formatTierConstraintLabel(tier);
            const price = formatWon(resolveTierUnitPrice(tier, {}));
            return `<div class="material-tier-line">${escapeHtml(label)} ${price}</div>`;
          })
          .join("");
        return `
          <div class="material-tier-heading">${escapeHtml(group.title)}</div>
          ${rows}
          <div class="material-tier-line is-consult">비규격 상담안내</div>
        `;
      })
      .filter(Boolean)
      .join("");
    return groupHtml;
  };

  const buildMaterialTierPriceHtml = (picker, material) => {
    if (picker.key === "shelf") {
      return buildShelfTierPriceHtml(material);
    }
    if (picker.key === "column") {
      return buildPostBarTierPriceHtml();
    }
    return `<div class="material-tier-line">가격 정보 준비중</div>`;
  };

  const updateThicknessOptions = (picker) => {
    const select = $(picker.thicknessSelectId);
    if (!select) return;
    select.innerHTML = `<option value="">두께를 선택하세요</option>`;
    const mat = picker.materials[picker.selectedMaterialId];
    if (!mat) return;
    (mat.availableThickness || []).forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = `${t}T`;
      select.appendChild(opt);
    });
  };

  const updateSelectedMaterialCard = (picker) => {
    const mat = picker.materials[picker.selectedMaterialId];
    const limits = LIMITS[picker.key];
    const metaLines = [];
    if (mat) {
      if (picker.key === "column") {
        metaLines.push(`높이 ${limits.minLength}~${limits.maxLength}mm`);
      } else {
        metaLines.push(`두께 ${(mat.availableThickness || []).map((t) => `${t}T`).join(", ")}`);
        metaLines.push(`폭 ${getShelfDisplayWidthRangeText()}`);
        metaLines.push(`깊이 ${getShelfDisplayDepthText()}`);
      }
    }
    renderSelectedCard({
      cardId: picker.selectedCardId,
      emptyTitle: picker.emptyTitle,
      emptyMeta: picker.emptyMeta,
      swatch: mat?.swatch,
      imageUrl: mat?.thumbnail,
      name: mat ? escapeHtml(mat.name) : "",
      metaLines,
    });
  };

  const renderMaterialCards = (picker) => {
    const container = $(picker.cardsId);
    if (!container) return;
    container.innerHTML = "";

    const list = Object.values(picker.materials).filter(
      (mat) => (mat.category || "기타") === picker.selectedCategory
    );

    list.forEach((mat) => {
      const label = document.createElement("label");
      const visualModifierClass = String(picker.visualModifierClass || "").trim();
      const visualClassName = visualModifierClass
        ? `material-visual ${visualModifierClass}`
        : "material-visual";
      label.className = `card-base material-card${
        picker.selectedMaterialId === mat.id ? " selected" : ""
      }`;
      const visualMarkup = buildMaterialVisualMarkup({
        swatch: mat.swatch,
        imageUrl: mat.thumbnail,
        className: visualClassName,
        fallbackSwatch: SWATCH_FALLBACK,
      });
      const limits = LIMITS[picker.key];
      const heightLine = `높이 ${limits.minLength}~${limits.maxLength}mm`;
      const tierPriceHtml = buildMaterialTierPriceHtml(picker, mat);
      const sizeLines = [];
      if (picker.key === "column") {
        sizeLines.push(heightLine);
      } else {
        const thicknessValues = (mat.availableThickness || [])
          .map((t) => `${t}T`)
          .join(", ");
        if (thicknessValues) sizeLines.push(`두께 ${thicknessValues}`);
        sizeLines.push(`폭 ${getShelfDisplayWidthRangeText()}`);
        sizeLines.push(`깊이 ${getShelfDisplayDepthText()}`);
      }
      const sizeInfoHtml = sizeLines.length
        ? `
          <div class="size-heading">제작 가능 범위</div>
          ${sizeLines.map((line) => `<div class="size">${escapeHtml(line)}</div>`).join("")}
        `
        : "";
      label.innerHTML = `
        <input type="radio" name="${picker.inputName}" value="${mat.id}" ${
          picker.selectedMaterialId === mat.id ? "checked" : ""
        } />
        ${visualMarkup}
        <div class="name">${mat.name}</div>
        ${tierPriceHtml}
        ${sizeInfoHtml}
      `;
      container.appendChild(label);
    });

    container.onclick = (e) => {
      const input = e.target.closest(`input[name="${picker.inputName}"]`);
      if (!input) return;
      picker.selectedMaterialId = input.value;
      updateThicknessOptions(picker);
      updateSelectedMaterialCard(picker);
      updatePreview();
      container.querySelectorAll(".material-card").forEach((card) => card.classList.remove("selected"));
      input.closest(".material-card")?.classList.add("selected");
      input.blur();
      closeModal(picker.modalId);
      autoCalculatePrice();
    };
  };

  const renderMaterialTabs = (picker) => {
    const tabs = $(picker.tabsId);
    if (!tabs) return;
    tabs.innerHTML = "";
    picker.categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `material-tab${cat === picker.selectedCategory ? " active" : ""}`;
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        picker.selectedCategory = cat;
        const inCategory = Object.values(picker.materials).some(
          (m) => m.id === picker.selectedMaterialId && (m.category || "기타") === cat
        );
        if (!inCategory) picker.selectedMaterialId = "";
        renderMaterialTabs(picker);
        renderMaterialCards(picker);
        updateThicknessOptions(picker);
        renderCategoryDesc(picker);
        updateSelectedMaterialCard(picker);
      });
      tabs.appendChild(btn);
    });
    renderCategoryDesc(picker);
  };

  return {
    buildCategories,
    renderMaterialTabs,
    renderCategoryDesc,
    formatWon,
    resolveTierUnitPrice,
    formatTierConstraintLabel,
    getShelfDisplayWidthRangeText,
    getShelfDisplayDepthText,
    buildShelfTierPriceHtml,
    buildPostBarTierPriceHtml,
    buildMaterialTierPriceHtml,
    renderMaterialCards,
    updateSelectedMaterialCard,
    updateThicknessOptions,
  };
}
