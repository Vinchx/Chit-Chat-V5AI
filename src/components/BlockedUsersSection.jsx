// src/components/BlockedUsersSection.jsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";

const BlockedUsersSection = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users/block");
      const data = await res.json();

      if (data.success) {
        setBlockedUsers(data.data.blockedUsers);
      } else {
        toast.error("Gagal memuat daftar user yang diblokir");
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = (userId, displayName) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Unblock {displayName}?</p>
          <p className="text-sm text-gray-600">
            User ini bisa mengirim friend request kembali.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t);
                try {
                  const res = await fetch(`/api/users/block?userId=${userId}`, {
                    method: "DELETE",
                  });
                  const data = await res.json();

                  if (data.success) {
                    toast.success(data.message);
                    // Refresh list
                    fetchBlockedUsers();
                  } else {
                    toast.error(data.message);
                  }
                } catch (error) {
                  console.error("Error unblocking user:", error);
                  toast.error("Terjadi kesalahan");
                }
              }}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
            >
              Unblock
            </button>
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
            >
              Batal
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
      },
    );
  };

  const normalizeAvatar = (avatar) => {
    return avatar ? avatar.replace(/\\/g, "/") : null;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Memuat daftar blocked users...
          </p>
        </div>
      </div>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Tidak ada user yang diblokir
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Ketika kamu memblock user, mereka tidak bisa mengirim friend request
          ke kamu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Blocked Users ({blockedUsers.length})
        </h3>
      </div>

      <div className="grid gap-3">
        {blockedUsers.map((user) => (
          <div
            key={user.blockId}
            className="flex items-center gap-4 p-4 backdrop-blur-md bg-white/40 dark:bg-gray-800/50 hover:bg-white/60 dark:hover:bg-gray-800/70 rounded-xl border border-white/30 dark:border-gray-700 transition-all group"
          >
            {/* Avatar */}
            <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-gray-700">
              {normalizeAvatar(user.avatar) ? (
                <Image
                  src={normalizeAvatar(user.avatar)}
                  alt={user.displayName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(user.displayName)}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {user.displayName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                @{user.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                {user.type === "block" ? "🚫 Blocked" : "🔇 Muted"} •{" "}
                {new Date(user.blockedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Unblock Button */}
            <button
              onClick={() => handleUnblock(user.userId, user.displayName)}
              className="px-4 py-2 bg-blue-500/20 dark:bg-blue-600/30 hover:bg-blue-500/30 dark:hover:bg-blue-600/40 text-blue-700 dark:text-blue-400 border border-blue-400/30 rounded-lg font-medium transition-all flex items-center gap-2 group-hover:scale-105"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              Unblock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockedUsersSection;
