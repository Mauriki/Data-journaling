import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyDfN8DoYPyJbVM3y3MWaFdz0mhrpqLFuZo";
const genAI = new GoogleGenAI({ apiKey });

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("Error Details:", JSON.stringify(error, null, 2));
        console.error("Error Message:", error.message);
    }
}

run();
