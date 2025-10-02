const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        handle(req, res);
    });

    const io = new Server(server, {
        cors: {
            origin: dev ? ["http://localhost:1630", "http://192.168.10.16:1630", "http://192.168.1.16:1630"] : "https://Chit-Chat-V5AI",
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("👋 User masuk:", socket.id);

        // Handle user join room
        socket.on("join_room", (roomId) => {
            socket.join(roomId);
            console.log(`📍 User ${socket.id} join room: ${roomId}`);
        });

        // Handle user leave room  
        socket.on("leave_room", (roomId) => {
            socket.leave(roomId);
            console.log(`📤 User ${socket.id} leave room: ${roomId}`);
        });

        // Handle pesan - kirim ke room tertentu aja
        socket.on("send_message", (data) => {
            console.log("📨 Server terima pesan:", data);
            // Kirim cuma ke user lain di room yang sama
            socket.to(data.roomId).emit("receive_message", data);
        });

        // Handle typing indicators - kirim ke room tertentu aja
        socket.on("typing_start", (data) => {
            console.log("⌨️ User mulai ngetik:", data.userName, "di room:", data.roomId);
            // Kirim cuma ke user lain di room yang sama
            socket.to(data.roomId).emit("typing_start", data);
        });

        socket.on("typing_stop", (data) => {
            console.log("⏹️ User berhenti ngetik:", data.userName, "di room:", data.roomId);
            // Kirim cuma ke user lain di room yang sama
            socket.to(data.roomId).emit("typing_stop", data);
        });

        socket.on("disconnect", () => {
            console.log("👋 User keluar:", socket.id);
        });
    });

    const PORT = process.env.PORT || 1630;
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server jalan di:`);
        console.log(`   - Local:   http://localhost:${PORT}`);
        console.log(`   - Network: http://192.168.1.16:${PORT}`);
        console.log(`   - Network: http://192.168.10.16:${PORT}`);
    });
});