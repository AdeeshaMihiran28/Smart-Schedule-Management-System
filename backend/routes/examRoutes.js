const express = require("express");
const Exam = require("../models/Exam");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Create a new Exam
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { title, subject, class: className, date, startTime, endTime, location } = req.body;

    const newExam = new Exam({
      title,
      subject,
      class: className,
      date,
      startTime,
      endTime,
      location,
      user: req.user.id
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
    res.status(200).json({ message: "Exam updated successfully", exam: updatedExam });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete an Exam (only if it belongs to the user)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedExam = await Exam.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
