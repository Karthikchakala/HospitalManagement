'use client';

import Link from 'next/link';
import Image from 'next/image';
import ParticlesBackground from './ParticlesBackground'; // ✅ Corrected import path

export default function Footer() {
  return (
    <footer className="relative overflow-hidden text-slate-100">
      {/* ✅ Background Animation Layer */}
      <ParticlesBackground />

      {/* ✅ Main Footer Container */}
      <div className="relative z-10 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900/80 py-16 px-6">
        <div className="container mx-auto grid md:grid-cols-4 gap-10 text-sm md:text-base">
          
          {/* Hospital Info & Logo */}
          <div>
            <Link
              href="/"
              className="flex items-center space-x-3 mb-4 transition-transform duration-300 hover:scale-105"
            >
              <Image
                src="/images/HMS.ico"
                alt="Hospital Logo"
                width={50}
                height={50}
                className="rounded-full border-2 border-cyan-300 shadow-cyan-500/25"
              />
              <span className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">
                HOSPIFY
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed">
              Providing exceptional care to our community since 1998.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg md:text-xl font-bold mb-4 text-cyan-300 border-b border-cyan-500/40 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[{label:'About Us',href:'/about'},{label:'Our Services',href:'/services'},{label:'Contact',href:'/contact'},{label:'FAQ',href:'/faq'}].map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="hover:text-cyan-400 transition duration-300 transform hover:translate-x-1 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg md:text-xl font-bold mb-4 text-cyan-300 border-b border-cyan-500/40 pb-2">
              Support
            </h4>
            <ul className="space-y-3">
              {[{label:'FAQ',href:'/faq'},{label:'Privacy Policy',href:'/privacypolicy'},{label:'Terms of Use',href:'/termsofuse'}].map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="hover:text-blue-400 transition duration-300 transform hover:translate-x-1 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg md:text-xl font-bold mb-4 text-cyan-300 border-b border-cyan-500/40 pb-2">
              Contact Info
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>IIITDM Kurnool</li>
              <li>+91 8328134131</li>
              <li>info@hospify.com</li>
            </ul>

            {/* Social Media */}
            <div className="flex space-x-5 mt-6 text-2xl text-slate-300">
              {[
                { href: '#', label: 'Facebook', icon: 'fab fa-facebook-f' },
                { href: '#', label: 'Twitter', icon: 'fab fa-twitter' },
                { href: '#', label: 'LinkedIn', icon: 'fab fa-linkedin' },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  aria-label={social.label}
                  className="hover:text-cyan-400 hover:scale-125 transition-all duration-300"
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider Section */}
        <div className="mt-12 pt-6 border-t border-cyan-700/40 text-center text-slate-400 text-sm md:text-base">
          <p>
            &copy; 2025 <span className="text-cyan-300 font-semibold">Hospify</span>. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
