(function bootstrapOrderCenterRuntimeConfig() {
  const defaultConfig = {
    security: {
      enforceAllowedHosts: true,
      allowedHosts: ["order-center.ggr.kr", "ggr.kr", "localhost", "127.0.0.1"],
      allowedHostSuffixes: [".ggr.kr"],
    },
    emailjs: {
      serviceId: "service_8iw3ovj",
      templateId: "template_iaid1xl",
      publicKey: "dUvt2iF9ciN8bvf6r",
    },
    cloudinary: {
      enabled: true,
      cloudName: "dpw2svbf6",
      uploadPreset: "ggr_order_center",
      folder: "ggr-order-center/system-preview",
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
    emailjs: { ...defaultConfig.emailjs, ...(runtimeConfig.emailjs || {}) },
    cloudinary: { ...defaultConfig.cloudinary, ...(runtimeConfig.cloudinary || {}) },
  };
})();
