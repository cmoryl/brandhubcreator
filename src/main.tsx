// BrandHub - Brand Guide Creator v2.4
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Defer Supabase preconnect to avoid unused preconnect penalty on landing page
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://nhxaijbyqfkkhhoornzy.supabase.co';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Fix Radix UI bug where `pointer-events: none` can remain on <body> after
// a Dialog/Sheet/Popover closes — leaving the entire UI unclickable
// (e.g. "Add Template Spec" button does nothing). When no Radix overlay is
// actually mounted, clear the stuck inline style.
if (typeof document !== 'undefined') {
  const clearStuckPointerEvents = () => {
    if (document.body.style.pointerEvents !== 'none') return;
    const hasOpenOverlay = document.querySelector(
      '[data-radix-popper-content-wrapper], [role="dialog"][data-state="open"], [data-state="open"][data-radix-dialog-content], [data-state="open"][data-radix-popover-content], [data-state="open"][data-radix-dropdown-menu-content]'
    );
    if (!hasOpenOverlay) {
      document.body.style.pointerEvents = '';
    }
  };
  const observer = new MutationObserver(clearStuckPointerEvents);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style'],
    childList: true,
    subtree: true,
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <App />
  </ThemeProvider>
);

// Guard service worker: never register in iframes or preview hosts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

if (isPreviewHost || isInIframe) {
  // Unregister any existing service workers in preview/iframe contexts
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/registerSW.js', { scope: '/' }).catch(() => {});
  });
}
