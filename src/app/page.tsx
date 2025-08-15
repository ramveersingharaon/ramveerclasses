
// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { app } from '../../firebaseConfig';
// import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
// import { FaFilePdf, FaPlayCircle } from 'react-icons/fa';
// import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

// // Define a union type for different content types
// type Content = Note | Video;

// interface Note {
//   type: 'note';
//   chapterNumber: string;
//   chapterName: string;
//   url: string;
//   publicId: string;
//   className?: string;
//   subjectName?: string;
//   created_at: string;
//   description?: string;
// }

// interface Video {
//   type: 'video';
//   chapterNumber: string;
//   chapterName: string;
//   youtubeUrl: string;
//   className?: string;
//   subjectName?: string;
//   created_at: string;
//   description?: string;
// }

// // Function to extract YouTube Video ID from various URL formats
// const getYouTubeId = (url: string): string | null => {
//   const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:.+)?$/;
//   const match = url.match(regExp);
//   return match ? match[1] : null;
// };

// export default function HomePage() {
//   const [allContent, setAllContent] = useState<Content[]>([]);
//   const [filteredContent, setFilteredContent] = useState<Content[]>([]);
//   const [displayedContent, setDisplayedContent] = useState<Content[]>([]);
//   const [fetching, setFetching] = useState(true);
//   const [isAdmin, setIsAdmin] = useState(false);

//   // State for filters
//   const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
//   const [activeClassFilter, setActiveClassFilter] = useState<string>('all');
//   const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');

//   const [availableClasses, setAvailableClasses] = useState<string[]>([]);
//   const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

//   const scrollContainerRef = useRef<HTMLDivElement>(null);
//   const [itemsToDisplay, setItemsToDisplay] = useState(0);

//   // Dragging state
//   const [isDragging, setIsDragging] = useState(false);
//   const [startX, setStartX] = useState(0);
//   const [scrollPosition, setScrollPosition] = useState(0);

//   // Firebase auth check
//   useEffect(() => {
//     const auth = getAuth(app);
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setIsAdmin(!!user);
//     });
//     return () => unsubscribe();
//   }, []);

//   // Fetch all notes and videos
//   useEffect(() => {
//     const fetchContent = async () => {
//       try {
//         setFetching(true);
//         const [notesRes, videosRes] = await Promise.all([
//           fetch("/api/upload"),
//           fetch("/api/upload-video"),
//         ]);

//         const notesRawData = notesRes.ok ? await notesRes.json() : null;
//         const videosRawData = videosRes.ok ? await videosRes.json() : null;

//         // Notes डेटा को सही से निकालें
//         let notesArray: any[] = [];
//         if (Array.isArray(notesRawData)) {
//           notesArray = notesRawData;
//         } else if (notesRawData && Array.isArray(notesRawData.notes)) {
//           notesArray = notesRawData.notes;
//         }

//         // Videos डेटा को सही से निकालें
//         let videosArray: any[] = [];
//         if (Array.isArray(videosRawData)) {
//           videosArray = videosRawData;
//         } else if (videosRawData && Array.isArray(videosRawData.videos)) {
//           videosArray = videosRawData.videos;
//         }

//         const notes = notesArray.map((note: any) => ({
//           ...note,
//           type: 'note',
//           publicId: note.publicId || note.public_id,
//           description: note.description || ''
//         }) as Note);
        
//         const videos = videosArray.map((video: any) => ({
//           ...video,
//           type: 'video',
//           description: video.description || ''
//         }) as Video);

//         const combinedContent = [...notes, ...videos].sort((a, b) =>
//           new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//         );

//         setAllContent(combinedContent);
//       } catch (error) {
//         console.error("Error fetching content:", error);
//       } finally {
//         setFetching(false);
//       }
//     };
//     fetchContent();
//   }, []);

//   // Extract unique classes and subjects for filters
//   useEffect(() => {
//     const classes = Array.from(new Set(allContent.map(item => item.className).filter(Boolean))) as string[];
//     setAvailableClasses(classes.sort((a, b) => parseInt(b) - parseInt(a)));

//     const subjects = Array.from(new Set(allContent.map(item => item.subjectName).filter(Boolean))) as string[];
//     setAvailableSubjects(subjects.sort());
//   }, [allContent]);

//   // Handle filter changes and reset staggered loading
//   useEffect(() => {
//     let newFilteredContent = allContent;

//     if (activeTypeFilter !== 'all') {
//       newFilteredContent = newFilteredContent.filter(item => item.type === activeTypeFilter);
//     }
//     if (activeClassFilter !== 'all') {
//       newFilteredContent = newFilteredContent.filter(item => item.className === activeClassFilter);
//     }
//     if (activeSubjectFilter !== 'all') {
//       newFilteredContent = newFilteredContent.filter(item => item.subjectName === activeSubjectFilter);
//     }

//     setFilteredContent(newFilteredContent);
//     setItemsToDisplay(0); // Reset the staggered loading counter
//   }, [activeTypeFilter, activeClassFilter, activeSubjectFilter, allContent]);

//   // Handle staggered loading effect
//   useEffect(() => {
//     if (itemsToDisplay < filteredContent.length) {
//       const timer = setTimeout(() => {
//         setDisplayedContent(filteredContent.slice(0, itemsToDisplay + 1));
//         setItemsToDisplay(prev => prev + 1);
//       }, 100); // 100ms delay between each card load
//       return () => clearTimeout(timer);
//     }
//     // If all items are displayed, just set the displayed content
//     if (itemsToDisplay >= filteredContent.length) {
//       setDisplayedContent(filteredContent);
//     }
//   }, [itemsToDisplay, filteredContent]);

//   const handleDownload = async (url: string, chapterName: string) => {
//     try {
//       const response = await fetch(url);
//       const blob = await response.blob();
//       const blobUrl = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = blobUrl;
//       link.setAttribute('download', `${chapterName}.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(blobUrl);
//     } catch (error) {
//       alert("Failed to download file.");
//       console.error("Download error:", error);
//     }
//   };

//   const handleDelete = async (item: Content) => {
//     if (!confirm("Are you sure you want to delete this content?")) return;
//     try {
//       let endpoint = '';
//       let urlParams = '';

//       if (item.type === 'note') {
//         endpoint = "/api/upload";
//         urlParams = `?publicId=${(item as Note).publicId}`;
//       } else {
//         endpoint = "/api/upload-video";
//         urlParams = `?youtubeUrl=${(item as Video).youtubeUrl}`;
//       }

//       const res = await fetch(endpoint + urlParams, {
//         method: "DELETE",
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data.message || "Delete failed");

//       setAllContent((prev) => prev.filter((content) => {
//         if (content.type === 'note' && item.type === 'note') {
//           return content.publicId !== item.publicId;
//         }
//         if (content.type === 'video' && item.type === 'video') {
//           return content.youtubeUrl !== item.youtubeUrl;
//         }
//         return true;
//       }));

//       alert("Content deleted successfully!");
//     } catch (error) {
//       alert("Failed to delete content: " + (error as Error).message);
//       console.error(error);
//     }
//   };

//   const scrollTagsLeft = () => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
//     }
//   };

//   const scrollTagsRight = () => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
//     }
//   };

//   // Dragging event handlers for desktop
//   const onMouseDown = (e: React.MouseEvent) => {
//     if (scrollContainerRef.current) {
//       setIsDragging(true);
//       setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
//       setScrollPosition(scrollContainerRef.current.scrollLeft);
//     }
//   };

//   const onMouseLeave = () => {
//     setIsDragging(false);
//   };

//   const onMouseUp = () => {
//     setIsDragging(false);
//   };

//   const onMouseMove = (e: React.MouseEvent) => {
//     if (!isDragging || !scrollContainerRef.current) return;
//     e.preventDefault();
//     const x = e.pageX - scrollContainerRef.current.offsetLeft;
//     const walk = (x - startX) * 1;
//     scrollContainerRef.current.scrollLeft = scrollPosition - walk;
//   };

//   // Touch event handlers for mobile
//   const onTouchStart = (e: React.TouchEvent) => {
//     if (scrollContainerRef.current) {
//       setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
//       setScrollPosition(scrollContainerRef.current.scrollLeft);
//       setIsDragging(true);
//     }
//   };

//   const onTouchMove = (e: React.TouchEvent) => {
//     if (!isDragging || !scrollContainerRef.current) return;
//     const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
//     const walk = (x - startX) * 1;
//     scrollContainerRef.current.scrollLeft = scrollPosition - walk;
//   };

//   const onTouchEnd = () => {
//     setIsDragging(false);
//   };

//   return (
//     <>
//       <style jsx>{`
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .stagger-fade-in {
//           animation: fadeIn 0.5s ease-in-out forwards;
//           opacity: 0;
//         }
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
//       `}</style>
//       <div className="min-h-screen bg-gray-100 text-gray-800">

//         <section className="bg-blue-600 text-white py-20 px-4 sm:px-6 lg:px-8 text-center">
//           <div className="max-w-4xl mx-auto">
//             <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 animate-fadeIn">
//               Ramveer Classes
//             </h1>
//             <p className="text-lg sm:text-xl mb-8 animate-fadeIn delay-100">
//               Dedicated to providing quality education to UP Board students. Access notes and video lectures to excel in your studies.
//             </p>
//             <Link href="/download-app" passHref>
//               <button className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105 animate-fadeIn delay-200">
//                 Download Ramveer Classes App
//               </button>
//             </Link>
//           </div>
//         </section>

//         <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
//           <h2 className="text-3xl sm:text-4xl font-bold text-center text-blue-800 mb-6">Latest Class Content</h2>

//           {/* Filter Section */}
//           <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
//             {/* Type Filter Dropdown */}
//             <select
//               value={activeTypeFilter}
//               onChange={(e) => setActiveTypeFilter(e.target.value)}
//               className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
//             >
//               <option value="all">All Content Types</option>
//               <option value="note">Notes</option>
//               <option value="video">Videos</option>
//             </select>
            
//             {/* Class Filter Dropdown */}
//             <select
//               value={activeClassFilter}
//               onChange={(e) => { setActiveClassFilter(e.target.value); setActiveSubjectFilter('all'); }}
//               className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
//             >
//               <option value="all">All Classes</option>
//               {availableClasses.map(cls => (
//                 <option key={cls} value={cls}>Class {cls}th</option>
//               ))}
//             </select>

//             {/* Subject Filter Dropdown (conditional) */}
//             {activeClassFilter !== 'all' && (
//               <select
//                 value={activeSubjectFilter}
//                 onChange={(e) => setActiveSubjectFilter(e.target.value)}
//                 className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
//               >
//                 <option value="all">All Subjects</option>
//                 {availableSubjects.map(subject => (
//                   <option key={subject} value={subject}>{subject}</option>
//                 ))}
//               </select>
//             )}
//           </div>
          

//           {fetching && filteredContent.length === 0 ? (
//             <div className="flex justify-center items-center h-40">
//               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//             </div>
//           ) : displayedContent.length === 0 && !fetching ? (
//             <p className="text-center text-gray-500 text-lg mt-10">No content found for this selection.</p>
//           ) : (
//             <div className="grid grid-cols-1 gap-6">
//               {displayedContent.map((item, index) => (
//                 <div key={index} style={{ animationDelay: `${index * 50}ms` }} className="stagger-fade-in">
//                   {item.type === 'note' ? (
//                     <NoteCard note={item as Note} isAdmin={isAdmin} onDelete={() => handleDelete(item)} onDownload={handleDownload} />
//                   ) : (
//                     <VideoCard video={item as Video} isAdmin={isAdmin} onDelete={() => handleDelete(item)} />
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }

// // Reusable Card Components
// function NoteCard({ note, isAdmin, onDelete, onDownload }: { note: Note, isAdmin: boolean, onDelete: () => void, onDownload: (url: string, chapterName: string) => void }) {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const descriptionRef = useRef<HTMLParagraphElement>(null);
//   const [isTruncated, setIsTruncated] = useState(false);

//   useEffect(() => {
//     const checkTruncation = () => {
//       if (descriptionRef.current && note.description) {
//         const style = window.getComputedStyle(descriptionRef.current);
//         const maxHeight = parseFloat(style.lineHeight) * 2; // Check for 2 lines
//         setIsTruncated(descriptionRef.current.scrollHeight > maxHeight);
//       }
//     };

//     checkTruncation();
//     window.addEventListener('resize', checkTruncation);
//     return () => window.removeEventListener('resize', checkTruncation);
//   }, [note.description]);

//   return (
//     <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl">
//       <div className="relative w-full h-48 md:w-60 md:h-48 flex-shrink-0 flex items-center justify-center bg-gray-200">
//         <FaFilePdf className="text-gray-500 text-6xl" />
//       </div>
//       <div className="flex-1 p-5 flex flex-col justify-between">
//         <div>
//           <p className="text-sm font-semibold text-blue-600 mb-1">
//             Class {note.className} {note.subjectName ? `| ${note.subjectName}` : ''} | Chapter {note.chapterNumber}
//           </p>
//           <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{note.chapterName}</h3>
//           {note.description && (
//             <>
//               <p
//                 ref={descriptionRef}
//                 className={`text-gray-600 text-sm mt-2 whitespace-pre-line ${!isExpanded && isTruncated ? 'line-clamp-10' : ''}`}
//               >
//                 {note.description}
//               </p>
//               {isTruncated && (
//                 <button
//                   onClick={() => setIsExpanded(!isExpanded)}
//                   className="text-blue-600 hover:underline flex items-center mt-2 text-sm"
//                 >
//                   {isExpanded ? (
//                     <>
//                       Read Less <BiChevronUp className="ml-1" />
//                     </>
//                   ) : (
//                     <>
//                       Read More <BiChevronDown className="ml-1" />
//                     </>
//                   )}
//                 </button>
//               )}
//             </>
//           )}
//         </div>
//         <div className="mt-4 flex space-x-2">
//           <button
//             onClick={() => onDownload(note.url, note.chapterName)}
//             className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-semibold hover:bg-blue-100 transition-colors duration-300"
//           >
//             Download
//           </button>
//           {isAdmin && (
//             <button
//               onClick={onDelete}
//               className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors duration-300"
//             >
//               Delete
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function VideoCard({ video, isAdmin, onDelete }: { video: Video, isAdmin: boolean, onDelete: () => void }) {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const descriptionRef = useRef<HTMLParagraphElement>(null);
//   const [isTruncated, setIsTruncated] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);

//   useEffect(() => {
//     const checkTruncation = () => {
//       if (descriptionRef.current && video.description) {
//         const style = window.getComputedStyle(descriptionRef.current);
//         const maxHeight = parseFloat(style.lineHeight) * 2;
//         setIsTruncated(descriptionRef.current.scrollHeight > maxHeight);
//       }
//     };
//     checkTruncation();
//     window.addEventListener('resize', checkTruncation);
//     return () => window.removeEventListener('resize', checkTruncation);
//   }, [video.description]);

//   const videoId = getYouTubeId(video.youtubeUrl);

//   const handlePlay = () => {
//     if (videoId) {
//       setIsPlaying(true);
//     } else {
//       alert("Invalid YouTube URL. Please check the video link.");
//     }
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl">
//       <div className="relative w-full h-auto aspect-w-16 aspect-h-9 md:w-60 md:h-48 flex-shrink-0 flex items-center justify-center bg-gray-200">
//         {isPlaying && videoId ? (
//           <iframe
//             className="absolute top-0 left-0 w-full h-full"
//             src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
//             title={video.chapterName}
//             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//             allowFullScreen
//           />
//         ) : (
//           <button onClick={handlePlay} className="relative w-full h-full group focus:outline-none flex items-center justify-center">
//             {videoId && (
//               <img
//                 src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
//                 alt="Video Thumbnail"
//                 className="absolute inset-0 w-full h-full object-cover"
//               />
//             )}
//             <FaPlayCircle className="relative z-10 text-white text-6xl opacity-80 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110" />
//           </button>
//         )}
//       </div>

//       <div className="flex-1 p-5 flex flex-col justify-between">
//         <div>
//           <p className="text-sm font-semibold text-blue-600 mb-1">
//             Class {video.className} {video.subjectName ? `| ${video.subjectName}` : ''} | Chapter {video.chapterNumber}
//           </p>
//           <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{video.chapterName}</h3>
//           {video.description && (
//             <>
//               <p
//                 ref={descriptionRef}
//                 className={`text-gray-600 text-sm mt-2 whitespace-pre-line ${!isExpanded && isTruncated ? 'line-clamp-2' : ''}`}
//               >
//                 {video.description}
//               </p>
//               {isTruncated && (
//                 <button
//                   onClick={() => setIsExpanded(!isExpanded)}
//                   className="text-blue-600 hover:underline flex items-center mt-2 text-sm"
//                 >
//                   {isExpanded ? (
//                     <>
//                       Read Less <BiChevronUp className="ml-1" />
//                     </>
//                   ) : (
//                     <>
//                       Read More <BiChevronDown className="ml-1" />
//                     </>
//                   )}
//                 </button>
//               )}
//             </>
//           )}
//         </div>
//         <div className="mt-4 flex space-x-2">
//           <Link
//             href={video.youtubeUrl}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-semibold text-center hover:bg-blue-100 transition-colors duration-300"
//           >
//             Watch on YouTube
//           </Link>
//           {isAdmin && (
//             <button
//               onClick={onDelete}
//               className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors duration-300"
//             >
//               Delete
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }















"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../../firebaseConfig';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { FaPlayCircle } from 'react-icons/fa';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';

// Define a union type for different content types
type Content = Note | Video;

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

// Function to extract YouTube Video ID from various URL formats
const getYouTubeId = (url: string): string | null => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:.+)?$/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export default function HomePage() {
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [filteredContent, setFilteredContent] = useState<Content[]>([]);
  const [displayedContent, setDisplayedContent] = useState<Content[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // State for filters
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [activeClassFilter, setActiveClassFilter] = useState<string>('all');
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');

  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [itemsToDisplay, setItemsToDisplay] = useState(0);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);

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
        setFetching(true);
        const [notesRes, videosRes] = await Promise.all([
          fetch("/api/upload"),
          fetch("/api/upload-video"),
        ]);

        const notesRawData = notesRes.ok ? await notesRes.json() : null;
        const videosRawData = videosRes.ok ? await videosRes.json() : null;

        // Notes डेटा को सही से निकालें
        let notesArray: any[] = [];
        if (Array.isArray(notesRawData)) {
          notesArray = notesRawData;
        } else if (notesRawData && Array.isArray(notesRawData.notes)) {
          notesArray = notesRawData.notes;
        }

        // Videos डेटा को सही से निकालें
        let videosArray: any[] = [];
        if (Array.isArray(videosRawData)) {
          videosArray = videosRawData;
        } else if (videosRawData && Array.isArray(videosRawData.videos)) {
          videosArray = videosRawData.videos;
        }

        const notes = notesArray.map((note: any) => ({
          ...note,
          type: 'note',
          publicId: note.publicId || note.public_id,
          description: note.description || ''
        }) as Note);
        
        const videos = videosArray.map((video: any) => ({
          ...video,
          type: 'video',
          description: video.description || ''
        }) as Video);

        const combinedContent = [...notes, ...videos].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setAllContent(combinedContent);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchContent();
  }, []);

  // Extract unique classes and subjects for filters
  useEffect(() => {
    const classes = Array.from(new Set(allContent.map(item => item.className).filter(Boolean))) as string[];
    setAvailableClasses(classes.sort((a, b) => parseInt(b) - parseInt(a)));

    const subjects = Array.from(new Set(allContent.map(item => item.subjectName).filter(Boolean))) as string[];
    setAvailableSubjects(subjects.sort());
  }, [allContent]);

  // Handle filter changes and reset staggered loading
  useEffect(() => {
    let newFilteredContent = allContent;

    if (activeTypeFilter !== 'all') {
      newFilteredContent = newFilteredContent.filter(item => item.type === activeTypeFilter);
    }
    if (activeClassFilter !== 'all') {
      newFilteredContent = newFilteredContent.filter(item => item.className === activeClassFilter);
    }
    if (activeSubjectFilter !== 'all') {
      newFilteredContent = newFilteredContent.filter(item => item.subjectName === activeSubjectFilter);
    }

    setFilteredContent(newFilteredContent);
    setItemsToDisplay(0); // Reset the staggered loading counter
  }, [activeTypeFilter, activeClassFilter, activeSubjectFilter, allContent]);

  // Handle staggered loading effect
  useEffect(() => {
    if (itemsToDisplay < filteredContent.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(filteredContent.slice(0, itemsToDisplay + 1));
        setItemsToDisplay(prev => prev + 1);
      }, 100); // 100ms delay between each card load
      return () => clearTimeout(timer);
    }
    // If all items are displayed, just set the displayed content
    if (itemsToDisplay >= filteredContent.length) {
      setDisplayedContent(filteredContent);
    }
  }, [itemsToDisplay, filteredContent]);

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
      let urlParams = '';

      if (item.type === 'note') {
        endpoint = "/api/upload";
        urlParams = `?publicId=${(item as Note).publicId}`;
      } else {
        endpoint = "/api/upload-video";
        urlParams = `?youtubeUrl=${(item as Video).youtubeUrl}`;
      }

      const res = await fetch(endpoint + urlParams, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Delete failed");

      setAllContent((prev) => prev.filter((content) => {
        if (content.type === 'note' && item.type === 'note') {
          return content.publicId !== item.publicId;
        }
        if (content.type === 'video' && item.type === 'video') {
          return content.youtubeUrl !== item.youtubeUrl;
        }
        return true;
      }));

      alert("Content deleted successfully!");
    } catch (error) {
      alert("Failed to delete content: " + (error as Error).message);
      console.error(error);
    }
  };

  const scrollTagsLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollTagsRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Dragging event handlers for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    if (scrollContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1;
    scrollContainerRef.current.scrollLeft = scrollPosition - walk;
  };

  // Touch event handlers for mobile
  const onTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current) {
      setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
      setScrollPosition(scrollContainerRef.current.scrollLeft);
      setIsDragging(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1;
    scrollContainerRef.current.scrollLeft = scrollPosition - walk;
  };

  const onTouchEnd = () => {
    setIsDragging(false);
  };

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
        .stagger-fade-in {
          animation: fadeIn 0.5s ease-in-out forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
            {/* Type Filter Dropdown */}
            <select
              value={activeTypeFilter}
              onChange={(e) => setActiveTypeFilter(e.target.value)}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Content Types</option>
              <option value="note">Notes</option>
              <option value="video">Videos</option>
            </select>
            
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
          

          {fetching && filteredContent.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedContent.length === 0 && !fetching ? (
            <p className="text-center text-gray-500 text-lg mt-10">No content found for this selection.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {displayedContent.map((item, index) => (
                <div key={index} style={{ animationDelay: `${index * 50}ms` }} className="stagger-fade-in">
                  {item.type === 'note' ? (
                    <NoteCard note={item as Note} isAdmin={isAdmin} onDelete={() => handleDelete(item)} onDownload={handleDownload} />
                  ) : (
                    <VideoCard video={item as Video} isAdmin={isAdmin} onDelete={() => handleDelete(item)} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// Reusable Card Components
function NoteCard({ note, isAdmin, onDelete, onDownload }: { note: Note, isAdmin: boolean, onDelete: () => void, onDownload: (url: string, chapterName: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (descriptionRef.current && note.description) {
        const style = window.getComputedStyle(descriptionRef.current);
        const maxHeight = parseFloat(style.lineHeight) * 2; // Check for 2 lines
        setIsTruncated(descriptionRef.current.scrollHeight > maxHeight);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [note.description]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row transform transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl">
      
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600 mb-1">
            Class {note.className} {note.subjectName ? `| ${note.subjectName}` : ''} | Chapter {note.chapterNumber}
          </p>
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{note.chapterName}</h3>
          {note.description && (
            <>
              <p
                ref={descriptionRef}
                className={`text-gray-600 text-sm mt-2 whitespace-pre-line ${!isExpanded && isTruncated ? 'line-clamp-10' : ''}`}
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
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="Video Thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
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