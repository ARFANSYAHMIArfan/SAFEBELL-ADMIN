
import React, { useState, useEffect } from 'react';
import { logs, clearLogs } from '../services/logService';
import { UI_TEXT } from '../constants';
import { RefreshIcon, DownloadIcon } from './icons';
import { LogEntry } from '../types';

declare const saveAs: any;

const DebugPanel: React.FC = () => {
    const [logEntries, setLogEntries] = useState<LogEntry[]>([...logs]);

    const refreshLogs = () => {
        setLogEntries([...logs]);
    };

    const handleClearLogs = () => {
        clearLogs();
        refreshLogs();
    };

    const handleExportLogs = () => {
        const jsonLogs = JSON.stringify(logs, null, 2);
        const blob = new Blob([jsonLogs], { type: "application/json" });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        saveAs(blob, `safe_app_logs_${timestamp}.json`);
    };

    useEffect(() => {
        // Refresh logs when the component mounts or the tab becomes active
        const interval = setInterval(refreshLogs, 2000); // Auto-refresh every 2 seconds
        return () => clearInterval(interval);
    }, []);

    const getLogLevelColor = (level: LogEntry['level']) => {
        switch (level) {
            case 'info':
                return 'text-blue-500 dark:text-blue-400';
            case 'warn':
                return 'text-yellow-500 dark:text-yellow-400';
            case 'error':
                return 'text-red-500 dark:text-red-400';
            default:
                return 'text-gray-500 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{UI_TEXT.DEBUG_PANEL_TITLE}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{UI_TEXT.DEBUG_PANEL_DESC}</p>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={refreshLogs}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                    <RefreshIcon className="w-4 h-4" />
                    <span>{UI_TEXT.REFRESH_LOGS}</span>
                </button>
                <button
                    onClick={handleExportLogs}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                    <DownloadIcon className="w-4 h-4" />
                    <span>{UI_TEXT.EXPORT_LOGS}</span>
                </button>
                <button
                    onClick={handleClearLogs}
                    className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors duration-200 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                >
                    {UI_TEXT.CLEAR_LOGS}
                </button>
            </div>
            <div className="bg-gray-900 text-white font-mono text-xs rounded-lg p-4 h-96 overflow-y-auto border border-gray-700">
                {logEntries.length === 0 ? (
                    <p className="text-gray-500">Tiada log untuk dipaparkan. Lakukan beberapa tindakan untuk menjana log.</p>
                ) : (
                    logEntries.map((log, index) => (
                        <div key={index} className="border-b border-gray-800 py-2 last:border-b-0">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`font-bold ${getLogLevelColor(log.level)}`}>[{log.level.toUpperCase()}]</span>
                                <p className="flex-1 text-gray-300">{log.message}</p>
                            </div>
                            {log.data && (
                                <pre className="bg-gray-800 text-gray-400 p-2 rounded-md mt-1 text-xs whitespace-pre-wrap">
                                    {JSON.stringify(log.data, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DebugPanel;