import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/context/SocketContext";

import LoginPage from "./pages/LoginPage";
import FarmerDashboard from "./pages/FarmerDashboard";
import CropAdvisoryPage from "./pages/CropAdvisoryPage";
import MarketPricesPage from "./pages/MarketPricesPage";
import IrrigationPlannerPage from "./pages/IrrigationPlannerPage";
import FertilizersPage from "./pages/FertilizersPage";
import FertilizerDetailPage from "./pages/FertilizerDetailPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminFertilizers from "@/pages/admin/AdminFertilizers";
import GovDataDashboard from "@/pages/admin/GovDataDashboard";
import MarketPricesAdmin from "@/pages/admin/MarketPricesAdmin";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

import Navbar from "@/components/layout/Navbar";
import LandingPage from "@/pages/LandingPage";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminContent from "@/pages/admin/AdminContent";

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  // Use useLocation to potentially hide navbar on specific pages if needed
  // For now, show everywhere

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

        {/* Farmer Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/advisory" element={<ProtectedRoute><CropAdvisoryPage /></ProtectedRoute>} />
        <Route path="/prices" element={<ProtectedRoute><MarketPricesPage /></ProtectedRoute>} />
        <Route path="/irrigation" element={<ProtectedRoute><IrrigationPlannerPage /></ProtectedRoute>} />
        <Route path="/fertilizers" element={<ProtectedRoute><FertilizersPage /></ProtectedRoute>} />
        <Route path="/fertilizers/:id" element={<ProtectedRoute><FertilizerDetailPage /></ProtectedRoute>} />

        {/* Admin Routes with Layout */}
        <Route path="/admin" element={<Navigate to="/admin/login" />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="fertilizers" element={<AdminFertilizers />} />
          <Route path="gov-data" element={<GovDataDashboard />} />
          <Route path="market-prices" element={<MarketPricesAdmin />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SocketProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </SocketProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
