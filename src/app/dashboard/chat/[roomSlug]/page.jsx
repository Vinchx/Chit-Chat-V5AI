"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  createChatSocket,
  sendMessage,
  sendTyping,
  sendStopTyping,
  sendDeleteMessage,
} from "@/lib/partykit-client";
import MessageBubble from "../../../components/MessageBubble";
import MessageInput from "../../../components/MessageInput-partykit";
import ChatHeader from "../../../components/ChatHeader";
import TypingIndicator from "../../../components/TypingIndicator";
import ScrollToBottomButton from "../../../components/ScrollToBottomButton";

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const roomSlug = params.roomSlug;

  const [user, setUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth dan load user
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
    }
  }, [status, session, router]);

  // Load room berdasarkan slug
  useEffect(() => {
    if (!user || !roomSlug) return;

    const loadRoom = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/rooms/by-slug/${roomSlug}`);
        const data = await response.json();

        if (data.success) {
          setSelectedRoom(data.data.room);
          loadMessages(data.data.room.id);
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error loading room:", error);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadRoom();
  }, [user, roomSlug, router]);

  // Setup Partykit WebSocket
  useEffect(() => {
    if (!user || !selectedRoom) return;

    console.log("🎉 Connecting to Partykit room:", selectedRoom.id);

    const partySocket = createChatSocket(
      selectedRoom.id,
      {
        id: user.id,
        username: user.displayName || user.username,
      },
      {
        // Callback: New message received
        onMessage: (data) => {
          console.log("📨 New message:", data);

          const newMsg = {
            id: data.messageId,
            text: data.message,
            sender: data.username,
            time: new Date(data.timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isOwn: data.userId === user.id,
          };

          setMessages((prev) => {
            // Cek apakah pesan dengan ID yang sama sudah ada
            const existingIndex = prev.findIndex(msg => msg.id === newMsg.id);
            if (existingIndex !== -1) {
              // Jika sudah ada, update pesan yang ada (mungkin karena perbedaan waktu)
              const updatedMessages = [...prev];
              updatedMessages[existingIndex] = newMsg;
              return updatedMessages;
            } else {
              // Jika belum ada, tambahkan pesan baru
              return [...prev, newMsg];
            }
          });
        },

        // Callback: User joined
        onUserJoined: (data) => {
          console.log("👋 User joined:", data.username);
          // Optional: Show notification
        },

        // Callback: User left
        onUserLeft: (data) => {
          console.log("👋 User left:", data.username);
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        },

        // Callback: User typing
        onTyping: (data) => {
          if (data.userId !== user.id) {
            setTypingUsers((prev) => new Set(prev).add(data.username));

            // Auto remove setelah 3 detik
            setTimeout(() => {
              setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.username);
                return newSet;
              });
            }, 3000);
          }
        },

        // Callback: User stop typing
        onStopTyping: (data) => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.username);
            return newSet;
          });
        },

        // Callback: Online users list
        onOnlineUsers: (users) => {
          console.log("👥 Online users:", users);
          setOnlineUsers(users);
        },

        // Callback: Connected
        onConnect: () => {
          console.log("✅ Connected to Partykit!");
        },

        // Callback: Disconnected
        onDisconnect: () => {
          console.log("❌ Disconnected from Partykit");
        },

        // Callback: Message deleted
        onMessageDeleted: (data) => {
          console.log("🗑️ Message deleted:", data);
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === data.messageId ? { ...msg, isDeleted: true } : msg
            )
          );
        },

        // Callback: Error
        onError: (error) => {
          console.error("❌ Partykit error:", error);
        },
      }
    );

    setSocket(partySocket);

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up Partykit connection");
      partySocket.close();
    };
  }, [user, selectedRoom]);

  // Auto scroll
  useEffect(() => {
    if (messages.length > 0 && !isUserScrolling) {
      requestAnimationFrame(() => {
        const messagesContainer = document.querySelector(
          ".messages-container .overflow-y-auto"
        );
        if (messagesContainer) {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
          const lastMessage = messages[messages.length - 1];

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

  // Typing indicator scroll
  useEffect(() => {
    if (typingUsers.size > 0 && !isUserScrolling) {
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
  }, [typingUsers.size, isUserScrolling]);

  const loadMessages = async (roomId) => {
    try {
      const response = await fetch(`/api/messages/room/${roomId}`);
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
          isDeleted: msg.isDeleted || false,
        }));

        // Gunakan pesan dari server sebagai sumber kebenaran
        // Hanya ambil perubahan lokal untuk isDeleted karena penghapusan tidak selalu konsisten ke server segera
        setMessages(prevMessages => {
          // Buat map dari pesan lokal untuk membandingkan status penghapusan
          const localMessagesMap = new Map(prevMessages.map(msg => [msg.id, msg]));

          // Update pesan dari server dengan status penghapusan lokal (jika ada)
          const updatedMessages = formattedMessages.map(serverMsg => {
            const localMsg = localMessagesMap.get(serverMsg.id);
            if (localMsg) {
              // Ambil status penghapusan dari lokal karena mungkin belum disinkron ke server
              return {
                ...serverMsg, // Data dari server sebagai sumber utama (termasuk isEdited dari DB)
                isDeleted: localMsg.isDeleted !== undefined ? localMsg.isDeleted : serverMsg.isDeleted,
              };
            }
            return serverMsg;
          });

          // Tambahkan pesan lokal yang tidak ada di server (baru dikirim tapi blm diterima server)
          const serverMessageIds = new Set(formattedMessages.map(msg => msg.id));
          const newLocalMessages = prevMessages.filter(prevMsg =>
            !serverMessageIds.has(prevMsg.id)
          );

          return [...updatedMessages, ...newLocalMessages];
        });

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

  const handleSendMessage = async (messageText) => {
    if (!socket || !messageText.trim()) return;

    try {
      // Kirim ke server dulu untuk mendapatkan ID resmi
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          message: messageText,
          messageType: "text",
        }),
      });

      const result = await response.json();

      if (result.success) {
        const serverMessageId = result.data.messageId;

        // Kirim via Partykit dengan ID resmi dari server
        sendMessage(socket, {
          id: serverMessageId,
          text: messageText,
        });

        // Tambahkan pesan langsung ke state lokal dengan ID resmi hanya jika belum ada
        const newMsg = {
          id: serverMessageId,
          text: messageText,
          sender: user.displayName || user.username,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isOwn: true,
          isDeleted: false,
        };

        setMessages(prevMessages => {
          // Cek apakah pesan dengan ID yang sama sudah ada
          const existingIndex = prevMessages.findIndex(msg => msg.id === serverMessageId);
          if (existingIndex !== -1) {
            // Jika sudah ada, jangan tambahkan lagi (mungkin sudah ditambahkan dari onMessage)
            return prevMessages;
          } else {
            // Jika belum ada, tambahkan pesan baru
            return [...prevMessages, newMsg];
          }
        });
      } else {
        console.error("Error saving message to DB:", result.message);
      }
    } catch (error) {
      console.error("Error saving message to DB:", error);
    }
  };

  const handleEditMessage = async (message) => {
    setEditingMessage(message);
    setEditText(message.text);
  };

  const saveEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      // Update pesan di server
      const response = await fetch(`/api/messages?messageId=${editingMessage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editText
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update pesan di state lokal
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === editingMessage.id
              ? { ...msg, text: editText, isEdited: true }
              : msg
          )
        );

        // Reset state edit
        setEditingMessage(null);
        setEditText('');
      } else {
        console.error('Gagal mengedit pesan:', result.message);
        alert('Gagal mengedit pesan: ' + result.message);
      }
    } catch (error) {
      console.error('Error saat mengedit pesan:', error);
      alert('Terjadi kesalahan saat mengedit pesan');
    }
  };

  const cancelEditMessage = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/messages?messageId=${messageId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Update local state untuk menandai pesan telah dihapus
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, isDeleted: true } : msg
          )
        );

        // Beri feedback berdasarkan hasil
        if (result.message === "Pesan sudah dihapus sebelumnya") {
          console.log('Pesan sudah dihapus sebelumnya');
        } else {
          console.log('Pesan berhasil dihapus');
        }

        // Broadcast ke semua user di room bahwa pesan telah dihapus
        if (socket) {
          sendDeleteMessage(socket, messageId);
        }
      } else {
        console.error('Gagal menghapus pesan:', result.message);
        // Tampilkan pesan error yang lebih deskriptif
        alert('Gagal menghapus pesan: ' + result.message);
      }
    } catch (error) {
      console.error('Error saat menghapus pesan:', error);
      alert('Terjadi kesalahan saat menghapus pesan. Silakan coba lagi.');
    }
  };

  if (isLoading || !user || !selectedRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const typingText =
    typingUsers.size > 0
      ? Array.from(typingUsers).join(", ")
      : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>

      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

      <div className="flex h-screen relative z-10">
        <div className="flex-1 backdrop-blur-lg bg-white/10 flex flex-col messages-container">
          <div className="flex flex-col h-full relative">
            <ChatHeader
              selectedRoom={selectedRoom}
              onlineCount={onlineUsers.length}
            />

            <div
              className="flex-1 p-4 overflow-y-auto scroll-smooth"
              onScroll={handleScroll}
            >
              {messages && messages.length > 0 ? (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onDeleteMessage={handleDeleteMessage}
                    onEditMessage={handleEditMessage}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 mt-20">
                  <p>Belum ada pesan di room ini</p>
                </div>
              )}

              <TypingIndicator
                isTyping={typingUsers.size > 0}
                userName={typingText}
              />
            </div>

            {showScrollButton && (
              <ScrollToBottomButton onClick={scrollToBottom} />
            )}

            {/* Edit Message Form - hanya muncul saat sedang mengedit */}
            {editingMessage && (
              <div className="p-4 border-t border-white/20 bg-white/5">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        saveEditMessage();
                      } else if (e.key === 'Escape') {
                        cancelEditMessage();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600"
                    placeholder="Edit pesan..."
                    autoFocus
                  />
                  <button
                    onClick={saveEditMessage}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={cancelEditMessage}
                    className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {!editingMessage && (
              <MessageInput
                onSendMessage={handleSendMessage}
                socket={socket}
                onTyping={() => socket && sendTyping(socket)}
                onStopTyping={() => socket && sendStopTyping(socket)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
