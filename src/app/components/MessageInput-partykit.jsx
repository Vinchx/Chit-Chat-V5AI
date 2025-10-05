"use client";

import { useState, useRef } from "react";

export default function MessageInput({
  onSendMessage,
  socket,
  onTyping,
  onStopTyping,
}) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Typing indicator
    if (socket) {
      // Kirim typing event HANYA jika belum typing dan ada text
      if (!isTyping && value.length > 0 && onTyping) {
        setIsTyping(true);
        onTyping();
      }

      // Clear timer lama
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      // Set timer baru untuk auto-stop typing
      if (value.length > 0) {
        typingTimerRef.current = setTimeout(() => {
          setIsTyping(false);
          if (onStopTyping) {
            onStopTyping();
          }
        }, 2000);
      } else {
        // Jika input kosong, langsung stop
        setIsTyping(false);
        if (onStopTyping) {
          onStopTyping();
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") {
      return;
    }

    // Stop typing indicator saat kirim pesan
    setIsTyping(false);
    if (onStopTyping) {
      onStopTyping();
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Kirim message via callback (Partykit handled di parent)
    if (onSendMessage) {
      await onSendMessage(newMessage);
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
