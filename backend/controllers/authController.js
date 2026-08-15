const users = require("../data/users.json");
const jwt = require("jsonwebtoken");
const saveLog = require("../services/logService");
const calculateRisk = require("../services/riskEngine");

const {
    generateSecurityPuzzle,
    verifySecurityPuzzle
} = require("../services/puzzleService");

const {
    generateChallenge,
    verifyProofOfWork
} = require("../services/proofOfWorkService");


// =====================================================
// REGISTER API
// =====================================================

exports.register = async (req, res) => {

    const {
        name,
        email,
        password
    } = req.body;

    const existingUser = users.find(
        user => user.email === email
    );

    if (existingUser) {

        return res.status(400).json({
            success: false,
            message: "Email already exists"
        });

    }

    const newUser = {

        id: users.length + 1,

        name,
        email,
        password,

        trustScore: 100,

        failedAttempts: 0,

        requestCount: 0,

        rapidRequests: 0,

        status: "Safe",

        blocked: false,

        blockUntil: null,

        blockCount: 0,

        securityPuzzle: null,

        role: "user"
    };

    users.push(newUser);

    return res.status(201).json({

        success: true,

        message: "User registered successfully",

        user: newUser
    });
};


// =====================================================
// LOGIN API
// =====================================================

exports.login = async (req, res) => {

    const {
        email,
        password
    } = req.body;


    // =================================================
    // FIND USER
    // =================================================

    const user = users.find(
        u => u.email === email
    );


    // =================================================
    // USER NOT FOUND
    // =================================================

    if (!user) {

        saveLog({

            email,

            ip: req.ip,
            device: req.headers["user-agent"],
            status: "USER NOT FOUND",

            trustScore: 0,

            riskLevel: "HIGH",

            securityAction: "DENY"
        });

        return res.status(404).json({

            success: false,

            message: "User not found",

            riskLevel: "HIGH"
        });
    }


    // =================================================
    // CHECK TEMPORARY BLOCK
    // =================================================

    if (user.blocked) {

        // ---------------------------------------------
        // BLOCK EXPIRED
        // ---------------------------------------------

        if (
            user.blockUntil &&
            Date.now() >= user.blockUntil
        ) {

            user.blocked = false;

            user.blockUntil = null;

            user.status = "Safe";

            // Failed attempts reset nahi kar rahe.
            // Is se repeated attacks par block duration
            // increase ho sakti hai.

        }

        // ---------------------------------------------
        // STILL BLOCKED
        // ---------------------------------------------

        else {

            const remainingSeconds =
                Math.ceil(
                    (user.blockUntil - Date.now()) / 1000
                );


            saveLog({

                email: user.email,

                ip: req.ip,
                device: req.headers["user-agent"],

                status: "BLOCKED LOGIN ATTEMPT",

                trustScore: user.trustScore,

                failedAttempts: user.failedAttempts,

                riskLevel: "CRITICAL",

                securityAction: "TEMPORARY_BLOCK",

                blocked: true
            });


            return res.status(403).json({

                success: false,

                message:
                    "Account temporarily blocked.",

                trustScore:
                    user.trustScore,

                riskLevel:
                    "CRITICAL",

                securityAction:
                    "TEMPORARY_BLOCK",

                blocked: true,

                remainingTime:
                    remainingSeconds
            });
        }
    }


    // =================================================
    // WRONG PASSWORD
    // =================================================

    if (user.password !== password) {

        user.failedAttempts += 1;


        // =================================================
        // CALCULATE RISK
        // =================================================

        const riskResult = calculateRisk({

            failedAttempts:
                user.failedAttempts,

            requestCount:
                user.requestCount || 0,

            rapidRequests:
                user.rapidRequests || 0
        });


        user.trustScore =
            riskResult.trustScore;

        user.status =
            riskResult.riskLevel;


        // =================================================
        // TEMPORARY BLOCK
        // 4 OR MORE FAILED ATTEMPTS
        // =================================================

        if (user.failedAttempts >= 4) {

            user.blocked = true;


            // ---------------------------------------------
            // INCREASE BLOCK COUNT
            // ---------------------------------------------

            user.blockCount =
                (user.blockCount || 0) + 1;


            // ---------------------------------------------
            // BLOCK DURATION
            // ---------------------------------------------

            let blockDuration = 30000;


            if (user.blockCount === 2) {

                blockDuration = 60000;

            }
            else if (user.blockCount >= 3) {

                blockDuration = 120000;

            }


            user.blockUntil =
                Date.now() + blockDuration;


            user.status =
                "Blocked";

            user.trustScore =
                0;

            user.securityPuzzle =
                null;


            // ---------------------------------------------
            // SAVE BLOCK LOG
            // ---------------------------------------------

            saveLog({

                email: user.email,

                ip: req.ip,
                device: req.headers["user-agent"],
                status:
                    "ACCOUNT TEMPORARILY BLOCKED",

                trustScore:
                    user.trustScore,

                failedAttempts:
                    user.failedAttempts,

                riskLevel:
                    "CRITICAL",

                securityAction:
                    "TEMPORARY_BLOCK",

                blocked: true
            });


            return res.status(403).json({

                success: false,

                message:
                    `Account temporarily blocked for ${blockDuration / 1000} seconds.`,

                trustScore:
                    user.trustScore,

                riskLevel:
                    "CRITICAL",

                securityAction:
                    "TEMPORARY_BLOCK",

                blocked: true,

                remainingTime:
                    Math.ceil(blockDuration / 1000)
            });
        }


        // =================================================
        // SECURITY PUZZLE
        // 2ND AND 3RD FAILED ATTEMPT
        // =================================================

        if (
            user.failedAttempts >= 2 &&
            user.failedAttempts < 4
        ) {

            const puzzle =
                generateSecurityPuzzle(
                    user.failedAttempts
                );


            user.securityPuzzle =
                puzzle;


            saveLog({

                email: user.email,

                ip: req.ip,

                device: req.headers["user-agent"],

                status:
                    "SECURITY PUZZLE FAILED",

                trustScore:
                    user.trustScore,

                failedAttempts:
                    user.failedAttempts,

                riskLevel:
                    puzzleRisk.riskLevel,

                securityAction:
                    "SECURITY_PUZZLE"
            });


            return res.status(401).json({

                success: false,

                message:
                    "Security puzzle required",

                securityAction:
                    "SECURITY_PUZZLE",

                puzzle: {

                    level:
                        puzzle.level,

                    question:
                        puzzle.question
                },

                trustScore:
                    user.trustScore,

                failedAttempts:
                    user.failedAttempts
            });
        }


        // =================================================
        // PROOF OF WORK
        // =================================================

        if (
            riskResult.securityAction === "PROOF_OF_WORK"
        ) {

            const pow =
                generateChallenge(4);


            saveLog({

                email: user.email,

                ip: req.ip,
                device: req.headers["user-agent"],

                status:
                    "PROOF OF WORK REQUIRED",

                trustScore:
                    user.trustScore,

                failedAttempts:
                    user.failedAttempts,

                riskLevel:
                    "HIGH",

                securityAction:
                    "PROOF_OF_WORK"
            });


            return res.status(401).json({

                success: false,

                message:
                    "Proof-of-Work verification required",

                trustScore:
                    user.trustScore,

                riskLevel:
                    "HIGH",

                securityAction:
                    "PROOF_OF_WORK",

                challenge:
                    pow.challenge,

                difficulty:
                    pow.difficulty,

                failedAttempts:
                    user.failedAttempts,

                blocked: false
            });
        }


        // =================================================
        // FAILED LOGIN
        // =================================================

        saveLog({

            email: user.email,

            ip: req.ip,
            device: req.headers["user-agent"],

            status:
                "FAILED LOGIN",

            trustScore:
                user.trustScore,

            failedAttempts:
                user.failedAttempts,

            riskLevel:
                riskResult.riskLevel,

            securityAction:
                riskResult.securityAction,

            blocked:
                user.blocked
        });


        return res.status(401).json({

            success: false,

            message:
                "Invalid Password",

            trustScore:
                user.trustScore,

            riskLevel:
                riskResult.riskLevel,

            securityAction:
                riskResult.securityAction,

            failedAttempts:
                user.failedAttempts,

            blocked:
                user.blocked
        });
    }


    // =====================================================
    // SUCCESSFUL LOGIN
    // =====================================================

    user.failedAttempts = 0;

    user.trustScore = 100;

    user.status = "Safe";

    user.blocked = false;

    user.blockUntil = null;

    user.blockCount = 0;

    user.securityPuzzle = null;


    // =====================================================
    // JWT TOKEN
    // =====================================================

    const token = jwt.sign(

        {

            id: user.id,

            email: user.email,

            role:
                user.role || "user",

            trustScore:
                user.trustScore
        },

        process.env.JWT_SECRET,

        {

            expiresIn: "1h"
        }
    );


    // =====================================================
    // SUCCESS LOG
    // =====================================================

    saveLog({

        email: user.email,

        ip: req.ip,
        device: req.headers["user-agent"],

        status:
            "SUCCESSFUL LOGIN",

        trustScore:
            user.trustScore,

        riskLevel:
            "LOW",

        securityAction:
            "ALLOW"
    });


    return res.status(200).json({

        success: true,

        message:
            "Login Successful",

        token,

        trustScore:
            user.trustScore,

        riskLevel:
            "LOW",

        securityAction:
            "ALLOW",

        user
    });
};


// =====================================================
// VERIFY SECURITY PUZZLE
// =====================================================

exports.verifyPuzzle = async (req, res) => {

    const {
        email,
        answer
    } = req.body;


    // =================================================
    // FIND USER
    // =================================================

    const user = users.find(
        u => u.email === email
    );


    if (!user) {

        return res.status(404).json({

            success: false,

            message:
                "User not found"
        });
    }


    // =================================================
    // CHECK ACTIVE PUZZLE
    // =================================================

    if (!user.securityPuzzle) {

        return res.status(400).json({

            success: false,

            message:
                "No security puzzle is active"
        });
    }


    // =================================================
    // VERIFY ANSWER
    // =================================================

    const isCorrect =
        verifySecurityPuzzle(
            user.securityPuzzle,
            answer
        );


    // =================================================
    // WRONG PUZZLE ANSWER
    // =================================================

    if (!isCorrect) {

        user.failedAttempts += 1;


        // =================================================
        // CALCULATE RISK
        // =================================================

        const puzzleRisk =
            calculateRisk({

                failedAttempts:
                    user.failedAttempts,

                requestCount:
                    user.requestCount || 0,

                rapidRequests:
                    user.rapidRequests || 0
            });


        user.trustScore =
            puzzleRisk.trustScore;

        user.status =
            puzzleRisk.riskLevel;


        // =================================================
        // BLOCK AFTER 4 FAILED ATTEMPTS
        // =================================================

        if (user.failedAttempts >= 4) {

            user.blocked = true;


            // Increase block count
            user.blockCount =
                (user.blockCount || 0) + 1;


            // Block duration
            let blockDuration = 30000;


            if (user.blockCount === 2) {

                blockDuration = 60000;

            }
            else if (user.blockCount >= 3) {

                blockDuration = 120000;

            }


            user.blockUntil =
                Date.now() + blockDuration;


            user.trustScore = 0;

            user.status = "Blocked";

            user.securityPuzzle = null;


            saveLog({

                email: user.email,

                ip: req.ip,
                device: req.headers["user-agent"],

                status:
                    "ACCOUNT TEMPORARILY BLOCKED",

                trustScore:
                    user.trustScore,

                failedAttempts:
                    user.failedAttempts,

                riskLevel:
                    "CRITICAL",

                securityAction:
                    "TEMPORARY_BLOCK",

                blocked: true
            });


            return res.status(403).json({

                success: false,

                message:
                    `Account temporarily blocked for ${blockDuration / 1000} seconds.`,

                trustScore: 0,

                riskLevel:
                    "CRITICAL",

                securityAction:
                    "TEMPORARY_BLOCK",

                blocked: true,

                remainingTime:
                    Math.ceil(blockDuration / 1000)
            });
        }


        // =================================================
        // GENERATE NEXT PUZZLE
        // =================================================

        const newPuzzle =
            generateSecurityPuzzle(
                user.failedAttempts
            );


        user.securityPuzzle =
            newPuzzle;


        // =================================================
        // SAVE FAILED PUZZLE LOG
        // =================================================

        saveLog({

            email: user.email,

            ip: req.ip,

            status:
                "SECURITY PUZZLE FAILED",

            trustScore:
                user.trustScore,

            failedAttempts:
                user.failedAttempts,

            riskLevel:
                puzzleRisk.riskLevel,

            securityAction:
                "SECURITY_PUZZLE"
        });


        return res.status(401).json({

            success: false,

            message:
                "Incorrect security answer",

            securityAction:
                "SECURITY_PUZZLE",

            trustScore:
                user.trustScore,

            riskLevel:
                puzzleRisk.riskLevel,

            puzzle: {

                level:
                    newPuzzle.level,

                question:
                    newPuzzle.question
            },

            failedAttempts:
                user.failedAttempts
        });
    }


    // =================================================
    // CORRECT PUZZLE ANSWER
    // =================================================

    user.securityPuzzle = null;


    saveLog({

        email: user.email,

        ip: req.ip,
        device: req.headers["user-agent"],
        status:
            "SECURITY PUZZLE PASSED",

        trustScore:
            user.trustScore,

        failedAttempts:
            user.failedAttempts,

        riskLevel:
            "MEDIUM",

        securityAction:
            "ALLOW_RETRY"
    });


    return res.status(200).json({

        success: true,

        message:
            "Security puzzle passed. You may retry login.",

        securityAction:
            "ALLOW_RETRY",

        trustScore:
            user.trustScore
    });
};