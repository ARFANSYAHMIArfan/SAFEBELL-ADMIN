
import { GoogleGenAI } from "@google/genai";
import { analyzeReportWithOpenAI } from './openaiService';

// Ensure the API keys are available in the environment variables
const GEMINI_API_KEY = process.env.API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("Gemini API key not found. Will attempt to use OpenAI as a backup.");
}
if (!OPENAI_API_KEY) {
  console.warn("OpenAI API key not found. Fallback will not be available.");
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export const analyzeReportWithGemini = async (reportText: string): Promise<string> => {
  const prompt = `
    Anda adalah seorang penganalisis keselamatan dan responden kecemasan yang cekap dan terlatih.
    Analisis laporan kecemasan berikut yang diterima.
    
    Laporan: "${reportText}"
    
    Sila berikan analisis terperinci dalam format berikut:
    1.  **Ringkasan Insiden:** Rumuskan kejadian utama dalam satu atau dua ayat.
    2.  **Tahap Keseriusan:** Nilaikan tahap keseriusan insiden (Rendah, Sederhana, Serius, Kritikal) dan berikan justifikasi ringkas.
    3.  **Potensi Risiko/Bahaya:** Kenal pasti potensi risiko atau bahaya yang terlibat (cth: kecederaan fizikal, kerosakan harta benda, gangguan emosi, keselamatan umum).
    4.  **Cadangan Tindakan Segera:** Senaraikan 2-3 langkah paling penting yang perlu diambil oleh pihak berkuasa atau responden pertama dengan segera.
    
    Pastikan jawapan anda dalam Bahasa Melayu, jelas, objektif, dan profesional.
  `;
  
  // Primary: Try Gemini if available
  if (ai) {
    try {
      console.log("Attempting analysis with Gemini...");
      const model = "gemini-2.5-pro";

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          temperature: 0.5,
        },
      });
      console.log("Gemini analysis successful.");
      return response.text;
    } catch (geminiError) {
      console.error("Error calling Gemini API:", geminiError);
      // Fallback to OpenAI if Gemini fails and OpenAI key exists
      if (OPENAI_API_KEY) {
        console.warn("Gemini API failed. Falling back to OpenAI.");
        try {
          return await analyzeReportWithOpenAI(reportText);
        } catch (openaiError) {
          console.error("OpenAI fallback also failed:", openaiError);
          throw new Error("Failed to get analysis from Gemini and OpenAI backup.");
        }
      } else {
        // No fallback available
        throw new Error("Failed to get analysis from Gemini API and no OpenAI fallback is configured.");
      }
    }
  } 
  // Secondary: Use OpenAI if Gemini key was not provided in the first place
  else if (OPENAI_API_KEY) {
    console.log("Gemini API key not found. Using OpenAI as primary.");
    try {
      return await analyzeReportWithOpenAI(reportText);
    } catch (openaiError) {
      console.error("OpenAI API call failed:", openaiError);
      throw new Error("Failed to get analysis from OpenAI API.");
    }
  } 
  // No AI service configured
  else {
    return "Analisis AI tidak tersedia kerana kunci API tidak dikonfigurasikan.";
  }
};
