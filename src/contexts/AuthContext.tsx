import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { User, UserRole } from "@/types";
import { adminHome, adminLogin, adminLogout } from "@/api/admins";
import {
  superAdminLogin,
  superAdminLogout,
  superAdminSessionProbe,
  type ApiSuperAdminSession,
} from "@/api/superadmins";

export type StaffRole = "admin" | "superadmin";

export type SuperAdminProfile = {
  id: string;
  fullName: string;
  email: string;
};

interface AuthContextType {
  user: User | null;
  /** Platform super admin profile (when `staffRole === 'superadmin'`). */
  superAdminUser: SuperAdminProfile | null;
  staffRole: StaffRole | null;
  sessionChecked: boolean;
  isAuthenticated: boolean;
  /** Vendor admin session */
  isVendorAdmin: boolean;
  /** Platform super admin session */
  isSuperAdmin: boolean;
  login: (
    email: string,
    password: string,
    mode?: "admin" | "superadmin"
  ) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sessionToUser(admin: {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
}): User {
  const id = String(admin.id ?? admin._id ?? "");
  return {
    id,
    name: admin.fullName ?? "Admin",
    email: admin.email ?? "",
    role: "admin",
    createdAt: "",
    status: "active",
  };
}

function superSessionToProfile(s: ApiSuperAdminSession): SuperAdminProfile {
  return {
    id: String(s.id ?? s._id ?? ""),
    fullName: s.fullName ?? "Super admin",
    email: s.email ?? "",
  };
}

const PROBE_PROFILE: SuperAdminProfile = {
  id: "session",
  fullName: "Super admin",
  email: "",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [superAdminUser, setSuperAdminUser] = useState<SuperAdminProfile | null>(null);
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const refreshSession = useCallback(async () => {
    setUser(null);
    setSuperAdminUser(null);
    setStaffRole(null);

    try {
      const { admin } = await adminHome();
      if (admin?.email) {
        setUser(sessionToUser(admin));
        setStaffRole("admin");
        setSessionChecked(true);
        return;
      }
    } catch {
      /* try super admin */
    }

    try {
      await superAdminSessionProbe();
      setStaffRole("superadmin");
      setSuperAdminUser(PROBE_PROFILE);
    } catch {
      /* logged out */
    } finally {
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string, mode: "admin" | "superadmin" = "admin") => {
      const e = email.trim().toLowerCase();
      if (mode === "superadmin") {
        const result = await superAdminLogin({ email: e, password });
        setUser(null);
        setSuperAdminUser(superSessionToProfile(result.superAdmin));
        setStaffRole("superadmin");
      } else {
        const result = await adminLogin({ email: e, password });
        const a = result.admin;
        setUser(
          sessionToUser({
            id: a.id,
            fullName: a.fullName,
            email: a.email,
          })
        );
        setSuperAdminUser(null);
        setStaffRole("admin");
      }
      setSessionChecked(true);
    },
    []
  );

  const logout = useCallback(async () => {
    await Promise.allSettled([adminLogout(), superAdminLogout()]);
    setUser(null);
    setSuperAdminUser(null);
    setStaffRole(null);
  }, []);

  const hasPermission = useCallback(
    (requiredRole: UserRole | UserRole[]): boolean => {
      if (staffRole === "superadmin") {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        return roles.includes("super-admin");
      }
      if (!user) return false;
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      return roles.includes(user.role);
    },
    [staffRole, user]
  );

  const isVendorAdmin = staffRole === "admin";
  const isSuperAdmin = staffRole === "superadmin";
  const isAuthenticated = isVendorAdmin || isSuperAdmin;

  const value = useMemo(
    () => ({
      user,
      superAdminUser,
      staffRole,
      sessionChecked,
      isAuthenticated,
      isVendorAdmin,
      isSuperAdmin,
      login,
      logout,
      hasPermission,
      refreshSession,
    }),
    [
      user,
      superAdminUser,
      staffRole,
      sessionChecked,
      isAuthenticated,
      isVendorAdmin,
      isSuperAdmin,
      login,
      logout,
      hasPermission,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
