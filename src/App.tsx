import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { VendorOnlyRoute } from "@/components/VendorOnlyRoute";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import AdminSignup from "./pages/AdminSignup";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import SubCategories from "./pages/SubCategories";
import ThirdSubCategories from "./pages/ThirdSubCategories";
import AdditionalCategories from "./pages/AdditionalCategories";
import HeroBanners from "./pages/HeroBanners";
import ServicePages from "./pages/ServicePages";
import Products from "./pages/Products";
import Blogs from "./pages/Blogs";
import Venues from "./pages/Venues";
import Users from "./pages/Users";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import CorporateBookings from "./pages/CorporateBookings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/super-admin/*"
              element={<Navigate to="/login?mode=super" replace />}
            />
            <Route path="/signup" element={<AdminSignup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/add" element={<Products />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venues/add" element={<Venues />} />
              <Route path="/users" element={<Users />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/add" element={<Categories />} />
              <Route path="/sub-categories" element={<SubCategories />} />
              <Route path="/sub-categories/add" element={<SubCategories />} />
              <Route path="/third-sub-categories" element={<ThirdSubCategories />} />
              <Route path="/third-sub-categories/add" element={<ThirdSubCategories />} />
              <Route path="/additional-categories" element={<AdditionalCategories />} />
              <Route path="/additional-categories/add" element={<AdditionalCategories />} />
              <Route path="/hero-banners" element={<HeroBanners />} />
              <Route path="/service-pages" element={<ServicePages />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/add" element={<Blogs />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:orderId" element={<OrderDetail />} />
              <Route path="/corporate-bookings" element={<CorporateBookings />} />
              <Route element={<VendorOnlyRoute />}>
                <Route path="/billing" element={<Billing />} />
                <Route path="/analytics" element={<Analytics />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
