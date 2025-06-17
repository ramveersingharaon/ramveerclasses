"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../../firebaseConfig";
import { HiMenu, HiX } from "react-icons/hi";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginClick = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
    setMenuOpen(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md fixed w-full z-10 top-0">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left Section: Logo + Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            {/* Logo Image */}
            <img
              src="logo.png"  // <-- Yahan apni logo ki image ka path daalein
              alt="Logo"
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex gap-6 items-center font-medium">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/notes">Notes</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Right Section: Login/Dashboard Button */}
        <div className="hidden md:block">
          <button
            onClick={handleLoginClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            {isLoggedIn ? "Dashboard" : "Admin Login"}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4">
          <ul className="flex flex-col gap-3 text-gray-700 font-medium">
            <li><Link href="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
            <li><Link href="/notes" onClick={() => setMenuOpen(false)}>Notes</Link></li>
            <li><Link href="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
            <li><Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
            <li>
              <button
                onClick={handleLoginClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition block w-full text-center"
              >
                {isLoggedIn ? "Dashboard" : "Admin Login"}
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
