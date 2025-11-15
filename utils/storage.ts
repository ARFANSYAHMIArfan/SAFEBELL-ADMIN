import { Report, WebsiteSettings } from '../types';
import { fetchReports, saveReports } from '../services/reportService';

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

// Reports Management (now interfaces with the backend service)
export const getReports = async (): Promise<Report[]> => {
    return await fetchReports();
};

export const addReport = async (report: Report): Promise<void> => {
    const reports = await fetchReports();
    // Prepend the new report to maintain reverse chronological order
    const updatedReports = [report, ...reports];
    await saveReports(updatedReports);
};

export const deleteReport = async (reportId: string): Promise<void> => {
    const reports = await fetchReports();
    const updatedReports = reports.filter(r => r.id !== reportId);
    await saveReports(updatedReports);
};

export const mergeAndSaveReports = async (newReports: Report[]): Promise<void> => {
    const existingReports = await fetchReports();
    const reportsMap = new Map<string, Report>();

    // Add existing reports to the map
    for (const report of existingReports) {
        reportsMap.set(report.id, report);
    }

    // Add/update with new reports
    for (const report of newReports) {
        // Basic validation of the report object
        if (report.id && report.timestamp && report.type) { // content can be null/undefined for media
             reportsMap.set(report.id, report);
        } else {
            console.warn("Skipping invalid report object from JSON:", report);
        }
    }
    
    let mergedReports = Array.from(reportsMap.values());

    // Re-sort all reports by timestamp descending to maintain order
    mergedReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    await saveReports(mergedReports);
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