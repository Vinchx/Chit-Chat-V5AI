"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // State untuk track step
  const [step, setStep] = useState(1); // 1: input email, 2: input OTP + password baru

  // State untuk form data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State untuk loading dan pesan
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Handle request OTP
  const handleRequestOtp = async () => {
    if (!email) {
      setMessage({ text: "Email harus diisi!", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        setStep(2); // Pindah ke step 2
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setMessage({
        text: "Terjadi kesalahan. Coba lagi nanti.",
        type: "error",
      });
    }

    setIsLoading(false);
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      setMessage({ text: "Semua field harus diisi!", type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ text: "Password minimal 8 karakter!", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        text: "Password dan konfirmasi tidak sama!",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: data.message, type: "success" });
        setTimeout(() => {
          router.push("/auth");
        }, 2000);
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setMessage({
        text: "Terjadi kesalahan. Coba lagi nanti.",
        type: "error",
      });
    }

    setIsLoading(false);
  };

  // Handle Enter key
  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" && !isLoading) {
      action();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        </div>

        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md mx-4">
        {/* Glassmorphism Container */}
        <div className="backdrop-blur-lg bg-white/30 rounded-3xl shadow-2xl border border-white/40 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
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
            <h1 className="text-2xl font-bold text-gray-800">Lupa Password</h1>
            <p className="text-gray-600 mt-2">
              {step === 1
                ? "Masukkan email Anda untuk menerima kode OTP"
                : "Masukkan kode OTP dan password baru Anda"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-gradient-to-r from-blue-400 to-purple-400 text-white" : "bg-gray-300 text-gray-600"}`}
            >
              1
            </div>
            <div
              className={`w-12 h-1 ${step >= 2 ? "bg-gradient-to-r from-blue-400 to-purple-400" : "bg-gray-300"}`}
            ></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-gradient-to-r from-blue-400 to-purple-400 text-white" : "bg-gray-300 text-gray-600"}`}
            >
              2
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`p-3 rounded-lg text-center text-sm font-medium mb-4 ${
                message.type === "success"
                  ? "bg-green-100/80 text-green-700 border border-green-300"
                  : "bg-red-100/80 text-red-700 border border-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Step 1: Input Email */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleRequestOtp)}
                  placeholder="Masukkan email Anda"
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleRequestOtp}
                disabled={isLoading}
                className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Mengirim...
                  </div>
                ) : (
                  "Kirim Kode OTP"
                )}
              </button>
            </div>
          )}

          {/* Step 2: Input OTP and New Password */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Masukkan 6 digit kode OTP"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500 text-center tracking-widest text-lg font-mono"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleResetPassword)}
                  placeholder="Ulangi password baru"
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-500"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={handleResetPassword}
                disabled={isLoading}
                className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>

              {/* Kirim Ulang OTP */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setMessage({ text: "", type: "" });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                  disabled={isLoading}
                >
                  Kirim ulang kode OTP
                </button>
              </div>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/auth"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
