import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
    try {
        console.log('[Group Avatar] Starting upload process...');
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const awaitedParams = await params;
        const { roomId } = awaitedParams;

        // Check if room exists and user is admin
        await connectToDatabase();
        const db = mongoose.connection.db;
        const roomsCollection = db.collection("rooms");

        const room = await roomsCollection.findOne({ _id: roomId });

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        if (room.type !== 'group') {
            return NextResponse.json(
                { error: 'Only groups can have avatars' },
                { status: 400 }
            );
        }

        const isAdmin = room.admins && room.admins.includes(session.user.id);
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Only admins can update group avatar' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('avatar');

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipe file tidak valid. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan.' },
                { status: 400 }
            );
        }

        // Validasi ukuran file (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Ukuran file terlalu besar. Maksimal 10MB.' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Buat nama file unik
        const timestamp = Date.now();
        const ext = path.extname(file.name);
        const filename = `group-${roomId}-${timestamp}${ext}`;

        // Path untuk menyimpan file
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'group-avatars');
        const filepath = path.join(uploadDir, filename);

        // Buat direktori jika belum ada
        await mkdir(uploadDir, { recursive: true });

        // Simpan file
        await writeFile(filepath, buffer);

        const avatarPath = `/uploads/group-avatars/${filename}`;

        // Update database
        await roomsCollection.updateOne(
            { _id: roomId },
            { $set: { groupAvatar: avatarPath } }
        );

        return NextResponse.json({
            success: true,
            path: avatarPath
        });

    } catch (error) {
        console.error('[Group Avatar] Error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupload avatar group' },
            { status: 500 }
        );
    }
}
