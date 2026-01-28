// src/components/ProfileClient.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AvatarUpload from "./AvatarUpload";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";
import BlockedUsersSection from "./BlockedUsersSection";
import BlockUserButton from "./BlockUserButton";

const ProfileClient = ({ user, isOwnProfile, isEmbedded = false }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, blocked

  const copyUsername = () => {
    navigator.clipboard.writeText(`@${user.username}`);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  // Apply dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <>
      <div
        className={`${
          isEmbedded
            ? "h-full w-full"
            : "min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        } relative overflow-hidden`}
      >
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.2)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        </div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

        <div
          className={`container mx-auto px-4 py-8 max-w-6xl relative z-10 ${isEmbedded ? "h-full overflow-y-auto" : ""}`}
        >
          {/* Hero Section */}
          <div className="backdrop-blur-lg bg-white/20 dark:bg-gray-900/40 rounded-3xl border border-white/30 dark:border-gray-700 shadow-2xl overflow-hidden mb-8">
            {/* Cover Gradient */}
            <div className="h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

              {/* Avatar Section - Centered */}
              <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  {/* Glassmorphism Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 p-1 animate-spin-slow"></div>
                  <div className="relative">
                    <AvatarUpload user={user} isOwnProfile={isOwnProfile} />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info - Centered */}
            <div className="pt-24 pb-8 px-8 text-center">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 mb-2">
                {user.displayName}
              </h1>

              <button
                onClick={copyUsername}
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group mb-4"
              >
                <span>@{user.username}</span>
                {copiedUsername ? (
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>

              {/* Status Badges */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium ${
                    user.isOnline
                      ? "bg-green-500/20 dark:bg-green-600/30 text-green-700 dark:text-green-400 border border-green-400/30"
                      : "bg-gray-500/20 dark:bg-gray-600/30 text-gray-700 dark:text-gray-400 border border-gray-400/30"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                      user.isOnline ? "bg-green-500" : "bg-gray-500"
                    }`}
                  ></span>
                  {user.isOnline ? "Online" : "Offline"}
                </span>

                {user.isVerified && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full backdrop-blur-md bg-blue-500/20 dark:bg-blue-600/30 text-blue-700 dark:text-blue-400 border border-blue-400/30 text-sm font-medium">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Terverifikasi
                  </span>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="max-w-2xl mx-auto mb-6">
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-500 dark:hover:to-purple-600 text-white rounded-full font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <BlockUserButton
                    userId={user._id}
                    displayName={user.displayName}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="backdrop-blur-lg bg-blue-500/10 dark:bg-blue-600/20 rounded-2xl border border-blue-400/30 dark:border-blue-500/30 p-6 text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                0
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Teman
              </div>
            </div>

            <div className="backdrop-blur-lg bg-purple-500/10 dark:bg-purple-600/20 rounded-2xl border border-purple-400/30 dark:border-purple-500/30 p-6 text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                0
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Pesan
              </div>
            </div>

            <div className="backdrop-blur-lg bg-pink-500/10 dark:bg-pink-600/20 rounded-2xl border border-pink-400/30 dark:border-pink-500/30 p-6 text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                0
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Grup
              </div>
            </div>

            <div className="backdrop-blur-lg bg-green-500/10 dark:bg-green-600/20 rounded-2xl border border-green-400/30 dark:border-green-500/30 p-6 text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {Math.floor(
                  (Date.now() - new Date(user.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                Hari Aktif
              </div>
            </div>
          </div>

          {/* Tabs - Only show for own profile */}
          {isOwnProfile && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === "overview"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "backdrop-blur-md bg-white/40 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/70"
                }`}
              >
                📋 Overview
              </button>
              <button
                onClick={() => setActiveTab("blocked")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === "blocked"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "backdrop-blur-md bg-white/40 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/70"
                }`}
              >
                🚫 Blocked Users
              </button>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Information Card */}
              <div className="md:col-span-2 backdrop-blur-lg bg-white/20 dark:bg-gray-900/40 rounded-2xl border border-white/30 dark:border-gray-700 shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Informasi Profil
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start p-4 backdrop-blur-md bg-white/30 dark:bg-gray-800/50 rounded-xl hover:bg-white/40 dark:hover:bg-gray-800/60 transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Nama Lengkap
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium text-lg">
                        {user.displayName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 backdrop-blur-md bg-white/30 dark:bg-gray-800/50 rounded-xl hover:bg-white/40 dark:hover:bg-gray-800/60 transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6 text-white"
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
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Email
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium text-lg">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 backdrop-blur-md bg-white/30 dark:bg-gray-800/50 rounded-xl hover:bg-white/40 dark:hover:bg-gray-800/60 transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Username
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium text-lg">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start p-4 backdrop-blur-md bg-white/30 dark:bg-gray-800/50 rounded-xl hover:bg-white/40 dark:hover:bg-gray-800/60 transition-all group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Tanggal Bergabung
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                {isOwnProfile && (
                  <div className="backdrop-blur-lg bg-white/20 dark:bg-gray-900/40 rounded-2xl border border-white/30 dark:border-gray-700 shadow-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setIsChangePasswordModalOpen(true)}
                        className="w-full flex items-center justify-center px-4 py-3 backdrop-blur-md bg-orange-500/20 dark:bg-orange-600/30 hover:bg-orange-500/30 dark:hover:bg-orange-600/40 text-orange-700 dark:text-orange-400 border border-orange-400/30 rounded-xl font-medium transition-all transform hover:scale-105"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
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
                        Ganti Password
                      </button>
                      <Link
                        href="/dashboard"
                        className="w-full flex items-center justify-center px-4 py-3 backdrop-blur-md bg-white/40 dark:bg-gray-800/50 hover:bg-white/60 dark:hover:bg-gray-800/70 text-gray-800 dark:text-white rounded-xl font-medium transition-all"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        Dashboard
                      </Link>
                    </div>
                  </div>
                )}

                {/* Account Status */}
                <div className="backdrop-blur-lg bg-white/20 dark:bg-gray-900/40 rounded-2xl border border-white/30 dark:border-gray-700 shadow-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Status Akun
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 backdrop-blur-md bg-white/30 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-gray-600 dark:text-gray-300">
                        Status
                      </span>
                      <span
                        className={`font-medium ${user.isOnline ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
                      >
                        {user.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 backdrop-blur-md bg-white/30 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-gray-600 dark:text-gray-300">
                        Verifikasi
                      </span>
                      <span
                        className={`font-medium ${user.isVerified ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {user.isVerified ? "Terverifikasi" : "Belum"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Blocked Users Tab */}
          {activeTab === "blocked" && isOwnProfile && (
            <div className="backdrop-blur-lg bg-white/20 dark:bg-gray-900/40 rounded-2xl border border-white/30 dark:border-gray-700 shadow-xl p-6">
              <BlockedUsersSection />
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Change Password Modal */}
      {isOwnProfile && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProfileClient;
