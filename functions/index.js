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
            // Step 2: Format with GPT using the advanced system prompt
            const systemPrompt = `You are a senior editor + structured content processor for voice-to-text transcripts. Your job is to transform raw ASR output (the transcript) into a highly readable, structured journal entry and machine-friendly JSON segments — while strictly following the "no new words" policy.

PRINCIPLES / HARD RULES:
1. **NO NEW WORDS**: Do not introduce new semantic content. Only fix punctuation/spacing, remove fillers sparingly, and reflow sentences.
2. **SEGMENTATION**: Split segments by natural pauses.
3. **TOPIC DETECTION**: Detect topic changes and use headers like "### Topic: [Name]".
4. **BULLETS**: Convert enumerations to bullets.
5. **EMPHASIS**: Bold short phrases explicitly emphasized.
6. **OUTPUT FORMAT**: Return a JSON object with keys:
   {
    "polished_markdown": "...",
    "summary_bullets": ["...", "..."],
    "segments_json": [...],
    "warnings": [...]
   }

PROCESS:
1. Parse transcript.
2. Remove fillers sparingly.
3. Produce polished_markdown, summary_bullets, and segments_json.
4. Respect NO NEW WORDS.

Input Transcript:
${rawText}`;

            const formatted = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a helpful assistant that outputs JSON." },
                    { role: "user", content: systemPrompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" },
            });

            const content = formatted.choices[0]?.message?.content;
            let finalText = rawText;

            try {
                const parsed = JSON.parse(content);
                // We primarily want the polished markdown for the editor
                finalText = parsed.polished_markdown || rawText;

                // Optionally, we could append summary bullets if they exist and are useful
                if (parsed.summary_bullets && parsed.summary_bullets.length > 0) {
                    // For now, let's just return the polished markdown to match frontend expectation
                    // But we could append them like:
                    // finalText += "\n\n### Summary\n" + parsed.summary_bullets.map(b => "- " + b).join("\n");
                }
            } catch (e) {
                console.error("Failed to parse GPT JSON response:", e);
                finalText = content || rawText; // Fallback
            }

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
