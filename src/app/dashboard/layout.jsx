"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast, Toaster } from "sonner";
import { useUser } from "@/contexts/UserContext";
import AddFriendModal from "../components/AddFriendModal";
import NotificationModal from "../components/NotificationModal";
import Dock from "../../components/Dock";
import FlowingRoomItem from "../../components/FlowingRoomItem";
import FlowingFriendItem from "../../components/FlowingFriendItem";
import { VscHome, VscAdd, VscAccount, VscSettingsGear } from "react-icons/vsc";
import { clearAllCookies } from "@/lib/cookie-utils";

export default function DashboardLayout({ children }) {
  const items = [
    {
      icon: <VscHome size={24} className="text-gray-800 dark:text-white" />,
      label: "Home",
      onClick: () => router.push("/dashboard"),
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
      onClick: () => toast.info("Settings coming soon!"),
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
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  // Friend search states for unified modal
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingFriend, setAddingFriend] = useState(null);

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

  // Close logout menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLogoutMenu && !event.target.closest(".logout-dropdown")) {
        setShowLogoutMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLogoutMenu]);

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
      toast.error("Nama group harus diisi!");
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
        toast.error("Gagal membuat room: " + result.message);
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Terjadi kesalahan saat membuat room");
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
    // Gunakan redirect: false agar tidak pakai NEXTAUTH_URL dari .env
    await signOut({ redirect: false });
    // Manual redirect ke /auth di origin yang sama (localhost atau ngrok)
    router.push("/auth");
  };

  const handleClearAllLogout = async () => {
    clearAllCookies();
    await signOut({ redirect: false });
    router.push("/auth");
  };

  const updateAvatar = (newAvatar) => {
    setUser((prevUser) => ({
      ...prevUser,
      avatar: newAvatar,
    }));
  };

  // Friend search functions for unified modal
  const handleFriendSearch = async () => {
    if (searchQuery.trim() === "") return;
    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/users/search?q=${searchQuery}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.results);
      } else {
        toast.error(data.message);
        setSearchResults([]);
      }
    } catch (error) {
      toast.error("Gagal mencari user");
      setSearchResults([]);
    }

    setIsSearching(false);
  };

  const handleAddFriendInModal = async (user) => {
    setAddingFriend(user.userId);

    try {
      const response = await fetch("/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: user.username }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Friend request dikirim ke ${user.displayName}!`);
        setSearchResults((prev) =>
          prev.filter((r) => r.userId !== user.userId),
        );
        loadFriendsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Gagal mengirim friend request");
    }

    setAddingFriend(null);
  };

  const resetModalState = () => {
    setShowCreateRoomModal(false);
    setNewRoomType("group");
    setNewRoomName("");
    setSelectedMembers([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Create private chat with friend
  const startPrivateChat = async (friend) => {
    try {
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "private",
          memberIds: [friend.userId],
        }),
      });

      const result = await response.json();

      if (result.success && result.room?.slug) {
        resetModalState();
        router.push(`/dashboard/chat/${result.room.slug}`);
      } else if (result.existingRoom) {
        const roomsResponse = await fetch("/api/rooms");
        const roomsData = await roomsResponse.json();
        if (roomsData.success) {
          const existingRoom = roomsData.data.rooms.find(
            (r) => r.id === result.existingRoom.id,
          );
          if (existingRoom?.slug) {
            resetModalState();
            router.push(`/dashboard/chat/${existingRoom.slug}`);
          }
        }
      } else {
        toast.error("Gagal membuat room");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
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

                {/* Logout Dropdown */}
                <div className="relative logout-dropdown">
                  <button
                    onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                    className="px-3 py-1.5 bg-red-400/20 hover:bg-red-400/30 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors text-sm font-medium"
                  >
                    Logout ▼
                  </button>

                  {showLogoutMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          setShowLogoutMenu(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-t-lg transition-colors text-sm"
                      >
                        Logout
                      </button>
                      <button
                        onClick={() => {
                          setShowLogoutMenu(false);
                          handleClearAllLogout();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-t border-gray-200 dark:border-gray-700 rounded-b-lg transition-colors text-sm"
                      >
                        🗑️ Clear All & Logout
                      </button>
                    </div>
                  )}
                </div>
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
              <div>
                {friends.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-8 py-8">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="font-medium">Belum ada teman</p>
                    <p className="text-sm mt-1">Mulai tambah teman baru!</p>
                  </div>
                ) : (
                  <div>
                    {friends.map((friend) => (
                      <FlowingFriendItem
                        key={friend.userId}
                        friend={friend}
                        onClick={async () => {
                          try {
                            const response = await fetch("/api/rooms/create", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                type: "private",
                                memberIds: [friend.userId],
                              }),
                            });

                            const result = await response.json();

                            if (result.success) {
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
                              const roomsResponse = await fetch("/api/rooms");
                              const roomsData = await roomsResponse.json();

                              if (roomsData.success) {
                                const existingRoom = roomsData.data.rooms.find(
                                  (r) => r.id === result.existingRoom.id,
                                );
                                if (existingRoom && existingRoom.slug) {
                                  router.push(
                                    `/dashboard/chat/${existingRoom.slug}`,
                                  );
                                } else {
                                  toast.info(
                                    `Room dengan ${friend.displayName} sudah ada!`,
                                  );
                                }
                              } else {
                                toast.info(
                                  `Room dengan ${friend.displayName} sudah ada!`,
                                );
                              }
                            } else {
                              toast.error(
                                "Gagal membuat room: " + result.message,
                              );
                            }
                          } catch (error) {
                            console.error("Error creating room:", error);
                            toast.error("Terjadi kesalahan saat membuat room");
                          }
                        }}
                        normalizeAvatar={normalizeAvatar}
                        getInitials={getInitials}
                      />
                    ))}
                  </div>
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

      {/* Unified Chat Modal - WhatsApp Style */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card dark:glass-card-dark rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl animate-slide-up flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                  Chat Baru
                </h3>
                <button
                  onClick={resetModalState}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full p-2 transition-all duration-200 hover:rotate-90"
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
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFriendSearch()}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none transition-all duration-300 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 input-glow text-sm"
                  placeholder="Cari nama atau username..."
                />
                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={handleFriendSearch}
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 gradient-primary text-white rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                  >
                    {isSearching ? "..." : "Cari"}
                  </button>
                )}
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto scrollbar-elegant">
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                    Hasil Pencarian
                  </p>
                  {searchResults.map((result) => (
                    <div
                      key={result.userId}
                      className="flex items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-12 h-12 gradient-cool rounded-full flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md">
                        {result.displayName?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {result.displayName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          @{result.username}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddFriendInModal(result)}
                        disabled={addingFriend === result.userId}
                        className="px-3 py-1.5 gradient-success text-white rounded-lg text-xs font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                      >
                        {addingFriend === result.userId ? "..." : "+ Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="p-3">
                {/* New Group */}
                <div
                  onClick={() =>
                    setNewRoomType(newRoomType === "group" ? "" : "group")
                  }
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
                    newRoomType === "group"
                      ? "glass-card dark:glass-card-dark shadow-md"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700/30"
                  }`}
                >
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white text-xl mr-3 shadow-md">
                    👥
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      Grup Baru
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Buat grup dengan teman-temanmu
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      newRoomType === "group"
                        ? "gradient-primary border-transparent"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {newRoomType === "group" && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* AI Chat */}
                <div
                  onClick={() =>
                    setNewRoomType(newRoomType === "ai" ? "" : "ai")
                  }
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
                    newRoomType === "ai"
                      ? "glass-card dark:glass-card-dark shadow-md"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700/30"
                  }`}
                >
                  <div className="w-12 h-12 gradient-success rounded-full flex items-center justify-center text-white text-xl mr-3 shadow-md">
                    🤖
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      Chat AI
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Ngobrol dengan AI asisten
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      newRoomType === "ai"
                        ? "gradient-success border-transparent"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {newRoomType === "ai" && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Group Details (if group selected) */}
                {newRoomType === "group" && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-slide-down">
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none transition-all duration-300 bg-white/80 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100 input-glow text-sm mb-3"
                      placeholder="Nama grup..."
                    />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Pilih anggota:
                    </p>
                    <div className="max-h-32 overflow-y-auto scrollbar-elegant">
                      {friends.map((friend) => (
                        <div
                          key={friend.userId}
                          className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                            selectedMembers.includes(friend.userId)
                              ? "bg-purple-100 dark:bg-purple-900/30"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700/30"
                          }`}
                          onClick={() => toggleMemberSelection(friend.userId)}
                        >
                          <div className="w-8 h-8 gradient-warm rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">
                            {friend.displayName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                            {friend.displayName}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedMembers.includes(friend.userId)
                                ? "gradient-primary border-transparent"
                                : "border-gray-300 dark:border-gray-600"
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
                                  strokeWidth="3"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedMembers.length > 0 && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                        {selectedMembers.length} anggota dipilih
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Kontak di Chit-Chat
                </p>
              </div>

              {/* Friends List */}
              <div className="px-3 pb-3">
                {friends.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">👋</div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Belum ada teman. Cari teman baru di atas!
                    </p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.userId}
                      onClick={() => startPrivateChat(friend)}
                      className="flex items-center p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-all duration-200 cursor-pointer mb-1"
                    >
                      <div className="w-12 h-12 gradient-warm rounded-full flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md">
                        {friend.displayName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {friend.displayName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          @{friend.username}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer - Create Button (only for group/ai) */}
            {(newRoomType === "group" || newRoomType === "ai") && (
              <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={createRoom}
                  className="w-full py-3 gradient-primary text-white rounded-xl font-semibold transition-all duration-300 btn-hover-lift btn-hover-glow shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
                >
                  {newRoomType === "group" ? "Buat Grup" : "Mulai Chat AI"}
                </button>
              </div>
            )}
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
