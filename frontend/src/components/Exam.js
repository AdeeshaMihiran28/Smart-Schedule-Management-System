import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/exams.css";

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [newDateTime, setNewDateTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:2021/api/exams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExams(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching exams:", error);
      setError("Failed to fetch exams. Please try again later.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExam({ ...newExam, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:2021/api/exams", newExam, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsModalOpen(false);
      setNewExam({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        description: "",
      });
      fetchExams();
    } catch (error) {
      console.error("Error adding exam:", error);
      setError(
        error.response?.data?.message || "Failed to add exam. Please try again."
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRescheduleClick = (exam) => {
    setSelectedExam(exam);
    setNewDateTime(exam.dateTime);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    try {
      const selectedDateTime = new Date(newDateTime);
      const currentDateTime = new Date();

      if (selectedDateTime < currentDateTime) {
        Swal.fire({
          title: "Invalid Date/Time",
          text: "Cannot schedule exam in the past",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:2021/api/exams/reschedule-request",
        {
          examId: selectedExam._id,
          newDateTime: newDateTime,
          currentDateTime: selectedExam.dateTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire({
        title: "Success!",
        text: "Reschedule request submitted successfully",
        icon: "success",
        confirmButtonColor: "#10b981",
      });

      setShowRescheduleModal(false);
      fetchExams(); // Refresh the exam list
    } catch (error) {
      console.error("Error submitting reschedule request:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to submit reschedule request",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <div className="exams-container">
      <div className="exams-header">
        <h1 className="exams-title">Exams Schedule</h1>
        <button
          className="add-exam-button"
          onClick={() => setIsModalOpen(true)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Exam
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading exams...</div>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <div key={exam._id} className="exam-card">
              <div className="exam-card-header">
                <h2 className="exam-title">{exam.title}</h2>
                <span className="exam-date">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(exam.date)}
                </span>
              </div>
              <div className="exam-details">
                <div className="exam-time">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                </div>
                <div className="exam-location">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {exam.location}
                </div>
              </div>
              {exam.description && (
                <p className="exam-description">{exam.description}</p>
              )}
              <div className="exam-actions">
                {exam.rescheduleRequest && (
                  <div className="reschedule-status pending">
                    Reschedule Request Pending
                  </div>
                )}
                <button
                  className="reschedule-button"
                  onClick={() => handleRescheduleClick(exam)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Reschedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <h2 className="modal-title">Add New Exam</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  value={newExam.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  name="date"
                  className="form-input"
                  value={newExam.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  className="form-input"
                  value={newExam.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  className="form-input"
                  value={newExam.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  value={newExam.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-input"
                  value={newExam.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  Add Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedExam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Reschedule Request</h2>
            <div className="current-schedule">
              <h3>Current Schedule</h3>
              <p>
                Date: {new Date(selectedExam.dateTime).toLocaleDateString()}
              </p>
              <p>
                Time: {new Date(selectedExam.dateTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="form-group">
              <label>New Date and Time</label>
              <input
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowRescheduleModal(false)}
              >
                Cancel
              </button>
              <button
                className="submit-button"
                onClick={handleRescheduleSubmit}
              >
                Request Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
