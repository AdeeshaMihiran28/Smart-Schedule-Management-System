// frontend/src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import Exams from "./components/Exams";
import LeaveRequest from "./components/LeaveRequest"; // Import LeaveRequest component
import LeaveStatus from "./components/LeaveStatus";
import Admin from "./components/Admin";
import UsersManagement from "./components/admin/UsersManagement";
import ExamsManagement from "./components/admin/ExamsManagement";
import LeaveRequestsManagement from "./components/admin/LeaveRequestsManagement";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams"
            element={
              <ProtectedRoute>
                <Exams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaveRequest"
            element={
              <ProtectedRoute>
                <LeaveRequest />
              </ProtectedRoute>
            }
          />{" "}
          {/* New leave request route */}
          <Route
            path="/leaveStatus"
            element={
              <ProtectedRoute>
                <LeaveStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UsersManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute>
                <ExamsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaves"
            element={
              <ProtectedRoute>
                <LeaveRequestsManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
