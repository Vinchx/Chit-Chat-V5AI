"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import AddFriendModal from "../components/AddFriendModal";
import NotificationModal from "../components/NotificationModal";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("chats");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Check auth
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        displayName: session.user.displayName,
      });

      loadRooms();
      loadFriends();
      loadFriendRequests();
    }
  }, [status, session, router]);

  const loadRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      if (data.success) {
        setRooms(data.data.rooms);
      }
    } catch (error) {
      console.log("Error loading rooms:", error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await fetch("/api/friends");
      const data = await response.json();
      if (data.success) {
        setFriends(data.data.friends);
      }
    } catch (error) {
      console.log("Error loading friends:", error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await fetch("/api/friends");
      const data = await response.json();
      if (data.success) {
        setFriends(data.data.friends || []);
        setFriendRequests(data.data.pendingReceived || []);
      }
    } catch (error) {
      console.log("Error loading friend requests:", error);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action: "accept" }),
      });

      const data = await response.json();
      if (data.success) {
        loadFriendRequests();
        loadFriends();
        alert("✅ Permintaan pertemanan diterima!");
      } else {
        alert("❌ Gagal menerima permintaan: " + data.message);
      }
    } catch (error) {
      console.log("Error accepting friend request:", error);
      alert("❌ Terjadi error saat menerima permintaan");
    }
  };

  const handleDeclineRequest = async (friendshipId) => {
    try {
      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action: "reject" }),
      });

      const data = await response.json();
      if (data.success) {
        loadFriendRequests();
        alert("❌ Permintaan pertemanan ditolak");
      } else {
        alert("❌ Gagal menolak permintaan: " + data.message);
      }
    } catch (error) {
      console.log("Error declining friend request:", error);
      alert("❌ Terjadi error saat menolak permintaan");
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth" });
  };

  if (status === "loading" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <div className="w-80 backdrop-blur-lg bg-white/10 border-r border-white/20 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/20 bg-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">ChitChat</h2>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-400/20 hover:bg-red-400/30 text-red-700 rounded-lg transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                {user?.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">
                  {user?.displayName || "User"}
                </h3>
                <p className="text-sm text-gray-600 truncate">@{user?.username}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/20 bg-white/5">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "chats"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white/10"
                  : "text-gray-600 hover:bg-white/5"
              }`}
            >
              Chats ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "friends"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white/10"
                  : "text-gray-600 hover:bg-white/5"
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "requests"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-white/10"
                  : "text-gray-600 hover:bg-white/5"
              }`}
            >
              Requests
              {friendRequests.length > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "chats" ? (
              <div className="p-4 space-y-2">
                {rooms.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Belum ada room</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => {
                        if (room.slug) {
                          router.push(`/dashboard/chat/${room.slug}`);
                        }
                      }}
                      className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/20"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {room.type === "private" ? "👤" : room.type === "group" ? "👥" : "🤖"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{room.name}</h4>
                          <p className="text-sm text-gray-600 truncate">
                            {room.lastMessage || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeTab === "friends" ? (
              <div className="p-4 space-y-2">
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg hover:bg-white/10 transition-colors text-blue-600 font-medium"
                >
                  + Tambah Teman Baru
                </button>
                {friends.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Belum ada teman</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div key={friend.userId} className="p-3 rounded-lg bg-white/10">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                          {friend.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{friend.displayName}</h4>
                          <p className="text-sm text-gray-600 truncate">@{friend.username}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {friendRequests.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Tidak ada permintaan pertemanan</p>
                  </div>
                ) : (
                  friendRequests.map((request) => (
                    <div key={request.friendshipId} className="p-3 rounded-lg bg-white/10">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                          {request.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{request.displayName}</h4>
                          <p className="text-sm text-gray-600 truncate">@{request.username}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request.friendshipId)}
                          className="flex-1 py-1.5 bg-green-400/20 hover:bg-green-400/30 text-green-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          Terima
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.friendshipId)}
                          className="flex-1 py-1.5 bg-red-400/20 hover:bg-red-400/30 text-red-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1">
          {children}
        </div>
      </div>

      {/* Modals */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={() => {
          setShowAddFriendModal(false);
          loadFriendRequests();
        }}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
