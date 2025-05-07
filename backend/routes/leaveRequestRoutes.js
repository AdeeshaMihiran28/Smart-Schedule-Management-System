// backend/routes/leaveRequestRoutes.js
const express = require("express");
const LeaveRequest = require("../models/LeaveRequest");
const multer = require("multer");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Create a leave request
router.post(
  "/",
  authMiddleware,
  upload.single("proofDocument"),
  async (req, res) => {
    try {
      const { requestType, numberOfDays, reason, dates } = req.body;
      const proofDocument = req.file ? req.file.path : null;

      const leaveRequest = new LeaveRequest({
        user: req.user.id,
        requestType,
        numberOfDays,
        reason,
        proofDocument,
        dates: JSON.parse(dates),
      });

      await leaveRequest.save();
      res.status(201).json({ message: "Leave request created successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get all leave requests for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ user: req.user.id });
    res.status(200).json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all leave requests (admin only)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(leaveRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update leave request status (admin only)
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.status(200).json(leaveRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
