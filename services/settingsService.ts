import { WebsiteSettings } from '../types';

const SETTINGS_KEY = 'safe_app_settings'; // localStorage cache key
// Switched to a key-value store that supports GET requests to enable global settings.
const SETTINGS_ENDPOINT = 'https://kvdb.io/fVbT7uWp4Zq9R2kYjJ8s3N/app-settings';

// Default settings
const defaultSettings: WebsiteSettings = {
    isFormDisabled: false,
    isMaintenanceLockEnabled: false,
    maintenancePin: '',
};

/**
 * Fetches global settings from a remote source, using localStorage as a fallback/cache.
 * This ensures settings are synchronized across different browsers/users.
 * @returns A promise that resolves to the latest website settings.
 */
export const fetchGlobalSettings = async (): Promise<WebsiteSettings> => {
    console.log("Fetching latest settings from remote source...");
    try {
        const response = await fetch(SETTINGS_ENDPOINT);
        
        if (!response.ok) {
            // A 404 error means no settings have been saved yet, which is not a failure.
            if (response.status === 404) {
                console.log("No remote settings found, using defaults.");
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
                return defaultSettings;
            }
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        
        const settings = await response.json();
        
        // Save the fetched settings to localStorage to act as a cache.
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        console.log("Successfully fetched and cached remote settings.");
        return { ...defaultSettings, ...settings };

    } catch (error) {
        console.error("Failed to fetch remote settings, falling back to local cache.", error);
        // If the network request fails, use the locally cached version as a fallback.
        try {
            const settingsJson = localStorage.getItem(SETTINGS_KEY);
            return settingsJson ? { ...defaultSettings, ...JSON.parse(settingsJson) } : defaultSettings;
        } catch (parseError) {
            console.error("Failed to parse cached settings.", parseError);
            return defaultSettings;
        }
    }
};

/**
 * Updates the global website settings by saving to a remote source and caching locally.
 * @param settings The new settings object to save.
 * @returns A promise that resolves when the settings are saved.
 */
export const updateGlobalSettings = async (settings: WebsiteSettings): Promise<void> => {
    console.log("Updating global settings remotely...", settings);

    // Update the remote source first to ensure it's the single source of truth.
    try {
        const response = await fetch(SETTINGS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });

        if (!response.ok) {
          console.error('Failed to update settings remotely.', await response.text());
          throw new Error('Failed to update settings on the backend.');
        }

        console.log("Settings successfully sent to the remote source.");
        
        // On successful remote update, also update the local cache for consistency.
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    } catch (error) {
        console.error("Error sending settings to the remote source:", error);
        // Re-throw the error so the calling component can notify the user.
        throw error;
    }
};
