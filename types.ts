export type ReportType = 'text' | 'audio' | 'video';

export type UserRole = 'none' | 'admin' | 'teacher' | 'superadmin' | 'kiosk_enabled_device';

export interface Report {
    id: string;
    type: ReportType;
    timestamp: string;
    // For text reports, content is the text. For media, it's a placeholder.
    content: string; 
    analysis: string;
    mediaUrl?: string;
}

export interface WebsiteSettings {
    isFormDisabled: boolean;
    isMaintenanceLockEnabled: boolean;
    maintenancePin: string;
    fallbackOpenAIKey?: string;
    adminDownloadPin?: string;
    adminActionPin?: string;
    masterResetPin?: string;
}

export interface Session {
    id: string;
    role: UserRole;
    userId: string; // The login ID of the user
    docId: string; // The Firestore document ID for the user
    createdAt: string;
}

export interface UserCredentials {
    docId: string;
    id: string; // login id
    role: UserRole;
    password?: string;
    isLocked?: boolean;
}


export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    data?: any;
}