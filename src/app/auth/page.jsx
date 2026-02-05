"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import LightPillar from "@/components/LightPillar";

export default function AuthPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Cek apakah user sudah login saat component mount
  useEffect(() => {
    if (status === "authenticated") {
      // Kalau sudah login, redirect ke dashboard
      router.push("/dashboard");
    }
  }, [status, router]);

  // State untuk switch antara sign in dan sign up
  const [isSignUp, setIsSignUp] = useState(false);

  // State untuk data form
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  // State untuk loading dan pesan
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Fungsi buat ganti-ganti input
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage({ text: "", type: "" });
  };

  // Fungsi untuk handle Enter key
  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" && !isLoading) {
      action();
    }
  };

  // State untuk OTP verification step
  const [verificationStep, setVerificationStep] = useState(false);
  const [otp, setOtp] = useState("");

  // Fungsi register - kirim ke API beneran
  const handleRegister = async () => {
    // Validasi semua field harus diisi
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.displayName
    ) {
      setMessage({ text: "Semua field harus diisi!", type: "error" });
      return;
    }

    // Validasi password minimal 8 karakter
    if (formData.password.length < 8) {
      setMessage({ text: "Password minimal 8 karakter!", type: "error" });
      return;
    }

    // Validasi password dan confirm password harus sama
    if (formData.password !== formData.confirmPassword) {
      setMessage({
        text: "Password dan Confirm Password tidak sama!",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          text: "Registrasi berhasil! Silakan cek email untuk kode OTP.",
          type: "success",
        });
        // Pindah ke step verifikasi OTP
        setVerificationStep(true);
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

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setMessage({ text: "Masukkan 6 digit kode OTP!", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/auth/verify/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          text: "Verifikasi berhasil! Mengalihkan ke login...",
          type: "success",
        });
        setTimeout(() => {
          setVerificationStep(false);
          setIsSignUp(false); // Switch to login view
          setFormData({ ...formData, password: "", confirmPassword: "" }); // Clear passwords
          setOtp("");
        }, 2000);
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Gagal memverifikasi OTP.", type: "error" });
    }
    setIsLoading(false);
  };

  // Fungsi untuk mengirim ulang email verifikasi
  const handleResendVerification = async () => {
    if (!formData.email) {
      setMessage({
        text: "Silakan masukkan email Anda terlebih dahulu!",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: data.message, type: "success" });
      } else {
        setMessage({ text: data.message, type: "error" });
      }
    } catch (error) {
      setMessage({
        text: "Terjadi kesalahan saat mengirim email verifikasi. Coba lagi nanti.",
        type: "error",
      });
    }

    setIsLoading(false);
  };

  // Fungsi login - gunakan NextAuth
  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setMessage({
        text: "Username/email dan password harus diisi!",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const result = await signIn("credentials", {
        login: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // Tampilkan pesan error yang spesifik dari backend
        let errorMessage = result.error;

        // Cek berbagai jenis error dan berikan pesan yang sesuai
        if (result.error.includes("User tidak ditemukan")) {
          errorMessage =
            "Email atau username tidak ditemukan. Silakan periksa kembali atau daftar akun baru.";
        } else if (result.error.includes("Password salah")) {
          errorMessage =
            "Password yang Anda masukkan salah. Silakan coba lagi.";
        } else if (result.error.includes("Akun belum terverifikasi")) {
          errorMessage =
            "Akun Anda belum terverifikasi. Silakan cek email untuk link verifikasi atau kirim ulang email verifikasi.";
        } else if (
          result.error.includes("Configuration") ||
          result.error === "CredentialsSignin"
        ) {
          // Error generic dari NextAuth, tampilkan pesan yang lebih friendly
          errorMessage =
            "Login gagal. Silakan periksa email/username dan password Anda.";
        }

        setMessage({ text: errorMessage, type: "error" });
      } else {
        setMessage({ text: "Login berhasil! Mengalihkan...", type: "success" });
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error) {
      setMessage({
        text: "Terjadi kesalahan. Coba lagi nanti.",
        type: "error",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-gray-900 overflow-hidden">
      {/* Background Pattern - Sama kayak sebelumnya */}
      {/* Background Pattern - LightPillar */}
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

      {/* Main Container - Struktur kayak code asli */}
      <div
        className={`relative w-full max-w-4xl mx-4 h-[500px] ${isSignUp ? "right-panel-active" : ""}`}
        id="container"
      >
        {/* Glassmorphism Container - Pengganti .container */}
        <div className="relative w-full h-full backdrop-blur-lg bg-gray-900/40 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Verification Step Container */}
          <div
            className={`absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center p-8 transition-all duration-500 z-50 bg-gray-900/90 ${verificationStep ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
          >
            <div className="w-full max-w-md space-y-6 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Verifikasi Email
                </h2>
                <p className="text-gray-300">
                  Kami telah mengirimkan kode OTP ke{" "}
                  <strong>{formData.email}</strong>
                </p>
              </div>

              {message.text && (
                <div
                  className={`p-3 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-green-100/10 text-green-400" : "bg-red-100/10 text-red-400"}`}
                >
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Masukkan 6 digit Kode OTP"
                  className="w-full text-center text-2xl tracking-widest px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 text-white placeholder-gray-600 font-mono"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />

                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length < 6}
                  className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 ${
                    isLoading || otp.length < 6
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {isLoading ? "Memverifikasi..." : "Verifikasi Akun"}
                </button>

                <div className="flex justify-between text-sm mt-4">
                  <button
                    onClick={() => setVerificationStep(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleResendVerification}
                    className="text-blue-400 hover:text-blue-300"
                    disabled={isLoading}
                  >
                    Kirim Ulang Kode
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Up Container - Panel Register */}
          <div
            className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center p-8 transition-all duration-700 ${isSignUp ? "translate-x-full opacity-100 z-20" : "translate-x-0 opacity-0 z-0"}`}
          >
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white text-center mb-6">
                Buat Akun
              </h1>

              {/* Pesan Error/Success */}
              {message.text && (
                <div
                  className={`p-3 rounded-lg text-center text-sm font-medium ${
                    message.type === "success"
                      ? "bg-green-100/80 text-green-700 border border-green-300"
                      : "bg-red-100/80 text-red-700 border border-red-300"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <input
                type="text"
                title="Username"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-gray-500/50 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-white placeholder-white text-sm"
                disabled={isLoading}
                suppressHydrationWarning={true}
              />

              <input
                type="text"
                title="Display Name"
                name="displayName"
                placeholder="Display Name"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-gray-500/50 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-white placeholder-white text-sm"
                disabled={isLoading}
                suppressHydrationWarning={true}
              />

              <input
                type="email"
                title="Email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-gray-500/50 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-white placeholder-white text-sm"
                disabled={isLoading}
                suppressHydrationWarning={true}
              />

              <input
                type="password"
                title="Password"
                name="password"
                placeholder="Password (min. 8 karakter)"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 bg-gray-500/50 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-white placeholder-white text-sm"
                disabled={isLoading}
                suppressHydrationWarning={true}
              />

              <input
                type="password"
                title="Confirm Password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                className="w-full px-3 py-2.5 bg-gray-500/50 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-white placeholder-white text-sm"
                disabled={isLoading}
                suppressHydrationWarning={true}
              />

              <button
                onClick={handleRegister}
                disabled={isLoading}
                className={`w-full py-2.5 font-semibold rounded-lg transition-all duration-300 text-sm ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-300 to-purple-300 text-white hover:from-blue-300 hover:to-purple-300 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  "Daftar"
                )}
              </button>
            </div>
          </div>

          {/* Sign In Container - Panel Login */}
          <div
            className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center p-8 transition-all duration-700 ${isSignUp ? "translate-x-full opacity-0 z-0" : "translate-x-0 opacity-100 z-20"}`}
          >
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-white text-center mb-8">
                Masuk
              </h1>

              {/* Pesan Error/Success */}
              {message.text && (
                <div
                  className={`p-3 rounded-lg text-center text-sm font-medium ${
                    message.type === "success"
                      ? "bg-green-100/80 text-green-700 border border-green-300"
                      : "bg-red-100/80 text-red-700 border border-red-300"
                  }`}
                >
                  {message.text}

                  {/* Tampilkan tombol kirim ulang verifikasi jika pesan terkait verifikasi */}
                  {message.text.includes("Akun Anda belum terverifikasi") && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={isLoading}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Kirim Ulang Email Verifikasi
                      </button>
                    </div>
                  )}
                </div>
              )}

              <input
                type="text"
                name="email"
                placeholder="Username atau Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-500/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-white placeholder-white"
                onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                disabled={isLoading}
                suppressHydrationWarning={true}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={(e) => handleKeyDown(e, handleLogin)}
                className="w-full px-4 py-3 bg-gray-500/50 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-white placeholder-white"
                disabled={isLoading}
                suppressHydrationWarning={true}
              />

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-300 to-purple-300 text-gray-100 hover:from-blue-300 hover:to-purple-300 shadow-lg hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  "Masuk"
                )}
              </button>

              {/* Lupa Password Link */}
              <div className="text-center">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-white hover:text-blue-800 transition-colors"
                >
                  Lupa Password?
                </Link>
              </div>
            </div>
          </div>

          {/* Overlay Container - Panel yang geser */}
          <div
            className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 z-30 ${isSignUp ? "-translate-x-full" : "translate-x-0"}`}
          >
            <div
              className={`relative left-[-100%] h-full w-[200%] bg-gradient-to-r from-blue-300 via-purple-200/90 to-indigo-400 transition-transform duration-700 ${isSignUp ? "translate-x-1/2" : "translate-x-0"}`}
            >
              {/* Overlay Left - Muncul saat mode Register */}
              <div
                className={`absolute left-0 w-1/2 h-full flex flex-col items-center justify-center p-8 text-white transition-transform duration-700 ${isSignUp ? "translate-x-0" : "-translate-x-5"}`}
              >
                <h1 className="text-3xl font-bold mb-4">Selamat Datang!</h1>
                <p className="text-center mb-8 opacity-90">
                  Masuk dengan akun yang sudah kamu punya untuk mulai ngobrol
                </p>
                <button
                  onClick={() => setIsSignUp(false)}
                  className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl bg-transparent hover:bg-white hover:text-blue-400 transition-all duration-300"
                >
                  Masuk
                </button>
              </div>

              {/* Overlay Right - Muncul saat mode Login */}
              <div
                className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center p-8 text-white transition-transform duration-700 ${isSignUp ? "translate-x-5" : "translate-x-0"}`}
              >
                <h1 className="text-3xl font-bold mb-4">Halo, Teman!</h1>
                <p className="text-center mb-8 opacity-90">
                  Daftar sekarang dan mulai perjalanan chatting seru bersama
                  kami
                </p>
                <button
                  onClick={() => setIsSignUp(true)}
                  className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl bg-transparent hover:bg-white hover:text-purple-400 transition-all duration-300"
                >
                  Daftar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
