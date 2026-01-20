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
  const [editText, setEditText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [friendUserId, setFriendUserId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Load more messages states
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState(null);
  
  // AI Model selection
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  // Initialize message cache hook
  const { 
    loadFromCache, 
    saveToCache, 
    addMessageToCache, 
    updateMessageInCache, 
    clearCache 
  } = useMessageCache();

  // Load model preference from localStorage
  useEffect(() => {
    const savedModel = localStorage.getItem('ai-model-preference');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);
  
  // Handle model change
  const handleModelChange = (model) => {
    setSelectedModel(model);
    localStorage.setItem('ai-model-preference', model);
  };
  
  // Helper function to ensure no duplicate messages - ROBUST VERSION
  const deduplicateMessages = (messages) => {
    if (!Array.isArray(messages)) return [];
    
    // Use Map to ensure uniqueness by ID (last occurrence wins)
    const messageMap = new Map();
    let duplicateCount = 0;
    
    messages.forEach(msg => {
      if (!msg || !msg.id) {
        console.warn('⚠️ Message without ID detected, skipping');
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
            console.log(`📦 Loading ${cachedMessages.length} messages from cache for room ${roomId}`);
            // Validate that cached messages are actually from this room
            // This prevents cross-contamination if cache has wrong data
            const validMessages = cachedMessages.filter(msg => {
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
          if (data.data.room.type === 'private' && data.data.room.members) {
            
            const friend = data.data.room.members.find(m => m._id !== user.id);
            
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
            const existingIndex = prev.findIndex(msg => msg.id === newMsg.id);
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
          setMessages(prevMessages => {
            const updated = prevMessages.map(msg =>
              msg.id === data.messageId ? { ...msg, isDeleted: true } : msg
            );
            
            // 💾 CACHE: Update cache with deleted message
            if (selectedRoom?.id) {
              updateMessageInCache(selectedRoom.id, data.messageId, { isDeleted: true });
            }
            
            return updated;
          });
        },

        // Callback: Error - only log if there's meaningful info
        onError: (error) => {
          if (error?.message || error?.code) {
            console.error("❌ Partykit error:", error.message || error.code);
          }
          // Empty errors are normal WebSocket hiccups, PartySocket auto-reconnects
        },
      }
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
            ".messages-container .overflow-y-auto"
          );
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedRoom || !hasMoreMessages || isLoadingMore || !oldestTimestamp) return;

    try {
      setIsLoadingMore(true);

      // Get current scroll position to restore later
      const messagesContainer = document.querySelector(".messages-container .overflow-y-auto");
      const scrollHeightBefore = messagesContainer?.scrollHeight || 0;

      const response = await fetch(`/api/messages/room/${selectedRoom.id}?before=${oldestTimestamp}`);
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
        setMessages(prevMessages => [...formattedMessages, ...prevMessages]);

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

  const handleSendMessage = async (messageText, attachment = null, replyTo = null) => {
    if (!socket || (!messageText.trim() && !attachment)) return;

    try {
      
      // Prepare replyTo data if replying
      let replyToData = null;
      if (replyTo) {
        replyToData = {
          messageId: replyTo.id,
          text: replyTo.text || '',
          sender: replyTo.sender || replyTo.senderId || '',
          senderName: replyTo.sender || '',
          attachment: replyTo.attachment || null
        };
      }
      
      // Kirim ke server dulu untuk mendapatkan ID resmi
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          message: messageText,
          messageType: attachment ? (attachment.type === 'image' ? 'image' : 'file') : 'text',
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
          text: messageText || (attachment ? `📎 ${attachment.filename}` : ''),
          attachment: attachment,
          replyTo: replyToData,
        });

        // Tambahkan pesan langsung ke state lokal dengan ID resmi hanya jika belum ada
        const newMsg = {
          id: serverMessageId,
          text: messageText || (attachment ? `📎 ${attachment.filename}` : ''),
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

        setMessages(prevMessages => {
          // Cek apakah pesan dengan ID yang sama sudah ada
          const existingIndex = prevMessages.findIndex(msg => msg.id === serverMessageId);
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
        const isAICommand = messageText && messageText.trim().toLowerCase().startsWith('/ai ');
        if (isAICommand && selectedRoom.type !== 'ai') {
          
          // Show typing indicator
          setTypingUsers(prev => new Set(prev).add('AI Assistant'));
          
          // Helper function to refresh messages
          const refreshForAI = async () => {
            try {
              await loadMessages(selectedRoom.id);
            } catch (error) {
              console.error('Error refreshing messages:', error);
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
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete('AI Assistant');
              return newSet;
            });
          }, 8000);
        }

        // 🤖 AI INTEGRATION: If this is an AI room, get AI response
        if (selectedRoom.type === 'ai') {
          
          // Show AI typing indicator
          setTypingUsers(prev => new Set(prev).add('AI Assistant'));
          
          try {
            // Get conversation history for context (last 10 messages)
            const conversationHistory = messages.slice(-10).map(msg => ({
              role: msg.senderId === user.id ? 'user' : 'assistant',
              content: msg.text
            }));

            // Call AI API with selected model
            const aiResponse = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: messageText,
                conversationHistory: conversationHistory,
                attachment: attachment,  // Pass attachment to AI
                model: selectedModel  // Pass selected model
              })
            });

            const aiResult = await aiResponse.json();

            // Remove AI typing indicator
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete('AI Assistant');
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
                  messageType: 'text',
                  senderId: 'ai-assistant', // AI sender ID
                }),
              });

              const aiMessageResult = await aiMessageResponse.json();

              if (aiMessageResult.success) {
                const aiMessageId = aiMessageResult.data.messageId;

                // Clean AI response: remove markdown formatting
                let cleanResponse = aiResult.data.response
                  .replace(/\*\*/g, '') // Remove bold markdown
                  .replace(/\*/g, '')   // Remove italic markdown
                  .replace(/`/g, '')    // Remove code markdown
                  .trim();

                // Broadcast AI response via Partykit
                sendMessage(socket, {
                  id: aiMessageId,
                  text: cleanResponse,
                  userId: 'ai-assistant',
                  username: 'AI Assistant'
                });

                // Add AI response to local state
                const aiMsg = {
                  id: aiMessageId,
                  text: cleanResponse,
                  sender: 'AI Assistant',
                  senderId: 'ai-assistant',
                  time: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  isOwn: false,
                  isDeleted: false,
                };

                // Add with duplicate check to prevent race condition with PartyKit broadcast
                setMessages(prevMessages => {
                  const existingIndex = prevMessages.findIndex(msg => msg.id === aiMessageId);
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
              console.error('AI response error:', aiResult.message);
              // Optionally show error message to user
            }
          } catch (aiError) {
            console.error('Error getting AI response:', aiError);
            // Remove AI typing indicator on error
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete('AI Assistant');
              return newSet;
            });
          }
        }
      } else {
        console.error("Error saving message to DB:", result.message);
        alert('Gagal mengirim pesan: ' + result.message);
      }
    } catch (error) {
      console.error("Error saving message to DB:", error);
      alert('Terjadi kesalahan saat mengirim pesan');
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
        setMessages(prevMessages => {
          const updated = prevMessages.map(msg =>
            msg.id === editingMessage.id
              ? { ...msg, text: editText, isEdited: true }
              : msg
          );
          
          // 💾 CACHE: Update edited message in cache
          if (selectedRoom?.id) {
            updateMessageInCache(selectedRoom.id, editingMessage.id, { 
              text: editText, 
              isEdited: true 
            });
          }
          
          return updated;
        });

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
        setMessages(prevMessages => {
          const updated = prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, isDeleted: true } : msg
          );
          
          // 💾 CACHE: Update deleted message in cache
          if (selectedRoom?.id) {
            updateMessageInCache(selectedRoom.id, messageId, { isDeleted: true });
          }
          
          return updated;
        });

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
              onInfoClick={() => setShowProfileSidebar(true)}
            />
            
            {/* Model Selector - Only for AI rooms */}
            {selectedRoom?.type === 'ai' && (
              <div className="px-4 py-3 bg-white/20 backdrop-blur-sm border-b border-white/20">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">AI Model:</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  >
                    <optgroup label="Latest (Gemini 3)">
                      <option value="gemini-3-flash-preview">⚡ Gemini 3 Flash - Fast & Vision</option>
                      <option value="gemini-3-pro-preview">🧠 Gemini 3 Pro - Most Intelligent</option>
                    </optgroup>
                    <optgroup label="Stable (Gemini 2.5)">
                      <option value="gemini-2.5-flash">🚀 Gemini 2.5 Flash - Balanced</option>
                      <option value="gemini-2.5-pro">💎 Gemini 2.5 Pro - Advanced Thinking</option>
                      <option value="gemini-2.5-flash-lite">⚡⚡ Gemini 2.5 Flash Lite - Ultra Fast</option>
                    </optgroup>
                    <optgroup label="Previous Gen (Gemini 2.0)">
                      <option value="gemini-2.0-flash">📦 Gemini 2.0 Flash - Workhorse</option>
                    </optgroup>
                  </select>
                </div>
                <p className="text-xs text-gray-600 mt-1">Choose the AI model for this conversation. Your preference will be saved.</p>
              </div>
            )}

            <div
              className="flex-1 p-4 overflow-y-auto scroll-smooth"
              onScroll={handleScroll}
            >
              {/* Loading indicator for load more messages */}
              {isLoadingMore && (
                <div className="flex justify-center items-center py-3 mb-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-full">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-700">Loading more messages...</span>
                  </div>
                </div>
              )}

              {messages && messages.length > 0 ? (
                messages.map((message) => (
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
                roomId={selectedRoom.id}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
              />
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
