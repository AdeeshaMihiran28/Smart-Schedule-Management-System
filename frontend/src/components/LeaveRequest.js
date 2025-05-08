import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/leaveRequest.css";

const LeaveRequest = () => {
  const [formData, setFormData] = useState({
    requestType: "",
    numberOfDays: "",
    reason: "",
    dates: [],
  });
  const [proofDocument, setProofDocument] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        dates: [selectedDate],
      }));
    }
  };

  const handleFileChange = (e) => {
    setProofDocument(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (
      !formData.requestType ||
      !formData.numberOfDays ||
      !formData.reason ||
      formData.dates.length === 0
    ) {
      Swal.fire({
        title: "Validation Error!",
        text: "Please fill in all required fields",
        icon: "warning",
        confirmButtonColor: "#10b981",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const submitData = new FormData();
      submitData.append("requestType", formData.requestType);
      submitData.append("numberOfDays", formData.numberOfDays);
      submitData.append("reason", formData.reason);
      submitData.append("dates", JSON.stringify(formData.dates));
      if (proofDocument) {
        submitData.append("proofDocument", proofDocument);
      }

      const response = await axios.post(
        "http://localhost:2021/api/leaves",
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data) {
        Swal.fire({
          title: "Success!",
          text: "Leave request submitted successfully",
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          navigate("/leaveStatus");
        });
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      Swal.fire({
        title: "Error!",
        text:
          error.response?.data?.message ||
          "Failed to submit leave request. Please try again.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <div className="leave-request-container">
      <div className="leave-request-form-container">
        <h1>Leave Request Form</h1>
        <form onSubmit={handleSubmit} className="leave-request-form">
          <div className="form-group">
            <label className="form-label">Request Type</label>
            <select
              name="requestType"
              value={formData.requestType}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select Request Type</option>
              <option value="half day">Half Day</option>
              <option value="full day">Full Day</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Number of Days</label>
            <input
              type="number"
              name="numberOfDays"
              value={formData.numberOfDays}
              onChange={handleInputChange}
              className="form-input"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              onChange={handleDateChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="form-input"
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Proof Document (Optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="form-input"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/profile")}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequest;
