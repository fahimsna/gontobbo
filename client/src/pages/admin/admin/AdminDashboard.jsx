import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Car,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  X,
  XCircle,
  LogOut,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../../../services/api";

import { useAuth } from "../../../context/AuthContext";

/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [selectedDriver, setSelectedDriver] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);

  const [rejectionReason, setRejectionReason] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD APPLICATIONS
  |--------------------------------------------------------------------------
  */

  const loadDrivers = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/drivers/applications");

        const driverList =
          response.data?.drivers ||
          response.data?.applications ||
          response.data?.data ||
          [];

        setDrivers(Array.isArray(driverList) ? driverList : []);
      } catch (err) {
        console.error("Failed to load driver applications:", err);

        const status = err.response?.status;

        if (status === 401) {
          logout();

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (status === 403) {
          setError(
            "You do not have permission to access the administrator dashboard.",
          );

          return;
        }

        setError(
          err.response?.data?.message || "Unable to load driver applications.",
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [logout, navigate],
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await loadDrivers(false);
    } finally {
      setRefreshing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE DRIVER STATUS
  |--------------------------------------------------------------------------
  */

  const updateDriverStatus = async (driverId, status) => {
    if (!driverId) {
      return;
    }

    /*
     * Rejection requires a reason.
     */

    if (status === "rejected" && !rejectionReason.trim()) {
      setError("Please enter a rejection reason.");

      return;
    }

    try {
      setUpdatingId(driverId);

      setError("");

      /*
       * IMPORTANT:
       *
       * Backend route:
       *
       * PATCH /api/drivers/:id/status
       *
       * NOT:
       *
       * /drivers/applications/:id/status
       */

      const response = await api.patch(`/drivers/${driverId}/status`, {
        status,

        rejectionReason:
          status === "rejected" || status === "suspended"
            ? rejectionReason.trim()
            : "",
      });

      const updatedDriver = response.data?.driver;

      if (updatedDriver) {
        setDrivers((currentDrivers) =>
          currentDrivers.map((driver) =>
            driver._id === updatedDriver._id ? updatedDriver : driver,
          ),
        );
      } else {
        await loadDrivers(false);
      }

      setSelectedDriver(null);

      setRejectionReason("");
    } catch (err) {
      console.error("Failed to update driver status:", err);

      setError(
        err.response?.data?.message || "Unable to update driver application.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN DRIVER
  |--------------------------------------------------------------------------
  */

  const openReview = (driver) => {
    setSelectedDriver(driver);

    setRejectionReason(driver?.rejectionReason || "");

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | CLOSE DRIVER
  |--------------------------------------------------------------------------
  */

  const closeReview = () => {
    if (updatingId) {
      return;
    }

    setSelectedDriver(null);

    setRejectionReason("");
  };

  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const statistics = useMemo(() => {
    return {
      total: drivers.length,

      pending: drivers.filter((driver) => driver.status === "pending").length,

      approved: drivers.filter((driver) => driver.status === "approved").length,

      rejected: drivers.filter((driver) => driver.status === "rejected").length,

      suspended: drivers.filter((driver) => driver.status === "suspended")
        .length,
    };
  }, [drivers]);

  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | DRIVER NAME
  |--------------------------------------------------------------------------
  */

  const getDriverName = (driver) => {
    return driver?.user?.name || driver?.name || "Unknown Driver";
  };

  /*
  |--------------------------------------------------------------------------
  | DRIVER EMAIL
  |--------------------------------------------------------------------------
  */

  const getDriverEmail = (driver) => {
    return driver?.user?.email || driver?.email || "No email";
  };

  /*
  |--------------------------------------------------------------------------
  | DRIVER PHONE
  |--------------------------------------------------------------------------
  */

  const getDriverPhone = (driver) => {
    return driver?.user?.phone || driver?.phone || "";
  };

  /*
  |--------------------------------------------------------------------------
  | DRIVER INITIAL
  |--------------------------------------------------------------------------
  */

  const getDriverInitial = (driver) => {
    return getDriverName(driver).charAt(0).toUpperCase();
  };

  /*
  |--------------------------------------------------------------------------
  | VEHICLE
  |--------------------------------------------------------------------------
  */

  const getVehicle = (driver) => {
    return driver?.vehicle || {};
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",

          className: "border-emerald-200 bg-emerald-50 text-emerald-700",

          icon: <CheckCircle2 size={14} />,
        };

      case "rejected":
        return {
          label: "Rejected",

          className: "border-red-200 bg-red-50 text-red-700",

          icon: <XCircle size={14} />,
        };

      case "suspended":
        return {
          label: "Suspended",

          className: "border-orange-200 bg-orange-50 text-orange-700",

          icon: <AlertCircle size={14} />,
        };

      default:
        return {
          label: "Pending",

          className: "border-amber-200 bg-amber-50 text-amber-700",

          icon: <Clock3 size={14} />,
        };
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
          </div>

          <p className="text-sm font-semibold text-slate-700">
            Loading admin dashboard...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching driver applications
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h1 className="text-base font-bold text-slate-900">
                Gontobbo Admin
              </h1>

              <p className="text-[11px] text-slate-400">
                Administration dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name || "Administrator"}
              </p>

              <p className="text-[11px] text-slate-400">Administrator</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut size={15} />

              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================================================================
          MAIN
      ================================================================ */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* PAGE HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Administration
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Driver Applications
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review applications, verify driver information, and manage driver
              account status.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />

            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">
                Something went wrong
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 transition hover:text-red-700"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* ================================================================
            STATISTICS
        ================================================================ */}

        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <AdminStat
            label="Total"
            value={statistics.total}
            icon={<User size={18} />}
          />

          <AdminStat
            label="Pending"
            value={statistics.pending}
            icon={<Clock3 size={18} />}
            accent="amber"
          />

          <AdminStat
            label="Approved"
            value={statistics.approved}
            icon={<CheckCircle2 size={18} />}
            accent="green"
          />

          <AdminStat
            label="Rejected"
            value={statistics.rejected}
            icon={<XCircle size={18} />}
            accent="red"
          />

          <AdminStat
            label="Suspended"
            value={statistics.suspended}
            icon={<AlertCircle size={18} />}
            accent="orange"
          />
        </section>

        {/* ================================================================
            APPLICATION TABLE
        ================================================================ */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  All driver applications
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {drivers.length} application
                  {drivers.length === 1 ? "" : "s"} found
                </p>
              </div>
            </div>
          </div>

          {drivers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Car size={23} />
              </div>

              <h4 className="mt-4 text-sm font-bold text-slate-700">
                No driver applications
              </h4>

              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
                New driver applications will appear here when users apply to
                become Gontobbo drivers.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {drivers.map((driver) => {
                const status = getStatusConfig(driver.status);

                const vehicle = getVehicle(driver);

                return (
                  <button
                    key={driver._id}
                    type="button"
                    onClick={() => openReview(driver)}
                    className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                  >
                    {/* AVATAR */}

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                      {getDriverInitial(driver)}
                    </div>

                    {/* DRIVER */}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {getDriverName(driver)}
                        </p>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}
                        >
                          {status.icon}

                          {status.label}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        <span>{getDriverEmail(driver)}</span>

                        <span>
                          {vehicle.type || "Vehicle"} ·{" "}
                          {vehicle.model || "Unknown model"}
                        </span>
                      </div>
                    </div>

                    {/* DATE */}

                    <div className="hidden text-right sm:block">
                      <p className="text-[10px] uppercase tracking-wider text-slate-300">
                        Applied
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDate(driver.createdAt)}
                      </p>
                    </div>

                    <ChevronRight
                      size={18}
                      className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ================================================================
          DRIVER REVIEW MODAL
      ================================================================ */}

      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Driver review
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {getDriverName(selectedDriver)}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {/* DRIVER INFO */}

              <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                    {getDriverInitial(selectedDriver)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900">
                      {getDriverName(selectedDriver)}
                    </h4>

                    <div className="mt-2 space-y-1.5">
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={13} />

                        {getDriverEmail(selectedDriver)}
                      </p>

                      {getDriverPhone(selectedDriver) && (
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={13} />

                          {getDriverPhone(selectedDriver)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* LICENSE */}

              <DetailSection title="Driving license">
                <DetailRow
                  label="License number"
                  value={selectedDriver.licenseNumber || "—"}
                />

                <DetailRow
                  label="License expiry"
                  value={formatDate(selectedDriver.licenseExpiry)}
                />
              </DetailSection>

              {/* VEHICLE */}

              <DetailSection title="Vehicle information">
                <DetailRow
                  label="Vehicle type"
                  value={selectedDriver.vehicle?.type || "—"}
                />

                <DetailRow
                  label="Brand"
                  value={selectedDriver.vehicle?.brand || "—"}
                />

                <DetailRow
                  label="Model"
                  value={selectedDriver.vehicle?.model || "—"}
                />

                <DetailRow
                  label="Year"
                  value={selectedDriver.vehicle?.year || "—"}
                />

                <DetailRow
                  label="Color"
                  value={selectedDriver.vehicle?.color || "—"}
                />

                <DetailRow
                  label="Registration"
                  value={selectedDriver.vehicle?.registrationNumber || "—"}
                />
              </DetailSection>

              {/* CURRENT STATUS */}

              <DetailSection title="Application status">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Current status</span>

                  <StatusPill status={selectedDriver.status} />
                </div>

                {selectedDriver.rejectionReason && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                      Previous reason
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-700">
                      {selectedDriver.rejectionReason}
                    </p>
                  </div>
                )}
              </DetailSection>

              {/* REJECTION */}

              {(selectedDriver.status === "pending" ||
                selectedDriver.status === "approved") && (
                <div className="mt-6">
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    Rejection / suspension reason
                  </label>

                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    rows={3}
                    placeholder="Required when rejecting or suspending a driver..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  disabled={updatingId === selectedDriver._id}
                  onClick={() =>
                    updateDriverStatus(selectedDriver._id, "approved")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingId === selectedDriver._id ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  Approve
                </button>

                <button
                  type="button"
                  disabled={updatingId === selectedDriver._id}
                  onClick={() =>
                    updateDriverStatus(selectedDriver._id, "rejected")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={15} />
                  Reject
                </button>

                <button
                  type="button"
                  disabled={updatingId === selectedDriver._id}
                  onClick={() =>
                    updateDriverStatus(selectedDriver._id, "suspended")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AlertCircle size={15} />
                  Suspend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| ADMIN STAT
|--------------------------------------------------------------------------
*/

function AdminStat({ label, value, icon, accent = "blue" }) {
  const accents = {
    blue: "bg-blue-50 text-blue-600",

    amber: "bg-amber-50 text-amber-600",

    green: "bg-emerald-50 text-emerald-600",

    red: "bg-red-50 text-red-600",

    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
          accents[accent]
        }`}
      >
        {icon}
      </div>

      <p className="text-[11px] font-medium text-slate-400">{label}</p>

      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| DETAIL SECTION
|--------------------------------------------------------------------------
*/

function DetailSection({ title, children }) {
  return (
    <section className="mb-5 rounded-2xl border border-slate-200 p-4">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h4>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-400">{label}</span>

      <span className="text-right text-xs font-semibold capitalize text-slate-700">
        {value}
      </span>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS PILL
|--------------------------------------------------------------------------
*/

function StatusPill({ status }) {
  const config =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "rejected"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "suspended"
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${config}`}
    >
      {status || "pending"}
    </span>
  );
}

export default AdminDashboard;
