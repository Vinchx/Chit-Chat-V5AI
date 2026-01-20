"use client";

export default function DashboardPage() {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center p-8">
        <div className="text-6xl mb-6">💬</div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
          Welcome to ChitChat
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Pilih chat dari sidebar untuk memulai percakapan
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          atau tambah teman baru untuk chat pertama kali!
        </p>
      </div>
    </div>
  );
}
