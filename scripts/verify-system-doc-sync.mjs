import assert from "node:assert/strict";
import fs from "node:fs";

import {
  SYSTEM_POST_BAR_PRICING,
  SYSTEM_SHELF_MATERIALS,
} from "../assets/js/data/system-data.js";

const DOC_PATH = new URL("../docs/price-policy-v1.md", import.meta.url);

function formatWon(value = 0) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function getShelfPrice(materialId, tierKey) {
  return Number(SYSTEM_SHELF_MATERIALS?.[materialId]?.priceByTierKey?.[tierKey] || 0);
}

const expectedLines = [
  "| `priceByTierKey` | 티어 키별 가격 맵 | `{ \"lte_400\": 9000, \"lte_600\": 11000 }` |",
  "| 400mm 이하 | " + formatWon(getShelfPrice("lpm_basic", "lte_400")) + " | " + formatWon(getShelfPrice("pp_twill", "lte_400")) + " |",
  "| 600mm 이하 | " + formatWon(getShelfPrice("lpm_basic", "lte_600")) + " | " + formatWon(getShelfPrice("pp_twill", "lte_600")) + " |",
  "| 800mm 이하 | " + formatWon(getShelfPrice("lpm_basic", "lte_800")) + " | " + formatWon(getShelfPrice("pp_twill", "lte_800")) + " |",
  "| 코너 표준 | " + formatWon(getShelfPrice("lpm_basic", "corner_standard")) + " | " + formatWon(getShelfPrice("pp_twill", "corner_standard")) + " |",
  "| 기본 포스트바 | " +
    formatWon(SYSTEM_POST_BAR_PRICING.basic?.tiers?.[0]?.unitPrice) + " | " +
    formatWon(SYSTEM_POST_BAR_PRICING.basic?.tiers?.[1]?.unitPrice) + " | " +
    formatWon(SYSTEM_POST_BAR_PRICING.basic?.tiers?.[2]?.unitPrice) + " |",
  "| 코너 포스트바 | " +
    formatWon(SYSTEM_POST_BAR_PRICING.corner?.tiers?.[0]?.unitPrice) + " | " +
    formatWon(SYSTEM_POST_BAR_PRICING.corner?.tiers?.[1]?.unitPrice) + " | " +
    formatWon(SYSTEM_POST_BAR_PRICING.corner?.tiers?.[2]?.unitPrice) + " |",
];

const docText = fs.readFileSync(DOC_PATH, "utf8");
expectedLines.forEach((line) => {
  assert.equal(
    docText.includes(line),
    true,
    `Expected docs/price-policy-v1.md to include: ${line}`
  );
});

console.log("system price policy doc sync passed");
