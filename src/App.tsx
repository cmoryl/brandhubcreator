import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BrandProvider } from "@/contexts/BrandContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import BrandsIndex from "./pages/BrandsIndex";
import BrandEditor from "./pages/BrandEditor";
import ProductEditor from "./pages/ProductEditor";
import AuthPage from "./pages/AuthPage";
import KnowledgeBase from "./pages/KnowledgeBase";
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

                  {/* Onboarding disabled */}
                  <Route path="/onboarding" element={<Navigate to="/" replace />} />

                  <Route path="/knowledge" element={<KnowledgeBase />} />
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
