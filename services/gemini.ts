
import { GoogleGenAI } from "@google/genai";
import { FundDataset, Language } from "../types";
import { calculateAllMetrics } from "../utils/financialMetrics";

export interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Build the fund context string (metrics + recent data) used as system grounding.
 */
function buildFundContext(dataset: FundDataset, lang: Language): string {
  const recentData = dataset.data.slice(-25);
  const dataSummary = recentData.map(d => {
    const fundValues = dataset.funds.map(f => `${f}: ${d[f]}`).join(', ');
    return `${d.date} | ${fundValues}`;
  }).join('\n');

  const benchmarkName = dataset.funds.length > 0 ? dataset.funds[0] : '';
  const metricsContext = dataset.funds.map(fund => {
    const metrics = calculateAllMetrics(
      dataset.data,
      fund,
      dataset.data[0]?.date,
      dataset.data[dataset.data.length - 1]?.date,
      benchmarkName
    );
    if (!metrics) return '';
    return `- **${fund}**: Return: ${(metrics.cumulativeReturn * 100).toFixed(2)}% | Volatility: ${(metrics.volatility * 100).toFixed(2)}% | Max Drawdown: ${(metrics.maxDrawdown * 100).toFixed(2)}% | Tracking Error: ${metrics.trackingError !== undefined ? (metrics.trackingError * 100).toFixed(2) + '%' : 'N/A'} | R-Squared: ${metrics.rSquared !== undefined ? metrics.rSquared.toFixed(4) : 'N/A'}`;
  }).join('\n');

  const langInstruction = lang === 'cn'
    ? "请用中文提供分析报告。"
    : "Please provide the analysis in English.";

  return `You are an expert "Wealth OS Analyst". You have access to the following mutual fund NAV performance history, tracking metrics, and volatility structures. Answer questions about this data concisely and accurately.

Funds available: ${dataset.funds.join(', ')}
Total timeframe records: ${dataset.data.length}

### Quantitative Metric Summary (Benchmark: ${benchmarkName})
${metricsContext}

### Recent Price History (Date | Fund Values)
${dataSummary}

${langInstruction}`;
}

/**
 * Original single-shot analysis (kept for backward compatibility).
 */
export const analyzeFundData = async (dataset: FundDataset, apiKey: string, lang: Language = 'en'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash';

  const systemContext = buildFundContext(dataset, lang);

  const prompt = `${systemContext}

Please provide a structured Markdown analysis covering:
1. **Performance Summary**: How has each fund trended in the recent period?
2. **Institutional Risk Metrics**: Briefly comment on Volatility, Drawdown, and Tracking Error / R-Squared (is there potential for closet indexing?).
3. **Risk Budget Alignment**: Based on the tracking error and overall profile, do the active funds justify their positions?
4. **Conclusion**: Brief recommendation on portfolio allocation.`;

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

/**
 * Multi-turn conversation: sends the full conversation history along with
 * the fund data context so the model can answer follow-up questions.
 */
export const chatWithFundData = async (
  dataset: FundDataset,
  apiKey: string,
  history: ConversationMessage[],
  userMessage: string,
  lang: Language = 'en',
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash';

  const systemContext = buildFundContext(dataset, lang);

  // Build the contents array for multi-turn
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // First turn: inject system context as the opening user message
  // so the model has all the data grounding
  contents.push({
    role: 'user',
    parts: [{ text: systemContext + '\n\nAcknowledge that you have this data and are ready to answer questions.' }],
  });
  contents.push({
    role: 'model',
    parts: [{ text: 'I have reviewed the fund data, metrics, and recent price history. I\'m ready to provide analysis and answer your questions.' }],
  });

  // Append conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role,
      parts: [{ text: msg.text }],
    });
  }

  // Append the new user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Chat service unavailable.");
  }
};
