"use client";

import React, { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../../../firebaseConfig';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

// Type definition for Note
interface Note {
  type: 'note';
  chapterNumber: string;
  chapterName: string;
  url: string;
  publicId: string;
  className?: string;
  subjectName?: string;
  created_at: string;
  description?: string;
}

export default function NotesPage() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter States
  const [activeClassFilter, setActiveClassFilter] = useState<string>('all');
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');
  
  // Dynamic filter options
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Firebase auth check for admin access
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all notes from the API
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setFetching(true);
        const res = await fetch("/api/upload");
        const data = res.ok ? await res.json() : { notes: [] };
        
        if (Array.isArray(data.notes)) {
          const notes = data.notes.map((note: any) => ({ ...note, type: 'note' }) as Note);
          setAllNotes(notes);
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchNotes();
  }, []);

  // Extract unique classes and subjects for filter options
  useEffect(() => {
    const classes = Array.from(new Set(allNotes.map(note => note.className).filter(Boolean))) as string[];
    setAvailableClasses(classes.sort((a, b) => parseInt(b) - parseInt(a)));

    const subjects = Array.from(new Set(allNotes.map(note => note.subjectName).filter(Boolean))) as string[];
    setAvailableSubjects(subjects.sort());
  }, [allNotes]);

  // Apply filters whenever filter states or allNotes change
  useEffect(() => {
    let newFilteredNotes = allNotes;

    if (activeClassFilter !== 'all') {
      newFilteredNotes = newFilteredNotes.filter(note => note.className === activeClassFilter);
    }
    if (activeSubjectFilter !== 'all') {
      newFilteredNotes = newFilteredNotes.filter(note => note.subjectName === activeSubjectFilter);
    }
    
    setFilteredNotes(newFilteredNotes);
  }, [activeClassFilter, activeSubjectFilter, allNotes]);

  const handleDownload = async (url: string, chapterName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${chapterName}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert("Failed to download file.");
      console.error("Download error:", error);
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await fetch(`/api/upload?publicId=${publicId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      setAllNotes((prev) => prev.filter((note) => note.publicId !== publicId));
      alert("Note deleted successfully!");
    } catch (error) {
      alert("Failed to delete note: " + (error as Error).message);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-800 mb-8">All Study Notes</h1>

        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
          {/* Class Filter Dropdown */}
          <select
            value={activeClassFilter}
            onChange={(e) => { setActiveClassFilter(e.target.value); setActiveSubjectFilter('all'); }}
            className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Classes</option>
            {availableClasses.map(cls => (
              <option key={cls} value={cls}>Class {cls}th</option>
            ))}
          </select>

          {/* Subject Filter Dropdown (conditional) */}
          {activeClassFilter !== 'all' && (
            <select
              value={activeSubjectFilter}
              onChange={(e) => setActiveSubjectFilter(e.target.value)}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          )}
        </div>

        {/* Notes Display */}
        {fetching ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No notes found for this selection.</p>
        ) : (
          // Single column grid for notes
          <div className="grid grid-cols-1 gap-6">
            {filteredNotes.map((note, index) => (
              <NoteCard key={index} note={note} isAdmin={isAdmin} onDelete={() => handleDelete(note.publicId)} onDownload={handleDownload} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable NoteCard Component
function NoteCard({ note, isAdmin, onDelete, onDownload }: { note: Note, isAdmin: boolean, onDelete: () => void, onDownload: (url: string, chapterName: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (descriptionRef.current && note.description) {
        const style = window.getComputedStyle(descriptionRef.current);
        const maxHeight = parseFloat(style.lineHeight) * 10;
        setIsTruncated(descriptionRef.current.scrollHeight > maxHeight);
      }
    };
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [note.description]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl">
      
      <div className="p-5 flex flex-col flex-1">
        <div>
          <p className="text-sm font-semibold text-blue-600 mb-1">
            Class {note.className} {note.subjectName ? `| ${note.subjectName}` : ''} | Chapter {note.chapterNumber}
          </p>
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{note.chapterName}</h3>
          {note.description && (
            <>
              <p
                ref={descriptionRef}
                className={`text-gray-600 text-sm mt-2 whitespace-pre-line ${!isExpanded && isTruncated ? 'line-clamp-2' : ''}`}
              >
                {note.description}
              </p>
              {isTruncated && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:underline flex items-center mt-2 text-sm"
                >
                  {isExpanded ? (
                    <>
                      Read Less <BiChevronUp className="ml-1" />
                    </>
                  ) : (
                    <>
                      Read More <BiChevronDown className="ml-1" />
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => onDownload(note.url, note.chapterName)}
            className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-semibold hover:bg-blue-100 transition-colors duration-300"
          >
            Download
          </button>
          {isAdmin && (
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors duration-300"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}