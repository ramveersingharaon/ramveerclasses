import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

// --- START: NEW MONGODB CODE ---
const connection: { isConnected?: boolean } = {};

async function connectDb() {
  if (connection.isConnected) {
    console.log("Using existing database connection");
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    console.error("MongoDB URI not found in environment variables.");
    throw new Error("MongoDB URI not found.");
  }
  
  try {
    // useNewUrlParser और useUnifiedTopology को हटा दिया गया है
    const db = await mongoose.connect(process.env.MONGODB_URI);
    connection.isConnected = db.connections[0].readyState === 1;
    console.log("New database connection established.");
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

const notesSchema = new mongoose.Schema({
  notes: Array,
  lastUpdated: { type: Date, default: Date.now },
});

const NotesCache = mongoose.models.Notes || mongoose.model('Notes', notesSchema);
// --- END: NEW MONGODB CODE ---

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Interfaces... (आपके original कोड से)
interface CloudinaryResource {
  secure_url: string;
  public_id: string;
  metadata?: {
    className?: string;
    subjectName?: string;
    chapterName?: string;
    chapterNumber?: string;
    descriptionImages?: string;
    descriptionImageCount?: number;
  };
  created_at: string;
}

interface CloudinaryImageResult {
  secure_url: string;
  public_id: string;
}

interface CloudinaryPDFResult {
  secure_url: string;
  public_id: string;
  metadata: {
    className: string;
    subjectName: string;
    chapterName: string;
    chapterNumber: string;
    descriptionImages: string;
    descriptionImageCount: number;
  };
}


// --- START: MODIFIED GET HANDLER (Caching Logic) ---
// --- START: MODIFIED GET HANDLER (Caching Logic) ---
export const GET = async (req: NextRequest) => {
  await connectDb(); // MongoDB से कनेक्ट करें

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '3');

    // 1. डेटाबेस में कैश डेटा खोजें
    const cachedData = await NotesCache.findOne({});
    const oneHour = 60 * 60 * 1000; // 1 घंटे (ms में)

    if (cachedData && (new Date().getTime() - cachedData.lastUpdated.getTime() < oneHour)) {
      // 2. अगर कैश मौजूद है और 1 घंटे से पुराना नहीं है, तो उसे सीधे भेज दें
      console.log("Serving notes from MongoDB cache.");
      return NextResponse.json({
        notes: cachedData.notes.slice(0, limit),
        nextCursor: null,
      });
    }

    // 3. अगर कैश नहीं मिला या पुराना है, तो Cloudinary से नया डेटा फ़ेच करें
    console.log("Fetching new notes from Cloudinary...");
    const { resources } = await cloudinary.search
      .expression('folder:notes-pdfs')
      .with_field('metadata')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .execute();
      
    const notes = resources.map((resource: CloudinaryResource) => {
      const descriptionImages = resource.metadata?.descriptionImages ? JSON.parse(resource.metadata.descriptionImages) : [];
      return {
        url: resource.secure_url,
        publicId: resource.public_id,
        className: resource.metadata?.className || '',
        subjectName: resource.metadata?.subjectName || '',
        chapterName: resource.metadata?.chapterName || '',
        chapterNumber: resource.metadata?.chapterNumber || '',
        descriptionImages: descriptionImages.slice(0, 1),
        descriptionImageCount: resource.metadata?.descriptionImageCount || 0,
        created_at: resource.created_at,
        type: 'note'
      };
    });

    // 4. नया डेटाबेस में सेव या अपडेट करें
    if (cachedData) {
      await NotesCache.updateOne({}, { notes: notes, lastUpdated: new Date() });
      console.log("MongoDB cache updated.");
    } else {
      await new NotesCache({ notes: notes }).save();
      console.log("New data saved to MongoDB cache.");
    }
    
    // 5. यूज़र को नया डेटा भेजें
    return NextResponse.json({
      notes: notes.slice(0, limit),
      nextCursor: null,
    });

  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: (error as Error).message },
      { status: 500 }
    );
  }
};
// --- END: MODIFIED GET HANDLER ---


// --- START: MODIFIED POST HANDLER ---
export const POST = async (req: NextRequest) => {
  await connectDb(); // MongoDB से कनेक्ट करें
  
  try {
    const formData = await req.formData();
    // ... (आपका पुराना POST logic) ...
    const file = formData.get("file") as File;
    const chapterNumber = (formData.get("chapterNumber") || "") as string;
    const chapterName = (formData.get("chapterName") || "") as string;
    const className = (formData.get("className") || "") as string;
    const subjectName = (formData.get("subjectName") || "") as string;
    const images = formData.getAll("images") as File[];
    
    if (!file) {
      return NextResponse.json({ message: "No PDF file uploaded" }, { status: 400 });
    }

    const uploadedImageUrls: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const imageArrayBuffer = await image.arrayBuffer();
        const imageBuffer = new Uint8Array(imageArrayBuffer);
        const imageResult: CloudinaryImageResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder: "note-images", resource_type: "image" }, function (error, result) {
            if (error) { reject(error); return; }
            if (result) { resolve(result); } else { reject(new Error("Cloudinary result is undefined.")); }
          }).end(imageBuffer);
        });
        uploadedImageUrls.push(imageResult.secure_url);
      }
    }

    const pdfArrayBuffer = await file.arrayBuffer();
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);
    const pdfResult: CloudinaryPDFResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: "notes-pdfs",
        resource_type: "raw",
        metadata: {
          className: className,
          subjectName: subjectName,
          chapterName: chapterName,
          chapterNumber: chapterNumber,
          descriptionImages: JSON.stringify(uploadedImageUrls),
          descriptionImageCount: uploadedImageUrls.length,
        },
      }, function (error, result) {
        if (error) { reject(error); return; }
        if (result) { resolve(result as CloudinaryPDFResult); } else { reject(new Error("Cloudinary result is undefined.")); }
      }).end(pdfBuffer);
    });

    // --- NEW CODE: MongoDB में नया नोट सेव करें ---
    const newNote = {
      url: pdfResult.secure_url,
      publicId: pdfResult.public_id,
      className: className,
      subjectName: subjectName,
      chapterName: chapterName,
      chapterNumber: chapterNumber,
      descriptionImages: uploadedImageUrls,
      descriptionImageCount: uploadedImageUrls.length,
      created_at: new Date().toISOString(),
      type: 'note'
    };
    
    // मौजूदा कैश को अपडेट करें ताकि नया नोट सबसे ऊपर दिखे
    const cachedData = await NotesCache.findOne({});
    if (cachedData) {
        const updatedNotes = [newNote, ...cachedData.notes];
        await NotesCache.updateOne({}, { notes: updatedNotes, lastUpdated: new Date() });
    }
    // --- END: NEW CODE ---

    return NextResponse.json({ success: true, data: pdfResult }, { status: 200 });
  } catch (error) {
    console.error("Main API route error:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: (error as Error).message },
      { status: 500 }
    );
  }
};
// --- END: MODIFIED POST HANDLER ---


// --- START: MODIFIED DELETE HANDLER ---
export const DELETE = async (req: NextRequest) => {
  await connectDb(); // MongoDB से कनेक्ट करें

  try {
    const publicId = req.nextUrl.searchParams.get("publicId");
    if (!publicId) {
      return NextResponse.json({ message: "Missing publicId" }, { status: 400 });
    }

    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });

    // --- NEW CODE: MongoDB से नोट को हटाएँ ---
    const cachedData = await NotesCache.findOne({});
    if (cachedData) {
        const updatedNotes = cachedData.notes.filter((note: any) => note.publicId !== publicId);
        await NotesCache.updateOne({}, { notes: updatedNotes, lastUpdated: new Date() });
    }
    // --- END: NEW CODE ---

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting PDF:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: (error as Error).message },
      { status: 500 }
    );
  }
};
// --- END: MODIFIED DELETE HANDLER ---