// src/components/ChatProfileSidebar.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const ChatProfileSidebar = ({ isOpen, onClose, userId, roomId }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAllMediaModalOpen, setIsAllMediaModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      console.log("ChatProfileSidebar opened with userId:", userId);
      loadUserProfile();
      loadSharedMedia(9); // Always load 9 initially
    }
  }, [isOpen, userId]);

  const openAllMediaModal = () => {
    setIsAllMediaModalOpen(true);
    loadSharedMedia(100); // Load more for modal
  };

  const closeAllMediaModal = () => {
    setIsAllMediaModalOpen(false);
    // Optional: Reset to 9 to save memory/keep state clean, but not strictly necessary
    // loadSharedMedia(9);
  };

  const loadUserProfile = async () => {
    // Don't load if userId is not available
    if (!userId) {
      console.warn("ChatProfileSidebar: userId is not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // console.log("=== ChatProfileSidebar Debug ===");
      // console.log("userId:", userId);
      // console.log("userId type:", typeof userId);
      // console.log("API URL:", `/api/users/${userId}`);

      const response = await fetch(`/api/users/${userId}`);
      // console.log("Response status:", response.status);
      // console.log("Response ok:", response.ok);

      const data = await response.json();
      // console.log("Response data:", JSON.stringify(data, null, 2));

      if (data.success && data.user) {
        // console.log("User loaded successfully:", data.user.displayName);
        setUser(data.user);
      } else {
        console.error("Failed to load user - API returned:", data);
        setUser(null);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedMedia = async (limit = 9) => {
    if (!roomId) {
      console.warn("ChatProfileSidebar: roomId is not available for media");
      return;
    }

    try {
      setLoadingMedia(true);
      const response = await fetch(
        `/api/messages/room/${roomId}/media?limit=${limit}`,
      );
      const data = await response.json();

      if (data.success && data.data.media) {
        setSharedMedia(data.data.media);
      } else {
        setSharedMedia([]);
      }
    } catch (error) {
      console.error("Error loading shared media:", error);
      setSharedMedia([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const normalizeAvatar = (avatar) => {
    return avatar ? avatar.replace(/\\/g, "/") : null;
  };

  const isImage = (media) => {
    if (media.type?.startsWith("image/")) return true;
    const ext = media.filename?.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
  };

  const getFileStyle = (filename) => {
    const ext = filename?.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return {
          bg: "bg-red-50",
          text: "text-red-500",
          icon: (
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 3v6h6M9 13h6M9 17h4"
              />
            </svg>
          ),
        };
      case "doc":
      case "docx":
        return {
          bg: "bg-blue-50",
          text: "text-blue-500",
          icon: (
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
              />
            </svg>
          ),
        };
      case "xls":
      case "xlsx":
      case "csv":
        return {
          bg: "bg-green-50",
          text: "text-green-500",
          icon: (
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v13.5c0 .621.504 1.125 1.125 1.125h6.25a1.125 1.125 0 011.125 1.125v9.375m-8.25-3l1.5 1.5 3-3m-3 3l-1.5-1.5"
              />
            </svg>
          ),
        };
      case "zip":
      case "rar":
      case "7z":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-600",
          icon: (
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          ),
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-500",
          icon: (
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          ),
        };
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-800">Info Kontak</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : !userId ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-gray-500">Info kontak tidak tersedia</p>
            </div>
          </div>
        ) : user ? (
          <div className="p-6 space-y-6">
            {/* Profile Section */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                {normalizeAvatar(user.avatar) ? (
                  <Image
                    src={normalizeAvatar(user.avatar)}
                    alt={user.displayName}
                    fill
                    className="rounded-full object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {getInitials(user.displayName)}
                  </div>
                )}

                {/* Online Status */}
                <div
                  className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${
                    user.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {user.displayName}
              </h2>
              <p className="text-gray-600 mb-2">@{user.username}</p>

              {user.isVerified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <svg
                    className="w-4 h-4 mr-1"
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

              {user.bio && (
                <p className="mt-4 text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                  {user.bio}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/profile/${userId}`)}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Lihat Profil Lengkap
              </button>

              <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-all">
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Mute Notifikasi
              </button>
            </div>

            {/* Info Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-500 uppercase">
                Informasi
              </h4>

              <div className="flex items-start p-3 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-900 font-medium break-all">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start p-3 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-purple-600"
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
                  <p className="text-xs text-gray-500 mb-1">Username</p>
                  <p className="text-sm text-gray-900 font-medium">
                    @{user.username}
                  </p>
                </div>
              </div>

              <div className="flex items-start p-3 bg-gray-50 rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-green-600"
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
                  <p className="text-xs text-gray-500 mb-1">Bergabung</p>
                  <p className="text-sm text-gray-900 font-medium">
                    {new Date(user.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Shared Media */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-500 uppercase">
                  Media Bersama{" "}
                  {sharedMedia.length > 0 && `(${sharedMedia.length})`}
                </h4>
                {sharedMedia.length > 0 && (
                  <button
                    onClick={openAllMediaModal}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none"
                  >
                    Lihat Semua
                  </button>
                )}
              </div>

              {loadingMedia ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : sharedMedia.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    Belum ada media yang dibagikan
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {sharedMedia.slice(0, 9).map((media) => {
                    const isImg = isImage(media);
                    const fileStyle = !isImg
                      ? getFileStyle(media.filename)
                      : null;

                    return isImg ? (
                      <button
                        key={media.id}
                        onClick={() => setSelectedImage(media)}
                        className="aspect-square relative rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Image
                          src={media.url}
                          alt={media.filename || "Shared media"}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="100px"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </button>
                    ) : (
                      <a
                        key={media.id}
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`aspect-square relative rounded-xl overflow-hidden ${fileStyle.bg} hover:brightness-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex flex-col items-center justify-center p-2 group text-center border border-transparent hover:border-black/5 hover:shadow-sm`}
                      >
                        <div
                          className={`${fileStyle.text} mb-2 transform group-hover:scale-110 transition-transform duration-300`}
                        >
                          {fileStyle.icon}
                        </div>
                        <span
                          className={`text-[10px] font-semibold opacity-70 truncate w-full ${fileStyle.text}`}
                        >
                          {media.filename?.split(".").pop()?.toUpperCase() ||
                            "FILE"}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <button className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Laporkan Kontak
              </button>

              <button className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all">
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
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                Blokir Kontak
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">User tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* All Media Modal */}
      {isAllMediaModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Media Bersama ({sharedMedia.length})
              </h3>
              <button
                onClick={closeAllMediaModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              {loadingMedia && sharedMedia.length <= 9 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {sharedMedia.map((media) => {
                    const isImg = isImage(media);
                    const fileStyle = !isImg
                      ? getFileStyle(media.filename)
                      : null;

                    return isImg ? (
                      <button
                        key={media.id}
                        onClick={() => setSelectedImage(media)}
                        className="aspect-square relative rounded-xl overflow-hidden group hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <Image
                          src={media.url}
                          alt={media.filename || "Shared media"}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </button>
                    ) : (
                      <a
                        key={media.id}
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`aspect-square relative rounded-xl overflow-hidden ${fileStyle.bg} hover:brightness-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex flex-col items-center justify-center p-3 group text-center border border-transparent hover:border-black/5 hover:shadow-md`}
                      >
                        <div
                          className={`${fileStyle.text} mb-3 transform group-hover:scale-110 transition-transform duration-300`}
                        >
                          {fileStyle.icon}
                        </div>
                        <span
                          className={`text-xs font-semibold opacity-70 truncate w-full ${fileStyle.text}`}
                        >
                          {media.filename?.split(".").pop()?.toUpperCase() ||
                            "FILE"}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1 truncate w-4/5">
                          {media.filename}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Image */}
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage.url}
                alt={selectedImage.filename || "Preview"}
                fill
                className="object-contain"
                sizes="100vw"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Image info */}
            <div className="text-center mt-4 text-white">
              <p className="text-sm opacity-80">{selectedImage.filename}</p>
              {selectedImage.timestamp && (
                <p className="text-xs opacity-60 mt-1">
                  {new Date(selectedImage.timestamp).toLocaleDateString(
                    "id-ID",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatProfileSidebar;
