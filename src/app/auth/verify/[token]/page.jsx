'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmailPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Get token from params
    params.then(p => {
      setToken(p.token);
      verifyEmail(p.token);
    });
  }, []);

  const verifyEmail = async (tokenValue) => {
    try {
      const response = await fetch(`/api/auth/verify/${tokenValue}`);
      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email berhasil diverifikasi!');
        
        // Start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push('/auth?tab=login');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } else {
        setStatus('error');
        setMessage(data.message || 'Terjadi kesalahan saat verifikasi.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Terjadi kesalahan saat verifikasi email.');
    }
  };

  const handleLoginClick = () => {
    router.push('/auth?tab=login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      
      {/* Background Pattern - Sama dengan halaman login */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        </div>

        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      {/* Glassmorphism Container */}
      <div className="relative max-w-md w-full mx-4 backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl border border-white/30 p-10 space-y-6">
        
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-500"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Memverifikasi Email...</h2>
            <p className="text-gray-700">Mohon tunggu sebentar</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center space-y-4 animate-fadeIn">
            {/* Animated Checkmark */}
            <div className="w-24 h-24 mx-auto bg-green-100/80 backdrop-blur-sm rounded-full flex items-center justify-center animate-scaleIn shadow-lg">
              <svg
                className="w-14 h-14 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                  className="animate-checkmark"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-800">
              ✅ Verifikasi Berhasil!
            </h2>
            
            <p className="text-gray-700 text-lg font-medium">
              {message}
            </p>

            <div className="bg-green-50/80 backdrop-blur-sm border border-green-300 rounded-xl p-4 shadow-md">
              <p className="text-green-800 text-sm font-medium">
                Anda akan diarahkan ke halaman login dalam{' '}
                <span className="font-bold text-green-600 text-2xl">{countdown}</span> detik
              </p>
            </div>

            <button
              onClick={handleLoginClick}
              className="w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Login Sekarang
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center space-y-4 animate-fadeIn">
            {/* Error Icon */}
            <div className="w-24 h-24 mx-auto bg-red-100/80 backdrop-blur-sm rounded-full flex items-center justify-center animate-scaleIn shadow-lg">
              <svg
                className="w-14 h-14 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-800">
              ❌ Verifikasi Gagal
            </h2>
            
            <p className="text-gray-700 text-lg font-medium">
              {message}
            </p>

            <div className="bg-red-50/80 backdrop-blur-sm border border-red-300 rounded-xl p-4 shadow-md">
              <p className="text-red-800 text-sm font-medium">
                Silakan coba lagi atau hubungi support jika masalah berlanjut.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLoginClick}
                className="w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Ke Halaman Login
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full bg-white/30 backdrop-blur-sm text-gray-800 font-semibold py-3.5 px-6 rounded-xl hover:bg-white/50 transition-all duration-300 border border-white/50"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        )}

        {/* ChitChat Branding */}
        <div className="text-center pt-4 border-t border-white/30">
          <p className="text-gray-700 text-sm font-medium">
            ChitChat V5.1 AI - Real-time Chat App
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        @keyframes checkmark {
          0% {
            stroke-dasharray: 0 100;
          }
          100% {
            stroke-dasharray: 100 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-checkmark {
          stroke-dasharray: 100;
          animation: checkmark 0.6s ease-in-out 0.3s forwards;
        }
      `}</style>
    </div>
  );
}
