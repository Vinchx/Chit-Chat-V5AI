// src/app/api/rooms/[roomId]/members/route.js
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";

// Add member to group
export async function POST(request, { params }) {
    try {
        const { session, userId, error } = await getAuthSessionOrApiKey(request);
        if (error) return error;

        const awaitedParams = await params;
        const { roomId } = awaitedParams;
        const { memberIds } = await request.json();

        if (!memberIds || memberIds.length === 0) {
            return Response.json({
                success: false,
                message: "Member IDs harus diisi"
            }, { status: 400 });
        }

        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");

        // Get room
        const room = await roomsCollection.findOne({ _id: roomId });
        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        // Check if user is admin
        if (!room.admins || !room.admins.includes(userId)) {
            return Response.json({
                success: false,
                message: "Hanya admin yang bisa menambah member"
            }, { status: 403 });
        }

        // Add members (avoid duplicates)
        const newMembers = memberIds.filter(id => !room.members.includes(id));
        if (newMembers.length === 0) {
            return Response.json({
                success: false,
                message: "Semua member sudah ada di grup"
            }, { status: 400 });
        }

        await roomsCollection.updateOne(
            { _id: roomId },
            { $push: { members: { $each: newMembers } } }
        );

        return Response.json({
            success: true,
            message: `${newMembers.length} member berhasil ditambahkan`
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error menambah member",
            error: error.message
        }, { status: 500 });
    }
}

// Remove member from group
export async function DELETE(request, { params }) {
    try {
        const { session, userId, error } = await getAuthSessionOrApiKey(request);
        if (error) return error;

        const awaitedParams = await params;
        const { roomId } = awaitedParams;
        const { searchParams } = new URL(request.url);
        const memberIdToRemove = searchParams.get('memberId');

        if (!memberIdToRemove) {
            return Response.json({
                success: false,
                message: "Member ID harus diisi"
            }, { status: 400 });
        }

        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");

        // Get room
        const room = await roomsCollection.findOne({ _id: roomId });
        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        // Check if user is admin
        if (!room.admins || !room.admins.includes(userId)) {
            return Response.json({
                success: false,
                message: "Hanya admin yang bisa menghapus member"
            }, { status: 403 });
        }

        // Cannot remove admin
        if (room.admins.includes(memberIdToRemove)) {
            return Response.json({
                success: false,
                message: "Tidak bisa menghapus admin. Hapus role admin terlebih dahulu"
            }, { status: 400 });
        }

        // Remove member
        await roomsCollection.updateOne(
            { _id: roomId },
            { $pull: { members: memberIdToRemove } }
        );

        return Response.json({
            success: true,
            message: "Member berhasil dihapus dari grup"
        });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error menghapus member",
            error: error.message
        }, { status: 500 });
    }
}

// Update member role (promote/demote admin)
export async function PATCH(request, { params }) {
    try {
        const { session, userId, error } = await getAuthSessionOrApiKey(request);
        if (error) return error;

        const awaitedParams = await params;
        const { roomId } = awaitedParams;
        const { memberId, action } = await request.json(); // action: "promote" or "demote"

        if (!memberId || !action) {
            return Response.json({
                success: false,
                message: "Member ID dan action harus diisi"
            }, { status: 400 });
        }

        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");

        // Get room
        const room = await roomsCollection.findOne({ _id: roomId });
        if (!room) {
            return Response.json({
                success: false,
                message: "Room tidak ditemukan"
            }, { status: 404 });
        }

        // Check if user is admin
        if (!room.admins || !room.admins.includes(userId)) {
            return Response.json({
                success: false,
                message: "Hanya admin yang bisa mengubah role member"
            }, { status: 403 });
        }

        // Check if member exists in room
        if (!room.members.includes(memberId)) {
            return Response.json({
                success: false,
                message: "Member tidak ditemukan di grup"
            }, { status: 404 });
        }

        if (action === "promote") {
            // Promote to admin
            if (room.admins.includes(memberId)) {
                return Response.json({
                    success: false,
                    message: "Member sudah menjadi admin"
                }, { status: 400 });
            }

            await roomsCollection.updateOne(
                { _id: roomId },
                { $push: { admins: memberId } }
            );

            return Response.json({
                success: true,
                message: "Member berhasil dipromosikan menjadi admin"
            });

        } else if (action === "demote") {
            // Demote from admin
            if (!room.admins.includes(memberId)) {
                return Response.json({
                    success: false,
                    message: "Member bukan admin"
                }, { status: 400 });
            }

            // Cannot demote if last admin
            if (room.admins.length === 1) {
                return Response.json({
                    success: false,
                    message: "Tidak bisa menurunkan admin terakhir. Promosikan member lain terlebih dahulu"
                }, { status: 400 });
            }

            await roomsCollection.updateOne(
                { _id: roomId },
                { $pull: { admins: memberId } }
            );

            return Response.json({
                success: true,
                message: "Admin berhasil diturunkan menjadi member biasa"
            });

        } else {
            return Response.json({
                success: false,
                message: "Action tidak valid. Gunakan 'promote' atau 'demote'"
            }, { status: 400 });
        }

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error mengubah role member",
            error: error.message
        }, { status: 500 });
    }
}
