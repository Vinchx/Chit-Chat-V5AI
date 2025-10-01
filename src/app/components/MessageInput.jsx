"use client";

import { useState, useRef } from "react";

export default function MessageInput({
  onSendMessage,
  user,
  socket,
  selectedRoom,
}) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Jika ada socket, user, dan selectedRoom
    if (socket && user && selectedRoom) {
      // Mulai typing jika belum typing dan ada text
      if (!isTyping && value.length > 0) {
        console.log(
          "🟢 SENDING typing_start:",
          user.displayName,
          "in room:",
          selectedRoom.id
        );
        setIsTyping(true);
        socket.emit("typing_start", {
          userName: user.displayName,
          roomId: selectedRoom.id, // ← FIX: Pakai room ID yang sebenarnya
        });
      }

      // Clear timer lama
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      // Set timer baru
      if (value.length > 0) {
        typingTimerRef.current = setTimeout(() => {
          setIsTyping(false);
          socket.emit("typing_stop", {
            userName: user.displayName,
            roomId: selectedRoom.id, // ← FIX: Pakai room ID yang sebenarnya
          });
        }, 2000);
      } else {
        // Jika input kosong, langsung stop
        if (isTyping) {
          setIsTyping(false);
          socket.emit("typing_stop", {
            userName: user.displayName,
            roomId: selectedRoom.id, // ← FIX: Pakai room ID yang sebenarnya
          });
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedRoom) {
      return;
    }

    // Stop typing indicator saat kirim pesan
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit("typing_stop", {
        userName: user.displayName,
        roomId: selectedRoom.id, // ← FIX: Pakai room ID yang sebenarnya
      });
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    }

    const messageData = {
      text: newMessage,
      sender: user.displayName,
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    // 1. Tambahin bubble di layar dulu (biar cepet)
    onSendMessage(messageData);

    // 2. Kirim ke database via API
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoom.id, // ← FIX: Pakai room ID yang sebenarnya
          message: newMessage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Pesan berhasil disimpan ke database!");
      } else {
        console.log("⚠️ Skip database error - pesan tetap dikirim via socket");
      }
    } catch (error) {
      console.log("⚠️ Skip database error - pesan tetap dikirim via socket");
    }

    // 3. Socket.io (kalau ada)
    if (socket) {
      socket.emit("send_message", {
        text: newMessage,
        sender: user.displayName,
        time: messageData.time,
        roomId: selectedRoom.id, // ← FIX: Pakai room ID yang sebenarnya
      });
    }

    setNewMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 border-t border-white/30 backdrop-blur-lg bg-white/20">
      <div className="flex space-x-3">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600"
        />
        <button
          onClick={handleSendMessage}
          className="px-6 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-full hover:from-blue-500 hover:to-purple-500 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
