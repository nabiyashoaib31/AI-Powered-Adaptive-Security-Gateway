const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");
const logFile = path.join(logsDir, "security.log");

const saveLog = (data) => {
    console.log("Saving Log:", data);
    console.log("Log File:", logFile);

    // Create logs folder if it doesn't exist
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    const log = `[${new Date().toLocaleString()}] ${JSON.stringify(data)}\n`;

    fs.appendFile(logFile, log, (err) => {
        if (err) {
            console.error("❌ Log Error:", err);
        } else {
            console.log("✅ Log Saved Successfully");
        }
    });
};

module.exports = saveLog;