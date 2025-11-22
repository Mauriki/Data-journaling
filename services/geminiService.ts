import { GoogleGenAI } from "@google/genai";
import { JournalEntry } from "../types";
import { firebaseConfig } from "../firebase";

const getAI = () => new GoogleGenAI({ apiKey: firebaseConfig.apiKey });

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const ai = getAI();
    // Convert blob to base64
    const reader = new FileReader();

    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
    });

    reader.readAsDataURL(audioBlob);
    const base64Audio = await base64Promise;

    const model = 'gemini-2.5-flash';

    const prompt = `
      Transcribe the following audio recording for a personal journal.
      
      CRITICAL FORMATTING RULES:
      - Do not just output a wall of text.
      - Use Markdown formatting.
      - If the user lists things, use bullet points.
      - If the user changes topic, start a new paragraph.
      - Fix grammar and remove filler words (um, ah) to make it sound professional yet personal.
      - Return ONLY the transcribed text (with HTML compatible markdown).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
          { text: prompt }
        ]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Transcription failed", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const generateInsight = async (entry: JournalEntry): Promise<string> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';

    // Strip HTML tags for analysis
    const narrativeText = entry.narrative.replace(/<[^>]*>/g, ' ');
    const reasoningText = entry.reasoning.replace(/<[^>]*>/g, ' ');

    const prompt = `
      You are a high-performance personal growth coach (like a mix of Steve Jobs and a therapist).
      Analyze this journal entry:
      
      Date: ${entry.date}
      Rating: ${entry.rating}
      Narrative: "${narrativeText}"
      Reasoning: "${reasoningText}"
      Plan: "${entry.planForTomorrow}"
      
      Provide a daily summary and insight.
      1. Summarize the key event/emotion in 1 sentence.
      2. Provide 1 specific, high-level strategic advice based on the "Plan for Tomorrow".
      
      Keep the tone: Minimalist, direct, inspiring, warm.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Unable to generate insight.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI insight unavailable.";
  }
};

export const generateWeeklyReview = async (entries: JournalEntry[]): Promise<string> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';

    const entriesText = entries.map(e =>
      `Date: ${e.date}, Rating: ${e.rating}, Summary: ${e.narrative.replace(/<[^>]*>/g, ' ').substring(0, 100)}...`
    ).join('\n');

    const prompt = `
      Analyze these journal entries:
      ${entriesText}

      Output a "Weekly Intelligence Briefing".
      - Trend: What is the trajectory of the user's week?
      - Pattern: Connect two dots between different days.
      - Directive: One sentence command for next week.
      Use professional, elegant language.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Could not generate review.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate review.";
  }
};