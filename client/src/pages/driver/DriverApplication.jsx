import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Info,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

const DriverApplication = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    licenseNumber: "",
    licenseExpiry: "",
    vehicleType: "car",
    vehicleModel: "",
    registrationNumber: "",
  });

  const [existingDriver, setExistingDriver] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | CHECK EXISTING DRIVER APPLICATION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const checkExistingApplication = async () => {
      try {
        setCheckingStatus(true);

        const response = await api.get("/drivers/me");

        if (!mounted) return;

        const driver = response.data?.driver || null;

        setExistingDriver(driver);

        /*
         * Populate the form when a rejected application
         * is being resubmitted.
         */

        if (driver?.status === "rejected") {
          setFormData({
            licenseNumber: driver.licenseNumber || "",

            licenseExpiry: driver.licenseExpiry
              ? new Date(driver.licenseExpiry).toISOString().slice(0, 10)
              : "",

            vehicleType: driver.vehicle?.type || "car",

            vehicleModel:
              driver.vehicle?.brand && driver.vehicle.brand !== "Not specified"
                ? `${driver.vehicle.brand} ${driver.vehicle.model || ""}`.trim()
                : driver.vehicle?.model || "",

            registrationNumber: driver.vehicle?.registrationNumber || "",
          });
        }
      } catch (err) {
        /*
         * 404 means the user has never applied.
         */

        if (err?.response?.status === 404) {
          if (mounted) {
            setExistingDriver(null);
          }

          return;
        }

        console.error("Driver application status error:", err);
      } finally {
        if (mounted) {
          setCheckingStatus(false);
        }
      }
    };

    checkExistingApplication();

    return () => {
      mounted = false;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | VEHICLE TYPE
  |--------------------------------------------------------------------------
  */

  const handleVehicleType = (type) => {
    setFormData((previous) => ({
      ...previous,
      vehicleType: type,
    }));

    setError("");
    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | BUILD VEHICLE
  |--------------------------------------------------------------------------
  */

  const buildVehicle = () => {
    const enteredModel = formData.vehicleModel.trim();

    let brand = "Not specified";
    let model = enteredModel;

    const brands = [
      "Toyota",
      "Honda",
      "Yamaha",
      "Suzuki",
      "Kawasaki",
      "Nissan",
      "Mitsubishi",
      "Hyundai",
      "Kia",
      "Bajaj",
      "TVS",
      "Hero",
      "Mahindra",
      "Tata",
      "Royal Enfield",
      "BMW",
      "Mercedes",
      "Audi",
      "Ford",
    ];

    const detectedBrand = brands.find((brandName) =>
      enteredModel.toLowerCase().startsWith(brandName.toLowerCase()),
    );

    if (detectedBrand) {
      brand = detectedBrand;

      model = enteredModel.slice(detectedBrand.length).trim();

      if (!model) {
        model = detectedBrand;
      }
    }

    return {
      type: formData.vehicleType,
      brand,
      model,
      year: new Date().getFullYear(),
      color: "Not specified",
      registrationNumber: formData.registrationNumber.trim().toUpperCase(),
    };
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDATE
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    if (!formData.licenseNumber.trim()) {
      setError("Driving license number is required.");
      return false;
    }

    if (!formData.licenseExpiry) {
      setError("Driving license expiry date is required.");
      return false;
    }

    const expiryDate = new Date(formData.licenseExpiry);

    if (Number.isNaN(expiryDate.getTime())) {
      setError("Please enter a valid license expiry date.");
      return false;
    }

    if (expiryDate <= new Date()) {
      setError("Driving license must not be expired.");
      return false;
    }

    if (!formData.vehicleType) {
      setError("Vehicle type is required.");
      return false;
    }

    if (!formData.vehicleModel.trim()) {
      setError("Vehicle model is required.");
      return false;
    }

    if (!formData.registrationNumber.trim()) {
      setError("Vehicle registration number is required.");
      return false;
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        licenseNumber: formData.licenseNumber.trim().toUpperCase(),

        licenseExpiry: formData.licenseExpiry,

        vehicle: buildVehicle(),
      };

      console.log("DRIVER APPLICATION PAYLOAD:", payload);

      const response = await api.post("/drivers/apply", payload);

      console.log("DRIVER APPLICATION RESPONSE:", response.data);

      setExistingDriver(response.data?.driver || null);

      setSuccess(
        response.data?.message || "Driver application submitted successfully.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Driver application error:", err);

      const message =
        err?.response?.data?.message ||
        "Server error while submitting driver application.";

      setError(message);

      if (err?.response?.data?.driver) {
        setExistingDriver(err.response.data.driver);
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (checkingStatus) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6">
        <BackgroundDecorations />

        <div className="relative text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <MapPin size={28} strokeWidth={2.4} />
          </div>

          <div className="mx-auto mt-7 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Checking your driver application...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | APPROVED
  |--------------------------------------------------------------------------
  */

  if (existingDriver?.status === "approved") {
    return (
      <StatusPage
        icon={<CheckCircle2 size={30} strokeWidth={2.4} />}
        iconClass="bg-emerald-500/10 text-emerald-600"
        badge="Application approved"
        badgeClass="bg-emerald-50 text-emerald-700"
        title={
          <>
            You're already
            <br />
            <span className="text-slate-400">approved.</span>
          </>
        }
        message="Your Gontobbo driver application has already been approved. You can continue to your driver dashboard and start managing your rides."
        buttonText="Go to driver dashboard"
        onButtonClick={() => navigate("/driver/dashboard")}
        buttonClass="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PENDING
  |--------------------------------------------------------------------------
  */

  if (existingDriver?.status === "pending") {
    return (
      <StatusPage
        icon={<Clock3 size={30} strokeWidth={2.4} />}
        iconClass="bg-amber-500/10 text-amber-600"
        badge="Application under review"
        badgeClass="bg-amber-50 text-amber-700"
        title={
          <>
            Your application is
            <br />
            <span className="text-slate-400">under review.</span>
          </>
        }
        message="Your driver application has already been submitted and is waiting for administrator approval. You don't need to submit another application."
        buttonText="Return home"
        onButtonClick={() => navigate("/")}
        buttonClass="bg-slate-950 hover:bg-slate-800 shadow-slate-900/10"
        secondaryInfo={
          <div className="mt-7 rounded-2xl border border-amber-100 bg-amber-50 p-5 text-left">
            <div className="flex gap-3">
              <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-bold text-amber-900">
                  What happens next?
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-800">
                  An administrator will review your information and documents.
                  Your application will then be approved or you'll receive
                  feedback about what needs to be corrected.
                </p>
              </div>
            </div>
          </div>
        }
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SUSPENDED
  |--------------------------------------------------------------------------
  */

  if (existingDriver?.status === "suspended") {
    return (
      <StatusPage
        icon={<AlertCircle size={30} strokeWidth={2.4} />}
        iconClass="bg-orange-500/10 text-orange-600"
        badge="Driver account suspended"
        badgeClass="bg-orange-50 text-orange-700"
        title={
          <>
            Your driver account
            <br />
            <span className="text-slate-400">is suspended.</span>
          </>
        }
        message="Your driver account is currently suspended and cannot operate on Gontobbo. Please contact an administrator before submitting another application."
        buttonText="Return home"
        onButtonClick={() => navigate("/")}
        buttonClass="bg-slate-950 hover:bg-slate-800 shadow-slate-900/10"
        secondaryInfo={
          existingDriver.rejectionReason ? (
            <div className="mt-7 rounded-2xl border border-orange-100 bg-orange-50 p-5 text-left">
              <p className="text-sm font-bold text-orange-900">
                Administrator message
              </p>

              <p className="mt-1 text-sm leading-6 text-orange-800">
                {existingDriver.rejectionReason}
              </p>
            </div>
          ) : null
        }
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | APPLICATION FORM
  |--------------------------------------------------------------------------
  */

  const isResubmission = existingDriver?.status === "rejected";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <BackgroundDecorations />

      <div className="relative mx-auto max-w-6xl">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back
          </button>

          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition group-hover:-translate-y-0.5 group-hover:bg-emerald-400">
              <MapPin size={19} strokeWidth={2.5} />

              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-50 bg-emerald-300" />
            </div>

            <div className="hidden sm:block">
              <p className="font-black tracking-tight text-slate-950">
                Gontobbo
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Move smarter
              </p>
            </div>
          </Link>
        </header>

        {/* =====================================================
            REJECTION MESSAGE
        ====================================================== */}

        {isResubmission && existingDriver.rejectionReason && (
          <div className="mb-8 rounded-3xl border border-red-100 bg-red-50 p-5 sm:p-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle size={20} />
              </div>

              <div>
                <p className="text-sm font-extrabold text-red-900">
                  Administrator feedback
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {existingDriver.rejectionReason}
                </p>

                <p className="mt-2 text-xs font-semibold text-red-600">
                  Correct the information below and submit your application
                  again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {success && (
          <div className="mb-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Check size={21} strokeWidth={3} />
              </div>

              <div>
                <p className="text-sm font-extrabold text-emerald-900">
                  Application submitted
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  {success}
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-3 text-sm font-bold text-emerald-700 underline underline-offset-2 transition hover:text-emerald-900"
                >
                  Return home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            MAIN CARD
        ====================================================== */}

        <div className="grid overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* =====================================================
              LEFT PANEL
          ====================================================== */}

          <section className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-10 lg:min-h-180 xl:p-12">
            <div className="absolute -left-28 top-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="absolute -bottom-32 -right-28 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative flex h-full flex-col">
              {/* Badge */}

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <Sparkles size={13} />

                {isResubmission ? "Application update" : "Drive with Gontobbo"}
              </div>

              {/* Heading */}

              <div className="my-auto py-12 lg:py-20">
                <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
                  {isResubmission ? (
                    <>
                      Update your
                      <br />
                      <span className="text-slate-400">application.</span>
                    </>
                  ) : (
                    <>
                      Start driving
                      <br />
                      <span className="text-slate-400">with Gontobbo.</span>
                    </>
                  )}
                </h1>

                <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
                  {isResubmission
                    ? "Make the requested corrections and give your driver application another try."
                    : "Turn your time on the road into an opportunity. Apply to become a verified Gontobbo driver."}
                </p>

                {/* Benefits */}

                <div className="mt-10 space-y-5">
                  <Benefit
                    icon={ShieldCheck}
                    title="Verified drivers"
                    description="Passenger safety comes first."
                  />

                  <Benefit
                    icon={Clock3}
                    title="Flexible driving"
                    description="Accept rides when you're ready."
                  />

                  <Benefit
                    icon={CheckCircle2}
                    title="Earn from every ride"
                    description="Get paid for completed trips."
                  />
                </div>
              </div>

              {/* Bottom security */}

              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <FileCheck2 size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-300">
                      Application reviewed securely
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Your information is reviewed by the Gontobbo team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              RIGHT FORM
          ====================================================== */}

          <section className="p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="mx-auto max-w-xl">
              {/* Header */}

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Driver application
                </div>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {isResubmission
                    ? "Resubmit your application."
                    : "Become a Gontobbo driver."}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your driving license and vehicle information carefully.
                </p>
              </div>

              {/* Error */}

              {error && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-red-600">
                      !
                    </div>

                    <div>
                      <p className="text-sm font-bold text-red-800">
                        Application could not be submitted
                      </p>

                      <p className="mt-1 text-sm leading-5 text-red-600">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* LICENSE */}

                <FormField
                  label="Driving license number"
                  htmlFor="licenseNumber"
                  required
                >
                  <input
                    id="licenseNumber"
                    name="licenseNumber"
                    type="text"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="Enter your driving license number"
                    autoComplete="off"
                    required
                    className={inputClass}
                  />
                </FormField>

                {/* EXPIRY */}

                <FormField
                  label="License expiry date"
                  htmlFor="licenseExpiry"
                  required
                >
                  <input
                    id="licenseExpiry"
                    name="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={handleChange}
                    min={new Date().toISOString().slice(0, 10)}
                    required
                    className={inputClass}
                  />
                </FormField>

                {/* VEHICLE */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700">
                      Vehicle type
                    </label>

                    <span className="text-[11px] font-medium text-slate-400">
                      Select one
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <VehicleButton
                      active={formData.vehicleType === "car"}
                      value="car"
                      label="Car"
                      icon={Car}
                      onClick={handleVehicleType}
                    />

                    <VehicleButton
                      active={formData.vehicleType === "bike"}
                      value="bike"
                      label="Bike"
                      icon={Bike}
                      onClick={handleVehicleType}
                    />

                    <VehicleButton
                      active={formData.vehicleType === "cng"}
                      value="cng"
                      label="CNG"
                      icon={Truck}
                      onClick={handleVehicleType}
                    />
                  </div>
                </div>

                {/* MODEL */}

                <FormField
                  label="Vehicle model"
                  htmlFor="vehicleModel"
                  required
                  hint="You can enter the brand and model together."
                >
                  <input
                    id="vehicleModel"
                    name="vehicleModel"
                    type="text"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder="Example: Toyota Axio or Yamaha FZS"
                    autoComplete="off"
                    required
                    className={inputClass}
                  />
                </FormField>

                {/* REGISTRATION */}

                <FormField
                  label="Vehicle registration number"
                  htmlFor="registrationNumber"
                  required
                >
                  <input
                    id="registrationNumber"
                    name="registrationNumber"
                    type="text"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="Enter vehicle registration number"
                    autoComplete="off"
                    required
                    className={`${inputClass} uppercase`}
                  />
                </FormField>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/25 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Submitting application...
                    </>
                  ) : (
                    <>
                      {isResubmission
                        ? "Submit application again"
                        : "Submit driver application"}

                      <ArrowRight
                        size={17}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                {/* Disclaimer */}

                <div className="flex items-start gap-2 pt-1">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />

                  <p className="text-[11px] leading-5 text-slate-400">
                    By submitting this application, you confirm that the
                    information provided is accurate. Your application will be
                    reviewed by the Gontobbo team.
                  </p>
                </div>
              </form>

              {/* Footer */}

              <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
                © {new Date().getFullYear()} Gontobbo. Move smarter, travel
                better.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| BACKGROUND DECORATIONS
|--------------------------------------------------------------------------
*/

const BackgroundDecorations = () => {
  return (
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
  );
};

/*
|--------------------------------------------------------------------------
| BENEFIT
|--------------------------------------------------------------------------
*/

const Benefit = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
        <Icon size={18} strokeWidth={2.3} />
      </div>

      <div>
        <p className="text-sm font-bold text-slate-300">{title}</p>

        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| FORM FIELD
|--------------------------------------------------------------------------
*/

const FormField = ({ label, htmlFor, required, hint, children }) => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="block text-sm font-bold text-slate-700"
        >
          {label}
        </label>

        {required && (
          <span className="text-[11px] font-medium text-slate-400">
            Required
          </span>
        )}
      </div>

      {children}

      {hint && <p className="mt-2 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| VEHICLE BUTTON
|--------------------------------------------------------------------------
*/

const VehicleButton = ({ active, value, label, icon: Icon, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`group flex min-h-23 flex-col items-center justify-center rounded-xl border transition-all duration-200 ${
        active
          ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-500/10"
          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-200 hover:bg-white hover:text-emerald-600"
      }`}
    >
      <Icon
        size={25}
        strokeWidth={2}
        className={
          active
            ? "text-emerald-600"
            : "text-slate-400 transition group-hover:text-emerald-500"
        }
      />

      <span className="mt-2 text-xs font-extrabold">{label}</span>

      {active && (
        <span className="mt-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
          <Check size={10} strokeWidth={3} />
          Selected
        </span>
      )}
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| STATUS PAGE
|--------------------------------------------------------------------------
*/

const StatusPage = ({
  icon,
  iconClass,
  badge,
  badgeClass,
  title,
  message,
  buttonText,
  onButtonClick,
  buttonClass,
  secondaryInfo,
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <BackgroundDecorations />

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back
          </button>

          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <MapPin size={19} />

              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-50 bg-emerald-300" />
            </div>

            <div className="hidden sm:block">
              <p className="font-black tracking-tight text-slate-950">
                Gontobbo
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Move smarter
              </p>
            </div>
          </Link>
        </header>

        <div className="mx-auto max-w-2xl overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="relative overflow-hidden bg-slate-950 px-6 py-10 text-center text-white sm:px-10 sm:py-14">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${iconClass}`}
              >
                {icon}
              </div>

              <div
                className={`mx-auto mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${badgeClass}`}
              >
                {badge}
              </div>

              <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                {title}
              </h1>

              <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-400">
                {message}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {secondaryInfo}

            <button
              type="button"
              onClick={onButtonClick}
              className={`group mt-7 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-extrabold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${buttonClass}`}
            >
              {buttonText}

              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>

            <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
              © {new Date().getFullYear()} Gontobbo. Move smarter, travel
              better.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| SHARED INPUT STYLE
|--------------------------------------------------------------------------
*/

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

export default DriverApplication;
