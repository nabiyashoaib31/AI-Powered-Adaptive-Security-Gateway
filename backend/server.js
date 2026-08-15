const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const securityRoutes = require("./routes/securityRoutes");
// const connectDB = require("./config/db"); // Filhal comment
const powRoutes = require("./routes/powRoutes");



// Load Environment Variables
dotenv.config();

// connectDB(); // Filhal comment

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/security/pow", powRoutes);

// Test Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "🚀 AI-Powered Adaptive Security Gateway API is Running"
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});