const getBaseUrl = () => {
  const configuredBase = import.meta.env.BASE_URL || "/";
  return configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
};

const ensureLink = (rel, href, attributes = {}) => {
  let link = document.head.querySelector(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
  Object.entries(attributes).forEach(([name, value]) => {
    link.setAttribute(name, value);
  });
};

const ensureMeta = (name, content) => {
  let meta = document.head.querySelector(`meta[name="${name}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }

  meta.content = content;
};

export const configurePwaMetadata = () => {
  if (typeof document === "undefined") return;

  const baseUrl = getBaseUrl();

  ensureLink("manifest", `${baseUrl}manifest.webmanifest`);
  ensureLink("apple-touch-icon", `${baseUrl}icons/apple-touch-icon.png`, {
    sizes: "180x180",
  });

  ensureMeta("theme-color", "#00b196");
  ensureMeta("mobile-web-app-capable", "yes");
  ensureMeta("apple-mobile-web-app-capable", "yes");
  ensureMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
  ensureMeta("apple-mobile-web-app-title", "SmartBooks");
  ensureMeta("application-name", "SmartBooks");
};

export const registerPwa = () => {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !import.meta.env.PROD
  ) {
    return;
  }

  const baseUrl = getBaseUrl();

  window.addEventListener(
    "load",
    async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `${baseUrl}service-worker.js`,
          { scope: baseUrl }
        );

        // Check for an updated service worker whenever the application starts.
        registration.update().catch(() => {});
      } catch (error) {
        console.error("SmartBooks PWA registration failed:", error);
      }
    },
    { once: true }
  );
};
