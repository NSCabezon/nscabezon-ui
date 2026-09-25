"use client";
import {
  useLabels
} from "./chunk-WEN4A7U4.js";

// src/version/useVersionCheck.ts
import { useEffect, useRef } from "react";
import { toast } from "sonner";
var VERSION_POLL_INTERVAL_MS = 5 * 6e4;
var VERSION_FOCUS_THROTTLE_MS = 6e4;
var notifiedVersion = null;
var lastCheckAt = 0;
async function fetchVersionJson(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    const data = await res.json();
    const version = data?.version;
    return typeof version === "string" && version.length > 0 ? version : null;
  } catch {
    return null;
  }
}
function useVersionCheck({
  fetchVersion,
  currentVersion,
  enabled = true,
  labels: labelsProp,
  onReload
}) {
  const labels = useLabels(labelsProp);
  const latest = useRef({ fetchVersion, currentVersion, labels, onReload });
  useEffect(() => {
    latest.current = { fetchVersion, currentVersion, labels, onReload };
  });
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    async function check() {
      lastCheckAt = Date.now();
      try {
        const version = await latest.current.fetchVersion();
        if (typeof version !== "string" || version.length === 0) return;
        const { currentVersion: current, labels: l, onReload: reload } = latest.current;
        if (disposed || version === current || version === notifiedVersion) return;
        notifiedVersion = version;
        toast(l.versionMessage, {
          duration: Infinity,
          // Persistente: arriba, para no tapar los footers de acción pegados
          // al borde inferior.
          position: "top-center",
          action: {
            label: l.versionAction,
            onClick: () => reload ? reload() : location.reload()
          }
        });
      } catch {
      }
    }
    void check();
    const intervalId = setInterval(() => void check(), VERSION_POLL_INTERVAL_MS);
    const onMaybeVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheckAt < VERSION_FOCUS_THROTTLE_MS) return;
      void check();
    };
    window.addEventListener("focus", onMaybeVisible);
    document.addEventListener("visibilitychange", onMaybeVisible);
    return () => {
      disposed = true;
      clearInterval(intervalId);
      window.removeEventListener("focus", onMaybeVisible);
      document.removeEventListener("visibilitychange", onMaybeVisible);
    };
  }, [enabled]);
}

export {
  VERSION_POLL_INTERVAL_MS,
  VERSION_FOCUS_THROTTLE_MS,
  fetchVersionJson,
  useVersionCheck
};
