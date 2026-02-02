'use client';

import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { motion } from "framer-motion";

const events = [
  { id: 1, title: 'Blood Donation Drive', date: 'October 20, 2025', description: 'Join us to help save lives at our annual blood drive.' },
  { id: 2, title: 'Diabetes Awareness Workshop', date: 'November 5, 2025', description: 'Learn about prevention and management from our endocrinology experts.' },
  { id: 3, title: 'Free Health Screening', date: 'November 18, 2025', description: 'Get a free check-up including blood pressure and cholesterol.' },
  { id: 4, title: 'Medical Career Fair', date: 'December 2, 2025', description: 'Explore career opportunities with our hospital team.' },
];

export default function EventsCarousel() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    cssEase: "ease-in-out",
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2, slidesToScroll: 1, dots: true } },
      { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1, dots: true } },
    ]
  };

  return (
    <section className="py-16 px-6 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-white relative overflow-hidden">
      {/* Solid color title */}
      <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-white">
        Upcoming Events
      </h2>

      <div className="max-w-7xl mx-auto relative z-10">
        <Slider {...settings}>
          {events.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="px-3"
            >
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 h-full flex flex-col justify-between shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_35px_rgba(0,0,0,0.5)] hover:bg-white/20 transition-all duration-300">
                <div>
                  <h3 className="text-2xl font-semibold mb-3 text-blue-400">{event.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{event.description}</p>
                </div>
                <p className="text-sm text-cyan-400 font-semibold mt-2">{event.date}</p>
              </div>
            </motion.div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
