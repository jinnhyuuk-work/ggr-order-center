export function createSystemQuoteFlowHelpers(deps = {}) {
  const {
    $,
    getCustomerInfo,
    buildGrandSummary,
    getStateItems = () => [],
    systemOrderHelpers,
    escapeHtml,
    formatFulfillmentLine,
    hasConsultLineItem,
    validateCustomerInfo,
    getEmailJSInstance,
    shouldUseOrderApiTransport,
    updateSendButtonEnabled,
    setSendingEmail,
    previewUploadHelpers,
    getRuntimeHostBlockedReason,
    getCustomerPhotoUploader,
    uploadCustomerPhotoFilesToCloudinary,
    buildBuilderEdgeRows,
    submitOrderNotification,
    showOrderComplete,
    showInfoModal,
  } = deps;

  const renderOrderCompleteDetails = () => {
    const container = $("#orderCompleteDetails");
    if (!container) return;

    const customer = getCustomerInfo();
    const summary = buildGrandSummary();
    const displayItems = systemOrderHelpers.buildSystemGroupDisplayItems(getStateItems());
    const builderRows = buildBuilderEdgeRows();
    const suffix = summary.hasConsult ? "(상담 필요 품목 미포함)" : "";
    const productHasConsult =
      typeof hasConsultLineItem === "function"
        ? hasConsultLineItem(displayItems)
        : displayItems.some((item) => Boolean(item?.isCustomPrice || item?.hasConsultItems));
    const productSuffix = productHasConsult ? "(상담 필요 품목 미포함)" : "";
    const productTotal = Number(summary.subtotal || 0);

    const itemsHtml =
      displayItems.length === 0
        ? '<p class="item-line">담긴 항목이 없습니다.</p>'
        : displayItems
            .map((item, idx) => {
              const detailRows = systemOrderHelpers.buildSystemOrderCompleteDetailRows(item);
              const detailRowsHtml = detailRows
                .map(
                  (row) => `
                    <div class="complete-detail-row">
                      <span class="complete-detail-label">${escapeHtml(row.label)}</span>
                      <span class="complete-detail-value">${escapeHtml(row.value)}</span>
                    </div>
                  `
                )
                .join("");
              return `
                <div class="complete-order-item">
                  <p class="complete-item-title">품목 ${idx + 1}</p>
                  <div class="complete-detail-list">
                    ${detailRowsHtml}
                  </div>
                </div>
              `;
            })
            .join("");

    const builderRowsHtml =
      builderRows.length === 0
        ? '<p class="item-line">구성된 모듈이 없습니다.</p>'
        : builderRows
            .map((row) => `<p class="item-line">${escapeHtml(row.title)} · ${escapeHtml(row.meta)}</p>`)
            .join("");

    container.innerHTML = `
      <div class="complete-section">
        <h4>고객 정보</h4>
        <p>이름: ${escapeHtml(customer.name || "-")}</p>
        <p>연락처: ${escapeHtml(customer.phone || "-")}</p>
        <p>주소: ${escapeHtml(customer.postcode || "-")} ${escapeHtml(customer.address || "")}</p>
        <p>요청사항: ${escapeHtml(customer.memo || "-")}</p>
      </div>
      <div class="complete-section">
        <h4>주문 품목</h4>
        ${itemsHtml}
      </div>
      <div class="complete-section">
        <h4>모듈 내역</h4>
        ${builderRowsHtml}
      </div>
      <div class="complete-section">
        <h4>합계</h4>
        <p>예상 제품금액: ${productTotal.toLocaleString()}원${productSuffix}</p>
        <p>배송/시공 서비스: ${escapeHtml(formatFulfillmentLine(summary.fulfillment))}</p>
        <p>예상 결제금액: ${summary.grandTotal.toLocaleString()}원${suffix}</p>
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
    const blockedReason =
      typeof getRuntimeHostBlockedReason === "function" ? getRuntimeHostBlockedReason() : "";
    if (blockedReason) {
      showInfoModal(blockedReason);
      return;
    }
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
    try {
      await submitOrderNotification({
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
        emailjsInstance: shouldUseOrderApiTransport() ? null : getEmailJSInstance(showInfoModal),
        showInfoModal,
      });
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
