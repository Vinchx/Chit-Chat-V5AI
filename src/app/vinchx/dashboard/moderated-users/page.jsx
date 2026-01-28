"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import Link from "next/link";

export default function ModeratedUsersPage() {
  const { isAdminAuthed, isLoading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("suspended");

  useEffect(() => {
    if (isAdminAuthed) {
      fetchModeratedUsers();
    }
  }, [isAdminAuthed, activeTab]);

  const fetchModeratedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users/moderated?type=${activeTab}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch moderated users");
      }

      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching moderated users:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async (userId) => {
    if (!confirm("Are you sure you want to unsuspend this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unsuspend user");
      }

      toast.success("User unsuspended successfully");
      fetchModeratedUsers();
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast.error(error.message);
    }
  };

  const handleUnban = async (userId) => {
    if (!confirm("Are you sure you want to unban this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unban user");
      }

      toast.success("User unbanned successfully");
      fetchModeratedUsers();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error(error.message);
    }
  };

  if (authLoading || !isAdminAuthed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Moderated Users
              </h1>
              <p className="text-zinc-400">Manage suspended and banned users</p>
            </div>
            <Link
              href="/vinchx/dashboard"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("suspended")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "suspended"
                ? "bg-orange-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Suspended Users
          </button>
          <button
            onClick={() => setActiveTab("banned")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "banned"
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            Banned Users
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-zinc-400">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              No {activeTab} users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Warnings
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      {activeTab === "suspended"
                        ? "Suspended Until"
                        : "Banned Date"}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-zinc-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              user.displayName?.charAt(0) || "?"
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {user.displayName}
                            </div>
                            <div className="text-xs text-zinc-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">
                          {user.warningCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {activeTab === "suspended"
                          ? new Date(user.suspendedUntil).toLocaleString(
                              "id-ID",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )
                          : new Date(user.bannedAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                            })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-300 max-w-xs truncate">
                          {activeTab === "suspended"
                            ? user.suspensionReason
                            : user.bannedReason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            activeTab === "suspended"
                              ? handleUnsuspend(user._id)
                              : handleUnban(user._id)
                          }
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            activeTab === "suspended"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {activeTab === "suspended" ? "Unsuspend" : "Unban"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
