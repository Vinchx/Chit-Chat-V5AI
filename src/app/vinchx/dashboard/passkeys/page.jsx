"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { startRegistration } from "@simplewebauthn/browser";

export default function PasskeysPage() {
  const router = useRouter();
  const { isAdminAuthed, isLoading, session } = useAdminAuth();
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  React.useEffect(() => {
    if (isAdminAuthed) {
      fetchPasskeys();
    }
  }, [isAdminAuthed]);

  const fetchPasskeys = async () => {
    try {
      const response = await fetch("/api/admin/passkey/list");
      const data = await response.json();

      if (response.ok) {
        setPasskeys(data.passkeys || []);
      }
    } catch (error) {
      console.error("Failed to fetch passkeys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setError("");
    setSuccess("");
    setRegistering(true);

    try {
      // Get registration options
      const optionsRes = await fetch("/api/admin/passkey/register", {
        method: "POST",
      });

      const optionsData = await optionsRes.json();

      if (!optionsRes.ok) {
        throw new Error(
          optionsData.error || "Failed to get registration options",
        );
      }

      // Start WebAuthn registration
      const registrationResponse = await startRegistration(optionsData.options);

      // Verify registration
      const verifyRes = await fetch("/api/admin/passkey/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: registrationResponse,
          expectedChallenge: optionsData.options.challenge,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Registration failed");
      }

      setSuccess("Passkey registered successfully!");
      fetchPasskeys(); // Refresh list
    } catch (err) {
      console.error("Passkey registration error:", err);
      setError(err.message || "Failed to register passkey");
    } finally {
      setRegistering(false);
    }
  };

  const handleDeletePasskey = async (credentialID) => {
    if (!confirm("Are you sure you want to delete this passkey?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/passkey/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialID }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete passkey");
      }

      setSuccess("Passkey deleted successfully");
      fetchPasskeys(); // Refresh list
    } catch (err) {
      console.error("Delete passkey error:", err);
      setError(err.message || "Failed to delete passkey");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdminAuthed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/vinchx/dashboard")}
            className="mb-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            Passkey Management
          </h1>
          <p className="text-gray-400">
            Manage your WebAuthn passkeys for secure admin authentication
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-300">{success}</p>
          </div>
        )}

        {/* Register New Passkey */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            Register New Passkey
          </h2>
          <p className="text-gray-400 mb-4">
            Register a passkey using your laptop's biometric/PIN, or scan a QR
            code to use your phone as an authenticator.
          </p>
          <button
            onClick={handleRegisterPasskey}
            disabled={registering}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {registering ? (
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
                <span>Registering...</span>
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Register New Passkey</span>
              </>
            )}
          </button>
        </div>

        {/* Passkey List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Your Passkeys</h2>
          {passkeys.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-600"
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
              <p className="text-gray-400">No passkeys registered yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Register a passkey to enable secure authentication
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.credentialID}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
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
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {passkey.deviceType === "singleDevice"
                          ? "🔑 Single Device"
                          : "☁️ Multi-Device"}{" "}
                        Passkey
                      </p>
                      <p className="text-gray-400 text-sm">
                        Registered:{" "}
                        {new Date(passkey.createdAt).toLocaleDateString()}
                      </p>
                      {passkey.transports && passkey.transports.length > 0 && (
                        <p className="text-gray-500 text-xs mt-1">
                          Transports: {passkey.transports.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(passkey.credentialID)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors border border-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-6 h-6 text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-blue-300 font-medium mb-1">About Passkeys</p>
              <p className="text-blue-200 text-sm">
                Passkeys use biometric authentication (fingerprint, face
                recognition) or device PIN to securely log you in without
                passwords. You can use your laptop's built-in authenticator or
                scan a QR code to authenticate with your phone. They're more
                secure than passwords and can't be phished.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
