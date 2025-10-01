import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export async function GET(request) {
    try {
        // 1. Cek siapa yang mau lihat daftar room
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return Response.json({
                success: false,
                message: "Login dulu untuk lihat daftar room"
            }, { status: 401 });
        }

        const decoded = jwt.verify(token, "secretbet");
        const currentUserId = decoded.userId;

        // 2. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const usersCollection = db.collection("users");

        // 3. Ambil semua room yang user ini ikuti
        const rooms = await roomsCollection.find({
            members: currentUserId
        }).sort({ lastActivity: -1 }).toArray(); // Urutkan berdasarkan aktivitas terakhir

        // 4. Siapkan data detail untuk setiap room
        const roomsWithDetails = [];

        for (const room of rooms) {
            let roomInfo = {
                id: room._id,
                name: room.name,
                type: room.type,
                memberCount: room.members.length,
                lastMessage: room.lastMessage,
                lastActivity: room.lastActivity,
                createdAt: room.createdAt
            };

            // Untuk private room, ambil data teman
            if (room.type === "private") {
                const friendId = room.members.find(memberId => memberId !== currentUserId);
                const friendData = await usersCollection.findOne({ _id: friendId });

                roomInfo.friend = {
                    userId: friendData._id,
                    username: friendData.username,
                    displayName: friendData.displayName,
                    avatar: friendData.avatar,
                    isOnline: friendData.isOnline
                };
            }

            // Untuk group room, ambil daftar member
            if (room.type === "group") {
                const membersData = await usersCollection.find({
                    _id: { $in: room.members }
                }).toArray();

                roomInfo.members = membersData.map(member => ({
                    userId: member._id,
                    username: member.username,
                    displayName: member.displayName,
                    avatar: member.avatar,
                    isOnline: member.isOnline
                }));
            }

            roomsWithDetails.push(roomInfo);
        }

        // 5. Kelompokkan berdasarkan jenis room
        const groupedRooms = {
            private: roomsWithDetails.filter(room => room.type === "private"),
            group: roomsWithDetails.filter(room => room.type === "group"),
            ai: roomsWithDetails.filter(room => room.type === "ai")
        };

        return Response.json({
            success: true,
            data: {
                rooms: roomsWithDetails,
                grouped: groupedRooms,
                counts: {
                    total: roomsWithDetails.length,
                    private: groupedRooms.private.length,
                    group: groupedRooms.group.length,
                    ai: groupedRooms.ai.length
                }
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error waktu ambil daftar room",
            error: error.message
        }, { status: 500 });
    }
}