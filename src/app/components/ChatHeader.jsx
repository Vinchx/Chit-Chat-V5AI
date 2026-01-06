// ChatHeader.jsx - Khusus buat header chat aja
export default function ChatHeader({ selectedRoom, onlineCount, onInfoClick }) {
  return (
    <div className="p-4 border-b border-white/30 backdrop-blur-lg bg-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {selectedRoom.type === "private"
              ? "👤"
              : selectedRoom.type === "group"
              ? "👥"
              : "🤖"}
          </div>

          {/* Info nama & status */}
          <div>
            <h3 className="font-semibold text-gray-800">{selectedRoom.name}</h3>
            <p className="text-sm text-gray-600">
              {selectedRoom.type === "private"
                ? onlineCount > 1 ? "Online" : "Offline"
                : selectedRoom.type === "group"
                ? `${selectedRoom.memberCount} members${onlineCount > 0 ? `, ${onlineCount} online` : ''}`
                : "AI Assistant"}
            </p>
          </div>
        </div>

        {/* Info Button - hanya untuk private chat */}
        {selectedRoom.type === "private" && onInfoClick && (
          <button
            onClick={onInfoClick}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Info Kontak"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
