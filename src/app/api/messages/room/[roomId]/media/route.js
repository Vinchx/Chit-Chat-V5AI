import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
    try {
        // 1. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;
        const { roomId } = await params;

        if (!roomId) {
            return Response.json({
                success: false,
                message: "Room ID harus diisi"
            }, { status: 400 });
        }

        // 2. Connect to database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const messagesCollection = db.collection("messages");

        // 3. Check if room exists and user has access
        const room = await roomsCollection.findOne({ _id: roomId });

        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        // Check if user is a member of this room
        if (!room.members.includes(currentUserId)) {
            return Response.json({
                success: false,
                message: "Kamu bukan member room ini"
            }, { status: 403 });
        }

        // 4. Get pagination parameters
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const page = parseInt(url.searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        // 5. Get all messages with attachments (images and files)
        const mediaMessages = await messagesCollection
            .find({
                roomId: roomId,
                isDeleted: { $ne: true },
                "attachment": { $exists: true, $ne: null }
            })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // 6. Get total count for pagination
        const totalCount = await messagesCollection.countDocuments({
            roomId: roomId,
            isDeleted: { $ne: true },
            "attachment": { $exists: true, $ne: null }
        });

        // 7. Format response
        const sharedMedia = mediaMessages.map(msg => ({
            id: msg._id,
            url: msg.attachment.url,
            filename: msg.attachment.filename,
            size: msg.attachment.size,
            mimeType: msg.attachment.mimeType,
            timestamp: msg.timestamp,
            senderId: msg.senderId
        }));

        return Response.json({
            success: true,
            data: {
                media: sharedMedia,
                pagination: {
                    page: page,
                    limit: limit,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    hasMore: skip + sharedMedia.length < totalCount
                }
            }
        }, { status: 200 });

    } catch (error) {
        console.error("❌ ERROR GET SHARED MEDIA:", error);
        return Response.json({
            success: false,
            message: "Error saat mengambil media",
            error: error.message
        }, { status: 500 });
    }
}
