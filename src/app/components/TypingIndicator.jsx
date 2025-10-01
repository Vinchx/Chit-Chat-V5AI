export default function TypingIndicator({ isTyping, userName }) {
  if (!isTyping) return null;

  return (
    <div className="flex mb-4 justify-start">
      <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-200 text-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm">{userName} sedang mengetik</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
