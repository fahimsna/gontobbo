import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8009;

// ==========================================
// Middleware
// ==========================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ==========================================
// Health Check
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Gontobbo API",
    status: "running",
    port: PORT,
  });
});

// ==========================================
// API Routes
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/drivers", driverRoutes);

app.use("/api/rides", rideRoutes);

// ==========================================
// 404 Handler
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// Global Error Handler
// ==========================================

app.use((err, req, res, next) => {
  console.error("Global error:", err);

  res.status(err.status || 500).json({
    success: false,

    message: err.message || "Internal server error",

    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
});

// ==========================================
// Start Server
// ==========================================

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start Express only after
    // successful database connection
    app.listen(PORT, () => {
      console.log(`Gontobbo server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Gontobbo server:", error.message);

    process.exit(1);
  }
};

startServer();
