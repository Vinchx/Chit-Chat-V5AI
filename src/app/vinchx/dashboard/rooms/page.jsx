"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";

export default function ManageRoomsPage() {
  const router = useRouter();
  const { isAdminAuthed, isLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("active"); // active, deleted
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (isAdminAuthed) {
      fetchRooms();
    }
  }, [isAdminAuthed, activeTab]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch(`/api/admin/rooms?status=${activeTab}`);
      const data = await response.json();
      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      toast.error("Gagal memuat rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRestoreRoom = async (roomId) => {
    setActionLoading(roomId);
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}/restore`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Room berhasil di-restore!");
        fetchRooms(); // Refresh list
      } else {
        toast.error(data.message || "Gagal restore room");
      }
    } catch (error) {
      console.error("Error restoring room:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (roomId) => {
    if (
      !confirm(
        "Yakin ingin menghapus room ini PERMANEN? Aksi ini tidak bisa dibatalkan!",
      )
    ) {
      return;
    }

    setActionLoading(roomId);
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}/permanent`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Room berhasil dihapus permanen!");
        fetchRooms(); // Refresh list
      } else {
        toast.error(data.message || "Gagal hapus room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setActionLoading(null);
    }
  };

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/vinchx/dashboard")}
              className="text-gray-400 hover:text-white mb-2 flex items-center gap-2"
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
            <h1 className="text-4xl font-bold text-white">Manage Rooms</h1>
            <p className="text-gray-400 mt-2">
              Restore or permanently delete rooms
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
              }`}
            >
              🟢 Active Rooms
            </button>
            <button
              onClick={() => setActiveTab("deleted")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "deleted"
                  ? "bg-red-500 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
              }`}
            >
              🗑️ Deleted Rooms
            </button>
          </div>

          {/* Rooms List */}
          <div className="space-y-4">
            {loadingRooms ? (
              <div className="text-center text-gray-400 py-8">
                Loading rooms...
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No {activeTab} rooms found
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room._id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {room.type === "private"
                            ? "💬"
                            : room.type === "group"
                              ? "👥"
                              : "🤖"}
                        </span>
                        <div>
                          <h3 className="text-white font-medium">
                            {room.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {room.type.charAt(0).toUpperCase() +
                              room.type.slice(1)}{" "}
                            Room
                            {" • "}
                            {room.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm space-y-1">
                        <p>Room ID: {room._id}</p>
                        <p>
                          Created: {new Date(room.createdAt).toLocaleString()}
                        </p>
                        {room.deletedAt && (
                          <p className="text-red-400">
                            Deleted: {new Date(room.deletedAt).toLocaleString()}{" "}
                            by {room.deletedBy}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {activeTab === "deleted" && (
                        <>
                          <button
                            onClick={() => handleRestoreRoom(room._id)}
                            disabled={actionLoading === room._id}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === room._id ? "..." : "♻️ Restore"}
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(room._id)}
                            disabled={actionLoading === room._id}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === room._id
                              ? "..."
                              : "🗑️ Delete Permanent"}
                          </button>
                        </>
                      )}
                      {activeTab === "active" && (
                        <span className="text-green-400 text-sm">
                          ✅ Active
                        </span>
                      )}
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
