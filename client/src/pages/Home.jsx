import {
  ArrowRight,
  Car,
  MapPin,
  ShieldCheck,
  Smartphone,
  Star,
  Users,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ================================
          NAVBAR
      ================================= */}

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <MapPin size={21} />
            </div>

            <div>
              <div className="text-xl font-bold tracking-tight">Gontobbo</div>

              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                Your destination
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              How it works
            </a>

            <a
              href="#drivers"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Drive with us
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden px-3 py-2 text-sm font-semibold text-slate-700 sm:block"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ================================
          HERO
      ================================= */}

      <main>
        <section className="relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-0 h-125 w-125 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:px-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                <Zap size={14} className="text-yellow-400" />
                Smarter rides. Better journeys.
              </div>

              <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Your journey,
                <span className="block text-slate-400">your Gontobbo.</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                A modern ride-sharing platform built to make everyday travel
                simple, transparent and reliable.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  Book a ride
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Verified drivers
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-400" />
                  Live location
                </div>

                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-yellow-400" />
                  Fast matching
                </div>
              </div>
            </div>

            {/* Dashboard-style preview */}

            <div className="relative">
              <div className="absolute -inset-5 rounded-4xl bg-indigo-500/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Current ride
                    </p>

                    <p className="mt-1 font-bold">Merul Badda</p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Searching
                  </span>
                </div>

                <div className="relative h-72 overflow-hidden bg-slate-100">
                  {/* Fake map */}

                  <div className="absolute inset-0 opacity-50">
                    <div className="absolute left-[10%] top-[25%] h-px w-[80%] rotate-12 bg-slate-300" />
                    <div className="absolute left-[20%] top-[55%] h-px w-[70%] -rotate-6 bg-slate-300" />
                    <div className="absolute left-[45%] top-[5%] h-full w-px rotate-12 bg-slate-300" />
                    <div className="absolute left-[70%] top-[0%] h-full w-px -rotate-45 bg-slate-300" />
                  </div>

                  <div className="absolute left-[25%] top-[35%] flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg">
                    <MapPin size={19} />
                  </div>

                  <div className="absolute right-[20%] bottom-[25%] flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg">
                    <Car size={19} />
                  </div>

                  <div className="absolute left-[28%] top-[42%] h-24 w-[45%] border-b-2 border-dashed border-slate-950/30 rotate-12" />
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Pickup</p>

                      <p className="mt-1 text-sm font-semibold">
                        Merul Badda, Dhaka
                      </p>
                    </div>

                    <MapPin size={18} className="text-slate-400" />
                  </div>

                  <div className="my-4 h-px bg-slate-100" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Destination</p>

                      <p className="mt-1 text-sm font-semibold">
                        Gulshan 1, Dhaka
                      </p>
                    </div>

                    <span className="font-bold">৳120</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================
            STATS
        ================================= */}

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              ["24/7", "Ride availability"],
              ["5 km", "Nearby matching"],
              ["100%", "Verified drivers"],
              ["৳", "Transparent fares"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="border-slate-200 px-5 py-4 first:border-0 md:border-l"
              >
                <p className="text-2xl font-bold">{value}</p>

                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================
            FEATURES
        ================================= */}

        <section
          id="features"
          className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Built for everyday travel
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need for a better ride.
              </h2>

              <p className="mt-4 text-slate-500">
                Gontobbo combines smart matching, location technology and a
                simple experience into one platform.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: MapPin,
                  title: "Smart driver matching",
                  text: "Find available drivers based on location and vehicle type.",
                },
                {
                  icon: ShieldCheck,
                  title: "Verified drivers",
                  text: "Driver applications go through an approval workflow before they can operate.",
                },
                {
                  icon: Smartphone,
                  title: "Simple experience",
                  text: "Request, track and manage your rides from one clean interface.",
                },
                {
                  icon: Zap,
                  title: "Fast requests",
                  text: "Nearby driver discovery helps reduce the time spent waiting.",
                },
                {
                  icon: Users,
                  title: "For passengers & drivers",
                  text: "Separate experiences designed around what each user actually needs.",
                },
                {
                  icon: Star,
                  title: "Ride history",
                  text: "Keep track of previous rides and your journey history.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-5 font-bold">{title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================
            HOW IT WORKS
        ================================= */}

        <section
          id="how-it-works"
          className="bg-white px-5 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                How it works
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                From pickup to destination.
              </h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Choose your destination",
                  text: "Enter your pickup point and where you want to go.",
                },
                {
                  number: "02",
                  title: "Find a nearby driver",
                  text: "Gontobbo searches for available drivers around your pickup point.",
                },
                {
                  number: "03",
                  title: "Enjoy the journey",
                  text: "Your driver accepts the request and takes you to your destination.",
                },
              ].map(({ number, title, text }) => (
                <div
                  key={number}
                  className="relative rounded-2xl border border-slate-200 p-7"
                >
                  <span className="text-sm font-bold text-slate-300">
                    {number}
                  </span>

                  <h3 className="mt-5 text-lg font-bold">{title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================
            DRIVER CTA
        ================================= */}

        <section
          id="drivers"
          className="bg-slate-950 px-5 py-20 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Drive with Gontobbo
              </p>

              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Turn your everyday journeys into an opportunity.
              </h2>

              <p className="mt-4 leading-7 text-slate-400">
                Apply to become a driver, get verified and start receiving ride
                requests from passengers around you.
              </p>
            </div>

            <Link
              to="/register"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Become a driver
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      {/* ================================
          FOOTER
      ================================= */}

      <footer className="bg-slate-950 px-5 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-950">
              <MapPin size={16} />
            </div>

            <span className="font-bold text-white">Gontobbo</span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Gontobbo. Built for better journeys.
          </p>
        </div>
      </footer>
    </div>
  );
}
