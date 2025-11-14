
import { TELEGRAM_CONFIG } from '../constants';

const { API_KEY, CHAT_ID } = TELEGRAM_CONFIG;
const BASE_URL = `https://api.telegram.org/bot${API_KEY}`;

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API Error: ${errorData.description || response.statusText}`);
    }
    return response.json();
};

export const sendTextReport = async (text: string) => {
    const url = `${BASE_URL}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'Markdown',
        }),
    });
    return handleResponse(response);
};

export const sendAudioReport = async (audioBlob: Blob, caption: string) => {
    const url = `${BASE_URL}/sendAudio`;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('audio', audioBlob, 'laporan_audio.wav');
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    
    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
};

export const sendVideoReport = async (videoBlob: Blob, caption: string) => {
    const url = `${BASE_URL}/sendVideo`;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', videoBlob, 'laporan_video.webm');
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
};
