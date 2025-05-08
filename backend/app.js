const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");

const app = express();

// Middleware
app.use(
  cors({
    credentials: true,
    origin: "*",
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/leaves", leaveRequestRoutes);

module.exports = app;
