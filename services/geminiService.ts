import { analyzeReportWithOpenAI } from './openaiService';
import { analyzeReportWithRequesty } from './requestyService';
import { CEREBRAS_CONFIG } from '../constants';
import { WebsiteSettings } from '../types';
import { addLog } from './logService';

const HARDCODED_CEREBRAS_KEY = CEREBRAS_CONFIG.API_KEY;

export const analyzeReportWithAI = async (reportText: string, settings?: WebsiteSettings): Promise<string> => {
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
  
  const fallbackOpenAIKey = settings?.fallbackOpenAIKey;
  const cerebrasKey = settings?.fallbackCerebrasKey || HARDCODED_CEREBRAS_KEY;
  const requestyKey = settings?.fallbackRequestyKey;

  // --- Primary: Try Cerebras ---
  if (cerebrasKey) {
    try {
        const source = settings?.fallbackCerebrasKey ? 'Admin-Configured Key' : 'Hardcoded Key';
        addLog('info', `Attempting analysis with Cerebras using ${source}...`);
        
        const response = await fetch("https://api.cerebras.com/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cerebrasKey}`,
            },
            body: JSON.stringify({
                model: "btlm-3b-8k-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            addLog('error', 'Cerebras API Error', { status: response.status, body: errorData });
            throw new Error(`Cerebras API request failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const analysis = data.choices[0]?.message?.content?.trim() || "Tidak dapat mendapatkan analisis daripada Cerebras.";
        addLog('info', 'Cerebras analysis successful.');
        return analysis;
    } catch (cerebrasError) {
      addLog('warn', 'Cerebras API call failed, falling back to Requesty.', { error: (cerebrasError as Error).message });
      // Fall through to Requesty
    }
  } else {
    addLog('warn', 'Cerebras API key not found. Attempting to use Requesty as primary.');
  }

  // --- Secondary: Try Requesty ---
  try {
    return await analyzeReportWithRequesty(reportText, requestyKey);
  } catch (requestyError) {
    addLog('warn', 'Requesty API call failed, falling back to OpenAI.', { error: (requestyError as Error).message });
    // Fall through to OpenAI
  }
  
  // --- Final Fallback: Try OpenAI ---
  try {
    return await analyzeReportWithOpenAI(reportText, fallbackOpenAIKey);
  } catch (openaiError) {
    addLog('error', 'OpenAI fallback also failed.', { error: (openaiError as Error).message });
    throw new Error("Failed to get analysis from Cerebras, Requesty, and OpenAI backup.");
  }
};