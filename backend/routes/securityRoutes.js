const express = require("express");
const router = express.Router();

const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../logs/security.log");

// GET Security Logs
router.get("/logs", (req, res) => {
    try {
        if (!fs.existsSync(logFile)) {
            return res.status(200).json({
                success: true,
                logs: []
            });
        }

        const fileContent = fs.readFileSync(logFile, "utf8");

        const logs = fileContent
            .split("\n")
            .filter(line => line.trim() !== "")
            .reverse()
            .map(line => {
                const firstBracket = line.indexOf("]");
                const timestamp = line.substring(1, firstBracket);

                const jsonPart = line.substring(firstBracket + 2);
                const data = JSON.parse(jsonPart);

                return {
                    timestamp,
                    ...data
                };
            });

        res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });

    } catch (error) {
        console.error("Security Logs Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to read security logs"
        });
    }
});

module.exports = router;