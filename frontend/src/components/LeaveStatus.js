import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/leaveStatus.css";

const LeaveStatus = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:2021/api/leaves", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLeaveRequests(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setError("Failed to fetch leave requests. Please try again.");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-badge approved";
      case "rejected":
        return "status-badge rejected";
      default:
        return "status-badge pending";
    }
  };

  if (loading) {
    return (
      <div className="leave-status-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-status-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="leave-status-container">
      <div className="leave-status-header">
        <h1>Leave Request Status</h1>
        <button
          className="new-request-button"
          onClick={() => navigate("/leaveRequest")}
        >
          New Request
        </button>
      </div>

      <div className="leave-status-table-container">
        {leaveRequests.length > 0 ? (
          <table className="leave-status-table">
            <thead>
              <tr>
                <th>Request Type</th>
                <th>Number of Days</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Proof Document</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.requestType}</td>
                  <td>{request.numberOfDays}</td>
                  <td>
                    {Array.isArray(request.dates)
                      ? request.dates.map((date) => formatDate(date)).join(", ")
                      : formatDate(request.dates)}
                  </td>
                  <td>{request.reason}</td>
                  <td>
                    <span className={getStatusBadgeClass(request.status)}>
                      {request.status || "Pending"}
                    </span>
                  </td>
                  <td>
                    {request.proofDocument ? (
                      <a
                        href={`http://localhost:2021/${request.proofDocument}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        View Document
                      </a>
                    ) : (
                      "No document"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-requests">
            <p>No leave requests found.</p>
            <button
              className="new-request-button"
              onClick={() => navigate("/leaveRequest")}
            >
              Submit New Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveStatus;
