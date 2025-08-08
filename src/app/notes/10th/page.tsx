// "use client";

// import React, { useState, useEffect } from "react";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { app } from '../../../../firebaseConfig';

// interface Note {
//   chapterNumber: string;
//   chapterName: string;
//   url: string;
//   public_id: string;
//   className?: string;
// }

// export default function TenthNotesPage() {
//   const [notes, setNotes] = useState<Note[]>([]);
//   const [fetching, setFetching] = useState(true);
//   const [isAdmin, setIsAdmin] = useState(false);

//   // Firebase auth check
//   useEffect(() => {
//     const auth = getAuth(app);
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setIsAdmin(!!user);
//     });
//     return () => unsubscribe();
//   }, []);

//   // Fetch notes
//   useEffect(() => {
//     const fetchNotes = async () => {
//       try {
//         const res = await fetch("/api/upload");
//         const data = await res.json();

//         // Filter only 10th class notes
//         const filtered = data.filter((note: Note) => note.className === "10");
//         setNotes(filtered);
//       } catch (error) {
//         console.error("Error fetching notes:", error);
//       } finally {
//         setFetching(false);
//       }
//     };

//     fetchNotes();
//   }, []);

//   // Delete note handler
//   const handleDelete = async (public_id: string) => {
//     if (!confirm("Are you sure you want to delete this note?")) return;

//     try {
//       const res = await fetch("/api/upload", {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ public_id }),
//       });

//       if (!res.ok) throw new Error("Delete failed");

//       setNotes((prev) => prev.filter((note) => note.public_id !== public_id));
//     } catch (error) {
//       alert("Failed to delete note");
//       console.error(error);
//     }
//   };

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">10th Class Math Notes</h1>

//       {fetching ? (
//         <div className="flex justify-center items-center h-40">
//           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//         </div>
//       ) : notes.length === 0 ? (
//         <p className="text-center text-gray-500">No 10th class notes found.</p>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {notes.map((note) => (
//             <div key={note.public_id} className="bg-white p-4 rounded-lg shadow-md">
//               <h3 className="text-lg font-semibold">Chapter {note.chapterNumber}</h3>
//               <p className="text-gray-600">{note.chapterName}</p>
//               <div className="mt-4 flex space-x-2">
//                 <a
//                   href={note.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="px-4 py-2 bg-blue-600 text-white rounded-md"
//                 >
//                   Read
//                 </a>
//                 <a
//                   href={note.url}
//                   download
//                   className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md"
//                 >
//                   Download
//                 </a>
//                 {isAdmin && (
//                   <button
//                     onClick={() => handleDelete(note.public_id)}
//                     className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
//                   >
//                     Delete
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }


// src/app/notes/10th/page.tsx

// src/app/notes/10th/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from '../../../../firebaseConfig';
import Image from "next/image";

interface Note {
  chapterNumber: string;
  chapterName: string;
  url: string; // PDF URL
  public_id: string; // PDF public ID
  className?: string;
  thumbnailUrl: string; // New field for the thumbnail image URL
  thumbnailPublicId: string; // New field for the thumbnail public ID
}

// Separate component for the thumbnail to manage its own loading state
const Thumbnail = ({ note }: { note: Note }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {note.thumbnailUrl ? (
        <Image
          src={note.thumbnailUrl}
          alt={note.chapterName}
          layout="fill"
          objectFit="cover"
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoadingComplete={() => setIsLoading(false)}
          priority
        />
      ) : (
        <p className="text-gray-500 text-sm">No image available</p>
      )}
    </div>
  );
};

export default function TenthNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch("/api/upload");
        const data = await res.json();
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

  const handleDelete = async (public_id: string, thumbnailPublicId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id, thumbnailPublicId }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setNotes((prev) => prev.filter((note) => note.public_id !== public_id));
    } catch (error) {
      alert("Failed to delete note");
      console.error(error);
    }
  };

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">10th Class Math Notes</h1>
      {fetching ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No 10th class notes found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {notes.map((note) => (
            <div
              key={note.public_id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex flex-col"
            >
              <Thumbnail note={note} />
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 truncate">{note.chapterName}</h3>
                  <p className="text-gray-500 text-sm mt-1">Chapter {note.chapterNumber}</p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleDownload(note.url, note.chapterName)}
                    className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md text-sm font-semibold hover:bg-blue-100 transition-colors duration-300"
                  >
                    Download
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(note.public_id, note.thumbnailPublicId)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors duration-300"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
