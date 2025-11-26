import { WebsiteSettings } from '../types';
import { db } from './firebaseConfig';
// FIX: Updated firebase/firestore import to use the scoped package @firebase/firestore
import { doc, getDoc, setDoc } from '@firebase/firestore';

const SETTINGS_COLLECTION = 'config';
const SETTINGS_DOC_ID = 'global-settings';
const SETTINGS_KEY = 'safe_app_settings'; // localStorage cache key

export const defaultSettings: WebsiteSettings = {
    isFormDisabled: false,
    isMaintenanceLockEnabled: false,
    maintenancePin: '',
    fallbackOpenAIKey: '',
    fallbackCerebrasKey: '',
    fallbackRequestyKey: '',
    adminDownloadPin: '21412141',
    adminActionPin: '090713040013',
    masterResetPin: '01130651814',
};

/**
 * Fetches global settings from Firestore, using localStorage as a robust fallback cache.
 * @returns A promise that resolves to the latest website settings.
 */
export const fetchGlobalSettings = async (): Promise<WebsiteSettings> => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const settings = { ...defaultSettings, ...docSnap.data() as WebsiteSettings };
            // Update cache with fresh data from the server
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            return settings;
        } else {
            // No settings in Firestore yet, use defaults and cache them
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
            return defaultSettings;
        }
    } catch (error) {
        console.error("Failed to fetch remote settings from Firestore, falling back to local cache.", error);
        // On error, try to use the last known settings from the cache
        const cachedSettings = localStorage.getItem(SETTINGS_KEY);
        return cachedSettings ? JSON.parse(cachedSettings) : defaultSettings;
    }
};

/**
 * Updates the global website settings in Firestore and refreshes the local cache.
 * @param settings The new settings object to save.
 */
export const updateGlobalSettings = async (settings: WebsiteSettings): Promise<void> => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(docRef, settings);
        // Update local cache on successful save to maintain consistency
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Error updating settings in Firestore:", error);
        throw new Error('Failed to update settings on the backend.');
    }
};