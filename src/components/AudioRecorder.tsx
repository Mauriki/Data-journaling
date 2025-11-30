import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, X, Sparkles, AlertCircle } from 'lucide-react';
import { transcribeAudio } from '../services/openaiService';
import { hasTranscriptionQuota, addTranscriptionUsage, getRemainingSeconds, formatSecondsToMinutes } from '../services/usageService';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete }) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasQuota, setHasQuota] = useState(true);
  const [remainingTime, setRemainingTime] = useState('15:00');
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  useEffect(() => {
    checkQuota();
  }, []);

  const checkQuota = async () => {
    const quota = await hasTranscriptionQuota();
    setHasQuota(quota);
    const remaining = await getRemainingSeconds();
    setRemainingTime(formatSecondsToMinutes(remaining));

    // Show warning if less than 3 minutes remaining
    if (remaining < 180 && remaining > 0) {
      setShowQuotaWarning(true);
    }
  };

  const startRecording = async () => {
    if (!hasQuota) {
      alert('You have used your 15-minute free trial. Please upgrade to continue using voice transcription.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        handleTranscription(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setState('recording');

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Microphone access was denied. Please check your browser permissions.");
      } else {
        alert("Could not access microphone.");
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
      mediaRecorderRef.current.stop();
      setState('processing');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setState('idle');
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const handleTranscription = async (blob: Blob) => {
    try {
      const text = await transcribeAudio(blob);

      // Track usage
      await addTranscriptionUsage(recordingTime);
      await checkQuota();

      // Convert markdown to HTML - simplified for TypeScript compatibility
      let formattedText = text;

      // Headers
      formattedText = formattedText.replace(/^### (.+)$/gim, '<h2>$1</h2>');
      formattedText = formattedText.replace(/^## (.+)$/gim, '<h2>$1</h2>');
      formattedText = formattedText.replace(/^# (.+)$/gim, '<h1>$1</h1>');

      // Lists
      formattedText = formattedText.replace(/^\* (.+)$/gim, '<ul><li>$1</li></ul>');
      formattedText = formattedText.replace(/^- (.+)$/gim, '<ul><li>$1</li></ul>');

      // Bold
      formattedText = formattedText.replace(/\*\*(.+?)\*\*/gim, '<b>$1</b>');

      // Line breaks
      formattedText = formattedText.replace(/\n/gim, '<br>');

      // Clean up adjacent lists
      formattedText = formattedText.replace(/<\/ul><br><ul>/g, '');

      onTranscriptionComplete(formattedText);
      setState('idle');
      setRecordingTime(0);
    } catch (error) {
      console.error(error);
      alert("Failed to transcribe. Please try again.");
      setState('idle');
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasQuota) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
        <AlertCircle className="w-3 h-3" />
        <span>Trial ended - Upgrade to continue</span>
      </div>
    );
  }

  if (state === 'processing') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium animate-pulse">
        <Sparkles className="w-3 h-3" />
        <span>AI Processing...</span>
      </div>
    );
  }

  if (state === 'recording' || state === 'paused') {
    return (
      <div className="flex items-center gap-2">
        {/* Timer Display */}
        <div className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full text-xs font-mono font-medium text-gray-700 dark:text-gray-300">
          {formatTime(recordingTime)}
        </div>

        {/* Pause/Resume Button */}
        <button
          onClick={state === 'recording' ? pauseRecording : resumeRecording}
          className="ripple-button p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-all active:scale-95"
          title={state === 'recording' ? 'Pause' : 'Resume'}
        >
          {state === 'recording' ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>

        {/* Stop Button */}
        <button
          onClick={stopRecording}
          className="ripple-button p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full transition-all active:scale-95"
          title="Stop & Transcribe"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        {/* Cancel Button */}
        <button
          onClick={cancelRecording}
          className="ripple-button p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-all active:scale-95"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={startRecording}
        className="ripple-button flex items-center gap-2 px-3 py-1.5 text-apple-gray hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
        title="Dictate with AI"
      >
        <Mic className="w-4 h-4" />
        <span className="text-xs font-medium">Dictate</span>
      </button>
      {showQuotaWarning && (
        <span className="text-xs text-amber-600 px-2">
          {remainingTime} left
        </span>
      )}
    </div>
  );
};

export default AudioRecorder;