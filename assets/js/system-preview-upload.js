export function createSystemPreviewUploadHelpers({
  getRuntimeHostBlockedReason,
  CLOUDINARY_CONFIG = {},
  CLOUDINARY_UPLOAD_TIMEOUT_MS = 15000,
  HTML2CANVAS_CDN_URL = "",
  $,
  updatePreview,
  setPreviewInfoMode,
  getPreviewInfoMode,
  getPreviewCaptureIndexOnlyMode,
  setPreviewCaptureIndexOnlyMode,
} = {}) {
  let html2canvasLoaderPromise = null;

  const isCloudinaryUploadReady = () => {
    if (getRuntimeHostBlockedReason()) return false;
    if (!CLOUDINARY_CONFIG || typeof CLOUDINARY_CONFIG !== "object") return false;
    if (CLOUDINARY_CONFIG.enabled === false) return false;
    const cloudName = String(CLOUDINARY_CONFIG.cloudName || "").trim();
    const uploadPreset = String(CLOUDINARY_CONFIG.uploadPreset || "").trim();
    return Boolean(cloudName && uploadPreset);
  };

  const withTimeout = (promise, timeoutMs = 0, timeoutMessage = "요청 시간이 초과되었습니다.") => {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  };

  const ensureHtml2Canvas = () => {
    if (typeof window?.html2canvas === "function") {
      return Promise.resolve(window.html2canvas);
    }
    if (html2canvasLoaderPromise) return html2canvasLoaderPromise;

    html2canvasLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = HTML2CANVAS_CDN_URL;
      script.async = true;
      script.onload = () => {
        if (typeof window?.html2canvas === "function") {
          resolve(window.html2canvas);
          return;
        }
        html2canvasLoaderPromise = null;
        reject(new Error("미리보기 캡처 라이브러리를 불러오지 못했습니다."));
      };
      script.onerror = () => {
        html2canvasLoaderPromise = null;
        reject(new Error("미리보기 캡처 라이브러리 로드에 실패했습니다."));
      };
      document.head.appendChild(script);
    });

    return html2canvasLoaderPromise;
  };

  const waitForNextFrame = () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => resolve());
    });

  const captureSystemPreviewImageDataUrl = async () => {
    const previewEl = $("#systemPreviewFrame") || $("#systemPreviewBox");
    if (!previewEl) return "";
    const stepPreviewEl = $("#stepPreview");
    const shouldRevealHiddenStep = Boolean(stepPreviewEl?.classList.contains("hidden-step"));
    const originalStepStyle = stepPreviewEl?.getAttribute("style") || "";
    const previousInfoMode = getPreviewInfoMode();
    const previousCaptureIndexOnlyMode = getPreviewCaptureIndexOnlyMode();

    try {
      setPreviewCaptureIndexOnlyMode(true);
      setPreviewInfoMode("module", { rerender: false });
      if (shouldRevealHiddenStep && stepPreviewEl) {
        stepPreviewEl.classList.remove("hidden-step");
        stepPreviewEl.style.position = "fixed";
        stepPreviewEl.style.left = "0";
        stepPreviewEl.style.top = "-10000px";
        stepPreviewEl.style.width = `${Math.min(Math.max((Number(window.innerWidth || 0) || 1200) - 48, 360), 980)}px`;
        stepPreviewEl.style.pointerEvents = "none";
        await waitForNextFrame();
        updatePreview();
        await waitForNextFrame();
      }

      const html2canvas = await ensureHtml2Canvas();
      const rect = previewEl.getBoundingClientRect();
      const width = Math.round(Number(rect.width || previewEl.offsetWidth || 0));
      const height = Math.round(Number(rect.height || previewEl.offsetHeight || 0));
      if (width <= 0 || height <= 0) return "";

      const captureScale = Math.max(1, Math.min(2, Number(window.devicePixelRatio) || 1));
      const canvas = await html2canvas(previewEl, {
        backgroundColor: "#f3f3f3",
        scale: captureScale,
        useCORS: true,
        logging: false,
        removeContainer: true,
        width,
        height,
        windowWidth: Math.max(width, Number(window.innerWidth || 0)),
        windowHeight: Math.max(height, Number(window.innerHeight || 0)),
        ignoreElements: (el) => {
          if (!(el instanceof Element)) return false;
          return (
            el.classList.contains("system-preview-add-btn") ||
            el.classList.contains("preview-info-toggle") ||
            el.classList.contains("preview-history-actions") ||
            el.classList.contains("system-dimension-label") ||
            el.classList.contains("system-section-width-label") ||
            el.classList.contains("system-preview-ghost")
          );
        },
      });
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) return "";
      if (typeof canvas.toDataURL !== "function") return "";
      const dataUrl = canvas.toDataURL("image/png");
      return /^data:image\/png;base64,/.test(dataUrl) ? dataUrl : "";
    } finally {
      setPreviewCaptureIndexOnlyMode(previousCaptureIndexOnlyMode);
      setPreviewInfoMode(previousInfoMode, { rerender: false });
      if (shouldRevealHiddenStep && stepPreviewEl) {
        if (originalStepStyle) {
          stepPreviewEl.setAttribute("style", originalStepStyle);
        } else {
          stepPreviewEl.removeAttribute("style");
        }
        stepPreviewEl.classList.add("hidden-step");
      } else {
        updatePreview();
      }
    }
  };

  const uploadSystemPreviewToCloudinary = async () => {
    const blockedReason = getRuntimeHostBlockedReason();
    if (blockedReason) {
      return { secureUrl: "", publicId: "", skipped: "host_blocked", reason: blockedReason };
    }
    if (!isCloudinaryUploadReady()) {
      return { secureUrl: "", publicId: "", skipped: "not_configured" };
    }

    const imageDataUrl = await captureSystemPreviewImageDataUrl();
    if (!imageDataUrl) {
      return { secureUrl: "", publicId: "", skipped: "capture_empty" };
    }

    const cloudName = String(CLOUDINARY_CONFIG.cloudName || "").trim();
    const uploadPreset = String(CLOUDINARY_CONFIG.uploadPreset || "").trim();
    const folder = String(CLOUDINARY_CONFIG.folder || "").trim();
    const formData = new FormData();
    formData.append("file", imageDataUrl);
    formData.append("upload_preset", uploadPreset);
    formData.append("tags", "order-center,system-preview");
    if (folder) formData.append("folder", folder);

    const uploadEndpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
    const response = await withTimeout(
      fetch(uploadEndpoint, { method: "POST", body: formData }),
      CLOUDINARY_UPLOAD_TIMEOUT_MS,
      "미리보기 이미지 업로드 시간이 초과되었습니다."
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const reason = String(result?.error?.message || "").trim();
      throw new Error(reason || `Cloudinary 업로드 실패 (${response.status})`);
    }
    const secureUrl = String(result?.secure_url || "").trim();
    if (!secureUrl) {
      throw new Error("Cloudinary 업로드 URL을 받지 못했습니다.");
    }
    const publicId = String(result?.public_id || "").trim();
    return { secureUrl, publicId, skipped: "" };
  };

  return {
    isCloudinaryUploadReady,
    uploadSystemPreviewToCloudinary,
  };
}
