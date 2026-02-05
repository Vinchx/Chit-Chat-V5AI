import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// Allowed image types for evidence
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: 'Only image files are allowed for evidence' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json(
                { success: false, message: 'Image too large. Max size: 5MB' },
                { status: 400 }
            );
        }

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports', 'evidence');
        if (!fs.existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filename = `${timestamp}-${originalName}`;
        const filepath = path.join(uploadDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Generate URL
        const fileUrl = `/uploads/reports/evidence/${filename}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            filename: file.name,
            size: file.size,
            type: file.type
        });
    } catch (error) {
        console.error('Error uploading evidence:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to upload evidence image' },
            { status: 500 }
        );
    }
}
