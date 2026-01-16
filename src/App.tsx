import { Suspense, lazy } from "react";
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
import { PageSkeleton, BrandEditorSkeleton, AuthPageSkeleton } from "@/components/PageSkeleton";

// Lazy load pages for faster initial load
const BrandsIndex = lazy(() => import("./pages/BrandsIndex"));
const BrandEditor = lazy(() => import("./pages/BrandEditor"));
const ProductEditor = lazy(() => import("./pages/ProductEditor"));
const OrganizationPortal = lazy(() => import("./pages/OrganizationPortal"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const OrganizationSettings = lazy(() => import("./pages/OrganizationSettings"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DemoBrandPreview = lazy(() => import("./pages/DemoBrandPreview"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
                  <Routes>
                    {/* Public landing page */}
                    <Route 
                      path="/" 
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <BrandsIndex />
                        </Suspense>
                      } 
                    />

                    {/* Auth */}
                    <Route 
                      path="/auth" 
                      element={
                        <Suspense fallback={<AuthPageSkeleton />}>
                          <AuthPage />
                        </Suspense>
                      } 
                    />

                    {/* Onboarding */}
                    <Route 
                      path="/onboarding" 
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <OnboardingPage />
                        </Suspense>
                      } 
                    />

                    {/* Admin Dashboard - Protected */}
                    <Route 
                      path="/admin" 
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <AdminDashboard />
                        </Suspense>
                      } 
                    />

                    <Route 
                      path="/knowledge" 
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <KnowledgeBase />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/org/:slug" 
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <OrganizationPortal />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/org/settings" 
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <OrganizationSettings />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/contact" 
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <ContactUs />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/brand/:brandId" 
                      element={
                        <Suspense fallback={<BrandEditorSkeleton />}>
                          <BrandEditor />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/product/:productId" 
                      element={
                        <Suspense fallback={<BrandEditorSkeleton />}>
                          <ProductEditor />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/demo/:brandSlug" 
                      element={
                        <Suspense fallback={<PageSkeleton />}>
                          <DemoBrandPreview />
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
                  </Routes>
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
