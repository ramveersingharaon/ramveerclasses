import { NextResponse, NextRequest } from "next/server";
import cloudinary from "cloudinary";

// Cloudinary configuration from environment variables
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// A simple interface for the metadata to ensure type safety
interface NoteMetadata {
  className: string;
  subjectName: string;
  chapterName: string;
  chapterNumber: string;
  description: string;
}

// GET handler to fetch notes
export const GET = async () => {
  try {
    const { resources } = await cloudinary.v2.search
      .expression('folder:notes-pdfs')
      .with_field('metadata')
      .sort_by('public_id', 'desc')
      .max_results(50)
      .execute();

    const notes = resources.map((resource: {
      secure_url: string;
      public_id: string;
      metadata: NoteMetadata;
      created_at: string;
    }) => ({
      url: resource.secure_url,
      publicId: resource.public_id,
      className: resource.metadata?.className || '',
      subjectName: resource.metadata?.subjectName || '',
      chapterName: resource.metadata?.chapterName || '',
      chapterNumber: resource.metadata?.chapterNumber || '',
      description: resource.metadata?.description || '',
      created_at: resource.created_at,
      type: 'note'
    }));

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: (error as Error).message },
      { status: 500 }
    );
  }
};

// POST handler to upload a new note
export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    // Extract metadata from form data
    const chapterNumber = formData.get("chapterNumber") as string;
    const chapterName = formData.get("chapterName") as string;
    const className = formData.get("className") as string;
    const subjectName = formData.get("subjectName") as string;
    const description = formData.get("description") as string;
    
    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Use a more specific type for the upload result
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: "notes-pdfs",
          resource_type: "raw", 
          // Use `context` instead of `metadata` for saving searchable key-value pairs
          context: `className=${className}|subjectName=${subjectName}|chapterName=${chapterName}|chapterNumber=${chapterNumber}|description=${description}`
        },
        function (error, result) {
          if (error) {
            console.error("Cloudinary upload stream error:", error);
            reject(error);
            return;
          }
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("Main API route error:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: (error as Error).message },
      { status: 500 }
    );
  }
};

// DELETE handler to remove a note
export const DELETE = async (req: NextRequest) => {
  try {
    const publicId = req.nextUrl.searchParams.get("publicId");
    if (!publicId) {
      return NextResponse.json({ message: "Missing publicId" }, { status: 400 });
    }

    await cloudinary.v2.uploader.destroy(publicId, { resource_type: "raw" });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting PDF:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: (error as Error).message },
      { status: 500 }
    );
  }
};