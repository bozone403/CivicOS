import pino from "pino";
const logger = pino();
import { callOllamaMistral } from './utils/aiService.js';
export async function summarizeBill(billText) {
    try {
        const prompt = `You are an expert legislative analyst. Summarize this bill in clear, plain language that ordinary citizens can understand. Focus on key provisions, who is affected, and practical implications. Keep the summary concise but comprehensive.

Bill text:
${billText}`;
        const responseText = await callOllamaMistral(prompt);
        return responseText;
    }
    catch (error) {
        logger.error({ msg: 'Error generating bill summary', error });
        throw new Error("Failed to generate AI summary");
    }
}
export async function analyzePoliticianStatement(statementText, politicianName, party) {
    try {
        const prompt = `You are an expert political analyst. Analyze these statements from ${politicianName} (${party}) and provide insights into their political consistency, key positions, and any notable patterns or contradictions.

Statements to analyze:
${statementText}

Provide a comprehensive analysis covering:
1. Key political positions and themes
2. Consistency across statements
3. Any contradictions or evolving positions
4. Communication style and rhetoric
5. Alignment with party positions

Be factual and unbiased in your analysis.`;
        const responseText = await callOllamaMistral(prompt);
        return responseText;
    }
    catch (error) {
        logger.error({ msg: 'Error analyzing politician statement', error });
        throw new Error("Failed to generate politician analysis");
    }
}
export async function generateBillKeyPoints(billText) {
    try {
        const prompt = `Extract 3-5 key bullet points from this legislation. Each point should be concise and highlight important provisions. Respond in JSON format with an array of strings under the key "points".

Bill text:
${billText}`;
        const responseText = await callOllamaMistral(prompt);
        const content = JSON.parse(responseText);
        return content.points || [];
    }
    catch (error) {
        logger.error({ msg: 'Error generating key points', error });
        return [];
    }
}
