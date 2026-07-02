require("dotenv").config();

const LOG_API = process.env.LOG_API;
const TOKEN = process.env.BEARER_TOKEN;

async function Log(
    stack,
    level,
    packageName,
    message
) {
    try {
        const response = await fetch(LOG_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                stack,
                level,
                package: packageName,
                message
            })
        });

        return await response.json();

    } catch (error) {
        console.error(
            "Logging middleware error:",
            error.message
        );
    }
}

module.exports = { Log };