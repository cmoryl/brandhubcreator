import { Suspense, lazy } from "react";
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

// Lazy load pages for faster initial load
const BrandsIndex = lazy(() => import("./pages/BrandsIndex"));
const BrandEditor = lazy(() => import("./pages/BrandEditor"));
const ProductEditor = lazy(() => import("./pages/ProductEditor"));
const OrganizationPortal = lazy(() => import("./pages/OrganizationPortal"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const PendingApprovalPage = lazy(() => import("./pages/PendingApprovalPage"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const OrganizationSettings = lazy(() => import("./pages/OrganizationSettings"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DemoBrandPreview = lazy(() => import("./pages/DemoBrandPreview"));
const DemoGuideViewer = lazy(() => import("./pages/DemoGuideViewer"));
const EventEditor = lazy(() => import("./pages/EventEditor"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

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
                      path="help"
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <HelpCenter />
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
