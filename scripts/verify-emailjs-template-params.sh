#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PAGE_FILES=(
  "assets/js/top.js"
  "assets/js/board.js"
  "assets/js/door.js"
  "assets/js/system.js"
)

COMMON_TEMPLATE_KEYS=(
  "customer_photo_count"
  "customer_photo_urls"
  "customer_photo_upload_error"
  "preview_image_url"
  "preview_image_public_id"
  "preview_image_error"
  "order_lines"
  "order_payload_json"
)

REQUIRED_LOGIC_TOKENS=(
  "initCustomerPhotoUploader"
  "uploadCustomerPhotoFilesToCloudinary"
  "customerPhotos"
)

fail_count=0

echo "== EmailJS template params verify =="

for rel_file in "${PAGE_FILES[@]}"; do
  abs_file="${ROOT_DIR}/${rel_file}"
  if [[ ! -f "${abs_file}" ]]; then
    echo "[FAIL] missing file: ${rel_file}"
    fail_count=$((fail_count + 1))
    continue
  fi

  for key in "${COMMON_TEMPLATE_KEYS[@]}"; do
    if ! rg -q "${key}\\s*:" "${abs_file}"; then
      echo "[FAIL] ${rel_file}: missing template param key '${key}'"
      fail_count=$((fail_count + 1))
    fi
  done

  for token in "${REQUIRED_LOGIC_TOKENS[@]}"; do
    if ! rg -q "${token}" "${abs_file}"; then
      echo "[FAIL] ${rel_file}: missing logic token '${token}'"
      fail_count=$((fail_count + 1))
    fi
  done
done

if [[ "${fail_count}" -gt 0 ]]; then
  echo "Result: FAILED (${fail_count} issues)"
  exit 1
fi

echo "Result: OK"
