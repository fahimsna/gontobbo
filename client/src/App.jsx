import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PassengerDashboard from "./pages/passenger/PassengerDashboard";

function Placeholder({ title }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{title}</h1>

        <p className="mt-2 text-slate-500">This page is coming next.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/passenger"
            element={<Placeholder title="Passenger Dashboard" />}
          />

          <Route
            path="/driver"
            element={<Placeholder title="Driver Dashboard" />}
          />

          <Route
            path="/admin"
            element={<Placeholder title="Admin Dashboard" />}
          />
          <Route path="/passenger" element={<PassengerDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
