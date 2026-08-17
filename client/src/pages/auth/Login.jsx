import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Navigation } from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);

      const data = response.data;

      console.log("LOGIN RESPONSE:", data);

      /*
      |--------------------------------------------------------------------------
      | Store authentication
      |--------------------------------------------------------------------------
      */

      login(data.token, data.user);

      /*
      |--------------------------------------------------------------------------
      | Redirect based on role
      |--------------------------------------------------------------------------
      */

      const role = data.user?.role;

      if (role === "driver") {
        navigate("/driver/dashboard", {
          replace: true,
        });
      } else if (role === "admin") {
        navigate("/admin/dashboard", {
          replace: true,
        });
      } else {
        /*
        |--------------------------------------------------------------------------
        | Passenger
        |--------------------------------------------------------------------------
        */

        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error?.response?.data?.message ||
          "Login failed. Please check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="w-full">
          {/* Logo */}

          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-950">
                <Navigation size={21} />
              </div>

              <span className="text-xl font-bold text-white">Gontobbo</span>
            </Link>
          </div>

          {/* Card */}

          <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Welcome back
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Sign in to Gontobbo
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access your rides and manage your journey.
              </p>
            </div>

            {/* Error */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-950 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {/* Register */}

            <p className="mt-7 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-slate-950 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            © 2026 Gontobbo. Move with purpose.
          </p>
        </div>
      </div>
    </div>
  );
}
