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
import Exam from "./components/Exam";
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

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (!token || !isAdmin) {
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
                <Exam />
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
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <AdminRoute>
                <ExamsManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/leaves"
            element={
              <AdminRoute>
                <LeaveRequestsManagement />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
