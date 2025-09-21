// app/api/upload-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose'; // MongoDB के लिए Mongoose import करें

// video के लिए एक नया Interface बनाएँ
interface Video {
    youtubeUrl: string;
    chapterNumber: string;
    chapterName: string;
    className: string;
    subjectName: string;
    description: string;
    thumbnailUrl: string;
    thumbnailPublicId: string;
    created_at: string;
    type: string;
}
// --- START: NEW MONGODB CODE ---
const connection: { isConnected?: boolean } = {};

async function connectDb() {
  if (connection.isConnected) {
    console.log("Using existing database connection for videos API");
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error("MongoDB URI not found in environment variables for videos API.");
    throw new Error("MongoDB URI not found.");
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    connection.isConnected = db.connections[0].readyState === 1; // 1 = connected
    console.log("New database connection established for videos API.");
  } catch (error) {
    console.error("Database connection error for videos API:", error);
    // एरर को re-throw करें ताकि API 500 status लौटा सके
    throw new Error("Failed to connect to database.");
  }
}

// वीडियो डेटा के लिए नया Mongoose Schema
const videoSchema = new mongoose.Schema({
  videos: Array, // यहाँ Cloudinary से फ़ेच किए गए वीडियो का Array स्टोर होगा
  lastUpdated: { type: Date, default: Date.now },
});

// Mongoose मॉडल को परिभाषित करें या मौजूदा का उपयोग करें
const VideosCache = mongoose.models.Videos || mongoose.model('Videos', videoSchema);
// --- END: NEW MONGODB CODE ---


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


// --- START: MODIFIED POST HANDLER ---
export async function POST(req: NextRequest) {
  await connectDb(); // MongoDB से कनेक्ट करें

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
      cloudinary.uploader.upload_stream( // .v2 हटा दिया गया है
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

    // --- NEW CODE: MongoDB में नया वीडियो सेव करें और कैश अपडेट करें ---
    const newVideo = {
      youtubeUrl: decodeURIComponent(thumbnailUploadResult.metadata?.youtubeUrl || youtubeUrl),
      chapterNumber: decodeURIComponent(thumbnailUploadResult.metadata?.chapterNumber || chapterNumber),
      chapterName: decodeURIComponent(thumbnailUploadResult.metadata?.chapterName || chapterName),
      className: decodeURIComponent(thumbnailUploadResult.metadata?.className || className),
      subjectName: decodeURIComponent(thumbnailUploadResult.metadata?.subjectName || subjectName),
      description: decodeURIComponent(thumbnailUploadResult.metadata?.description || description),
      thumbnailUrl: thumbnailUploadResult.secure_url,
      thumbnailPublicId: thumbnailUploadResult.public_id,
      created_at: new Date().toISOString(),
      type: 'video'
    };

    const cachedData = await VideosCache.findOne({});
    if (cachedData) {
        // नया वीडियो सबसे ऊपर जोड़ने के लिए
        const updatedVideos = [newVideo, ...cachedData.videos];
        await VideosCache.updateOne({}, { videos: updatedVideos, lastUpdated: new Date() });
    } else {
        // अगर कोई कैश नहीं है, तो नया कैश बनाएँ
        await new VideosCache({ videos: [newVideo] }).save();
    }
    // --- END: NEW CODE ---

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
// --- END: MODIFIED POST HANDLER ---


// --- START: MODIFIED GET HANDLER (Caching Logic) ---
export async function GET(req: NextRequest) {
  await connectDb(); // MongoDB से कनेक्ट करें

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '3');

    // 1. डेटाबेस में कैश डेटा खोजें
    const cachedData = await VideosCache.findOne<{
      lastUpdated: any; videos: Video[] 
}>();
    const oneHour = 60 * 60 * 1000; // 1 घंटे (ms में)

    if (cachedData && (new Date().getTime() - cachedData.lastUpdated.getTime() < oneHour)) {
      // 2. अगर कैश मौजूद है और 1 घंटे से पुराना नहीं है, तो उसे सीधे भेज दें
      console.log("Serving videos from MongoDB cache.");
      return NextResponse.json({
        videos: cachedData.videos.slice(0, limit),
        nextCursor: null, // Pagination cache logic को यहाँ और जटिल करना होगा, लेकिन अभी इसे सरल रखते हैं
      });
    }

    // 3. अगर कैश नहीं मिला या पुराना है, तो Cloudinary से नया डेटा फ़ेच करें
    console.log("Fetching new videos from Cloudinary...");
    const imagesResult = await cloudinary.search // .v2 हटा दिया गया है
      .expression('folder:videos_thumbnails')
      .with_field('metadata')
      .sort_by('created_at', 'desc')
      .max_results(500) // यहाँ ज़्यादा रिज़ल्ट फ़ेच करें ताकि बार-बार फ़ेच न करना पड़े
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
          type: 'video'
        };
      });

    // 4. नया डेटाबेस में सेव या अपडेट करें
    if (cachedData) {
    await VideosCache.updateOne({}, { videos: videos, lastUpdated: new Date() });
} else {
    await new VideosCache({ videos: videos }).save();
}

    // 5. यूज़र को नया डेटा भेजें
    return NextResponse.json({
      videos: videos.slice(0, limit),
      nextCursor: imagesResult.next_cursor || null,
    });

  } catch (error) {
    const err = error as Error;
    console.error('Fetch error for videos:', err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
// --- END: MODIFIED GET HANDLER ---


// --- START: MODIFIED DELETE HANDLER ---
export async function DELETE(req: NextRequest) {
  await connectDb(); // MongoDB से कनेक्ट करें

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

    const result = await cloudinary.uploader.destroy(thumbnailPublicId, { // .v2 हटा दिया गया है
      resource_type: 'image',
    });

    if (result.result !== 'ok') {
      return NextResponse.json(
        { success: false, error: 'Delete failed on Cloudinary' },
        { status: 500 }
      );
    }

    // --- NEW CODE: MongoDB से वीडियो को हटाएँ ---
    const cachedData = await VideosCache.findOne({});
    if (cachedData) {
    const updatedVideos = cachedData.videos.filter((video: Video) => video.thumbnailPublicId !== thumbnailPublicId);
    await VideosCache.updateOne({}, { videos: updatedVideos, lastUpdated: new Date() });
}
    // --- END: NEW CODE ---

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('Delete error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
// --- END: MODIFIED DELETE HANDLER ---