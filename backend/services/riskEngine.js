// ===============================
// BEHAVIORAL RISK ENGINE
// ===============================

const calculateRisk = ({
    failedAttempts = 0,
    requestCount = 0,
    rapidRequests = 0
}) => {

    // --------------------------------
    // TRUST SCORE
    // --------------------------------

    let trustScore = 100 - (failedAttempts * 20);

    // Score 0 se neeche nahi jayega
    if (trustScore < 0) {
        trustScore = 0;
    }


    // --------------------------------
    // RISK LEVEL
    // --------------------------------

    let riskLevel = "LOW";

    if (trustScore >= 80) {

        riskLevel = "LOW";

    } else if (trustScore >= 60) {

        riskLevel = "MEDIUM";

    } else if (trustScore >= 20) {

        riskLevel = "HIGH";

    } else {

        riskLevel = "CRITICAL";
    }

    // --------------------------------
    // SECURITY ACTION
    // --------------------------------

    let securityAction = "ALLOW";

    if (trustScore === 60) {
        securityAction = "SECURITY_PUZZLE";

    } else if (trustScore === 40) {

        securityAction = "PROOF_OF_WORK";

    } else if (trustScore === 20) {

        securityAction = "PROOF_OF_WORK";

    } else if (trustScore === 0) {

        securityAction = "TEMPORARY_BLOCK";
    }


    return {
        trustScore,
        riskLevel,
        securityAction
    };
};


module.exports = calculateRisk;