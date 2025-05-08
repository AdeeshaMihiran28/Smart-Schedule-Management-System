import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/admin.css";

const LeaveRequestsManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
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

      console.log("Fetching leave requests...");
      const response = await axios.get("http://localhost:2021/api/leaves/all", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response:", response.data);

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid response format");
      }

      setLeaveRequests(response.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message || "Failed to fetch leave requests",
        });
      }
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.put(
        `http://localhost:2021/api/leaves/${requestId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setLeaveRequests((prevRequests) =>
        prevRequests.map((request) =>
          request._id === requestId ? response.data : request
        )
      );

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Leave request ${newStatus.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.error("Error updating leave request:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update leave request",
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Leave Requests</h1>
        <button className="back-button" onClick={() => navigate("/admin")}>
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
          Back to Dashboard
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Request Type</th>
              <th>Number of Days</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.map((request) => (
              <tr key={request._id}>
                <td>{request.user?.name || "N/A"}</td>
                <td>{request.requestType}</td>
                <td>{request.numberOfDays}</td>
                <td>
                  {request.dates.map((date) => formatDate(date)).join(", ")}
                </td>
                <td>{request.reason}</td>
                <td>
                  <span
                    className={`status-badge ${request.status.toLowerCase()}`}
                  >
                    {request.status}
                  </span>
                </td>
                <td>
                  {request.status === "PENDING" && (
                    <div className="action-buttons">
                      <button
                        className="accept-button"
                        onClick={() =>
                          handleStatusUpdate(request._id, "APPROVED")
                        }
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Accept
                      </button>
                      <button
                        className="decline-button"
                        onClick={() =>
                          handleStatusUpdate(request._id, "REJECTED")
                        }
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Decline
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveRequestsManagement;
