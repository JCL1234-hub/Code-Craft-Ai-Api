const { GoogleGenerativeAI } = require('@google/generative-ai');
const { API_KEY, handleCorsAndLimit } = require('./_shared');

const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
    if (handleCorsAndLimit(req, res, 'code')) return;

    try {
        const { prompt } = req.body;
        if (!prompt || prompt.length > 2000) {
            return res.status(400).json({ success: false, error: "Valid prompt up to 2000 characters is required." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Strict system prompt to ensure JSON output
        const systemPrompt = `You are a Senior Programmer. Write code based on the prompt. Output ONLY a valid JSON object in this exact format, with NO markdown code blocks around it: {"language": "Programming Language Name", "code": "The full code string"}. Request: ${prompt}`;
        
        const result = await model.generateContent(systemPrompt);
        let text = result.response.text().trim();
        
        // Sanitize any markdown markdown leftovers
        if (text.startsWith("```json")) text = text.slice(7, -3);
        else if (text.startsWith("```")) text = text.slice(3, -3);
        
        const parsed = JSON.parse(text);

        res.status(200).json({
            success: true,
            language: parsed.language || "Unknown",
            code: parsed.code || ""
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Code Generation Failed", message: error.message });
    }
}
