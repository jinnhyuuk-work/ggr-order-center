#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHARED_FILE="assets/js/shared.js"

PAGE_FILES=(
  "assets/js/top.js"
  "assets/js/board.js"
  "assets/js/plywood.js"
  "assets/js/door.js"
  "assets/js/measurement.js"
)

SYSTEM_FLOW_FILE="assets/js/system-quote-flow.js"
SYSTEM_ENTRY_FILE="assets/js/system.js"

SYSTEM_ENTRY_REQUIRED_TOKENS=(
  "createSystemQuoteFlowHelpers({"
  "initCustomerPhotoUploader"
  "submitOrderNotification,"
  "uploadCustomerPhotoFilesToCloudinary,"
)

COMMON_TEMPLATE_KEYS=(
  "customer_name"
  "customer_phone"
  "customer_email"
  "customer_ggr_id"
  "customer_phone_last4"
  "customer_postcode"
  "customer_photo_count"
  "customer_photo_urls"
  "customer_photo_upload_error"
  "preview_image_url"
  "preview_image_public_id"
  "preview_image_error"
  "order_lines"
  "order_payload_json"
)

PAGE_REQUIRED_TOKENS=(
  "submitOrderNotification("
  "initCustomerPhotoUploader"
  "uploadCustomerPhotoFilesToCloudinary"
)

SYSTEM_FLOW_REQUIRED_TOKENS=(
  "submitOrderNotification("
  "uploadCustomerPhotoFilesToCloudinary"
)

SHARED_REQUIRED_TOKENS=(
  "export function buildSendQuoteTemplateParams"
  "customerPhotos:"
)

fail_count=0

echo "== EmailJS template params verify =="

shared_abs="${ROOT_DIR}/${SHARED_FILE}"
if [[ ! -f "${shared_abs}" ]]; then
  echo "[FAIL] missing file: ${SHARED_FILE}"
  exit 1
fi

for key in "${COMMON_TEMPLATE_KEYS[@]}"; do
  if ! rg -q "${key}\\s*:" "${shared_abs}"; then
    echo "[FAIL] ${SHARED_FILE}: missing template param key '${key}'"
    fail_count=$((fail_count + 1))
  fi
done

for token in "${SHARED_REQUIRED_TOKENS[@]}"; do
  if ! rg -qF "${token}" "${shared_abs}"; then
    echo "[FAIL] ${SHARED_FILE}: missing token '${token}'"
    fail_count=$((fail_count + 1))
  fi
done

for rel_file in "${PAGE_FILES[@]}"; do
  abs_file="${ROOT_DIR}/${rel_file}"
  if [[ ! -f "${abs_file}" ]]; then
    echo "[FAIL] missing file: ${rel_file}"
    fail_count=$((fail_count + 1))
    continue
  fi

  for token in "${PAGE_REQUIRED_TOKENS[@]}"; do
    if ! rg -qF "${token}" "${abs_file}"; then
      echo "[FAIL] ${rel_file}: missing logic token '${token}'"
      fail_count=$((fail_count + 1))
    fi
  done
done

system_flow_abs="${ROOT_DIR}/${SYSTEM_FLOW_FILE}"
if [[ ! -f "${system_flow_abs}" ]]; then
  echo "[FAIL] missing file: ${SYSTEM_FLOW_FILE}"
  fail_count=$((fail_count + 1))
else
  for token in "${SYSTEM_FLOW_REQUIRED_TOKENS[@]}"; do
    if ! rg -qF "${token}" "${system_flow_abs}"; then
      echo "[FAIL] ${SYSTEM_FLOW_FILE}: missing logic token '${token}'"
      fail_count=$((fail_count + 1))
    fi
  done
fi

system_entry_abs="${ROOT_DIR}/${SYSTEM_ENTRY_FILE}"
if [[ ! -f "${system_entry_abs}" ]]; then
  echo "[FAIL] missing file: ${SYSTEM_ENTRY_FILE}"
  fail_count=$((fail_count + 1))
else
  for token in "${SYSTEM_ENTRY_REQUIRED_TOKENS[@]}"; do
    if ! rg -qF "${token}" "${system_entry_abs}"; then
      echo "[FAIL] ${SYSTEM_ENTRY_FILE}: missing integration token '${token}'"
      fail_count=$((fail_count + 1))
    fi
  done
fi

if [[ "${fail_count}" -gt 0 ]]; then
  echo "Result: FAILED (${fail_count} issues)"
  exit 1
fi

echo "Result: OK"
