import { generateAIResponse, getAISystemPrompt } from "@/lib/gemini";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";

/**
 * Helper function to read image file and convert to base64
 */
async function readImageAsBase64(filePath) {
    try {
        // Read file from uploads directory
        const absolutePath = path.join(process.cwd(), 'public', filePath);

        const fileBuffer = await fs.readFile(absolutePath);
        const base64Data = fileBuffer.toString('base64');

        return base64Data;
    } catch (error) {
        throw new Error(`Failed to read image: ${error.message}`);
    }
}

export async function POST(request) {
    try {
        // 1. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        // 2. Get request data
        const { message, conversationHistory, attachment, model } = await request.json();

        // Validate and select model
        const allowedModels = [
            'gemini-3-flash-preview',   // Latest & Fast
            'gemini-2.5-flash',          // Stable & Balanced
        ];

        const selectedModel = model && allowedModels.includes(model)
            ? model
            : 'gemini-3-flash-preview'; // Default to latest

        // Validate message - allow empty if there's an attachment (image-only messages)
        if ((!message || message.trim() === "") && !attachment) {
            return Response.json({
                success: false,
                message: "Pesan atau gambar harus diisi"
            }, { status: 400 });
        }

        // 3. Build conversation history
        const history = Array.isArray(conversationHistory)
            ? conversationHistory
            : [];

        // Create system message with history context
        const systemPrompt = getAISystemPrompt();

        // Build full prompt with system context
        let fullPrompt = systemPrompt + "\n\n";

        // Add conversation history if exists
        if (history.length > 0) {
            fullPrompt += "Conversation history:\n";
            history.forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}\n`;
            });
            fullPrompt += "\n";
        }

        // Add current user message (or default prompt for image-only)
        const userMessage = message && message.trim() !== ""
            ? message
            : "What's in this image?"; // Default prompt for image-only messages

        fullPrompt += `User: ${userMessage}\n\nAI:`;

        // 4. Process image attachment if present
        let imageAttachments = [];

        if (attachment && attachment.type === 'image' && attachment.url) {
            try {
                // Read image file and convert to base64
                // attachment.url format: /uploads/chat/{roomId}/{filename}
                const base64Data = await readImageAsBase64(attachment.url);

                // Determine mimeType from file extension or stored mimeType
                let mimeType = attachment.mimeType || 'image/jpeg';

                // Map common extensions to proper mimeTypes
                if (attachment.filename) {
                    const ext = path.extname(attachment.filename).toLowerCase();
                    const mimeTypeMap = {
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.png': 'image/png',
                        '.gif': 'image/gif',
                        '.webp': 'image/webp'
                    };
                    mimeType = mimeTypeMap[ext] || mimeType;
                }

                imageAttachments.push({
                    data: base64Data,
                    mimeType: mimeType
                });
            } catch (imageError) {
                console.error('❌ Error processing image:', imageError);
                // Continue with text-only request
            }
        }

        // 5. Generate AI response with selected model
        let aiResponse;

        try {
            // Generate text/vision response
            aiResponse = await generateAIResponse(fullPrompt, imageAttachments, selectedModel);
        } catch (aiError) {
            console.error("❌ AI Generation Error:", aiError);
            return Response.json({
                success: false,
                message: aiError.message || "Gagal mendapatkan respons dari AI"
            }, { status: 500 });
        }

        // 6. Return AI response
        return Response.json({
            success: true,
            data: {
                response: aiResponse,
                timestamp: new Date()
            }
        }, { status: 200 });

    } catch (error) {
        console.error("❌ ERROR AI CHAT:", error);
        return Response.json({
            success: false,
            message: "Terjadi kesalahan saat memproses permintaan AI",
            error: error.message
        }, { status: 500 });
    }
}

/**
 * GET endpoint to check AI service status
 */
export async function GET(request) {
    try {
        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return Response.json({
                success: false,
                message: "Gemini API key tidak dikonfigurasi"
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: "AI service is ready",
            data: {
                model: "gemini-pro",
                status: "active"
            }
        }, { status: 200 });

    } catch (error) {
        return Response.json({
            success: false,
            message: "Error checking AI service status",
            error: error.message
        }, { status: 500 });
    }
}
