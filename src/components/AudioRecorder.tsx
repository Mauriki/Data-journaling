import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, Trash2, Loader2 } from 'lucide-react';
import { transcribeAudio } from '../services/openaiService';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  section?: 'narrative' | 'analysis' | 'strategy';
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete, section = 'narrative' }) => {
  const { isPro, usage, incrementUsage, isGuest } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Update duration timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
        setDuration(Math.floor(elapsed / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    // Block guest users
    if (isGuest) {
      alert("✨ Sign in to unlock voice journaling\n\nCreate a free account to start recording your thoughts.");
      return;
    }

    // Check Free Trial Limit (15 mins = 900 seconds)
    if (!isPro && usage.transcriptionSeconds >= 900) {
      alert("🎉 You've used your 15-minute trial!\n\nJoin the Inner Circle for unlimited voice journaling.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      setDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Only process if we have audio data and recording wasn't deleted
        if (chunksRef.current.length === 0) {
          cleanupStream();
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Don't process if audio is too short
        if (duration < 1) {
          cleanupStream();
          setDuration(0);
          return;
        }

        setIsProcessing(true);
        try {
          const text = await transcribeAudio(audioBlob, section);

          if (text && text.trim().length > 0) {
            onTranscriptionComplete(text);
            await incrementUsage(duration);
          }
        } catch (error) {
          console.error("Transcription error:", error);
          alert("Transcription failed. Please try again.");
        } finally {
          setIsProcessing(false);
          cleanupStream();
          setDuration(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("Could not access microphone. Please allow permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      pauseStartRef.current = Date.now();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      pausedDurationRef.current += Date.now() - pauseStartRef.current;
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const deleteRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      chunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      cleanupStream();
    }
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Processing state with animation
  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-accent-leather/10 dark:bg-accent-warm/10 rounded-full border border-accent-leather/30"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 size={16} className="text-accent-leather dark:text-accent-warm" />
        </motion.div>
        <span className="text-sm text-accent-leather dark:text-accent-warm font-medium">Processing...</span>
      </motion.div>
    );
  }

  // Recording state with controls
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-1.5"
      >
        {/* Duration */}
        <motion.div
          animate={{ opacity: isPaused ? [1, 0.5, 1] : 1 }}
          transition={{ repeat: isPaused ? Infinity : 0, duration: 1 }}
          className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${isPaused
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}
        >
          {formatTime(duration)}
        </motion.div>

        {/* Pause/Resume */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 rounded-full transition-colors"
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
        </motion.button>

        {/* Stop & Save */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={stopRecording}
          className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/40 rounded-full transition-colors"
          title="Stop & Save"
        >
          <Square size={14} fill="currentColor" />
        </motion.button>

        {/* Delete */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={deleteRecording}
          className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/40 rounded-full transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </motion.button>
      </motion.div>
    );
  }

  // Default: Mic button (always visible)
  return (
    <motion.button
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={startRecording}
      className="p-2 rounded-full bg-accent-leather/10 dark:bg-accent-warm/10 text-accent-leather dark:text-accent-warm hover:bg-accent-leather/20 dark:hover:bg-accent-warm/20 transition-all shadow-sm"
      title="Record"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <Mic size={16} />
      </motion.div>
    </motion.button>
  );
};

export default AudioRecorder;
