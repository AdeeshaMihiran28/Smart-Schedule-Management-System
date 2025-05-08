import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/admin.css";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login");
        navigate("/login");
        return;
      }

      console.log("Fetching users with token:", token.substring(0, 10) + "...");

      const response = await axios.get("http://localhost:2021/api/auth/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response received:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error("Invalid response format:", response.data);
        Swal.fire({
          title: "Error",
          text: "Invalid data format received from server",
          icon: "error",
          confirmButtonColor: "#dc2626",
        });
      }
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);

        if (error.response.status === 401) {
          console.log("Unauthorized access, redirecting to login");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          Swal.fire({
            title: "Error",
            text:
              error.response.data?.message ||
              `Server error: ${error.response.status}`,
            icon: "error",
            confirmButtonColor: "#dc2626",
          });
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received from server");
        Swal.fire({
          title: "Connection Error",
          text: "Unable to connect to the server. Please check if the server is running.",
          icon: "error",
          confirmButtonColor: "#dc2626",
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request setup error:", error.message);
        Swal.fire({
          title: "Error",
          text: "Failed to make the request. Please try again.",
          icon: "error",
          confirmButtonColor: "#dc2626",
        });
      }
    }
  };

  const handleDeleteUser = async (userId) => {
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
        if (!token) {
          navigate("/login");
          return;
        }

        await axios.delete(`http://localhost:2021/api/auth/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        Swal.fire({
          title: "Deleted!",
          text: "User has been deleted.",
          icon: "success",
          confirmButtonColor: "#10b981",
        });

        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      Swal.fire({
        title: "Error!",
        text: error.response?.data?.message || "Failed to delete user.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Users</h1>
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
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteUser(user._id)}
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

export default UsersManagement;
