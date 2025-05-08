import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/admin.css";

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExamsAndRequests();
  }, []);

  const fetchExamsAndRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const [examsResponse, requestsResponse] = await Promise.all([
        axios.get("http://localhost:2021/api/admin/exams", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:2021/api/admin/reschedule-requests", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setExams(examsResponse.data);
      setRescheduleRequests(requestsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
      setLoading(false);
    }
  };

  const handleRescheduleRequest = async (requestId, action) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:2021/api/admin/reschedule-requests/${requestId}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Swal.fire({
        title: "Success!",
        text: `Reschedule request ${action}ed successfully`,
        icon: "success",
        confirmButtonColor: "#10b981",
      });

      fetchExamsAndRequests(); // Refresh the data
    } catch (error) {
      console.error("Error handling reschedule request:", error);
      Swal.fire({
        title: "Error!",
        text: `Failed to ${action} reschedule request`,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Exam Management</h1>
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

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          <div className="section">
            <h2>Reschedule Requests</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Current Schedule</th>
                    <th>Requested Schedule</th>
                    <th>Requested By</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rescheduleRequests.map((request) => (
                    <tr key={request._id}>
                      <td>{request.exam.title}</td>
                      <td>
                        {new Date(request.currentDateTime).toLocaleString()}
                      </td>
                      <td>{new Date(request.newDateTime).toLocaleString()}</td>
                      <td>{request.requestedBy.name}</td>
                      <td>
                        <span className="status-badge pending">
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="accept-button"
                            onClick={() =>
                              handleRescheduleRequest(request._id, "approve")
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
                            Approve
                          </button>
                          <button
                            className="decline-button"
                            onClick={() =>
                              handleRescheduleRequest(request._id, "reject")
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
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section">
            <h2>All Exams</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Schedule</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam._id}>
                      <td>{exam.title}</td>
                      <td>{new Date(exam.dateTime).toLocaleString()}</td>
                      <td>
                        {exam.rescheduleRequest ? (
                          <span className="status-badge pending">
                            Reschedule Pending
                          </span>
                        ) : (
                          <span className="status-badge approved">
                            Scheduled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamManagement;
