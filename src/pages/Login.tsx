import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { Layers, Shield } from "lucide-react";

type LoginLocationState = {
  fromSignup?: boolean;
  registeredMessage?: string;
  fromPasswordReset?: boolean;
  resetMessage?: string;
};

export default function Login() {
  const { isAuthenticated, sessionChecked, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeState = location.state as LoginLocationState | null;

  const initialMode =
    searchParams.get("mode") === "super" ? ("superadmin" as const) : ("admin" as const);
  const [mode, setMode] = useState<"admin" | "superadmin">(initialMode);

  useEffect(() => {
    const m = searchParams.get("mode") === "super" ? "superadmin" : "admin";
    setMode(m);
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successBanner] = useState<string | null>(() => {
    if (routeState?.fromSignup && routeState?.registeredMessage) {
      return routeState.registeredMessage;
    }
    if (routeState?.fromPasswordReset && routeState?.resetMessage) {
      return routeState.resetMessage;
    }
    return null;
  });

  if (sessionChecked && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const setModeTab = (next: "admin" | "superadmin") => {
    setMode(next);
    setSearchParams(next === "superadmin" ? { mode: "super" } : {}, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password, mode);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Login failed. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const forgotHref =
    mode === "superadmin" ? "/forgot-password?mode=super" : "/forgot-password";
  const signupHref = mode === "superadmin" ? "/signup?mode=super" : "/signup";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-card">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {mode === "superadmin" ? (
              <Shield className="h-6 w-6" />
            ) : (
              <Layers className="h-6 w-6" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "superadmin" ? "Super admin sign in" : "Vendor admin sign in"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "superadmin"
              ? "Platform access to approve vendors and manage catalog-wide data."
              : "Sign in after you have registered and a super admin has approved your account."}
          </p>
        </div>

        <div className="flex rounded-lg border border-border p-1 bg-muted/40">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "admin"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setModeTab("admin")}
          >
            Vendor admin
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "superadmin"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setModeTab("superadmin")}
          >
            Super admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {successBanner && (
            <p className="text-sm text-green-800 dark:text-green-200 bg-green-500/15 rounded-md px-3 py-2">
              {successBanner}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password">Password</Label>
              <Link
                to={forgotHref}
                className="text-xs text-primary font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "admin" ? (
              <>
                New vendor?{" "}
                <Link to={signupHref} className="text-primary font-medium hover:underline">
                  Register
                </Link>
              </>
            ) : (
              <>
                New super admin?{" "}
                <Link to={signupHref} className="text-primary font-medium hover:underline">
                  Register (dev)
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
