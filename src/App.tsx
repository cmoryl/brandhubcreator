import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandProvider } from "@/contexts/BrandContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalErrorLogger } from "@/components/GlobalErrorLogger";
import { LoadingScreen } from "@/components/LoadingScreen";

// Eagerly loaded - critical path
import BrandsIndex from "./pages/BrandsIndex";
import AuthPage from "./pages/AuthPage";

// Lazy loaded - secondary routes
const BrandEditor = lazy(() => import('./pages/BrandEditor'));
const ProductEditor = lazy(() => import('./pages/ProductEditor'));
const OrganizationPortal = lazy(() => import('./pages/OrganizationPortal'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DemoBrandPreview = lazy(() => import('./pages/DemoBrandPreview'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppSettingsProvider>
          <OrganizationProvider>
            <BrandProvider>
              <GlobalErrorLogger />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary>
                  <Suspense fallback={<LoadingScreen message="Loading page..." />}>
                    <Routes>
                      {/* Public landing page - eagerly loaded */}
                      <Route path="/" element={<BrandsIndex />} />

                      {/* Auth - eagerly loaded for fast login */}
                      <Route path="/auth" element={<AuthPage />} />

                      {/* Lazy loaded routes */}
                      <Route path="/onboarding" element={<OnboardingPage />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/knowledge" element={<KnowledgeBase />} />
                      <Route path="/org/:slug" element={<OrganizationPortal />} />
                      <Route path="/org/settings" element={<OrganizationSettings />} />
                      <Route path="/contact" element={<ContactUs />} />
                      <Route path="/brand/:brandId" element={<BrandEditor />} />
                      <Route path="/product/:productId" element={<ProductEditor />} />
                      <Route path="/demo/:brandSlug" element={<DemoBrandPreview />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </BrowserRouter>
            </BrandProvider>
          </OrganizationProvider>
        </AppSettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
