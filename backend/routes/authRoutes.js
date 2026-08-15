const express = require("express");
const router = express.Router();

const {
    login,
    register,
    verifyPuzzle
} = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");
const adaptiveRateLimit = require("../middleware/rateLimitMiddleware");


// Register
router.post("/register", register);


// Login
router.post("/login", login);
router.post("/verify-puzzle", verifyPuzzle);


// Protected Profile
router.get(
    "/profile",
    verifyToken,
    adaptiveRateLimit,
    (req, res) => {

        res.json({
            success: true,
            message: "Protected Route Accessed Successfully",
            user: req.user
        });

    }
);


module.exports = router;