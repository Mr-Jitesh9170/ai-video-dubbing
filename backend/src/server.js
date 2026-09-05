require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const connectDatabase = require("./config/database");
const { connectRedis } = require("./config/redis");

const videoRoutes = require("./routes/video.routes");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors());

// Request logging
app.use(morgan("dev"));

// Body parser
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "AI Video Dubbing API is running"
    });
});

// Routes
app.use("/api/videos", videoRoutes);

// Start server
const startServer = async () => {
    try {
        await connectRedis();
        await connectDatabase();

        const port = process.env.PORT || 5000;

        app.listen(port, () => {
            console.log(
                `🚀 Server running on http://localhost:${port}`
            );
        });
    } catch (error) {
        console.error(
            "❌ Server startup failed:",
            error.message
        );

        process.exit(1);
    }
};

startServer();