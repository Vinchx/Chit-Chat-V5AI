// src/components/Navbar.jsx
'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import UserAvatar from './UserAvatar';

const Navbar = () => {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">ChitChat</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Beranda
              </Link>
              <Link
                href="/rooms"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Room
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {session && session.user ? (
              // Jika user login, tampilkan avatar dan menu dropdown
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <Link href="/profile" className="text-gray-700 hover:text-gray-900">
                    <UserAvatar user={session.user} size="md" />
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth' })}
                    className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              // Jika tidak login, tampilkan tombol login
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Masuk
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;