// src/app/services/page.tsx

export default function ServicesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 text-gray-900">
      <main className="flex-grow container mx-auto py-16 px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 text-blue-800 drop-shadow-sm">
          Our Medical Services
        </h1>

        <p className="text-center text-lg text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
          At <span className="font-semibold text-blue-700">Hospify</span>, 
          we are committed to providing world-class healthcare across a wide range of specialties.
          Our expert doctors, modern infrastructure, and compassionate staff ensure that every
          patient receives the highest quality of care.
        </p>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Emergency & Trauma Care",
              desc: "Our 24/7 Emergency Department is equipped with advanced life-saving equipment and staffed by experienced professionals trained in trauma management, critical care, and emergency response.",
            },
            {
              title: "Cardiology",
              desc: "From preventive screenings to complex heart surgeries, our Cardiology Department offers comprehensive heart care supported by advanced diagnostic tools and experienced cardiologists.",
            },
            {
              title: "Orthopedics & Joint Care",
              desc: "Our orthopedic specialists provide advanced care for bone, joint, and muscle conditions including arthritis, fractures, sports injuries, and joint replacements.",
            },
            {
              title: "Maternity & Child Care",
              desc: "Our maternity unit offers safe and comfortable birthing experiences, neonatal care, and pediatric services to ensure the health of both mother and child.",
            },
            {
              title: "Neurology",
              desc: "Our neurology team provides diagnosis and treatment for disorders of the brain, spine, and nervous system, using cutting-edge imaging and surgical techniques.",
            },
            {
              title: "Diagnostic & Imaging",
              desc: "Equipped with the latest MRI, CT, and ultrasound technologies, our diagnostic department ensures accurate and timely test results to support treatment decisions.",
            },
            {
              title: "Cancer Care (Oncology)",
              desc: "Our oncology specialists offer comprehensive cancer treatment including chemotherapy, radiation, and surgery, along with emotional and psychological support.",
            },
            {
              title: "Physiotherapy & Rehabilitation",
              desc: "Our physiotherapy unit helps patients recover strength, mobility, and function after surgery, injury, or illness through personalized therapy programs.",
            },
            {
              title: "Dental & Oral Care",
              desc: "From preventive dental checkups to cosmetic and restorative treatments, our dental team provides comprehensive oral healthcare for all ages.",
            },
          ].map((service, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200 hover:shadow-blue-300 hover:scale-105 transform transition duration-300"
            >
              <h2 className="text-2xl font-semibold text-blue-700 mb-3">
                {service.title}
              </h2>
              <p className="text-gray-700 leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center p-10 rounded-3xl shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Need Specialized Care?</h2>
          <p className="text-lg mb-6 text-blue-100">
            Schedule an appointment with one of our expert doctors today.  
            Your health is our top priority.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition transform hover:scale-105 shadow-md"
          >
            Contact Us
          </a>
        </div>
      </main>
    </div>
  );
}
