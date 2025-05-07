const express = require("express");
const Assessment = require("../models/Assessment");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Create a new Assessment
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { title, subject, class: className, date, startTime, duration, type } = req.body;

    if (!title || !subject || !className || !date || !startTime || !duration || !type) {
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
      user: req.user.id
    });
    await newAssessment.save();

    res.status(201).json({ message: "Assessment added successfully", assessment: newAssessment });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
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
    const assessment = await Assessment.findOne({ _id: req.params.id, user: req.user.id });
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
    res.status(200).json({ message: "Assessment updated successfully", assessment: updatedAssessment });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete an Assessment (only if it belongs to the user)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedAssessment = await Assessment.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedAssessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.status(200).json({ message: "Assessment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
