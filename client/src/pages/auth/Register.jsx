import { useState } from "react";

import {
  ArrowRight,
  Car,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "passenger",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const selectRole = (role) => {
    setFormData((previous) => ({
      ...previous,
      role,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");

      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    try {
      setLoading(true);

      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      });

      if (formData.role === "driver") {
        navigate("/driver/apply");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

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

          <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block xl:p-12">
            {/* Decorative elements */}

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
                  Your next journey starts here
                </div>

                <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight xl:text-5xl">
                  One account.
                  <br />
                  <span className="text-slate-400">Every journey.</span>
                </h1>

                <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
                  Join Gontobbo to book rides, track your journeys and move
                  around with confidence.
                </p>

                {/* Features */}

                <div className="mt-10 space-y-4">
                  {[
                    "Quick and simple ride booking",
                    "Live driver and journey tracking",
                    "Transparent fares and ride history",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <Check size={14} strokeWidth={3} />
                      </div>

                      <span className="text-sm font-medium text-slate-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom */}

              <div className="flex items-center gap-3 border-t border-white/10 pt-6">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-slate-950 bg-emerald-400" />

                  <div className="h-8 w-8 rounded-full border-2 border-slate-950 bg-cyan-400" />

                  <div className="h-8 w-8 rounded-full border-2 border-slate-950 bg-amber-400" />
                </div>

                <p className="text-xs text-slate-500">
                  Built for smarter everyday travel.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
              RIGHT / REGISTRATION FORM
          ====================================================== */}

          <div className="relative p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="mx-auto max-w-md">
              {/* Mobile logo */}

              <Link to="/" className="mb-9 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                  <MapPin size={19} />
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
                  Create your account
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Join Gontobbo.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose how you want to use Gontobbo and get started in just a
                  few moments.
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

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* =================================================
                    ROLE SELECTION
                ================================================== */}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">
                      How will you use Gontobbo?
                    </label>

                    <span className="text-[11px] font-medium text-slate-400">
                      Select one
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Passenger */}

                    <button
                      type="button"
                      onClick={() => selectRole("passenger")}
                      className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        formData.role === "passenger"
                          ? "border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
                      }`}
                    >
                      {formData.role === "passenger" && (
                        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      )}

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                          formData.role === "passenger"
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                        }`}
                      >
                        <MapPin size={19} />
                      </div>

                      <p className="mt-4 text-sm font-extrabold text-slate-900">
                        Ride
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Book rides as a passenger
                      </p>
                    </button>

                    {/* Driver */}

                    <button
                      type="button"
                      onClick={() => selectRole("driver")}
                      className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        formData.role === "driver"
                          ? "border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
                      }`}
                    >
                      {formData.role === "driver" && (
                        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      )}

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                          formData.role === "driver"
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                        }`}
                      >
                        <Car size={19} />
                      </div>

                      <p className="mt-4 text-sm font-extrabold text-slate-900">
                        Drive
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Apply to become a driver
                      </p>
                    </button>
                  </div>
                </div>

                {/* =================================================
                    NAME
                ================================================== */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Full name
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                      className={inputClassName}
                    />
                  </div>
                </div>

                {/* =================================================
                    EMAIL
                ================================================== */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className={inputClassName}
                    />
                  </div>
                </div>

                {/* =================================================
                    PHONE
                ================================================== */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Phone number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      className={inputClassName}
                    />
                  </div>
                </div>

                {/* =================================================
                    PASSWORD
                ================================================== */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-emerald-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* =================================================
                    CONFIRM PASSWORD
                ================================================== */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Confirm password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Repeat your password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((previous) => !previous)
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-emerald-600"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    Use at least 6 characters for your password.
                  </p>
                </div>

                {/* =================================================
                    SUBMIT
                ================================================== */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating your account...
                    </>
                  ) : (
                    <>
                      {formData.role === "driver"
                        ? "Create driver account"
                        : "Create passenger account"}

                      <ArrowRight
                        size={17}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Sign in */}

              <div className="mt-7 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-extrabold text-emerald-600 transition hover:text-emerald-700 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
