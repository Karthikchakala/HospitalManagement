"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useEffect } from "react";

export default function SignupBoxes() {
  // Load Google Font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const roles = [
    {
      name: "Patient",
      icon: UserIcon,
      description: "Register to manage your appointments and health records.",
      link: "/signup/patient",
      color: "from-blue-500 to-blue-600",
    },
    {
      name: "Doctor",
      icon: ShieldCheckIcon,
      description: "Sign up to manage your patient charts and schedules.",
      link: "/signup/doctor",
      color: "from-teal-500 to-teal-600",
    },
    {
      name: "Admin",
      icon: PencilSquareIcon,
      description:
        "Access administrative tools and hospital management features.",
      link: "/signup/admin",
      color: "from-purple-500 to-purple-600",
    },
    {
      name: "Staff",
      icon: UserGroupIcon,
      description: "Join our team to manage patient information and tasks.",
      link: "/signup/staff",
      color: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <section
      className="py-20 px-6 min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-gray-100"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="container mx-auto text-center">
        {/* Heading with simple solid color */}
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold mb-14 text-white"
        >
          Join Our Healthcare System
        </motion.h2>

        {/* Signup role boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {roles.map((role, index) => (
            <motion.div
              key={index}
              className="relative backdrop-blur-md bg-gray-800/60 rounded-2xl border border-gray-700 shadow-xl p-8 text-center flex flex-col items-center transition-all duration-300 hover:border-transparent"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
              }}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div
                className={`w-20 h-20 rounded-full mb-6 flex items-center justify-center text-white shadow-md bg-gradient-to-r ${role.color}`}
              >
                <role.icon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-white">
                {role.name}
              </h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                {role.description}
              </p>
              <Link
                href={role.link}
                className={`mt-auto px-8 py-3 rounded-full text-sm font-medium bg-gradient-to-r ${role.color} text-white transition-all duration-300 hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-blue-500/50`}
              >
                Sign Up
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
