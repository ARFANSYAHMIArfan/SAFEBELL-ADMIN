import { Report, WebsiteSettings } from '../types';
import { fetchReports, addSingleReport, deleteSingleReport, batchSaveReports } from '../services/reportService';

const UNLOCK_TIMESTAMP_KEY = 'safe_app_unlock_timestamp';
const DARK_MODE_KEY = 'safe_app_dark_mode';
const SETTINGS_KEY = 'safe_app_settings';
const UNLOCK_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// Default settings
const defaultSettings: WebsiteSettings = {
    isFormDisabled: false,
    isMaintenanceLockEnabled: false,
    maintenancePin: '',
};

// Reports Management (now interfaces with the Firebase backend service)
export const getReports = async (): Promise<Report[]> => {
    return await fetchReports();
};

export const addReport = async (report: Report): Promise<void> => {
    await addSingleReport(report);
};

export const deleteReport = async (reportId: string): Promise<void> => {
    await deleteSingleReport(reportId);
};

export const mergeAndSaveReports = async (newReports: Report[]): Promise<void> => {
    const validReports = newReports.filter(report => {
        if (report.id && report.timestamp && report.type) {
            return true;
        }
        console.warn("Skipping invalid report object from JSON:", report);
        return false;
    });
    
    // Batch save will update existing reports (by ID) and add new ones.
    await batchSaveReports(validReports);
};


// Settings Management (local cache for maintenance lock)
export const getSettings = (): WebsiteSettings => {
    try {
        const settingsJson = localStorage.getItem(SETTINGS_KEY);
        return settingsJson ? { ...defaultSettings, ...JSON.parse(settingsJson) } : defaultSettings;
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        return defaultSettings;
    }
};

// Unlock Status Management
export const setUnlockTimestamp = (): void => {
    localStorage.setItem(UNLOCK_TIMESTAMP_KEY, Date.now().toString());
};

export const isUnlockValid = (): boolean => {
    const timestampStr = localStorage.getItem(UNLOCK_TIMESTAMP_KEY);
    if (!timestampStr) {
        return false;
    }
    const timestamp = parseInt(timestampStr, 10);
    return (Date.now() - timestamp) < UNLOCK_DURATION_MS;
};

export const clearUnlockTimestamp = (): void => {
    localStorage.removeItem(UNLOCK_TIMESTAMP_KEY);
};

// Dark Mode Management
export const getDarkModePreference = (): boolean => {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
        return saved === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const saveDarkModePreference = (isDarkMode: boolean): void => {
    localStorage.setItem(DARK_MODE_KEY, isDarkMode.toString());
};