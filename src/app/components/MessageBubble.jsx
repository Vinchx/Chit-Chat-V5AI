// MessageBubble.jsx - Khusus buat 1 bubble chat aja
export default function MessageBubble({ message }) {
  return (
    <div
      className={`flex mb-4 ${message.isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-xs px-4 py-2 rounded-lg ${
          message.isOwn ? "bg-blue-500 text-white" : "bg-white/60 text-gray-800"
        }`}
      >
        <p>{message.text}</p>
        <p className="text-xs mt-1 opacity-70">{message.time}</p>
      </div>
    </div>
  );
}
