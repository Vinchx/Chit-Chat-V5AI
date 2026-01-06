// src/app/api/profile/upload-avatar/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
    try {
        console.log('[Upload Avatar] Starting upload process...');
        const session = await auth();

        if (!session || !session.user) {
            console.log('[Upload Avatar] Unauthorized access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[Upload Avatar] User authenticated:', session.user.id);

        const formData = await request.formData();
        const file = formData.get('avatar');

        if (!file) {
            console.log('[Upload Avatar] No file in request');
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        console.log('[Upload Avatar] File received:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            console.log('[Upload Avatar] Invalid file type:', file.type);
            return NextResponse.json(
                { error: 'Tipe file tidak valid. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan.' },
                { status: 400 }
            );
        }

        // Validasi ukuran file (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            console.log('[Upload Avatar] File too large:', file.size);
            return NextResponse.json(
                { error: 'Ukuran file terlalu besar. Maksimal 5MB.' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Buat nama file unik
        const timestamp = Date.now();
        const ext = path.extname(file.name);
        const filename = `avatar-${session.user.id}-${timestamp}${ext}`;

        // Path untuk menyimpan file
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        const filepath = path.join(uploadDir, filename);

        console.log('[Upload Avatar] Saving to:', filepath);

        // Buat direktori jika belum ada
        await mkdir(uploadDir, { recursive: true });

        // Simpan file
        await writeFile(filepath, buffer);
        console.log('[Upload Avatar] File saved successfully');

        // Update database
        await connectToDatabase();
        const avatarPath = `/uploads/avatars/${filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { avatar: avatarPath },
            { new: true }
        ).select('-password');

        console.log('[Upload Avatar] Database updated, avatar path:', avatarPath);

        return NextResponse.json({
            success: true,
            path: avatarPath,
            user: updatedUser
        });
    } catch (error) {
        console.error('[Upload Avatar] Error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupload avatar. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
