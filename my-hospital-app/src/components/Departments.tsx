'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HeartIcon,
  UserGroupIcon,
  EyeIcon,
  BoltIcon,
  BeakerIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";

const departments = [
  {
    name: "Cardiology",
    Icon: HeartIcon,
    color: "from-red-500 to-red-600",
    glow: "shadow-red-500/40",
    description: "Heart health, diagnostics, and treatment services.",
  },
  {
    name: "Neurology",
    Icon: BoltIcon,
    color: "from-purple-500 to-purple-600",
    glow: "shadow-purple-500/40",
    description: "Brain and nervous system care for all ages.",
  },
  {
    name: "Pediatrics",
    Icon: UserGroupIcon,
    color: "from-yellow-500 to-amber-500",
    glow: "shadow-amber-500/40",
    description: "Comprehensive care for infants, children, and teens.",
  },
  {
    name: "Oncology",
    Icon: BeakerIcon,
    color: "from-pink-500 to-rose-600",
    glow: "shadow-pink-500/40",
    description: "Advanced cancer treatment and support services.",
  },
  {
    name: "Orthopedics",
    Icon: HandThumbUpIcon,
    color: "from-green-500 to-emerald-600",
    glow: "shadow-green-500/40",
    description: "Bone, joint, and musculoskeletal care.",
  },
  {
    name: "Eye Care",
    Icon: EyeIcon,
    color: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/40",
    description: "Vision exams, eye surgeries, and optical care.",
  },
];

const overlayVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, delay: i * 0.05 },
  }),
};

export default function Departments() {
  const [hovered, setHovered] = useState<number | null>(null);

  // Load Poppins font dynamically
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return (
    <section
      className="py-20 px-6 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-gray-100"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Heading with simple solid color */}
      <h2 className="text-4xl font-extrabold text-center mb-16 text-white drop-shadow-lg">
        Our Departments
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {departments.map((dept, idx) => (
          <motion.div
            key={idx}
            className={`relative rounded-2xl flex flex-col items-center justify-center p-10 cursor-pointer overflow-hidden transition-all border border-gray-700 bg-gray-800/60 backdrop-blur-md shadow-xl ${
              hovered === idx
                ? "shadow-2xl scale-105 border-transparent"
                : "shadow-lg"
            }`}
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Icon with glow and motion */}
            <motion.div
              className={`p-6 rounded-full mb-4 bg-gradient-to-r ${dept.color} ${dept.glow} text-white shadow-lg`}
              whileHover={{ scale: 1.2, rotate: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <dept.Icon className="w-12 h-12" />
            </motion.div>

            <h3 className="text-xl font-semibold text-white">{dept.name}</h3>

            {/* Hover overlay */}
            <motion.div
              className="absolute inset-0 bg-gray-900/95 flex items-center justify-center text-center p-6 rounded-2xl backdrop-blur-sm"
              variants={overlayVariants}
              initial="hidden"
              whileHover="visible"
              custom={idx}
            >
              <p className="text-gray-300">{dept.description}</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
