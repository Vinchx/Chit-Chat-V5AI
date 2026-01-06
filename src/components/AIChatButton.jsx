"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AIChatButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartAIChat = async () => {
    setIsLoading(true);
    try {
      // Create or navigate to AI chat room
      // We'll use a special room ID for AI: "ai-assistant"
      const aiRoomId = "ai-assistant";
      
      // Navigate to AI chat room
      router.push(`/dashboard/chat/${aiRoomId}`);
    } catch (error) {
      console.error("Error starting AI chat:", error);
      alert("Gagal memulai chat dengan AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartAIChat}
      disabled={isLoading}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      title="Chat dengan AI Assistant"
    >
      <span className="text-2xl">🤖</span>
      <div className="flex-1 text-left">
        <div className="font-semibold">AI Assistant</div>
        <div className="text-xs text-purple-100">
          {isLoading ? "Memuat..." : "Chat dengan ChitChat AI"}
        </div>
      </div>
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5l7 7-7 7" 
        />
      </svg>
    </button>
  );
}
