import { resolveServiceRegionByAddress } from "./shared.js";
import { FULFILLMENT_POLICY_MESSAGES } from "./data/fulfillment-policy-data.js";

export const FULFILLMENT_TYPE_LABELS = Object.freeze({
  delivery: "배송",
  installation: "시공",
});

export function normalizeFulfillmentType(value) {
  return value === "installation" ? "installation" : value === "delivery" ? "delivery" : "";
}

export function isServiceAddressReady(customer = {}) {
  return Boolean(customer?.postcode && customer?.address && customer?.detailAddress);
}

export function createFulfillmentResult({
  type = "",
  region = { key: "", label: "", isSupported: false },
  addressReady = false,
  amount = 0,
  amountText = FULFILLMENT_POLICY_MESSAGES.noSelectionAmountText,
  isConsult = false,
  reason = "",
} = {}) {
  const normalizedType = normalizeFulfillmentType(type);
  const normalizedAmount = Number(amount || 0);
  return {
    type: normalizedType,
    typeLabel: FULFILLMENT_TYPE_LABELS[normalizedType] || "",
    region,
    amount: normalizedAmount,
    amountText: String(amountText || ""),
    isConsult: Boolean(isConsult),
    reason: String(reason || ""),
    addressReady: Boolean(addressReady),
  };
}

export function evaluateFulfillmentPolicy({
  nextType = "",
  customer = {},
  hasProducts = false,
  evaluateSupportedPolicy,
} = {}) {
  const type = normalizeFulfillmentType(nextType);
  const region = resolveServiceRegionByAddress(customer?.address);
  const addressReady = isServiceAddressReady(customer);

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

  return createFulfillmentResult({
    type,
    region,
    addressReady,
    amount: supportedResult.amount,
    amountText: supportedResult.amountText,
    isConsult: supportedResult.isConsult,
    reason: supportedResult.reason,
  });
}

export function formatServiceCostText(fulfillment) {
  if (!fulfillment?.type) return "미선택";
  if (fulfillment.isConsult) return "상담 안내";
  return `${Number(fulfillment.amount || 0).toLocaleString()}원`;
}

export function formatFulfillmentLine(fulfillment) {
  if (!fulfillment?.type) return "서비스 미선택";
  const regionText = fulfillment?.region?.label ? ` / ${fulfillment.region.label}` : "";
  const typeText = fulfillment.typeLabel || "서비스";
  if (fulfillment.isConsult) return `${typeText}${regionText} · 상담 안내`;
  return `${typeText}${regionText} · ${Number(fulfillment.amount || 0).toLocaleString()}원`;
}

export function formatFulfillmentCardPriceText(fulfillment) {
  if (!fulfillment?.type) return "선택 필요";
  if (fulfillment.amountText === "미선택") return "상품 담기 후 계산";
  if (!fulfillment.addressReady) return "주소 입력 후 계산";
  if (fulfillment.isConsult) return "상담 안내";
  return `${Number(fulfillment.amount || 0).toLocaleString()}원`;
}
