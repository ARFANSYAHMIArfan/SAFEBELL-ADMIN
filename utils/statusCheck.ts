import { TELEGRAM_CONFIG, OPENAI_CONFIG, CEREBRAS_CONFIG, REQUESTY_CONFIG, UI_TEXT } from '../constants';
import { getReports } from './storage';
import { firebaseError } from '../services/firebaseConfig';
import { fetchGlobalSettings } from '../services/settingsService';

type Status = 'ok' | 'error' | 'warn' | 'info';

interface StatusItem {
  status: Status;
  message: string;
}

export interface SystemStatus {
  telegram: StatusItem;
  cerebras: StatusItem;
  requesty: StatusItem;
  openai: StatusItem;
  firebase: StatusItem;
  storage: StatusItem;
  permissions: {
    camera: StatusItem;
    microphone: StatusItem;
    geolocation: StatusItem;
  };
}

/**
 * Checks if the connection to Firebase was successful.
 */
export const checkFirebaseStatus = (): StatusItem => {
  if (firebaseError) {
    return { status: 'error', message: 'Connection Failed' };
  }
  return { status: 'ok', message: UI_TEXT.STATUS_CONNECTED };
};


/**
 * Checks if the Telegram API bot token is valid by calling the getMe endpoint.
 */
export const checkTelegramApi = async (): Promise<StatusItem> => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.API_KEY}/getMe`);
    const data = await response.json();
    if (data.ok) {
      return { status: 'ok', message: UI_TEXT.STATUS_OK };
    } else {
      return { status: 'error', message: data.description || UI_TEXT.STATUS_ERROR };
    }
  } catch (error) {
    return { status: 'error', message: 'Network request failed' };
  }
};

/**
 * Checks if the Cerebras API key is configured.
 */
export const checkCerebrasConfig = async (): Promise<StatusItem> => {
  const settings = await fetchGlobalSettings();
  const hasDynamicKey = settings.fallbackCerebrasKey && settings.fallbackCerebrasKey.startsWith('csk-');
  const hasHardcodedKey = CEREBRAS_CONFIG.API_KEY && CEREBRAS_CONFIG.API_KEY.startsWith('csk-');

  if (hasDynamicKey || hasHardcodedKey) {
    return { status: 'ok', message: UI_TEXT.STATUS_OK };
  }
  return { status: 'warn', message: UI_TEXT.STATUS_UNCONFIGURED };
};

/**
 * Checks if the Requesty API key is configured and validates connection.
 */
export const checkRequestyConfig = async (): Promise<StatusItem> => {
  const settings = await fetchGlobalSettings();
  // Prioritize dynamic key from settings, fallback to hardcoded
  const apiKey = settings.fallbackRequestyKey || REQUESTY_CONFIG.API_KEY;

  if (!apiKey || !apiKey.startsWith('rqsty-')) {
     return { status: 'warn', message: UI_TEXT.STATUS_UNCONFIGURED };
  }

  // Perform a real connection test
  try {
    const response = await fetch(`${REQUESTY_CONFIG.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "policy/kitabuddy-latest",
            messages: [{ role: "user", content: "Ping" }],
            max_tokens: 1
        }),
    });

    if (response.ok) {
        return { status: 'ok', message: UI_TEXT.STATUS_CONNECTED };
    } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Requesty Test Failed:", response.status, errorData);
        // Return error code to UI
        return { status: 'error', message: `Ralat ${response.status}` };
    }
  } catch (error) {
      console.error("Requesty Connection Error:", error);
      return { status: 'error', message: 'Gagal Disambung' };
  }
};

/**
 * Checks if the OpenAI API key is configured, either via constants or admin settings.
 */
export const checkOpenAIConfig = async (): Promise<StatusItem> => {
    const settings = await fetchGlobalSettings();
    const hasDynamicKey = settings.fallbackOpenAIKey && settings.fallbackOpenAIKey.startsWith('sk-');
    const hasHardcodedKey = OPENAI_CONFIG.API_KEY && OPENAI_CONFIG.API_KEY.startsWith('sk-');

    if (hasDynamicKey || hasHardcodedKey) {
      return { status: 'ok', message: UI_TEXT.STATUS_OK };
    }
    return { status: 'warn', message: UI_TEXT.STATUS_UNCONFIGURED };
};


/**
 * Gets the number of reports stored in the backend.
 */
export const getReportCount = async (): Promise<StatusItem> => {
  try {
    const reports = await getReports();
    return { status: 'info', message: `${reports.length} Laporan` };
  } catch (error) {
    return { status: 'error', message: 'Gagal mengambil kira' };
  }
};

/**
 * Checks the status of essential browser permissions.
 */
export const checkPermissions = async (): Promise<SystemStatus['permissions']> => {
  const results: SystemStatus['permissions'] = {
    camera: { status: 'warn', message: 'N/A' },
    microphone: { status: 'warn', message: 'N/A' },
    geolocation: { status: 'warn', message: 'N/A' },
  };

  if (!navigator.permissions) {
    return results;
  }

  const mapStateToStatus = (state: PermissionState): StatusItem => {
    switch (state) {
      case 'granted':
        return { status: 'ok', message: UI_TEXT.PERMISSION_GRANTED };
      case 'denied':
        return { status: 'error', message: UI_TEXT.PERMISSION_DENIED };
      case 'prompt':
        return { status: 'warn', message: UI_TEXT.PERMISSION_PROMPT };
      default:
        return { status: 'warn', message: state };
    }
  };

  try {
    const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
    results.camera = mapStateToStatus(cameraStatus.state);

    const microphoneStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    results.microphone = mapStateToStatus(microphoneStatus.state);

    const geolocationStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    results.geolocation = mapStateToStatus(geolocationStatus.state);
  } catch (error) {
    console.error("Could not query permissions:", error);
  }

  return results;
};