import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/admin.css";

const ExamsManagement = () => {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:2021/api/exams/all", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setExams(response.data);
      } else {
        console.error("Invalid response format:", response.data);
        Swal.fire("Error", "Failed to fetch exams data", "error");
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        Swal.fire("Error", "Failed to fetch exams", "error");
      }
    }
  };

  const handleDeleteExam = async (examId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:2021/api/exams/${examId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        Swal.fire("Deleted!", "Exam has been deleted.", "success");

        fetchExams();
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      Swal.fire("Error!", "Failed to delete exam.", "error");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Exams</h1>
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
              <th>Title</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Time</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam._id}>
                <td>{exam.student?.name || "N/A"}</td>
                <td>{exam.title}</td>
                <td>{exam.subject}</td>
                <td>{new Date(exam.date).toLocaleDateString()}</td>
                <td>{`${exam.startTime} - ${exam.endTime}`}</td>
                <td>{exam.location}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteExam(exam._id)}
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamsManagement;
