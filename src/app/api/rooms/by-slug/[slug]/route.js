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

        // 2. Try private room (slug = username)
        if (!room) {
            const targetUser = await usersCollection.findOne({ username: slug });
            if (targetUser) {
                room = await roomsCollection.findOne({
                    type: "private",
                    members: { $all: [currentUserId, targetUser._id] },
                    isDeleted: { $ne: true }
                });
            }
        }

        // 3. Try group room (slug = slugified name)
        if (!room) {
            const allUserRooms = await roomsCollection.find({
                type: "group",
                members: currentUserId,
                isDeleted: { $ne: true }
            }).toArray();

            for (const r of allUserRooms) {
                const roomSlug = r.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                if (roomSlug === slug) {
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
