// src/app/about/page.tsx

"use client";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 text-gray-800">
      <section className="py-16 px-6 md:px-20">
        <div className="max-w-5xl mx-auto space-y-10">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-blue-900">
            About Us
          </h1>

          <p className="text-lg leading-relaxed text-gray-800">
            Welcome to <strong>Hospify</strong> — Where Compassion Meets Excellence.
          </p>

          <p className="text-lg leading-relaxed text-gray-800">
            At <strong>Hospify</strong>, we believe that healthcare is more than just treating illness —
            it’s about caring for people, families, and communities. Since our founding, our mission
            has been to provide world-class medical care with empathy, integrity, and innovation.
          </p>

          <p className="text-lg leading-relaxed text-gray-800">
            Our hospital stands as a symbol of trust and advanced healthcare delivery. With a team of
            highly skilled doctors, nurses, and allied health professionals, we combine cutting-edge
            technology with a human touch.
          </p>

          {/* --- Vision Section --- */}
          <div className="p-6 rounded-2xl shadow-lg bg-white/90 border-l-4 border-blue-500 hover:shadow-2xl transition">
            <h2 className="text-2xl font-semibold mb-3 text-blue-700">Our Vision</h2>
            <p className="text-lg leading-relaxed">
              To be the most trusted, accessible, and patient-centered healthcare provider,
              recognized globally for excellence in outcomes, compassionate service, and innovation.
            </p>
          </div>

          {/* --- Mission Section --- */}
          <div className="p-6 rounded-2xl shadow-lg bg-white/90 border-l-4 border-blue-500 hover:shadow-2xl transition">
            <h2 className="text-2xl font-semibold mb-3 text-blue-700">Our Mission</h2>
            <ul className="list-disc list-inside space-y-2 text-lg leading-relaxed">
              <li>Provide safe, evidence-based, and affordable medical care.</li>
              <li>Foster continuous learning, research, and advancement.</li>
              <li>Uphold the highest standards of ethics and transparency.</li>
              <li>Build healthier communities through holistic care.</li>
            </ul>
          </div>

          {/* --- Values Section --- */}
          <div className="p-6 rounded-2xl shadow-lg bg-white/90 border-l-4 border-blue-500 hover:shadow-2xl transition">
            <h2 className="text-2xl font-semibold mb-3 text-blue-700">Our Values</h2>
            <ul className="list-disc list-inside space-y-2 text-lg leading-relaxed">
              <li>
                <strong>Compassion:</strong> Every patient deserves empathy and dignity.
              </li>
              <li>
                <strong>Integrity:</strong> We act honestly and responsibly.
              </li>
              <li>
                <strong>Excellence:</strong> We pursue improvement and precision.
              </li>
              <li>
                <strong>Teamwork:</strong> Collaboration ensures better outcomes.
              </li>
              <li>
                <strong>Innovation:</strong> We embrace modern technologies.
              </li>
              <li>
                <strong>Respect:</strong> We treat everyone with fairness.
              </li>
            </ul>
          </div>

          {/* --- Facilities Section --- */}
          <div className="p-6 rounded-2xl shadow-lg bg-white/90 border-l-4 border-blue-500 hover:shadow-2xl transition">
            <h2 className="text-2xl font-semibold mb-3 text-blue-700">Our Facilities</h2>
            <ul className="list-disc list-inside space-y-2 text-lg leading-relaxed">
              <li>Modern Operation Theatres with advanced tools.</li>
              <li>24/7 Emergency & Trauma Center.</li>
              <li>ICU, NICU, and PICU for critical care.</li>
              <li>Advanced Imaging (MRI, CT, X-Ray, Ultrasound).</li>
              <li>Fully automated Laboratory Services.</li>
              <li>Pharmacy & Blood Bank around the clock.</li>
              <li>Comprehensive Rehabilitation Units.</li>
              <li>Comfortable patient rooms ensuring privacy.</li>
            </ul>
          </div>

          {/* --- Promise Box --- */}
          <div className="p-6 rounded-2xl shadow-lg bg-blue-50 border-l-4 border-blue-600 hover:shadow-2xl transition">
            <h2 className="text-2xl font-semibold mb-3 text-blue-800">Our Promise</h2>
            <p className="text-lg leading-relaxed text-gray-800">
              At <strong>Hospify</strong>, your health is our top priority. We promise to stand by you —
              through every diagnosis, every treatment, and every recovery — with unwavering dedication
              and compassion. Whether you visit for a check-up or a complex procedure, rest assured you
              are in caring, capable hands.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
