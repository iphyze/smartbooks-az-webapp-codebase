const getBaseUrl = () => {
  const configuredBase = import.meta.env.BASE_URL || "/";
  return configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
};

const getSameOriginApiAssetUrl = (path) => {
  if (typeof window === "undefined") return "";

  const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (!configuredApiBase) return "";

  try {
    const apiBase = new URL(
      configuredApiBase.endsWith("/") ? configuredApiBase : `${configuredApiBase}/`,
      window.location.origin
    );
    if (apiBase.origin !== window.location.origin) return "";
    return new URL(path.replace(/^\/+/, ""), apiBase).toString();
  } catch {
    return "";
  }
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

const removeLink = (rel) => {
  document.head.querySelectorAll(`link[rel="${rel}"]`).forEach((link) => link.remove());
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

const fetchStaticAsset = async (url, acceptedContentTypes) => {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: acceptedContentTypes.join(", ") },
  });
  const contentType = String(response.headers.get("Content-Type") || "").toLowerCase();

  if (!response.ok || contentType.includes("text/html")) return null;
  if (!acceptedContentTypes.some((type) => contentType.includes(type))) return null;
  return response;
};

export const configurePwaMetadata = () => {
  if (typeof document === "undefined") return;

  const baseUrl = getBaseUrl();
  const manifestUrl = `${baseUrl}manifest.webmanifest`;

  // Do not leave a manifest link pointing at the SPA fallback. Add it only
  // after the deployed file has been confirmed as JSON/manifest content.
  removeLink("manifest");
  fetchStaticAsset(manifestUrl, ["application/manifest+json", "application/json"])
    .then((response) => {
      if (response) ensureLink("manifest", manifestUrl);
    })
    .catch(() => {});

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
  const staticServiceWorkerUrl = `${baseUrl}service-worker.js`;
  const apiServiceWorkerUrl = getSameOriginApiAssetUrl("pwa/service-worker.js");

  window.addEventListener(
    "load",
    async () => {
      try {
        const acceptedTypes = ["application/javascript", "text/javascript"];
        const candidates = [staticServiceWorkerUrl, apiServiceWorkerUrl].filter(Boolean);
        let serviceWorkerUrl = "";

        for (const candidate of candidates) {
          const response = await fetchStaticAsset(candidate, acceptedTypes).catch(() => null);
          if (response) {
            serviceWorkerUrl = candidate;
            break;
          }
        }

        if (!serviceWorkerUrl) {
          const staleRegistration = await navigator.serviceWorker.getRegistration(baseUrl);
          if (staleRegistration) await staleRegistration.unregister();
          return;
        }

        const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
          scope: baseUrl,
          updateViaCache: "none",
        });

        registration.update().catch(() => {});
      } catch {
        // PWA support is optional. A deployment without a service-worker route
        // must not surface a false application error or affect accounting flows.
      }
    },
    { once: true }
  );
};
