import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/component/Navbar";
import Footer from "@/component/Footer";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "रामवीर सिंह | UP Board के छात्रों के लिए निःशुल्क कोचिंग",
  description:
    "यूपी बोर्ड (UP Board) के छात्रों के लिए निःशुल्क ऑनलाइन कक्षाएं, नोट्स और वीडियो लेक्चर। कक्षा 10वीं, 12वीं के लिए विशेषज्ञ मार्गदर्शन। अभी हमसे जुड़ें और अपनी परीक्षा की तैयारी को बेहतर बनाएं।",
  keywords: [
    "UP Board coaching",
    "यूपी बोर्ड",
    "निःशुल्क कक्षाएं",
    "Ramveer Singh",
    "रामवीर सिंह",
    "ऑनलाइन पढ़ाई",
    "फ्री नोट्स",
    "कक्षा 10वीं",
    "कक्षा 12वीं",
    "Ramveersingh.com",
    "यूपी बोर्ड कोचिंग",
    "UP Board notes",
  ],
  metadataBase: new URL("https://www.ramveerclasses.com"),
  openGraph: {
    title: "रामवीर सिंह कोचिंग | UP Board के छात्रों के लिए निःशुल्क शिक्षा",
    description:
      "यूपी बोर्ड के छात्रों के लिए डिज़ाइन की गई हमारी निःशुल्क कोचिंग कक्षाओं में शामिल हों। नोट्स, वीडियो क्लासेस और बहुत कुछ प्राप्त करें।",
    url: "https://www.ramveerclasses.com",
    siteName: "Ramveer Singh Coaching",
    type: "website",
    images: [
      {
        url: "https://www.ramveerclasses.com/og-image.jpg", // Replace with your actual OpenGraph image path
        width: 1200,
        height: 630,
        alt: "Ramveer Singh Coaching Classes for UP Board Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "रामवीर सिंह | UP Board के छात्रों के लिए निःशुल्क कोचिंग",
    description:
      "यूपी बोर्ड के छात्रों के लिए निःशुल्क ऑनलाइन कक्षाएं, नोट्स और वीडियो लेक्चर। अभी जुड़ें!",
    images: ["https://www.ramveerclasses.com/twitter-image.jpg"], // Replace with your actual Twitter card image path
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="canonical" href="https://www.ramveerclasses.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}