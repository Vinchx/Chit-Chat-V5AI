import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

export async function GET(request, { params }) {
    try {
        // Get slug from params
        const { slug } = await params;

        // Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        // Connect to database
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");
        const usersCollection = db.collection("users");

        // Strategy: Try different approaches to find room
        let room = null;
        let roomInfo = null;

        // 1. Try AI room
        if (slug === "ai-assistant") {
            room = await roomsCollection.findOne({
                type: "ai",
                members: currentUserId,
                isDeleted: { $ne: true }
            });
        }

        // 2. Try private room by slug format: username-roomId
        if (!room) {
            // Check if slug has room ID suffix (format: username-1769940405430_axrkwg)
            const parts = slug.split('-');
            if (parts.length >= 2) {
                // Try to extract room ID (last part might be room suffix)
                const possibleRoomId = `room_${parts[parts.length - 1]}`;

                // Try direct room lookup by ID
                const roomById = await roomsCollection.findOne({
                    _id: possibleRoomId,
                    type: "private",
                    members: currentUserId,
                    isDeleted: { $ne: true }
                });

                if (roomById) {
                    room = roomById;
                }
            }
        }

        // 3. Fallback: Try private room by username only (for old slugs or when clicking friend)
        if (!room) {
            // Extract username (remove room ID suffix if exists)
            const username = slug.split('-')[0];

            const targetUser = await usersCollection.findOne({ username: username });
            if (targetUser) {
                // Sort by lastActivity DESC to get the most recent room
                // This handles cases where multiple rooms with same members exist
                room = await roomsCollection
                    .find({
                        type: "private",
                        members: { $all: [currentUserId, targetUser._id] },
                        isDeleted: { $ne: true }
                    })
                    .sort({ lastActivity: -1, createdAt: -1 })
                    .limit(1)
                    .toArray()
                    .then(rooms => rooms[0] || null);
            }
        }

        // 4. Try group room by slug format: group-name-roomId
        if (!room) {
            // Check if slug has room ID suffix
            const parts = slug.split('-');
            if (parts.length >= 2) {
                // Try to extract room ID (last part might be room suffix)
                const possibleRoomId = `room_${parts[parts.length - 1]}`;

                // Try direct room lookup by ID
                const roomById = await roomsCollection.findOne({
                    _id: possibleRoomId,
                    type: "group",
                    members: currentUserId,
                    isDeleted: { $ne: true }
                });

                if (roomById) {
                    room = roomById;
                }
            }
        }

        // 5. Fallback: Try group room by slugified name (for old slugs)
        if (!room) {
            const allUserRooms = await roomsCollection.find({
                type: "group",
                members: currentUserId,
                isDeleted: { $ne: true }
            }).toArray();

            for (const r of allUserRooms) {
                const roomSlug = r.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                // Check if slug matches (without room ID suffix for backward compatibility)
                if (slug.startsWith(roomSlug)) {
                    room = r;
                    break;
                }
            }
        }

        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        // Check if user is member
        if (!room.members.includes(currentUserId)) {
            return Response.json({
                success: false,
                message: "Kamu bukan member room ini"
            }, { status: 403 });
        }

        // Build room info
        roomInfo = {
            id: room._id,
            name: room.name,
            type: room.type,
            memberCount: room.members.length,
            lastMessage: room.lastMessage,
            lastActivity: room.lastActivity,
            createdAt: room.createdAt,
            slug: slug
        };

        // Add friend data for private room
        if (room.type === "private") {
            const friendId = room.members.find(memberId => memberId !== currentUserId);
            const friendData = await usersCollection.findOne({ _id: friendId });

            if (friendData) {
                roomInfo.friend = {
                    userId: friendData._id,
                    username: friendData.username,
                    displayName: friendData.displayName,
                    avatar: friendData.avatar ? friendData.avatar.replace(/\\/g, '/') : null,
                    isOnline: friendData.isOnline
                };
            }

            // Add members array for ChatProfileSidebar
            const membersData = await usersCollection.find({
                _id: { $in: room.members }
            }).toArray();

            roomInfo.members = membersData.map(member => ({
                _id: member._id.toString(),
                userId: member._id.toString(),
                username: member.username,
                displayName: member.displayName,
                avatar: member.avatar ? member.avatar.replace(/\\/g, '/') : null,
                isOnline: member.isOnline
            }));
        }

        // Add members data for group room
        if (room.type === "group") {
            const membersData = await usersCollection.find({
                _id: { $in: room.members }
            }).toArray();

            roomInfo.members = membersData.map(member => ({
                _id: member._id.toString(),
                userId: member._id.toString(),
                username: member.username,
                displayName: member.displayName,
                avatar: member.avatar ? member.avatar.replace(/\\/g, '/') : null,
                isOnline: member.isOnline
            }));

            // Add admin and group-specific fields
            if (room.admins) {
                roomInfo.admins = room.admins.map(id => id.toString());
            }
            if (room.description) {
                roomInfo.description = room.description;
            }
            if (room.groupAvatar) {
                roomInfo.groupAvatar = room.groupAvatar;
            }
            if (room.groupBanner) {
                roomInfo.groupBanner = room.groupBanner;
            }
            if (room.settings) {
                roomInfo.settings = room.settings;
            }
        }

        return Response.json({
            success: true,
            data: { room: roomInfo }
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error waktu ambil room",
            error: error.message
        }, { status: 500 });
    }
}
