import { WebsiteSettings } from '../types';

const SETTINGS_KEY = 'safe_app_settings'; // We use localStorage as a local cache/source of truth.
const BACKEND_ENDPOINT = 'https://getform.io/f/bolzvgga';

// Default settings
const defaultSettings: WebsiteSettings = {
    isFormDisabled: false,
    isMaintenanceLockEnabled: false,
    maintenancePin: '',
};

/**
 * Fetches the global website settings.
 * NOTE: getform.io is used for data submission (POST) and does not provide a public
 * API to retrieve (GET) submitted data. Therefore, we will continue to rely on
 * localStorage as the primary source for retrieving settings within the app.
 * The `updateGlobalSettings` function will send the settings to the backend.
 * @returns A promise that resolves to the website settings from localStorage.
 */
export const fetchGlobalSettings = async (): Promise<WebsiteSettings> => {
    console.log("Fetching settings from local storage...");
    
    // Simulate network delay for consistency
    await new Promise(resolve => setTimeout(resolve, 300)); 
    try {
        const settingsJson = localStorage.getItem(SETTINGS_KEY);
        return settingsJson ? { ...defaultSettings, ...JSON.parse(settingsJson) } : defaultSettings;
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        return defaultSettings;
    }
};

/**
 * Updates the global website settings by saving to a backend and caching locally.
 * This function now sends the settings data to the getform.io endpoint.
 * @param settings The new settings object to save.
 * @returns A promise that resolves when the settings are saved.
 */
export const updateGlobalSettings = async (settings: WebsiteSettings): Promise<void> => {
    console.log("Updating global settings...", settings);

    // First, save settings locally so the app can use them immediately.
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Then, send the settings to the backend endpoint.
    try {
        const response = await fetch(BACKEND_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });

        if (!response.ok) {
          // Even if the backend fails, the settings are saved locally.
          // We can add more robust error handling here, like a retry mechanism.
          console.error('Failed to update settings on the backend.', await response.text());
          throw new Error('Failed to update settings on the backend.');
        }

        console.log("Settings successfully sent to the backend.");
    } catch (error) {
        console.error("Error sending settings to the backend:", error);
        // Re-throw the error so the calling component can handle it (e.g., show a message)
        throw error;
    }
};
