export type RatingValue = -2 | -1 | 0 | 1 | 2;

export interface JournalEntry {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  timestamp: number; // Creation time

  // Section 1: Narrative (Stored as HTML string for Rich Text)
  narrative: string;

  // Section 2: Analysis
  rating: RatingValue | null;
  reasoning: string; // HTML string

  // Section 3: Plan
  planForTomorrow: string; // HTML string

  // Data features
  tags: string[];

  // AI Metadata
  aiSummary?: string;

  // Security flag
  encrypted?: boolean;
}

export interface DayStats {
  date: string;
  rating: number;
}