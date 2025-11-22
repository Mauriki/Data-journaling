import OpenAI from "openai";
import { JournalEntry } from "../types";

// Environment variables
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const SIMULATION_MODE = import.meta.env.VITE_SIMULATION_MODE === 'true' || !API_KEY;

// Initialize OpenAI only if key is present
const openai = API_KEY ? new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true
}) : null;

// Mock Data for Simulation Mode
const MOCK_TRANSCRIPTION = "This is a simulated transcription. In simulation mode, audio is not sent to OpenAI. This text demonstrates how the transcription feature works in the UI. Try adding a valid API key to get real transcriptions!";

const MOCK_INSIGHT = `* **Psychological Insight:** You seem to be testing the application's capabilities.
* **Pattern:** You are currently using the simulation mode.
* **Suggestion:** Add a valid OpenAI API key to unlock full AI potential.`;

const MOCK_WEEKLY_REVIEW = "This is a simulated weekly review. It seems you've been actively testing the application. Great job on maintaining your streak! Consider reflecting on your progress with real AI insights soon.";

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    if (SIMULATION_MODE) {
        console.log("Simulating audio transcription...");
        await new Promise(resolve => setTimeout(resolve, 1500)); // Fake delay
        return MOCK_TRANSCRIPTION;
    }

    if (!openai) throw new Error("OpenAI API Key not configured");

    try {
        const audioFile = new File([audioBlob], "recording.mp3", { type: "audio/mp3" });

        const response = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            prompt: "Transcribe this journal entry. Fix grammar and remove filler words like 'um' and 'ah'. Format with markdown if appropriate.",
        });

        return response.text || "";
    } catch (error) {
        console.error("OpenAI Transcription failed", error);
        throw new Error("Failed to transcribe audio with OpenAI.");
    }
};

export const generateInsight = async (entry: JournalEntry): Promise<string> => {
    if (SIMULATION_MODE) {
        console.log("Simulating insight generation...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay
        return MOCK_INSIGHT;
    }

    if (!openai) return "OpenAI API Key not configured";

    try {
        const narrativeText = entry.narrative.replace(/<[^>]*>/g, ' ');

        const prompt = `
      Analyze this journal entry and provide a brief, 3-bullet point insight.
      
      Entry:
      "${narrativeText}"
      
      Mood: ${entry.rating}/10
      Tags: ${entry.tags.join(", ")}
      
      Output format:
      * **Psychological Insight:** [One sentence]
      * **Pattern:** [One sentence]
      * **Suggestion:** [One actionable tip]
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        return response.choices[0]?.message?.content || "No insight generated.";
    } catch (error) {
        console.error("OpenAI Insight generation failed", error);
        return "Unable to generate insight at this time.";
    }
};

export const generateWeeklyReview = async (entries: JournalEntry[]): Promise<string> => {
    if (SIMULATION_MODE) {
        console.log("Simulating weekly review...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay
        return MOCK_WEEKLY_REVIEW;
    }

    if (!openai) return "OpenAI API Key not configured";

    try {
        const entriesText = entries.map(e =>
            `Date: ${e.date}, Rating: ${e.rating}, Summary: ${e.narrative.replace(/<[^>]*>/g, ' ').substring(0, 100)}...`
        ).join("\n");

        const prompt = `
      Review these journal entries from the past week and summarize the user's emotional journey.
      
      Entries:
      ${entriesText}
      
      Provide a encouraging summary and one focus area for next week.
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        return response.choices[0]?.message?.content || "No review generated.";
    } catch (error) {
        console.error("OpenAI Weekly Review failed", error);
        return "Unable to generate weekly review.";
    }
};
