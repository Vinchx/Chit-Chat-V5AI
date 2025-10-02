import { disconnect } from "mongoose";
import { Server } from "socket.io";
import { Socket } from "socket.io-client";

let io;

export async function GET(request) {
    if (!io) {
        io = new serverHooks({
            cors: {
                origin:
                    process.env.NODE_ENV === "production"
                        ? "https://Chit-Chat-V5AI"
                        : "http://localhost:1630"
            }
        });

        io.on("connection", (socket) => {
            console.log("User connected:", socket.id);

            socket.on("send_message", async (data) => {
                consol.log("Pesan diterima:", data);

                // TODO: Save ke MongoDB (kita bikin nanti)

                socket.to(data_roomId).emit("receive_message", data);
            });
            socket.on("disconnect", () => {
                console.log("User disconnected", socket.id);
            });
        });
    }
    return new Response.json({
        success: true,
        message: "Socket.io server ready!"
    }, { status: 200 }

    );
}