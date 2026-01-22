// src/app/api/profile/upload-avatar/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { put } from '@vercel/blob';
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

        // Validasi ukuran file (max 4MB for Vercel Blob server upload, 10MB for file system)
        const maxSize = process.env.USE_BLOB_STORAGE === 'true' ? 4 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            console.log('[Upload Avatar] File too large:', file.size);
            return NextResponse.json(
                { error: `Ukuran file terlalu besar. Maksimal ${maxSize / (1024 * 1024)}MB.` },
                { status: 400 }
            );
        }

        // Buat nama file unik
        const timestamp = Date.now();
        const ext = path.extname(file.name);
        const filename = `avatar-${session.user.id}-${timestamp}${ext}`;

        let avatarUrl;

        // Conditional: Vercel Blob (production) atau File System (local)
        const useBlob = process.env.USE_BLOB_STORAGE === 'true';

        if (useBlob) {
            console.log('[Upload Avatar] Using Vercel Blob Storage...');

            // Upload to Vercel Blob
            const blob = await put(filename, file, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            avatarUrl = blob.url;
            console.log('[Upload Avatar] Uploaded to Blob:', avatarUrl);

        } else {
            console.log('[Upload Avatar] Using Local File System...');

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Path untuk menyimpan file
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
            const filepath = path.join(uploadDir, filename);

            console.log('[Upload Avatar] Saving to:', filepath);

            // Buat direktori jika belum ada
            await mkdir(uploadDir, { recursive: true });

            // Simpan file
            await writeFile(filepath, buffer);
            console.log('[Upload Avatar] File saved successfully');

            avatarUrl = `/uploads/avatars/${filename}`;
        }

        // Update database
        await connectToDatabase();

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { avatar: avatarUrl },
            { new: true }
        ).select('-password');

        console.log('[Upload Avatar] Database updated, avatar URL:', avatarUrl);

        return NextResponse.json({
            success: true,
            path: avatarUrl,
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
