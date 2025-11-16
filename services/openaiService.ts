import { OPENAI_CONFIG } from '../constants';
import { addLog } from './logService';

const HARDCODED_API_KEY = OPENAI_CONFIG.API_KEY;

export const analyzeReportWithOpenAI = async (reportText: string, dynamicApiKey?: string): Promise<string> => {
    const API_KEY = dynamicApiKey || HARDCODED_API_KEY;

    if (!API_KEY) {
        addLog('error', 'OpenAI analysis skipped: No API key available.');
        throw new Error("OpenAI API key not configured.");
    }

    const prompt = `
   Anda adalah seorang penganalisis keselamatan dan responden kecemasan yang cekap dan terlatih.
    Analisis laporan kecemasan berikut yang diterima.
    
    Laporan: "${reportText}"
    
    Sila berikan analisis terperinci dalam format berikut:
    1.  **Ringkasan Insiden:** Rumuskan kejadian utama dalam satu atau dua ayat.
    2.  **Tahap Keseriusan:** Nilaikan tahap keseriusan insiden (Rendah, Sederhana, Serius, Kritikal) dan berikan justifikasi ringkas.
    3.  **Potensi Risiko/Bahaya:** Kenal pasti potensi risiko atau bahaya yang terlibat (cth: kecederaan fizikal, kerosakan harta benda, gangguan emosi, keselamatan umum).
    
    Pastikan jawapan anda dalam Bahasa Melayu, jelas, objektif, dan profesional.
  `;

    try {
        const source = dynamicApiKey ? 'Admin-Configured Key' : 'Hardcoded Key';
        addLog('info', `Attempting analysis with OpenAI using ${source}.`);
        
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            addLog('error', 'OpenAI API Error', { status: response.status, body: errorData });
            throw new Error(`OpenAI API request failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const analysis = data.choices[0]?.message?.content?.trim() || "Tidak dapat mendapatkan analisis daripada OpenAI.";
        addLog('info', 'OpenAI analysis successful.');
        return analysis;

    } catch (error) {
        // The error is already logged by the caller (geminiService), so we just re-throw.
        throw error;
    }
};