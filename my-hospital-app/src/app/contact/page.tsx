import React from "react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 text-gray-900">
      <main className="flex-grow container mx-auto py-12 px-6">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 drop-shadow-lg text-blue-900">
          Get in Touch: We’re Here to Help
        </h1>

        {/* Contact Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Enquiries */}
          <div className="bg-white/60 backdrop-blur-md border border-blue-200 p-8 rounded-2xl shadow-lg hover:shadow-blue-400/40 transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">
              General Enquiries
            </h2>
            <p className="text-lg mb-2">
              <strong>📞 Phone:</strong>{" "}
              <span className="text-gray-800 font-medium">(+91) 8328134131</span>{" "}
              <br />
              (Main Switchboard)
            </p>
            <p className="text-lg mb-2">
              <strong>✉️ Email:</strong>{" "}
              <a
                href="mailto:contactus@hospify.com"
                className="text-blue-700 hover:underline"
              >
                contactus@hospify.com
              </a>
            </p>
            <p className="text-lg mb-2">
              <strong>📍 Address:</strong> IIITDM Kurnool, Andhra Pradesh, India.
            </p>
            <p className="text-sm text-gray-700 mt-4">
              <strong>🕒 Visiting Hours:</strong> Daily: 11:00 AM – 1:00 PM and
              4:00 PM – 8:00 PM
            </p>
          </div>

          {/* Emergency Section */}
          <div className="bg-white/60 backdrop-blur-md border border-blue-200 p-8 rounded-2xl shadow-lg hover:shadow-blue-400/40 transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">
              Emergency & Quick Assistance
            </h2>
            <p className="text-lg mb-2">
              <strong>🚨 Emergency Helpline:</strong>{" "}
              <span className="text-red-600 font-semibold">
                (+91) 8328134131
              </span>
            </p>
            <p className="text-lg mb-2">
              <strong>🏥 Ambulance Service:</strong>{" "}
              <span className="text-gray-800 font-medium">(+91) 8328134131</span>
            </p>
            <p className="text-lg mb-2">
              <strong>📧 Emergency Email:</strong>{" "}
              <a
                href="mailto:emergency@hospify.com"
                className="text-blue-700 hover:underline"
              >
                emergency@hospify.com
              </a>
            </p>
            <p className="text-sm text-gray-700 mt-4">
              <strong>24×7 Emergency Department:</strong> Fully equipped trauma
              and critical care unit with on-call specialists.
            </p>
          </div>
        </div>

        {/* Divider */}
        <h3 className="text-3xl md:text-4xl font-extrabold text-center mb-12 mt-16 text-blue-900 drop-shadow-md">
          📍 Our Location
        </h3>

        {/* Embedded Google Map */}
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-blue-200 backdrop-blur-md hover:shadow-blue-400/40 transition-shadow duration-300">
          <div
            className="relative w-full h-0"
            style={{ paddingBottom: "56.25%" }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12814.70661777804!2d78.03603568487341!3d15.76887200935086!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb5dc3bfcf99645%3A0x52358ddcfb659cb9!2sIndian%20Institute%20Of%20Information%20Technology%2C%20Design%20%26%20Manufacturing%2C%20Kurnool!5e1!3m2!1sen!2sin!4v1759766682912!5m2!1sen!2sin"
              className="absolute top-0 left-0 w-full h-full border-0 rounded-3xl"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center max-w-2xl mx-auto text-gray-800 mt-12">
          <p className="text-lg">
            For appointment scheduling or specialist consultations, please
            contact our front desk or fill out the online appointment form.
          </p>
          <p className="mt-2 text-sm">
            Our support team responds to all inquiries within 24 hours
            (excluding Sundays & holidays).
          </p>
        </div>
      </main>
    </div>
  );
}
