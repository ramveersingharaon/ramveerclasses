// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { auth } from "../../../firebaseConfig";
// import Image from "next/image";

// type Student = {
//   id: string;
//   name: string;
//   email: string;
//   className: string;
//   mobile: string;
//   village: string;
//   district: string;
//   imageUrl: string;
//   public_id: string;
// };

// export default function DashboardPage() {
//   const router = useRouter();
//   const [students, setStudents] = useState<Student[]>([]);
//   const [loadingStudents, setLoadingStudents] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);

//   const [showNoteModal, setShowNoteModal] = useState(false);
//   const [showTeamModal, setShowTeamModal] = useState(false);
//   const [showMentorModal, setShowMentorModal] = useState(false);

//   // Note form
//   const [chapterName, setChapterName] = useState("");
//   const [chapterNumber, setChapterNumber] = useState("");
//   const [className, setClassName] = useState(""); // className added
//   const [pdfFile, setPdfFile] = useState<File | null>(null);

//   // Team/Mentor form
//   const [personName, setPersonName] = useState("");
//   const [role, setRole] = useState("");
//   const [imageFile, setImageFile] = useState<File | null>(null);

//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (!user) router.push("/login");
//     });
//     fetchStudents();
//     return unsubscribe;
//   }, [router]);

//   const fetchStudents = async () => {
//     try {
//       setLoadingStudents(true);
//       const res = await fetch("/api/upload-student");
//       const data = await res.json();
//       if (res.ok) {
//         setStudents(data.students || []);
//       } else {
//         console.error("Failed to fetch students:", data.error);
//       }
//     } catch (error) {
//       console.error("Error fetching students:", error);
//     } finally {
//       setLoadingStudents(false);
//     }
//   };

//   const handleDeleteStudent = async (public_id: string) => {
//     if (!confirm("Are you sure you want to delete this student?")) return;

//     try {
//       setDeletingId(public_id);
//       const res = await fetch(`/api/upload-student?public_id=${public_id}`, {
//         method: "DELETE",
//       });
//       const data = await res.json();

//       if (res.ok && data.success) {
//         setStudents(students.filter(student => student.public_id !== public_id));
//         alert("Student deleted successfully");
//       } else {
//         alert(data.error || "Failed to delete student");
//       }
//     } catch (error) {
//       console.error("Error deleting student:", error);
//       alert("Error deleting student");
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const handleLogout = async () => {
//     await signOut(auth);
//     router.push("/login");
//   };

//   const fileToBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(file);
//       reader.onload = () => resolve((reader.result as string).split(",")[1]);
//       reader.onerror = reject;
//     });
//   };

//   const uploadNote = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!pdfFile || !chapterName || !chapterNumber || !className) {
//       return alert("All fields required!");
//     }

//     try {
//       setLoading(true);
//       const fileBase64 = await fileToBase64(pdfFile);

//       const res = await fetch("/api/upload", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           chapterName,
//           chapterNumber,
//           className,
//           fileBase64,
//         }),
//       });

//       const data = await res.json();
//       setLoading(false);

//       if (res.ok && data.success) {
//         alert("Note uploaded successfully");
//         setShowNoteModal(false);
//         setChapterName("");
//         setChapterNumber("");
//         setClassName("");
//         setPdfFile(null);
//       } else {
//         alert(data.error || "Failed to upload note");
//       }
//     } catch (error) {
//       console.error(error);
//       alert("Something went wrong");
//       setLoading(false);
//     }
//   };

//   const uploadPerson = async (
//     e: React.FormEvent,
//     type: "team" | "mentor"
//   ) => {
//     e.preventDefault();
//     if (!personName || !role || !imageFile) {
//       return alert("All fields required!");
//     }

//     try {
//       setLoading(true);
//       const fileBase64 = await fileToBase64(imageFile);

//       const res = await fetch("/api/upload-person", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: personName,
//           role,
//           fileBase64,
//           type,
//         }),
//       });

//       const data = await res.json();
//       setLoading(false);

//       if (res.ok && data.success) {
//         alert(`${type === "team" ? "Team member" : "Mentor"} uploaded`);
//         setShowTeamModal(false);
//         setShowMentorModal(false);
//         setPersonName("");
//         setRole("");
//         setImageFile(null);
//       } else {
//         alert(data.error || "Upload failed");
//       }
//     } catch (error) {
//       console.error(error);
//       alert("Something went wrong");
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen p-6 bg-gray-100 text-gray-900">
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-3xl font-bold">Admin Dashboard</h1>
//         <button
//           onClick={handleLogout}
//           className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
//         >
//           Logout
//         </button>
//       </div>

//       <div className="flex flex-wrap gap-4 mb-4">
//         <button
//           onClick={() => setShowNoteModal(true)}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           Add Note
//         </button>
//         <button
//           onClick={() => setShowTeamModal(true)}
//           className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
//         >
//           Add Team Member
//         </button>
//         <button
//           onClick={() => setShowMentorModal(true)}
//           className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
//         >
//           Add Mentor
//         </button>
//       </div>

//       {/* Students Section */}
//       <div className="mb-8">
//         <h2 className="text-2xl font-semibold mb-4">Registered Students</h2>
//         {loadingStudents ? (
//           <div className="flex justify-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//           </div>
//         ) : students.length === 0 ? (
//           <p className="text-gray-700">No students registered yet</p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {students.map((student) => (
//               <div key={student.public_id} className="bg-white p-4 rounded-lg shadow text-gray-900">
//                 <div className="flex items-center gap-4 mb-3">
//                   <div className="relative w-16 h-16 rounded-full overflow-hidden">
//                     <Image
//                       src={student.imageUrl}
//                       alt={student.name}
//                       fill
//                       className="object-cover"
//                     />
//                   </div>
//                   <div>
//                     <h3 className="font-semibold">{student.name}</h3>
//                     <p className="text-sm text-gray-800">{student.className}</p>
//                   </div>
//                 </div>
//                 <div className="space-y-1 text-sm text-gray-800">
//                   <p><span className="font-semibold">Email:</span> {student.email}</p>
//                   <p><span className="font-semibold">Mobile:</span> {student.mobile}</p>
//                   <p><span className="font-semibold">Village:</span> {student.village}</p>
//                   <p><span className="font-semibold">District:</span> {student.district}</p>
//                 </div>
//                 <button
//                   onClick={() => handleDeleteStudent(student.public_id)}
//                   disabled={deletingId === student.public_id}
//                   className={`mt-3 text-white px-3 py-1 rounded text-sm ${
//                     deletingId === student.public_id 
//                       ? 'bg-gray-400' 
//                       : 'bg-red-500 hover:bg-red-600'
//                   }`}
//                 >
//                   {deletingId === student.public_id ? 'Deleting...' : 'Delete'}
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Note Modal */}
//       {showNoteModal && (
//         <Modal title="Add New Note" onClose={() => setShowNoteModal(false)}>
//           <form onSubmit={uploadNote} className="space-y-4">
//             <Input label="Chapter Number" value={chapterNumber} onChange={setChapterNumber} />
//             <Input label="Chapter Name" value={chapterName} onChange={setChapterName} />
//             <div>
//               <label className="block mb-1 font-semibold text-gray-900">Class</label>
//               <select
//                 value={className}
//                 onChange={(e) => setClassName(e.target.value)}
//                 className="w-full px-3 py-2 border rounded text-gray-900"
//                 required
//               >
//                 <option value="">Select Class</option>
//                 <option value="10">Class 10</option>
//                 <option value="12">Class 12</option>
//               </select>
//             </div>
//             <FileInput label="PDF File" accept="application/pdf" onChange={setPdfFile} />
//             <SubmitButton loading={loading} />
//           </form>
//         </Modal>
//       )}

//       {/* Team Modal */}
//       {showTeamModal && (
//         <Modal title="Add Team Member" onClose={() => setShowTeamModal(false)}>
//           <form onSubmit={(e) => uploadPerson(e, "team")} className="space-y-4">
//             <Input label="Name" value={personName} onChange={setPersonName} />
//             <Input label="Role" value={role} onChange={setRole} />
//             <FileInput label="Image" accept="image/*" onChange={setImageFile} />
//             <SubmitButton loading={loading} />
//           </form>
//         </Modal>
//       )}

//       {/* Mentor Modal */}
//       {showMentorModal && (
//         <Modal title="Add Mentor" onClose={() => setShowMentorModal(false)}>
//           <form onSubmit={(e) => uploadPerson(e, "mentor")} className="space-y-4">
//             <Input label="Name" value={personName} onChange={setPersonName} />
//             <Input label="Role" value={role} onChange={setRole} />
//             <FileInput label="Image" accept="image/*" onChange={setImageFile} />
//             <SubmitButton loading={loading} />
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// }

// // Reusable Components
// function Input({
//   label,
//   value,
//   onChange,
//   type = "text",
// }: {
//   label: string;
//   value: string;
//   onChange: (val: string) => void;
//   type?: string;
// }) {
//   return (
//     <div>
//       <label className="block mb-1 font-semibold text-gray-900">{label}</label>
//       <input
//         type={type}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full px-3 py-2 border rounded text-gray-900"
//         required
//       />
//     </div>
//   );
// }

// function FileInput({
//   label,
//   accept,
//   onChange,
// }: {
//   label: string;
//   accept: string;
//   onChange: (file: File | null) => void;
// }) {
//   return (
//     <div>
//       <label className="block mb-1 font-semibold text-gray-900">{label}</label>
//       <input
//         type="file"
//         accept={accept}
//         onChange={(e) => onChange(e.target.files?.[0] || null)}
//         className="w-full px-3 py-2 border rounded text-gray-900"
//         required
//       />
//     </div>
//   );
// }

// function SubmitButton({ loading }: { loading: boolean }) {
//   return (
//     <div className="flex justify-end">
//       <button
//         type="submit"
//         disabled={loading}
//         className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
//       >
//         {loading ? "Uploading..." : "Upload"}
//       </button>
//     </div>
//   );
// }

// function Modal({
//   title,
//   children,
//   onClose,
// }: {
//   title: string;
//   children: React.ReactNode;
//   onClose: () => void;
// }) {
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
//       <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative text-gray-900">
//         <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
//         <button
//           className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
//           onClick={onClose}
//         >
//           &times;
//         </button>
//         {children}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import Image from "next/image";

type Student = {
  id: string;
  name: string;
  email: string;
  className: string;
  mobile: string;
  village: string;
  district: string;
  imageUrl: string;
  public_id: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Note form
  const [noteChapterName, setNoteChapterName] = useState("");
  const [noteChapterNumber, setNoteChapterNumber] = useState("");
  const [noteClassName, setNoteClassName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [noteThumbnailFile, setNoteThumbnailFile] = useState<File | null>(null);

  // Video form
  const [videoChapterName, setVideoChapterName] = useState("");
  const [videoChapterNumber, setVideoChapterNumber] = useState("");
  const [videoClassName, setVideoClassName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // Team/Mentor form
  const [personName, setPersonName] = useState("");
  const [role, setRole] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    fetchStudents();
    return unsubscribe;
  }, [router]);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await fetch("/api/upload-student");
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
      } else {
        console.error("Failed to fetch students:", data.error);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleDeleteStudent = async (public_id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      setDeletingId(public_id);
      const res = await fetch(`/api/upload-student?public_id=${public_id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStudents(students.filter(student => student.public_id !== public_id));
        alert("Student deleted successfully");
      } else {
        alert(data.error || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Error deleting student");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const uploadNote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pdfFile || !noteThumbnailFile || !noteChapterName || !noteChapterNumber || !noteClassName) {
        return alert("All fields and files are required!");
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("thumbnail", noteThumbnailFile);
      formData.append("chapterName", noteChapterName);
      formData.append("chapterNumber", noteChapterNumber);
      formData.append("className", noteClassName);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        setLoading(false);

        if (res.ok) {
          alert("Note uploaded successfully");
          setShowNoteModal(false);
          setNoteChapterName("");
          setNoteChapterNumber("");
          setNoteClassName("");
          setPdfFile(null);
          setNoteThumbnailFile(null);
        } else {
          alert(data.error || data.message || "Failed to upload note");
        }
      } catch (error) {
        console.error(error);
        alert("Something went wrong during upload");
        setLoading(false);
      }
    };
  
  const uploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl || !videoChapterName || !videoChapterNumber || !videoClassName) {
      return alert("All fields are required!");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("youtubeUrl", youtubeUrl);
    formData.append("chapterName", videoChapterName);
    formData.append("chapterNumber", videoChapterNumber);
    formData.append("className", videoClassName);

    try {
      const res = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        alert("Video uploaded successfully");
        setShowVideoModal(false);
        setVideoChapterName("");
        setVideoChapterNumber("");
        setVideoClassName("");
        setYoutubeUrl("");
      } else {
        alert(data.error || data.message || "Failed to upload video");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong during upload");
      setLoading(false);
    }
  };

  const uploadPerson = async (
    e: React.FormEvent,
    type: "team" | "mentor"
  ) => {
    e.preventDefault();
    if (!personName || !role || !imageFile) {
      return alert("All fields required!");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", personName);
    formData.append("role", role);
    formData.append("file", imageFile);
    formData.append("type", type);
    
    try {
      const res = await fetch("/api/upload-person", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        alert(`${type === "team" ? "Team member" : "Mentor"} uploaded`);
        setShowTeamModal(false);
        setShowMentorModal(false);
        setPersonName("");
        setRole("");
        setImageFile(null);
      } else {
        alert(data.error || data.message || "Upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 text-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={() => setShowNoteModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Note
        </button>
        <button
          onClick={() => setShowVideoModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Video
        </button>
        <button
          onClick={() => setShowTeamModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Add Team Member
        </button>
        <button
          onClick={() => setShowMentorModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Add Mentor
        </button>
      </div>

      {/* Students Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Registered Students</h2>
        {loadingStudents ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : students.length === 0 ? (
          <p className="text-gray-700">No students registered yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div key={student.public_id} className="bg-white p-4 rounded-lg shadow text-gray-900">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={student.imageUrl}
                      alt={student.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{student.name}</h3>
                    <p className="text-sm text-gray-800">{student.className}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-800">
                  <p><span className="font-semibold">Email:</span> {student.email}</p>
                  <p><span className="font-semibold">Mobile:</span> {student.mobile}</p>
                  <p><span className="font-semibold">Village:</span> {student.village}</p>
                  <p><span className="font-semibold">District:</span> {student.district}</p>
                </div>
                <button
                  onClick={() => handleDeleteStudent(student.public_id)}
                  disabled={deletingId === student.public_id}
                  className={`mt-3 text-white px-3 py-1 rounded text-sm ${
                    deletingId === student.public_id
                      ? 'bg-gray-400'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {deletingId === student.public_id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <Modal title="Add New Note" onClose={() => setShowNoteModal(false)}>
          <form onSubmit={uploadNote} className="space-y-4">
            <Input label="Chapter Number" value={noteChapterNumber} onChange={setNoteChapterNumber} />
            <Input label="Chapter Name" value={noteChapterName} onChange={setNoteChapterName} />
            <div>
              <label className="block mb-1 font-semibold text-gray-900">Class</label>
              <select
                value={noteClassName}
                onChange={(e) => setNoteClassName(e.target.value)}
                className="w-full px-3 py-2 border rounded text-gray-900"
                required
              >
                <option value="">Select Class</option>
                <option value="6">Class 6</option>
                <option value="7">Class 7</option>
                <option value="8">Class 8</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <FileInput label="PDF File" accept="application/pdf" onChange={setPdfFile} />
            <FileInput label="Thumbnail Image" accept="image/*" onChange={setNoteThumbnailFile} />
            <SubmitButton loading={loading} />
          </form>
        </Modal>
      )}

      {/* Video Modal - Updated for YouTube URL */}
      {showVideoModal && (
        <Modal title="Add New Video" onClose={() => setShowVideoModal(false)}>
          <form onSubmit={uploadVideo} className="space-y-4">
            <Input label="Chapter Number" value={videoChapterNumber} onChange={setVideoChapterNumber} />
            <Input label="Chapter Name" value={videoChapterName} onChange={setVideoChapterName} />
            <div>
              <label className="block mb-1 font-semibold text-gray-900">Class</label>
              <select
                value={videoClassName}
                onChange={(e) => setVideoClassName(e.target.value)}
                className="w-full px-3 py-2 border rounded text-gray-900"
                required
              >
                <option value="">Select Class</option>
                <option value="6">Class 6</option>
                <option value="7">Class 7</option>
                <option value="8">Class 8</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <Input label="YouTube Video URL" value={youtubeUrl} onChange={setYoutubeUrl} type="url" />
            <SubmitButton loading={loading} />
          </form>
        </Modal>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <Modal title="Add Team Member" onClose={() => setShowTeamModal(false)}>
          <form onSubmit={(e) => uploadPerson(e, "team")} className="space-y-4">
            <Input label="Name" value={personName} onChange={setPersonName} />
            <Input label="Role" value={role} onChange={setRole} />
            <FileInput label="Image" accept="image/*" onChange={setImageFile} />
            <SubmitButton loading={loading} />
          </form>
        </Modal>
      )}

      {/* Mentor Modal */}
      {showMentorModal && (
        <Modal title="Add Mentor" onClose={() => setShowMentorModal(false)}>
          <form onSubmit={(e) => uploadPerson(e, "mentor")} className="space-y-4">
            <Input label="Name" value={personName} onChange={setPersonName} />
            <Input label="Role" value={role} onChange={setRole} />
            <FileInput label="Image" accept="image/*" onChange={setImageFile} />
            <SubmitButton loading={loading} />
          </form>
        </Modal>
      )}
    </div>
  );
}

// Reusable Components
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}) {
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

function FileInput({
  label,
  accept,
  onChange,
}: {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div>
      <label className="block mb-1 font-semibold text-gray-900">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
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
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
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