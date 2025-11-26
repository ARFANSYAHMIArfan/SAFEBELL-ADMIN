import { REQUESTY_CONFIG } from '../constants';
import { addLog } from './logService';

const { API_KEY, BASE_URL } = REQUESTY_CONFIG;

export const analyzeReportWithRequesty = async (reportText: string): Promise<string> => {
    if (!API_KEY) {
        addLog('warn', 'Requesty analysis skipped: No API key available.');
        throw new Error("Requesty API key not configured.");
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
        addLog('info', 'Attempting analysis with Requesty...');
        
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o", // Assuming Requesty router maps this correctly or supports it
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            addLog('error', 'Requesty API Error', { status: response.status, body: errorData });
            throw new Error(`Requesty API request failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const analysis = data.choices[0]?.message?.content?.trim() || "Tidak dapat mendapatkan analisis daripada Requesty.";
        addLog('info', 'Requesty analysis successful.');
        return analysis;

    } catch (error) {
        addLog('warn', 'Requesty API call failed.', { error: (error as Error).message });
        throw error;
    }
};
