import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

/**
 * POST /api/messages/read-receipts
 * Mark messages sebagai dibaca oleh user
 * 
 * Body:
 * - roomId: string (required)
 * - messageIds: string[] (optional - specific messages)
 * - markAllAsRead: boolean (optional - mark all messages in room)
 */
export async function POST(request) {
    try {
        // 1. Authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        // 2. Parse request body
        const { roomId, messageIds, markAllAsRead } = await request.json();

        if (!roomId) {
            return Response.json({
                success: false,
                message: "Room ID harus diisi"
            }, { status: 400 });
        }

        // 3. Connect to database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const messagesCollection = db.collection("messages");
        const readReceiptsCollection = db.collection("readreceipts");

        // 4. Verify user is member of the room
        const room = await roomsCollection.findOne({ _id: roomId });

        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        if (!room.members.includes(currentUserId)) {
            return Response.json({
                success: false,
                message: "Kamu bukan member room ini"
            }, { status: 403 });
        }

        // 5. Get messages to mark as read
        let messagesToMark = [];

        if (markAllAsRead) {
            // Mark all messages in room that user hasn't read yet
            const allMessages = await messagesCollection
                .find({
                    roomId: roomId,
                    senderId: { $ne: currentUserId }, // Don't mark own messages
                    isDeleted: { $ne: true }
                })
                .project({ _id: 1 })
                .toArray();

            messagesToMark = allMessages.map(msg => msg._id);
        } else if (messageIds && messageIds.length > 0) {
            // Mark specific messages
            messagesToMark = messageIds;
        } else {
            return Response.json({
                success: false,
                message: "messageIds atau markAllAsRead harus diisi"
            }, { status: 400 });
        }

        // 6. Bulk insert read receipts (ignore duplicates)
        if (messagesToMark.length === 0) {
            return Response.json({
                success: true,
                message: "Tidak ada pesan baru untuk ditandai",
                data: {
                    markedCount: 0
                }
            }, { status: 200 });
        }

        const readReceipts = messagesToMark.map(messageId => ({
            messageId: messageId,
            userId: currentUserId,
            roomId: roomId,
            readAt: new Date()
        }));

        // Use bulkWrite with insertOne, ignore duplicate key errors
        const bulkOps = readReceipts.map(receipt => ({
            insertOne: {
                document: receipt
            }
        }));

        let result;
        try {
            result = await readReceiptsCollection.bulkWrite(bulkOps, { ordered: false });
        } catch (error) {
            // Ignore duplicate key errors (code 11000)
            if (error.code === 11000 || error.writeErrors) {
                // Some inserts succeeded, get the count
                result = {
                    insertedCount: error.result ? error.result.nInserted : 0
                };
            } else {
                throw error;
            }
        }

        const markedCount = result.insertedCount || 0;

        console.log(`✅ Marked ${markedCount} messages as read for user ${currentUserId} in room ${roomId}`);

        return Response.json({
            success: true,
            message: `${markedCount} pesan berhasil ditandai sebagai dibaca`,
            data: {
                markedCount: markedCount,
                messageIds: messagesToMark
            }
        }, { status: 200 });

    } catch (error) {
        console.error("❌ ERROR MARK AS READ:", error);
        return Response.json({
            success: false,
            message: "Error saat menandai pesan sebagai dibaca",
            error: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/messages/read-receipts?roomId=xxx&messageIds=msg001,msg002
 * Fetch read receipt status untuk messages
 * 
 * Query params:
 * - roomId: string (required)
 * - messageIds: string (optional - comma separated, jika tidak ada ambil semua di room)
 */
export async function GET(request) {
    try {
        // 1. Authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        // 2. Parse query params
        const url = new URL(request.url);
        const roomId = url.searchParams.get('roomId');
        const messageIdsParam = url.searchParams.get('messageIds');

        if (!roomId) {
            return Response.json({
                success: false,
                message: "Room ID harus diisi"
            }, { status: 400 });
        }

        // 3. Connect to database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const readReceiptsCollection = db.collection("readreceipts");
        const usersCollection = db.collection("users");

        // 4. Verify user is member of the room
        const room = await roomsCollection.findOne({ _id: roomId });

        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        if (!room.members.includes(currentUserId)) {
            return Response.json({
                success: false,
                message: "Kamu bukan member room ini"
            }, { status: 403 });
        }

        // 5. Build query
        const query = { roomId: roomId };

        if (messageIdsParam) {
            const messageIds = messageIdsParam.split(',').map(id => id.trim());
            query.messageId = { $in: messageIds };
        }

        // 6. Get all read receipts
        const readReceipts = await readReceiptsCollection
            .find(query)
            .sort({ readAt: 1 })
            .toArray();

        // 7. Group by messageId and enrich with user data
        const receiptsByMessage = {};

        for (const receipt of readReceipts) {
            if (!receiptsByMessage[receipt.messageId]) {
                receiptsByMessage[receipt.messageId] = {
                    messageId: receipt.messageId,
                    readBy: [],
                    readCount: 0,
                    totalMembers: room.members.length
                };
            }

            // Get user info
            const user = await usersCollection.findOne(
                { _id: receipt.userId },
                { projection: { username: 1, displayName: 1, avatar: 1 } }
            );

            receiptsByMessage[receipt.messageId].readBy.push({
                userId: receipt.userId,
                username: user?.username || 'Unknown',
                displayName: user?.displayName || 'Unknown',
                avatar: user?.avatar || null,
                readAt: receipt.readAt
            });

            receiptsByMessage[receipt.messageId].readCount++;
        }

        // 8. Calculate isReadByAll for each message
        const results = Object.values(receiptsByMessage).map(receipt => ({
            ...receipt,
            isReadByAll: receipt.readCount >= (room.members.length - 1) // -1 karena sender sendiri
        }));

        return Response.json({
            success: true,
            data: {
                readReceipts: results,
                roomInfo: {
                    roomId: room._id,
                    totalMembers: room.members.length,
                    roomType: room.type
                }
            }
        }, { status: 200 });

    } catch (error) {
        console.error("❌ ERROR GET READ RECEIPTS:", error);
        return Response.json({
            success: false,
            message: "Error saat mengambil read receipts",
            error: error.message
        }, { status: 500 });
    }
}
