"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";
import GlassSurface from "@/components/GlassSurface";

export default function MessageInput({
  onSendMessage,
  socket,
  onTyping,
  onStopTyping,
  roomId,
  replyingTo,
  onCancelReply,
}) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (socket) {
      if (!isTyping && value.length > 0 && onTyping) {
        setIsTyping(true);
        onTyping();
      }

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      if (value.length > 0) {
        typingTimerRef.current = setTimeout(() => {
          setIsTyping(false);
          if (onStopTyping) {
            onStopTyping();
          }
        }, 2000);
      } else {
        setIsTyping(false);
        if (onStopTyping) {
          onStopTyping();
        }
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      toast.error(`File terlalu besar! Maksimal ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);

    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" && !selectedFile) {
      return;
    }

    setIsTyping(false);
    if (onStopTyping) {
      onStopTyping();
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    let attachment = null;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("roomId", roomId);

        const response = await fetch("/api/upload/chat", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          attachment = data.data;
        } else {
          toast.error("Gagal upload file: " + data.message);
          setIsUploading(false);
          return;
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Terjadi kesalahan saat upload file");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    if (onSendMessage) {
      await onSendMessage(newMessage, attachment, replyingTo);
    }

    setNewMessage("");
    handleRemoveFile();

    if (onCancelReply) {
      onCancelReply();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={0}
      backgroundOpacity={0}
      blur={50}
      saturation={0.5}
      brightness={50}
      opacity={0.93}
      displace={0.3}
      distortionScale={30}
      redOffset={0}
      greenOffset={10}
      blueOffset={20}
      borderWidth={0.07}
      className="!p-0 !rounded-none !items-stretch !justify-start"
    >
      <div className="w-full px-3 sm:px-4 py-3 sm:py-4 pb-safe">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-blue-100/60 dark:bg-blue-500/20 rounded-xl border border-blue-300/50 dark:border-blue-400/30 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-300 mb-1">
                  Replying to {replyingTo.sender}
                </p>
                <div className="flex items-center gap-2">
                  {replyingTo.attachment && (
                    <span className="text-xs sm:text-sm flex-shrink-0">
                      {replyingTo.attachment.type === "image" ? "🖼️" : "📎"}
                    </span>
                  )}
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                    {replyingTo.text || "[Attachment]"}
                  </p>
                </div>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 hover:bg-red-500/20 rounded-full transition-colors flex-shrink-0 ml-2"
                title="Cancel reply"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-white/10 dark:bg-gray-700/20 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="flex items-start space-x-2 sm:space-x-3">
              {filePreview ? (
                <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={filePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-red-500/20 rounded-full transition-colors flex-shrink-0"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        {/* Input Area */}
        <div className="flex gap-1 sm:gap-2 items-center">
          {/* File Attach Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 sm:p-3 md:p-4 bg-white/95 dark:bg-black/65 backdrop-blur-sm border border-gray-300/50 dark:border-white/20 rounded-full hover:bg-white/90 dark:hover:bg-white/20 transition-all disabled:opacity-50 hover:scale-105 flex-shrink-0"
            title="Attach file"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
            className="hidden"
          />

          {/* Text Input */}
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isUploading}
            className="flex-1 min-w-0 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 bg-white/95 dark:bg-black/65 backdrop-blur-sm border border-gray-300/50 dark:border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-white-400/50 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 transition-all"
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={
              isUploading || (newMessage.trim() === "" && !selectedFile)
            }
            className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-white/95 dark:bg-black/65 backdrop-blur-sm border border-gray-300/50 dark:border-white/20 rounded-full hover:bg-white dark:hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg flex-shrink-0 text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-100"
          >
            {isUploading ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <svg
                  className="animate-spin h-3 w-3 sm:h-4 sm:w-4"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="hidden sm:inline">Uploading...</span>
              </span>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </GlassSurface>
  );
}
