export function createSystemQuoteFlowHelpers(deps = {}) {
  const {
    $,
    getCustomerInfo,
    buildGrandSummary,
    getStateItems = () => [],
    systemOrderHelpers,
    escapeHtml,
    formatFulfillmentLine,
    validateCustomerInfo,
    getEmailJSInstance,
    updateSendButtonEnabled,
    setSendingEmail,
    previewUploadHelpers,
    getRuntimeHostBlockedReason,
    getCustomerPhotoUploader,
    uploadCustomerPhotoFilesToCloudinary,
    buildBuilderEdgeRows,
    buildSendQuoteTemplateParams,
    EMAILJS_CONFIG,
    showOrderComplete,
    showInfoModal,
  } = deps;

  const renderOrderCompleteDetails = () => {
    const container = $("#orderCompleteDetails");
    if (!container) return;

    const customer = getCustomerInfo();
    const summary = buildGrandSummary();
    const displayItems = systemOrderHelpers.buildSystemGroupDisplayItems(getStateItems());
    const suffix = summary.hasConsult ? "(상담 필요 품목 미포함)" : "";

    const itemsHtml =
      displayItems.length === 0
        ? '<p class="item-line">담긴 항목이 없습니다.</p>'
        : displayItems
            .map((item, idx) => {
              const amountText = item.isCustomPrice ? "상담 안내" : `${item.total.toLocaleString()}원`;
              const detailInline = systemOrderHelpers.buildSystemGroupDetailLines(item).join(" · ");
              return `<p class="item-line">${idx + 1}. 시스템 구성 x${item.quantity}${
                detailInline ? ` · ${escapeHtml(detailInline)}` : ""
              } · 금액 ${amountText}</p>`;
            })
            .join("");

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
        <h4>주문 품목</h4>
        ${itemsHtml}
      </div>
      <div class="complete-section">
        <h4>합계</h4>
        <p>서비스: ${escapeHtml(formatFulfillmentLine(summary.fulfillment))}</p>
        <p>예상 결제금액: ${summary.grandTotal.toLocaleString()}원${suffix}</p>
        <p>자재비: ${summary.materialsTotal.toLocaleString()}원</p>
        <p>예상무게: ${summary.totalWeight.toFixed(2)}kg</p>
      </div>
    `;
  };

  const sendQuote = async () => {
    if (getStateItems().length === 0) {
      showInfoModal("담긴 항목이 없습니다. 주문을 담아주세요.");
      return;
    }
    const customer = getCustomerInfo();
    const customerError = validateCustomerInfo(customer);
    if (customerError) {
      showInfoModal(customerError);
      return;
    }
    const emailjsInstance = getEmailJSInstance(showInfoModal);
    if (!emailjsInstance) return;

    setSendingEmail(true);
    updateSendButtonEnabled();

    let previewImageUrl = "";
    let previewImagePublicId = "";
    let previewImageError = "";
    try {
      const uploadResult = await previewUploadHelpers.uploadSystemPreviewToCloudinary();
      previewImageUrl = String(uploadResult?.secureUrl || "").trim();
      previewImagePublicId = String(uploadResult?.publicId || "").trim();
      if (!previewImageUrl) {
        const skippedReason = String(uploadResult?.skipped || "").trim();
        if (skippedReason === "capture_empty") {
          previewImageError = "미리보기 캡처 결과가 비어 있습니다.";
        } else if (skippedReason === "host_blocked") {
          previewImageError = String(uploadResult?.reason || getRuntimeHostBlockedReason() || "").trim();
        } else if (skippedReason === "not_configured") {
          previewImageError = "Cloudinary 설정이 비어 있습니다.";
        }
      }
    } catch (uploadError) {
      console.warn("[system] preview upload skipped:", uploadError);
      previewImageError = String(uploadError?.message || uploadError || "").trim();
    }

    const selectedCustomerPhotos = getCustomerPhotoUploader()?.getSelectedFiles?.() || [];
    const customerPhotoUploadResult = await uploadCustomerPhotoFilesToCloudinary({
      files: selectedCustomerPhotos,
      pageKey: "system",
    });
    const customerPhotoUploads = Array.isArray(customerPhotoUploadResult?.uploaded)
      ? customerPhotoUploadResult.uploaded
      : [];
    const customerPhotoErrors = Array.isArray(customerPhotoUploadResult?.failed)
      ? customerPhotoUploadResult.failed
      : [];

    const summary = buildGrandSummary();
    const displayItems = systemOrderHelpers.buildSystemGroupDisplayItems(getStateItems());
    const builderRows = buildBuilderEdgeRows();
    const { subject, body, lines } = systemOrderHelpers.buildEmailContent({
      customer,
      summary,
      displayItems,
      builderRows,
      previewImageUrl,
      previewImageError,
      customerPhotoUploads,
      customerPhotoErrors,
    });
    const orderTimeText = new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Seoul",
    }).format(new Date());
    const payload = systemOrderHelpers.buildOrderPayload({
      customer,
      summary,
      displayItems,
      builderRows,
      previewImageUrl,
      previewImagePublicId,
      previewImageError,
      customerPhotoUploads,
    });
    const templateParams = buildSendQuoteTemplateParams({
      customer,
      orderTimeText,
      subject,
      message: body,
      orderLines: lines,
      payload,
      customerPhotoUploads,
      customerPhotoErrors,
      previewImageUrl,
      previewImagePublicId,
      previewImageError,
    });

    try {
      await emailjsInstance.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );
      showOrderComplete();
    } catch (err) {
      console.error(err);
      const detail = err?.text || err?.message || "";
      showInfoModal(
        detail
          ? `주문 전송 중 오류가 발생했습니다.\n${detail}`
          : "주문 전송 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setSendingEmail(false);
      updateSendButtonEnabled();
    }
  };

  return {
    renderOrderCompleteDetails,
    sendQuote,
  };
}
