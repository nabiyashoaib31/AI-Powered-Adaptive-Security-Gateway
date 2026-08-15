const crypto = require("crypto");

// Generate a Proof-of-Work challenge
const generateChallenge = (difficulty = 4) => {
    const challenge = crypto.randomBytes(16).toString("hex");

    return {
        challenge,
        difficulty
    };
};

// Verify Proof-of-Work solution
const verifyProofOfWork = (challenge, nonce, difficulty = 4) => {

    const hash = crypto
        .createHash("sha256")
        .update(challenge + nonce)
        .digest("hex");

    const requiredPrefix = "0".repeat(difficulty);

    return hash.startsWith(requiredPrefix);
};

module.exports = {
    generateChallenge,
    verifyProofOfWork
};