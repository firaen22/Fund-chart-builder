
import { GoogleGenAI } from "@google/genai";
import { FundDataset, Language } from "../types";

export const analyzeFundData = async (dataset: FundDataset, apiKey: string, lang: Language = 'en'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash';

  const recentData = dataset.data.slice(-25);
  const dataSummary = recentData.map(d => {
    const fundValues = dataset.funds.map(f => `${f}: ${d[f]}`).join(', ');
    return `${d.date} | ${fundValues}`;
  }).join('\n');

  const langInstruction = lang === 'cn'
    ? "请用中文提供分析报告。"
    : "Please provide the analysis in English.";

  const prompt = `As a professional investment analyst, please analyze the following mutual fund NAV performance history (rebased to 100 for easy comparison).
  
Funds available: ${dataset.funds.join(', ')}
Total timeframe records: ${dataset.data.length}

Recent Price History (Date | Fund Values):
${dataSummary}

${langInstruction}

Please provide a structured Markdown analysis covering:
1. **Performance Summary**: How has each fund trended in the recent period?
2. **Relative Strength**: Which fund is leading and which is lagging?
3. **Volatility & Risk**: Identify any significant swings or risk signals.
4. **Conclusion**: Brief recommendation based on observed momentum.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return response.text || "Analysis generated but no text output was provided.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Analysis service unavailable.");
  }
};