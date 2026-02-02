'use client';

import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion } from "framer-motion";

const newsArticles = [
  {
    id: 1,
    title: 'New Pediatric Wing Opened',
    date: 'October 15, 2025',
    description:
      'We are proud to announce the opening of our new wing dedicated to pediatric care.',
  },
  {
    id: 2,
    title: 'Community Health Check-up',
    date: 'October 10, 2025',
    description:
      'Join us this weekend for a free community health check-up event with our doctors.',
  },
  {
    id: 3,
    title: 'Medical Career Fair',
    date: 'September 28, 2025',
    description:
      'Explore career opportunities with our hospital team and meet our staff.',
  },
  {
    id: 4,
    title: 'Hospital Receives National Award',
    date: 'September 20, 2025',
    description:
      'Our hospital has been recognized for excellence in patient care and safety.',
  },
];

export default function NewsCarousel() {
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
      {/* Simple solid color title */}
      <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-white">
        Latest News & Updates
      </h2>

      <div className="max-w-7xl mx-auto relative z-10">
        <Slider {...settings}>
          {newsArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="px-3"
            >
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 h-full flex flex-col justify-between shadow-[0_0_20px_rgba(0,0,0,0.3)]
                              hover:shadow-[0_0_35px_rgba(0,0,0,0.5)] hover:bg-white/20 transition-all duration-300">
                <div>
                  <h3 className="text-2xl font-semibold mb-3 text-blue-400">{article.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{article.description}</p>
                </div>
                <p className="text-sm text-cyan-400 font-semibold mt-2">{article.date}</p>
              </div>
            </motion.div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
