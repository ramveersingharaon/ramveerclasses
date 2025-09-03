"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import React from "react";

const classes = ['6', '7', '8', '9', '10', '11', '12'];
const subjects = ['Math', 'Science', 'Physics', 'Chemistry'];

// API responses के लिए एक interface define करें ताकि 'any' error fix हो जाए
interface UploadResponse {
  message?: string;
  error?: string;
}

// Main Dashboard component
export default function DashboardPage() {
  const router = useRouter();
  
  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Note form states
  const [noteChapterName, setNoteChapterName] = useState("");
  const [noteChapterNumber, setNoteChapterNumber] = useState("");
  const [noteClassName, setNoteClassName] = useState(classes[0]);
  const [noteSubjectName, setNoteSubjectName] = useState(subjects[0]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [noteImages, setNoteImages] = useState<File[]>([]); 

  // Video form states
  const [videoChapterName, setVideoChapterName] = useState("");
  const [videoChapterNumber, setVideoChapterNumber] = useState("");
  const [videoClassName, setVideoClassName] = useState(classes[0]);
  const [videoSubjectName, setVideoSubjectName] = useState(subjects[0]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoDescription, setVideoDescription] = useState("");

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      }
    });
    return unsubscribe;
  }, [router]);

  // Handles user logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Uploads a new note PDF file
  const uploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !noteChapterName || !noteChapterNumber || !noteClassName || !noteSubjectName) {
      return alert("All fields and a PDF file are required!");
    }
    if (noteImages.length === 0) {
      return alert("Please upload at least one image!");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("chapterName", noteChapterName);
    formData.append("chapterNumber", noteChapterNumber);
    formData.append("className", noteClassName);
    formData.append("subjectName", noteSubjectName);
    noteImages.forEach((image) => {
      formData.append(`images`, image);
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log(res)
      // CHANGES MADE: data का type 'UploadResponse' set किया
      const data: UploadResponse = await res.json();
      setLoading(false);

      if (res.ok) {
        alert("Note uploaded successfully");
        setShowNoteModal(false);
        setNoteChapterName("");
        setNoteChapterNumber("");
        setNoteClassName(classes[0]);
        setNoteSubjectName(subjects[0]);
        setPdfFile(null);
        setNoteImages([]); 
      } else {
        alert("Upload failed: " + (data.message || JSON.stringify(data)));
      }
    } catch (error: unknown) { // CHANGES MADE: error का type 'any' से 'unknown' किया
      console.error("Upload error:", error);
      // error.message को सुरक्षित रूप से access करने के लिए type guard का उपयोग करें
      alert("Something went wrong during upload: " + ((error as Error).message || JSON.stringify(error)));
      setLoading(false);
    }
  };

  // Uploads a new YouTube video link
  const uploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl || !videoChapterName || !videoChapterNumber || !videoClassName || !videoSubjectName) {
      return alert("All fields are required!");
    }
    
    const formData = new FormData();
    formData.append("youtubeUrl", youtubeUrl);
    formData.append("chapterName", videoChapterName);
    formData.append("chapterNumber", videoChapterNumber);
    formData.append("className", videoClassName);
    formData.append("subjectName", videoSubjectName);
    formData.append("description", videoDescription);

    setLoading(true);

    try {
      const res = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      // CHANGES MADE: data का type 'UploadResponse' set किया
      const data: UploadResponse = await res.json();
      setLoading(false);

      if (res.ok) {
        alert("Video uploaded successfully");
        setShowVideoModal(false);
        setVideoChapterName("");
        setVideoChapterNumber("");
        setVideoClassName(classes[0]);
        setVideoSubjectName(subjects[0]);
        setYoutubeUrl("");
        setVideoDescription("");
      } else {
        alert("Video upload failed: " + (data.error || JSON.stringify(data)));
      }
    } catch (error: unknown) { // CHANGES MADE: error का type 'any' से 'unknown' किया
      console.error("Video upload error:", error);
      // error.message को सुरक्षित रूप से access करने के लिए type guard का उपयोग करें
      alert("Something went wrong during video upload: " + ((error as Error).message || JSON.stringify(error)));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 text-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => { setShowNoteModal(true); setNoteClassName(classes[0]); setNoteSubjectName(subjects[0]); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add Note
        </button>
        <button
          onClick={() => { setShowVideoModal(true); setVideoClassName(classes[0]); setVideoSubjectName(subjects[0]); }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Add Video
        </button>
      </div>
      
      {/* Note Modal */}
      {showNoteModal && (
        <Modal title="Add New Note" onClose={() => setShowNoteModal(false)}>
          <form onSubmit={uploadNote} className="space-y-4">
            <Input label="Chapter Number" value={noteChapterNumber} onChange={setNoteChapterNumber} />
            <Input label="Chapter Name" value={noteChapterName} onChange={setNoteChapterName} />
            <FileInput 
              label="Description" 
              accept="image/*" 
              onChange={(files) => setNoteImages(files || [])} 
              multiple={true} 
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-900">Class</label>
                <select
                  value={noteClassName}
                  onChange={(e) => setNoteClassName(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                  required
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{`Class ${cls}`}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-900">Subject</label>
                <select
                  value={noteSubjectName}
                  onChange={(e) => setNoteSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                  required
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
            <FileInput label="PDF File" accept="application/pdf" onChange={(file) => setPdfFile(file ? file[0] : null)} />
            <SubmitButton loading={loading} />
          </form>
        </Modal>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <Modal title="Add New Video" onClose={() => setShowVideoModal(false)}>
          <form onSubmit={uploadVideo} className="space-y-4">
            <Input label="YouTube Video URL" value={youtubeUrl} onChange={setYoutubeUrl} type="url" />
            <Input label="Chapter Number" value={videoChapterNumber} onChange={setVideoChapterNumber} />
            <Input label="Chapter Name" value={videoChapterName} onChange={setVideoChapterName} />
            <Textarea label="Description" value={videoDescription} onChange={setVideoDescription} />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-900">Class</label>
                <select
                  value={videoClassName}
                  onChange={(e) => setVideoClassName(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                  required
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{`Class ${cls}`}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-900">Subject</label>
                <select
                  value={videoSubjectName}
                  onChange={(e) => setVideoSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-gray-900"
                  required
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
            <SubmitButton loading={loading} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// Reusable Components remain the same
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void; }) {
  return (
    <div key={title} className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative text-gray-900">
        <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
          onClick={onClose}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (val: string) => void; type?: string; }) {
  return (
    <div>
      <label className="block mb-1 font-semibold text-gray-900">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded text-gray-900"
        required
      />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (val: string) => void; rows?: number; }) {
  return (
    <div>
      <label className="block mb-1 font-semibold text-gray-900">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded text-gray-900 resize-y"
      />
    </div>
  );
}

function FileInput({ label, accept, onChange, multiple = false }: { label: string; accept: string; onChange: (files: File[] | null) => void; multiple?: boolean; }) {
  return (
    <div>
      <label className="block mb-1 font-semibold text-gray-900">{label}</label>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onChange(e.target.files ? Array.from(e.target.files) : null)}
        className="w-full px-3 py-2 border rounded text-gray-900"
        required
      />
    </div>
  );
}

function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <div className="flex justify-end">
      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300 transition-colors"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}