const rateLimit = require("express-rate-limit");

const adaptiveRateLimit = rateLimit({
    windowMs: 60 * 1000,

    limit: (req) => {
        if (!req.user) {
            return 30;
        }

        const score = req.user.trustScore;

        if (score >= 80) {
            return 100;
        }

        if (score >= 50) {
            return 50;
        }

        if (score >= 20) {
            return 20;
        }

        return 5;
    },

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Your activity has been temporarily rate limited."
    }
});

module.exports = adaptiveRateLimit;