import { TELEGRAM_CONFIG, OPENAI_CONFIG, UI_TEXT } from '../constants';
import { getReports } from './storage';

type Status = 'ok' | 'error' | 'warn' | 'info';

interface StatusItem {
  status: Status;
  message: string;
}

export interface SystemStatus {
  telegram: StatusItem;
  gemini: StatusItem;
  openai: StatusItem;
  storage: StatusItem;
  permissions: {
    camera: StatusItem;
    microphone: StatusItem;
    geolocation: StatusItem;
  };
}

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
 * Checks if the Gemini API key is configured.
 */
export const checkGeminiConfig = (): StatusItem => {
  if (process.env.API_KEY && process.env.API_KEY.length > 10) {
    return { status: 'ok', message: UI_TEXT.STATUS_OK };
  }
  return { status: 'warn', message: UI_TEXT.STATUS_UNCONFIGURED };
};

/**
 * Checks if the OpenAI API key is configured.
 */
export const checkOpenAIConfig = (): StatusItem => {
  if (OPENAI_CONFIG.API_KEY && OPENAI_CONFIG.API_KEY.startsWith('sk-')) {
    return { status: 'ok', message: UI_TEXT.STATUS_OK };
  }
  return { status: 'warn', message: UI_TEXT.STATUS_UNCONFIGURED };
};

/**
 * Gets the number of reports stored in localStorage.
 */
export const getLocalStorageUsage = (): StatusItem => {
  const reports = getReports();
  return { status: 'info', message: `${reports.length} Laporan` };
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
