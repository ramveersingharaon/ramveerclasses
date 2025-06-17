// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dcxrzhoaj',
  api_key: '971368918344559',
  api_secret: 'mxUsn9CM-CKu07TpiOa_qdW4z4U',
});

// Extract chapter number from public ID
const getChapterNumber = (publicId: string): string => {
  const match = publicId.match(/chapter_(\d+)\.pdf/);
  return match ? match[1] : '0';
};

// Parse context metadata
const parseMetadata = (context: any) => {
  if (!context) return { chapterName: '', chapterNumber: '', className: '' };
  return {
    chapterName: context.chapterName || '',
    chapterNumber: context.chapterNumber || '',
    className: context.className || '',
  };
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { chapterNumber, chapterName, className, fileBase64 } = data;

    if (!chapterNumber || !chapterName || !className || !fileBase64) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const uploadResult = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${fileBase64}`,
      {
        resource_type: 'raw',
        public_id: `notes/chapter_${chapterNumber}.pdf`,
        overwrite: true,
        context: `chapterName=${chapterName}|chapterNumber=${chapterNumber}|className=${className}`,
      }
    );

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      chapterNumber,
      chapterName,
      className,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'notes/',
      resource_type: 'raw',
      context: true,
      max_results: 100
    });

    const notes = result.resources
      .filter((file: any) => file.public_id.includes('.pdf'))
      .map((file: any) => {
        const metadata = parseMetadata(file.context?.custom);
        const chapterNumber = metadata.chapterNumber || getChapterNumber(file.public_id);

        return {
          url: file.secure_url,
          public_id: file.public_id,
          chapterNumber,
          chapterName: metadata.chapterName || `Chapter ${chapterNumber}`,
          className: metadata.className || '',
          uploadedAt: file.created_at
        };
      });

    notes.sort((a: any, b: any) => 
      parseInt(a.chapterNumber) - parseInt(b.chapterNumber)
    );

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.text();
    const { public_id } = JSON.parse(body);

    if (!public_id) {
      return NextResponse.json({ success: false, error: "Missing public_id" }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: 'raw',
    });

    if (result.result !== "ok") {
      return NextResponse.json({ success: false, error: "Delete failed on Cloudinary" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
