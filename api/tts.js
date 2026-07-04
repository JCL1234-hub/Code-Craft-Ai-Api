const { API_KEY, handleCorsAndLimit } = require('./_shared');

export default async function handler(req, res) {
    if (handleCorsAndLimit(req, res, 'tts')) return;

    try {
        const { text, voice } = req.body;
        if (!text || text.length > 1500) {
            return res.status(400).json({ success: false, error: "Valid text up to 1500 characters is required." });
        }

        // Using Gemini 2.0 Flash Audio output via REST to fulfill Google AI Studio TTS requirement
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: text }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voice === "en-US" ? "Aoede" : "Puck" // Fallback native voice handling
                            }
                        }
                    }
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        // Parse inlineData audio output from Gemini 2.0 Flash
        const audioBase64 = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
        if (!audioBase64) throw new Error("No audio returned from API.");

        res.status(200).json({
            success: true,
            audio: `data:${audioBase64.mimeType};base64,${audioBase64.data}`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "TTS Generation Failed", message: error.message });
    }
}
