'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

export default function AuthPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    // Cek apakah user sudah login saat component mount
    useEffect(() => {
        if (status === 'authenticated') {
            // Kalau sudah login, redirect ke dashboard
            router.push('/dashboard');
        }
    }, [status, router]);

    // State untuk switch antara sign in dan sign up
    const [isSignUp, setIsSignUp] = useState(false);

    // State untuk data form
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        displayName: ''
    });

    // State untuk loading dan pesan
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Fungsi buat ganti-ganti input
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setMessage({ text: '', type: '' });
    };

    // Fungsi untuk handle Enter key
    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter' && !isLoading) {
            action();
        }
    };

    // Fungsi register - kirim ke API beneran
    const handleRegister = async () => {
        // Validasi semua field harus diisi
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.displayName) {
            setMessage({ text: 'Semua field harus diisi!', type: 'error' });
            return;
        }

        // Validasi password minimal 8 karakter
        if (formData.password.length < 8) {
            setMessage({ text: 'Password minimal 8 karakter!', type: 'error' });
            return;
        }

        // Validasi password dan confirm password harus sama
        if (formData.password !== formData.confirmPassword) {
            setMessage({ text: 'Password dan Confirm Password tidak sama!', type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    displayName: formData.displayName
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ text: 'Akun berhasil dibuat! Silakan login.', type: 'success' });
                setFormData({ username: '', email: '', password: '', confirmPassword: '', displayName: '' });
                setTimeout(() => setIsSignUp(false), 2000);
            } else {
                setMessage({ text: data.message, type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Terjadi kesalahan. Coba lagi nanti.', type: 'error' });
        }

        setIsLoading(false);
    };

    // Fungsi login - gunakan NextAuth
    const handleLogin = async () => {
        if (!formData.email || !formData.password) {
            setMessage({ text: 'Username/email dan password harus diisi!', type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const result = await signIn('credentials', {
                login: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setMessage({ text: result.error, type: 'error' });
            } else {
                setMessage({ text: 'Login berhasil! Mengalihkan...', type: 'success' });
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);
            }
        } catch (error) {
            setMessage({ text: 'Terjadi kesalahan. Coba lagi nanti.', type: 'error' });
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

            {/* Background Pattern - Sama kayak sebelumnya */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
                <div className="absolute inset-0 opacity-30">
                    <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
                </div>

                {/* Floating shapes */}
                <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
            </div>

            {/* Main Container - Struktur kayak code asli */}
            <div className={`relative w-full max-w-4xl mx-4 h-[500px] ${isSignUp ? 'right-panel-active' : ''}`} id="container">

                {/* Glassmorphism Container - Pengganti .container */}
                <div className="relative w-full h-full backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">

                    {/* Sign Up Container - Panel Register */}
                    <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center p-8 transition-all duration-700 ${isSignUp ? 'translate-x-full opacity-100 z-20' : 'translate-x-0 opacity-0 z-0'}`}>
                        <div className="space-y-4">
                            <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">Buat Akun</h1>

                            {/* Pesan Error/Success */}
                            {message.text && (
                                <div className={`p-3 rounded-lg text-center text-sm font-medium ${message.type === 'success'
                                    ? 'bg-green-100/80 text-green-700 border border-green-300'
                                    : 'bg-red-100/80 text-red-700 border border-red-300'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <input
                                title='cok'
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2.5 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600 text-sm"
                                disabled={isLoading}
                                suppressHydrationWarning={true}
                            />

                            <input
                                type="text"
                                name="displayName"
                                placeholder="Display Name"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2.5 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600 text-sm"
                                disabled={isLoading}
                                suppressHydrationWarning={true}
                            />

                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2.5 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600 text-sm"
                                disabled={isLoading}
                                suppressHydrationWarning={true}
                            />

                            <input
                                type="password"
                                name="password"
                                placeholder="Password (min. 8 karakter)"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2.5 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600 text-sm"
                                disabled={isLoading}
                                suppressHydrationWarning={true}
                            />

                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                onKeyDown={(e) => handleKeyDown(e, handleRegister)}
                                className="w-full px-3 py-2.5 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600 text-sm"
                                disabled={isLoading}
                                suppressHydrationWarning={true}
                            />

                            <button
                                onClick={handleRegister}
                                disabled={isLoading}
                                className={`w-full py-2.5 font-semibold rounded-lg transition-all duration-300 text-sm ${isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Loading...
                                    </div>
                                ) : (
                                    'Daftar'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Sign In Container - Panel Login */}
                    <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center p-8 transition-all duration-700 ${isSignUp ? 'translate-x-full opacity-0 z-0' : 'translate-x-0 opacity-100 z-20'}`}>
                        <div className="space-y-6">
                            <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">Masuk</h1>

                            {/* Pesan Error/Success */}
                            {message.text && (
                                <div className={`p-3 rounded-lg text-center text-sm font-medium ${message.type === 'success'
                                    ? 'bg-green-100/80 text-green-700 border border-green-300'
                                    : 'bg-red-100/80 text-red-700 border border-red-300'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <input
                                type="text"
                                name="email"
                                placeholder="Username atau Email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600"
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
                                className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600"
                                disabled={isLoading}
                                suppressHydrationWarning={true}
                            />

                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className={`w-full py-3 font-semibold rounded-xl transition-all duration-300 ${isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-400 to-purple-400 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Loading...
                                    </div>
                                ) : (
                                    'Masuk'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Overlay Container - Panel yang geser */}
                    <div className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 z-30 ${isSignUp ? '-translate-x-full' : 'translate-x-0'}`}>
                        <div className={`relative left-[-100%] h-full w-[200%] bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 transition-transform duration-700 ${isSignUp ? 'translate-x-1/2' : 'translate-x-0'}`}>

                            {/* Overlay Left - Muncul saat mode Register */}
                            <div className={`absolute left-0 w-1/2 h-full flex flex-col items-center justify-center p-8 text-white transition-transform duration-700 ${isSignUp ? 'translate-x-0' : '-translate-x-5'}`}>
                                <h1 className="text-3xl font-bold mb-4">Selamat Datang!</h1>
                                <p className="text-center mb-8 opacity-90">Masuk dengan akun yang sudah kamu punya untuk mulai ngobrol</p>
                                <button
                                    onClick={() => setIsSignUp(false)}
                                    className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl bg-transparent hover:bg-white hover:text-blue-500 transition-all duration-300"
                                >
                                    Masuk
                                </button>
                            </div>

                            {/* Overlay Right - Muncul saat mode Login */}
                            <div className={`absolute right-0 w-1/2 h-full flex flex-col items-center justify-center p-8 text-white transition-transform duration-700 ${isSignUp ? 'translate-x-5' : 'translate-x-0'}`}>
                                <h1 className="text-3xl font-bold mb-4">Halo, Teman!</h1>
                                <p className="text-center mb-8 opacity-90">Daftar sekarang dan mulai perjalanan chatting seru bersama kami</p>
                                <button
                                    onClick={() => setIsSignUp(true)}
                                    className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl bg-transparent hover:bg-white hover:text-purple-500 transition-all duration-300"
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