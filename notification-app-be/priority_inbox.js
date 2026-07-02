require("dotenv").config();

const { Log } = require("../logging-middleware/logger");

// ENV
const API_URL = process.env.NOTIFICATION_API;
const LOG_API = process.env.LOG_API;
const TOKEN = process.env.BEARER_TOKEN;

// Validate ENV
if (!API_URL) throw new Error("NOTIFICATION_API missing");
if (!LOG_API) throw new Error("LOG_API missing");
if (!TOKEN) throw new Error("BEARER_TOKEN missing");

// Weights
const WEIGHTS = {
    Placement: 3,
    Result: 2,
    Event: 1
};

// Safe logger (prevents HTML/JSON crash affecting main flow)
async function safeLog(level, message) {
    try {
        await Log("backend", level, "service", message);
    } catch (err) {
        console.error("Logger failed:", err.message);
    }
}

// Priority calculation
function calculatePriority(notification) {
    const weight = WEIGHTS[notification.Type] || 0;

    const time = new Date(notification.Timestamp);
    const recency = isNaN(time.getTime()) ? 0 : time.getTime();

    return weight * 1e12 + recency;
}

// Main function
async function getTop10() {
    try {
        await safeLog("info", "Fetching notifications");

        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        // Handle HTTP errors
        const text = await response.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            // If API returns HTML error page
            console.error("RAW RESPONSE (not JSON):", text);
            throw new Error("API did not return JSON (possible auth or endpoint issue)");
        }

        if (!Array.isArray(data.notifications)) {
            throw new Error("Invalid response format");
        }

        await safeLog(
            "debug",
            `Received ${data.notifications.length} notifications`
        );

        // Compute top 10
        const top10 = data.notifications
            .map(n => ({
                ...n,
                priority: calculatePriority(n)
            }))
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 10);

        // FINAL JSON OUTPUT
        const result = {
            success: true,
            count: top10.length,
            notifications: top10.map((n, index) => ({
                rank: index + 1,
                type: n.Type,
                message: n.Message,
                timestamp: n.Timestamp,
                priority: n.priority
            }))
        };

        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        await safeLog("error", error.message);

        console.log(JSON.stringify({
            success: false,
            error: error.message
        }, null, 2));
    }
}

getTop10();