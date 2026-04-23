const PRIVACY_CONSENT_TEMPLATE = `
<div class="consent-policy">
  <p><strong>개인정보 수집 및 이용 동의</strong></p>
  <p><strong>1. 수집 및 이용 목적</strong><br />
  회사는 주문 제작 견적 상담, 실측 요청 접수, 배송·시공 가능 여부 확인, 상담 이력 관리 및 고객 문의 응대를 위해 개인정보를 수집·이용합니다.</p>
  <p><strong>2. 수집 항목</strong><br />
  필수항목: 이름, 연락처, 우편번호, 주소<br />
  선택항목: 요청사항, 공간/가구 사진, 주문·견적 구성 정보</p>
  <p><strong>3. 보유 및 이용 기간</strong><br />
  수집한 개인정보는 견적 상담 및 요청 처리 완료 후 3년간 보관한 뒤 지체 없이 파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우에는 해당 법령에서 정한 기간 동안 보관할 수 있습니다.</p>
  <p><strong>4. 개인정보 처리 위탁</strong><br />
  회사는 서비스 운영을 위해 아래 업무를 외부 서비스에 위탁할 수 있습니다.<br />
  - Cloudflare: 주문 요청 중계 및 보안 처리<br />
  - Resend: 주문·견적 요청 메일 발송<br />
  - Cloudinary: 고객이 업로드한 공간/가구 사진 저장<br />
  - 아임웹: 웹사이트 호스팅 및 운영 환경 제공</p>
  <p><strong>5. 동의 거부 권리 및 불이익</strong><br />
  이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 수 있습니다. 다만 필수항목 수집에 동의하지 않을 경우 견적 상담, 실측 요청, 배송·시공 가능 여부 확인이 제한될 수 있습니다.</p>
  <p><strong>6. 개인정보 보호 문의</strong><br />
  개인정보 처리와 관련한 문의는 고객 상담 채널 또는 이메일(info@ggr.kr)을 통해 접수할 수 있습니다.</p>
</div>
<label class="consent-check" for="privacyConsent">
  <input type="checkbox" id="privacyConsent" />
  개인정보 수집 및 이용에 동의합니다.
</label>
`;

export function mountPrivacyConsentTemplates(root = document) {
  const mounts = root.querySelectorAll("[data-privacy-consent]");
  mounts.forEach((mountEl) => {
    if (!mountEl || mountEl.dataset.privacyConsentMounted === "true") return;
    mountEl.innerHTML = PRIVACY_CONSENT_TEMPLATE;
    mountEl.dataset.privacyConsentMounted = "true";
  });
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      mountPrivacyConsentTemplates(document);
    },
    { once: true }
  );
} else {
  mountPrivacyConsentTemplates(document);
}
