import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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

  /*
  |--------------------------------------------------------------------------
  | INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | ROLE REDIRECT
  |--------------------------------------------------------------------------
  */

  const redirectUser = (user) => {
    const role = user?.role;

    console.log("LOGIN ROLE:", role);

    switch (role) {
      case "passenger":
        navigate("/passenger/dashboard", {
          replace: true,
        });
        return;

      case "driver":
        navigate("/driver/dashboard", {
          replace: true,
        });
        return;

      case "admin":
        navigate("/admin/dashboard", {
          replace: true,
        });
        return;

      default:
        console.error("Unknown user role:", role);

        setError(
          "Your account role is not recognized. Please contact support.",
        );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);

      const data = response.data;

      console.log("LOGIN RESPONSE:", data);

      if (!data?.success) {
        throw new Error(data?.message || "Login failed.");
      }

      if (!data?.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned.",
        );
      }

      if (!data?.user) {
        throw new Error(
          "Login succeeded but no user information was returned.",
        );
      }

      login(data.token, data.user);

      redirectUser(data.user);
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Login failed. Please check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      {/* Background decoration */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-120 w-120 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="absolute -bottom-48 -right-40 h-128 w-lg rounded-full bg-cyan-500/10 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* =====================================================
              LEFT PANEL
          ====================================================== */}

          <div className="relative hidden min-h-170 overflow-hidden bg-slate-950 p-10 text-white lg:block xl:p-12">
            <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative flex h-full flex-col">
              {/* Logo */}

              <Link to="/" className="group flex w-fit items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-emerald-400">
                  <MapPin size={21} strokeWidth={2.6} />

                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-300" />
                </div>

                <div>
                  <p className="text-lg font-black tracking-tight">Gontobbo</p>

                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Move smarter
                  </p>
                </div>
              </Link>

              {/* Main content */}

              <div className="my-auto py-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  <Sparkles size={13} />
                  Welcome back
                </div>

                <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight xl:text-5xl">
                  Your next journey
                  <br />
                  <span className="text-slate-400">is waiting.</span>
                </h1>

                <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
                  Sign in to book rides, manage your journeys and continue
                  moving with Gontobbo.
                </p>

                {/* Features */}

                <div className="mt-10 space-y-4">
                  {[
                    {
                      icon: Check,
                      text: "Access your ride history",
                    },
                    {
                      icon: ShieldCheck,
                      text: "Secure account access",
                    },
                    {
                      icon: MapPin,
                      text: "Continue your journey anytime",
                    },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <Icon size={14} strokeWidth={2.5} />
                      </div>

                      <span className="text-sm font-medium text-slate-300">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom */}

              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-300">
                      Safe & secure
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Your account is protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              RIGHT / LOGIN FORM
          ====================================================== */}

          <div className="relative flex items-center p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="mx-auto w-full max-w-md">
              {/* Mobile logo */}

              <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                  <MapPin size={19} />

                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-300" />
                </div>

                <div>
                  <p className="font-black tracking-tight text-slate-950">
                    Gontobbo
                  </p>

                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Move smarter
                  </p>
                </div>
              </Link>

              {/* Header */}

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Welcome back
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Sign in to Gontobbo.
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your details below to access your account and continue
                  your journey.
                </p>
              </div>

              {/* Error */}

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                    !
                  </div>

                  <p className="text-sm font-medium leading-5 text-red-600">
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                {/* Password */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold text-slate-700"
                    >
                      Password
                    </label>

                    <span className="text-[11px] font-medium text-slate-400">
                      Required
                    </span>
                  </div>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing you in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight
                        size={17}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />

                <span className="text-[11px] font-medium text-slate-400">
                  New to Gontobbo?
                </span>

                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Register */}

              <Link
                to="/register"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-extrabold text-slate-700 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Create an account
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
                © {new Date().getFullYear()} Gontobbo. Move smarter, travel
                better.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
