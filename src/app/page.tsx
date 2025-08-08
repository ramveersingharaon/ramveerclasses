// "use client";

// import Link from "next/link";

// export default function HomePage() {
//   const handleAppClick = () => {
//     alert("Coming Soon");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 text-gray-800">
//       {/* Hero Section */}
//       <section className="bg-blue-600 text-white py-20 text-center px-4">
//         <h1 className="text-4xl md:text-5xl font-bold mb-4">
//           Welcome to Ramveer Classes
//         </h1>
//         <p className="text-lg mb-6">
//           UP Board के students के लिए Classes और Study material उपलब्ध हैं।
//         </p>
//         <div className="flex flex-col md:flex-row justify-center gap-4 flex-wrap">
//           <Link
//             href="/register"
//             className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
//           >
//             Register करें
//           </Link>

//           {/* Updated button with alert */}
//           <button
//             onClick={handleAppClick}
//             className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
//           >
//             App डाउनलोड करें
//           </button>

//           <a
//             href="https://www.youtube.com/@ramveerclasses"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
//           >
//             YouTube पर क्लास देखें
//           </a>
//           <a
//             href="https://chat.whatsapp.com/EL1PtykUXGsCK06hBqEaR4"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
//           >
//             WhatsApp ग्रुप जॉइन करें
//           </a>
//         </div>
//       </section>

//       {/* About Section */}
//       <section className="py-16 px-6 max-w-4xl mx-auto text-center">
//         <h2 className="text-3xl font-bold mb-4">हमारे बारे में</h2>
//         <p className="text-gray-700 leading-relaxed">
//           हमारा मकसद है कि हर छात्र को अच्छी शिक्षा मिले, चाहे वह किसी भी background से हो।
//           हम निशुल्क guidance, notes और वीडियो क्लासेस प्रदान करते हैं ताकि आप अच्छे नंबरों से पास हों।
//         </p>
//       </section>
//     </div>
//   );
// }


// src/app/notes/10th/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../../firebaseConfig';

// Define a union type for different content types
type Content = Note | Video;

interface Note {
  type: 'note';
  chapterNumber: string;
  chapterName: string;
  url: string;
  public_id: string;
  className?: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
  created_at: string;
}

interface Video {
  type: 'video';
  chapterNumber: string;
  chapterName: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  thumbnailPublicId: string;
  className?: string;
  created_at: string;
}

// Function to extract YouTube Video ID from various URL formats
const getYouTubeId = (url: string): string | null => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:.+)?$/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export default function HomePage() {
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [displayedContent, setDisplayedContent] = useState<Content[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all-all');

  // Firebase auth check
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all notes and videos
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [notesRes, videosRes] = await Promise.all([
          fetch("/api/upload"),
          fetch("/api/upload-video"),
        ]);

        const notesData: Note[] = await notesRes.json();
        const videosData: Video[] = await videosRes.json();

        const notes = notesData.map((note) => ({ ...note, type: 'note' as 'note' }));
        const videos = videosData.map((video) => ({ ...video, type: 'video' as 'video' }));

        const combinedContent = [...notes, ...videos].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setAllContent(combinedContent);
        setDisplayedContent(combinedContent);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchContent();
  }, []);
  
  // Handle filter changes
  useEffect(() => {
    const [contentType, className] = activeFilter.split('-');

    let filteredContent = allContent;
    if (contentType !== 'all') {
      filteredContent = filteredContent.filter(item => item.type === contentType);
    }
    if (className !== 'all') {
      filteredContent = filteredContent.filter(item => item.className === className);
    }

    setDisplayedContent(filteredContent);
  }, [activeFilter, allContent]);

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

  const handleDelete = async (item: Content) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    try {
      let endpoint = '';
      let publicIdToDelete = '';
      if (item.type === 'note') {
        endpoint = "/api/upload";
        publicIdToDelete = item.public_id;
      } else {
        // It's a video
        endpoint = "/api/upload-video";
        publicIdToDelete = item.thumbnailPublicId;
      }

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnailPublicId: publicIdToDelete }), // Use thumbnailPublicId for video deletion
      });
      if (!res.ok) throw new Error("Delete failed");

      // Update the state based on the type of content being deleted
      setAllContent((prev) => prev.filter((content) => {
          if (content.type === 'note' && item.type === 'note') {
              return content.public_id !== publicIdToDelete;
          }
          if (content.type === 'video' && item.type === 'video') {
              return content.thumbnailPublicId !== publicIdToDelete;
          }
          return true;
      }));
      
      alert("Content deleted successfully!");
    } catch (error) {
      alert("Failed to delete content");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      
      {/* New Hero Section for Homepage */}
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

        {/* Filter Buttons - Responsive and modern UI */}
        <div className="flex justify-center flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveFilter('all-all')}
            className={`flex-grow sm:flex-grow-0 px-6 py-3 rounded-full font-semibold text-lg transition-colors duration-300 shadow-md ${
              activeFilter === 'all-all' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setActiveFilter('note-10')}
            className={`flex-grow sm:flex-grow-0 px-6 py-3 rounded-full font-semibold text-lg transition-colors duration-300 shadow-md ${
              activeFilter === 'note-10' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            Notes 10th
          </button>
          <button
            onClick={() => setActiveFilter('note-12')}
            className={`flex-grow sm:flex-grow-0 px-6 py-3 rounded-full font-semibold text-lg transition-colors duration-300 shadow-md ${
              activeFilter === 'note-12' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            Notes 12th
          </button>
          <button
            onClick={() => setActiveFilter('video-10')}
            className={`flex-grow sm:flex-grow-0 px-6 py-3 rounded-full font-semibold text-lg transition-colors duration-300 shadow-md ${
              activeFilter === 'video-10' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            Videos 10th
          </button>
          <button
            onClick={() => setActiveFilter('video-12')}
            className={`flex-grow sm:flex-grow-0 px-6 py-3 rounded-full font-semibold text-lg transition-colors duration-300 shadow-md ${
              activeFilter === 'video-12' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            Videos 12th
          </button>
        </div>

        {fetching ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayedContent.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No content found for this selection.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedContent.map((item) => (
              item.type === 'note' ? (
                <NoteCard key={item.public_id} note={item} isAdmin={isAdmin} onDelete={() => handleDelete(item)} onDownload={handleDownload} />
              ) : (
                <VideoCard key={item.thumbnailPublicId} video={item} isAdmin={isAdmin} onDelete={() => handleDelete(item)} />
              )
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Reusable Card Components
function NoteCard({ note, isAdmin, onDelete, onDownload }: { note: Note, isAdmin: boolean, onDelete: () => void, onDownload: (url: string, chapterName: string) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex flex-col">
      <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
        {note.thumbnailUrl ? (
          <Image
            src={note.thumbnailUrl}
            alt={note.chapterName}
            layout="fill"
            objectFit="cover"
            priority
          />
        ) : (
          <p className="text-gray-500 text-sm">No image available</p>
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 truncate">{note.chapterName}</h3>
          <p className="text-gray-500 text-sm mt-1">
            Chapter {note.chapterNumber} (Class {note.className})
          </p>
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
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Use the new, robust function to get the video ID
  const videoId = getYouTubeId(video.youtubeUrl);

  // Generate a default YouTube thumbnail URL if one is not provided
  const thumbnailUrl = video.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);

  const handlePlay = () => {
    if (videoId) {
      setIsPlaying(true);
    } else {
      alert("Invalid YouTube URL. Please check the video link.");
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex flex-col">
      <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
        {isPlaying && videoId ? (
          // Show the iframe when isPlaying is true and videoId is valid
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={video.chapterName}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          // Show the thumbnail and play button when not playing
          thumbnailUrl ? (
            <button onClick={handlePlay} className="absolute inset-0 w-full h-full group focus:outline-none">
              <Image
                src={thumbnailUrl}
                alt={video.chapterName}
                layout="fill"
                objectFit="cover"
                priority
              />
              {/* Play Button Icon */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-100 group-hover:opacity-100 transition-opacity duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
              </div>
            </button>
          ) : (
            <p className="text-gray-500 text-sm">No image available</p>
          )
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 truncate">{video.chapterName}</h3>
          <p className="text-gray-500 text-sm mt-1">
            Chapter {video.chapterNumber} (Class {video.className})
          </p>
        </div>
        <div className="mt-4 flex space-x-2">
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