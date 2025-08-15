"use client";

import React, { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../../../firebaseConfig';
import Link from "next/link";
import { FaPlayCircle } from 'react-icons/fa';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';
import Image from 'next/image';

// Type definition for Video
interface Video {
  type: 'video';
  chapterNumber: string;
  chapterName: string;
  youtubeUrl: string;
  className?: string;
  subjectName?: string;
  created_at: string;
  description?: string;
}

// Function to extract YouTube Video ID
const getYouTubeId = (url: string): string | null => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:.+)?$/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export default function VideosPage() {
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
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

  // Fetch all videos from the API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setFetching(true);
        const res = await fetch("/api/upload-video");
        const data = res.ok ? await res.json() : [];

        if (Array.isArray(data)) {
          const videos = data.map(video => ({ ...video, type: 'video' }) as Video)
          setAllVideos(videos);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchVideos();
  }, []);

  // Extract unique classes and subjects for filter options
  useEffect(() => {
    const classes = Array.from(new Set(allVideos.map(video => video.className).filter(Boolean))) as string[];
    setAvailableClasses(classes.sort((a, b) => parseInt(b) - parseInt(a)));

    const subjects = Array.from(new Set(allVideos.map(video => video.subjectName).filter(Boolean))) as string[];
    setAvailableSubjects(subjects.sort());
  }, [allVideos]);

  // Apply filters whenever filter states or allVideos change
  useEffect(() => {
    let newFilteredVideos = allVideos;

    if (activeClassFilter !== 'all') {
      newFilteredVideos = newFilteredVideos.filter(video => video.className === activeClassFilter);
    }
    if (activeSubjectFilter !== 'all') {
      newFilteredVideos = newFilteredVideos.filter(video => video.subjectName === activeSubjectFilter);
    }

    setFilteredVideos(newFilteredVideos);
  }, [activeClassFilter, activeSubjectFilter, allVideos]);

  const handleDelete = async (youtubeUrl: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      const res = await fetch(`/api/upload-video?youtubeUrl=${youtubeUrl}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");

      setAllVideos((prev) => prev.filter((video) => video.youtubeUrl !== youtubeUrl));
      alert("Video deleted successfully!");
    } catch (error) {
      alert("Failed to delete video: " + (error as Error).message);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-800 mb-8">All Video Lectures</h1>

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

        {/* Videos Display */}
        {fetching ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No videos found for this selection.</p>
        ) : (
          // Single column grid for videos
          <div className="grid grid-cols-1 gap-6">
            {filteredVideos.map((video, index) => (
              <VideoCard key={index} video={video} isAdmin={isAdmin} onDelete={() => handleDelete(video.youtubeUrl)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable VideoCard Component (Modified for this page)
function VideoCard({ video, isAdmin, onDelete }: { video: Video, isAdmin: boolean, onDelete: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handlePlay = () => {
    if (videoId) {
      setIsPlaying(true);
    } else {
      alert("Invalid YouTube URL. Please check the video link.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Video Player / Thumbnail */}
      <div className="relative w-full aspect-video">
        {isPlaying && videoId ? (
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={video.chapterName}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={handlePlay}
            className="relative w-full h-full group focus:outline-none flex items-center justify-center"
          >
            {videoId && (
              <Image
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Video Thumbnail"
                layout="fill"
                objectFit="cover"
              />
            )}
            <FaPlayCircle className="relative z-10 text-white text-6xl opacity-80 group-hover:opacity-100 transition duration-300 transform group-hover:scale-110" />
          </button>
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

  );
}