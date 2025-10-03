import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
    try {
        const { roomId } = params;

        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        await connectToDatabase()
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const usersCollection = db.collection("users");


        const room = await roomsCollection.findOne({
            _id: roomId
        });

        if (!room) {
            return Response.json({
                success: false,
                message: "room tidak ditemukan"
            }, { status: 404 });
        }

        if (!room.members.includes(currentUserId)) {
            return Response.json(
                {
                    success: false,
                    message: "Kamu tidak punya akses ke room ini",
                },
                { status: 403 }
            );
        }
        const membersData = await usersCollection.find({
            _id: { $in: room.members }
        }).toArray();
        const membersDetail = membersData.map((member) => ({
            userId: member._id,
            username: member.username,
            displayName: member.displayName,
            avatar: member.avatar,
            isOnline: member.isOnline,
            joinedAt: room.createdAt, // Untuk sekarang sama dengan created room
        }));

        const roomDetail = {
            id: room._id,
            name: room.name,
            type: room.type,
            members: membersDetail,
            memberCount: room.members.length,
            createdBy: room.createdBy,
            createdAt: room.createdAt,
            lastMessage: room.lastMessage,
            lastActivity: room.lastActivity,
        }; return Response.json({
            success: true,
            data: roomDetail,
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: "Error waktu ambil detail room",
                error: error.message,
            },
            { status: 500 }
        );
    }
}