const express = require("express");
const Exam = require("../models/Exam");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// Get all reschedule requests (admin only)
router.get(
  "/reschedule-requests",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const exams = await Exam.find({ rescheduleRequest: true })
        .populate("user", "name email")
        .sort({ date: 1 });
      res.status(200).json(exams);
    } catch (error) {
      console.error("Error fetching reschedule requests:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Create a new Exam
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      subject,
      class: className,
      date,
      startTime,
      endTime,
      location,
    } = req.body;

    const newExam = new Exam({
      title,
      subject,
      class: className,
      date,
      startTime,
      endTime,
      location,
      user: req.user.id,
    });

    await newExam.save();
    res.status(201).json({ message: "Exam added successfully", exam: newExam });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all Exams for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const exams = await Exam.find({ user: req.user.id });
    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Exam by ID (only if it belongs to the user)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, user: req.user.id });
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res.status(200).json(exam);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update an Exam (only if it belongs to the user)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updatedExam = await Exam.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res
      .status(200)
      .json({ message: "Exam updated successfully", exam: updatedExam });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete an Exam (only if it belongs to the user)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedExam = await Exam.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!deletedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request reschedule for an Exam
router.post("/reschedule", authMiddleware, async (req, res) => {
  try {
    const { id, date, time } = req.body;

    const exam = await Exam.findOne({ _id: id, user: req.user.id });
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Store original date and time
    exam.originalDate = exam.date;
    exam.originalStartTime = exam.startTime;

    // Update with requested date and time
    exam.date = date;
    exam.startTime = time;
    exam.requestedDate = date;
    exam.requestedTime = time;
    exam.rescheduleRequest = true;

    await exam.save();
    res.status(200).json({
      message: "Reschedule request submitted successfully",
      exam: exam,
    });
  } catch (error) {
    console.error("Reschedule error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Handle reschedule request (admin only)
router.post(
  "/:id/reschedule",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { action } = req.body;
      const exam = await Exam.findById(req.params.id);

      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      if (action === "accept") {
        exam.rescheduleRequest = false;
        await exam.save();
        res.status(200).json({ message: "Reschedule request accepted", exam });
      } else if (action === "decline") {
        exam.rescheduleRequest = false;
        exam.date = exam.originalDate;
        exam.startTime = exam.originalStartTime;
        await exam.save();
        res.status(200).json({ message: "Reschedule request declined", exam });
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
