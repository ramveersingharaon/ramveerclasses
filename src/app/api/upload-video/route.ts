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
  youtubeUrl: string;
};

// Type definition for Cloudinary resource
type CloudinaryVideoResource = {
  secure_url: string;
  public_id: string;
  context?: {
    custom: {
      chapterName?: string;
      chapterNumber?: string;
      className?: string;
      youtubeUrl?: string;
    };
  };
  created_at: string;
};

// Helper function to extract YouTube Video ID from various URL formats
const getYouTubeId = (url: string): string | null => {
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:.+)?$/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

// Helper function to parse metadata from Cloudinary context
const parseMetadata = (context: CloudinaryVideoResource['context']): VideoMetadata => {
  if (!context?.custom) {
    return { chapterName: '', chapterNumber: '', className: '', youtubeUrl: '' };
  }
  return {
    chapterName: context.custom.chapterName || '',
    chapterNumber: context.custom.chapterNumber || '',
    className: context.custom.className || '',
    youtubeUrl: context.custom.youtubeUrl || '',
  };
};

// POST handler to upload a new video with a YouTube URL
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const youtubeUrl = formData.get("youtubeUrl") as string;
    const chapterName = formData.get("chapterName") as string;
    const chapterNumber = formData.get("chapterNumber") as string;
    const className = formData.get("className") as string;

    // Check for all required fields except the thumbnail file
    if (!youtubeUrl || !chapterName || !chapterNumber || !className) {
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
    
    // Automatically generate the YouTube thumbnail URL
    const youtubeThumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    // Fetch the thumbnail image from YouTube
    const thumbnailResponse = await fetch(youtubeThumbnailUrl);
    if (!thumbnailResponse.ok) {
        throw new Error(`Failed to fetch YouTube thumbnail: ${thumbnailResponse.statusText}`);
    }

    // Read the thumbnail into a buffer
    const thumbnailBuffer = Buffer.from(await thumbnailResponse.arrayBuffer());

    // Upload the thumbnail image buffer to Cloudinary
    const thumbnailUploadResult: CloudinaryVideoResource = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'videos_thumbnails',
          public_id: `video_${Date.now()}`, // Create a unique public ID
          overwrite: true,
          context: `chapterName=${chapterName}|chapterNumber=${chapterNumber}|className=${className}|youtubeUrl=${youtubeUrl}`,
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

// GET handler to fetch all videos
export async function GET() {
  try {
    const imagesResult = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'videos_thumbnails/',
      resource_type: 'image',
      context: true,
      max_results: 100, // Adjust as needed
    });
    
    const videos = (imagesResult.resources as CloudinaryVideoResource[])
      .map((file) => {
        const metadata = parseMetadata(file.context);
        return {
          youtubeUrl: metadata.youtubeUrl,
          chapterNumber: metadata.chapterNumber,
          chapterName: metadata.chapterName,
          className: metadata.className,
          thumbnailUrl: file.secure_url,
          thumbnailPublicId: file.public_id,
          created_at: file.created_at,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Sort by latest upload time

    return NextResponse.json(videos);
  } catch (error) {
    const err = error as Error;
    console.error('Fetch error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

// DELETE handler to delete a video thumbnail and its metadata
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

    // Delete the video thumbnail from Cloudinary
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