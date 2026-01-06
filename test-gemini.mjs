// Test Gemini API Connection
// Run with: node test-gemini.mjs

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAs-7sXZhs8TiNPZM1f2bg15PnFu0YOrKk";

async function testGemini() {
    try {
        console.log("🧪 Testing Gemini API connection...");
        console.log("🔑 API Key:", API_KEY.substring(0, 10) + "...");

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = "Halo, siapa kamu? Jawab dalam Bahasa Indonesia.";
        console.log("📝 Sending prompt:", prompt);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ SUCCESS! AI Response:");
        console.log(text);
        console.log("\n✅ Gemini API is working correctly!");

    } catch (error) {
        console.error("❌ ERROR:", error);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);

        if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
            console.error("\n🔴 API Key is invalid or not configured properly");
        } else if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            console.error("\n🔴 API quota exhausted");
        } else {
            console.error("\n🔴 Unknown error occurred");
        }
    }
}

testGemini();
