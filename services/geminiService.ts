import { analyzeReportWithOpenAI } from './openaiService';
import { CEREBRAS_CONFIG, OPENAI_CONFIG } from '../constants';

// Ensure the API keys are available
const CEREBRAS_API_KEY = CEREBRAS_CONFIG.API_KEY;
const OPENAI_API_KEY = OPENAI_CONFIG.API_KEY || OPENAI_CONFIG.SERVICE_ACCOUNT_API;

if (!CEREBRAS_API_KEY) {
  console.warn("Cerebras API key not found. Will attempt to use OpenAI as a backup.");
}
if (!OPENAI_API_KEY) {
  console.warn("OpenAI API key not found. Fallback will not be available.");
}

export const analyzeReportWithAI = async (reportText: string): Promise<string> => {
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
  
  // --- Primary: Try Cerebras ---
  if (CEREBRAS_API_KEY) {
    try {
        console.log("Attempting analysis with Cerebras...");
        const response = await fetch("https://api.cerebras.com/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-instruct-v0.1", // Using a more standard, powerful model
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Cerebras API Error:", errorData);
            throw new Error(`Cerebras API request failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log("Cerebras analysis successful.");
        return data.choices[0]?.message?.content?.trim() || "Tidak dapat mendapatkan analisis daripada Cerebras.";
    } catch (cerebrasError) {
      console.error("Error calling Cerebras API:", cerebrasError);
      console.warn("Cerebras API failed. Falling back to OpenAI.");
      // Fall through to the OpenAI logic below
    }
  } else {
    console.log("Cerebras API key not found. Attempting to use OpenAI as primary.");
  }
  
  // --- Fallback: Try OpenAI ---
  if (OPENAI_API_KEY) {
    try {
      // The analyzeReportWithOpenAI function already logs its own attempts
      return await analyzeReportWithOpenAI(reportText);
    } catch (openaiError) {
      console.error("OpenAI fallback also failed:", openaiError);
      // If OpenAI also fails, throw an error that signals complete analysis failure
      throw new Error("Failed to get analysis from Cerebras and OpenAI backup.");
    }
  }
  
  // --- Final case: No AI service is configured or available ---
  console.warn("No AI analysis service could be configured or successfully used.");
  // Return a clear message if no API keys are available at all
  return "Analisis AI tidak tersedia kerana kunci API tidak dikonfigurasikan.";
};