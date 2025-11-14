
import React, { useState, useRef, useEffect } from 'react';
import { UI_TEXT } from '../constants';
import { VideoIcon, StopCircleIcon } from './icons';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const startRecording = async () => {
    setError(null);
    setVideoURL(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(videoBlob);
        setVideoURL(url);
        onRecordingComplete(videoBlob);
        stream.getTracks().forEach(track => track.stop());
        if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing camera/microphone:", err);
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
    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg h-full space-y-4">
      <div className="w-full bg-black rounded-md overflow-hidden aspect-video">
        {videoURL && !isRecording ? (
            <video src={videoURL} controls className="w-full h-full" />
        ) : (
            <video ref={videoPreviewRef} autoPlay muted className="w-full h-full object-cover" />
        )}
      </div>
      
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center space-x-2 px-6 py-3 bg-[#6B8A9E] text-white font-semibold rounded-lg shadow-md hover:bg-[#5a7588] transition-colors"
        >
          <VideoIcon className="w-6 h-6" />
          <span>{UI_TEXT.START_RECORDING_VIDEO}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
        >
          <StopCircleIcon className="w-6 h-6" />
          <span>{UI_TEXT.STOP_RECORDING_VIDEO}</span>
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default VideoRecorder;
