/**
 * Guest side of the grok-web ↔ sandbox preview postMessage bridge.
 * Vanilla port of the workspace template — noops when not embedded.
 */

const PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge" as const;
const PREVIEW_BRIDGE_VERSION = 1 as const;

function isGrokEmbedderOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "grok.com" || host.endsWith(".grok.com")) return true;
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
    return false;
  } catch {
    return false;
  }
}

function isSandboxPreviewGuestHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}

function resolveParentEmbedderOrigin(
  parentIsSelf: boolean,
  referrer: string,
  ancestorOrigin?: string | null,
  guestHostname: string = "",
): string | null {
  if (parentIsSelf) return null;
  const candidates = [referrer, ancestorOrigin ?? ""].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const origin = candidate.includes("://")
        ? new URL(candidate).origin
        : candidate;
      if (isGrokEmbedderOrigin(origin)) return origin;
      if (!isSandboxPreviewGuestHost(guestHostname)) continue;
      const parsed = new URL(origin.includes("://") ? origin : `https://${origin}`);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.origin;
      }
    } catch {
      // try next
    }
  }
  return null;
}

function isSafeBridgePath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return false;
  }
  try {
    const resolved = new URL(path, "https://preview.invalid");
    return resolved.origin === "https://preview.invalid";
  } catch {
    return false;
  }
}

function isBridgeEnvelope(data: unknown): data is {
  channel: string;
  version: number;
  type: string;
  path?: string;
  delta?: number;
} {
  if (!data || typeof data !== "object") return false;
  const rec = data as Record<string, unknown>;
  return (
    rec.channel === PREVIEW_BRIDGE_CHANNEL &&
    typeof rec.version === "number" &&
    rec.version === PREVIEW_BRIDGE_VERSION &&
    typeof rec.type === "string"
  );
}

export function installPreviewHostBridge(): () => void {
  if (typeof window === "undefined") return () => {};

  const ancestorOrigin =
    typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0
      ? location.ancestorOrigins[0]
      : null;
  const parentOrigin = resolveParentEmbedderOrigin(
    window.parent === window,
    document.referrer,
    ancestorOrigin,
    window.location.hostname,
  );
  if (parentOrigin === null) return () => {};

  const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  const isAtHistoryRoot = () => {
    const state = window.history.state;
    return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
  };

  try {
    const current = window.history.state;
    const alreadyTagged =
      current !== null &&
      typeof current === "object" &&
      Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY);
    if (!alreadyTagged) {
      const isRoot = window.history.length <= 1;
      const marked =
        current && typeof current === "object"
          ? { ...current, [ROOT_STATE_KEY]: isRoot }
          : { [ROOT_STATE_KEY]: isRoot };
      originalReplaceState(marked, "", window.location.href);
    }
  } catch {
    // ignore
  }

  const post = (message: object) => {
    window.parent.postMessage(message, parentOrigin);
  };

  const reportLocation = () => {
    post({
      channel: PREVIEW_BRIDGE_CHANNEL,
      version: PREVIEW_BRIDGE_VERSION,
      type: "location",
      path: window.location.pathname || "/",
      search: window.location.search,
      hash: window.location.hash,
    });
  };

  const defaultNavigate = (path: string) => {
    if (!isSafeBridgePath(path)) return;
    try {
      const url = new URL(path, window.location.origin);
      if (url.origin !== window.location.origin) return;
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.pushState(window.history.state, "", next);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    } catch {
      // ignore
    }
  };

  const announce = () => {
    reportLocation();
    post({
      channel: PREVIEW_BRIDGE_CHANNEL,
      version: PREVIEW_BRIDGE_VERSION,
      type: "routes",
      paths: ["/"],
    });
    post({
      channel: PREVIEW_BRIDGE_CHANNEL,
      version: PREVIEW_BRIDGE_VERSION,
      type: "ready",
    });
  };

  const onMessage = (event: MessageEvent) => {
    if (event.source !== window.parent) return;
    if (event.origin !== parentOrigin) return;
    if (!isBridgeEnvelope(event.data)) return;

    if (event.data.type === "hello") {
      announce();
      return;
    }

    if (event.data.type === "navigate" && typeof event.data.path === "string") {
      defaultNavigate(event.data.path);
      queueMicrotask(reportLocation);
      return;
    }

    if (event.data.type === "history" && (event.data.delta === -1 || event.data.delta === 1)) {
      if (event.data.delta === -1 && isAtHistoryRoot()) return;
      window.history.go(event.data.delta);
    }
  };

  window.history.pushState = (data, unused, url) => {
    const next =
      data && typeof data === "object" ? { ...data, [ROOT_STATE_KEY]: false } : data;
    originalPushState(next, unused, url);
    reportLocation();
  };
  window.history.replaceState = (data, unused, url) => {
    const next = isAtHistoryRoot()
      ? { ...(data && typeof data === "object" ? data : {}), [ROOT_STATE_KEY]: true }
      : data;
    originalReplaceState(next, unused, url);
    reportLocation();
  };

  window.addEventListener("message", onMessage);
  window.addEventListener("popstate", reportLocation);
  window.addEventListener("hashchange", reportLocation);
  announce();

  return () => {
    window.removeEventListener("message", onMessage);
    window.removeEventListener("popstate", reportLocation);
    window.removeEventListener("hashchange", reportLocation);
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
  };
}

installPreviewHostBridge();
