// src/app/api/profile/upload-banner/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
    try {
        console.log('[Upload Banner] Starting upload process...');
        const session = await auth();

        if (!session || !session.user) {
            console.log('[Upload Banner] Unauthorized access attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[Upload Banner] User authenticated:', session.user.id);

        const formData = await request.formData();
        const file = formData.get('banner');

        if (!file) {
            console.log('[Upload Banner] No file in request');
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        console.log('[Upload Banner] File received:', {
            name: file.name,
            type: file.type,
            size: file.size
        });

        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            console.log('[Upload Banner] Invalid file type:', file.type);
            return NextResponse.json(
                { error: 'Tipe file tidak valid. Hanya JPEG, PNG, GIF, dan WebP yang diperbolehkan.' },
                { status: 400 }
            );
        }

        // Validasi ukuran file (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            console.log('[Upload Banner] File too large:', file.size);
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
        const filename = `banner-${session.user.id}-${timestamp}${ext}`;

        // Path untuk menyimpan file
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
        const filepath = path.join(uploadDir, filename);

        console.log('[Upload Banner] Saving to:', filepath);

        // Buat direktori jika belum ada
        await mkdir(uploadDir, { recursive: true });

        // Simpan file
        await writeFile(filepath, buffer);
        console.log('[Upload Banner] File saved successfully');

        // Update database
        await connectToDatabase();
        const bannerPath = `/uploads/banners/${filename}`;

        // Simpan hanya path-nya saja, biar konsisten sama avatar
        // Frontend yang akan handle formatting CSS-nya
        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { banner: bannerPath },
            { new: true }
        ).select('-password');

        console.log('[Upload Banner] Database updated, banner path:', bannerPath);

        return NextResponse.json({
            success: true,
            path: bannerPath,
            user: updatedUser
        });
    } catch (error) {
        console.error('[Upload Banner] Error:', error);
        return NextResponse.json(
            { error: 'Gagal mengupload banner. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
