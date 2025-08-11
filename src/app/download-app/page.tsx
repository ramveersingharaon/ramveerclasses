// components/DownloadAppPage.tsx
import React from 'react';
import Image from 'next/image';

const DownloadAppPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-6">
      {/* App Logo/Icon */}
      <div className="mb-8">
        {/* Replace with your app's logo */}
        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
          <span className="text-white text-3xl font-bold">R</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-4">
          Coming Soon! ✨
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Our mobile app is currently under development. We're working hard to bring you the best experience possible.
        </p>
        <p className="text-md text-gray-500 mb-8">
          Stay tuned for updates! We'll notify you as soon as the app is ready for download.
        </p>
        
        {/* Call to action (Optional, can be a link to mailing list or social media) */}
        <a 
          href="#" 
          className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
        >
          Get Notified
        </a>
      </div>
      
      {/* Footer / Social Links (Optional) */}
      <div className="mt-12 text-sm text-gray-400">
        Follow us for more updates:
        <div className="flex justify-center space-x-4 mt-2">
          <a href="#" className="hover:text-blue-500 transition duration-300">Facebook</a>
          <a href="#" className="hover:text-blue-500 transition duration-300">Twitter</a>
          <a href="#" className="hover:text-blue-500 transition duration-300">Instagram</a>
        </div>
      </div>
    </div>
  );
};

export default DownloadAppPage;