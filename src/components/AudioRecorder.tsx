import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { transcribeAudio } from '../services/openaiService';
import { useAuth } from '../contexts/AuthContext';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete }) => {
  const { isPro, usage, incrementUsage, isGuest } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    // Block guest users
    if (isGuest) {
      alert("✨ Sign in to unlock voice journaling\n\nCreate a free account to start recording your thoughts with unlimited AI-powered transcription.");
      return;
    }

    // Check Free Trial Limit (15 mins = 900 seconds)
    if (!isPro && usage.transcriptionSeconds >= 900) {
      alert("🎉 You've explored 15 minutes of unlimited potential!\n\nReady to unlock more? Join the Inner Circle for unlimited voice journaling.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          onTranscriptionComplete(text);

          // Update usage
          await incrementUsage(durationSeconds);

        } catch (error) {
          console.error("Transcription error:", error);
          alert("Transcription failed. Please check your connection or API key.");
        } finally {
          setIsProcessing(false);
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      onClick={toggleRecording}
      disabled={isProcessing}
      className={`
        p-2 rounded-full transition-all duration-300 flex items-center justify-center
        ${isRecording
          ? 'bg-red-500 text-white shadow-lg scale-110 animate-pulse'
          : isProcessing
            ? 'bg-blue-100 text-blue-500 cursor-wait'
            : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
        }
      `}
      title={isRecording ? "Stop Recording" : isProcessing ? "Processing..." : "Start Recording"}
    >
      {isProcessing ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isRecording ? (
        <Square size={18} fill="currentColor" />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
};

export default AudioRecorder;
