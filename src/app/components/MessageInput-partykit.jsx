"use client";

import { useState, useRef } from "react";
import Image from "next/image";

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      alert(`File terlalu besar! Maksimal ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);

    // Create preview for images
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
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" && !selectedFile) {
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

    let attachment = null;

    // Upload file if selected
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('roomId', roomId);

        const response = await fetch('/api/upload/chat', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        
        if (data.success) {
          attachment = data.data;
        } else {
          alert('Gagal upload file: ' + data.message);
          setIsUploading(false);
          return;
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Terjadi kesalahan saat upload file');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // Kirim message via callback (Partykit handled di parent)
    if (onSendMessage) {
      await onSendMessage(newMessage, attachment, replyingTo);
    }

    setNewMessage("");
    handleRemoveFile();
    
    // Clear reply mode after sending
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
    <div className="p-4 border-t border-white/30 backdrop-blur-lg bg-white/20">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-700 mb-1">
                Replying to {replyingTo.sender}
              </p>
              <div className="flex items-center gap-2">
                {replyingTo.attachment && (
                  <span className="text-sm">
                    {replyingTo.attachment.type === 'image' ? '🖼️' : '📎'}
                  </span>
                )}
                <p className="text-sm text-gray-700 truncate">
                  {replyingTo.text || '[Attachment]'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-red-100 rounded-full transition-colors"
              title="Cancel reply"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-white/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            {filePreview ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={filePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-1 hover:bg-red-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex space-x-3">
        {/* File Attach Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-full hover:bg-white/40 transition-colors disabled:opacity-50"
          title="Attach file"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
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
          className="flex-1 px-4 py-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600 disabled:opacity-50"
        />

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={isUploading || (newMessage.trim() === "" && !selectedFile)}
          className="px-6 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-full hover:from-blue-500 hover:to-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
