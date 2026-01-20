// MessageBubble.jsx - Khusus buat 1 bubble chat aja
import { useState, useRef, useEffect } from "react";
import ImageLightbox from "./ImageLightbox";
import DocumentCard from "./DocumentCard";

export default function MessageBubble({
  message,
  onDeleteMessage,
  onEditMessage,
  onReplyMessage,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const menuRef = useRef(null);

  const handleDelete = async () => {
    if (!onDeleteMessage || !message.id) return;

    if (window.confirm("Apakah Anda yakin ingin menghapus pesan ini?")) {
      setIsDeleting(true);
      try {
        await onDeleteMessage(message.id);
        setShowMenu(false);
      } catch (error) {
        console.error("Error deleting message:", error);
        setIsDeleting(false);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    if (onEditMessage) {
      onEditMessage(message);
      setShowMenu(false);
    }
  };

  const handleReply = () => {
    if (onReplyMessage) {
      onReplyMessage(message);
      setShowMenu(false);
    }
  };

  // Tampilkan menu untuk semua pesan yang tidak dihapus
  const canShowMenu = !message.isDeleted;

  // Check if message can be deleted (within 1 hour)
  const canDeleteMessage = () => {
    // Use raw timestamp if available (from API)
    if (message.timestamp) {
      const messageAge = Date.now() - new Date(message.timestamp).getTime();
      const oneHour = 60 * 60 * 1000;
      return messageAge <= oneHour;
    }

    // Fallback: parse time string (format: "HH:MM")
    if (!message.time) return true; // Allow if no time info

    const [hours, minutes] = message.time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return true;

    const messageDate = new Date();
    messageDate.setHours(hours, minutes, 0, 0);

    // If message time is in the future, it's from yesterday
    if (messageDate > new Date()) {
      messageDate.setDate(messageDate.getDate() - 1);
    }

    const messageAge = Date.now() - messageDate.getTime();
    const oneHour = 60 * 60 * 1000;
    return messageAge <= oneHour;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasAttachment = message.attachment && !message.isDeleted;
  const isImageAttachment =
    hasAttachment && message.attachment.type === "image";
  const isDocumentAttachment =
    hasAttachment && message.attachment.type === "document";

  // 🤖 Detect AI messages
  const isAIMessage = message.senderId === "ai-assistant";

  // Debug logging
  if (message.attachment) {
    console.log("📎 Message with attachment:", {
      messageId: message.id,
      text: message.text,
      hasAttachment,
      isImageAttachment,
      isDocumentAttachment,
      attachment: message.attachment,
    });
  }

  return (
    <div
      className={`flex mb-4 group relative ${message.isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-md px-4 py-2 rounded-lg relative ${
          message.isOwn
            ? message.isDeleted
              ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 italic"
              : "bg-blue-500 dark:bg-blue-600 text-white"
            : isAIMessage
              ? message.isDeleted
                ? "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 italic"
                : "bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 text-white shadow-lg"
              : message.isDeleted
                ? "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 italic"
                : "bg-white/60 dark:bg-gray-700 text-gray-800 dark:text-white"
        }`}
        ref={menuRef}
      >
        {message.isDeleted ? (
          <p>[Pesan ini telah dihapus]</p>
        ) : (
          <>
            {/* AI Badge - FIRST (only for AI messages) */}
            {isAIMessage && (
              <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <span className="text-sm">🤖</span>
                <span className="text-xs font-semibold tracking-wide">
                  AI ASSISTANT
                </span>
              </div>
            )}

            {/* Reply Preview - SECOND */}
            {message.replyTo && (
              <div className="mb-2 pl-3 border-l-4 border-blue-400 bg-black/10 rounded py-1 px-2">
                <p className="text-xs font-semibold opacity-80">
                  {message.replyTo.senderName || message.replyTo.sender}
                </p>
                <div className="flex items-center gap-2">
                  {message.replyTo.attachment && (
                    <span className="text-xs opacity-70">
                      {message.replyTo.attachment.type === "image"
                        ? "🖼️"
                        : "📎"}
                    </span>
                  )}
                  <p className="text-sm opacity-70 truncate">
                    {message.replyTo.text || "[Attachment]"}
                  </p>
                </div>
              </div>
            )}

            {/* Image attachment - SECOND */}
            {isImageAttachment && (
              <div className="mb-2">
                <div
                  className="relative rounded-lg overflow-hidden cursor-pointer group/image max-w-xs"
                  onClick={() => setShowLightbox(true)}
                  style={{ maxHeight: "300px" }}
                >
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img
                    src={message.attachment.url}
                    alt={message.attachment.filename}
                    className="w-full h-full object-contain rounded-lg"
                    style={{ maxHeight: "300px" }}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover/image:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                      <svg
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document attachment - THIRD */}
            {isDocumentAttachment && (
              <div className="mb-2">
                <DocumentCard
                  filename={message.attachment.filename}
                  size={message.attachment.size}
                  url={message.attachment.url}
                  mimeType={message.attachment.mimeType}
                />
              </div>
            )}

            {/* Text content - AFTER REPLY & ATTACHMENTS */}
            {message.text && <p className="break-words">{message.text}</p>}

            {/* Time and edited indicator */}
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs opacity-70">{message.time}</p>
            </div>
            {message.isEdited && (
              <div className="text-right mt-1">
                <span className="text-xs text-gray-500 italic">(Edited)</span>
              </div>
            )}
          </>
        )}

        {/* Menu icon - muncul saat hover untuk semua pesan */}
        {canShowMenu && (
          <div
            className={`absolute -top-2 ${message.isOwn ? "-right-2" : "-left-2"} opacity-0 group-hover:opacity-100 transition-opacity z-10`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300 transition-colors"
              title="Menu pesan"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="5" cy="12" r="2" fill="currentColor" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <circle cx="19" cy="12" r="2" fill="currentColor" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div
                className={`absolute ${message.isOwn ? "right-0" : "left-0"} mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1`}
              >
                <button
                  onClick={handleReply}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <svg
                    width="16"
                    height="16"
                    className="mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  Reply
                </button>
                {/* Edit dan Delete hanya untuk pesan sendiri */}
                {message.isOwn && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg
                        width="16"
                        height="16"
                        className="mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Pesan
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={!canDeleteMessage()}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center ${canDeleteMessage() ? "text-red-600 hover:bg-red-50" : "text-gray-400 cursor-not-allowed"}`}
                      title={
                        !canDeleteMessage()
                          ? "Pesan sudah lebih dari 1 jam"
                          : "Hapus Pesan"
                      }
                    >
                      <svg
                        width="16"
                        height="16"
                        className="mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      {canDeleteMessage()
                        ? "Hapus Pesan"
                        : "Tidak bisa dihapus"}{" "}
                      '/ '
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading indicator saat menghapus */}
        {isDeleting && (
          <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {showLightbox && isImageAttachment && (
        <ImageLightbox
          imageUrl={message.attachment.url}
          filename={message.attachment.filename}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
