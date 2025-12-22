// MessageBubble.jsx - Khusus buat 1 bubble chat aja
import { useState, useRef, useEffect } from 'react';

export default function MessageBubble({ message, onDeleteMessage, onEditMessage }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleDelete = async () => {
    if (!onDeleteMessage || !message.id) return;

    if (window.confirm("Apakah Anda yakin ingin menghapus pesan ini?")) {
      setIsDeleting(true);
      try {
        await onDeleteMessage(message.id);
        setShowMenu(false);
      } catch (error) {
        console.error('Error deleting message:', error);
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

  // Hanya tampilkan menu untuk pesan sendiri
  const canShowMenu = message.isOwn && !message.isDeleted;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`flex mb-4 group relative ${message.isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg relative ${
          message.isOwn
            ? (message.isDeleted ? "bg-gray-300 text-gray-500 italic" : "bg-blue-500 text-white")
            : (message.isDeleted ? "bg-gray-200 text-gray-500 italic" : "bg-white/60 text-gray-800")
        }`}
        ref={menuRef}
      >
        {message.isDeleted ? (
          <p>[Pesan ini telah dihapus]</p>
        ) : (
          <>
            <p>{message.text}</p>
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

        {/* Menu icon - muncul saat hover untuk pesan sendiri */}
        {canShowMenu && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300 transition-colors"
              title="Menu pesan"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="5" cy="12" r="2" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                <circle cx="19" cy="12" r="2" fill="currentColor"/>
              </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <svg width="16" height="16" className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Pesan
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <svg width="16" height="16" className="mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus Pesan
                </button>
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
    </div>
  );
}
