const DEFAULT_ALLOWED_METHODS = "POST, OPTIONS";

function json(body, status = 200, origin = "*") {
  const responseBody = status === 204 ? null : JSON.stringify(body);
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": DEFAULT_ALLOWED_METHODS,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (status !== 204) {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }

  return new Response(responseBody, {
    status,
    headers,
  });
}

function normalizeList(value = "") {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRequestOrigin(request) {
  return String(request.headers.get("Origin") || "").trim();
}

function isAllowedOrigin(origin = "", allowedOrigins = []) {
  if (!origin) return false;
  if (!allowedOrigins.length) return true;
  return allowedOrigins.includes(origin);
}

function normalizeText(value = "") {
  return String(value || "").trim();
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripDuplicateCustomerSection(orderLines = "") {
  const text = normalizeText(orderLines);
  if (!text) return "";

  const sectionStarts = [
    "=== 공간/가구 사진 ===",
    "=== 주문 내역 ===",
    "=== 합계 ===",
  ]
    .map((marker) => text.indexOf(marker))
    .filter((index) => index >= 0);

  if (!sectionStarts.length) return text;
  return text.slice(Math.min(...sectionStarts)).trim();
}

function splitOrderSections(orderDetails = "") {
  const text = normalizeText(orderDetails);
  if (!text) return [];
  const sections = [];
  let current = null;

  text.split(/\r?\n/).forEach((line) => {
    const marker = line.match(/^===\s*(.+?)\s*===$/);
    if (marker) {
      if (current) sections.push(current);
      current = { title: normalizeText(marker[1]) || "주문 상세", lines: [] };
      return;
    }
    if (!current) current = { title: "주문 상세", lines: [] };
    current.lines.push(line);
  });

  if (current) sections.push(current);

  return sections
    .map((section) => ({
      title: section.title,
      body: normalizeText(section.lines.join("\n")),
    }))
    .filter((section) => section.body);
}

function renderLineBreaks(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function renderSection(title = "", body = "") {
  return `
    <section style="margin: 18px 0; padding: 18px 20px; border: 1px solid #e5e7eb; border-radius: 10px; background: #ffffff;">
      <h2 style="margin: 0 0 12px; font-size: 16px; line-height: 1.4; color: #111827;">${escapeHtml(title)}</h2>
      <div style="font-size: 14px; line-height: 1.75; color: #1f2937;">${renderLineBreaks(body || "-")}</div>
    </section>`;
}

function buildCustomerSummaryText(templateParams = {}) {
  const rows = [
    ["이름", normalizeText(templateParams.customer_name) || "-"],
    ["연락처", normalizeText(templateParams.customer_phone) || "-"],
  ];

  if (normalizeText(templateParams.customer_email)) {
    rows.push(["이메일", normalizeText(templateParams.customer_email)]);
  }
  if (normalizeText(templateParams.customer_ggr_id)) {
    rows.push(["GGR 아이디", normalizeText(templateParams.customer_ggr_id)]);
  }
  if (normalizeText(templateParams.customer_phone_last4)) {
    rows.push(["휴대폰 뒤 4자리", normalizeText(templateParams.customer_phone_last4)]);
  }

  rows.push(["우편번호", normalizeText(templateParams.customer_postcode) || "-"]);
  rows.push(["주소", normalizeText(templateParams.customer_address) || "-"]);
  rows.push(["요청사항", normalizeText(templateParams.customer_memo) || "-"]);

  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function buildMailDetails(templateParams = {}) {
  const orderDetails =
    stripDuplicateCustomerSection(templateParams.order_lines) ||
    stripDuplicateCustomerSection(templateParams.message) ||
    "-";

  return {
    subject: normalizeText(templateParams.subject) || "주문 접수",
    time: normalizeText(templateParams.time) || "-",
    customerSummary: buildCustomerSummaryText(templateParams),
    orderDetails,
    orderSections: splitOrderSections(orderDetails),
  };
}

function buildMailText(templateParams = {}) {
  const details = buildMailDetails(templateParams);
  const lines = [];
  lines.push(`[${details.subject}]`);
  lines.push(`접수시각: ${details.time}`);
  lines.push("");
  lines.push("[고객 정보]");
  lines.push(details.customerSummary);
  lines.push("");
  lines.push("[주문 상세]");
  lines.push(details.orderDetails);
  return lines.join("\n");
}

function buildMailHtml(templateParams = {}) {
  const details = buildMailDetails(templateParams);
  const sectionsHtml = details.orderSections
    .map((section) => renderSection(section.title, section.body))
    .join("");

  return `<!doctype html>
<html lang="ko">
  <body style="margin: 0; padding: 0; background: #f6f7f9; font-family: Arial, sans-serif; color: #111827;">
    <div style="max-width: 760px; margin: 0 auto; padding: 28px 18px;">
      <div style="margin-bottom: 18px;">
        <div style="font-size: 13px; line-height: 1.5; color: #6b7280;">GGR Order Center</div>
        <h1 style="margin: 4px 0 8px; font-size: 24px; line-height: 1.35; color: #111827;">${escapeHtml(details.subject)}</h1>
        <div style="font-size: 14px; color: #4b5563;">접수시각: ${escapeHtml(details.time)}</div>
      </div>
      ${renderSection("고객 정보", details.customerSummary)}
      ${sectionsHtml || renderSection("주문 상세", details.orderDetails)}
    </div>
  </body>
</html>`;
}

async function sendEmailWithResend(env, { subject, text, html }) {
  const apiKey = normalizeText(env.RESEND_API_KEY);
  const from = normalizeText(env.MAIL_FROM);
  const to = normalizeList(env.MAIL_TO);
  if (!apiKey) throw new Error("RESEND_API_KEY가 설정되지 않았습니다.");
  if (!from) throw new Error("MAIL_FROM이 설정되지 않았습니다.");
  if (!to.length) throw new Error("MAIL_TO가 설정되지 않았습니다.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(normalizeText(result?.message || result?.error || `메일 발송 실패 (${response.status})`));
  }
  return result;
}

export default {
  async fetch(request, env) {
    const origin = getRequestOrigin(request);
    const allowedOrigins = normalizeList(env.ALLOWED_ORIGINS);

    if (request.method === "OPTIONS") {
      return json({ ok: true }, 204, isAllowedOrigin(origin, allowedOrigins) ? origin : "*");
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, isAllowedOrigin(origin, allowedOrigins) ? origin : "*");
    }

    if (!isAllowedOrigin(origin, allowedOrigins)) {
      return json({ error: "Forbidden origin" }, 403, "*");
    }

    let body = {};
    try {
      body = await request.json();
    } catch (_error) {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    const templateParams = body?.templateParams && typeof body.templateParams === "object" ? body.templateParams : null;
    if (!templateParams) {
      return json({ error: "templateParams가 필요합니다." }, 400, origin);
    }

    const subject = normalizeText(templateParams.subject) || "주문 접수";
    const text = buildMailText(templateParams);
    const html = buildMailHtml(templateParams);

    try {
      const result = await sendEmailWithResend(env, { subject, text, html });
      return json({ ok: true, provider: "resend", id: result?.id || "" }, 200, origin);
    } catch (error) {
      return json({ error: normalizeText(error?.message || error || "메일 발송 실패") }, 502, origin);
    }
  },
};
