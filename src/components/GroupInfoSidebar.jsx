// src/components/GroupInfoSidebar.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";

const GroupInfoSidebar = ({ isOpen, onClose, roomData, currentUserId }) => {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [groupName, setGroupName] = useState(roomData?.name || "");
  const [groupDescription, setGroupDescription] = useState(
    roomData?.description || "",
  );
  const [showMemberActions, setShowMemberActions] = useState(null);

  // Check if current user is admin
  const isAdmin = roomData?.admins?.includes(currentUserId);

  const getInitials = (name) => {
    if (!name) return "G";
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

  const handleUpdateGroupInfo = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomData.id}/info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditingName(false);
        setIsEditingDescription(false);
        // Refresh page to show updated data
        router.refresh();
      } else {
        toast.error("Gagal update info grup: " + data.message);
      }
    } catch (error) {
      console.error("Error updating group info:", error);
      toast.error("Terjadi kesalahan saat update info grup");
    }
  };

  const handlePromoteMember = async (memberId) => {
    try {
      const response = await fetch(`/api/rooms/${roomData.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          action: "promote",
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error promoting member:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDemoteMember = async (memberId) => {
    try {
      const response = await fetch(`/api/rooms/${roomData.id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          action: "demote",
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error demoting member:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Yakin ingin menghapus member ini dari grup?")) return;

    try {
      const response = await fetch(
        `/api/rooms/${roomData.id}/members?memberId=${memberId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();
      if (data.success) {
        router.refresh();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Yakin ingin keluar dari grup ini?")) return;

    try {
      const response = await fetch(`/api/rooms/${roomData.id}/leave`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.success) {
        router.push("/dashboard");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Terjadi kesalahan");
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
        className={`fixed md:relative top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-800">Info Grup</h3>
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

        <div className="p-6 space-y-6">
          {/* Group Profile */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              {normalizeAvatar(roomData?.groupAvatar) ? (
                <Image
                  src={normalizeAvatar(roomData.groupAvatar)}
                  alt={roomData.name}
                  fill
                  className="rounded-full object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {getInitials(roomData?.name)}
                </div>
              )}
            </div>

            {/* Group Name */}
            {isEditingName && isAdmin ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateGroupInfo}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => {
                      setGroupName(roomData.name);
                      setIsEditingName(false);
                    }}
                    className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {roomData?.name}
                </h2>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <p className="text-gray-600 text-sm mt-2">
              {roomData?.memberCount || roomData?.members?.length || 0} member
            </p>

            {/* Group Description */}
            <div className="mt-4">
              {isEditingDescription && isAdmin ? (
                <div className="space-y-2">
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="3"
                    placeholder="Deskripsi grup..."
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateGroupInfo}
                      className="flex-1 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => {
                        setGroupDescription(roomData.description || "");
                        setIsEditingDescription(false);
                      }}
                      className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-center space-x-2">
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg flex-1">
                    {roomData?.description || "Belum ada deskripsi"}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingDescription(true)}
                      className="p-1 hover:bg-gray-100 rounded-full mt-2"
                    >
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Keluar dari Grup
            </button>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-500 uppercase">
              Member ({roomData?.members?.length || 0})
            </h4>

            <div className="space-y-2">
              {roomData?.members?.map((member) => {
                const isMemberAdmin = roomData?.admins?.includes(member._id);
                const isCurrentUser = member._id === currentUserId;

                return (
                  <div
                    key={member._id}
                    className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3">
                      {normalizeAvatar(member.avatar) ? (
                        <Image
                          src={normalizeAvatar(member.avatar)}
                          alt={member.displayName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(member.displayName)}
                        </div>
                      )}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {member.displayName} {isCurrentUser && "(Anda)"}
                        </h4>
                        {isMemberAdmin && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        @{member.username}
                      </p>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && !isCurrentUser && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowMemberActions(
                              showMemberActions === member._id
                                ? null
                                : member._id,
                            )
                          }
                          className="p-2 hover:bg-gray-200 rounded-full"
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
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>

                        {showMemberActions === member._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            {isMemberAdmin ? (
                              <button
                                onClick={() => {
                                  handleDemoteMember(member._id);
                                  setShowMemberActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Turunkan dari Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  handlePromoteMember(member._id);
                                  setShowMemberActions(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Jadikan Admin
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleRemoveMember(member._id);
                                setShowMemberActions(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Hapus dari Grup
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupInfoSidebar;
