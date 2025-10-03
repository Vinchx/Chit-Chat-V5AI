"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import io from "socket.io-client";
import MessageBubble from "../../../components/MessageBubble";
import MessageInput from "../../../components/MessageInput";
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
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedRoomRef = useRef(null);

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
          // Room tidak ditemukan, redirect ke dashboard
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

  // Setup Socket.IO
  useEffect(() => {
    if (!user) return;

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("📞 Connected to server!", newSocket.id);
    });

    newSocket.on("receive_message", (messageData) => {
      console.log("📨 Received message:", messageData);
      const newMsg = {
        id: Date.now(),
        text: messageData.text,
        sender: messageData.sender,
        time: messageData.time,
        isOwn: false,
      };
      setMessages((prevMessages) => [...prevMessages, newMsg]);
    });

    newSocket.on("typing_start", (data) => {
      if (data.roomId === selectedRoomRef.current?.id) {
        setIsTyping(true);
        setTypingUser(data.userName);
      }
    });

    newSocket.on("typing_stop", (data) => {
      if (data.roomId === selectedRoomRef.current?.id) {
        setIsTyping(false);
        setTypingUser("");
      }
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [user]);

  // Update selectedRoomRef dan join room
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;

    if (socket && selectedRoom) {
      console.log("📍 Joining room:", selectedRoom.id);
      socket.emit("join_room", selectedRoom.id);
    }
  }, [selectedRoom, socket]);

  // Auto scroll
  useEffect(() => {
    if (messages.length > 0 && !isUserScrolling) {
      requestAnimationFrame(() => {
        const messagesContainer = document.querySelector(".messages-container .overflow-y-auto");
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
    if (isTyping && !isUserScrolling) {
      requestAnimationFrame(() => {
        const messagesContainer = document.querySelector(".messages-container .overflow-y-auto");
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

  const loadMessages = async (roomId) => {
    try {
      const response = await fetch(`/api/messages/${roomId}`);
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

        setTimeout(() => {
          const messagesContainer = document.querySelector(".messages-container .overflow-y-auto");
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
    const messagesContainer = document.querySelector(".messages-container .overflow-y-auto");
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

  if (isLoading || !user || !selectedRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

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
            <ChatHeader selectedRoom={selectedRoom} />

            <div className="flex-1 p-4 overflow-y-auto scroll-smooth" onScroll={handleScroll}>
              {messages && messages.length > 0 ? (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              ) : (
                <div className="text-center text-gray-500 mt-20">
                  <p>Belum ada pesan di room ini</p>
                </div>
              )}

              <TypingIndicator isTyping={isTyping} userName={typingUser} />
            </div>

            {showScrollButton && (
              <ScrollToBottomButton onClick={scrollToBottom} />
            )}

            <MessageInput
              onSendMessage={handleReceiveMessage}
              user={user}
              socket={socket}
              selectedRoom={selectedRoom}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
