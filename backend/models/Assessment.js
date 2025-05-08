const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Quiz", "Assignment", "Project"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rescheduleRequest: {
      type: Boolean,
      default: false,
    },
    originalDate: {
      type: Date,
    },
    originalStartTime: {
      type: String,
    },
    requestedDate: {
      type: Date,
    },
    requestedTime: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Assessment", assessmentSchema);
