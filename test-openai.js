import 'dotenv/config';
import OpenAI from 'openai';

const apiKey = process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    console.error("❌ No API Key found in .env file!");
    process.exit(1);
}

console.log(`🔑 Found API Key: ${apiKey.substring(0, 8)}...`);

const openai = new OpenAI({ apiKey });

async function test() {
    console.log("🚀 Testing OpenAI API...");
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Say hello!" }],
            model: "gpt-3.5-turbo",
        });
        console.log("✅ Success! Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("❌ API Call Failed!");
        console.error("Error Message:", error.message);
        console.error("Error Code:", error.code);
        console.error("Error Type:", error.type);
    }
}

test();
