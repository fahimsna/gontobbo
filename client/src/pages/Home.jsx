import {
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Menu,
  Navigation,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Navigation,
      title: "Live location tracking",
      text: "Track your ride and driver location in real time from pickup to destination.",
    },
    {
      icon: ShieldCheck,
      title: "Verified drivers",
      text: "Drivers go through an approval process before they can accept passenger rides.",
    },
    {
      icon: Zap,
      title: "Fast ride matching",
      text: "Find nearby available drivers and reduce unnecessary waiting time.",
    },
    {
      icon: Smartphone,
      title: "Simple experience",
      text: "Request, monitor and manage your rides from one clean platform.",
    },
    {
      icon: Users,
      title: "Built for everyone",
      text: "Dedicated experiences for passengers, drivers and administrators.",
    },
    {
      icon: Clock3,
      title: "Ride history",
      text: "Keep your completed rides and journey information organized in one place.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Set your destination",
      text: "Choose where you're starting from and where you want to go.",
    },
    {
      number: "02",
      title: "Request a ride",
      text: "Submit your ride request and let Gontobbo find available drivers nearby.",
    },
    {
      number: "03",
      title: "Track your journey",
      text: "Follow your driver's progress and enjoy a transparent ride experience.",
    },
  ];

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      {/* =========================================================
          NAVBAR
      ========================================================== */}

      <header className="sticky top-0 z-[100] w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          {/* ================= LOGO ================= */}

          <Link
            to="/"
            onClick={closeMenu}
            className="group flex shrink-0 items-center gap-3"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-emerald-600">
              <MapPin size={21} strokeWidth={2.6} />

              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-300" />
            </div>

            <div className="leading-none">
              <p className="text-[21px] font-black tracking-[-0.04em] text-slate-900">
                Gontobbo
              </p>

              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Move smarter
              </p>
            </div>
          </Link>

          {/* ================= DESKTOP NAVIGATION ================= */}

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            <a
              href="#features"
              className="group relative rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
            >
              Features
              <span className="absolute bottom-1.5 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-emerald-500 transition-all duration-300 group-hover:w-5" />
            </a>

            <a
              href="#how-it-works"
              className="group relative rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
            >
              How it works
              <span className="absolute bottom-1.5 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-emerald-500 transition-all duration-300 group-hover:w-5" />
            </a>

            <a
              href="#drivers"
              className="group relative rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900"
            >
              Drive with us
              <span className="absolute bottom-1.5 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-emerald-500 transition-all duration-300 group-hover:w-5" />
            </a>
          </nav>

          {/* ================= DESKTOP ACTIONS ================= */}

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/25 active:translate-y-0"
            >
              Get started
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>

          {/* ================= MOBILE MENU BUTTON ================= */}

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 lg:hidden"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {/* ================= MOBILE MENU ================= */}

        <div
          className={`overflow-hidden border-t border-slate-100 bg-white transition-all duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? "max-h-[430px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mx-auto max-w-7xl px-5 py-4 sm:px-6">
            <nav className="flex flex-col gap-1">
              <a
                href="#features"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                Features
                <ChevronRight size={17} className="text-slate-400" />
              </a>

              <a
                href="#how-it-works"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                How it works
                <ChevronRight size={17} className="text-slate-400" />
              </a>

              <a
                href="#drivers"
                onClick={closeMenu}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                Drive with us
                <ChevronRight size={17} className="text-slate-400" />
              </a>
            </nav>

            <div className="my-4 h-px bg-slate-100" />

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Log in
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600"
              >
                Get started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* =========================================================
            HERO
        ========================================================== */}

        <section className="relative overflow-hidden bg-slate-950">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />

            <div className="absolute right-[-10rem] top-20 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="absolute bottom-[-15rem] left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-2 text-xs font-bold text-emerald-300">
                <Sparkles size={14} />
                Smarter rides. Better journeys.
              </div>

              <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                Go anywhere.
                <span className="mt-2 block text-slate-400">
                  Make it your
                  <span className="gontobbo-gradient-text"> Gontobbo.</span>
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
                A modern ride-sharing platform that connects passengers with
                nearby drivers for simple, transparent and reliable journeys.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-emerald-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  Book a ride
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 size={17} className="text-emerald-400" />
                  Verified drivers
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Navigation size={17} className="text-cyan-400" />
                  Live tracking
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Zap size={17} className="text-yellow-400" />
                  Fast matching
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-500/10 blur-3xl" />

              <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur-sm">
                <div className="overflow-hidden rounded-[1.5rem] bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                        <Car size={19} />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Current ride
                        </p>

                        <p className="mt-0.5 text-sm font-extrabold text-slate-950">
                          Merul Badda
                        </p>
                      </div>
                    </div>

                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Searching
                    </span>
                  </div>

                  <div className="relative h-72 overflow-hidden bg-slate-100 sm:h-80">
                    <div className="absolute inset-0 opacity-50">
                      <div className="absolute left-[-5%] top-[20%] h-px w-[110%] rotate-12 bg-slate-300" />
                      <div className="absolute left-[-10%] top-[62%] h-px w-[120%] -rotate-7 bg-slate-300" />
                      <div className="absolute left-[38%] top-[-20%] h-[140%] w-px rotate-14 bg-slate-300" />
                      <div className="absolute left-[72%] top-[-10%] h-[130%] w-px -rotate-40 bg-slate-300" />
                      <div className="absolute left-[8%] top-[42%] h-[45%] w-px rotate-28 bg-slate-300" />
                    </div>

                    <div className="absolute left-[18%] top-[25%] h-20 w-20 rounded-full bg-emerald-500/10 blur-xl" />

                    <div className="absolute left-[22%] top-[28%] flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30">
                      <MapPin size={20} />
                    </div>

                    <div className="absolute right-[18%] bottom-[24%] h-16 w-16 rounded-full bg-slate-950/10 blur-xl" />

                    <div className="absolute right-[21%] bottom-[27%] flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl">
                      <Car size={19} />
                    </div>

                    <div className="absolute left-[28%] top-[36%] h-24 w-[45%] rotate-12 rounded-full border-b-2 border-dashed border-slate-950/20" />

                    <div className="absolute bottom-4 left-4 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
                      <div className="flex items-center gap-2">
                        <Navigation size={14} className="text-emerald-500" />

                        <span className="text-xs font-bold text-slate-700">
                          Driver nearby
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center pt-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />

                        <div className="my-1 h-8 w-px border-l border-dashed border-slate-300" />

                        <div className="h-2.5 w-2.5 rounded-full bg-slate-900 ring-4 ring-slate-100" />
                      </div>

                      <div className="flex-1">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Pickup
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            Merul Badda, Dhaka
                          </p>
                        </div>

                        <div className="my-4" />

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Destination
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            Gulshan 1, Dhaka
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Fare
                        </p>

                        <p className="mt-1 text-lg font-black text-slate-950">
                          ৳120
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-3 hidden rounded-2xl border border-white/10 bg-white p-4 shadow-2xl sm:block lg:-left-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                    <Star size={19} className="fill-amber-400 text-amber-400" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-950">4.9/5</p>

                    <p className="text-[11px] text-slate-400">
                      Rider experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            STATS
        ========================================================== */}

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 sm:grid-cols-4">
            {[
              ["24/7", "Ride availability"],
              ["Live", "Driver tracking"],
              ["Verified", "Driver network"],
              ["৳", "Transparent fares"],
            ].map(([value, label], index) => (
              <div
                key={label}
                className={`px-5 py-8 sm:px-6 lg:px-8 ${
                  index !== 0 ? "border-l border-slate-200" : ""
                }`}
              >
                <p className="text-2xl font-black tracking-tight text-slate-950">
                  {value}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================
            FEATURES
        ========================================================== */}

        <section
          id="features"
          className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <Sparkles size={13} />
                  Built for everyday travel
                </div>

                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Everything you need for a better ride.
                </h2>

                <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
                  Gontobbo brings ride requests, location technology, driver
                  matching and journey management together in one experience.
                </p>
              </div>

              <Link
                to="/register"
                className="group inline-flex w-fit items-center gap-2 text-sm font-extrabold text-emerald-600 transition hover:text-emerald-700"
              >
                Get started
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white transition duration-300 group-hover:bg-emerald-600">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-6 text-base font-extrabold text-slate-950">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            HOW IT WORKS
        ========================================================== */}

        <section
          id="how-it-works"
          className="bg-white px-5 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <Navigation size={13} />
                Simple by design
              </div>

              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                From pickup to destination.
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-500">
                A straightforward journey without unnecessary complexity.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {steps.map(({ number, title, text }, index) => (
                <div
                  key={number}
                  className="relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-emerald-200 hover:shadow-lg"
                >
                  {index < steps.length - 1 && (
                    <div className="absolute right-[-1.25rem] top-14 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-500 md:flex">
                      <ArrowRight size={16} />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black tracking-wider text-emerald-500">
                      {number}
                    </span>

                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  <h3 className="mt-8 text-lg font-extrabold text-slate-950">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            DRIVER CTA
        ========================================================== */}

        <section
          id="drivers"
          className="relative overflow-hidden bg-slate-950 px-5 py-20 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="absolute -right-32 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <Car size={13} />
                Drive with Gontobbo
              </div>

              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Turn your journeys into an opportunity.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
                Apply to become a driver, get verified and start receiving ride
                requests from passengers around you.
              </p>
            </div>

            <Link
              to="/register"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-emerald-500/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-400"
            >
              Become a driver
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}

      <footer className="bg-slate-950 px-5 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <MapPin size={17} />
            </div>

            <div>
              <p className="font-extrabold text-white">Gontobbo</p>

              <p className="text-[10px] font-medium text-slate-500">
                Move smarter.
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-500">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>

            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>

            <a href="#drivers" className="transition hover:text-white">
              Drivers
            </a>
          </div>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Gontobbo
          </p>
        </div>
      </footer>
    </div>
  );
}
