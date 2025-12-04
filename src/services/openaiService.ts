import { JournalEntry } from "../types";

// Cloud Functions URLs (will be set after deployment)
const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_URL ||
    "https://us-central1-data-journaling.cloudfunctions.net";

// Fallback to local development if needed
const USE_LOCAL = import.meta.env.VITE_USE_LOCAL_FUNCTIONS === 'true';
const LOCAL_URL = "http://127.0.0.1:5001/data-journaling/us-central1";

const getBaseUrl = () => USE_LOCAL ? LOCAL_URL : FUNCTIONS_BASE_URL;

export const transcribeAudio = async (audioBlob: Blob, section: 'narrative' | 'analysis' | 'strategy' = 'narrative'): Promise<string> => {
    try {
        // Convert blob to base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
            )
        );

        const response = await fetch(`${getBaseUrl()}/transcribeAudio`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ audioData: base64, section }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Transcription failed");
        }

        const data = await response.json();
        return data.text || "";
    } catch (error: any) {
        console.error("Transcription failed:", error);
        throw new Error(`Transcription failed: ${error?.message || "Unknown error"}`);
    }
};

export const generateInsight = async (entry: JournalEntry): Promise<string> => {
    try {
        const response = await fetch(`${getBaseUrl()}/generateInsight`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                narrative: entry.narrative,
                rating: entry.rating,
                tags: entry.tags,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Insight generation failed");
        }

        const data = await response.json();
        return data.insight || "No insight generated.";
    } catch (error: any) {
        console.error("Insight generation failed:", error);
        return "Unable to generate insight at this time.";
    }
};

export const generateWeeklyReview = async (entries: JournalEntry[]): Promise<string> => {
    try {
        const response = await fetch(`${getBaseUrl()}/generateWeeklyReview`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ entries }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Weekly review generation failed");
        }

        const data = await response.json();
        return data.review || "No review generated.";
    } catch (error: any) {
        console.error("Weekly review generation failed:", error);
        return "Unable to generate weekly review.";
    }
};
