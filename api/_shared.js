const fs = require('fs');
const path = require('path');
const keyData = require('../key.json');

const API_KEY = keyData.apiKey;
const RATE_LIMIT_MAP = new Map();
let memoryStats = null;

// Handle Vercel's ephemeral and read-only filesystem gracefully
const updateStats = (endpoint, ip) => {
    const defaultStatsPath = path.join(__dirname, '../stats.json');
    const tmpStatsPath = path.join('/tmp', 'stats.json'); 
    
    if (!memoryStats) {
        try {
            if (fs.existsSync(tmpStatsPath)) {
                memoryStats = JSON.parse(fs.readFileSync(tmpStatsPath, 'utf8'));
            } else {
                memoryStats = JSON.parse(fs.readFileSync(defaultStatsPath, 'utf8'));
            }
        } catch (e) {
            memoryStats = { totalRequests: 0, todayRequests: 0, uniqueUsers: [], endpoints: { chat: 0, code: 0, image: 0, tts: 0 }, lastRequest: "", lastIp: "" };
        }
    }

    // Update Data
    memoryStats.totalRequests++;
    memoryStats.todayRequests++;
    if (endpoint && memoryStats.endpoints[endpoint] !== undefined) memoryStats.endpoints[endpoint]++;
    if (ip && !memoryStats.uniqueUsers.includes(ip)) memoryStats.uniqueUsers.push(ip);
    memoryStats.lastRequest = new Date().toISOString();
    memoryStats.lastIp = ip || "unknown";

    // Write back (falls back to /tmp/ if root is read-only on Vercel)
    try {
        fs.writeFileSync(defaultStatsPath, JSON.stringify(memoryStats, null, 2));
    } catch (e) {
        try { fs.writeFileSync(tmpStatsPath, JSON.stringify(memoryStats, null, 2)); } catch (err) {}
    }
    
    return memoryStats;
};

const checkRateLimit = (ip) => {
    const now = Date.now();
    const user = RATE_LIMIT_MAP.get(ip);
    if (user && now - user.time < 60000 && user.count > 30) {
        return false; // Max 30 req/min
    }
    if (!user || now - user.time > 60000) {
        RATE_LIMIT_MAP.set(ip, { count: 1, time: now });
    } else {
        user.count++;
    }
    return true;
};

const handleCorsAndLimit = (req, res, endpoint) => {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    if (req.method !== 'POST' && endpoint !== 'status') {
        res.status(405).json({ success: false, error: "Method not allowed" });
        return true;
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (!checkRateLimit(ip)) {
        res.status(429).json({ success: false, error: "Too many requests. Please slow down." });
        return true;
    }
    if (endpoint !== 'status') updateStats(endpoint, ip);
    return false;
};

module.exports = { API_KEY, updateStats, handleCorsAndLimit, getStats: () => memoryStats };
