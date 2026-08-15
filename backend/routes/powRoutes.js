const express = require("express");

const {
    generatePoWChallenge,
    verifyPoW
} = require("../controllers/securityController");

const router = express.Router();

// Generate Proof-of-Work challenge
router.get("/challenge", generatePoWChallenge);

// Verify Proof-of-Work solution
router.post("/verify", verifyPoW);

module.exports = router;