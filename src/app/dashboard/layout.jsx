"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";
import AddFriendModal from "../components/AddFriendModal";
import NotificationModal from "../components/NotificationModal";
import Dock from "../../components/Dock";
import FlowingRoomItem from "../../components/FlowingRoomItem";
import { VscHome, VscAdd, VscAccount, VscSettingsGear } from "react-icons/vsc";

export default function DashboardLayout({ children }) {
  const items = [
    {
      icon: <VscHome size={24} className="text-gray-800 dark:text-white" />,
      label: "Home",
      onClick: () => alert("Home!"),
    },
    {
      icon: <VscAdd size={24} className="text-gray-800 dark:text-white" />,
      label: "Create Room",
      onClick: () => setShowCreateRoomModal(true),
    },
    {
      icon: <VscAccount size={24} className="text-gray-800 dark:text-white" />,
      label: "Profile",
      onClick: () => router.push("/profile"),
    },
    {
      icon: (
        <VscSettingsGear size={24} className="text-gray-800 dark:text-white" />
      ),
      label: "Settings",
      onClick: () => alert("Settings!"),
    },
  ];

  const router = useRouter();
  const { data: session, status } = useSession();
  const { user: currentUser } = useUser();

  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("chats");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomType, setNewRoomType] = useState("group");
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Refs to prevent duplicate API calls
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Helper function untuk normalize avatar path
  const normalizeAvatar = (avatar) => {
    return avatar ? avatar.replace(/\\/g, "/") : null;
  };

  // Helper function untuk get initials
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

      // Only load data once on initial mount
      if (!hasLoadedRef.current && !isLoadingRef.current) {
        hasLoadedRef.current = true;
        loadAllData();
      }
    }
  }, [status, session, router]);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Consolidated function to load all data in parallel (single batch)
  const loadAllData = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      // Load rooms and friends data in parallel
      const [roomsRes, friendsRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/friends"),
      ]);

      const [roomsData, friendsData] = await Promise.all([
        roomsRes.json(),
        friendsRes.json(),
      ]);

      if (roomsData.success) {
        setRooms(roomsData.data.rooms);
      }

      if (friendsData.success) {
        setFriends(friendsData.data.friends || []);
        setFriendRequests(friendsData.data.pendingReceived || []);
      }
    } catch (error) {
      console.log("Error loading data:", error);
    } finally {
      isLoadingRef.current = false;
    }
  };

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

  const createRoom = async () => {
    if (newRoomType === "group" && !newRoomName.trim()) {
      alert("Nama group harus diisi!");
      return;
    }

    try {
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newRoomType,
          name: newRoomType === "group" ? newRoomName : undefined,
          memberIds: selectedMembers,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateRoomModal(false);
        setNewRoomType("group");
        setNewRoomName("");
        setSelectedMembers([]);
        router.push(`/dashboard/chat/${result.room.slug}`);
      } else if (result.existingRoom) {
        // Room sudah ada, redirect ke room tersebut
        setShowCreateRoomModal(false);
        setNewRoomType("group");
        setNewRoomName("");
        setSelectedMembers([]);
        router.push(`/dashboard/chat/${result.existingRoom.slug}`);
      } else {
        alert("Gagal membuat room: " + result.message);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Terjadi kesalahan saat membuat room");
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const loadFriendsData = async () => {
    try {
      const response = await fetch("/api/friends");
      const data = await response.json();
      if (data.success) {
        setFriends(data.data.friends || []);
        setFriendRequests(data.data.pendingReceived || []);
      }
    } catch (error) {
      console.log("Error loading friends data:", error);
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
        loadFriendsData();
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
        loadFriendsData();
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
    // Tidak perlu router.push karena signOut akan menangani redirect
  };

  const updateAvatar = (newAvatar) => {
    setUser((prevUser) => ({
      ...prevUser,
      avatar: newAvatar,
    }));
  };

  if (status === "loading" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Get avatar from UserContext (which has the latest data from session)
  const userAvatar = normalizeAvatar(currentUser?.avatar);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.2)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <div className="w-80 backdrop-blur-lg bg-white/10 dark:bg-gray-900/40 border-r border-white/20 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/20 dark:border-gray-700 bg-white/5 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                ChitChat
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="px-3 py-1.5 bg-gray-400/20 hover:bg-gray-400/30 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                  title={
                    isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                  }
                >
                  {isDarkMode ? "☀️" : "🌙"}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-400/20 hover:bg-red-400/30 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Avatar with Image or Initials fallback */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt={user?.displayName || "User"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(user?.displayName || "User")}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                  {user?.displayName || "User"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  @{user?.username}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/20 dark:border-gray-700 bg-white/5 dark:bg-gray-800/50">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "chats"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white/10 dark:bg-gray-700/50"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white/5 dark:hover:bg-gray-700/30"
              }`}
            >
              Chats ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "friends"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white/10 dark:bg-gray-700/50"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white/5 dark:hover:bg-gray-700/30"
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "requests"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white/10 dark:bg-gray-700/50"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white/5 dark:hover:bg-gray-700/30"
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
              <div>
                {rooms.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Belum ada room</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <FlowingRoomItem
                      key={room.id}
                      room={room}
                      onClick={() => {
                        if (room.slug) {
                          router.push(`/dashboard/chat/${room.slug}`);
                        }
                      }}
                      normalizeAvatar={normalizeAvatar}
                      getInitials={getInitials}
                    />
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
                    <div
                      key={friend.userId}
                      className="p-3 rounded-lg bg-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                          {friend.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">
                            {friend.displayName}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            @{friend.username}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(
                                "/api/rooms/create",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    type: "private",
                                    memberIds: [friend.userId],
                                  }),
                                },
                              );

                              const result = await response.json();

                              if (result.success) {
                                // Redirect ke room yang baru dibuat menggunakan slug dari response
                                if (result.room && result.room.slug) {
                                  router.push(
                                    `/dashboard/chat/${result.room.slug}`,
                                  );
                                } else {
                                  alert(
                                    "Room berhasil dibuat tetapi slug tidak ditemukan",
                                  );
                                }
                              } else if (result.existingRoom) {
                                // Ambil daftar room untuk mendapatkan slug dari room yang sudah ada
                                const roomsResponse = await fetch("/api/rooms");
                                const roomsData = await roomsResponse.json();

                                if (roomsData.success) {
                                  // Cari room yang sudah ada
                                  const existingRoom =
                                    roomsData.data.rooms.find(
                                      (r) => r.id === result.existingRoom.id,
                                    );
                                  if (existingRoom && existingRoom.slug) {
                                    router.push(
                                      `/dashboard/chat/${existingRoom.slug}`,
                                    );
                                  } else {
                                    alert(
                                      `Room dengan ${friend.displayName} sudah ada!`,
                                    );
                                  }
                                } else {
                                  alert(
                                    `Room dengan ${friend.displayName} sudah ada!`,
                                  );
                                }
                              } else {
                                alert("Gagal membuat room: " + result.message);
                              }
                            } catch (error) {
                              console.error("Error creating room:", error);
                              alert("Terjadi kesalahan saat membuat room");
                            }
                          }}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {friendRequests.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                    <p>Tidak ada permintaan pertemanan</p>
                  </div>
                ) : (
                  friendRequests.map((request) => (
                    <div
                      key={request.friendshipId}
                      className="p-3 rounded-lg bg-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                          {request.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 dark:text-gray-100 truncate">
                            {request.displayName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            @{request.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleAcceptRequest(request.friendshipId)
                          }
                          className="flex-1 py-1.5 bg-green-400/20 hover:bg-green-400/30 dark:bg-green-500/20 dark:hover:bg-green-500/30 text-green-700 dark:text-green-400 rounded-lg transition-colors text-sm font-medium"
                        >
                          Terima
                        </button>
                        <button
                          onClick={() =>
                            handleDeclineRequest(request.friendshipId)
                          }
                          className="flex-1 py-1.5 bg-red-400/20 hover:bg-red-400/30 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-700 dark:text-red-400 rounded-lg transition-colors text-sm font-medium"
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

          {/* Footer dengan Dock navigation */}
          <div className="p-2 border-t border-white/20 dark:border-gray-700 h-[106px] flex items-end justify-center relative">
            <Dock
              items={items}
              panelHeight={60}
              baseItemSize={40}
              magnification={70}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          {children}

          {/* Mobile footer navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around z-50">
            <button
              onClick={() => {
                setActiveTab("chats");
                router.push("/dashboard");
              }}
              className={`flex flex-col items-center p-2 rounded-lg ${
                activeTab === "chats"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">💬</span>
              <span className="text-xs mt-1">Chats</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("friends");
                router.push("/dashboard");
              }}
              className={`flex flex-col items-center p-2 rounded-lg ${
                activeTab === "friends"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">👥</span>
              <span className="text-xs mt-1">Friends</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("requests");
                router.push("/dashboard");
              }}
              className={`flex flex-col items-center p-2 rounded-lg relative ${
                activeTab === "requests"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg">🔔</span>
              {friendRequests.length > 0 && (
                <span className="absolute top-0 right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
              <span className="text-xs mt-1">Requests</span>
            </button>

            <button
              onClick={() => router.push("/profile")}
              className="flex flex-col items-center p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <span className="text-lg">👤</span>
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={() => {
          setShowAddFriendModal(false);
          loadFriendsData();
        }}
      />

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Buat Room Baru
                </h3>
                <button
                  onClick={() => {
                    setShowCreateRoomModal(false);
                    setNewRoomType("group");
                    setNewRoomName("");
                    setSelectedMembers([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Room Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Room
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRoomType("group")}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        newRoomType === "group"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Group
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRoomType("ai")}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        newRoomType === "ai"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      AI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        alert(
                          "Untuk room private, gunakan tombol 'Chat' di daftar teman",
                        );
                      }}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        newRoomType === "private"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Private
                    </button>
                  </div>
                </div>

                {/* Room Name (only for group) */}
                {newRoomType === "group" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Group
                    </label>
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan nama group..."
                    />
                  </div>
                )}

                {/* Members Selection (only for group) */}
                {newRoomType === "group" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tambah Anggota
                    </label>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {friends.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          Tidak ada teman ditemukan
                        </p>
                      ) : (
                        friends.map((friend) => (
                          <div
                            key={friend.userId}
                            className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
                              selectedMembers.includes(friend.userId)
                                ? "bg-blue-100"
                                : ""
                            }`}
                            onClick={() => toggleMemberSelection(friend.userId)}
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                              {friend.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">
                                {friend.displayName}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                @{friend.username}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedMembers.includes(friend.userId)
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {selectedMembers.includes(friend.userId) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  ></path>
                                </svg>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedMembers.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedMembers.length} anggota dipilih
                      </p>
                    )}
                  </div>
                )}

                {/* Create Button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateRoomModal(false);
                      setNewRoomType("group");
                      setNewRoomName("");
                      setSelectedMembers([]);
                    }}
                    className="flex-1 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={createRoom}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition-all"
                  >
                    Buat Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
