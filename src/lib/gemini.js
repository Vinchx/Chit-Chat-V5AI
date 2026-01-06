import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate AI response using Gemini
 * @param {string} prompt - User's message/prompt
 * @param {Array} conversationHistory - Optional conversation history for context
 * @returns {Promise<string>} - AI generated response
 */
export async function generateAIResponse(prompt) {
    try {
        console.log("🤖 Generating AI response...");
        console.log("🤖 Prompt length:", prompt.length);

        // Check if API key is available
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured");
        }

        // Use gemini-2.5-flash model (latest stable version)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Generate response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ AI response generated, length:", text.length);

        return text;
    } catch (error) {
        console.error("❌ Error generating AI response:", error);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
        console.error("❌ Full error object:", JSON.stringify(error, null, 2));

        // Handle specific error cases
        if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
            throw new Error("API key Gemini tidak valid atau tidak ditemukan");
        }

        if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("Quota API Gemini habis. Silakan coba lagi nanti");
        }

        if (error.message?.includes('SAFETY') || error.message?.includes('BLOCKED')) {
            throw new Error("Pesan Anda mengandung konten yang tidak aman");
        }

        if (error.message?.includes('INVALID_ARGUMENT')) {
            throw new Error("Format permintaan tidak valid");
        }

        // Return the actual error message for debugging
        throw new Error(error.message || "Gagal generate respons AI. Silakan coba lagi");
    }
}

/**
 * Generate streaming AI response (for future implementation)
 * @param {string} prompt - User's message/prompt
 * @returns {AsyncGenerator} - Stream of AI response chunks
 */
export async function* generateStreamingResponse(prompt) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            yield chunkText;
        }
    } catch (error) {
        console.error("❌ Error generating streaming response:", error);
        throw new Error("Gagal generate streaming response");
    }
}

/**
 * Create AI assistant system prompt
 * @returns {string} - System prompt for AI
 */
export function getAISystemPrompt() {
    return `Kamu adalah AI Assistant untuk aplikasi chat ChitChat. 
Nama kamu adalah "ChitChat AI".
Kamu membantu pengguna dengan menjawab pertanyaan mereka dengan ramah dan informatif.
Selalu jawab dalam Bahasa Indonesia kecuali user meminta bahasa lain.
Jaga percakapan tetap natural dan friendly.
Jika ditanya tentang dirimu, jelaskan bahwa kamu adalah AI assistant yang dibuat untuk membantu pengguna ChitChat.`;
}
