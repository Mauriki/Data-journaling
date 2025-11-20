import React, { useState, useEffect, useCallback } from 'react';
import { JournalEntry, RatingValue } from '../types';
import { saveEntry, getEntryByDate } from '../services/storageService';
import { generateInsight } from '../services/geminiService';
import RatingInput from './RatingInput';
import RichTextEditor from './RichTextEditor';
import AudioRecorder from './AudioRecorder';
import { Calendar, Sparkles, Tag, Plus, ShieldCheck, ArrowRight } from 'lucide-react';

interface JournalEditorProps {
  initialDate: string;
  onSave: () => void;
}

const JournalEditor: React.FC<JournalEditorProps> = ({ initialDate, onSave }) => {
  const [date, setDate] = useState(initialDate);
  
  // Content States (HTML strings now)
  const [narrative, setNarrative] = useState('');
  const [rating, setRating] = useState<RatingValue | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [plan, setPlan] = useState('');
  
  const [aiInsight, setAiInsight] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data with async handling for decryption
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const entry = await getEntryByDate(initialDate);
      if (entry) {
        setNarrative(entry.narrative);
        setRating(entry.rating);
        setReasoning(entry.reasoning);
        setPlan(entry.planForTomorrow);
        setTags(entry.tags || []);
        setAiInsight(entry.aiSummary);
      } else {
        setNarrative('');
        setRating(null);
        setReasoning('');
        setPlan('');
        setTags([]);
        setAiInsight(undefined);
      }
      setLoading(false);
      setSaveStatus('saved');
    };
    init();
  }, [initialDate]);

  // Auto-save logic
  const saveData = useCallback(async () => {
    setSaveStatus('saving');
    const entry: JournalEntry = {
      id: date,
      date,
      timestamp: Date.now(),
      narrative,
      rating: rating || 0,
      reasoning,
      planForTomorrow: plan,
      tags,
      aiSummary: aiInsight,
      encrypted: true // Flag to indicate this is secure
    };

    await saveEntry(entry);
    
    setTimeout(() => {
      setSaveStatus('saved');
      onSave(); 
    }, 500);
  }, [date, narrative, rating, reasoning, plan, tags, aiInsight, onSave]);

  // Debounce auto-save
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (narrative || reasoning || plan || rating !== null) {
        saveData();
      }
    }, 2000); // Slightly longer delay for rich text

    return () => clearTimeout(timer);
  }, [narrative, reasoning, plan, rating, tags, aiInsight, saveData, loading]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleGenerateInsight = async () => {
    if (rating === null || (!narrative && !reasoning)) return;

    setIsGenerating(true);
    const entry: JournalEntry = {
      id: date,
      date,
      timestamp: Date.now(),
      narrative,
      rating,
      reasoning,
      planForTomorrow: plan,
      tags
    };

    const insight = await generateInsight(entry);
    setAiInsight(insight);
    
    // Save immediately
    entry.aiSummary = insight;
    entry.encrypted = true;
    await saveEntry(entry);
    
    setIsGenerating(false);
  };

  // Handlers for Voice Transcription Append
  const appendNarrative = (text: string) => setNarrative(prev => prev + text);
  const appendReasoning = (text: string) => setReasoning(prev => prev + text);
  const appendPlan = (text: string) => setPlan(prev => prev + text);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-apple-gray">Loading encrypted entries...</div>;
  }

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="w-full pb-32 animate-fade-in">
      
      {/* Status Indicator */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-3">
         {/* Security Badge */}
         <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
            <ShieldCheck className="w-3 h-3" />
            <span>AES-GCM Encrypted</span>
         </div>
         
         <span className={`
           text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-300
           ${saveStatus === 'saving' ? 'bg-white text-blue-600 border-blue-100 shadow-sm' : 'opacity-0'}
         `}>
           Saving...
         </span>
      </div>

      {/* AI Summary Card (If exists) */}
      {aiInsight && (
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="w-32 h-32" />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Daily Intelligence</span>
              </div>
              <div className="prose prose-sm max-w-none text-apple-text font-serif text-lg leading-relaxed">
                {aiInsight}
              </div>
           </div>
        </div>
      )}

      {/* Header Area */}
      <header className="mb-10 pb-6 border-b border-gray-200/60">
        <div className="flex items-center gap-2 text-apple-gray mb-1">
          <Calendar className="w-4 h-4" />
          <input 
            type="date" 
            value={date} 
            onChange={handleDateChange}
            className="bg-transparent border-none outline-none text-sm font-medium text-apple-gray hover:text-apple-blue cursor-pointer uppercase tracking-wide"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-apple-text tracking-tight">
          {formattedDate}
        </h1>
      </header>

      <div className="space-y-12">
        
        {/* 1. Narrative Section */}
        <section className="group">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-xs font-bold text-apple-gray uppercase tracking-widest">
              01 — Narrative
            </label>
            <AudioRecorder onTranscriptionComplete={appendNarrative} />
          </div>
          
          <RichTextEditor 
            value={narrative}
            onChange={setNarrative}
            placeholder="What happened today? Use formatting to structure your thoughts..."
          />
        </section>

        {/* 2. Analysis Section */}
        <section className="group">
          <label className="block text-xs font-bold text-apple-gray uppercase tracking-widest mb-6">
            02 — Analysis & Mood
          </label>
          
          <div className="mb-8">
            <RatingInput value={rating} onChange={setRating} />
          </div>

          <div className="flex items-center justify-between mb-3">
             <span className="text-sm font-medium text-apple-gray">Reasoning</span>
             <AudioRecorder onTranscriptionComplete={appendReasoning} />
          </div>
          <RichTextEditor 
            value={reasoning}
            onChange={setReasoning}
            placeholder="Analyze the drivers of your day..."
            minHeight="80px"
          />
        </section>

        {/* 3. Plan Section */}
        <section className="group">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-bold text-apple-gray uppercase tracking-widest">
              03 — Strategy for Tomorrow
            </label>
            <AudioRecorder onTranscriptionComplete={appendPlan} />
          </div>
          <RichTextEditor 
            value={plan}
            onChange={setPlan}
            placeholder="Actionable steps for tomorrow..."
            minHeight="80px"
          />
        </section>

        {/* Tags Section */}
        <section className="pt-6 border-t border-gray-200/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-apple-gray bg-gray-50 px-2 rounded-lg">
              <Tag className="w-4 h-4" />
              <input 
                type="text" 
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (() => {
                    if (newTag.trim() && !tags.includes(newTag.trim())) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag('');
                    }
                })()}
                placeholder="Add tag"
                className="bg-transparent border-none outline-none text-sm py-1.5 min-w-[80px] placeholder:text-gray-400 focus:ring-0"
              />
              <button 
                onClick={() => {
                    if (newTag.trim() && !tags.includes(newTag.trim())) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag('');
                    }
                }}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 text-apple-gray"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            {tags.map(tag => (
              <span 
                key={tag} 
                onClick={() => setTags(tags.filter(t => t !== tag))}
                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-medium cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* Action Bar */}
        <section className="pt-8 flex justify-end">
           {!aiInsight && (
             <button
               onClick={handleGenerateInsight}
               disabled={isGenerating || !narrative}
               className="
                 flex items-center gap-2 pl-4 pr-5 py-3 bg-apple-text text-white rounded-full 
                 shadow-float hover:shadow-lg hover:-translate-y-0.5 transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
               "
             >
               {isGenerating ? (
                 <>
                   <ArrowRight className="w-4 h-4 animate-spin" />
                   <span className="font-medium">Thinking...</span>
                 </>
               ) : (
                 <>
                   <Sparkles className="w-4 h-4" />
                   <span className="font-medium">Generate Daily Summary</span>
                 </>
               )}
             </button>
           )}
        </section>

      </div>
    </div>
  );
};

export default JournalEditor;