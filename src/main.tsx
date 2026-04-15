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
