
const API_KEY = process.env.OPENAI_API_KEY;

export const analyzeReportWithOpenAI = async (reportText: string): Promise<string> => {
    if (!API_KEY) {
        console.warn("OpenAI API key not found.");
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
    4.  **Cadangan Tindakan Segera:** Senaraikan 2-3 langkah paling penting yang perlu diambil oleh pihak berkuasa atau responden pertama dengan segera.
    
    Pastikan jawapan anda dalam Bahasa Melayu, jelas, objektif, dan profesional.
  `;

    try {
        console.log("Attempting analysis with OpenAI...");
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
            console.error("OpenAI API Error:", errorData);
            throw new Error(`OpenAI API request failed: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log("OpenAI analysis successful.");
        return data.choices[0]?.message?.content?.trim() || "Tidak dapat mendapatkan analisis daripada OpenAI.";

    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw new Error("Failed to get analysis from OpenAI API.");
    }
};
