import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { initializeAdmin } from "./utils/initAdmin.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import triggerRoutes from "./routes/triggerRoutes.js";
import responseRoutes from "./routes/responseRoutes.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set("io", io);

// Connect to MongoDB
connectDB();

// Initialize default admin user
initializeAdmin();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join responder room
  socket.on("join-responders", (userId) => {
    socket.join("responders");
    socket.userId = userId;
    console.log(`User ${userId} joined responders room`);
  });

  // Join user room
  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);
    socket.userId = userId;
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/triggers", triggerRoutes);
app.use("/api/responses", responseRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "SafeSteps API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
});

export { io };
