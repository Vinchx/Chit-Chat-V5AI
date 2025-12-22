import PartySocket from "partysocket";

/**
 * Create Partykit WebSocket connection untuk chat room
 *
 * @param {string} roomId - Room ID
 * @param {object} user - User info { id, username }
 * @param {object} callbacks - Event handlers
 * @returns {PartySocket} socket instance
 */
export function createChatSocket(roomId, user, callbacks = {}) {
  const host =
    process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";

  // Create PartySocket connection
  const socket = new PartySocket({
    host,
    room: roomId,
    query: {
      userId: user.id,
      username: user.username,
    },
  });

  // Connection opened
  socket.addEventListener("open", () => {
    console.log(`🎉 Connected to room ${roomId}`);
    callbacks.onConnect?.();
  });

  // Message received
  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📨 Received:", data);

      // Route to specific handlers
      switch (data.type) {
        case "new-message":
          callbacks.onMessage?.(data);
          break;

        case "user-joined":
          callbacks.onUserJoined?.(data);
          break;

        case "user-left":
          callbacks.onUserLeft?.(data);
          break;

        case "user-typing":
          callbacks.onTyping?.(data);
          break;

        case "user-stop-typing":
          callbacks.onStopTyping?.(data);
          break;

        case "online-users":
          callbacks.onOnlineUsers?.(data.users);
          break;

        case "message-read":
          callbacks.onMessageRead?.(data);
          break;

        case "message-deleted":
          callbacks.onMessageDeleted?.(data);
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  // Connection error
  socket.addEventListener("error", (error) => {
    console.error("❌ Socket error:", error);
    callbacks.onError?.(error);
  });

  // Connection closed
  socket.addEventListener("close", () => {
    console.log(`👋 Disconnected from room ${roomId}`);
    callbacks.onDisconnect?.();
  });

  return socket;
}

/**
 * Send message via Partykit
 */
export function sendMessage(socket, message) {
  socket.send(
    JSON.stringify({
      type: "message",
      message: message.text,
      messageId: message.id,
    })
  );
}

/**
 * Send typing indicator
 */
export function sendTyping(socket) {
  socket.send(JSON.stringify({ type: "typing" }));
}

/**
 * Send stop typing indicator
 */
export function sendStopTyping(socket) {
  socket.send(JSON.stringify({ type: "stop-typing" }));
}

/**
 * Send read receipt
 */
export function sendReadReceipt(socket, messageId) {
  socket.send(
    JSON.stringify({
      type: "read-receipt",
      messageId,
    })
  );
}

/**
 * Send delete message event
 */
export function sendDeleteMessage(socket, messageId) {
  socket.send(
    JSON.stringify({
      type: "delete-message",
      messageId,
    })
  );
}
