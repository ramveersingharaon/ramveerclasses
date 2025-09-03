"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image"; // ✅ Link component is now removed
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../../../firebaseConfig';
import { FaDownload } from 'react-icons/fa';
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

// Define the Note type
interface Note {
  type: 'note';
  chapterNumber: string;
  chapterName: string;
  url: string;
  publicId: string;
  className?: string;
  subjectName?: string;
  created_at: string;
  descriptionImages?: string[];
  descriptionImageCount?: number;
}

export default function HomePage() {
  const [content, setContent] = useState<Note[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Separate cursor for notes only
  const [nextNotesCursor, setNextNotesCursor] = useState<string | null>(null);

  const lastPostRef = useRef<HTMLDivElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // Filters for class and subject
  const [activeClassFilter, setActiveClassFilter] = useState<string>('all');
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');

  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Updated fetchContent to get only notes
  const fetchContent = useCallback(async () => {
    if (loading || (!nextNotesCursor && !hasMore && content.length > 0)) return;

    setLoading(true);
    try {
      const notesUrl = `/api/upload?limit=3${nextNotesCursor ? `&nextCursor=${nextNotesCursor}` : ''}`;
      const notesRes = await fetch(notesUrl);
      const notesData = notesRes.ok ? await notesRes.json() : null;

      const notesArray: Note[] = Array.isArray(notesData?.notes) ? notesData.notes.map((item: any) => ({ ...item, type: 'note' })) : [];

      setNextNotesCursor(notesData?.nextCursor || null);
      setHasMore(!!notesData?.nextCursor);

      setContent(prevContent => {
        const combinedContent = [...prevContent, ...notesArray];
        const sortedContent = combinedContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const uniqueContent = sortedContent.filter((item, index, self) =>
          index === self.findIndex(t => t.publicId === item.publicId)
        );
        return uniqueContent;
      });

    } catch (error) {
      console.error("Error fetching content:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, nextNotesCursor, hasMore, content.length]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchContent();
  }, []);

  // IntersectionObserver logic to trigger fetch on scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        fetchContent();
      }
    }, { threshold: 1.0 });

    const currentRef = lastPostRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loading, hasMore, fetchContent]);

  // Reset states when filters change
  useEffect(() => {
    setContent([]);
    setNextNotesCursor(null);
    setHasMore(true);
  }, [activeClassFilter, activeSubjectFilter]);
  
  // Handle note deletion
  const handleDeleteNote = async (note: Note) => {
    if (!isAdmin || !note.publicId) return;

    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        const response = await fetch(`/api/upload?publicId=${note.publicId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert("Note deleted successfully!");
          setContent(prevContent => prevContent.filter(item => item.publicId !== note.publicId));
        } else {
          const errorData = await response.json();
          alert(`Error deleting note: ${errorData.message}`);
        }
      } catch (error) {
        console.error("Failed to delete note:", error);
        alert("Failed to delete note. Please try again.");
      }
    }
  };

  // Handle download
  const handleDownload = (url: string, chapterName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chapterName}.pdf`; // You can set a default file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter content based on selected class and subject
  const filteredContent = content.filter(item => {
    const isClassMatch = activeClassFilter === 'all' || item.className === activeClassFilter;
    const isSubjectMatch = activeSubjectFilter === 'all' || item.subjectName === activeSubjectFilter;
    return isClassMatch && isSubjectMatch;
  });

  // Determine unique classes and subjects for filter dropdowns
  useEffect(() => {
    const allClasses = new Set<string>();
    const allSubjects = new Set<string>();
    content.forEach(note => {
      if (note.className) allClasses.add(note.className);
      if (note.subjectName) allSubjects.add(note.subjectName);
    });
    setAvailableClasses(Array.from(allClasses).sort());
    setAvailableSubjects(Array.from(allSubjects).sort());
  }, [content]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Fixed header for filters and heading */}
      <div className="sticky top-0 z-10 bg-white shadow-md p-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Latest Notes</h2>
          <div className="flex flex-wrap gap-4">
            <select
              value={activeClassFilter}
              onChange={(e) => setActiveClassFilter(e.target.value)}
              className="p-2 border rounded-md text-gray-700"
            >
              <option value="all">All Classes</option>
              {availableClasses.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
            <select
              value={activeSubjectFilter}
              onChange={(e) => setActiveSubjectFilter(e.target.value)}
              className="p-2 border rounded-md text-gray-700"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map(subjectName => (
                <option key={subjectName} value={subjectName}>{subjectName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6">
        {filteredContent.map((note, index) => (
          <NoteCard
            key={note.publicId}
            note={note}
            isAdmin={isAdmin}
            onDelete={() => handleDeleteNote(note)}
            onDownload={handleDownload}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      {!hasMore && filteredContent.length > 0 && (
        <div className="text-center text-gray-500 my-8">
          You have reached the end of the list.
        </div>
      )}
      <div ref={lastPostRef} className="h-4" />
    </div>
  );
}

// Reusable Card Components
function NoteCard({ note, isAdmin, onDelete, onDownload }: { note: Note, isAdmin: boolean, onDelete: () => void, onDownload: (url: string, chapterName: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [allImages, setAllImages] = useState<string[]>(note.descriptionImages?.slice(0, 1) || []);
  const [isLoading, setIsLoading] = useState(false);

  const hasMoreThanOneImage = (note.descriptionImageCount || 0) > 1;

  const fetchAllImages = async () => {
    if (isExpanded) {
      setAllImages(note.descriptionImages?.slice(0, 1) || []);
      setIsExpanded(false);
      return;
    }

    if (note.publicId && hasMoreThanOneImage) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/note-images?publicId=${note.publicId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch all images');
        }
        const data = await response.json();
        setAllImages(data.descriptionImages);
        setIsExpanded(true);
      } catch (error) {
        console.error("Error fetching all images:", error);
        alert("Failed to load all images.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl">
      {allImages && allImages.length > 0 && (
        <div className="relative w-full overflow-hidden bg-gray-200 p-2">
          <div className="flex flex-col gap-2">
            {allImages.map((imageUrl, index) => (
              <div key={index} className="relative w-full">
                <img
                  src={imageUrl}
                  alt={`Note image ${index + 1}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 flex flex-col justify-between">
        <div>
          {hasMoreThanOneImage && (
            <button
              onClick={fetchAllImages}
              className="text-blue-600 hover:underline flex items-center mt-2 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Loading...</span>
              ) : isExpanded ? (
                <>
                  Show Less <BiChevronUp className="ml-1" />
                </>
              ) : (
                <>
                  Show All {note.descriptionImageCount} Images <BiChevronDown className="ml-1" />
                </>
              )}
            </button>
          )}
          <p className="text-sm font-semibold text-blue-600 mb-1">
            Class {note.className} {note.subjectName ? `| ${note.subjectName}` : ''} | Chapter {note.chapterNumber}
          </p>
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{note.chapterName}</h3>
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
  )}
