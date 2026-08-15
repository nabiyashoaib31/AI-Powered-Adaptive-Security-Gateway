const {
    generateChallenge,
    verifyProofOfWork
} = require("../services/proofOfWorkService");

// =========================
// GENERATE POW CHALLENGE
// =========================
exports.generatePoWChallenge = (req, res) => {

    const challenge = generateChallenge(4);

    return res.status(200).json({
        success: true,
        message: "Proof-of-Work challenge generated",
        challenge: challenge.challenge,
        difficulty: challenge.difficulty
    });
};


// =========================
// VERIFY POW SOLUTION
// =========================
exports.verifyPoW = (req, res) => {

    const { challenge, nonce, difficulty } = req.body;

    if (!challenge || nonce === undefined) {

        return res.status(400).json({
            success: false,
            message: "Challenge and nonce are required"
        });
    }

    const isValid = verifyProofOfWork(
        challenge,
        nonce,
        difficulty || 4
    );

    if (!isValid) {

        return res.status(403).json({
            success: false,
            message: "Proof-of-Work verification failed",
            verified: false
        });
    }

    return res.status(200).json({
        success: true,
        message: "Proof-of-Work verification successful",
        verified: true
    });
};