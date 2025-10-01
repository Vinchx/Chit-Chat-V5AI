import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function POST(request) {
    try {
        // 1. Cek token kayak biasa
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return Response.json({
                success: false,
                message: "Login dulu ya sebelum jawab permintaan"
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, "secretbet");
        const currentUserId = decoded.userId;

        // 2. Ambil data dari request
        const { friendshipId, action } = await request.json();

        // action bisa "accept" atau "reject"
        if (!friendshipId || !action) {
            return Response.json({
                success: false,
                message: "Kasih tau ID permintaan dan mau terima (accept) atau tolak (reject)"
            }, { status: 400 });
        }

        if (!["accept", "reject"].includes(action)) {
            return Response.json({
                success: false,
                message: "Action cuma boleh 'accept' atau 'reject'"
            }, { status: 400 });
        }

        // 3. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const friendsCollection = db.collection("friendships");

        // 4. Cari permintaan pertemanan
        const friendship = await friendsCollection.findOne({
            _id: friendshipId,
            receiverId: currentUserId, // Cuma yang diundang yang bisa jawab
            status: "pending"
        });

        if (!friendship) {
            return Response.json({
                success: false,
                message: "Permintaan pertemanan nggak ditemukan atau udah dijawab"
            }, { status: 404 });
        }

        // 5. Update status berdasarkan action
        const newStatus = action === "accept" ? "accepted" : "rejected";

        await friendsCollection.updateOne(
            { _id: friendshipId },
            {
                $set: {
                    status: newStatus,
                    respondedAt: new Date()
                }
            }
        );

        // 6. Kasih response yang sesuai
        const message = action === "accept"
            ? "Permintaan pertemanan diterima! Kalian sekarang berteman"
            : "Permintaan pertemanan ditolak";

        return Response.json({
            success: true,
            message: message,
            friendship: {
                id: friendshipId,
                status: newStatus
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Ada error waktu proses permintaan",
            error: error.message
        }, { status: 500 });
    }
}