export async function Log(level, message) {
  try {
    await fetch("http://4.224.186.213/evaluation-service/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        level,
        message,
        service: "frontend"
      })
    });
  } catch (err) {
    console.error("Log failed:", err.message);
  }
}