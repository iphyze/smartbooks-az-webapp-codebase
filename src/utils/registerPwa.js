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

const fetchJavaScriptAsset = async (url) => {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/javascript, text/javascript" },
  });
  const contentType = String(response.headers.get("Content-Type") || "").toLowerCase();

  if (!response.ok || contentType.includes("text/html")) return false;
  return contentType.includes("javascript");
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
  const serviceWorkerUrl = `${baseUrl}service-worker.js`;

  window.addEventListener(
    "load",
    async () => {
      try {
        const isJavaScript = await fetchJavaScriptAsset(serviceWorkerUrl);
        if (!isJavaScript) {
          const staleRegistration = await navigator.serviceWorker.getRegistration(baseUrl);
          if (staleRegistration) await staleRegistration.unregister();
          return;
        }

        const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
          scope: baseUrl,
          updateViaCache: "none",
        });

        await registration.update().catch(() => {});
      } catch {
        // PWA registration must never interrupt the accounting application.
      }
    },
    { once: true }
  );
};
