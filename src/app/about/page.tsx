"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-16 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        About Us
      </h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">
          हमारा उद्देश्य (Our Purpose)
        </h2>
        <p className="text-gray-700 leading-relaxed">
          हमारा goal है कि हर student को अच्छी quality की education मिले। हम खासकर
          <strong> UP Board</strong> के बच्चों के लिए classes और study materials
          provide करते हैं। हमारा aim है कि कोई भी बच्चा सिर्फ resources की कमी की वजह से पीछे न रहे।
        </p>
      </section>

      <section className="text-center mt-16">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
          Join Us
        </h2>
        <p className="text-gray-700 mb-6">
          अगर आप पढ़ना चाहते हैं
          तो आप अभी register कर सकते हैं या हमसे contact करें।
        </p>
        <Link
          href="/register"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
        >
          Register Now
        </Link>
      </section>
    </div>
  );
}
