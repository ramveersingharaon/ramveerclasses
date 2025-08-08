"use client";

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker file ka path public folder se set karein
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

interface PdfPreviewProps {
  url: string;
}

export default function PdfPreview({ url }: PdfPreviewProps) {
  return (
    <div className="w-full h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
      <Document
        file={url}
        loading={
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <Page 
          pageNumber={1} 
          width={280} 
          renderAnnotationLayer={false} 
          renderTextLayer={false} 
        />
      </Document>
    </div>
  );
}