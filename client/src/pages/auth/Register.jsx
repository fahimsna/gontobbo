import { useState } from "react";

import { Car, Check, Lock, Mail, MapPin, Phone, User } from "lucide-react";

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

  /*
  |--------------------------------------------------------------------------
  | Input handler
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    /*
      |--------------------------------------------------------------------------
      | Password validation
      |--------------------------------------------------------------------------
      */

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

      /*
        |--------------------------------------------------------------------------
        | Redirect based on role
        |--------------------------------------------------------------------------
        */

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

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
          {/* Left */}

          <div className="hidden bg-slate-900 p-10 text-white lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-950">
                <MapPin size={22} />
              </div>

              <div>
                <p className="text-lg font-bold">Gontobbo</p>

                <p className="text-xs text-slate-400">
                  Your journey, simplified.
                </p>
              </div>
            </div>

            <div className="mt-24">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
                Get started
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Move around
                <br />
                Dhaka with
                <br />
                confidence.
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
                Create your Gontobbo account and make your next journey easier.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  "Fast ride booking",
                  "Real-time driver tracking",
                  "Transparent fares",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-950">
                      <Check size={14} />
                    </div>

                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}

          <div className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <div className="mb-5 flex items-center gap-3 lg:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <MapPin size={20} />
                  </div>

                  <span className="font-bold">Gontobbo</span>
                </div>

                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Create account
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Join Gontobbo
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Choose how you want to use Gontobbo.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role */}

                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    I want to
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((previous) => ({
                          ...previous,
                          role: "passenger",
                        }))
                      }
                      className={`rounded-2xl border-2 p-4 text-left transition ${
                        formData.role === "passenger"
                          ? "border-slate-950 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <MapPin size={21} />

                        {formData.role === "passenger" && <Check size={18} />}
                      </div>

                      <p className="mt-3 text-sm font-bold">Ride</p>

                      <p className="mt-1 text-xs text-slate-400">Book rides</p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((previous) => ({
                          ...previous,
                          role: "driver",
                        }))
                      }
                      className={`rounded-2xl border-2 p-4 text-left transition ${
                        formData.role === "driver"
                          ? "border-slate-950 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Car size={21} />

                        {formData.role === "driver" && <Check size={18} />}
                      </div>

                      <p className="mt-3 text-sm font-bold">Drive</p>

                      <p className="mt-1 text-xs text-slate-400">
                        Become a driver
                      </p>
                    </button>
                  </div>
                </div>

                {/* Name */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full name
                  </label>

                  <div className="relative">
                    <User
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-slate-950 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Email */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-slate-950 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Phone */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone
                  </label>

                  <div className="relative">
                    <Phone
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-slate-950 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Password */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-slate-950 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Confirm */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm password
                  </label>

                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Repeat your password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-slate-950 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-950 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Creating account..."
                    : formData.role === "driver"
                      ? "Create driver account"
                      : "Create passenger account"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-slate-950 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
