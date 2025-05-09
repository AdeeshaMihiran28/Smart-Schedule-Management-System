import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/profile.css";
import "../styles/examForms.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const getUpcoming = (items, dateField, count = 5) => {
  const now = new Date();
  return items
    .filter((item) => new Date(item[dateField]) >= now)
    .sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]))
    .slice(0, count);
};

const Profile = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "https://via.placeholder.com/120",
    phone: "",
  });
  const [exams, setExams] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    title: "",
    subject: "",
    class: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    profileImage: "",
  });
  const [editingExam, setEditingExam] = useState(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    subject: "",
    class: "",
    date: "",
    startTime: "",
    duration: "",
    type: "Quiz",
  });
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [newDateTime, setNewDateTime] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUserData();
    fetchScheduleData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:2021/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setUser(response.data);
        setEditForm({
          name: response.data.name,
          email: response.data.email,
          currentPassword: "",
          newPassword: "",
          profileImage: response.data.profileImage || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  const fetchScheduleData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [examsResponse, assessmentsResponse] = await Promise.all([
        axios.get("http://localhost:2021/api/exams", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:2021/api/assessments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setExams(examsResponse.data);
      setAssessments(assessmentsResponse.data);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.put(
        "http://localhost:2021/api/auth/profile",
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setUser(response.data.user);
        setIsEditing(false);

        Swal.fire({
          title: "Success!",
          text: "Your profile has been updated successfully.",
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        Swal.fire({
          title: "Error!",
          text:
            error.response?.data?.message ||
            "Failed to update profile. Please try again.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();

    // Only allow letters and spaces (no numbers or special characters)
    const titleRegex = /^[A-Za-z\s]+$/;
    if (!newExam.title.trim()) {
      return Swal.fire("Validation Error", "Title is required.", "warning");
    }
    if (!titleRegex.test(newExam.title.trim())) {
      return Swal.fire(
        "Validation Error",
        "Title can only contain letters and spaces (no numbers or special characters).",
        "warning"
      );
    }
    if (!newExam.subject.trim()) {
      return Swal.fire("Validation Error", "Subject is required.", "warning");
    }
    if (!newExam.class.trim()) {
      return Swal.fire("Validation Error", "Class is required.", "warning");
    }
    if (!newExam.date) {
      return Swal.fire("Validation Error", "Date is required.", "warning");
    }
    if (new Date(newExam.date) < new Date(new Date().toDateString())) {
      return Swal.fire(
        "Validation Error",
        "Date cannot be in the past.",
        "warning"
      );
    }
    if (!newExam.startTime) {
      return Swal.fire(
        "Validation Error",
        "Start time is required.",
        "warning"
      );
    }
    if (!newExam.endTime) {
      return Swal.fire("Validation Error", "End time is required.", "warning");
    }
    if (newExam.endTime <= newExam.startTime) {
      return Swal.fire(
        "Validation Error",
        "End time must be after start time.",
        "warning"
      );
    }
    if (!newExam.location.trim()) {
      return Swal.fire("Validation Error", "Location is required.", "warning");
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire({
          title: "Authentication Error!",
          text: "Please log in again",
          icon: "error",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "OK",
        });
        return;
      }

      // Format the exam data
      const examData = {
        ...newExam,
        date: new Date(newExam.date).toISOString().split("T")[0], // Format date as YYYY-MM-DD
      };

      console.log("Submitting exam data:", examData); // Debug log

      let response;
      if (editingExam) {
        // Update existing exam
        response = await axios.put(
          `http://localhost:2021/api/exams/${editingExam._id}`,
          examData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // Create new exam
        response = await axios.post(
          "http://localhost:2021/api/exams/add",
          examData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log("Response from server:", response.data); // Debug log

      // Show success message
      Swal.fire({
        title: "Success!",
        text: editingExam
          ? "Exam has been updated successfully"
          : "Exam has been added successfully",
        icon: "success",
        confirmButtonColor: "#10b981",
        confirmButtonText: "OK",
        timer: 3000,
        timerProgressBar: true,
      });

      setIsExamModalOpen(false);
      setEditingExam(null);
      setNewExam({
        title: "",
        subject: "",
        class: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        description: "",
      });
      fetchScheduleData();
    } catch (error) {
      console.error("Error details:", error); // Debug log
      console.error("Error response:", error.response); // Debug log

      let errorMessage = editingExam
        ? "Failed to update exam. Please try again."
        : "Failed to add exam. Please try again.";

      if (error.response) {
        // Server responded with an error
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check your connection.";
      }

      Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Try Again",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingExam) {
      setNewExam((prevExam) => ({
        ...prevExam,
        [name]: value,
      }));
    } else {
      setNewExam((prevExam) => ({
        ...prevExam,
        [name]: value,
      }));
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

  const handleDeleteExam = async (examId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:2021/api/exams/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Swal.fire({
          title: "Deleted!",
          text: "The exam has been deleted.",
          icon: "success",
          confirmButtonColor: "#10b981",
        });

        fetchScheduleData();
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to delete the exam.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleUpdateExam = (exam) => {
    setEditingExam(exam);
    setNewExam({
      title: exam.title,
      subject: exam.subject,
      class: exam.class,
      date: exam.date,
      startTime: exam.startTime,
      endTime: exam.endTime,
      location: exam.location,
      description: exam.description,
    });
    setIsExamModalOpen(true);
  };

  const handleDownloadExam = (exam) => {
    const doc = new jsPDF();
    // Green header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Exam Details", 14, 20);

    // Exam details table (no user details)
    doc.setTextColor(16, 185, 129);
    doc.text("Exam Information", 14, 40);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: 45,
      head: [["Field", "Value"]],
      body: [
        ["Title", exam.title],
        ["Subject", exam.subject],
        ["Class", exam.class],
        ["Date", formatDate(exam.date)],
        ["Time", `${formatTime(exam.startTime)} - ${formatTime(exam.endTime)}`],
        ["Location", exam.location],
        ["Description", exam.description || "-"],
      ],
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      bodyStyles: { fillColor: [255, 255, 255], textColor: 34 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { font: "helvetica", fontSize: 11, cellPadding: 3 },
      tableLineColor: [16, 185, 129],
      tableLineWidth: 0.2,
    });
    doc.save(`${exam.title}_details.pdf`);
  };

  const handleAssessmentSubmit = async (e) => {
    e.preventDefault();

    // Only allow letters and spaces (no numbers or special characters)
    const titleRegex = /^[A-Za-z\s]+$/;
    if (!newAssessment.title.trim()) {
      return Swal.fire("Validation Error", "Title is required.", "warning");
    }
    if (!titleRegex.test(newAssessment.title.trim())) {
      return Swal.fire(
        "Validation Error",
        "Title can only contain letters and spaces (no numbers or special characters).",
        "warning"
      );
    }
    if (!newAssessment.subject.trim()) {
      return Swal.fire("Validation Error", "Subject is required.", "warning");
    }
    if (!newAssessment.class.trim()) {
      return Swal.fire("Validation Error", "Class is required.", "warning");
    }
    if (!newAssessment.date) {
      return Swal.fire("Validation Error", "Date is required.", "warning");
    }
    if (new Date(newAssessment.date) < new Date(new Date().toDateString())) {
      return Swal.fire(
        "Validation Error",
        "Date cannot be in the past.",
        "warning"
      );
    }
    if (!newAssessment.startTime) {
      return Swal.fire(
        "Validation Error",
        "Start time is required.",
        "warning"
      );
    }
    if (
      !newAssessment.duration.trim() ||
      isNaN(Number(newAssessment.duration)) ||
      Number(newAssessment.duration) <= 0
    ) {
      return Swal.fire(
        "Validation Error",
        "Duration must be a positive number.",
        "warning"
      );
    }
    if (!newAssessment.type) {
      return Swal.fire("Validation Error", "Type is required.", "warning");
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire({
          title: "Authentication Error!",
          text: "Please log in again",
          icon: "error",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "OK",
        });
        return;
      }

      // Format the assessment data
      const assessmentData = {
        ...newAssessment,
        date: new Date(newAssessment.date).toISOString().split("T")[0],
      };

      let response;
      if (editingAssessment) {
        // Update existing assessment
        response = await axios.put(
          `http://localhost:2021/api/assessments/${editingAssessment._id}`,
          assessmentData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        // Create new assessment
        response = await axios.post(
          "http://localhost:2021/api/assessments/add",
          assessmentData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      Swal.fire({
        title: "Success!",
        text: editingAssessment
          ? "Assessment has been updated successfully"
          : "Assessment has been added successfully",
        icon: "success",
        confirmButtonColor: "#10b981",
        confirmButtonText: "OK",
        timer: 3000,
        timerProgressBar: true,
      });

      setIsAssessmentModalOpen(false);
      setEditingAssessment(null);
      setNewAssessment({
        title: "",
        subject: "",
        class: "",
        date: "",
        startTime: "",
        duration: "",
        type: "Quiz",
      });
      fetchScheduleData();
    } catch (error) {
      console.error("Error details:", error);
      let errorMessage = editingAssessment
        ? "Failed to update assessment. Please try again."
        : "Failed to add assessment. Please try again.";

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      }

      Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Try Again",
      });
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#dc2626",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        await axios.delete(
          `http://localhost:2021/api/assessments/${assessmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        Swal.fire({
          title: "Deleted!",
          text: "The assessment has been deleted.",
          icon: "success",
          confirmButtonColor: "#10b981",
        });

        fetchScheduleData();
      }
    } catch (error) {
      console.error("Error deleting assessment:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to delete the assessment.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleUpdateAssessment = (assessment) => {
    setEditingAssessment(assessment);
    setNewAssessment({
      title: assessment.title,
      subject: assessment.subject,
      class: assessment.class,
      date: assessment.date,
      startTime: assessment.startTime,
      duration: assessment.duration,
      type: assessment.type,
    });
    setIsAssessmentModalOpen(true);
  };

  const handleDownloadAssessment = (assessment) => {
    const doc = new jsPDF();
    // Green header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Assessment Details", 14, 20);

    // Assessment details table (no user details)
    doc.setTextColor(16, 185, 129);
    doc.text("Assessment Information", 14, 40);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: 45,
      head: [["Field", "Value"]],
      body: [
        ["Title", assessment.title],
        ["Subject", assessment.subject],
        ["Class", assessment.class],
        ["Date", formatDate(assessment.date)],
        ["Time", formatTime(assessment.startTime)],
        ["Duration", assessment.duration],
        ["Type", assessment.type],
      ],
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      bodyStyles: { fillColor: [255, 255, 255], textColor: 34 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { font: "helvetica", fontSize: 11, cellPadding: 3 },
      tableLineColor: [16, 185, 129],
      tableLineWidth: 0.2,
    });
    doc.save(`${assessment.title}_details.pdf`);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:2021/api/auth/logout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      localStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Dashboard calculations
  const totalExams = exams.length;
  const totalAssessments = assessments.length;
  const upcomingExams = getUpcoming(exams, "date", 5);
  const upcomingAssessments = getUpcoming(assessments, "date", 5);

  const handleAssessmentInputChange = (e) => {
    const { name, value } = e.target;
    if (editingAssessment) {
      setNewAssessment((prevAssessment) => ({
        ...prevAssessment,
        [name]: value,
      }));
    } else {
      setNewAssessment((prevAssessment) => ({
        ...prevAssessment,
        [name]: value,
      }));
    }
  };

  const handleRescheduleClick = (item) => {
    setSelectedExam(item);
    setNewDateTime(item.dateTime || `${item.date}T${item.startTime}`);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async () => {
    try {
      if (!newDateTime) {
        Swal.fire({
          title: "Error!",
          text: "Please select a new date and time",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      const selectedDateTime = new Date(newDateTime);
      const currentDateTime = new Date();

      if (selectedDateTime < currentDateTime) {
        Swal.fire({
          title: "Invalid Date/Time",
          text: "Cannot schedule in the past",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire({
          title: "Authentication Error",
          text: "Please log in again",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      // Format the date and time for the API
      const newDate = selectedDateTime.toISOString().split("T")[0];
      const newTime = selectedDateTime.toTimeString().split(" ")[0];

      // Determine if it's an exam or assessment
      const isAssessment =
        selectedExam.type === "Quiz" ||
        selectedExam.type === "Assignment" ||
        selectedExam.type === "Project";

      const endpoint = isAssessment
        ? "http://localhost:2021/api/assessments/reschedule" // Updated to match backend route
        : "http://localhost:2021/api/exams/reschedule"; // Updated to match backend route

      const requestData = {
        id: selectedExam._id,
        date: newDate,
        time: newTime,
      };

      console.log("Sending reschedule request to:", endpoint);
      console.log("Request data:", requestData);

      const response = await axios.post(endpoint, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response from server:", response.data);

      if (response.data) {
        Swal.fire({
          title: "Success!",
          text: "Reschedule request submitted successfully",
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          showConfirmButton: false,
        });

        setShowRescheduleModal(false);
        setSelectedExam(null);
        setNewDateTime("");
        fetchScheduleData(); // Refresh the list
      }
    } catch (error) {
      console.error("Error submitting reschedule request:", error);
      console.error("Error response:", error.response);

      let errorMessage = "Failed to submit reschedule request";

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        console.error("Server error message:", error.response.data);
      }

      Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <img
            src={
              user.profileImage ||
              user.avatar ||
              "https://via.placeholder.com/120"
            }
            alt="Profile"
            className="profile-avatar"
          />
          <div className="profile-status">
            <span className="status-dot"></span>
            <span className="status-text">Online</span>
          </div>
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {user.email}
          </p>
          <div className="profile-actions">
            <button
              className="action-button edit-profile"
              onClick={() => setIsEditing(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit Profile
            </button>
            <button
              className="action-button leave-request"
              onClick={() => navigate("/leaveRequest")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Leave Request
            </button>
            <button
              className="action-button request-status"
              onClick={() => navigate("/leaveStatus")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Request Status
            </button>
            <button className="action-button logout" onClick={handleLogout}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD SECTION */}
      <div className="dashboard-section">
        <h2 className="dashboard-title">Dashboard</h2>
        <div className="dashboard-cards">
          <div className="dashboard-card card-green">
            <div className="dashboard-card-icon">
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div className="dashboard-card-content">
              <div className="dashboard-card-label">Total Exams</div>
              <div className="dashboard-card-value">{totalExams}</div>
            </div>
          </div>
          <div className="dashboard-card card-blue">
            <div className="dashboard-card-icon">
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
            </div>
            <div className="dashboard-card-content">
              <div className="dashboard-card-label">Total Assessments</div>
              <div className="dashboard-card-value">{totalAssessments}</div>
            </div>
          </div>
          <div className="dashboard-card card-purple">
            <div className="dashboard-card-icon">
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#a21caf"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div className="dashboard-card-content">
              <div className="dashboard-card-label">Upcoming Exams</div>
              <div className="dashboard-card-value">{upcomingExams.length}</div>
            </div>
          </div>
          <div className="dashboard-card card-orange">
            <div className="dashboard-card-icon">
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#ea580c"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
            </div>
            <div className="dashboard-card-content">
              <div className="dashboard-card-label">Upcoming Assessments</div>
              <div className="dashboard-card-value">
                {upcomingAssessments.length}
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-lists">
          <div className="dashboard-list">
            <h3>Upcoming Exams</h3>
            {upcomingExams.length === 0 ? (
              <div className="dashboard-list-empty">No upcoming exams.</div>
            ) : (
              <ul>
                {upcomingExams.map((exam) => (
                  <li key={exam._id} className="dashboard-list-item">
                    <span className="dashboard-list-title">{exam.title}</span>
                    <span className="dashboard-list-date">
                      {formatDate(exam.date)} | {formatTime(exam.startTime)} -{" "}
                      {formatTime(exam.endTime)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="dashboard-list">
            <h3>Upcoming Assessments</h3>
            {upcomingAssessments.length === 0 ? (
              <div className="dashboard-list-empty">
                No upcoming assessments.
              </div>
            ) : (
              <ul>
                {upcomingAssessments.map((assessment) => (
                  <li key={assessment._id} className="dashboard-list-item">
                    <span className="dashboard-list-title">
                      {assessment.title}
                    </span>
                    <span className="dashboard-list-date">
                      {formatDate(assessment.date)} |{" "}
                      {formatTime(assessment.startTime)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="schedule-container">
        <div className="schedule-card">
          <div className="schedule-card-header">
            <h2 className="schedule-title">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Exams Schedule
            </h2>
            <button
              className="add-exam-button"
              onClick={() => {
                setEditingExam(null);
                setNewExam({
                  title: "",
                  subject: "",
                  class: "",
                  date: "",
                  startTime: "",
                  endTime: "",
                  location: "",
                  description: "",
                });
                setIsExamModalOpen(true);
              }}
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
              Add Exam
            </button>
          </div>
          <ul className="schedule-list">
            {exams.map((exam) => (
              <li key={exam._id} className="schedule-item">
                <div className="schedule-item-header">
                  <h3 className="schedule-item-title">{exam.title}</h3>
                  <div className="schedule-item-actions">
                    {exam.rescheduleRequest && (
                      <span className="reschedule-status pending">
                        Reschedule Pending
                      </span>
                    )}
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDeleteExam(exam._id)}
                      title="Delete Exam"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <button
                      className="action-button download-button"
                      onClick={() => handleDownloadExam(exam)}
                      title="Download Exam Details"
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                    <button
                      className="action-button update-button"
                      onClick={() => handleUpdateExam(exam)}
                      title="Update Exam"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      className="action-button reschedule-button"
                      onClick={() => handleRescheduleClick(exam)}
                      title="Request Reschedule"
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="schedule-item-details">
                  <div className="schedule-item-date">
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
                    {formatDate(exam.date)} | {formatTime(exam.startTime)} -{" "}
                    {formatTime(exam.endTime)}
                  </div>
                  <div className="schedule-item-location">
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
                  <p className="schedule-item-description">
                    {exam.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="schedule-card">
          <div className="schedule-card-header">
            <h2 className="schedule-title">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Assessments Schedule
            </h2>
            <button
              className="add-exam-button"
              onClick={() => {
                setEditingAssessment(null);
                setNewAssessment({
                  title: "",
                  subject: "",
                  class: "",
                  date: "",
                  startTime: "",
                  duration: "",
                  type: "Quiz",
                });
                setIsAssessmentModalOpen(true);
              }}
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
              Add Assessment
            </button>
          </div>
          <ul className="schedule-list">
            {assessments.map((assessment) => (
              <li key={assessment._id} className="schedule-item">
                <div className="schedule-item-header">
                  <h3 className="schedule-item-title">{assessment.title}</h3>
                  <div className="schedule-item-actions">
                    {assessment.rescheduleRequest && (
                      <span className="reschedule-status pending">
                        Reschedule Pending
                      </span>
                    )}
                    <button
                      className="action-button delete-button"
                      onClick={() => handleDeleteAssessment(assessment._id)}
                      title="Delete Assessment"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <button
                      className="action-button download-button"
                      onClick={() => handleDownloadAssessment(assessment)}
                      title="Download Assessment Details"
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                    <button
                      className="action-button update-button"
                      onClick={() => handleUpdateAssessment(assessment)}
                      title="Update Assessment"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      className="action-button reschedule-button"
                      onClick={() => handleRescheduleClick(assessment)}
                      title="Request Reschedule"
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="schedule-item-details">
                  <div className="schedule-item-date">
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
                    {formatDate(assessment.date)} |{" "}
                    {formatTime(assessment.startTime)}
                  </div>
                  <div className="schedule-item-details">
                    <span>Duration: {assessment.duration}</span>
                    <span>Type: {assessment.type}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isEditing && (
        <div className="edit-profile-modal">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsEditing(false)}>
              ×
            </button>
            <h2 className="modal-title">Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Profile Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={editForm.profileImage}
                  onChange={(e) =>
                    setEditForm({ ...editForm, profileImage: e.target.value })
                  }
                  placeholder="Paste a profile image URL"
                />
                {editForm.profileImage && (
                  <div style={{ marginTop: 8, textAlign: "center" }}>
                    <img
                      src={editForm.profileImage}
                      alt="Profile Preview"
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #10b981",
                      }}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={editForm.currentPassword}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={editForm.newPassword}
                  onChange={(e) =>
                    setEditForm({ ...editForm, newPassword: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExamModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => {
                setIsExamModalOpen(false);
                setEditingExam(null);
                setNewExam({
                  title: "",
                  subject: "",
                  class: "",
                  date: "",
                  startTime: "",
                  endTime: "",
                  location: "",
                  description: "",
                });
              }}
            >
              ×
            </button>
            <h2 className="modal-title">
              {editingExam ? "Update Exam" : "Add New Exam"}
            </h2>
            <form onSubmit={handleExamSubmit}>
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
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  name="subject"
                  className="form-input"
                  value={newExam.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <input
                  type="text"
                  name="class"
                  className="form-input"
                  value={newExam.class}
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
                  onClick={() => {
                    setIsExamModalOpen(false);
                    setEditingExam(null);
                    setNewExam({
                      title: "",
                      subject: "",
                      class: "",
                      date: "",
                      startTime: "",
                      endTime: "",
                      location: "",
                      description: "",
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {editingExam ? "Update Exam" : "Add Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssessmentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => {
                setIsAssessmentModalOpen(false);
                setEditingAssessment(null);
                setNewAssessment({
                  title: "",
                  subject: "",
                  class: "",
                  date: "",
                  startTime: "",
                  duration: "",
                  type: "Quiz",
                });
              }}
            >
              ×
            </button>
            <h2 className="modal-title">
              {editingAssessment ? "Update Assessment" : "Add New Assessment"}
            </h2>
            <form onSubmit={handleAssessmentSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  value={newAssessment.title}
                  onChange={handleAssessmentInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  name="subject"
                  className="form-input"
                  value={newAssessment.subject}
                  onChange={handleAssessmentInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Class</label>
                <input
                  type="text"
                  name="class"
                  className="form-input"
                  value={newAssessment.class}
                  onChange={handleAssessmentInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  name="date"
                  className="form-input"
                  value={newAssessment.date}
                  onChange={handleAssessmentInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  className="form-input"
                  value={newAssessment.startTime}
                  onChange={handleAssessmentInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  name="duration"
                  className="form-input"
                  value={newAssessment.duration}
                  onChange={handleAssessmentInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  name="type"
                  className="form-input"
                  value={newAssessment.type}
                  onChange={handleAssessmentInputChange}
                  required
                >
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Project">Project</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setIsAssessmentModalOpen(false);
                    setEditingAssessment(null);
                    setNewAssessment({
                      title: "",
                      subject: "",
                      class: "",
                      date: "",
                      startTime: "",
                      duration: "",
                      type: "Quiz",
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {editingAssessment ? "Update Assessment" : "Add Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedExam && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => {
                setShowRescheduleModal(false);
                setSelectedExam(null);
                setNewDateTime("");
              }}
            >
              ×
            </button>
            <h2 className="modal-title">Request Reschedule</h2>
            <div className="current-schedule">
              <h3>Current Schedule</h3>
              <p>Date: {formatDate(selectedExam.date)}</p>
              <p>Time: {formatTime(selectedExam.startTime)}</p>
              {selectedExam.endTime && (
                <p>End Time: {formatTime(selectedExam.endTime)}</p>
              )}
              {selectedExam.location && (
                <p>Location: {selectedExam.location}</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">New Date and Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedExam(null);
                  setNewDateTime("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="save-button"
                onClick={handleRescheduleSubmit}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
