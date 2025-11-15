import React, { useState, useCallback } from 'react';
import { ReportType, WebsiteSettings, Report } from '../types';
import { UI_TEXT, TEXT_CHAR_LIMIT } from '../constants';
import { MicIcon, TextIcon, VideoIcon, SendIcon, CheckCircleIcon, XCircleIcon, SparkIcon, LockClosedIcon, RefreshIcon } from './icons';
import AudioRecorder from './AudioRecorder';
import VideoRecorder from './VideoRecorder';
import { analyzeReportWithGemini } from '../services/geminiService';
import { sendTextReport, sendAudioReport, sendVideoReport } from '../services/telegramService';
import { addReport } from '../utils/storage';

interface ReportFormProps {
    settings: WebsiteSettings;
}

const ReportForm: React.FC<ReportFormProps> = ({ settings }) => {
  const [reportType, setReportType] = useState<ReportType>('text');
  const [text, setText] = useState('');
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isFormDirty = text.trim() !== '' || mediaBlob !== null;

  const resetState = useCallback(() => {
    setReportType('text');
    setText('');
    setMediaBlob(null);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setSuccess(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !isFormDirty) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    let analysisResult = '';
    
    try {
      if (text.trim()) {
        setLoadingMessage(UI_TEXT.ANALYZING_REPORT);
        try {
          analysisResult = await analyzeReportWithGemini(text);
        } catch (analysisError) {
            console.error("Gemini analysis failed:", analysisError);
            setError(UI_TEXT.ERROR_ANALYSIS);
            analysisResult = "Analisis AI tidak dapat dijalankan.";
        }
      }

      setLoadingMessage(UI_TEXT.SUBMITTING_REPORT);
      
      const reportId = Date.now().toString(36) + Math.random().toString(36).substring(2);

      const caption = `*Laporan Kecemasan Baru Diterima*\n*ID Laporan:* \`${reportId}\`\n\n*Jenis:* ${reportType.toUpperCase()}\n\n*Butiran Laporan:*\n${text}\n\n---\n\n*Analisis AI (Gemini/OpenAI):*\n${analysisResult}`;

      switch (reportType) {
        case 'text':
          await sendTextReport(caption);
          break;
        case 'audio':
          if (mediaBlob) await sendAudioReport(mediaBlob, caption);
          break;
        case 'video':
          if (mediaBlob) await sendVideoReport(mediaBlob, caption);
          break;
      }

      const newReport: Report = {
          id: reportId,
          type: reportType,
          content: reportType === 'text' ? text : `[Laporan ${reportType} - Media tidak disimpan dalam penyemak imbas]`,
          analysis: analysisResult,
          timestamp: new Date().toISOString(),
      };
      addReport(newReport);

      setSuccess(UI_TEXT.SUCCESS_MESSAGE);
    } catch (submissionError) {
      console.error("Telegram submission failed:", submissionError);
      setError(UI_TEXT.ERROR_GENERIC);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const renderContent = () => {
    if (success) {
        return (
            <div className="text-center p-8 flex flex-col items-center">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">Laporan Dihantar!</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{success}</p>
                <button
                    onClick={resetState}
                    className="mt-6 px-6 py-2 bg-[#6B8A9E] text-white font-semibold rounded-lg shadow-md hover:bg-[#5a7588] transition-colors duration-200"
                >
                    {UI_TEXT.RESET_FORM}
                </button>
            </div>
        );
    }
    
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{UI_TEXT.REPORT_TYPE_LABEL}</label>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
            <button type="button" onClick={() => { setReportType('text'); setMediaBlob(null); }} className={`flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'text' ? 'bg-white dark:bg-gray-800 shadow text-[#6B8A9E] dark:text-[#a6c8de]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
              <TextIcon className="w-5 h-5" /> <span>{UI_TEXT.TEXT}</span>
            </button>
            <button type="button" onClick={() => { setReportType('audio'); setMediaBlob(null); }} className={`flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'audio' ? 'bg-white dark:bg-gray-800 shadow text-[#6B8A9E] dark:text-[#a6c8de]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
              <MicIcon className="w-5 h-5" /> <span>{UI_TEXT.AUDIO}</span>
            </button>
            <button type="button" onClick={() => { setReportType('video'); setMediaBlob(null); }} className={`flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${reportType === 'video' ? 'bg-white dark:bg-gray-800 shadow text-[#6B8A9E] dark:text-[#a6c8de]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
              <VideoIcon className="w-5 h-5" /> <span>{UI_TEXT.VIDEO}</span>
            </button>
          </div>
        </div>

        <div className="min-h-[200px]">
          {reportType === 'text' && (
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={TEXT_CHAR_LIMIT}
                placeholder={UI_TEXT.TEXT_PLACEHOLDER}
                className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#D78F70] focus:border-[#D78F70] transition"
                rows={6}
              />
              <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                {text.length}/{TEXT_CHAR_LIMIT} {UI_TEXT.CHAR_LIMIT_LABEL}
              </div>
            </div>
          )}
          {reportType === 'audio' && <AudioRecorder onRecordingComplete={setMediaBlob} />}
          {reportType === 'video' && <VideoRecorder onRecordingComplete={setMediaBlob} />}
        </div>
        
        {error && (
            <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg">
                <XCircleIcon className="w-5 h-5" />
                <p className="text-sm">{error}</p>
            </div>
        )}

        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={isLoading || !isFormDirty}
            className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-[#D78F70] to-[#E8A87C] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{loadingMessage || UI_TEXT.SUBMITTING_REPORT}</span>
              </>
            ) : (
                <>
                    <SendIcon className="w-5 h-5" />
                    <span>{UI_TEXT.SUBMIT_REPORT}</span>
                </>
            )}
          </button>
           {isFormDirty && !isLoading && (
            <button
                type="button"
                onClick={resetState}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
            >
                <RefreshIcon className="w-5 h-5" />
                <span>{UI_TEXT.CANCEL}</span>
            </button>
           )}
           {text.length > 0 && 
            <p className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                <SparkIcon className="w-4 h-4 mr-1 text-yellow-500" />
                Laporan teks akan dianalisis menggunakan AI untuk tindakan segera.
            </p>
          }
        </div>
      </form>
    );
  };
  
    if (settings.isFormDisabled) {
      return (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700 text-center">
              <LockClosedIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Borang Laporan Dikunci</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Penghantaran laporan telah dilumpuhkan buat sementara waktu oleh pentadbir.</p>
          </div>
      );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
      {renderContent()}
    </div>
  );
};

export default ReportForm;