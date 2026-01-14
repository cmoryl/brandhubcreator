import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandProvider } from "@/contexts/BrandContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import BrandsIndex from "./pages/BrandsIndex";
import BrandEditor from "./pages/BrandEditor";
import ProductEditor from "./pages/ProductEditor";
import OrganizationPortal from "./pages/OrganizationPortal";
import AuthPage from "./pages/AuthPage";
import KnowledgeBase from "./pages/KnowledgeBase";
import OnboardingPage from "./pages/OnboardingPage";
import OrganizationSettings from "./pages/OrganizationSettings";
import ContactUs from "./pages/ContactUs";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppSettingsProvider>
          <OrganizationProvider>
            <BrandProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public landing page */}
                  <Route path="/" element={<BrandsIndex />} />

                  {/* Auth */}
                  <Route path="/auth" element={<AuthPage />} />

                  {/* Onboarding */}
                  <Route path="/onboarding" element={<OnboardingPage />} />

                  {/* Admin Dashboard - Protected */}
                  <Route path="/admin" element={<AdminDashboard />} />

                  <Route path="/knowledge" element={<KnowledgeBase />} />
                  <Route path="/org/:slug" element={<OrganizationPortal />} />
                  <Route path="/org/settings" element={<OrganizationSettings />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/brand/:brandId" element={<BrandEditor />} />
                  <Route path="/product/:productId" element={<ProductEditor />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </BrandProvider>
          </OrganizationProvider>
        </AppSettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
