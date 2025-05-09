import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/admin.css";

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExams: 0,
    totalLeaveRequests: 0,
    pendingLeaveRequests: 0,
  });
  const [rescheduleRequests, setRescheduleRequests] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("isAdmin");

    if (!token || isAdmin !== "true") {
      navigate("/login");
      return;
    }

    // Fetch admin dashboard data
    const fetchAdminData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:2021/api/admin/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("isAdmin");
          navigate("/login");
        } else {
          alert("An error occurred while fetching data.");
        }
      }
    };

    fetchAdminData();
    fetchRescheduleRequests();
  }, [navigate]);

  const fetchRescheduleRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      console.log("Fetching reschedule requests...");

      const [examsResponse, assessmentsResponse] = await Promise.all([
        axios.get("http://localhost:2021/api/exams/reschedule-requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:2021/api/assessments/reschedule-requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      console.log("Exams response:", examsResponse.data);
      console.log("Assessments response:", assessmentsResponse.data);

      const allRequests = [
        ...examsResponse.data.map((exam) => ({
          ...exam,
          type: "exam",
          requestedDate: exam.requestedDate || exam.date,
          requestedTime: exam.requestedTime || exam.startTime,
        })),
        ...assessmentsResponse.data.map((assessment) => ({
          ...assessment,
          type: "assessment",
          requestedDate: assessment.requestedDate || assessment.date,
          requestedTime: assessment.requestedTime || assessment.startTime,
        })),
      ];

      console.log("Combined requests:", allRequests);
      setRescheduleRequests(allRequests);
    } catch (error) {
      console.error("Error fetching reschedule requests:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      } else {
        alert("An error occurred while fetching reschedule requests.");
      }
    }
  };

  const handleRescheduleAction = async (requestId, action, type) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        type === "exam"
          ? `http://localhost:2021/api/admin/exams/${requestId}/reschedule`
          : `http://localhost:2021/api/admin/assessments/${requestId}/reschedule`;

      await axios.post(
        endpoint,
        { action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh the requests list
      fetchRescheduleRequests();
    } catch (error) {
      console.error("Error handling reschedule action:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
      } else {
        alert("An error occurred while processing the reschedule action.");
      }
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

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-header-buttons">
          <button className="back-button" onClick={() => navigate("/profile")}>
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Profile
          </button>
          <button className="logout-button" onClick={handleLogout}>
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

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="stat-info">
            <h3>Total Exams</h3>
            <p>{stats.totalExams}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
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
          </div>
          <div className="stat-info">
            <h3>Total Leave Requests</h3>
            <p>{stats.totalLeaveRequests}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-info">
            <h3>Pending Requests</h3>
            <p>{stats.pendingLeaveRequests}</p>
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <button
          className="admin-action-button"
          onClick={() => navigate("/admin/users")}
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          Manage Users
        </button>
        <button
          className="admin-action-button"
          onClick={() => navigate("/admin/exams")}
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Manage Exams
        </button>
        <button
          className="admin-action-button"
          onClick={() => navigate("/admin/leaves")}
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
          Manage Leave Requests
        </button>
      </div>

      {/* Reschedule Requests Section */}
      <div className="reschedule-requests-section">
        <h2>Reschedule Requests</h2>
        <div className="requests-list">
          {rescheduleRequests.length === 0 ? (
            <p className="no-requests">No pending reschedule requests</p>
          ) : (
            rescheduleRequests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <h3>{request.title}</h3>
                  <span className={`request-type ${request.type}`}>
                    {request.type === "exam" ? "Exam" : "Assessment"}
                  </span>
                </div>
                <div className="request-details">
                  <p>
                    <strong>Subject:</strong> {request.subject}
                  </p>
                  <p>
                    <strong>Class:</strong> {request.class}
                  </p>
                  <p>
                    <strong>Current Schedule:</strong>{" "}
                    {formatDate(request.date)} at{" "}
                    {formatTime(request.startTime)}
                  </p>
                  <p>
                    <strong>Requested Schedule:</strong>{" "}
                    {formatDate(request.requestedDate)} at{" "}
                    {formatTime(request.requestedTime)}
                  </p>
                  {request.location && (
                    <p>
                      <strong>Location:</strong> {request.location}
                    </p>
                  )}
                </div>
                <div className="request-actions">
                  <button
                    className="accept-button"
                    onClick={() =>
                      handleRescheduleAction(
                        request._id,
                        "accept",
                        request.type
                      )
                    }
                  >
                    Accept
                  </button>
                  <button
                    className="decline-button"
                    onClick={() =>
                      handleRescheduleAction(
                        request._id,
                        "decline",
                        request.type
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
