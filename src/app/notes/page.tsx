"use client";

import Link from "next/link";

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Select Your Class Notes</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link href="/notes/10th">
            <div className="cursor-pointer bg-white shadow-md hover:shadow-lg transition rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-blue-700">10th Class Math Notes</h2>
              <p className="text-gray-500 mt-2">Download and read 10th class notes.</p>
            </div>
          </Link>

          <Link href="/notes/12th">
            <div className="cursor-pointer bg-white shadow-md hover:shadow-lg transition rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-green-700">12th Class Math Notes</h2>
              <p className="text-gray-500 mt-2">Download and read 12th class notes.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
