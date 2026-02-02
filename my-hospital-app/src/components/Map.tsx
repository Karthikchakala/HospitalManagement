'use client';

export default function Map() {
  return (
    <section className="py-16 px-6 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-white">
      {/* Heading with simple solid color */}
      <h3 className="text-3xl md:text-4xl font-extrabold text-center mb-12 text-white drop-shadow-md">
        📍 Our Location
      </h3>

      <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm">
        <div className="relative w-full h-0" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12814.70661777804!2d78.03603568487341!3d15.76887200935086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb5dc3bfcf99645%3A0x52358ddcfb659cb9!2sIndian%20Institute%20Of%20Information%20Technology%2C%20Design%20%26%20Manufacturing%2C%20Kurnool!5e1!3m2!1sen!2sin!4v1759766682912!5m2!1sen!2sin"
            className="absolute top-0 left-0 w-full h-full border-0 rounded-3xl"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
