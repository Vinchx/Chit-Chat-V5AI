"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { clearAdminToken } from "@/lib/admin-session";
import { clearAllCookies } from "@/lib/cookie-utils";
import { toast } from "sonner";

export default function AdminDashboard() {
  const router = useRouter();
  const { isAdminAuthed, isLoading, session } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: "", endDate: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Fetch admin stats when component mounts and auth is confirmed
  React.useEffect(() => {
    if (isAdminAuthed) {
      fetchAdminStats();
    }
  }, [isAdminAuthed]); // Only depend on isAdminAuthed

  const fetchAdminStats = async (startDate = "", endDate = "", page = 1) => {
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
      }
      params.append("page", page);
      params.append("limit", itemsPerPage);

      const url = `/api/admin/stats?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      setStats(data);

      // Show toast if filtering and no results found
      if (
        startDate &&
        endDate &&
        (!data.recentUsers || data.recentUsers.length === 0)
      ) {
        toast.info("Tidak ada user yang daftar pada rentang tanggal tersebut", {
          description: `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error("Gagal memuat data statistik");
    }
  };

  const handleDateFilter = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      setCurrentPage(1);
      fetchAdminStats(dateFilter.startDate, dateFilter.endDate, 1);
    }
  };

  const handleResetFilter = () => {
    setDateFilter({ startDate: "", endDate: "" });
    setCurrentPage(1);
    fetchAdminStats("", "", 1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchAdminStats(dateFilter.startDate, dateFilter.endDate, newPage);
  };

  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    fetchAdminStats(dateFilter.startDate, dateFilter.endDate, 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdminAuthed) {
    return null; // useAdminAuth will handle redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400">
              Welcome,{" "}
              {session?.user?.displayName || session?.user?.email || "Admin"}
            </p>
          </div>
          {/* Logout Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="px-6 py-3 bg-gray-700/50 hover:bg-gray-700 text-white border border-gray-600 rounded-lg transition-colors flex items-center gap-2"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Options
              <svg
                className={`w-4 h-4 transition-transform ${showLogoutMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showLogoutMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    setShowLogoutMenu(false);
                    // Clear admin token only, keep user session
                    clearAdminToken();
                    router.push("/dashboard");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-white border-b border-gray-700"
                >
                  <svg
                    className="w-5 h-5 text-blue-400"
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
                  <div>
                    <div className="font-medium">Logout Admin</div>
                    <div className="text-xs text-gray-400">
                      Kembali ke dashboard user
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowLogoutMenu(false);
                    // Clear both admin token and user session
                    clearAdminToken();
                    signOut({ callbackUrl: "/auth" });
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-300"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <div>
                    <div className="font-medium">Logout Admin dan User</div>
                    <div className="text-xs text-gray-400">
                      Logout sepenuhnya
                    </div>
                  </div>
                </button>

                {/* New: Clear All Cookies & Logout Button */}
                <button
                  onClick={async () => {
                    setShowLogoutMenu(false);
                    // Sign out first to ensure proper server-side session termination
                    await signOut({ redirect: false });
                    // Then clear all local data
                    clearAllCookies();
                    router.push("/auth");
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-yellow-500/10 transition-colors flex items-center gap-3 text-yellow-300"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <div>
                    <div className="font-medium">Clear All & Logout</div>
                    <div className="text-xs text-gray-400">
                      Hapus semua cookies (dev mode)
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon="👥"
            color="bg-blue-500"
          />
          <StatCard
            title="Active Today"
            value={stats?.activeToday || 0}
            icon="🟢"
            color="bg-green-500"
          />
          <StatCard
            title="Total Messages"
            value={stats?.totalMessages || 0}
            icon="💬"
            color="bg-purple-500"
          />
          <StatCard
            title="Total Rooms"
            value={stats?.totalRooms || 0}
            icon="🏠"
            color="bg-orange-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionButton
              label="View All Users"
              icon="👤"
              href="/vinchx/dashboard/users"
            />
            <ActionButton
              label="Manage Rooms"
              icon="🏠"
              href="/vinchx/dashboard/rooms"
            />
            <ActionButton
              label="Manage Reports"
              icon="⚠️"
              href="/vinchx/dashboard/reports"
            />
            <ActionButton
              label="Moderated Users"
              icon="🚫"
              href="/vinchx/dashboard/moderated-users"
            />
            <ActionButton
              label="Passkey Management"
              icon="🔑"
              href="/vinchx/dashboard/passkeys"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Recent Activity
          </h2>

          {/* Date Filter */}
          <div className="mb-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-gray-400 text-sm mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, startDate: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-gray-400 text-sm mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, endDate: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleDateFilter}
              disabled={!dateFilter.startDate || !dateFilter.endDate}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Filter
            </button>
            <button
              onClick={handleResetFilter}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="space-y-3">
            {stats?.recentUsers?.map((user, index) => {
              // Helper to normalize avatar path
              const normalizeAvatar = (avatar) => {
                return avatar ? avatar.replace(/\\/g, "/") : null;
              };

              const userAvatar = normalizeAvatar(user.avatar);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {userAvatar ? (
                        <Image
                          src={userAvatar}
                          alt={user.displayName || user.username}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.displayName?.[0] || user.username?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {stats?.pagination && stats.pagination.totalItems > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
              <div className="flex items-center gap-4">
                <div className="text-gray-400 text-sm">
                  Showing{" "}
                  {(stats.pagination.currentPage - 1) *
                    stats.pagination.itemsPerPage +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    stats.pagination.currentPage *
                      stats.pagination.itemsPerPage,
                    stats.pagination.totalItems,
                  )}{" "}
                  of {stats.pagination.totalItems} users
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-gray-400 text-sm">
                    Items per page:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    className="px-3 py-1 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors disabled:text-gray-600"
                >
                  ← Previous
                </button>
                <div className="px-4 py-2 bg-gray-700/50 text-white rounded-lg">
                  Page {stats.pagination.currentPage} of{" "}
                  {stats.pagination.totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === stats.pagination.totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors disabled:text-gray-600"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function ActionButton({ label, icon, href }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 rounded-xl border border-blue-500/30 transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-white font-medium">{label}</span>
    </button>
  );
}
