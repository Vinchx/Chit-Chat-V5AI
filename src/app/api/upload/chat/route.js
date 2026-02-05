// src/app/api/upload/chat/route.js
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getAuthSessionOrApiKey } from '@/lib/auth-helpers';

// File type configurations
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime', // MOV
    'video/x-msvideo', // AVI
    'video/mpeg'
];
const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB



export async function POST(request) {
    try {
        // Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);
        if (error) return error;

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file');
        const roomId = formData.get('roomId');

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        if (!roomId) {
            return NextResponse.json(
                { success: false, message: 'Room ID is required' },
                { status: 400 }
            );
        }

        // Validate file type
        const fileType = file.type;
        const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
        const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType);
        const isDocument = ALLOWED_DOCUMENT_TYPES.includes(fileType);

        if (!isImage && !isVideo && !isDocument) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'File type not supported. Allowed: images (JPG, PNG, GIF, WebP), videos (MP4, WebM, MOV, AVI), and documents (PDF, DOC, DOCX, TXT, ZIP)'
                },
                { status: 400 }
            );
        }

        // Validate file size
        let maxSize = MAX_DOCUMENT_SIZE;
        if (isImage) maxSize = MAX_IMAGE_SIZE;
        if (isVideo) maxSize = MAX_VIDEO_SIZE;
        if (file.size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            return NextResponse.json(
                { success: false, message: `File too large. Max size: ${maxSizeMB}MB` },
                { status: 400 }
            );
        }

        // Sanitize filename
        const originalName = file.name;
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const timestamp = Date.now();
        const filename = `${timestamp}-${sanitizedName}`;

        // Create upload directory if not exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat', roomId);
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        const filepath = path.join(uploadDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return file info
        const fileUrl = `/uploads/chat/${roomId}/${filename}`;

        // Determine file type
        let mediaType = 'document';
        if (isImage) mediaType = 'image';
        if (isVideo) mediaType = 'video';

        return NextResponse.json({
            success: true,
            data: {
                type: mediaType,
                url: fileUrl,
                filename: originalName,
                size: file.size,
                mimeType: fileType
            }
        });


    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { success: false, message: 'Error uploading file', error: error.message },
            { status: 500 }
        );
    }
}
