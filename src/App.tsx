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
import BrandsIndex from "./pages/BrandsIndex";
import AuthPage from "./pages/AuthPage";
import BrandEditor from "./pages/BrandEditor";
import ProductEditor from "./pages/ProductEditor";
import OrganizationPortal from "./pages/OrganizationPortal";
import KnowledgeBase from "./pages/KnowledgeBase";
import OnboardingPage from "./pages/OnboardingPage";
import OrganizationSettings from "./pages/OrganizationSettings";
import ContactUs from "./pages/ContactUs";
import AdminDashboard from "./pages/AdminDashboard";
import DemoBrandPreview from "./pages/DemoBrandPreview";
import NotFound from "./pages/NotFound";

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
                  <Routes>
                    <Route path="/" element={<BrandsIndex />} />
                    <Route path="/auth" element={<AuthPage />} />
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
