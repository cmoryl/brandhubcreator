import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { BrandProvider } from "@/contexts/BrandContext";
import { EventProvider } from "@/contexts/EventContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalErrorLogger } from "@/components/GlobalErrorLogger";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageTracker } from "@/components/PageTracker";
import { PageSkeleton, BrandEditorSkeleton, AuthPageSkeleton } from "@/components/PageSkeleton";
import { checkAndClearExpiredCaches } from "@/lib/cacheManager";


// Check and clear expired caches on app initialization
checkAndClearExpiredCaches();

// NOTE: Unhandled rejections are already captured by GlobalErrorLogger and
// the inline script in index.html. We intentionally do NOT call preventDefault()
// here so errors remain visible in the console for debugging.

// Retry wrapper for lazy imports — if a chunk fails to load (e.g. stale cache),
// reload the page once to fetch fresh assets.
function lazyWithRetry(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return lazy(() =>
    factory().catch((err) => {
      const reloadKey = 'bhub_chunk_reload';
      const reloadCount = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
      if (reloadCount < 1) {
        sessionStorage.setItem(reloadKey, String(reloadCount + 1));
        // Small delay to let any in-flight requests settle
        return new Promise<{ default: React.ComponentType<any> }>((resolve, reject) => {
          setTimeout(() => {
            // Try the import one more time before reloading
            factory().then(resolve).catch(() => {
              window.location.reload();
              // Never-resolving promise while page reloads
              return new Promise(() => {});
            });
          }, 1000);
        });
      }
      // Already tried — clear flag and throw so ErrorBoundary catches it
      sessionStorage.removeItem(reloadKey);
      throw err;
    })
  );
}

// Clear the chunk reload flag on successful load
if (typeof window !== 'undefined') {
  sessionStorage.removeItem('bhub_chunk_reload');
}

// Lazy load pages for faster initial load
const Index = lazyWithRetry(() => import("./pages/Index"));
const BrandsIndex = lazyWithRetry(() => import("./pages/BrandsIndex"));
const BrandEditor = lazyWithRetry(() => import("./pages/BrandEditor"));
const ProductEditor = lazyWithRetry(() => import("./pages/ProductEditor"));
const OrganizationPortal = lazyWithRetry(() => import("./pages/OrganizationPortal"));
const AuthPage = lazyWithRetry(() => import("./pages/AuthPage"));
const PendingApprovalPage = lazyWithRetry(() => import("./pages/PendingApprovalPage"));
const KnowledgeBase = lazyWithRetry(() => import("./pages/KnowledgeBase"));
const GettingStarted = lazyWithRetry(() => import("./pages/GettingStarted"));
const OnboardingPage = lazyWithRetry(() => import("./pages/OnboardingPage"));
const OrganizationSettings = lazyWithRetry(() => import("./pages/OrganizationSettings"));
const ContactUs = lazyWithRetry(() => import("./pages/ContactUs"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const DemoBrandPreview = lazyWithRetry(() => import("./pages/DemoBrandPreview"));
const DemoGuideViewer = lazyWithRetry(() => import("./pages/DemoGuideViewer"));
const DemoBrandEditor = lazyWithRetry(() => import("./pages/DemoBrandEditor"));
const EventEditor = lazyWithRetry(() => import("./pages/EventEditor"));
const HelpCenter = lazyWithRetry(() => import("./pages/HelpCenter"));
const GlobalLinkUniversePage = lazyWithRetry(() => import("./pages/GlobalLinkUniversePage"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const SharedBrandPage = lazyWithRetry(() => import("./pages/SharedBrandPage"));
const BrandExportSchema = lazyWithRetry(() => import("./pages/BrandExportSchema"));
const HeroEffectsShowcase = lazyWithRetry(() => import("./pages/HeroEffectsShowcase"));
const Sitemap = lazyWithRetry(() => import("./pages/Sitemap"));
const SectionsShowcase = lazyWithRetry(() => import("./pages/SectionsShowcase"));
const BoothsCatalog = lazyWithRetry(() => import("./pages/BoothsCatalog"));
const BoothDivisionPage = lazyWithRetry(() => import("./pages/BoothDivisionPage"));
const BoothSystemsLibrary = lazyWithRetry(() => import("./pages/BoothSystemsLibrary"));
const ExpoFloorPlanner = lazyWithRetry(() => import("./pages/ExpoFloorPlanner"));
const ColorLab = lazyWithRetry(() => import("./pages/ColorLab"));
const SharedPalette = lazyWithRetry(() => import("./pages/SharedPalette"));
const SocialAssetStudio = lazyWithRetry(() => import("./pages/SocialAssetStudio"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Layout component that wraps all routes
const RootLayout = () => (
  <ErrorBoundary>
    <ConnectionBanner />
    <PageTracker />
    <main>
      <Outlet />
    </main>
  </ErrorBoundary>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppSettingsProvider>
            <OrganizationProvider>
              <BrandProvider>
                <EventProvider>
                <ScrollToTop />
                <GlobalErrorLogger />
                <Toaster />
                <Sonner />
                <Routes>
                  <Route element={<RootLayout />}>
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <Index />
                        </Suspense>
                      }
                    />
                    <Route
                      path="dashboard"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <BrandsIndex />
                        </Suspense>
                      }
                    />
                    <Route
                      path="auth"
                      element={
                        <Suspense fallback={<AuthPageSkeleton />}>
                          <AuthPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="pending-approval"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <PendingApprovalPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="onboarding"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <OnboardingPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="admin"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <AdminDashboard />
                        </Suspense>
                      }
                    />
                    <Route
                      path="knowledge"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <KnowledgeBase />
                        </Suspense>
                      }
                    />
                    <Route
                      path="getting-started"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <GettingStarted />
                        </Suspense>
                      }
                    />
                    <Route
                      path="booths"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <BoothsCatalog />
                        </Suspense>
                      }
                    />
                    <Route
                      path="booths/:divisionId"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <BoothDivisionPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="booth-systems"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <BoothSystemsLibrary />
                        </Suspense>
                      }
                    />
                    <Route
                      path="expo-floor"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <ExpoFloorPlanner />
                        </Suspense>
                      }
                    />
                    <Route
                      path="color-lab"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <ColorLab />
                        </Suspense>
                      }
                    />
                    <Route
                      path="color-lab/share/:token"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <SharedPalette />
                        </Suspense>
                      }
                    />
                    <Route
                      path="org/:slug"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <OrganizationPortal />
                        </Suspense>
                      }
                    />
                    <Route
                      path="org/settings"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <OrganizationSettings />
                        </Suspense>
                      }
                    />
                    <Route
                      path="org/:slug/settings"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <OrganizationSettings />
                        </Suspense>
                      }
                    />
                    <Route
                      path="contact"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <ContactUs />
                        </Suspense>
                      }
                    />
                    <Route
                      path="about"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <AboutPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="social-studio"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <SocialAssetStudio />
                        </Suspense>
                      }
                    />
                    <Route
                      path="brand/:brandSlug"
                      element={
                        <Suspense fallback={<BrandEditorSkeleton />}>
                          <BrandEditor />
                        </Suspense>
                      }
                    />
                    <Route
                      path="product/:productSlug"
                      element={
                        <Suspense fallback={<BrandEditorSkeleton />}>
                          <ProductEditor />
                        </Suspense>
                      }
                    />
                    <Route
                      path="product/globallink/universe"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <GlobalLinkUniversePage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="event/:eventSlug"
                      element={
                        <Suspense fallback={<BrandEditorSkeleton />}>
                          <EventEditor />
                        </Suspense>
                      }
                    />
                    <Route
                      path="demo/:brandSlug"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <DemoBrandPreview />
                        </Suspense>
                      }
                    />
                    <Route
                      path="demo/:type/:slug"
                      element={
                        <Suspense fallback={<BrandEditorSkeleton />}>
                          <DemoGuideViewer />
                        </Suspense>
                      }
                    />
                    <Route
                      path="admin/demo-pages/edit/:slug"
                      element={
                        <Suspense fallback={<BrandEditorSkeleton />}>
                          <DemoBrandEditor />
                        </Suspense>
                      }
                    />
                    <Route
                      path="help"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <HelpCenter />
                        </Suspense>
                      }
                    />
                    <Route
                      path="share/:token"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <SharedBrandPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="docs/brand-export-schema"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <BrandExportSchema />
                        </Suspense>
                      }
                    />
                    <Route
                      path="hero-effects"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <HeroEffectsShowcase />
                        </Suspense>
                      }
                    />
                    <Route
                      path="sitemap"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <Sitemap />
                        </Suspense>
                      }
                    />
                    <Route
                      path="sections"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <SectionsShowcase />
                        </Suspense>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <NotFound />
                        </Suspense>
                      }
                    />
                  </Route>
                </Routes>
                </EventProvider>
              </BrandProvider>
            </OrganizationProvider>
          </AppSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
