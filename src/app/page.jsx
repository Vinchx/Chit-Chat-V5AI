'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Cek apakah user sudah login
    const token = localStorage.getItem('token');

    if (token) {
      // Kalau sudah login, langsung ke dashboard
      router.push('/dashboard');
    } else {
      // Kalau belum login, ke auth
      router.push('/auth');
    }
  }, [router]);

  // Loading state sementara redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading ChitChat...</p>
      </div>
    </div>
  );
}
