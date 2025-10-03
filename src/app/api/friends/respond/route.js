import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function POST(request) {
    try {
        // 1. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

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
                message: "Permintaan pertemanan tidak ditemukan atau sudah dijawab"
            }, { status: 404 });
        }

        // 5. Update status friendship
        if (action === "accept") {
            // Terima permintaan = ubah status jadi accepted
            await friendsCollection.updateOne(
                { _id: friendshipId },
                { $set: { status: "accepted", acceptedAt: new Date() } }
            );

            return Response.json({
                success: true,
                message: "Permintaan pertemanan diterima! 🎉",
                friendship: {
                    id: friendship._id,
                    status: "accepted"
                }
            });
        } else {
            // Tolak permintaan = hapus friendship
            await friendsCollection.deleteOne({ _id: friendshipId });

            return Response.json({
                success: true,
                message: "Permintaan pertemanan ditolak",
                action: "rejected"
            });
        }

    } catch (error) {
        return Response.json({
            success: false,
            message: "Ada error waktu jawab permintaan",
            error: error.message
        }, { status: 500 });
    }
}
