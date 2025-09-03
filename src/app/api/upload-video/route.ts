// app/api/upload-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Type definition for video metadata
type VideoMetadata = {
  chapterName: string;
  chapterNumber: string;
  className: string;
  subjectName: string;
  youtubeUrl: string;
  description: string;
};

// Type definition for Cloudinary resource
type CloudinaryVideoResource = {
  secure_url: string;
  public_id: string;
  metadata?: {
    chapterName?: string;
    chapterNumber?: string;
    className?: string;
    subjectName?: string;
    youtubeUrl?: string;
    description?: string;
  };
  created_at: string;
};

// Helper function to extract YouTube Video ID from various URL formats
const getYouTubeId = (url: string): string | null => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:.+)?$/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// Helper function to parse metadata from Cloudinary metadata field
const parseMetadata = (metadata: CloudinaryVideoResource['metadata']): VideoMetadata => {
  if (!metadata) {
    return { chapterName: '', chapterNumber: '', className: '', subjectName: '', youtubeUrl: '', description: '' };
  }
  return {
    chapterName: metadata.chapterName ? decodeURIComponent(metadata.chapterName) : '',
    chapterNumber: metadata.chapterNumber ? decodeURIComponent(metadata.chapterNumber) : '',
    className: metadata.className ? decodeURIComponent(metadata.className) : '',
    subjectName: metadata.subjectName ? decodeURIComponent(metadata.subjectName) : '',
    youtubeUrl: metadata.youtubeUrl ? decodeURIComponent(metadata.youtubeUrl) : '',
    description: metadata.description ? decodeURIComponent(metadata.description) : '',
  };
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const youtubeUrl = formData.get("youtubeUrl") as string;
    const chapterName = formData.get("chapterName") as string;
    const chapterNumber = formData.get("chapterNumber") as string;
    const className = formData.get("className") as string;
    const subjectName = formData.get("subjectName") as string;
    const description = formData.get("description") as string;

    if (!youtubeUrl || !chapterName || !chapterNumber || !className || !subjectName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const videoId = getYouTubeId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }
    
    const youtubeThumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const thumbnailResponse = await fetch(youtubeThumbnailUrl);
    if (!thumbnailResponse.ok) {
        throw new Error(`Failed to fetch YouTube thumbnail: ${thumbnailResponse.statusText}`);
    }
    const thumbnailBuffer = Buffer.from(await thumbnailResponse.arrayBuffer());

    const thumbnailUploadResult: CloudinaryVideoResource = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'videos_thumbnails',
          public_id: `video_${Date.now()}`,
          overwrite: true,
          metadata: {
            chapterName: encodeURIComponent(chapterName),
            chapterNumber: encodeURIComponent(chapterNumber),
            className: encodeURIComponent(className),
            subjectName: encodeURIComponent(subjectName),
            youtubeUrl: encodeURIComponent(youtubeUrl),
            description: encodeURIComponent(description)
          },
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result as CloudinaryVideoResource);
        }
      ).end(thumbnailBuffer);
    });

    return NextResponse.json({
      success: true,
      youtubeUrl: youtubeUrl,
      thumbnailUrl: thumbnailUploadResult.secure_url,
      thumbnailPublicId: thumbnailUploadResult.public_id,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Video upload failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    const nextCursor = searchParams.get('nextCursor') || undefined;
    
    const imagesResult = await cloudinary.search
      .expression('folder:videos_thumbnails')
      .with_field('metadata')
      .sort_by('created_at', 'desc')
      .max_results(limit)
      .next_cursor(nextCursor)
      .execute();
    
    const videos = (imagesResult.resources as CloudinaryVideoResource[])
      .map((file) => {
        const metadata = parseMetadata(file.metadata);
        return {
          youtubeUrl: metadata.youtubeUrl,
          chapterNumber: metadata.chapterNumber,
          chapterName: metadata.chapterName,
          className: metadata.className,
          subjectName: metadata.subjectName,
          description: metadata.description,
          thumbnailUrl: file.secure_url,
          thumbnailPublicId: file.public_id,
          created_at: file.created_at,
        };
      });

    return NextResponse.json({
      videos,
      nextCursor: imagesResult.next_cursor || null,
    });

  } catch (error) {
    const err = error as Error;
    console.error('Fetch error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    type DeleteRequest = {
      thumbnailPublicId: string;
    };
    const { thumbnailPublicId }: DeleteRequest = await req.json();

    if (!thumbnailPublicId) {
      return NextResponse.json(
        { success: false, error: 'Missing thumbnailPublicId' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(thumbnailPublicId, {
      resource_type: 'image',
    });

    if (result.result !== 'ok') {
      return NextResponse.json(
        { success: false, error: 'Delete failed on Cloudinary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('Delete error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}