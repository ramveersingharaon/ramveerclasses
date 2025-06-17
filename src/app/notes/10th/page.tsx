"use client";

import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../../../../firebaseConfig';

interface Note {
  chapterNumber: string;
  chapterName: string;
  url: string;
  public_id: string;
  className?: string;
}

export default function TenthNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Firebase auth check
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch("/api/upload");
        const data = await res.json();

        // Filter only 10th class notes
        const filtered = data.filter((note: Note) => note.className === "10");
        setNotes(filtered);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchNotes();
  }, []);

  // Delete note handler
  const handleDelete = async (public_id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id }),
      });

      if (!res.ok) throw new Error("Delete failed");

      setNotes((prev) => prev.filter((note) => note.public_id !== public_id));
    } catch (error) {
      alert("Failed to delete note");
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">10th Class Math Notes</h1>

      {fetching ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-center text-gray-500">No 10th class notes found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div key={note.public_id} className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Chapter {note.chapterNumber}</h3>
              <p className="text-gray-600">{note.chapterName}</p>
              <div className="mt-4 flex space-x-2">
                <a
                  href={note.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Read
                </a>
                <a
                  href={note.url}
                  download
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md"
                >
                  Download
                </a>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(note.public_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
