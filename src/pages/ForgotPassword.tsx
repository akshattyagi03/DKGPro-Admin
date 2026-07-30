import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { adminForgotPassword, adminResetPassword } from "@/api/admins";
import { superAdminForgotPassword, superAdminResetPassword } from "@/api/superadmins";
import { ArrowLeft, Layers } from "lucide-react";

const MIN_PASSWORD = 6;

export default function ForgotPassword() {
  const { isAuthenticated, sessionChecked } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSuperMode = searchParams.get("mode") === "super";
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (sessionChecked && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = isSuperMode
        ? await superAdminForgotPassword({ email: email.trim().toLowerCase() })
        : await adminForgotPassword({ email: email.trim().toLowerCase() });
      setInfo(res.message);
      setStep("reset");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not send reset code. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = isSuperMode
        ? await superAdminForgotPassword({ email: email.trim().toLowerCase() })
        : await adminForgotPassword({ email: email.trim().toLowerCase() });
      setInfo(res.message);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not resend code. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (newPassword.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = isSuperMode
        ? await superAdminResetPassword({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
            newPassword,
          })
        : await adminResetPassword({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
            newPassword,
          });
      navigate(isSuperMode ? "/login?mode=super" : "/login", {
        replace: true,
        state: {
          fromPasswordReset: true,
          resetMessage: res.message || "Password reset successfully. You can sign in now.",
        },
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not reset password. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-card">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isSuperMode ? "Reset super admin password" : "Reset admin password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "email"
              ? "Enter your registered admin email. We will send a one-time code."
              : "Enter the code from your email and choose a new password."}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset code"}
            </Button>
            <p className="text-center text-sm">
              <Link
                to={isSuperMode ? "/login?mode=super" : "/login"}
                className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-green-800 dark:text-green-200 bg-green-500/15 rounded-md px-3 py-2">
                {info}
              </p>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">One-time code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Set new password"}
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
              <button
                type="button"
                className="text-primary font-medium hover:underline disabled:opacity-50"
                disabled={loading}
                onClick={handleResendOtp}
              >
                Resend code
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:underline"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError(null);
                  setInfo(null);
                }}
              >
                Use different email
              </button>
            </div>
            <p className="text-center text-sm">
              <Link
                to={isSuperMode ? "/login?mode=super" : "/login"}
                className="text-primary font-medium hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
