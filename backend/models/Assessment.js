const mongoose = require("mongoose");

const AssessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  class: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  duration: { type: String, required: true },
  type: { type: String, required: true, enum: ["Quiz", "Assignment", "Project"] },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model("Assessment", AssessmentSchema);
