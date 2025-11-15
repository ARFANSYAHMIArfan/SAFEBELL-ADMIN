import { TELEGRAM_CONFIG, OPENAI_CONFIG, CEREBRAS_CONFIG, UI_TEXT } from '../constants';
import { getReports } from './storage';
import { fetchGlobalSettings } from '../services/settingsService';

type Status = 'ok' | 'error' | 'warn' | 'info';

interface StatusItem {
  status: Status;
  message: string;
}

export interface SystemStatus {
  telegram: StatusItem;
  cerebras: StatusItem;
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
 * Checks if the Cerebras API key is configured.
 */
export const checkCerebrasConfig = (): StatusItem => {
  if (CEREBRAS_CONFIG.API_KEY && CEREBRAS_CONFIG.API_KEY.startsWith('csk-')) {
    return { status: 'ok', message: UI_TEXT.STATUS_OK };
  }
  return { status: 'warn', message: UI_TEXT.STATUS_UNCONFIGURED };
};

/**
 * Checks if the OpenAI API key is configured either in constants or dynamic settings.
 */
export const checkOpenAIConfig = async (): Promise<StatusItem> => {
  try {
    const settings = await fetchGlobalSettings();
    const keyFromSettings = settings.fallbackOpenAIKey;
    const keyFromConstants = OPENAI_CONFIG.API_KEY || OPENAI_CONFIG.SERVICE_ACCOUNT_API;

    if ((keyFromSettings && keyFromSettings.startsWith('sk-')) || (keyFromConstants && keyFromConstants.startsWith('sk-'))) {
      return { status: 'ok', message: UI_TEXT.STATUS_OK };
    }
    return { status: 'warn', message: UI_TEXT.STATUS_UNCONFIGURED };
  } catch (error) {
    console.error("Failed to check OpenAI config due to settings fetch error:", error);
    // If settings fail to load, just check constants as a fallback check
    const keyFromConstants = OPENAI_CONFIG.API_KEY || OPENAI_CONFIG.SERVICE_ACCOUNT_API;
    if (keyFromConstants && keyFromConstants.startsWith('sk-')) {
       return { status: 'ok', message: `${UI_TEXT.STATUS_OK} (Default)` };
    }
    return { status: 'error', message: 'Failed to Load Settings' };
  }
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