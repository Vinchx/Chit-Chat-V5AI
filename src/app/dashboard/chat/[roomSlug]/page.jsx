"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  createChatSocket,
  sendMessage,
  sendTyping,
  sendStopTyping,
  sendDeleteMessage,
} from "@/lib/partykit-client";
import useMessageCache from "@/hooks/useMessageCache";
import MessageBubble from "../../../components/MessageBubble";
import MessageInput from "../../../components/MessageInput-partykit";
import ChatHeader from "../../../components/ChatHeader";
import TypingIndicator from "../../../components/TypingIndicator";
import ScrollToBottomButton from "../../../components/ScrollToBottomButton";
import ChatProfileSidebar from "@/components/ChatProfileSidebar";
import GroupInfoSidebar from "@/components/GroupInfoSidebar";

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
  const [editText, setEditText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [friendUserId, setFriendUserId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  // Read receipts state
  const [readReceipts, setReadReceipts] = useState({});

  // Load more messages states
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState(null);

  // AI Model selection
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");

  // AI Enable/Disable state
  const [isAIEnabled, setIsAIEnabled] = useState(true);

  // Initialize message cache hook
  const {
    loadFromCache,
    saveToCache,
    addMessageToCache,
    updateMessageInCache,
    clearCache,
  } = useMessageCache();

  // Load AI preferences from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem("ai-model-preference");
    if (savedModel) {
      setSelectedModel(savedModel);
    }

    // Load AI enabled state (per room)
    if (selectedRoom?.id) {
      const savedAIState = localStorage.getItem(
        `ai-enabled-${selectedRoom.id}`,
      );
      if (savedAIState !== null) {
        setIsAIEnabled(savedAIState === "true");
      }
    }
  }, [selectedRoom?.id]);

  // Handle model change
  const handleModelChange = (model) => {
    setSelectedModel(model);
    localStorage.setItem("ai-model-preference", model);
  };

  // Handle AI toggle
  const handleAIToggle = () => {
    const newState = !isAIEnabled;
    setIsAIEnabled(newState);
    // Save to localStorage per room
    if (selectedRoom?.id) {
      localStorage.setItem(
        `ai-enabled-${selectedRoom.id}`,
        newState.toString(),
      );
    }
  };

  // Helper function to ensure no duplicate messages - ROBUST VERSION
  const deduplicateMessages = (messages) => {
    if (!Array.isArray(messages)) return [];

    // Use Map to ensure uniqueness by ID (last occurrence wins)
    const messageMap = new Map();
    let duplicateCount = 0;

    messages.forEach((msg) => {
      if (!msg || !msg.id) {
        console.warn("⚠️ Message without ID detected, skipping");
        return;
      }

      if (messageMap.has(msg.id)) {
        duplicateCount++;
        console.warn(`⚠️ Duplicate message ID detected: ${msg.id}`);
      }

      messageMap.set(msg.id, msg);
    });

    if (duplicateCount > 0) {
      console.warn(`⚠️ Removed ${duplicateCount} duplicate messages`);
    }

    return Array.from(messageMap.values());
  };

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
          const roomId = data.data.room.id;

          // 🔥 CRITICAL: Always clear messages when loading a new room to prevent cross-contamination
          setMessages([]);

          // Only set room after clearing messages
          setSelectedRoom(data.data.room);

          // 🚀 CACHE OPTIMIZATION: Load from cache first for instant display
          const cachedMessages = loadFromCache(roomId);
          if (cachedMessages && cachedMessages.length > 0) {
            console.log(
              `📦 Loading ${cachedMessages.length} messages from cache for room ${roomId}`,
            );
            // Validate that cached messages are actually from this room
            // This prevents cross-contamination if cache has wrong data
            const validMessages = cachedMessages.filter((msg) => {
              // Messages don't have roomId stored, so we trust the cache key
              // But we log for debugging
              return true;
            });
            setMessages(validMessages);
            setIsLoading(false); // Stop loading immediately with cached data
          }

          // Then load from server in background to ensure fresh data
          // This will replace cache if there's any mismatch
          loadMessages(roomId);

          // Untuk private chat, ambil ID teman
          if (data.data.room.type === "private" && data.data.room.members) {
            const friend = data.data.room.members.find(
              (m) => m._id !== user.id,
            );

            if (friend) {
              setFriendUserId(friend._id);
            }
          } else {
            // Not a private chat or no members
          }
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
  }, [user, roomSlug, router, loadFromCache]);

  // Setup Partykit WebSocket
  useEffect(() => {
    if (!user || !selectedRoom) return;

    const partySocket = createChatSocket(
      selectedRoom.id,
      {
        id: user.id,
        username: user.displayName || user.username,
      },
      {
        // Callback: New message received
        onMessage: (data) => {
          const newMsg = {
            id: data.messageId,
            text: data.message,
            sender: data.username,
            senderId: data.userId,
            time: new Date(data.timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            timestamp: data.timestamp, // Raw timestamp for delete time check
            isOwn: data.userId === user.id,
            attachment: data.attachment || null,
            replyTo: data.replyTo || null,
          };

          setMessages((prev) => {
            // Cek apakah pesan dengan ID yang sama sudah ada
            const existingIndex = prev.findIndex((msg) => msg.id === newMsg.id);
            let updatedMessages;

            if (existingIndex !== -1) {
              // Jika sudah ada, update pesan yang ada (mungkin karena perbedaan waktu)
              updatedMessages = [...prev];
              updatedMessages[existingIndex] = newMsg;
            } else {
              // Jika belum ada, tambahkan pesan baru
              updatedMessages = [...prev, newMsg];
            }

            // Deduplicate to ensure no duplicates from race conditions
            const deduplicated = deduplicateMessages(updatedMessages);

            // 💾 CACHE: Update cache with new message
            if (selectedRoom?.id) {
              addMessageToCache(selectedRoom.id, newMsg);
            }

            return deduplicated;
          });
        },

        // Callback: User joined
        onUserJoined: (data) => {
          // User joined - no action needed
        },

        // Callback: User left
        onUserLeft: (data) => {
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
          setOnlineUsers(users);
        },

        // Callback: Connected
        onConnect: () => {
          // Connected successfully
        },

        // Callback: Disconnected
        onDisconnect: () => {
          // Disconnected - will auto-reconnect
        },

        // Callback: Message deleted
        onMessageDeleted: (data) => {
          setMessages((prevMessages) => {
            const updated = prevMessages.map((msg) =>
              msg.id === data.messageId ? { ...msg, isDeleted: true } : msg,
            );

            // 💾 CACHE: Update cache with deleted message
            if (selectedRoom?.id) {
              updateMessageInCache(selectedRoom.id, data.messageId, {
                isDeleted: true,
              });
            }

            return updated;
          });
        },

        // Callback: Message read (single)
        onMessageRead: (data) => {
          console.log("📬 Message read:", data);
          setReadReceipts((prev) => {
            const existing = prev[data.messageId] || { readBy: [] };
            const alreadyRead = existing.readBy.some(
              (r) => r.userId === data.userId,
            );

            if (!alreadyRead) {
              return {
                ...prev,
                [data.messageId]: {
                  ...existing,
                  readBy: [
                    ...existing.readBy,
                    {
                      userId: data.userId,
                      username: data.username,
                      readAt: data.timestamp,
                    },
                  ],
                },
              };
            }
            return prev;
          });
        },

        // Callback: Room marked as read (bulk)
        onRoomMarkedRead: (data) => {
          console.log("📬 Room marked read by:", data.username);
          // Bulk update - refresh read receipts from API
          if (selectedRoom?.id) {
            fetchReadReceipts(selectedRoom.id);
          }
        },

        // Callback: Error - only log if there's meaningful info
        onError: (error) => {
          if (error?.message || error?.code) {
            console.error("❌ Partykit error:", error.message || error.code);
          }
          // Empty errors are normal WebSocket hiccups, PartySocket auto-reconnects
        },
      },
    );

    setSocket(partySocket);

    // Cleanup on unmount
    return () => {
      partySocket.close();
    };
  }, [user, selectedRoom]);

  // Auto scroll
  useEffect(() => {
    if (messages.length > 0 && !isUserScrolling) {
      requestAnimationFrame(() => {
        const messagesContainer = document.querySelector(
          ".messages-container .overflow-y-auto",
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
          ".messages-container .overflow-y-auto",
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
          senderId: msg.sender.id,
          time: new Date(msg.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: msg.timestamp, // Raw timestamp for delete time check
          isOwn: msg.isOwn,
          isDeleted: msg.isDeleted || false,
          attachment: msg.attachment || null,
          replyTo: msg.replyTo || null,
        }));

        // Set pagination state
        setHasMoreMessages(data.data.hasMore || false);
        setOldestTimestamp(data.data.oldestTimestamp || null);

        // 🔥 CRITICAL FIX: Just use server data directly
        // Don't merge with previous state - server is source of truth
        const uniqueMessages = deduplicateMessages(formattedMessages);

        // 💾 CACHE: Save to cache
        saveToCache(roomId, uniqueMessages);

        // Set messages from server (replacing any cached/old data)
        setMessages(uniqueMessages);

        setTimeout(() => {
          const messagesContainer = document.querySelector(
            ".messages-container .overflow-y-auto",
          );
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      }
      // 📬 Load read receipts after loading messages
      if (roomId) {
        await fetchReadReceipts(roomId);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Delete room handler with confirmation toast
  const handleDeleteRoom = () => {
    const displayName =
      selectedRoom.type === "private" && selectedRoom.friend?.displayName
        ? selectedRoom.friend.displayName
        : selectedRoom.name;

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Hapus chat ini?</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chat dengan <strong>{displayName}</strong> akan dihapus. Kamu bisa
            buat room baru lagi nanti.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t);
                try {
                  const res = await fetch(`/api/rooms/${selectedRoom.id}`, {
                    method: "DELETE",
                  });
                  const data = await res.json();

                  if (data.success) {
                    toast.success(`Chat "${displayName}" berhasil dihapus`);
                    // Force full page reload to refresh room list
                    window.location.href = "/dashboard";
                  } else {
                    toast.error(data.message || "Gagal menghapus chat");
                  }
                } catch (error) {
                  console.error("Error deleting room:", error);
                  toast.error("Terjadi kesalahan saat menghapus chat");
                }
              }}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
            >
              Hapus
            </button>
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Batal
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
      },
    );
  };

  // 📬 Fetch read receipts from API
  const fetchReadReceipts = async (roomId) => {
    try {
      const messageIds = messages.map((m) => m.id).join(",");
      const url = `/api/messages/read-receipts?roomId=${roomId}${messageIds ? `&messageIds=${messageIds}` : ""}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data.readReceipts) {
        const receiptsMap = {};
        data.data.readReceipts.forEach((receipt) => {
          receiptsMap[receipt.messageId] = {
            readBy: receipt.readBy,
            readCount: receipt.readCount,
            totalMembers: receipt.totalMembers,
            isReadByAll: receipt.isReadByAll,
          };
        });
        setReadReceipts(receiptsMap);
      }
    } catch (error) {
      console.error("Error fetching read receipts:", error);
    }
  };

  // 📬 Mark messages as read
  const markMessagesAsRead = async (roomId) => {
    try {
      const response = await fetch("/api/messages/read-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: roomId,
          markAllAsRead: true,
        }),
      });

      const data = await response.json();

      if (data.success && socket) {
        // Broadcast via PartyKit
        socket.send(
          JSON.stringify({
            type: "mark-room-read",
            roomId: roomId,
            messageIds: data.data.messageIds || [],
          }),
        );
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // 📬 Auto mark messages as read when room is opened
  useEffect(() => {
    if (selectedRoom?.id && user?.id && messages.length > 0) {
      // Delay sedikit untuk ensure messages sudah loaded
      const timer = setTimeout(() => {
        markMessagesAsRead(selectedRoom.id);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [selectedRoom?.id, user?.id, messages.length]);

  // 📬 Enrich messages with read receipt status
  const enrichedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    return messages.map((msg) => {
      if (!msg.isOwn) return msg; // Only add read status to own messages

      const receipt = readReceipts[msg.id];

      // Determine read status
      let readStatus = null;

      if (receipt && receipt.readBy && receipt.readBy.length > 0) {
        // Message has been read by at least one person
        const readByNames = receipt.readBy
          .map((r) => r.displayName || r.username)
          .join(", ");

        readStatus = {
          status: "read",
          readCount: receipt.readCount || receipt.readBy.length,
          totalMembers:
            receipt.totalMembers || selectedRoom?.members?.length || 0,
          tooltip:
            selectedRoom?.type === "group"
              ? `Dibaca oleh: ${readByNames}`
              : `Dibaca oleh ${readByNames}`,
        };
      } else {
        // Message sent but not read yet
        readStatus = {
          status: "sent",
          tooltip: "Terkirim",
        };
      }

      return {
        ...msg,
        readStatus,
      };
    });
  }, [messages, readReceipts, selectedRoom?.type, selectedRoom?.members]);

  const loadMoreMessages = async () => {
    if (!selectedRoom || !hasMoreMessages || isLoadingMore || !oldestTimestamp)
      return;

    try {
      setIsLoadingMore(true);

      // Get current scroll position to restore later
      const messagesContainer = document.querySelector(
        ".messages-container .overflow-y-auto",
      );
      const scrollHeightBefore = messagesContainer?.scrollHeight || 0;

      const response = await fetch(
        `/api/messages/room/${selectedRoom.id}?before=${oldestTimestamp}`,
      );
      const data = await response.json();

      if (data.success && data.data.messages.length > 0) {
        const formattedMessages = data.data.messages.map((msg) => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender.displayName,
          senderId: msg.sender.id,
          time: new Date(msg.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: msg.timestamp, // Raw timestamp for delete time check
          isOwn: msg.isOwn,
          isDeleted: msg.isDeleted || false,
          attachment: msg.attachment || null,
          replyTo: msg.replyTo || null,
        }));

        // Update pagination state
        setHasMoreMessages(data.data.hasMore || false);
        setOldestTimestamp(data.data.oldestTimestamp || null);

        // Prepend older messages to existing messages
        setMessages((prevMessages) => [...formattedMessages, ...prevMessages]);

        // Restore scroll position after new messages are added
        // Use requestAnimationFrame for smoother restoration
        requestAnimationFrame(() => {
          if (messagesContainer) {
            const scrollHeightAfter = messagesContainer.scrollHeight;
            const scrollDiff = scrollHeightAfter - scrollHeightBefore;
            // Set scroll position to keep the same messages visible
            messagesContainer.scrollTop = scrollDiff + 10; // +10 to avoid triggering loadMore again immediately
          }
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const scrollToBottom = () => {
    const messagesContainer = document.querySelector(
      ".messages-container .overflow-y-auto",
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
    const isNearTop = scrollTop < 100; // User scrolled near top

    // Load more messages when scrolling near top
    if (isNearTop && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }

    if (isAtBottom) {
      setShowScrollButton(false);
      setIsUserScrolling(false);
    } else {
      setIsUserScrolling(true);
      setShowScrollButton(true);
    }
  };

  const handleSendMessage = async (
    messageText,
    attachment = null,
    replyTo = null,
  ) => {
    if (!socket || (!messageText.trim() && !attachment)) return;

    try {
      // Prepare replyTo data if replying
      let replyToData = null;
      if (replyTo) {
        replyToData = {
          messageId: replyTo.id,
          text: replyTo.text || "",
          sender: replyTo.sender || replyTo.senderId || "",
          senderName: replyTo.sender || "",
          attachment: replyTo.attachment || null,
        };
      }

      // Kirim ke server dulu untuk mendapatkan ID resmi
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          message: messageText,
          messageType: attachment
            ? attachment.type === "image"
              ? "image"
              : "file"
            : "text",
          attachment: attachment,
          replyTo: replyToData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const serverMessageId = result.data.messageId;

        // Kirim via Partykit dengan ID resmi dari server
        sendMessage(socket, {
          id: serverMessageId,
          text: messageText || (attachment ? `📎 ${attachment.filename}` : ""),
          attachment: attachment,
          replyTo: replyToData,
        });

        // Tambahkan pesan langsung ke state lokal dengan ID resmi hanya jika belum ada
        const newMsg = {
          id: serverMessageId,
          text: messageText || (attachment ? `📎 ${attachment.filename}` : ""),
          sender: user.displayName || user.username,
          senderId: user.id,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: new Date().toISOString(), // Raw timestamp for delete time check
          isOwn: true,
          isDeleted: false,
          attachment: attachment,
          replyTo: replyToData,
        };

        setMessages((prevMessages) => {
          // Cek apakah pesan dengan ID yang sama sudah ada
          const existingIndex = prevMessages.findIndex(
            (msg) => msg.id === serverMessageId,
          );
          if (existingIndex !== -1) {
            // Jika sudah ada, jangan tambahkan lagi (mungkin sudah ditambahkan dari onMessage)
            return prevMessages;
          } else {
            // Jika belum ada, tambahkan pesan baru
            const updatedMessages = [...prevMessages, newMsg];

            // 💾 CACHE: Add sent message to cache immediately (optimistic update)
            if (selectedRoom?.id) {
              addMessageToCache(selectedRoom.id, newMsg);
            }

            const deduplicated = deduplicateMessages(updatedMessages);

            return deduplicated;
          }
        });

        // 🤖 Auto-refresh for /ai command in regular chat
        const isAICommand =
          messageText && messageText.trim().toLowerCase().startsWith("/ai ");
        if (isAICommand && selectedRoom.type !== "ai") {
          // Show typing indicator
          setTypingUsers((prev) => new Set(prev).add("AI Assistant"));

          // Helper function to refresh messages
          const refreshForAI = async () => {
            try {
              await loadMessages(selectedRoom.id);
            } catch (error) {
              console.error("Error refreshing messages:", error);
            }
          };

          // First refresh after 5 seconds (AI usually takes 3-5s)
          setTimeout(async () => {
            await refreshForAI();
          }, 5000);

          // Second refresh after 8 seconds (in case AI was slow)
          setTimeout(async () => {
            await refreshForAI();
            // Remove typing indicator after second refresh
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete("AI Assistant");
              return newSet;
            });
          }, 8000);
        }

        // 🤖 AI INTEGRATION: If this is an AI room, get AI response
        if (selectedRoom.type === "ai" && isAIEnabled) {
          // Show AI typing indicator
          setTypingUsers((prev) => new Set(prev).add("AI Assistant"));

          try {
            // Get conversation history for context (last 10 messages)
            const conversationHistory = messages.slice(-10).map((msg) => ({
              role: msg.senderId === user.id ? "user" : "assistant",
              content: msg.text,
            }));

            // Call AI API with selected model
            const aiResponse = await fetch("/api/ai/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: messageText,
                conversationHistory: conversationHistory,
                attachment: attachment, // Pass attachment to AI
                model: selectedModel, // Pass selected model
              }),
            });

            const aiResult = await aiResponse.json();

            // Remove AI typing indicator
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete("AI Assistant");
              return newSet;
            });

            if (aiResult.success) {
              // Save AI response to database
              const aiMessageResponse = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  roomId: selectedRoom.id,
                  message: aiResult.data.response,
                  messageType: "text",
                  senderId: "ai-assistant", // AI sender ID
                }),
              });

              const aiMessageResult = await aiMessageResponse.json();

              if (aiMessageResult.success) {
                const aiMessageId = aiMessageResult.data.messageId;

                // Clean AI response: remove markdown formatting
                let cleanResponse = aiResult.data.response
                  .replace(/\*\*/g, "") // Remove bold markdown
                  .replace(/\*/g, "") // Remove italic markdown
                  .replace(/`/g, "") // Remove code markdown
                  .trim();

                // Broadcast AI response via Partykit
                sendMessage(socket, {
                  id: aiMessageId,
                  text: cleanResponse,
                  userId: "ai-assistant",
                  username: "AI Assistant",
                });

                // Add AI response to local state
                const aiMsg = {
                  id: aiMessageId,
                  text: cleanResponse,
                  sender: "AI Assistant",
                  senderId: "ai-assistant",
                  time: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  isOwn: false,
                  isDeleted: false,
                };

                // Add with duplicate check to prevent race condition with PartyKit broadcast
                setMessages((prevMessages) => {
                  const existingIndex = prevMessages.findIndex(
                    (msg) => msg.id === aiMessageId,
                  );
                  if (existingIndex !== -1) {
                    // Message already exists (from PartyKit broadcast), don't add again
                    return prevMessages;
                  } else {
                    // Message not yet in state, add it for immediate display
                    return [...prevMessages, aiMsg];
                  }
                });
              }
            } else {
              console.error("AI response error:", aiResult.message);
              // Optionally show error message to user
            }
          } catch (aiError) {
            console.error("Error getting AI response:", aiError);
            // Remove AI typing indicator on error
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.delete("AI Assistant");
              return newSet;
            });
          }
        }
      } else {
        console.error("Error saving message to DB:", result.message);
        alert("Gagal mengirim pesan: " + result.message);
      }
    } catch (error) {
      console.error("Error saving message to DB:", error);
      alert("Terjadi kesalahan saat mengirim pesan");
    }
  };

  const handleReplyMessage = (message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleEditMessage = async (message) => {
    setEditingMessage(message);
    setEditText(message.text);
  };

  const saveEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      // Update pesan di server
      const response = await fetch(
        `/api/messages?messageId=${editingMessage.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: editText,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        // Update pesan di state lokal
        setMessages((prevMessages) => {
          const updated = prevMessages.map((msg) =>
            msg.id === editingMessage.id
              ? { ...msg, text: editText, isEdited: true }
              : msg,
          );

          // 💾 CACHE: Update edited message in cache
          if (selectedRoom?.id) {
            updateMessageInCache(selectedRoom.id, editingMessage.id, {
              text: editText,
              isEdited: true,
            });
          }

          return updated;
        });

        // Reset state edit
        setEditingMessage(null);
        setEditText("");
      } else {
        console.error("Gagal mengedit pesan:", result.message);
        alert("Gagal mengedit pesan: " + result.message);
      }
    } catch (error) {
      console.error("Error saat mengedit pesan:", error);
      alert("Terjadi kesalahan saat mengedit pesan");
    }
  };

  const cancelEditMessage = () => {
    setEditingMessage(null);
    setEditText("");
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/messages?messageId=${messageId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Update local state untuk menandai pesan telah dihapus
        setMessages((prevMessages) => {
          const updated = prevMessages.map((msg) =>
            msg.id === messageId ? { ...msg, isDeleted: true } : msg,
          );

          // 💾 CACHE: Update deleted message in cache
          if (selectedRoom?.id) {
            updateMessageInCache(selectedRoom.id, messageId, {
              isDeleted: true,
            });
          }

          return updated;
        });

        // Beri feedback berdasarkan hasil
        if (result.message === "Pesan sudah dihapus sebelumnya") {
          console.log("Pesan sudah dihapus sebelumnya");
        } else {
          console.log("Pesan berhasil dihapus");
        }

        // Broadcast ke semua user di room bahwa pesan telah dihapus
        if (socket) {
          sendDeleteMessage(socket, messageId);
        }
      } else {
        console.error("Gagal menghapus pesan:", result.message);
        // Tampilkan pesan error yang lebih deskriptif
        alert("Gagal menghapus pesan: " + result.message);
      }
    } catch (error) {
      console.error("Error saat menghapus pesan:", error);
      alert("Terjadi kesalahan saat menghapus pesan. Silakan coba lagi.");
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
    typingUsers.size > 0 ? Array.from(typingUsers).join(", ") : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="h-full w-full bg-[radial-gradient(circle,_rgba(139,_69,_195,_0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
      </div>

      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

      <div className="flex h-screen relative z-10">
        <div className="flex-1 backdrop-blur-xl bg-gradient-to-br from-blue-200/40 via-purple-200/30 to-indigo-200/40 dark:backdrop-blur-lg dark:bg-gradient-to-br dark:from-gray-950/80 dark:via-gray-900/60 dark:to-gray-950/80 flex flex-col messages-container relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          ></div>
          <div className="flex flex-col h-full relative">
            <ChatHeader
              selectedRoom={selectedRoom}
              onlineCount={onlineUsers.length}
              onInfoClick={() => setShowProfileSidebar(true)}
              onDeleteRoom={handleDeleteRoom}
            />

            {/* Model Selector & AI Toggle - Only for AI rooms */}
            {selectedRoom?.type === "ai" && (
              <div className="px-3 sm:px-4 py-3 bg-white/30 dark:bg-gray-800/60 backdrop-blur-md border-b border-white/30 dark:border-gray-700">
                {/* AI Toggle Switch */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/30 dark:border-gray-600">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl sm:text-2xl flex-shrink-0">
                      {isAIEnabled ? "🤖" : "💤"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        AI Assistant
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                        {isAIEnabled
                          ? "Aktif - AI akan merespons"
                          : "Nonaktif - AI tidak merespons"}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={handleAIToggle}
                    className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 flex-shrink-0 ml-2 ${
                      isAIEnabled
                        ? "bg-gradient-to-r from-green-400 to-green-600 focus:ring-green-500"
                        : "bg-gray-300 dark:bg-gray-600 focus:ring-gray-400"
                    }`}
                    title={
                      isAIEnabled
                        ? "Klik untuk menonaktifkan AI"
                        : "Klik untuk mengaktifkan AI"
                    }
                  >
                    <span
                      className={`inline-block h-5 w-5 sm:h-6 sm:w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                        isAIEnabled
                          ? "translate-x-6 sm:translate-x-7"
                          : "translate-x-1"
                      }`}
                    >
                      {isAIEnabled && (
                        <span className="flex items-center justify-center h-full w-full text-[10px] sm:text-xs">
                          ✓
                        </span>
                      )}
                    </span>
                  </button>
                </div>

                {/* Model Selector - Only shown when AI is enabled */}
                {isAIEnabled && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 flex-shrink-0">
                        AI Model:
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="w-full sm:flex-1 px-3 py-2 bg-white/70 dark:bg-gray-700 dark:text-white backdrop-blur-sm border border-white/50 dark:border-gray-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                      >
                        <option value="gemini-3-flash-preview">
                          ⚡ Gemini 3 Flash - Latest & Fast
                        </option>
                        <option value="gemini-2.5-flash">
                          🚀 Gemini 2.5 Flash - Stable & Balanced
                        </option>
                      </select>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Choose your preferred AI model. Your selection will be
                      saved automatically.
                    </p>
                  </>
                )}
              </div>
            )}

            <div
              className="flex-1 p-4 pt-20 pb-32 overflow-y-auto scroll-smooth"
              onScroll={handleScroll}
            >
              {/* Load more messages indicator */}
              {isLoadingMore && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-800 dark:text-blue-200 rounded-lg animate-pulse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <span className="text-sm font-medium">
                      Loading more messages...
                    </span>
                  </div>
                </div>
              )}

              {messages && messages.length > 0 ? (
                enrichedMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onDeleteMessage={handleDeleteMessage}
                    onEditMessage={handleEditMessage}
                    onReplyMessage={handleReplyMessage}
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
                      if (e.key === "Enter") {
                        saveEditMessage();
                      } else if (e.key === "Escape") {
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

            {/* Input Chat - Fixed Overlay with Glass Effect */}
            {!editingMessage && (
              <div className="fixed bottom-0 left-0 right-0 z-[100] pb-16 sm:pb-0">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  socket={socket}
                  onTyping={() => socket && sendTyping(socket)}
                  onStopTyping={() => socket && sendStopTyping(socket)}
                  roomId={selectedRoom.id}
                  replyingTo={replyingTo}
                  onCancelReply={handleCancelReply}
                />
              </div>
            )}
          </div>
        </div>

        {/* Conditional Sidebar based on room type */}
        {selectedRoom?.type === "private" ? (
          <ChatProfileSidebar
            isOpen={showProfileSidebar}
            onClose={() => setShowProfileSidebar(false)}
            userId={friendUserId}
            roomId={selectedRoom?.id}
          />
        ) : selectedRoom?.type === "group" ? (
          <GroupInfoSidebar
            isOpen={showProfileSidebar}
            onClose={() => setShowProfileSidebar(false)}
            roomData={selectedRoom}
            currentUserId={user?.id}
          />
        ) : null}
      </div>
    </div>
  );
}
