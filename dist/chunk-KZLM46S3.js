"use client";
import {
  Button,
  cn,
  safeStorage
} from "./chunk-6CXBNIIA.js";
import {
  useLabels
} from "./chunk-NU4QW2R5.js";

// src/auth/OAuthButtons.tsx
import { useState } from "react";
import { toast } from "sonner";

// src/auth/icons.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function GoogleIcon({ className }) {
  return /* @__PURE__ */ jsxs("svg", { className: cn("size-4", className), viewBox: "0 0 24 24", "aria-hidden": true, children: [
    /* @__PURE__ */ jsx(
      "path",
      {
        fill: "#4285F4",
        d: "M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      }
    ),
    /* @__PURE__ */ jsx(
      "path",
      {
        fill: "#34A853",
        d: "M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.09A12 12 0 0 0 12 24Z"
      }
    ),
    /* @__PURE__ */ jsx(
      "path",
      {
        fill: "#FBBC05",
        d: "M5.28 14.29a7.21 7.21 0 0 1 0-4.58V6.62H1.27a12 12 0 0 0 0 10.76l4.01-3.09Z"
      }
    ),
    /* @__PURE__ */ jsx(
      "path",
      {
        fill: "#EA4335",
        d: "M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.99 11.99 0 0 0 1.27 6.62l4.01 3.09C6.22 6.87 8.87 4.77 12 4.77Z"
      }
    )
  ] });
}
function AppleIcon({ className }) {
  return /* @__PURE__ */ jsx("svg", { className: cn("size-4", className), viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: /* @__PURE__ */ jsx("path", { d: "M16.98 12.73c.03 3.22 2.82 4.29 2.85 4.3-.02.08-.44 1.53-1.47 3.03-.89 1.29-1.81 2.58-3.26 2.61-1.43.03-1.89-.85-3.52-.85-1.63 0-2.14.82-3.49.88-1.4.05-2.47-1.4-3.36-2.69-1.83-2.64-3.23-7.46-1.35-10.71a5.21 5.21 0 0 1 4.4-2.67c1.38-.03 2.68.93 3.52.93.84 0 2.42-1.15 4.08-.98.7.03 2.65.28 3.9 2.12-.1.06-2.33 1.36-2.3 4.03ZM14.3 4.87c.75-.9 1.25-2.16 1.11-3.41-1.07.04-2.37.72-3.14 1.62-.69.8-1.29 2.08-1.13 3.3 1.2.1 2.42-.6 3.16-1.51Z" }) });
}

// src/auth/lastAuthMethod.ts
var DEFAULT_LAST_AUTH_METHOD_KEY = "ui.lastAuthMethod";
var AUTH_METHODS = ["email", "google", "apple"];
function isAuthMethod(value) {
  return typeof value === "string" && AUTH_METHODS.includes(value);
}
function getLastAuthMethod(storageKey = DEFAULT_LAST_AUTH_METHOD_KEY) {
  const value = safeStorage.getItem(storageKey);
  return isAuthMethod(value) ? value : null;
}
function setLastAuthMethod(method, storageKey = DEFAULT_LAST_AUTH_METHOD_KEY) {
  safeStorage.setItem(storageKey, method);
}

// src/auth/OAuthButtons.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var DEFAULT_PROVIDERS = ["google", "apple"];
var PROVIDER_UI = {
  google: { Icon: GoogleIcon, labelKey: "oauthGoogle" },
  apple: { Icon: AppleIcon, labelKey: "oauthApple" }
};
function OAuthButtons({
  client,
  redirectTo,
  providers = DEFAULT_PROVIDERS,
  lastMethod,
  rememberLastMethod = true,
  onBeforeRedirect,
  onError,
  divider = true,
  providerOptions,
  labels: labelsProp,
  className
}) {
  const labels = useLabels(labelsProp);
  const [redirecting, setRedirecting] = useState(false);
  async function signIn(provider) {
    setRedirecting(true);
    if (rememberLastMethod) {
      const storageKey = typeof rememberLastMethod === "object" ? rememberLastMethod.storageKey : DEFAULT_LAST_AUTH_METHOD_KEY;
      setLastAuthMethod(provider, storageKey);
    }
    onBeforeRedirect?.(provider);
    const resolved = typeof redirectTo === "function" ? redirectTo() : redirectTo;
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: resolved, ...providerOptions?.[provider] }
    });
    if (error) {
      if (onError) onError(error, provider);
      else toast.error(error.message);
      setRedirecting(false);
    }
  }
  return /* @__PURE__ */ jsxs2("div", { className: cn("space-y-4", className), children: [
    divider && /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx2("div", { className: "h-px flex-1 bg-border" }),
      /* @__PURE__ */ jsx2("span", { className: "text-xs text-muted-foreground", children: labels.oauthDivider }),
      /* @__PURE__ */ jsx2("div", { className: "h-px flex-1 bg-border" })
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "space-y-2", children: providers.map((provider) => {
      const { Icon, labelKey } = PROVIDER_UI[provider];
      return /* @__PURE__ */ jsxs2(
        Button,
        {
          type: "button",
          variant: "outline",
          className: "relative w-full",
          "data-provider": provider,
          disabled: redirecting,
          onClick: () => signIn(provider),
          children: [
            /* @__PURE__ */ jsx2(Icon, {}),
            labels[labelKey],
            lastMethod === provider && /* @__PURE__ */ jsx2("span", { className: "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-foreground px-1.5 py-0.5 text-xs font-semibold text-background shadow-sm", children: labels.lastUsed })
          ]
        },
        provider
      );
    }) })
  ] });
}

export {
  GoogleIcon,
  AppleIcon,
  DEFAULT_LAST_AUTH_METHOD_KEY,
  getLastAuthMethod,
  setLastAuthMethod,
  OAuthButtons
};
