
import React, { useState, useRef, useEffect } from 'react';
import { UI_TEXT } from '../constants';
import { MicIcon, StopCircleIcon } from './icons';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    setError(null);
    setAudioURL(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(UI_TEXT.ERROR_MEDIA);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg h-full">
      {audioURL && (
        <div className="w-full mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">{UI_TEXT.PREVIEW_AUDIO}</p>
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center space-x-2 px-6 py-3 bg-[#6B8A9E] text-white font-semibold rounded-lg shadow-md hover:bg-[#5a7588] transition-colors"
        >
          <MicIcon className="w-6 h-6" />
          <span>{UI_TEXT.START_RECORDING_AUDIO}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
        >
          <StopCircleIcon className="w-6 h-6" />
          <span>{UI_TEXT.STOP_RECORDING_AUDIO}</span>
        </button>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default AudioRecorder;
