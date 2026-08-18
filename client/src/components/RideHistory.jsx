import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  XCircle,
} from "lucide-react";

const getStatusInfo = (status) => {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      };

    case "requested":
      return {
        label: "Requested",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock3,
      };

    case "searching":
      return {
        label: "Finding Driver",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Navigation,
      };

    case "accepted":
      return {
        label: "Accepted",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: CheckCircle2,
      };

    case "driver_arriving":
      return {
        label: "Driver Arriving",
        className: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Navigation,
      };

    case "in_progress":
      return {
        label: "In Progress",
        className: "bg-sky-50 text-sky-700 border-sky-200",
        icon: Car,
      };

    default:
      return {
        label: status || "Unknown",
        className: "bg-slate-50 text-slate-700 border-slate-200",
        icon: Clock3,
      };
  }
};

const formatDate = (date) => {
  if (!date) {
    return "Unknown date";
  }

  return new Date(date).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDistance = (distance) => {
  if (distance === undefined || distance === null) {
    return "—";
  }

  return `${Number(distance).toFixed(1)} km`;
};

const formatDuration = (duration) => {
  if (duration === undefined || duration === null) {
    return "—";
  }

  return `${Math.round(Number(duration))} min`;
};

function RideHistory({ rides = [], loading = false }) {
  if (loading) {
    return (
      <section className="mt-8">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Ride History</h2>

          <p className="mt-1 text-sm text-slate-500">
            Your previous Gontobbo rides.
          </p>
        </div>

        <div className="flex min-h-[180px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="mt-3 text-sm text-slate-500">
              Loading ride history...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!rides.length) {
    return (
      <section className="mt-8">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Ride History</h2>

          <p className="mt-1 text-sm text-slate-500">
            Your previous Gontobbo rides.
          </p>
        </div>

        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Car size={26} className="text-slate-500" />
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900">
            No rides yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Your completed and cancelled rides will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900">Ride History</h2>

        <p className="mt-1 text-sm text-slate-500">
          Your previous Gontobbo rides.
        </p>
      </div>

      <div className="space-y-4">
        {rides.map((ride) => {
          const status = getStatusInfo(ride.status);

          const StatusIcon = status.icon;

          return (
            <article
              key={ride._id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
            >
              {/* Header */}

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-slate-400" />

                    <p className="text-sm font-medium text-slate-500">
                      {formatDate(ride.createdAt || ride.requestedAt)}
                    </p>
                  </div>

                  <p className="mt-2 text-xl font-bold text-slate-900">
                    ৳{ride.estimatedFare || 0}
                  </p>
                </div>

                <div
                  className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                >
                  <StatusIcon size={14} />

                  {status.label}
                </div>
              </div>

              {/* Route */}

              <div className="mt-6">
                <div className="relative space-y-5">
                  <div className="absolute left-[9px] top-3 h-[calc(100%-30px)] w-px bg-slate-200" />

                  <div className="relative flex gap-4">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Pickup
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {ride.pickup?.address || "Unknown pickup"}
                      </p>
                    </div>
                  </div>

                  <div className="relative flex gap-4">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <MapPin size={11} className="text-red-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Destination
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {ride.destination?.address || "Unknown destination"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Distance</p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDistance(ride.distanceKm)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Duration</p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDuration(ride.durationMinutes)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Vehicle</p>

                  <div className="mt-1 flex items-center gap-1.5">
                    <Car size={14} className="text-slate-500" />

                    <p className="text-sm font-bold capitalize text-slate-800">
                      {ride.vehicleType || "Car"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Driver</p>

                  <p className="mt-1 truncate text-sm font-bold text-slate-800">
                    {ride.driver?.name || "Not assigned"}
                  </p>
                </div>
              </div>

              {/* Driver information */}

              {ride.driver && (
                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Driver
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {ride.driver.name}
                      </p>

                      {ride.driver.phone && (
                        <p className="mt-1 text-sm text-slate-500">
                          {ride.driver.phone}
                        </p>
                      )}
                    </div>

                    {ride.driver.phone && (
                      <a
                        href={`tel:${ride.driver.phone}`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Call
                      </a>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default RideHistory;
