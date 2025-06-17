"use client";

import Link from "next/link";

export default function HomePage() {
  const handleAppClick = () => {
    alert("You can Download Comming Soon");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Welcome to Ramveer Classes
        </h1>
        <p className="text-lg mb-6">
          UP Board के students के लिए Classes और Study material उपलब्ध हैं।
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
          >
            Register करें
          </Link>

          {/* Updated button with alert */}
          <button
            onClick={handleAppClick}
            className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
          >
            App डाउनलोड करें
          </button>

          <a
            href="https://www.youtube.com/@ramveerclasses"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
          >
            Online क्लास देखें
          </a>
          <a
            href="https://chat.whatsapp.com/EL1PtykUXGsCK06hBqEaR4"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
          >
            WhatsApp ग्रुप जॉइन करें
          </a>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">हमारे बारे में</h2>
        <p className="text-gray-700 leading-relaxed">
          हमारा मकसद है कि हर छात्र को अच्छी शिक्षा मिले, चाहे वह किसी भी background से हो।
          हम निशुल्क guidance, notes और वीडियो क्लासेस प्रदान करते हैं ताकि आप अच्छे नंबरों से पास हों।
        </p>
      </section>
    </div>
  );
}
