import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function POST(request) {
    try {
        console.log('========== CREATE ROOM REQUEST START ==========');

        // 1. Cek siapa yang mau bikin room
        console.log('[STEP 1] Checking authentication...');
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            console.log('[STEP 1] Authentication failed');
            return error;
        }
        console.log('[STEP 1] Authentication success. UserId:', userId);

        const currentUserId = userId;

        // 2. Ambil data room yang mau dibuat
        console.log('[STEP 2] Parsing request body...');
        const { type, name, memberIds } = await request.json();
        console.log('[STEP 2] Request data:', { type, name, memberIds, currentUserId });

        // type: "private", "group", atau "ai"
        if (!type || !["private", "group", "ai"].includes(type)) {
            console.log('[STEP 2] Invalid room type:', type);
            return Response.json({
                success: false,
                message: "Type room harus 'private', 'group', atau 'ai'"
            }, { status: 400 });
        }

        // 3. Validasi berdasarkan jenis room
        console.log('[STEP 3] Validating room type specific requirements...');
        if (type === "group" && (!name || !memberIds || memberIds.length === 0)) {
            console.log('[STEP 3] Group validation failed');
            return Response.json({
                success: false,
                message: "Group room butuh nama dan minimal 1 member"
            }, { status: 400 });
        }

        if (type === "private" && (!memberIds || memberIds.length !== 1)) {
            console.log('[STEP 3] Private room validation failed');
            return Response.json({
                success: false,
                message: "Private room cuma boleh 2 orang (kamu + 1 teman)"
            }, { status: 400 });
        }
        console.log('[STEP 3] Validation passed');

        // 4. Sambung ke database
        console.log('[STEP 4] Connecting to database...');
        await connectToDatabase();
        const db = mongoose.connection.db;
        console.log('[STEP 4] Database connected. Getting collections...');
        const roomsCollection = db.collection("rooms");
        const usersCollection = db.collection("users");
        const friendsCollection = db.collection("friendships");
        console.log('[STEP 4] Collections obtained');

        // 5. Validasi existing room berdasarkan type
        if (type === "private") {
            console.log('[STEP 5] Checking friendship for private room...');
            const friendId = memberIds[0];

            const friendship = await friendsCollection.findOne({
                $or: [
                    { senderId: currentUserId, receiverId: friendId, status: "accepted" },
                    { senderId: friendId, receiverId: currentUserId, status: "accepted" }
                ]
            });
            console.log('[STEP 5] Friendship check result:', friendship ? 'Found' : 'Not found');

            if (!friendship) {
                return Response.json({
                    success: false,
                    message: "Kamu harus berteman dulu sebelum bikin private chat"
                }, { status: 400 });
            }

            // Cek udah ada private room atau belum
            console.log('[STEP 5] Checking for existing private room...');
            const existingRoom = await roomsCollection.findOne({
                type: "private",
                $and: [
                    { members: currentUserId },
                    { members: friendId }
                ]
            });

            if (existingRoom) {
                console.log('[STEP 5] Existing private room found:', existingRoom._id);
                const friendData = await usersCollection.findOne({ _id: friendId });
                const existingRoomSlug = friendData ? friendData.username : null;

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
            console.log('[STEP 5] No existing private room found');
        } else if (type === "ai") {
            // Cek apakah user sudah punya AI room
            console.log('[STEP 5] Checking for existing AI room...');
            const existingAiRoom = await roomsCollection.findOne({
                type: "ai",
                members: currentUserId
            });

            if (existingAiRoom) {
                console.log('[STEP 5] Existing AI room found:', existingAiRoom._id);
                return Response.json({
                    success: false,
                    message: "Kamu sudah punya AI room",
                    existingRoom: {
                        id: existingAiRoom._id,
                        name: existingAiRoom.name,
                        slug: "ai-assistant"
                    }
                }, { status: 400 });
            }
            console.log('[STEP 5] No existing AI room found');
        }

        // 6. Siapkan data room baru
        console.log('[STEP 6] Preparing new room data...');

        // Generate unique random room ID
        // Format: room_[timestamp]_[random] -> contoh: room_1768878021_a7f3e9
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const roomId = `room_${timestamp}_${randomStr}`;

        console.log('[STEP 6] Generated roomId:', roomId);

        let roomName = name;
        let members = [currentUserId];

        // Atur nama dan member berdasarkan type
        if (type === "private") {
            console.log('[STEP 6] Setting up private room...');
            const friendId = memberIds[0];
            const friendData = await usersCollection.findOne({ _id: friendId });
            console.log('[STEP 6] Friend data:', friendData ? `Found (${friendData.displayName})` : 'Not found');
            roomName = friendData.displayName; // Store friend name directly without "Chat dengan" prefix
            members = [currentUserId, friendId];
        } else if (type === "group") {
            console.log('[STEP 6] Setting up group room...');
            members = [currentUserId, ...memberIds];
        } else if (type === "ai") {
            console.log('[STEP 6] Setting up AI room...');
            roomName = "AI Assistant"; // Simplified AI room name
            members = [currentUserId];
        }

        // 7. Bikin room baru
        console.log('[STEP 7] Creating new room object...');
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

        // Add admin system fields for group rooms
        if (type === "group") {
            newRoom.admins = [currentUserId]; // Creator is default admin
            newRoom.description = ""; // Can be updated later
            newRoom.groupAvatar = null; // Can be updated later
            newRoom.settings = {
                onlyAdminsCanPost: false,
                onlyAdminsCanAddMembers: true,
                onlyAdminsCanEditInfo: true
            };
        }

        // Ambil data teman untuk membuat slug (untuk private room)
        console.log('[STEP 7] Generating slug...');
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
        console.log('[STEP 7] Generated slug:', slug);

        console.log('[STEP 7] Inserting room into database...');
        await roomsCollection.insertOne(newRoom);
        console.log('[STEP 7] Room created successfully!');

        console.log('========== CREATE ROOM REQUEST SUCCESS ==========');
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
        console.error('========== CREATE ROOM REQUEST FAILED ==========');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('====================================================');

        return Response.json({
            success: false,
            message: "Error waktu bikin room",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}