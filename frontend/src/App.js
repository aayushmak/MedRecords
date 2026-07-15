import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import PatientDashboard from "./pages/Patient/PatientDashboard";
import UploadRecord from "./pages/Patient/UploadRecord";
import AccessRequests from "./pages/Patient/AccessRequests";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import RequestAccess from "./pages/Doctor/RequestAccess";
import ViewRecords from "./pages/Doctor/ViewRecords";
import AdminDashboard from "./pages/Admin/AdminDashboard";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "doctor") return <Navigate to="/doctor" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/patient" replace />;
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Shell><Home /></Shell>} />

          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Shell><PatientDashboard /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/upload"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Shell><UploadRecord /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/requests"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <Shell><AccessRequests /></Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <Shell><DoctorDashboard /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/request"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <Shell><RequestAccess /></Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/records/:patientId"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <Shell><ViewRecords /></Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Shell><AdminDashboard /></Shell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
