import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const STATUS_CONFIG = {
  pending: {
    title: "Application under review",
    message:
      "Your application has been submitted successfully. An administrator needs to review your documents before you can start driving.",
    color: "amber",
    icon: "⏳",
  },

  rejected: {
    title: "Application needs another submission",
    message:
      "Your previous application was not approved. Review the administrator's feedback below and submit your information again.",
    color: "red",
    icon: "!",
  },

  approved: {
    title: "You're already approved",
    message:
      "Your driver account has already been approved. You can continue to your driver dashboard.",
    color: "emerald",
    icon: "✓",
  },

  suspended: {
    title: "Driver account suspended",
    message:
      "Your driver account is currently suspended. Please contact an administrator before submitting another application.",
    color: "orange",
    icon: "!",
  },
};

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

        if (!mounted) {
          return;
        }

        setExistingDriver(response.data?.driver || null);

        /*
         * Populate the form when a rejected application is being
         * resubmitted.
         */

        const driver = response.data?.driver;

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
         * 404 simply means this user has never applied.
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");

    setSuccess("");
  };

  const handleVehicleType = (type) => {
    setFormData((prev) => ({
      ...prev,
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

      /*
       * Do NOT immediately send the user to the
       * driver dashboard.
       *
       * Pending drivers are not allowed to operate.
       */

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

      /*
       * If backend returned an existing driver record,
       * keep it available to the UI.
       */

      if (err?.response?.data?.driver) {
        setExistingDriver(err.response.data.driver);
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING EXISTING STATUS
  |--------------------------------------------------------------------------
  */

  if (checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Checking driver application...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EXISTING APPROVED APPLICATION
  |--------------------------------------------------------------------------
  */

  if (existingDriver?.status === "approved") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              ← Back
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg">
                🚗
              </div>

              <span className="text-xl font-bold text-slate-900">Gontobbo</span>
            </div>

            <div className="w-12" />
          </div>
        </header>

        <main className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
              ✓
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              You're already approved
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              Your Gontobbo driver application has already been approved. You
              can start using your driver dashboard.
            </p>

            <button
              type="button"
              onClick={() => navigate("/driver/dashboard")}
              className="mt-7 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Go to driver dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EXISTING PENDING APPLICATION
  |--------------------------------------------------------------------------
  */

  if (existingDriver?.status === "pending") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              ← Back
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg">
                🚗
              </div>

              <span className="text-xl font-bold text-slate-900">Gontobbo</span>
            </div>

            <div className="w-12" />
          </div>
        </header>

        <main className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-600">
              ⏳
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Application under review
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              Your driver application is already pending administrator approval.
              You don't need to submit another application.
            </p>

            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-left">
              <p className="text-sm font-bold text-amber-900">
                What happens next?
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Once an administrator reviews your information, your account
                will either be approved or you'll receive feedback about what
                needs to be corrected.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-7 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Return home
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SUSPENDED APPLICATION
  |--------------------------------------------------------------------------
  */

  if (existingDriver?.status === "suspended") {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              ← Back
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg">
                🚗
              </div>

              <span className="text-xl font-bold text-slate-900">Gontobbo</span>
            </div>

            <div className="w-12" />
          </div>
        </header>

        <main className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-2xl text-orange-600">
              !
            </div>

            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Driver account suspended
            </h1>

            <p className="mt-3 leading-7 text-slate-600">
              Your driver account is currently suspended and cannot operate on
              Gontobbo.
            </p>

            {existingDriver.rejectionReason && (
              <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-left">
                <p className="text-sm font-bold text-orange-900">
                  Administrator message
                </p>

                <p className="mt-1 text-sm leading-6 text-orange-800">
                  {existingDriver.rejectionReason}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-7 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Return home
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NEW APPLICATION OR REJECTED REAPPLICATION
  |--------------------------------------------------------------------------
  */

  const isResubmission = existingDriver?.status === "rejected";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg">
              🚗
            </div>

            <span className="text-xl font-bold text-slate-900">Gontobbo</span>
          </div>

          <div className="w-12" />
        </div>
      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-6xl px-6 py-10">
        {isResubmission && existingDriver.rejectionReason && (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 font-black text-red-600">
                !
              </div>

              <div>
                <h2 className="font-bold text-red-900">
                  Administrator feedback
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  {existingDriver.rejectionReason}
                </p>

                <p className="mt-2 text-xs font-medium text-red-700">
                  Correct your information below and submit your application
                  again.
                </p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-600">
                ✓
              </div>

              <div>
                <h2 className="font-bold text-emerald-900">
                  Application submitted
                </h2>

                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  {success}
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-3 text-sm font-bold text-emerald-700 underline underline-offset-2"
                >
                  Return home
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* LEFT SIDE */}

          <section className="pt-4">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <span>🚗</span>

              {isResubmission
                ? "Update your driver application"
                : "Become a Gontobbo Driver"}
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              {isResubmission ? (
                <>
                  Give your
                  <br />
                  application another try.
                </>
              ) : (
                <>
                  Start driving
                  <br />
                  with Gontobbo.
                </>
              )}
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              {isResubmission
                ? "Update the information requested by the administrator and submit your driver application again."
                : "Turn your time on the road into an opportunity. Submit your driver information and our team will review your application."}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="mb-3 text-2xl">✓</div>

                <h3 className="font-semibold text-slate-900">
                  Verified drivers
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Passenger safety comes first.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="mb-3 text-2xl">⏱️</div>

                <h3 className="font-semibold text-slate-900">
                  Flexible driving
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Accept rides when you're ready.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="mb-3 text-2xl">৳</div>

                <h3 className="font-semibold text-slate-900">
                  Earn from every ride
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Get paid for completed trips.
                </p>
              </div>
            </div>
          </section>

          {/* FORM */}

          <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">
                {isResubmission ? "Resubmit application" : "Driver application"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your driving license and vehicle information carefully.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-bold">Application could not be submitted</p>

                <p className="mt-1 leading-6">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* LICENSE */}

              <div>
                <label
                  htmlFor="licenseNumber"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Driving license number
                </label>

                <input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="Enter your driving license number"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* EXPIRY */}

              <div>
                <label
                  htmlFor="licenseExpiry"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  License expiry date
                </label>

                <input
                  id="licenseExpiry"
                  name="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* VEHICLE TYPE */}

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">
                  Vehicle type
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "car",
                      label: "Car",
                      icon: "🚗",
                    },
                    {
                      value: "bike",
                      label: "Bike",
                      icon: "🏍️",
                    },
                    {
                      value: "cng",
                      label: "CNG",
                      icon: "🛺",
                    },
                  ].map((vehicle) => (
                    <button
                      key={vehicle.value}
                      type="button"
                      onClick={() => handleVehicleType(vehicle.value)}
                      className={`rounded-2xl border px-3 py-4 text-center transition ${
                        formData.vehicleType === vehicle.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-2xl">{vehicle.icon}</div>

                      <p className="mt-2 text-sm font-bold">{vehicle.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* MODEL */}

              <div>
                <label
                  htmlFor="vehicleModel"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Vehicle model
                </label>

                <input
                  id="vehicleModel"
                  name="vehicleModel"
                  type="text"
                  value={formData.vehicleModel}
                  onChange={handleChange}
                  placeholder="Example: Toyota Axio or Yamaha FZS"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  You can include the brand and model together.
                </p>
              </div>

              {/* REGISTRATION */}

              <div>
                <label
                  htmlFor="registrationNumber"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Vehicle registration number
                </label>

                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  type="text"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="Enter vehicle registration number"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </>
                ) : isResubmission ? (
                  "Submit application again"
                ) : (
                  "Submit driver application"
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                By submitting this application, you confirm that the information
                provided is accurate.
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DriverApplication;
