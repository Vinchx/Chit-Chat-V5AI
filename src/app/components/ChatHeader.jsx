// ChatHeader.jsx - Khusus buat header chat aja
import GlassSurface from "@/components/GlassSurface";
import Image from "next/image";

// Helper functions
const normalizeAvatar = (avatar) => {
  return avatar ? avatar.replace(/\\/g, "/") : null;
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function ChatHeader({ selectedRoom, onlineCount, onInfoClick }) {
  // Get avatar based on room type
  const getAvatar = () => {
    if (selectedRoom.type === "private" && selectedRoom.friend?.avatar) {
      return normalizeAvatar(selectedRoom.friend.avatar);
    }
    if (selectedRoom.type === "group" && selectedRoom.groupAvatar) {
      return normalizeAvatar(selectedRoom.groupAvatar);
    }
    return null;
  };

  const avatarUrl = getAvatar();

  // For private chat, show friend's name directly, not room name
  const displayName =
    selectedRoom.type === "private" && selectedRoom.friend?.displayName
      ? selectedRoom.friend.displayName
      : selectedRoom.name || "User";

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
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
        className="!p-0 !rounded-none !items-start !justify-start"
      >
        <div className="w-full">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Avatar with photo support */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                      {selectedRoom.type === "private"
                        ? getInitials(displayName)
                        : selectedRoom.type === "group"
                          ? getInitials(displayName)
                          : "🤖"}
                    </div>
                  )}
                </div>

                {/* Info nama & status */}
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedRoom.type === "private"
                      ? onlineCount > 1
                        ? "Online"
                        : "Offline"
                      : selectedRoom.type === "group"
                        ? `${selectedRoom.memberCount} members${onlineCount > 0 ? `, ${onlineCount} online` : ""}`
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
                  <svg
                    className="w-6 h-6 text-gray-700 dark:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}
