import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
            <div className="text-center p-8">
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        404
                    </h1>
                    <p className="text-2xl font-semibold text-gray-800 mt-4">
                        Halaman Tidak Ditemukan
                    </p>
                    <p className="text-gray-600 mt-2">
                        Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
                    </p>
                </div>

                <Link
                    href="/"
                    className="inline-block px-8 py-3 bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
