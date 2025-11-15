export type ReportType = 'text' | 'audio' | 'video';

export type UserRole = 'none' | 'admin' | 'teacher';

export interface Report {
    id: string;
    type: ReportType;
    timestamp: string;
    // For text reports, content is the text. For media, it's a placeholder.
    content: string; 
    analysis: string;
}

export interface WebsiteSettings {
    isFormDisabled: boolean;
    isMaintenanceLockEnabled: boolean;
    maintenancePin: string;
    fallbackOpenAIKey?: string;
}