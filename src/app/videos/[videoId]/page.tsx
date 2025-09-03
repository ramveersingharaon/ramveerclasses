"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { BiArrowBack } from 'react-icons/bi';
import Link from 'next/link';

export default function VideoPlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const videoId = params.videoId;
  const chapterName = searchParams.get('chapterName') || 'Untitled';
  const chapterNumber = searchParams.get('chapterNumber'); 
  const className = searchParams.get('className');
  const subjectName = searchParams.get('subjectName');
  const description = searchParams.get('description');

  if (!videoId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Video not found.</p>
        <Link href="/videos" className="mt-4 text-blue-600 hover:underline flex items-center">
          <BiArrowBack className="mr-2" /> All Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/videos" className="text-blue-600 hover:underline flex items-center mb-4">
          <BiArrowBack className="mr-2" /> All Videos
        </Link>

        {/* Displaying video metadata from query params */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 mb-6">
          <p className="text-sm font-semibold text-blue-600 mb-1">
            {/* ✅ UPDATED LINE: Added chapterNumber */}
            Class {className || 'N/A'} {subjectName ? `| ${subjectName}` : ''} {chapterNumber ? `| Chapter ${chapterNumber}` : ''}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{chapterName}</h1>
          
          {description && (
            <p className="text-gray-600 text-sm mt-2 whitespace-pre-line">{description}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative w-full aspect-video">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              title={chapterName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}