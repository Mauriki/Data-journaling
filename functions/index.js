const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const OpenAI = require("openai");

// Define the secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Note: OpenAI client is initialized inside each function using the secret

// Transcribe audio using OpenAI Whisper
exports.transcribeAudio = onRequest(
    {
        cors: true,
        secrets: [openaiApiKey],
    },
    async (req, res) => {
        // Initialize OpenAI with the secret
        const openai = new OpenAI({
            apiKey: openaiApiKey.value(),
        });
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        try {
            const { audioData } = req.body;

            if (!audioData) {
                return res.status(400).json({ error: "No audio data provided" });
            }

            // Convert base64 to buffer
            const buffer = Buffer.from(audioData, "base64");
            const audioFile = new File([buffer], "recording.mp3", {
                type: "audio/mp3",
            });

            // Step 1: Transcribe with Whisper
            const transcription = await openai.audio.transcriptions.create({
                file: audioFile,
                model: "whisper-1",
            });

            const rawText = transcription.text || "";

            // Step 2: Format with GPT for natural, readable structure
            const formattingPrompt = `Format this journal transcription to be clean and readable.

RULES:
1. NATURAL SPACING: Add paragraph breaks when YOU sense a meaningful shift in topic or activity.
   - Don't force it into time periods. Use your judgment.
   - Example: "I woke up, did my routine.\n\nWent outside for a bit. Came back and worked on the app.\n\nIn the evening I ate, walked, and watched lectures."
   - Keep related activities together. Separate distinct moments.

2. MINIMAL EMPHASIS: Bold (**text**) only 2-3 truly key activities.
   - Example: "worked on my **deep work session**" or "did **yoga nidra**"

3. CLEANUP: Remove filler words (um, ah, like, you know) and fix grammar.

4. OUTPUT: Just the formatted text. No intro.

Raw transcription:
${rawText}`;

            const formatted = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: formattingPrompt }],
                temperature: 0.3,
            });

            const finalText = formatted.choices[0]?.message?.content || rawText;

            res.json({ text: finalText });
        } catch (error) {
            console.error("Transcription error:", error);
            res.status(500).json({
                error: `Transcription failed: ${error.message}`,
            });
        }
    },
);

// Generate AI insights for a journal entry
exports.generateInsight = onRequest(
    {
        cors: true,
        secrets: [openaiApiKey],
    },
    async (req, res) => {
        // Initialize OpenAI with the secret
        const openai = new OpenAI({
            apiKey: openaiApiKey.value(),
        });
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        try {
            const { narrative, rating, tags } = req.body;

            if (!narrative) {
                return res.status(400).json({ error: "No narrative provided" });
            }

            const narrativeText = narrative.replace(/<[^>]*>/g, " ");

            const prompt = `Explain WHY the user felt this way based on their journal entry.

Entry: "${narrativeText}"
Mood: ${rating}/10
Tags: ${tags ? tags.join(", ") : "None"}

OUTPUT (clean bullets with spacing):
• [First reason why they felt this way]

• [Second reason or pattern]

• [One suggestion for tomorrow]

Rules:
- NO labels like "Reasoning:" or anything else
- Add a blank line between bullets for readability
- Each bullet = one clear sentence`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });

            res.json({
                insight: response.choices[0]?.message?.content ||
                    "No insight generated.",
            });
        } catch (error) {
            console.error("Insight generation error:", error);
            res.status(500).json({
                error: "Unable to generate insight at this time.",
            });
        }
    },
);

// Generate weekly review
exports.generateWeeklyReview = onRequest(
    {
        cors: true,
        secrets: [openaiApiKey],
    },
    async (req, res) => {
        // Initialize OpenAI with the secret
        const openai = new OpenAI({
            apiKey: openaiApiKey.value(),
        });
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        try {
            const { entries } = req.body;

            if (!entries || !Array.isArray(entries)) {
                return res.status(400).json({ error: "No entries provided" });
            }

            const entriesText = entries.map((e) =>
                `Date: ${e.date}, Rating: ${e.rating}, ` +
                `Summary: ${e.narrative.replace(/<[^>]*>/g, " ").substring(0, 100)}...`,
            ).join("\n");

            const prompt = `Review these journal entries and create a clean, structured daily summary.

Entries:
${entriesText}

OUTPUT FORMAT:
**This Week**
[2-3 sentences summarizing the emotional journey]

**Highlights**
• [Best moment or achievement]
• [Another positive highlight]

**Focus for Next Week**
[One clear, actionable focus area]

Rules:
- Keep it concise and encouraging
- Use simple, clean formatting
- No fluff or generic advice`;

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });

            res.json({
                review: response.choices[0]?.message?.content ||
                    "No review generated.",
            });
        } catch (error) {
            console.error("Weekly review error:", error);
            res.status(500).json({
                error: "Unable to generate weekly review.",
            });
        }
    },
);
