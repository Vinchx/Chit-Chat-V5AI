import { generateAIResponse, getAISystemPrompt } from "@/lib/gemini";
import { getAuthSessionOrApiKey } from "@/lib/auth-helpers";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";

export async function POST(request) {
    try {
        // 1. Check authentication
        const { session, userId, error } = await getAuthSessionOrApiKey(request);

        if (error) {
            return error;
        }

        const currentUserId = userId;

        // 2. Get request data
        const { message, conversationHistory } = await request.json();

        console.log("🤖 AI Chat Request:", { userId: currentUserId, message });

        // Validate message
        if (!message || message.trim() === "") {
            return Response.json({
                success: false,
                message: "Pesan tidak boleh kosong"
            }, { status: 400 });
        }

        // 3. Prepare conversation history for AI
        const history = conversationHistory || [];

        console.log("📝 Conversation history:", history);

        // Add system prompt as context
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

        // Add current user message
        fullPrompt += `User: ${message}\n\nAI:`;

        console.log("📝 Full prompt (first 200 chars):", fullPrompt.substring(0, 200));

        // 4. Generate AI response
        let aiResponse;
        try {
            aiResponse = await generateAIResponse(fullPrompt);
        } catch (aiError) {
            console.error("❌ AI Generation Error:", aiError);
            console.error("❌ AI Error message:", aiError.message);
            return Response.json({
                success: false,
                message: aiError.message || "Gagal mendapatkan respons dari AI"
            }, { status: 500 });
        }

        console.log("✅ AI Response generated:", aiResponse.substring(0, 100) + "...");

        // 5. Return AI response
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
