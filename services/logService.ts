import { LogEntry } from '../types';

const MAX_LOGS = 100;
export const logs: LogEntry[] = [];

/**
 * Adds a new log entry to the in-memory log store.
 * @param level The severity level of the log ('info', 'warn', 'error').
 * @param message The log message.
 * @param data Optional additional data to include with the log.
 */
export const addLog = (
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: any
) => {
    const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep copy to avoid mutation
    };
    
    // Add to the beginning of the array
    logs.unshift(newLog);

    // Trim the array if it exceeds the max size
    if (logs.length > MAX_LOGS) {
        logs.pop();
    }
};

/**
 * Clears all log entries from the in-memory store.
 */
export const clearLogs = () => {
    logs.length = 0;
};