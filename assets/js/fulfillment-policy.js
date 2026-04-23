import { resolveFulfillmentRegionByAddress } from "./shared.js?v=20260423f-html";
import { FULFILLMENT_POLICY_MESSAGES } from "./data/fulfillment-policy-data.js";
import { resolveInstallationTravelZoneByAddress } from "./installation-travel-zone.js";

export const FULFILLMENT_TYPE_LABELS = Object.freeze({
  delivery: "배송",
  installation: "시공",
});

export function normalizeFulfillmentType(value) {
  return value === "installation" ? "installation" : value === "delivery" ? "delivery" : "";
}

export function isFulfillmentAddressReady(customer = {}) {
  return Boolean(customer?.postcode && customer?.address);
}

export function createFulfillmentResult({
  type = "",
  region = { key: "", label: "", isSupported: false },
  addressReady = false,
  amount = 0,
  amountText = FULFILLMENT_POLICY_MESSAGES.noSelectionAmountText,
  isConsult = false,
  reason = "",
  installationBaseAmount = 0,
  travelFee = 0,
  travelZone = { id: "", label: "" },
} = {}) {
  const normalizedType = normalizeFulfillmentType(type);
  const normalizedAmount = Number(amount || 0);
  const normalizedBaseAmount = Number(installationBaseAmount || 0);
  const normalizedTravelFee = Number(travelFee || 0);
  const normalizedTravelZone =
    travelZone && typeof travelZone === "object"
      ? {
          id: String(travelZone.id || ""),
          label: String(travelZone.label || ""),
        }
      : { id: "", label: "" };
  return {
    type: normalizedType,
    typeLabel: FULFILLMENT_TYPE_LABELS[normalizedType] || "",
    region,
    amount: normalizedAmount,
    amountText: String(amountText || ""),
    isConsult: Boolean(isConsult),
    reason: String(reason || ""),
    addressReady: Boolean(addressReady),
    installationBaseAmount: normalizedBaseAmount,
    travelFee: normalizedTravelFee,
    travelZone: normalizedTravelZone,
  };
}

export function evaluateFulfillmentPolicy({
  nextType = "",
  customer = {},
  hasProducts = false,
  evaluateSupportedPolicy,
} = {}) {
  const type = normalizeFulfillmentType(nextType);
  const region = resolveFulfillmentRegionByAddress(customer?.address);
  const addressReady = isFulfillmentAddressReady(customer);

  if (!type || !hasProducts) {
    return createFulfillmentResult({
      type,
      region,
      amount: 0,
      amountText: FULFILLMENT_POLICY_MESSAGES.noSelectionAmountText,
      isConsult: false,
      reason: "",
      addressReady,
    });
  }
  if (!addressReady) {
    return createFulfillmentResult({
      type,
      region,
      amount: 0,
      amountText: FULFILLMENT_POLICY_MESSAGES.addressRequiredAmountText,
      isConsult: false,
      reason: FULFILLMENT_POLICY_MESSAGES.needsAddressReason,
      addressReady,
    });
  }
  if (!region.isSupported) {
    return createFulfillmentResult({
      type,
      region,
      amount: 0,
      amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
      isConsult: true,
      reason: FULFILLMENT_POLICY_MESSAGES.unsupportedRegionReason,
      addressReady,
    });
  }

  const supportedResult =
    typeof evaluateSupportedPolicy === "function"
      ? evaluateSupportedPolicy({ type, region, addressReady })
      : null;

  if (!supportedResult || typeof supportedResult !== "object") {
    return createFulfillmentResult({
      type,
      region,
      amount: 0,
      amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
      isConsult: true,
      reason: FULFILLMENT_POLICY_MESSAGES.fallbackReason,
      addressReady,
    });
  }

  const baseAmount = Number(supportedResult.amount || 0);
  const isConsult = Boolean(supportedResult.isConsult);
  let amount = baseAmount;
  let amountText = supportedResult.amountText;
  let reason = supportedResult.reason;
  let travelFee = 0;
  let travelZone = { id: "", label: "" };

  if (type === "installation" && !isConsult) {
    const travel = resolveInstallationTravelZoneByAddress(customer);
    if (!travel.isMatched) {
      return createFulfillmentResult({
        type,
        region,
        addressReady,
        amount: 0,
        amountText: FULFILLMENT_POLICY_MESSAGES.consultAmountText,
        isConsult: true,
        reason: travel.reason || FULFILLMENT_POLICY_MESSAGES.fallbackReason,
        installationBaseAmount: baseAmount,
      });
    }
    travelFee = Number(travel.travelFee || 0);
    travelZone = {
      id: String(travel.zoneId || ""),
      label: String(travel.zoneLabel || ""),
    };
    amount = baseAmount + travelFee;
    amountText = `${Number(amount || 0).toLocaleString()}원`;
  }

  return createFulfillmentResult({
    type,
    region,
    addressReady,
    amount,
    amountText,
    isConsult,
    reason,
    installationBaseAmount: type === "installation" ? baseAmount : 0,
    travelFee,
    travelZone,
  });
}

export function formatFulfillmentCostText(fulfillment) {
  if (!fulfillment?.type) return "미선택";
  if (fulfillment.isConsult) return "상담 안내";
  return `${Number(fulfillment.amount || 0).toLocaleString()}원`;
}

export function formatFulfillmentLine(fulfillment) {
  if (!fulfillment?.type) return "서비스 미선택";
  const regionText = fulfillment?.region?.label ? ` / ${fulfillment.region.label}` : "";
  const zoneText =
    fulfillment?.type === "installation" && fulfillment?.travelZone?.label
      ? ` / ${fulfillment.travelZone.label}`
      : "";
  const typeText = fulfillment.typeLabel || "서비스";
  if (fulfillment.isConsult) return `${typeText}${regionText}${zoneText} · 상담 안내`;
  const amountText = `${Number(fulfillment.amount || 0).toLocaleString()}원`;
  if (fulfillment?.type === "installation") {
    const travelText =
      Number(fulfillment.travelFee || 0) > 0
        ? ` (출장비 ${Number(fulfillment.travelFee || 0).toLocaleString()}원 포함)`
        : " (출장비 무료)";
    return `${typeText}${regionText}${zoneText} · ${amountText}${travelText}`;
  }
  return `${typeText}${regionText}${zoneText} · ${amountText}`;
}

export function formatFulfillmentCardPriceText(fulfillment) {
  if (!fulfillment?.type) return "선택 필요";
  if (fulfillment.amountText === "미선택") return "상품 담기 후 계산";
  if (!fulfillment.addressReady) return "주소 입력 후 계산";
  if (fulfillment.isConsult) return "상담 안내";
  if (fulfillment.type === "installation") {
    const baseAmount = Number(
      fulfillment.installationBaseAmount || Number(fulfillment.amount || 0) - Number(fulfillment.travelFee || 0)
    );
    const travelFee = Number(fulfillment.travelFee || 0);
    const baseText = `${Math.max(0, baseAmount).toLocaleString()}원`;
    const travelText = travelFee > 0 ? `${travelFee.toLocaleString()}원` : "무료";
    return `${baseText} + 출장비 ${travelText}`;
  }
  return `${Number(fulfillment.amount || 0).toLocaleString()}원`;
}
