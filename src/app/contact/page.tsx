import Head from "next/head";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe } from "react-icons/fa";

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact Us - Ramveer Classes</title>
        <meta name="description" content="Get in touch with our team" />
      </Head>

      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 text-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900">संपर्क करें</h1>
            <p className="mt-3 text-lg text-gray-800 font-medium">
              किसी भी जानकारी के लिए हमसे संपर्क करें
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
            {/* Address */}
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <FaMapMarkerAlt className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">पता</h3>
                <p className="text-gray-800 font-medium leading-relaxed">
                  Shree Girraj Ji Market
                  <br />
                  Kacholara
                  <br />
                  Jasarana Road, Araon
                  <br />
                  Firozabad, Uttar Pradesh
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <FaPhone className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">फोन नंबर</h3>
                <p className="text-gray-800 font-medium leading-relaxed">
                  +91 7827961344
                  <br />
                  +91 7827961344 (WhatsApp)
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <FaEnvelope className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">ईमेल</h3>
                <p className="text-gray-800 font-medium">
                  <a href="mailto:ramveerclasses@gmail.com" className="underline hover:text-indigo-600">
                    ramveerclasses@gmail.com
                  </a>
                </p>
              </div>
            </div>

            {/* Website */}
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <FaGlobe className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">वेबसाइट</h3>
                <p className="text-gray-800 font-medium">
                  <a
                    href="https://ramveerclasses.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-indigo-600"
                  >
                    ramveerclasses.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
