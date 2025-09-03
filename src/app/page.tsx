"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../../firebaseConfig';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { FaPlayCircle } from 'react-icons/fa';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

// Define a union type for different content types
type Content = Note | Video;

interface Note {
  type: 'note';
  chapterNumber: string
  chapterName: string;
  url: string;
  publicId: string;
  className?: string;
  subjectName?: string;
  created_at: string;
  descriptionImages?: string[];
  descriptionImageCount?: number;
}

interface Video {
  type: 'video';
  chapterNumber: string;
  chapterName: string;
  youtubeUrl: string;
  className?: string;
  subjectName?: string;
  created_at: string;
  description?: string;
  thumbnailPublicId?: string; // Add thumbnailPublicId
}

// Function to extract YouTube Video ID from various URL formats
const getYouTubeId = (url: string): string | null => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:.+)?$/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export default function HomePage() {
  const [content, setContent] = useState<Content[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // NEW: Separate cursors for notes and videos
  const [nextNotesCursor, setNextNotesCursor] = useState<string | null>(null);
  const [nextVideosCursor, setNextVideosCursor] = useState<string | null>(null);

  const lastPostRef = useRef<HTMLDivElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
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

  // 🚀 UPDATED: fetchContent with separate cursors
  const fetchContent = useCallback(async () => {
    if (loading || (!nextNotesCursor && !nextVideosCursor && !hasMore)) return;

    setLoading(true);
    try {
      const notesUrl = `/api/upload?limit=3${nextNotesCursor ? `&nextCursor=${nextNotesCursor}` : ''}`;
      const videosUrl = `/api/upload-video?limit=3${nextVideosCursor ? `&nextCursor=${nextVideosCursor}` : ''}`;

      const [notesRes, videosRes] = await Promise.all([
        fetch(notesUrl),
        fetch(videosUrl)
      ]);

      const notesData = notesRes.ok ? await notesRes.json() : null;
      const videosData = videosRes.ok ? await videosRes.json() : null;

      const notesArray = Array.isArray(notesData?.notes) ? notesData.notes : [];
      const videosArray = Array.isArray(videosData?.videos) ? videosData.videos : [];

      const newFetchedContent = [...notesArray, ...videosArray].map(item => ({
        ...item,
        type: item.url ? 'note' : 'video'
      }));

      setNextNotesCursor(notesData?.nextCursor || null);
      setNextVideosCursor(videosData?.nextCursor || null);
      setHasMore(!!(notesData?.nextCursor || videosData?.nextCursor));

      setContent(prevContent => {
        const combinedContent = [...prevContent, ...newFetchedContent];
        const sortedContent = combinedContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const uniqueContent = sortedContent.filter((item, index, self) =>
          index === self.findIndex(t => (
            (t.type === 'note' && item.type === 'note' && t.publicId === item.publicId) ||
            (t.type === 'video' && item.type === 'video' && t.youtubeUrl === item.youtubeUrl)
          ))
        );
        return uniqueContent;
      });

    } catch (error) {
      console.error("Error fetching content:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, nextNotesCursor, nextVideosCursor, hasMore]);

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
    setNextVideosCursor(null);
    setHasMore(true);
    // fetchContent is triggered by the change in cursor states
  }, [activeTypeFilter, activeClassFilter, activeSubjectFilter]);
  
  // 🚀 NEW: handleDelete functions
  const handleDeleteNote = async (note: Note) => {
    if (!isAdmin || !note.publicId) return;

    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        const response = await fetch(`/api/upload?publicId=${note.publicId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert("Note deleted successfully!");
          // UI se note ko hatayein
          setContent(prevContent => prevContent.filter(item => item.type === 'video' || (item.type === 'note' && item.publicId !== note.publicId)));
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

  const handleDeleteVideo = async (video: Video) => {
    if (!isAdmin || !video.thumbnailPublicId) return;

    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        const response = await fetch('/api/upload-video', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ thumbnailPublicId: video.thumbnailPublicId }),
        });

        if (response.ok) {
          alert("Video deleted successfully!");
          // UI se video ko hatayein
          setContent(prevContent => prevContent.filter(item => item.type === 'note' || (item.type === 'video' && item.thumbnailPublicId !== video.thumbnailPublicId)));
        } else {
          const errorData = await response.json();
          alert(`Error deleting video: ${errorData.message}`);
        }
      } catch (error) {
        console.error("Failed to delete video:", error);
        alert("Failed to delete video. Please try again.");
      }
    }
  };

  const filteredContent = content.filter(item => {
    const isTypeMatch = activeTypeFilter === 'all' || item.type === activeTypeFilter;
    const isClassMatch = activeClassFilter === 'all' || item.className === activeClassFilter;
    const isSubjectMatch = activeSubjectFilter === 'all' || item.subjectName === activeSubjectFilter;
    return isTypeMatch && isClassMatch && isSubjectMatch;
  });

  return (
    <>
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 text-gray-800">
        <section className="bg-blue-600 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 animate-fadeIn">
              Ramveer Classes
            </h1>
            <p className="text-lg sm:text-xl mb-8 animate-fadeIn delay-100">
              Dedicated to providing quality education to UP Board students. Access notes and video lectures to excel in your studies.
            </p>
            <Link href="/download-app" passHref>
              <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 animate-fadeIn delay-200">
                Download Ramveer Classes App
              </button>
            </Link>
          </div>
        </section>

        <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-blue-800 mb-6">Latest Class Content</h2>

          {/* Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
            <select
              value={activeTypeFilter}
              onChange={(e) => setActiveTypeFilter(e.target.value)}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Content Types</option>
              <option value="note">Notes</option>
              <option value="video">Videos</option>
            </select>

            <select
              value={activeClassFilter}
              onChange={(e) => setActiveClassFilter(e.target.value)}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>Class {cls}th</option>
              ))}
            </select>

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

          <div className="grid grid-cols-1 gap-6">
            {filteredContent.map((item, index) => (
              <div key={index}>
                {item.type === 'note' ? (
                  // onDelete prop ko updated function se badla
                  <NoteCard note={item as Note} isAdmin={isAdmin} onDelete={() => handleDeleteNote(item as Note)} onDownload={() => { }} />
                ) : (
                  // onDelete prop ko updated function se badla
                  <VideoCard video={item as Video} isAdmin={isAdmin} onDelete={() => handleDeleteVideo(item as Video)} />
                )}
              </div>
            ))}
          </div>

          {(loading || hasMore) && (
            <div ref={lastPostRef} className="flex justify-center items-center my-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!hasMore && filteredContent.length === 0 && (
            <p className="text-center text-gray-500 text-lg mt-10">No content found for this selection.</p>
          )}
        </section>
      </div>
    </>
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
  );
}

function VideoCard({ video, isAdmin, onDelete }: { video: Video, isAdmin: boolean, onDelete: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (descriptionRef.current && video.description) {
        const style = window.getComputedStyle(descriptionRef.current);
        const maxHeight = parseFloat(style.lineHeight) * 2;
        setIsTruncated(descriptionRef.current.scrollHeight > maxHeight);
      }
    };
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [video.description]);

  const videoId = getYouTubeId(video.youtubeUrl);

   return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Video Player / Thumbnail */}
      <div className="relative w-full aspect-video">
        {videoId && (
          // ✅ FIX: Use 'query' property instead of 'state'
          <Link
            href={{
              pathname: `/videos/${videoId}`,
              query: {
                chapterName: video.chapterName,
                className: video.className,
                subjectName: video.subjectName,
                
              },
            }}
            className="relative w-full h-full group focus:outline-none flex items-center justify-center"
          >
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt="Video Thumbnail"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <FaPlayCircle className="relative z-10 text-white text-6xl opacity-80 group-hover:opacity-100 transition duration-300 transform group-hover:scale-110" />
          </Link>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <p className="text-sm font-semibold text-blue-600 mb-1">
          Class {video.className} {video.subjectName ? `| ${video.subjectName}` : ''} | Chapter {video.chapterNumber}
        </p>
        <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{video.chapterName}</h3>

        {/* Description with Read More / Less */}
        {video.description && (
          <>
            <p
              ref={descriptionRef}
              className={`text-gray-600 text-sm mt-2 whitespace-pre-line ${!isExpanded && isTruncated ? 'line-clamp-2' : ''}`}
            >
              {video.description}
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

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          {/* The existing Link is fine as it opens in a new tab */}
          <Link
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-semibold text-center hover:bg-blue-100 transition-colors duration-300"
          >
            Watch on YouTube
          </Link>
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
