import { Report, WebsiteSettings } from '../types';

const REPORTS_KEY = 'safe_app_reports';
const SETTINGS_KEY = 'safe_app_settings';
const UNLOCK_TIMESTAMP_KEY = 'safe_app_unlock_timestamp';
const UNLOCK_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// Default settings
const defaultSettings: WebsiteSettings = {
    isFormDisabled: false,
    isMaintenanceLockEnabled: false,
    maintenancePin: '',
};

// Reports Management
export const getReports = (): Report[] => {
    try {
        const reportsJson = localStorage.getItem(REPORTS_KEY);
        return reportsJson ? JSON.parse(reportsJson) : [];
    } catch (error) {
        console.error("Failed to parse reports from localStorage", error);
        return [];
    }
};

export const addReport = (report: Report): void => {
    const reports = getReports();
    // Keep only the latest 50 reports to avoid filling up localStorage
    const updatedReports = [report, ...reports].slice(0, 50);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updatedReports));
};

export const deleteReport = (reportId: string): void => {
    const reports = getReports();
    const updatedReports = reports.filter(r => r.id !== reportId);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updatedReports));
};


// Settings Management
export const getSettings = (): WebsiteSettings => {
    try {
        const settingsJson = localStorage.getItem(SETTINGS_KEY);
        return settingsJson ? { ...defaultSettings, ...JSON.parse(settingsJson) } : defaultSettings;
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        return defaultSettings;
    }
};

export const saveSettings = (settings: WebsiteSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
    // Check if the timestamp is recent (within the last 8 hours)
    return (Date.now() - timestamp) < UNLOCK_DURATION_MS;
};

export const clearUnlockTimestamp = (): void => {
    localStorage.removeItem(UNLOCK_TIMESTAMP_KEY);
};