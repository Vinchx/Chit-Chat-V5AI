"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { toast } from "sonner";
import LightPillar from "@/components/LightPillar";

export default function AdminAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Login with Passkey
  const handlePasskeyLogin = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setPasskeyLoading(true);

    try {
      // Get authentication options
      const optionsRes = await fetch("/api/admin/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const optionsData = await optionsRes.json();

      if (!optionsRes.ok) {
        throw new Error(
          optionsData.error || "Failed to get authentication options",
        );
      }

      // Start WebAuthn authentication
      const authResponse = await startAuthentication(optionsData.options);

      // Verify authentication
      const verifyRes = await fetch(
        "/api/admin/passkey/verify-authentication",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            response: authResponse,
            expectedChallenge: optionsData.options.challenge,
            email,
          }),
        },
      );

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Authentication failed");
      }

      // Authentication successful - now create NextAuth session
      // We need to sign in with a special passkey provider or custom flow
      // For now, we'll use the credentials provider with a special token
      const result = await signIn("credentials", {
        login: email,
        password: `__PASSKEY_AUTH__:${verifyData.user.id}`,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Get admin token after successful passkey login (same as password login)
      const tokenRes = await fetch("/api/admin/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to create admin session");
      }

      const tokenData = await tokenRes.json();

      // Store admin token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_token", JSON.stringify(tokenData.token));
      }

      // Small delay to ensure localStorage is written before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect to admin dashboard
      window.location.href = "/vinchx/dashboard";
    } catch (err) {
      console.error("Passkey login error:", err);

      if (
        err.message.includes("Forbidden") ||
        err.message.includes("Admin access required")
      ) {
        toast.error("Akun anda tidak terdaftarkan");
        // Optional: clear loading state but don't set 'error' state so red box doesn't appear
      } else {
        setError(
          err.message ||
            "Passkey authentication failed. Try using password instead.",
        );
        setShowPasswordForm(true); // Show password form as fallback
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Login with Password
  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        login: email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Get admin token after successful login
      const tokenRes = await fetch("/api/admin/auth/token", {
        method: "POST",
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to create admin session");
      }

      const tokenData = await tokenRes.json();

      // Store admin token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_token", JSON.stringify(tokenData.token));
      }

      // Small delay to ensure localStorage is written before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect to admin dashboard
      window.location.href = "/vinchx/dashboard";
    } catch (err) {
      console.error("Password login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-gray-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <LightPillar
          topColor="#6B6974"
          bottomColor="#62588B"
          intensity={1}
          rotationSpeed={0.2}
          glowAmount={0.007}
          pillarWidth={3}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          pillarRotation={30}
          interactive={false}
          mixBlendMode="screen"
          quality="high"
        />
      </div>

      <div className="max-w-md w-full relative z-10 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Secure authentication with passkey</p>
        </div>

        {/* Auth Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700 shadow-2xl">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg animate-fade-in">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-200 focus:ring-1 focus:ring-purple-200 transition-all"
              disabled={loading || passkeyLoading}
            />
          </div>

          {/* Passkey Login Button */}
          {!showPasswordForm && (
            <button
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading || loading}
              className="w-full mb-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
            >
              {passkeyLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  <span>Login with Passkey</span>
                </>
              )}
            </button>
          )}

          {/* Toggle Password Form */}
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              Use password instead
            </button>
          ) : (
            <>
              {/* Password Form */}
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    disabled={loading || passkeyLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || passkeyLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-900/20"
                >
                  {loading ? "Logging in..." : "Login with Password"}
                </button>
              </form>

              <button
                onClick={() => setShowPasswordForm(false)}
                className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Use passkey instead
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 text-center bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 inline-block w-full border border-gray-700/50">
          <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Secured with WebAuthn & NextAuth.js
          </p>
        </div>
      </div>
    </div>
  );
}
