"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import Image from "next/image";

export default function ViewAllUsersPage() {
  const router = useRouter();
  const { isAdminAuthed, isLoading } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, online, offline, banned

  useEffect(() => {
    if (isAdminAuthed) {
      fetchUsers();
    }
  }, [isAdminAuthed]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Gagal memuat users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleBanUser = async (userId, currentBanStatus) => {
    const action = currentBanStatus ? "unban" : "ban";
    if (!confirm(`Yakin ingin ${action} user ini?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !currentBanStatus }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`User berhasil di-${action}!`);
        fetchUsers(); // Refresh list
      } else {
        toast.error(data.message || `Gagal ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast.error("Terjadi kesalahan");
    }
  };

  // Filter users based on search and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "online" && user.isOnline) ||
      (filterStatus === "offline" && !user.isOnline) ||
      (filterStatus === "banned" && user.isBanned);

    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdminAuthed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/vinchx/dashboard")}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white">All Users</h1>
          <p className="text-gray-400 mt-2">
            Manage and view all registered users
          </p>
        </div>

        {/* Search & Filter */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by username, email, or display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setFilterStatus("online")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === "online"
                    ? "bg-green-500 text-white"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                }`}
              >
                🟢 Online
              </button>
              <button
                onClick={() => setFilterStatus("offline")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === "offline"
                    ? "bg-gray-500 text-white"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                }`}
              >
                ⚫ Offline
              </button>
              <button
                onClick={() => setFilterStatus("banned")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === "banned"
                    ? "bg-red-500 text-white"
                    : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                }`}
              >
                🚫 Banned
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Users ({filteredUsers.length})
          </h2>

          <div className="space-y-3">
            {loadingUsers ? (
              <div className="text-center text-gray-400 py-8">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`bg-gray-700/50 rounded-lg p-4 border ${
                    user.isBanned ? "border-red-500/50" : "border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <Image
                            src={user.avatar.replace(/\\/g, "/")}
                            alt={user.displayName || user.username}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.displayName?.[0] || user.username?.[0] || "?"}
                          </div>
                        )}
                        {/* Online indicator */}
                        {user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-700 rounded-full"></div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium">
                            {user.displayName || user.username}
                          </h3>
                          {user.isVerified && (
                            <span className="text-blue-400" title="Verified">
                              ✓
                            </span>
                          )}
                          {user.isBanned && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                              BANNED
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          @{user.username}
                        </p>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        {user.bio && (
                          <p className="text-gray-400 text-sm mt-1">
                            {user.bio}
                          </p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="text-right text-sm text-gray-400">
                        <p>ID: {user._id}</p>
                        <p>
                          Joined:{" "}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        {user.warningCount > 0 && (
                          <p className="text-yellow-400">
                            ⚠️ Warnings: {user.warningCount}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/profile/${user._id}`)
                        }
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        👁️ View Profile
                      </button>
                      <button
                        onClick={() => handleBanUser(user._id, user.isBanned)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          user.isBanned
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                      >
                        {user.isBanned ? "✅ Unban" : "🚫 Ban"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
