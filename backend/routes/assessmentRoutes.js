const express = require("express");
const Assessment = require("../models/Assessment");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// Create a new Assessment
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      subject,
      class: className,
      date,
      startTime,
      duration,
      type,
    } = req.body;

    if (
      !title ||
      !subject ||
      !className ||
      !date ||
      !startTime ||
      !duration ||
      !type
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newAssessment = new Assessment({
      title,
      subject,
      class: className,
      date,
      startTime,
      duration,
      type,
      user: req.user.id,
    });
    await newAssessment.save();

    res.status(201).json({
      message: "Assessment added successfully",
      assessment: newAssessment,
    });
  } catch (error) {
    console.error("Server error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

// Get all Assessments for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const assessments = await Assessment.find({ user: req.user.id });
    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Assessment by ID (only if it belongs to the user)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update an Assessment (only if it belongs to the user)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updatedAssessment = await Assessment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedAssessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.status(200).json({
      message: "Assessment updated successfully",
      assessment: updatedAssessment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete an Assessment (only if it belongs to the user)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedAssessment = await Assessment.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!deletedAssessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.status(200).json({ message: "Assessment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request reschedule for an Assessment
router.post("/reschedule", authMiddleware, async (req, res) => {
  try {
    const { id, date, time } = req.body;

    const assessment = await Assessment.findOne({ _id: id, user: req.user.id });
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Store original date and time
    assessment.originalDate = assessment.date;
    assessment.originalStartTime = assessment.startTime;

    // Update with requested date and time
    assessment.date = date;
    assessment.startTime = time;
    assessment.requestedDate = date;
    assessment.requestedTime = time;
    assessment.rescheduleRequest = true;

    await assessment.save();
    res.status(200).json({
      message: "Reschedule request submitted successfully",
      assessment: assessment,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all reschedule requests (admin only)
router.get(
  "/reschedule-requests",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const assessments = await Assessment.find({ rescheduleRequest: true })
        .populate("user", "name email")
        .sort({ date: 1 });
      res.status(200).json(assessments);
    } catch (error) {
      console.error("Error fetching reschedule requests:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Handle reschedule request (admin only)
router.post(
  "/:id/reschedule",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { action } = req.body;
      const assessment = await Assessment.findById(req.params.id);

      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      if (action === "accept") {
        assessment.rescheduleRequest = false;
        await assessment.save();
        res
          .status(200)
          .json({ message: "Reschedule request accepted", assessment });
      } else if (action === "decline") {
        assessment.rescheduleRequest = false;
        assessment.date = assessment.originalDate;
        assessment.startTime = assessment.originalStartTime;
        await assessment.save();
        res
          .status(200)
          .json({ message: "Reschedule request declined", assessment });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      console.error("Error handling reschedule request:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

module.exports = router;
