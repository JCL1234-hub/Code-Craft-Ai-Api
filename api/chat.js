const { GoogleGenerativeAI } = require('@google/generative-ai');
const { API_KEY, handleCorsAndLimit } = require('./_shared');

const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
    if (handleCorsAndLimit(req, res, 'chat')) return;

    try {
        const { message } = req.body;
        if (!message || message.length > 2000) {
            return res.status(400).json({ success: false, error: "Valid message up to 2000 characters is required." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(message);
        const reply = result.response.text();

        res.status(200).json({
            success: true,
            developer: "@username_506",
            model: "gemini",
            reply: reply
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Internal Server Error", message: error.message });
    }
}
