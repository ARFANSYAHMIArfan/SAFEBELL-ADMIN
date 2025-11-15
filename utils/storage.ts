import { Report, WebsiteSettings } from '../types';

const REPORTS_KEY = 'safe_app_reports';
const SETTINGS_KEY = 'safe_app_settings';

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
