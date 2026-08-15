const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "Access Denied. No Token Provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        console.log("Authorization Header:", authHeader);
        console.log("JWT Secret:", process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (error) {

        console.log("JWT Verify Error:", error);

        return res.status(403).json({
            success: false,
            message: "Invalid or Expired Token.",
            error: error.message
        });



    }

};

module.exports = verifyToken;
