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
  title: "Coaching Classes for UP Board Students | Ramveer Singh",
  description:
    "We provide free classes, notes, and online support to help UP Board students succeed. Join us and prepare with expert guidance.",
  keywords: [
    "UP Board coaching",
    "Free classes",
    "Ramveer Singh",
    "Online study",
    "Free notes",
    "Class 10th 12th",
    "Ramveersingh.com",
  ],
  metadataBase: new URL("https://www.ramveerclasses.com"),
  openGraph: {
    title: "Ramveer Singh Coaching | Free UP Board Classes",
    description:
      "Join our free coaching classes designed for UP Board students. Access notes, video classes, and more.",
    url: "https://www.ramveerclasses.com",
    siteName: "Ramveer Singh Coaching",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon - optional */}
        <link rel="icon" href="/favicon.ico" />
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.ramveerclasses.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
