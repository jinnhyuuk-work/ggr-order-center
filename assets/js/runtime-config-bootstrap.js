(function bootstrapOrderCenterRuntimeConfig() {
  const defaultConfig = {
    security: {
      enforceAllowedHosts: true,
      allowedHosts: ["order-center.ggr.kr", "ggr.kr", "localhost", "127.0.0.1"],
      allowedHostSuffixes: [".ggr.kr"],
    },
    orderApi: {
      endpoint: "https://ggr-order-api.tight-frost-e42a.workers.dev/",
      timeoutMs: 15000,
    },
    cloudinary: {
      enabled: true,
      cloudName: "dpw2svbf6",
      uploadPreset: "ggr_order_center",
      folder: "ggr-order-center/system-preview",
      customerPhotoFolder: "ggr-order-center/customer-photo",
    },
  };

  const runtimeConfig =
    window.__ORDER_CENTER_CONFIG__ && typeof window.__ORDER_CENTER_CONFIG__ === "object"
      ? window.__ORDER_CENTER_CONFIG__
      : {};

  window.__ORDER_CENTER_CONFIG__ = {
    ...defaultConfig,
    ...runtimeConfig,
    security: { ...defaultConfig.security, ...(runtimeConfig.security || {}) },
    orderApi: { ...defaultConfig.orderApi, ...(runtimeConfig.orderApi || {}) },
    cloudinary: { ...defaultConfig.cloudinary, ...(runtimeConfig.cloudinary || {}) },
  };
})();
