import React, { useState, useRef } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        handleTranscription(blob);
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         alert("Microphone access was denied. Please check your browser permissions for this site.");
      } else {
         alert("Could not access microphone. Please ensure your device has a microphone connected.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    try {
      const text = await transcribeAudio(blob);
      
      // Convert markdown to HTML for the rich text editor
      let formattedText = text
        .replace(/^### (.*$)/gim, '<h2>$1</h2>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/\n/gim, '<br>');

      // Clean up adjacent lists
      formattedText = formattedText.replace(/<\/ul><br><ul>/g, '');
      
      onTranscriptionComplete(formattedText);
    } catch (error) {
      console.error(error);
      alert("Failed to transcribe.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center">
      {isProcessing ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium animate-pulse">
          <Sparkles className="w-3 h-3" />
          <span>AI Processing...</span>
        </div>
      ) : isRecording ? (
        <button
          onClick={stopRecording}
          className="group flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-all"
        >
          <div className="relative w-2 h-2">
             <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
             <div className="absolute inset-0 bg-red-500 rounded-full"></div>
          </div>
          <span className="text-xs font-bold uppercase">Stop & Transcribe</span>
        </button>
      ) : (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-3 py-1.5 text-apple-gray hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
          title="Dictate with AI"
        >
          <Mic className="w-4 h-4" />
          <span className="text-xs font-medium">Dictate</span>
        </button>
      )}
    </div>
  );
};

export default AudioRecorder;