const { getStats, updateStats, handleCorsAndLimit } = require('./_shared');

const startTime = Date.now();

export default function handler(req, res) {
    if (handleCorsAndLimit(req, res, 'status')) return;
    
    // Ensure stats are loaded
    const stats = getStats() || updateStats(null, null);

    res.status(200).json({
        success: true,
        apiName: "Universal AI API",
        version: "v1.0.0",
        developer: "@username_506",
        totalRequests: stats.totalRequests,
        todayRequests: stats.todayRequests,
        uniqueUsers: stats.uniqueUsers.length,
        chatRequests: stats.endpoints.chat,
        imageRequests: stats.endpoints.image,
        codeRequests: stats.endpoints.code,
        ttsRequests: stats.endpoints.tts,
        serverTime: new Date().toISOString(),
        status: "Online & Active",
        uptime: `${Math.floor((Date.now() - startTime) / 1000)} seconds`
    });
}
