import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/** Vendor-scoped pages (categories, orders, etc.). Super admins are redirected — they use platform routes only. */
export function VendorOnlyRoute() {
  const { isSuperAdmin } = useAuth();
  if (isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
