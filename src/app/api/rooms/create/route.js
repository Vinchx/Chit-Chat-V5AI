import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function POST(request) {
    try {
        // 1. Cek siapa yang mau bikin room
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        // 2. Ambil data room yang mau dibuat
        const { type, name, memberIds } = await request.json();

        // type: "private", "group", atau "ai"
        if (!type || !["private", "group", "ai"].includes(type)) {
            return Response.json({
                success: false,
                message: "Type room harus 'private', 'group', atau 'ai'"
            }, { status: 400 });
        }

        // 3. Validasi berdasarkan jenis room
        if (type === "group" && (!name || !memberIds || memberIds.length === 0)) {
            return Response.json({
                success: false,
                message: "Group room butuh nama dan minimal 1 member"
            }, { status: 400 });
        }

        if (type === "private" && (!memberIds || memberIds.length !== 1)) {
            return Response.json({
                success: false,
                message: "Private room cuma boleh 2 orang (kamu + 1 teman)"
            }, { status: 400 });
        }

        // 4. Sambung ke database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const usersCollection = db.collection("users");
        const friendsCollection = db.collection("friendships");

        // 5. Untuk private room, cek dulu udah berteman atau belum
        if (type === "private") {
            const friendId = memberIds[0];

            const friendship = await friendsCollection.findOne({
                $or: [
                    { senderId: currentUserId, receiverId: friendId, status: "accepted" },
                    { senderId: friendId, receiverId: currentUserId, status: "accepted" }
                ]
            });

            if (!friendship) {
                return Response.json({
                    success: false,
                    message: "Kamu harus berteman dulu sebelum bikin private chat"
                }, { status: 400 });
            }

            // Cek udah ada private room atau belum
            const existingRoom = await roomsCollection.findOne({
                type: "private",
                $and: [
                    { members: currentUserId },
                    { members: friendId }
                ]
            });

            if (existingRoom) {
                // Dapatkan slug dari room yang sudah ada
                let existingRoomSlug = null;
                if (existingRoom.type === "private") {
                    const friendId = existingRoom.members.find(memberId => memberId !== currentUserId);
                    const friendData = await usersCollection.findOne({ _id: friendId });
                    if (friendData) {
                        existingRoomSlug = friendData.username;
                    }
                } else if (existingRoom.type === "group") {
                    existingRoomSlug = existingRoom.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                } else if (existingRoom.type === "ai") {
                    existingRoomSlug = "ai-assistant";
                }

                return Response.json({
                    success: false,
                    message: "Private room dengan teman ini sudah ada",
                    existingRoom: {
                        id: existingRoom._id,
                        name: existingRoom.name,
                        slug: existingRoomSlug
                    }
                }, { status: 400 });
            }
        }

        // 6. Siapkan data room baru
        const roomCount = await roomsCollection.countDocuments();
        const roomId = `room${String(roomCount + 1).padStart(3, "0")}`;

        let roomName = name;
        let members = [currentUserId];

        // Atur nama dan member berdasarkan type
        if (type === "private") {
            const friendId = memberIds[0];
            const friendData = await usersCollection.findOne({ _id: friendId });
            roomName = `Chat dengan ${friendData.displayName}`;
            members = [currentUserId, friendId];
        } else if (type === "group") {
            members = [currentUserId, ...memberIds];
        } else if (type === "ai") {
            roomName = "Chat dengan AI";
            members = [currentUserId];
        }

        // 7. Bikin room baru
        const newRoom = {
            _id: roomId,
            name: roomName,
            type: type,
            members: members,
            createdBy: currentUserId,
            createdAt: new Date(),
            lastMessage: null,
            lastActivity: new Date()
        };

        // Ambil data teman untuk membuat slug (untuk private room)
        let slug = null;
        if (type === "private") {
            const friendId = memberIds[0];
            const friendData = await usersCollection.findOne({ _id: friendId });
            if (friendData) {
                slug = friendData.username;
            }
        } else if (type === "group") {
            slug = roomName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        } else if (type === "ai") {
            slug = "ai-assistant";
        }

        await roomsCollection.insertOne(newRoom);

        return Response.json({
            success: true,
            message: `Room ${type} berhasil dibuat!`,
            room: {
                id: roomId,
                name: roomName,
                type: type,
                memberCount: members.length,
                slug: slug
            }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error waktu bikin room",
            error: error.message
        }, { status: 500 });
    }
}