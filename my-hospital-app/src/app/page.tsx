'use client';

import { motion } from 'framer-motion';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Map from '../components/Map';
import EventsCarousel from '../components/EventsCarousel';

import NewsCarousel from '../components/NewsCarousel';
import SignupBoxes from '../components/SignupBoxes';
import Image from 'next/image';
import Link from 'next/link';

import HospifyChatbot from '../components/HospifyChatbot';
import HospitalPopup from '../components/HospitalPopup';

export default function LandingPage() {

  return (
    <div className="relative min-h-screen font-sans text-white overflow-hidden bg-gradient-to-br from-sky-950 via-slate-900 to-teal-950">
      <main>
        {/* ===== HERO SECTION (NO PARTICLES HERE) ===== */}
        <section className="relative w-full h-[90vh] md:h-screen flex flex-col">
          <Image
            src="/images/mainbg.png"
            alt="Healthcare professionals"
            fill
            priority
            className="object-cover object-center brightness-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />

          {/* Navbar */}
          <Navbar />

          {/* Hero Text */}
          <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-16 max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="text-6xl md:text-8xl font-extrabold leading-tight text-white mb-4 drop-shadow-xl"
            >
              Care that <br /> Shines Brighter
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-base md:text-lg font-medium text-gray-200 mb-6 leading-relaxed max-w-2xl"
            >
              “Comprehensive, connected healthcare built around your journey — blending innovation and compassion.”
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r 
                           from-teal-400 via-cyan-400 to-blue-500 text-white font-semibold 
                           rounded-full shadow-lg hover:shadow-cyan-400/50 hover:scale-105 transition-all"
              >
                Get Started
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ===== PARTICLE ANIMATION AFTER HERO ONLY ===== */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* <ParticlesBackground /> */}
          </div>

          {/* Signup Section */}
          <section className="container mx-auto px-4 md:px-6 lg:px-8 pt-10 relative z-10">
            <div className="rounded-3xl bg-white/5 border border-cyan-700 backdrop-blur-md p-4 md:p-6 hover:shadow-cyan-400/30 transition-all">
              <SignupBoxes />
            </div>
          </section>



          {/* Meet Our Doctors (removed) */}
          {/**
          <section className="container mx-auto py-20 px-4 md:px-6 lg:px-8 relative z-10">
            <h2 className="text-4xl font-bold text-center text-cyan-300 mb-12">
              Meet Our Doctors
            </h2>
            {docsLoading ? (
              <div className="flex justify-center items-center py-10 text-slate-300">Loading…</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {doctors.slice(0, 6).map((d, i) => (
                  <motion.div
                    key={d.doctor_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-6 bg-gradient-to-br from-blue-50/10 to-white/5 border border-cyan-700/40 rounded-2xl shadow-md hover:shadow-cyan-400/20 hover:scale-105 transition"
                 >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full overflow-hidden border border-cyan-700/50 bg-slate-800">
                        <img src={d.profile_image || '/images/doctor-placeholder.png'} alt={d.doctor_name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{d.doctor_name || `Doctor #${d.doctor_id}`}</div>
                        <div className="text-sm text-blue-300">{d.department_name || 'General'}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href={`/doctors/${d.doctor_id}`} className="inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-2">View Profile →</Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
          */}

          {/* Departments
          <section className="container mx-auto px-4 md:px-6 lg:px-8 pt-10 relative z-10">
            <div className="rounded-3xl bg-white/5 border border-cyan-700 backdrop-blur-md p-4 md:p-6">
              <Departments />
            </div>
          </section> */}

          {/* Services */}
          <section className="container mx-auto py-20 px-4 md:px-6 lg:px-8 relative z-10">
            <h2 className="text-4xl font-bold text-center text-cyan-300 mb-12">
              Our Core Services
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Emergency Services', desc: '24/7 care with top specialists ready to assist.' },
                { title: 'Advanced Diagnostics', desc: 'Precision imaging and laboratory services.' },
                { title: 'Expert Surgery', desc: 'Excellence in surgical care with compassion.' },
              ].map((service, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.04 }}
                  className="p-8 bg-gradient-to-br from-slate-900/70 to-sky-900/60 
                             rounded-xl border border-sky-800 shadow-lg hover:shadow-cyan-400/20 transition-all"
                >
                  <h3 className="text-2xl font-bold text-cyan-400 mb-3">{service.title}</h3>
                  <p className="text-gray-300">{service.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* News + Events */}
          <section className="py-16 px-4 md:px-6 lg:px-8 bg-slate-950/80 border-t border-sky-900 relative z-10">
            <div className="container mx-auto">
              <h2 className="text-4xl font-bold text-center text-cyan-300 mb-12">
                What&apos;s Happening
              </h2>
              <div className="space-y-10">
                <div className="rounded-2xl bg-gradient-to-br from-slate-900/70 to-sky-950/70 border border-cyan-700 p-4 md:p-6">
                  <NewsCarousel />
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-slate-900/70 to-sky-950/70 border border-cyan-700 p-4 md:p-6">
                  <EventsCarousel />
                </div>
              </div>
            </div>
          </section>

          {/* Map + Footer */}
          <div className="bg-gradient-to-r from-teal-950 to-sky-950 border-t border-teal-800 relative z-10">
            <Map />
          </div>

          {/* Ask Our Experts - just above footer */}
          <section className="relative z-10 py-16">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
              <div className="p-8">
                <h3 className="text-3xl md:text-4xl font-bold text-center text-cyan-300 mb-3">Ask Our Experts</h3>
                <p className="max-w-3xl mx-auto text-center text-slate-300 mb-8">
                  Unlock answers, gain insights: Engage with our esteemed experts who provide valuable guidance, expert advice, and personalized solutions to address your queries and empower your decision-making process.
                </p>
                <form
                  onSubmit={(e) => { e.preventDefault(); }}
                  className="max-w-3xl mx-auto"
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ask your query here"
                      className="w-full rounded-full bg-white/95 border border-purple-200 px-5 py-4 pr-16 text-slate-800 placeholder:text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <button
                      type="submit"
                      aria-label="Search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md hover:bg-purple-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 4.2 12.06l4.22 4.22a.75.75 0 1 0 1.06-1.06l-4.22-4.22A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </main>
      <HospifyChatbot />
      <HospitalPopup />
    </div>
  );
}
