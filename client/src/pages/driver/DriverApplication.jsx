import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import api from "../../services/api";

export default function DriverApplication() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    licenseNumber: "",
    vehicleType: "car",
    vehicleModel: "",
    vehicleNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");

    if (!form.licenseNumber || !form.vehicleModel || !form.vehicleNumber) {
      setError("Please complete all required fields.");

      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/drivers/apply", form);

      setSuccess(
        response.data.message || "Driver application submitted successfully.",
      );

      setTimeout(() => {
        navigate("/driver");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit driver application.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}

      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500">
              <Car size={19} />
            </div>

            <span className="font-bold">Gontobbo</span>
          </div>
        </div>
      </header>

      {/* Content */}

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
            <ShieldCheck size={16} />
            Become a Gontobbo Driver
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Start driving with Gontobbo
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Submit your driver information. An administrator will review your
            application before you can accept passenger rides.
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8"
        >
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText size={21} />
            </div>

            <div>
              <h2 className="font-semibold">Driver information</h2>

              <p className="text-sm text-slate-500">
                Enter your vehicle and license details.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* License */}

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Driving License Number
              </label>

              <input
                name="licenseNumber"
                value={form.licenseNumber}
                onChange={handleChange}
                placeholder="Enter your license number"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
              />
            </div>

            {/* Vehicle type */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Vehicle Type
              </label>

              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-500"
              >
                <option value="car">Car</option>

                <option value="motorcycle">Motorcycle</option>

                <option value="cng">CNG</option>
              </select>
            </div>

            {/* Vehicle model */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Vehicle Model
              </label>

              <input
                name="vehicleModel"
                value={form.vehicleModel}
                onChange={handleChange}
                placeholder="e.g. Toyota Axio"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
              />
            </div>

            {/* Vehicle number */}

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Vehicle Registration Number
              </label>

              <input
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={handleChange}
                placeholder="e.g. DHAKA METRO-GA-12-3456"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white uppercase outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <CheckCircle2 size={18} />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
