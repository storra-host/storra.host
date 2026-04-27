"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

function subscribe(onStoreChange: () => void) {
  if (typeof document === "undefined") return () => undefined;
  const el = document.documentElement;
  const obs = new MutationObserver(onStoreChange);
  obs.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

function getThemeSnapshot() {
  if (typeof document === "undefined") return "dark" as const;
  return document.documentElement.classList.contains("dark")
    ? ("dark" as const)
    : ("light" as const);
}

const serverTheme = () => "dark" as const;

export function AppToaster() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, serverTheme);
  return (
    <Toaster
      position="top-right"
      theme={theme}
      richColors={false}
      closeButton
      offset={{ top: 12, right: 12 }}
      mobileOffset={{ top: 12, right: 12 }}
      gap={8}
    />
  );
}
