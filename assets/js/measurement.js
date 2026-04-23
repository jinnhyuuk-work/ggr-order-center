import {
  EMAILJS_CONFIG,
  initEmailJS,
  showInfoModal,
  bindModalCloseTriggers,
  getCustomerInfo,
  validateCustomerInfo,
  updateSendButtonEnabled as updateSendButtonEnabledShared,
  isConsentChecked,
  getEmailJSInstance,
  initCollapsibleSections,
  initCustomerPhotoUploader,
  uploadCustomerPhotoFilesToCloudinary,
  buildCustomerEmailSectionLines,
  buildSendQuoteTemplateParams,
  renderEstimateTable,
} from "./shared.js?v=20260423f-html";
import { resolveInstallationTravelZoneByAddress } from "./installation-travel-zone.js";

const MEASUREMENT_BASE_AMOUNT = 50000;
const MEASUREMENT_SERVICES = Object.freeze([
  Object.freeze({ id: "door", label: "도어 실측" }),
  Object.freeze({ id: "top", label: "상판 실측" }),
  Object.freeze({ id: "system", label: "시스템 실측" }),
]);
const SERVICE_BY_ID = MEASUREMENT_SERVICES.reduce((acc, service) => {
  acc[service.id] = service;
  return acc;
}, {});

let currentPhase = 1;
let selectedServiceIds = [];
let customerPhotoUploader = null;
let sendingEmail = false;
let orderCompleted = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function getSelectedServices() {
  return selectedServiceIds.map((id) => SERVICE_BY_ID[id]).filter(Boolean);
}

function getSelectedServiceLabels() {
  return getSelectedServices().map((service) => service.label);
}

function isAddressReady(customer = getCustomerInfo()) {
  return Boolean(customer?.postcode && customer?.address);
}

function evaluateMeasurementSummary() {
  const customer = getCustomerInfo();
  const selectedCount = selectedServiceIds.length;
  const baseTotal = selectedCount * MEASUREMENT_BASE_AMOUNT;
  const addressReady = isAddressReady(customer);
  const travelZone = addressReady ? resolveInstallationTravelZoneByAddress(customer) : null;
  const isConsult = Boolean(addressReady && !travelZone?.isMatched);
  const travelFee = travelZone?.isMatched ? Number(travelZone.travelFee || 0) : 0;
  const grandTotal = isConsult ? baseTotal : baseTotal + travelFee;
  return {
    selectedServices: getSelectedServices(),
    selectedServiceLabels: getSelectedServiceLabels(),
    selectedCount,
    baseTotal,
    addressReady,
    travelZone,
    travelFee,
    isConsult,
    grandTotal,
    hasConsult: isConsult,
  };
}

function formatMeasurementLine(summary = evaluateMeasurementSummary()) {
  const serviceText = summary.selectedServiceLabels.length ? summary.selectedServiceLabels.join(", ") : "서비스 미선택";
  if (!summary.addressReady) return `${serviceText} · 주소 입력 후 계산`;
  if (summary.isConsult) return `${serviceText} · 출장 권역 상담 안내`;
  const zoneText = summary.travelZone?.zoneLabel ? ` / ${summary.travelZone.zoneLabel}` : "";
  return `${serviceText}${zoneText} · ${formatWon(summary.grandTotal)} (기본 ${formatWon(summary.baseTotal)} + 출장비 ${formatWon(summary.travelFee)})`;
}

function setMeasurementStepError(message = "") {
  const errorEl = $("#measurementStepError");
  if (!errorEl) return;
  const text = String(message || "").trim();
  errorEl.textContent = text;
  errorEl.classList.toggle("error", Boolean(text));
}

function syncServiceCards() {
  $$("[data-measurement-service]").forEach((card) => {
    const active = selectedServiceIds.includes(card.dataset.measurementService);
    card.classList.toggle("selected", active);
    card.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function updateMeasurementStepUI() {
  const summary = evaluateMeasurementSummary();
  const regionHintEl = $("#measurementRegionHint");
  const priceHintEl = $("#measurementPriceHint");
  if (regionHintEl) {
    if (!summary.addressReady) {
      regionHintEl.textContent = "주소를 입력하면 실측 출장 권역을 안내합니다.";
    } else if (summary.travelZone?.isMatched) {
      regionHintEl.textContent = `판별 권역: ${summary.travelZone.zoneLabel}`;
    } else {
      regionHintEl.textContent = "판별 권역: 상담 안내";
    }
  }
  if (priceHintEl) {
    if (!summary.selectedCount) {
      priceHintEl.textContent = "실측서비스를 선택하면 예상 서비스비가 표시됩니다.";
    } else if (!summary.addressReady) {
      priceHintEl.textContent = `실측 기본비 ${formatWon(summary.baseTotal)} · 출장비는 주소 입력 후 계산됩니다.`;
    } else if (summary.isConsult) {
      priceHintEl.textContent = `실측 기본비 ${formatWon(summary.baseTotal)} · 출장 권역은 상담 후 안내됩니다.`;
    } else {
      priceHintEl.textContent = `실측 기본비 ${formatWon(summary.baseTotal)} + 출장비 ${formatWon(summary.travelFee)} = ${formatWon(summary.grandTotal)}`;
    }
  }
}

function buildEstimateItems() {
  return getSelectedServices().map((service) => ({
    id: service.id,
    name: service.label,
    quantity: 1,
    amount: MEASUREMENT_BASE_AMOUNT,
    service,
  }));
}

function renderEstimateRows() {
  renderEstimateTable({
    items: buildEstimateItems(),
    getName: (item) => item.name,
    getTotalText: (item) => formatWon(item.amount),
    getDetailLines: () => [],
    onQuantityChange: () => {
      renderSummary();
    },
    onDelete: (id) => {
      selectedServiceIds = selectedServiceIds.filter((selectedId) => selectedId !== id);
      setMeasurementStepError("");
      syncServiceCards();
      renderSummary();
      updateSendButtonEnabled();
    },
  });
}

function updateEstimateStickyOffset() {
  const summary = $("#stepFinal");
  if (!summary) return;
  const body = summary.querySelector(".estimate-body");
  const prevDisplay = body?.style.display;
  if (body) body.style.display = "none";
  const height = summary.getBoundingClientRect().height;
  if (body) body.style.display = prevDisplay || "";
  document.documentElement.style.setProperty("--sticky-offset", `${Math.ceil(height) + 16}px`);
}

function requestEstimateStickyOffsetUpdate() {
  if (requestEstimateStickyOffsetUpdate._raf) {
    cancelAnimationFrame(requestEstimateStickyOffsetUpdate._raf);
  }
  requestEstimateStickyOffsetUpdate._raf = requestAnimationFrame(updateEstimateStickyOffset);
}

function renderSummary() {
  const summary = evaluateMeasurementSummary();
  const baseTotalEl = $("#productTotal");
  const travelFeeEl = $("#fulfillmentCost");
  const grandTotalEl = $("#grandTotal");
  const naverUnitsEl = $("#naverUnits");
  if (baseTotalEl) baseTotalEl.textContent = Number(summary.baseTotal || 0).toLocaleString();
  if (travelFeeEl) {
    if (!summary.addressReady) {
      travelFeeEl.textContent = "주소 입력 후 계산";
    } else if (summary.isConsult) {
      travelFeeEl.textContent = "상담 안내";
    } else {
      travelFeeEl.textContent = formatWon(summary.travelFee);
    }
  }
  if (grandTotalEl) {
    grandTotalEl.textContent = Number(summary.grandTotal || 0).toLocaleString();
  }
  if (naverUnitsEl) {
    naverUnitsEl.textContent = String(Math.ceil(Number(summary.grandTotal || 0) / 1000) || 0);
  }
  renderEstimateRows();
  requestEstimateStickyOffsetUpdate();
  updateMeasurementStepUI();
}

function validateMeasurementStep() {
  const customer = getCustomerInfo();
  if (!isAddressReady(customer)) return "실측 주소를 입력해주세요.";
  if (!selectedServiceIds.length) return "실측서비스를 하나 이상 선택해주세요.";
  return "";
}

function updateStepVisibility() {
  const showCustomer = currentPhase === 2;
  $("#step1")?.classList.toggle("hidden-step", showCustomer || orderCompleted);
  $("#step2")?.classList.toggle("hidden-step", !showCustomer || orderCompleted);
  $("#orderComplete")?.classList.toggle("hidden-step", !orderCompleted);
  $("#stepFinal")?.classList.toggle("hidden-step", orderCompleted);
  setControlVisible($("#prevStepsBtn"), currentPhase !== 1 && !orderCompleted);
  setControlVisible($("#backToCenterBtn"), currentPhase === 1 && !orderCompleted);
  setControlVisible($("#nextStepsBtn"), currentPhase === 1 && !orderCompleted);
  setControlVisible($("#sendQuoteBtn"), currentPhase === 2 && !orderCompleted);
  updateSendButtonEnabled();
}

function setControlVisible(target, visible) {
  if (!target) return;
  target.classList.toggle("hidden-step", !visible);
  target.style.display = visible ? "" : "none";
}

function goToNextStep() {
  const errorMessage = validateMeasurementStep();
  if (errorMessage) {
    setMeasurementStepError(errorMessage);
    showInfoModal(errorMessage);
    return;
  }
  setMeasurementStepError("");
  currentPhase = 2;
  updateStepVisibility();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToPrevStep() {
  currentPhase = 1;
  updateStepVisibility();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateSendButtonEnabled() {
  updateSendButtonEnabledShared({
    customer: getCustomerInfo(),
    hasItems: selectedServiceIds.length > 0,
    onFinalStep: currentPhase === 2,
    hasConsent: isConsentChecked(),
    sending: sendingEmail,
  });
}

function buildEmailContent({ customerPhotoUploads = [], customerPhotoErrors = [] } = {}) {
  const customer = getCustomerInfo();
  const summary = evaluateMeasurementSummary();
  const lines = buildCustomerEmailSectionLines({
    customer,
    customerPhotoUploads,
    customerPhotoErrors,
  });
  lines.push("");
  lines.push("=== 실측 요청 내역 ===");
  lines.push(`실측서비스: ${summary.selectedServiceLabels.join(", ") || "-"}`);
  lines.push(`실측 기본비: ${formatWon(summary.baseTotal)}`);
  lines.push(`출장 권역: ${summary.travelZone?.zoneLabel || (summary.addressReady ? "상담 안내" : "주소 미입력")}`);
  lines.push(`출장비: ${summary.isConsult ? "상담 안내" : formatWon(summary.travelFee)}`);
  lines.push(`예상 결제금액: ${formatWon(summary.grandTotal)}${summary.hasConsult ? " (출장 권역 상담 필요)" : ""}`);

  return {
    subject: `[GGR 실측요청] ${customer.name || "고객명"} (${customer.phone || "연락처"})`,
    body: lines.join("\n"),
    lines,
  };
}

function buildOrderPayload({ customerPhotoUploads = [] } = {}) {
  const customer = getCustomerInfo();
  const summary = evaluateMeasurementSummary();
  return {
    schemaVersion: "v3",
    pageKey: "measurement",
    createdAt: new Date().toISOString(),
    customer,
    customerPhotos: (Array.isArray(customerPhotoUploads) ? customerPhotoUploads : []).map((photo) => ({
      name: String(photo?.originalName || "").trim(),
      url: String(photo?.secureUrl || "").trim(),
      publicId: String(photo?.publicId || "").trim(),
    })),
    measurement: {
      services: summary.selectedServices.map((service) => ({
        id: service.id,
        label: service.label,
        baseAmount: MEASUREMENT_BASE_AMOUNT,
      })),
      baseTotal: summary.baseTotal,
      travelZone: summary.travelZone?.zoneLabel || "",
      travelFee: summary.travelFee,
      travelConsult: summary.isConsult,
    },
    totals: {
      grandTotal: summary.grandTotal,
      subtotal: summary.baseTotal,
      fulfillmentType: "measurement",
      fulfillmentRegion: summary.travelZone?.zoneLabel || "",
      fulfillmentCost: summary.isConsult ? 0 : summary.travelFee,
      fulfillmentConsult: summary.isConsult,
      hasCustomPrice: summary.hasConsult,
      displayPriceLabel: summary.hasConsult ? "상담안내" : null,
    },
  };
}

function renderOrderCompleteDetails() {
  const container = $("#orderCompleteDetails");
  if (!container) return;
  const customer = getCustomerInfo();
  const summary = evaluateMeasurementSummary();
  container.innerHTML = `
    <div class="complete-section">
      <h4>고객 정보</h4>
      <p>이름: ${escapeHtml(customer.name || "-")}</p>
      <p>연락처: ${escapeHtml(customer.phone || "-")}</p>
      <p>이메일: ${escapeHtml(customer.email || "-")}</p>
      <p>주소: ${escapeHtml(customer.postcode || "-")} ${escapeHtml(customer.address || "")} ${escapeHtml(customer.detailAddress || "")}</p>
      <p>요청사항: ${escapeHtml(customer.memo || "-")}</p>
    </div>
    <div class="complete-section">
      <h4>실측 요청</h4>
      <p>실측서비스: ${escapeHtml(summary.selectedServiceLabels.join(", ") || "-")}</p>
      <p>출장 권역: ${escapeHtml(summary.travelZone?.zoneLabel || (summary.addressReady ? "상담 안내" : "-"))}</p>
      <p>예상 서비스비: ${escapeHtml(formatMeasurementLine(summary))}</p>
    </div>
  `;
}

async function sendQuote() {
  const customer = getCustomerInfo();
  const measurementError = validateMeasurementStep();
  if (measurementError) {
    showInfoModal(measurementError);
    return;
  }
  const customerError = validateCustomerInfo(customer);
  if (customerError) {
    showInfoModal(customerError);
    return;
  }
  const emailjsInstance = getEmailJSInstance(showInfoModal);
  if (!emailjsInstance) return;

  sendingEmail = true;
  updateSendButtonEnabled();

  const customerPhotoUploadResult = await uploadCustomerPhotoFilesToCloudinary({
    files: customerPhotoUploader?.getSelectedFiles?.() || [],
    pageKey: "measurement",
  });
  const customerPhotoUploads = Array.isArray(customerPhotoUploadResult?.uploaded)
    ? customerPhotoUploadResult.uploaded
    : [];
  const customerPhotoErrors = Array.isArray(customerPhotoUploadResult?.failed)
    ? customerPhotoUploadResult.failed
    : [];
  const { subject, body, lines } = buildEmailContent({
    customerPhotoUploads,
    customerPhotoErrors,
  });
  const orderTimeText = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date());
  const payload = buildOrderPayload({ customerPhotoUploads });
  const templateParams = buildSendQuoteTemplateParams({
    customer,
    orderTimeText,
    subject,
    message: body,
    orderLines: lines,
    payload,
    customerPhotoUploads,
    customerPhotoErrors,
  });

  try {
    await emailjsInstance.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );
    renderOrderCompleteDetails();
    orderCompleted = true;
    updateStepVisibility();
  } catch (err) {
    console.error(err);
    const detail = err?.text || err?.message || "";
    showInfoModal(
      detail
        ? `실측 요청 전송 중 오류가 발생했습니다.\n${detail}`
        : "실측 요청 전송 중 오류가 발생했습니다. 다시 시도해주세요."
    );
  } finally {
    sendingEmail = false;
    updateSendButtonEnabled();
  }
}

function resetFlow() {
  selectedServiceIds = [];
  currentPhase = 1;
  orderCompleted = false;
  sendingEmail = false;
  ["#customerName", "#customerPhone", "#customerEmail", "#customerMemo", "#sample6_postcode", "#sample6_address", "#sample6_detailAddress"].forEach((selector) => {
    const el = $(selector);
    if (el) el.value = "";
  });
  const addressEl = $("#sample6_address");
  if (addressEl) {
    ["matchedAddress", "sido", "sigungu", "bname", "roadname"].forEach((key) => {
      delete addressEl.dataset[key];
    });
  }
  const consentEl = $("#privacyConsent");
  if (consentEl) consentEl.checked = false;
  customerPhotoUploader?.clear?.();
  setMeasurementStepError("");
  syncServiceCards();
  renderSummary();
  updateStepVisibility();
}

function bindEvents() {
  bindModalCloseTriggers();
  initCollapsibleSections();
  $$("[data-measurement-service]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = String(card.dataset.measurementService || "");
      if (!id) return;
      selectedServiceIds = selectedServiceIds.includes(id)
        ? selectedServiceIds.filter((selectedId) => selectedId !== id)
        : [...selectedServiceIds, id];
      setMeasurementStepError("");
      syncServiceCards();
      renderSummary();
      updateSendButtonEnabled();
    });
  });
  ["#sample6_postcode", "#sample6_address", "#sample6_detailAddress"].forEach((selector) => {
    $(selector)?.addEventListener("input", () => {
      setMeasurementStepError("");
      renderSummary();
      updateSendButtonEnabled();
    });
  });
  ["#customerName", "#customerPhone", "#customerEmail"].forEach((selector) => {
    $(selector)?.addEventListener("input", updateSendButtonEnabled);
  });
  $("#nextStepsBtn")?.addEventListener("click", goToNextStep);
  $("#prevStepsBtn")?.addEventListener("click", goToPrevStep);
  $("#backToCenterBtn")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
  $("#sendQuoteBtn")?.addEventListener("click", sendQuote);
  $("#resetFlowBtn")?.addEventListener("click", resetFlow);
  $("#stepFinal .estimate-toggle")?.addEventListener("click", requestEstimateStickyOffsetUpdate);
  window.addEventListener("resize", requestEstimateStickyOffsetUpdate);
}

function initMeasurement() {
  initEmailJS();
  customerPhotoUploader = initCustomerPhotoUploader({
    showInfoModal,
    onChange: () => updateSendButtonEnabled(),
  });
  bindEvents();
  syncServiceCards();
  renderSummary();
  updateStepVisibility();
  requestEstimateStickyOffsetUpdate();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMeasurement);
} else {
  initMeasurement();
}
