// ChatHeader.jsx - Khusus buat header chat aja
export default function ChatHeader({ selectedRoom }) {
  return (
    <div className="p-4 border-b border-white/30 backdrop-blur-lg bg-white/20">
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
              ? "Private Chat"
              : selectedRoom.type === "group"
              ? `${selectedRoom.memberCount} members`
              : "AI Assistant"}
          </p>
        </div>
      </div>
    </div>
  );
}
