"use client";

import { useState, useRef } from "react";
import FilePreview from "./FilePreview";

export default function MessageInput({
  onSendMessage,
  user,
  socket,
  selectedRoom,
}) {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // File type configurations
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

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
          roomId: selectedRoom.id,
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
            roomId: selectedRoom.id,
          });
        }, 2000);
      } else {
        // Jika input kosong, langsung stop
        if (isTyping) {
          setIsTyping(false);
          socket.emit("typing_stop", {
            userName: user.displayName,
            roomId: selectedRoom.id,
          });
        }
      }
    }
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setUploadError(null);

    console.log("📎 File selected:", file.name, "Type:", file.type, "Size:", file.size);

    // Validate file type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

    if (!isImage && !isDocument) {
      const errorMsg = 'File type not supported. Allowed: images (JPG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, TXT, ZIP)';
      console.error("❌ File type validation failed:", file.type);
      setUploadError(errorMsg);
      return;
    }

    // Validate file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const errorMsg = `File too large. Max size: ${maxSizeMB}MB`;
      console.error("❌ File size validation failed:", file.size, "Max:", maxSize);
      setUploadError(errorMsg);
      return;
    }

    console.log("✅ File validation passed, starting upload...");

    // Set selected file and start upload
    setSelectedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', selectedRoom.id);

      console.log("📤 Uploading to /api/upload/chat with roomId:", selectedRoom.id);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("📥 Upload response status:", response.status);

      const result = await response.json();
      console.log("📥 Upload response data:", result);

      if (response.ok && result.success) {
        setUploadedFileData(result.data);
        console.log('✅ File uploaded successfully:', result.data);
      } else {
        const errorMsg = result.message || 'Failed to upload file';
        console.error('❌ Upload failed:', errorMsg, result);
        setUploadError(errorMsg);
        setSelectedFile(null);
        setUploadedFileData(null);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadError('Error uploading file. Please try again.');
      setSelectedFile(null);
      setUploadedFileData(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedFileData(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    // Allow sending if there's text or an uploaded file
    if (newMessage.trim() === "" && !uploadedFileData) {
      return;
    }

    if (!selectedRoom) {
      return;
    }

    console.log("📤 Sending message with attachment:", uploadedFileData);

    // Stop typing indicator saat kirim pesan
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit("typing_stop", {
        userName: user.displayName,
        roomId: selectedRoom.id,
      });
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    }

    const messageData = {
      text: newMessage || (uploadedFileData ? '' : ''),
      sender: user.displayName,
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    // Add attachment if exists
    if (uploadedFileData) {
      messageData.attachment = uploadedFileData;
    }

    // 1. Tambahin bubble di layar dulu (biar cepet)
    onSendMessage(messageData);

    // 2. Kirim ke database via API
    try {
      const token = localStorage.getItem("token");

      const requestBody = {
        roomId: selectedRoom.id,
        message: newMessage.trim(),
      };

      // Add attachment if exists
      if (uploadedFileData) {
        requestBody.attachment = uploadedFileData;
      }

      console.log("📤 Sending to /api/messages:", requestBody);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Message API response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Pesan berhasil disimpan ke database!", result);
      } else {
        const errorData = await response.json();
        console.error("❌ Database error:", errorData);
        console.log("⚠️ Skip database error - pesan tetap dikirim via socket");
      }
    } catch (error) {
      console.error("❌ Exception saat kirim ke database:", error);
      console.log("⚠️ Skip database error - pesan tetap dikirim via socket");
    }

    // 3. Socket.io (kalau ada)
    if (socket) {
      const socketMessage = {
        text: newMessage.trim() || (uploadedFileData ? `[${uploadedFileData.type === 'image' ? 'Image' : 'File'}]` : ''),
        sender: user.displayName,
        time: messageData.time,
        roomId: selectedRoom.id,
      };

      // Add attachment if exists
      if (uploadedFileData) {
        socketMessage.attachment = uploadedFileData;
      }

      console.log("📡 Sending via socket:", socketMessage);
      socket.emit("send_message", socketMessage);
    }

    // Clear states
    setNewMessage("");
    setSelectedFile(null);
    setUploadedFileData(null);
    setUploadError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 border-t border-white/30 backdrop-blur-lg bg-white/20">
      {/* File Preview */}
      {(selectedFile || uploadedFileData) && (
        <FilePreview
          file={selectedFile}
          fileData={uploadedFileData}
          onRemove={handleRemoveFile}
          isUploading={isUploading}
        />
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-sm text-red-700">❌ {uploadError}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="flex space-x-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.zip"
          className="hidden"
        />

        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !!uploadedFileData}
          className="px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach file"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Text input */}
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-white/30 backdrop-blur-sm border border-white/50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600"
        />

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          disabled={newMessage.trim() === "" && !uploadedFileData}
          className="px-6 py-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-full hover:from-blue-500 hover:to-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
