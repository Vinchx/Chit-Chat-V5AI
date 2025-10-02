export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
            <div className="text-center">
                <div className="inline-block relative">
                    {/* Spinner */}
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-700 font-medium">Loading...</p>
            </div>
        </div>
    );
}
