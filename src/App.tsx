import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandProvider } from "@/contexts/BrandContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import BrandsIndex from "./pages/BrandsIndex";
import BrandEditor from "./pages/BrandEditor";
import ProductEditor from "./pages/ProductEditor";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppSettingsProvider>
          <BrandProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<BrandsIndex />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/brand/:brandId" element={<BrandEditor />} />
                <Route path="/product/:productId" element={<ProductEditor />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </BrandProvider>
        </AppSettingsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
