import { GoogleGenAI } from "@google/genai";
import { analyzeReportWithOpenAI } from './openaiService';
import { OPENAI_CONFIG } from '../constants';

// Ensure the API keys are available
const GEMINI_API_KEY = process.env.API_KEY;
const OPENAI_API_KEY = OPENAI_CONFIG.API_KEY;

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
    
    Pastikan jawapan anda dalam Bahasa Melayu, jelas, objektif, dan profesional.
  `;
  
  // --- Primary: Try Gemini ---
  if (ai) { // `ai` is only initialized if GEMINI_API_KEY is present
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
      console.warn("Gemini API failed. Falling back to OpenAI.");
      // Fall through to the OpenAI logic below
    }
  } else {
    console.log("Gemini API key not found. Attempting to use OpenAI as primary.");
  }
  
  // --- Fallback: Try OpenAI ---
  if (OPENAI_API_KEY) {
    try {
      // The analyzeReportWithOpenAI function already logs its own attempts
      return await analyzeReportWithOpenAI(reportText);
    } catch (openaiError) {
      console.error("OpenAI fallback also failed:", openaiError);
      // If OpenAI also fails, throw an error that signals complete analysis failure
      throw new Error("Failed to get analysis from Gemini and OpenAI backup.");
    }
  }
  
  // --- Final case: No AI service is configured or available ---
  console.warn("No AI analysis service could be configured or successfully used.");
  // Return a clear message if no API keys are available at all
  return "Analisis AI tidak tersedia kerana kunci API tidak dikonfigurasikan.";
};