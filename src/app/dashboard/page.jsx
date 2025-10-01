"use client";

import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import ChatHeader from "../components/ChatHeader";
import TypingIndicator from "../components/TypingIndicator";
import ScrollToBottomButton from "../components/ScrollToBottomButton";
import AddFriendModal from "../components/AddFriendModal";
import NotificationModal from "../components/NotificationModal";

export default function Dashboard() {
  // State untuk menyimpan data user yang login
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("chats"); // 'chats' atau 'friends' atau 'requests'
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);

  // Ref untuk selectedRoom agar bisa diakses di socket event listeners
  const selectedRoomRef = useRef(null);

  // State untuk notification modal
  const [notification, setNotification] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Cek apakah user sudah login atau belum
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      // Kalau belum login, redirect ke halaman auth
      window.location.href = "/auth";
      return;
    }

    // Set data user dari localStorage
    setUser(JSON.parse(userData));

    // Load data rooms, friends, dan friend requests
    loadRooms(token);
    loadFriends(token);
    loadFriendRequests(token);

    // Setup Socket.io connection
    const newSocket = io("http://localhost:3000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("📞 Dashboard connect ke server!", newSocket.id);
      console.log("Socket connected:", newSocket.connected);
    });

    // Event listener buat nerima pesan
    newSocket.on("receive_message", (messageData) => {
      console.log("📨 Terima pesan:", messageData);

      // Tambahin pesan baru ke chat
      const newMsg = {
        id: Date.now(),
        text: messageData.text,
        sender: messageData.sender,
        time: messageData.time,
        isOwn: false,
      };

      setMessages((prevMessages) => [...prevMessages, newMsg]);
    });

    // Event listener buat typing indicators dengan filter room
    newSocket.on("typing_start", (data) => {
      console.log("⌨️ RECEIVED typing_start:", data);
      console.log("Current room:", selectedRoomRef.current?.id);

      // Filter berdasarkan room
      if (data.roomId === selectedRoomRef.current?.id) {
        console.log("setIsTyping dipanggil dengan true");
        setIsTyping(true);
        setTypingUser(data.userName);
      }
    });

    newSocket.on("typing_stop", (data) => {
      console.log("⏹️ RECEIVED typing_stop:", data);

      if (data.roomId === selectedRoomRef.current?.id) {
        setIsTyping(false);
        setTypingUser("");
      }
    });

    // Cleanup function
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Update selectedRoomRef setiap kali selectedRoom berubah
  useEffect(() => {
    console.log("🏠 SELECTED ROOM CHANGED:", selectedRoom);
    selectedRoomRef.current = selectedRoom;

    // Join room di socket saat selectedRoom berubah
    if (socket && selectedRoom) {
      console.log("📍 Joining room:", selectedRoom.id);
      socket.emit("join_room", selectedRoom.id);
    }
  }, [selectedRoom, socket]);

  // Scroll otomatis saat ada pesan baru atau typing indicator (seperti WhatsApp)
  useEffect(() => {
    if (messages.length > 0 && !isUserScrolling) {
      const lastMessage = messages[messages.length - 1];

      // Gunakan requestAnimationFrame untuk timing yang lebih baik
      requestAnimationFrame(() => {
        const messagesContainer = document.querySelector(
          ".messages-container .overflow-y-auto"
        );
        if (messagesContainer) {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

          // Auto scroll jika user di dekat bawah atau pesan baru dari user sendiri
          if (isNearBottom || lastMessage?.isOwn) {
            messagesContainer.scrollTo({
              top: messagesContainer.scrollHeight,
              behavior: "smooth",
            });
            setShowScrollButton(false);
          } else {
            setShowScrollButton(true);
          }
        }
      });
    }
  }, [messages.length, isUserScrolling]);

  // Separate useEffect untuk typing indicator scroll
  useEffect(() => {
    if (isTyping && !isUserScrolling) {
      requestAnimationFrame(() => {
        const messagesContainer = document.querySelector(
          ".messages-container .overflow-y-auto"
        );
        if (messagesContainer) {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

          if (isNearBottom) {
            messagesContainer.scrollTo({
              top: messagesContainer.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      });
    }
  }, [isTyping, isUserScrolling]);

  // Fungsi untuk ambil daftar rooms
  const loadRooms = async (token) => {
    try {
      const response = await fetch("/api/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        console.log("📦 ROOMS LOADED:", data.data.rooms);
        setRooms(data.data.rooms);
      }
    } catch (error) {
      console.log("Error loading rooms:", error);
    }
  };

  // Fungsi untuk ambil daftar friends
  const loadFriends = async (token) => {
    try {
      const response = await fetch("/api/friends", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFriends(data.data.friends);
      }
    } catch (error) {
      console.log("Error loading friends:", error);
    }
  };

  // ✨ FUNGSI BARU: Load friend requests yang pending
  const loadFriendRequests = async (token) => {
    try {
      // Pake endpoint /api/friends yang sudah ada
      const response = await fetch("/api/friends", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Update friends dan requests sekaligus
        setFriends(data.data.friends || []);
        setFriendRequests(data.data.pendingReceived || []);
      }
    } catch (error) {
      console.log("Error loading friend requests:", error);
      // Set empty array kalo gagal, biar UI tetap jalan
      setFriendRequests([]);
    }
  };

  // Function untuk tutup notification
  const closeNotification = () => {
    setNotification({ ...notification, isOpen: false });
  };

  // Function untuk show notification
  const showNotification = (type, title, message) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
    });
  };
  const handleAcceptRequest = async (friendshipId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          friendshipId: friendshipId,
          action: "accept",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data setelah accept
        loadFriendRequests(token);
        loadFriends(token);

        // Kasih feedback ke user
        alert("✅ Permintaan pertemanan diterima!");
      } else {
        alert("❌ Gagal menerima permintaan: " + data.message);
      }
    } catch (error) {
      console.log("Error accepting friend request:", error);
      alert("❌ Terjadi error saat menerima permintaan");
    }
  };

  // ✨ FUNGSI BARU: Decline friend request
  const handleDeclineRequest = async (friendshipId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          friendshipId: friendshipId,
          action: "reject",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data setelah decline
        loadFriendRequests(token);

        // Kasih feedback ke user
        alert("❌ Permintaan pertemanan ditolak");
      } else {
        alert("❌ Gagal menolak permintaan: " + data.message);
      }
    } catch (error) {
      console.log("Error declining friend request:", error);
      alert("❌ Terjadi error saat menolak permintaan");
    }
  };

  // Fungsi logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth";
  };

  // Taruh setelah fungsi handleLogout yang udah ada
  const handleReceiveMessage = (messageData) => {
    const newMsg = {
      id: messages.length + 1,
      text: messageData.text,
      sender: messageData.sender,
      time: messageData.time,
      isOwn: messageData.isOwn,
    };

    setMessages([...messages, newMsg]);
  };

  // Fungsi buat ambil pesan dari database
  const loadMessages = async (roomId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/messages/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const formattedMessages = data.data.messages.map((msg) => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender.displayName,
          time: new Date(msg.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isOwn: msg.isOwn,
        }));

        setMessages(formattedMessages);

        // Scroll ke bawah setelah load pesan
        setTimeout(() => {
          const messagesContainer = document.querySelector(
            ".messages-container .overflow-y-auto"
          );
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.log("Error loading messages:", error);
    }
  };

  // Fungsi scroll ke bawah
  const scrollToBottom = () => {
    const messagesContainer = document.querySelector(
      ".messages-container .overflow-y-auto"
    );
    if (messagesContainer) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: "smooth",
      });
      setShowScrollButton(false);
      setIsUserScrolling(false);
    }
  };

  // Handler untuk deteksi scroll user
  const handleScroll = (e) => {
    const container = e.target;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (isAtBottom) {
      setShowScrollButton(false);
      setIsUserScrolling(false);
    } else {
      setIsUserScrolling(true);
      setShowScrollButton(true);
    }
  };

  // Kalau user belum loaded, tampilkan loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern - sama seperti auth page */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>

      {/* Floating shapes */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

      <div className="flex h-screen relative z-10">
        {/* Sidebar Kiri - Panel Navigasi */}
        <div className="w-80 backdrop-blur-lg bg-white/20 border-r border-white/30 flex flex-col">
          {/* Header User */}
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {user.displayName}
                  </h3>
                  <p className="text-sm text-gray-600">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Logout"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-white/30">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 p-3 text-center font-medium transition-colors ${
                activeTab === "chats"
                  ? "text-blue-600 bg-white/20"
                  : "text-gray-600 hover:bg-white/10"
              }`}
            >
              Chats ({rooms.length})
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 p-3 text-center font-medium transition-colors ${
                activeTab === "friends"
                  ? "text-blue-600 bg-white/20"
                  : "text-gray-600 hover:bg-white/10"
              }`}
            >
              Friends ({friends.length})
            </button>
            {/* Tab baru - Requests */}
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 p-3 text-center font-medium transition-colors ${
                activeTab === "requests"
                  ? "text-blue-600 bg-white/20"
                  : "text-gray-600 hover:bg-white/10"
              }`}
            >
              Requests ({friendRequests.length})
            </button>
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "chats" ? (
              // Daftar Rooms
              <div className="p-4 space-y-2">
                {rooms.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Belum ada chat room</p>
                    <button className="mt-2 text-blue-600 hover:underline">
                      Buat room baru
                    </button>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => {
                        console.log("Room diklik:", room);
                        setSelectedRoom(room);
                        loadMessages(room.id);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id
                          ? "bg-white/30"
                          : "hover:bg-white/20"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {room.type === "private"
                            ? "👤"
                            : room.type === "group"
                            ? "👥"
                            : "🤖"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">
                            {room.name}
                          </h4>
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
              // Daftar Friends
              <div className="p-4 space-y-2">
                {/* Tombol tambah teman - SELALU muncul */}
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg hover:bg-white/10 transition-colors text-blue-600 font-medium"
                >
                  + Tambah Teman Baru
                </button>

                {/* Daftar friends */}
                {friends.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Belum ada teman</p>
                    <p className="text-sm">
                      Klik tombol di atas untuk mencari teman
                    </p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div
                      key={friend.userId}
                      className="p-3 rounded-lg hover:bg-white/20 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {friend.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">
                            {friend.displayName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            @{friend.username}
                          </p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            friend.isOnline ? "bg-green-400" : "bg-gray-400"
                          }`}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // ✨ TAB REQUESTS YANG BARU!
              <div className="p-4 space-y-2">
                {friendRequests.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      📬
                    </div>
                    <p>Tidak ada permintaan pertemanan</p>
                    <p className="text-sm">Permintaan akan muncul di sini</p>
                  </div>
                ) : (
                  friendRequests.map((request) => (
                    <div
                      key={request.friendshipId}
                      className="p-4 bg-white/30 rounded-lg border border-white/40"
                    >
                      <div className="flex items-center justify-between">
                        {/* Info user yang kirim request */}
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {request.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {request.displayName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              @{request.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString(
                                "id-ID"
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Tombol Accept & Decline */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleAcceptRequest(request.friendshipId)
                            }
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                          >
                            ✅ Accept
                          </button>
                          <button
                            onClick={() =>
                              handleDeclineRequest(request.friendshipId)
                            }
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                          >
                            ❌ Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Area Chat */}
        <div
          className="flex-1 backdrop-blur-lg bg-white/10 flex flex-col messages-container"
          data-current-room={selectedRoom?.id || ""}
        >
          {selectedRoom ? (
            // Chat Area
            <div className="flex flex-col h-full relative">
              {/* Chat Header */}
              <ChatHeader selectedRoom={selectedRoom} />

              {/* Messages Area */}
              <div
                className="flex-1 p-4 overflow-y-auto scroll-smooth"
                onScroll={handleScroll}
              >
                {/* Loop untuk tampilin setiap pesan */}
                {messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                ) : (
                  <div className="text-center text-gray-500 mt-20">
                    <p>Belum ada pesan di room ini</p>
                  </div>
                )}

                {/* Typing Indicator */}
                <TypingIndicator isTyping={isTyping} userName={typingUser} />
              </div>

              {/* Scroll to bottom button - hanya muncul kalau user scroll up */}
              {showScrollButton && (
                <ScrollToBottomButton onClick={scrollToBottom} />
              )}
              {/* Message Input */}
              <MessageInput
                onSendMessage={handleReceiveMessage}
                user={user}
                socket={socket}
                selectedRoom={selectedRoom}
              />
            </div>
          ) : (
            // Welcome Screen
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-3xl mb-6 mx-auto">
                  💬
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome to ChitChat
                </h2>
                <p className="text-gray-600">
                  Select a chat to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Friend */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onAddFriend={(user) => {
          console.log("Add friend:", user);
          setShowAddFriendModal(false);
          // Refresh friend requests setelah add friend
          const token = localStorage.getItem("token");
          loadFriendRequests(token);
        }}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
