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
            const { audioData, section } = req.body;

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

            // If empty or just noise, return empty
            if (!rawText.trim() || rawText.trim().length < 3) {
                return res.json({ text: "" });
            }

            // Step 2: Format with GPT based on section type
            const sectionType = section || "narrative"; // Default to narrative

            let systemPrompt = "";

            if (sectionType === "narrative") {
                systemPrompt = `You are a voice-to-text formatter for a personal journal NARRATIVE section.

RULES (VERY STRICT):
1. **NO NEW WORDS**: Never add content the user didn't say. Zero tolerance.
2. **PRESERVE MEANING**: Keep the user's exact phrasing and tone.
3. **PARAGRAPH BREAKS**: Add a blank line ONLY when there's a clear shift in:
   - Time (morning → afternoon)
   - Location/place
   - Topic/subject
   - Activity
4. **NO HEADINGS**: Never use # or ## headers.
5. **MINIMAL MARKDOWN**: 
   - Use • bullets ONLY if user explicitly lists things
   - Use **bold** ONLY for explicit emphasis
   - No fancy formatting
6. **NATURAL FLOW**: Write as flowing paragraphs, not fragmented sentences.
7. **REMOVE FILLER**: Remove "um", "uh", "like" etc, but nothing else.

INPUT: "${rawText}"

OUTPUT: Return ONLY the formatted text. Nothing else.`;
            } else if (sectionType === "analysis") {
                systemPrompt = `You are a voice-to-text formatter for a journal MOOD/ANALYSIS section.

RULES (VERY STRICT):
1. **NO NEW WORDS**: Never add content the user didn't say.
2. **PARAGRAPH BREAKS**: Separate different emotional observations.
3. **NO HEADINGS**: Never use headers.
4. **BULLETS**: Use • bullets when user describes multiple feelings or reasons.
5. **NATURAL REFLECTION**: Keep the introspective, emotional tone.
6. **REMOVE FILLER**: Remove "um", "uh", etc.

INPUT: "${rawText}"

OUTPUT: Return ONLY the formatted text. Nothing else.`;
            } else if (sectionType === "strategy") {
                systemPrompt = `You are a voice-to-text formatter for a journal STRATEGY/PLANNING section.

RULES (VERY STRICT):
1. **NO NEW WORDS**: Never add content the user didn't say.
2. **CHECKBOXES**: Convert tasks/plans/todos into checkboxes:
   - Use "- [ ] " for each action item or task
   - Keep non-task content as regular paragraphs
3. **NO HEADINGS**: Never use headers.
4. **ACTION-ORIENTED**: This section is about future plans/actions.
5. **REMOVE FILLER**: Remove "um", "uh", etc.

Examples of checkboxes:
"I need to call mom" → - [ ] Call mom
"Tomorrow I want to exercise" → - [ ] Exercise tomorrow
"I should probably check my emails" → - [ ] Check emails

INPUT: "${rawText}"

OUTPUT: Return ONLY the formatted text. Nothing else.`;
            } else {
                // Generic formatting
                systemPrompt = `Format this voice transcript cleanly. Remove filler words. Add paragraph breaks between different topics. Do NOT add any new content or headings. Only output the formatted text.

INPUT: "${rawText}"`;
            }

            const formatted = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "user", content: systemPrompt }
                ],
                temperature: 0.2,
            });

            const finalText = formatted.choices[0]?.message?.content?.trim() || rawText;

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
