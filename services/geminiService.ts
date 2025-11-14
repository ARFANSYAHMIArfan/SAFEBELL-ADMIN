import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("Gemini API key not found. Analysis will be skipped.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const analyzeReportWithGemini = async (reportText: string): Promise<string> => {
  if (!API_KEY) {
    return "Analisis AI tidak tersedia kerana kunci API tidak dikonfigurasikan.";
  }

  const model = "gemini-2.5-pro";
  
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

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        // Use max thinking budget for complex analysis as required
        thinkingConfig: { thinkingBudget: 32768 },
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get analysis from Gemini API.");
  }
};