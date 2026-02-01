import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import Room from "@/models/Room";
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

// DELETE /api/rooms/[roomId] - Soft delete room
export async function DELETE(request, { params }) {
    try {
        const awaitedParams = await params;
        const { roomId } = awaitedParams;

        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");

        // Get room details
        const room = await roomsCollection.findOne({
            _id: roomId,
            isDeleted: { $ne: true }
        });

        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan atau sudah dihapus"
            }, { status: 404 });
        }

        // Check if user is member of the room
        if (!room.members.includes(currentUserId)) {
            return Response.json({
                success: false,
                message: "Kamu tidak punya akses untuk menghapus room ini"
            }, { status: 403 });
        }

        // For group rooms, only creator or admin can delete
        if (room.type === "group") {
            const isAdmin = room.admins && room.admins.includes(currentUserId);
            const isCreator = room.createdBy === currentUserId;

            if (!isAdmin && !isCreator) {
                return Response.json({
                    success: false,
                    message: "Hanya admin atau creator yang bisa menghapus grup"
                }, { status: 403 });
            }
        }

        // Soft delete the room using raw collection update
        console.log('[DELETE ROOM] Soft deleting room:', roomId, 'by user:', currentUserId);

        const updateResult = await roomsCollection.updateOne(
            { _id: roomId },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedBy: currentUserId
                }
            }
        );

        console.log('[DELETE ROOM] Update result:', updateResult);
        console.log('[DELETE ROOM] Modified count:', updateResult.modifiedCount);

        // Verify the update
        const verifyRoom = await roomsCollection.findOne({ _id: roomId });
        console.log('[DELETE ROOM] Room after delete:', {
            id: verifyRoom._id,
            isDeleted: verifyRoom.isDeleted,
            deletedAt: verifyRoom.deletedAt,
            deletedBy: verifyRoom.deletedBy
        });

        return Response.json({
            success: true,
            message: `Room "${room.name}" berhasil dihapus`,
            roomType: room.type
        });

    } catch (error) {
        console.error("Error deleting room:", error);
        return Response.json({
            success: false,
            message: "Error waktu hapus room",
            error: error.message
        }, { status: 500 });
    }
}
