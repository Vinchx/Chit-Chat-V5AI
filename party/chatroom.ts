import type * as Party from "partykit/server";

/**
 * ChatRoom Party Server
 *
 * Setiap room adalah 1 "party" yang independent
 * Room ID = Party ID
 */
export default class ChatRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Track connected users
  connections = new Map<string, { userId: string; username: string }>();

  /**
   * Dipanggil saat user connect ke party
   */
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Get user info dari URL query params
    const url = new URL(ctx.request.url);
    const userId = url.searchParams.get("userId") || "anonymous";
    const username = url.searchParams.get("username") || "Guest";

    // Save connection info
    this.connections.set(conn.id, { userId, username });

    console.log(
      `✅ User ${username} (${userId}) joined room ${this.room.id}`
    );

    // Broadcast ke semua user bahwa ada user baru join
    this.broadcast({
      type: "user-joined",
      userId,
      username,
      timestamp: new Date().toISOString(),
      totalUsers: this.connections.size,
    });

    // Kirim daftar user yang online ke user baru
    conn.send(
      JSON.stringify({
        type: "online-users",
        users: Array.from(this.connections.values()),
      })
    );
  }

  /**
   * Dipanggil saat user kirim message
   */
  async onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    const senderInfo = this.connections.get(sender.id);

    console.log(`📨 Message from ${senderInfo?.username}:`, data);

    // Handle berbagai tipe event
    switch (data.type) {
      case "message":
        // Broadcast message ke semua user
        this.broadcast({
          type: "new-message",
          messageId: data.messageId,
          message: data.message,
          userId: senderInfo?.userId,
          username: senderInfo?.username,
          timestamp: new Date().toISOString(),
        });
        break;

      case "typing":
        // Broadcast typing indicator (kecuali ke sender)
        this.broadcast(
          {
            type: "user-typing",
            userId: senderInfo?.userId,
            username: senderInfo?.username,
          },
          [sender.id] // Exclude sender
        );
        break;

      case "stop-typing":
        // Broadcast stop typing
        this.broadcast(
          {
            type: "user-stop-typing",
            userId: senderInfo?.userId,
          },
          [sender.id]
        );
        break;

      case "read-receipt":
        // User baca message
        this.broadcast({
          type: "message-read",
          messageId: data.messageId,
          userId: senderInfo?.userId,
        });
        break;

      case "delete-message":
        // Broadcast pesan yang dihapus ke semua user di room
        this.broadcast({
          type: "message-deleted",
          messageId: data.messageId,
          deletedBy: senderInfo?.userId,
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }

  /**
   * Dipanggil saat user disconnect
   */
  async onClose(conn: Party.Connection) {
    const userInfo = this.connections.get(conn.id);

    if (userInfo) {
      console.log(
        `❌ User ${userInfo.username} left room ${this.room.id}`
      );

      // Remove dari connections
      this.connections.delete(conn.id);

      // Broadcast ke semua user bahwa ada user yang keluar
      this.broadcast({
        type: "user-left",
        userId: userInfo.userId,
        username: userInfo.username,
        timestamp: new Date().toISOString(),
        totalUsers: this.connections.size,
      });
    }
  }

  /**
   * Dipanggil saat ada error
   */
  async onError(conn: Party.Connection, error: Error) {
    console.error(`❌ Error in room ${this.room.id}:`, error);
  }

  /**
   * Helper: Broadcast message ke semua atau selected connections
   */
  broadcast(data: any, exclude: string[] = []) {
    const message = JSON.stringify(data);

    // Convert Iterable to Array untuk TypeScript compatibility
    const connections = Array.from(this.room.getConnections());

    // Broadcast to all connections except excluded ones
    connections.forEach((conn) => {
      if (!exclude.includes(conn.id)) {
        conn.send(message);
      }
    });
  }

  /**
   * HTTP Request handler (optional)
   * Untuk debugging atau webhook
   */
  async onRequest(req: Party.Request) {
    if (req.method === "GET") {
      // Return room info
      return new Response(
        JSON.stringify({
          roomId: this.room.id,
          totalConnections: this.connections.size,
          users: Array.from(this.connections.values()),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
