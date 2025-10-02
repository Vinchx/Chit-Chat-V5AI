'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-100 via-orange-50 to-pink-100">
            <div className="text-center p-8 max-w-md">
                <div className="mb-8">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Oops! Terjadi Kesalahan
                    </h1>
                    <p className="text-gray-600 mb-2">
                        Maaf, ada yang tidak beres. Silakan coba lagi.
                    </p>
                    {error?.message && (
                        <p className="text-sm text-gray-500 mt-4 p-3 bg-white/50 rounded-lg">
                            {error.message}
                        </p>
                    )}
                </div>

                <button
                    onClick={reset}
                    className="px-8 py-3 bg-gradient-to-r from-red-400 to-pink-400 text-white font-semibold rounded-xl hover:from-red-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    Coba Lagi
                </button>
            </div>
        </div>
    );
}
