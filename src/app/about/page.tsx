"use client";

import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-16 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
        हमारे बारे में | हमारा मिशन
      </h1>
      <section className="mb-12 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">
          हमारा उद्देश्य (Our Mission)
        </h2>
        <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
          शिक्षा ही वह नींव है जिस पर एक उज्ज्वल भविष्य का निर्माण होता है। हमारे इस प्रयास का जन्म इसी विश्वास के साथ हुआ है। हम विशेष रूप से **UP Board** के छात्रों के लिए समर्पित हैं, जहाँ हम उन्हें सुलभ और उच्च-गुणवत्ता वाली शिक्षा सामग्री प्रदान करते हैं। हमारा मिशन यह है कि हर ग्रामीण और शहरी छात्र को समान अवसर मिलें, और वह बिना किसी बाधा के अपनी पूरी क्षमता तक पहुंच सके।
        </p>
      </section>

      <hr className="border-t-2 border-gray-200 my-12" />

      {/* Founder and Developer Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-blue-600 text-center">
          संस्थापक और डेवलपर (Founder & Developer)
        </h2>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden flex-shrink-0">
            {/* Replace with your actual image URL */}
            <Image 
              src="/photo.webp" 
              alt="Ramveer Singh's Profile" 
              layout="fill" 
              objectFit="cover" 
              className="rounded-full"
            />
          </div>
          <div className="text-center md:text-left mt-4 md:mt-0">
            <h3 className="text-3xl font-extrabold text-blue-700 mb-2">
              <span className="text-red-600">रामवीर सिंह</span> (Ramveer Singh)
            </h3>
            <p className="text-gray-600 leading-relaxed">
              मैं, **रामवीर सिंह**, इस वेबसाइट का संस्थापक और डेवलपर हूँ। मैंने इस मंच को विशेष रूप से **UP Board** के छात्रों की ज़रूरतों को ध्यान में रखकर बनाया है। मेरा मानना है कि तकनीक और शिक्षा का सही तालमेल हर छात्र के लिए सफलता के नए रास्ते खोल सकता है। यह वेबसाइट मेरे इसी विश्वास का परिणाम है।
            </p>
          </div>
        </div>
      </section>

      <hr className="border-t-2 border-gray-200 my-12" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-blue-600 text-center">
          हम क्या प्रदान करते हैं (What We Offer)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center">
            <span className="text-4xl text-blue-600 mb-3">📚</span>
            <h3 className="text-xl font-bold text-blue-700 mb-2">विस्तृत स्टडी नोट्स</h3>
            <p className="text-gray-700">
              सभी विषयों के लिए हिंदी और अंग्रेजी में विस्तृत और समझने में आसान नोट्स, जो आपकी परीक्षा की तैयारी में मदद करेंगे।
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center">
            <span className="text-4xl text-green-600 mb-3">🎥</span>
            <h3 className="text-xl font-bold text-blue-700 mb-2">इंटरैक्टिव वीडियो लेक्चर्स</h3>
            <p className="text-gray-700">
              कक्षा 6 से 12 तक के लिए सभी अध्यायों पर स्पष्ट और गहराई से समझाए गए वीडियो लेक्चर्स, ताकि कोई भी कॉन्सेप्ट छूट न जाए।
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center">
            <span className="text-4xl text-yellow-600 mb-3">❓</span>
            <h3 className="text-xl font-bold text-blue-700 mb-2">लाइव डाउट सेशन</h3>
            <p className="text-gray-700">
              विशेषज्ञ शिक्षकों के साथ लाइव क्लासेस जहाँ आप सीधे अपने सवाल पूछ सकते हैं और अपने संदेह दूर कर सकते हैं।
            </p>
          </div>
        </div>
      </section>

      <hr className="border-t-2 border-gray-200 my-12" />

      <section className="text-center mt-16">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">
          एक नए कल की शुरुआत करें
        </h2>
        <p className="text-gray-700 mb-6">
          आप भी हमारे साथ जुड़ें और अपने सपनों को पूरा करने की दिशा में पहला कदम बढ़ाएं।
        </p>
        <Link
          href="/register"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition"
        >
          अभी रजिस्टर करें
        </Link>
      </section>
    </div>
  );
}