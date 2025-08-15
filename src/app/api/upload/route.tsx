import { NextResponse, NextRequest } from "next/server";
import cloudinary, { UploadApiResponse } from "cloudinary";

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


interface CloudinaryResource {
  secure_url: string;
  public_id: string;
  created_at: string;
  metadata?: {
    className?: string;
    subjectName?: string;
    chapterName?: string;
    chapterNumber?: string;
    description?: string;
  };
}

export const GET = async () => {
  try {
    const { resources } = await cloudinary.v2.search
      .expression('folder:notes-pdfs')
      .with_field('metadata') // Now we only need to fetch metadata
      .sort_by('public_id', 'desc')
      .max_results(50)
      .execute();

    const notes = resources.map((resource: CloudinaryResource) => ({
      url: resource.secure_url,
      publicId: resource.public_id,
      className: resource.metadata?.className || '',
      subjectName: resource.metadata?.subjectName || '', // Fetch the new subjectName metadata
      chapterName: resource.metadata?.chapterName || '',
      chapterNumber: resource.metadata?.chapterNumber || '',
      description: resource.metadata?.description || '', // Corrected to 'Description' (Capital D)
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

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    const chapterNumber = (formData.get("chapterNumber") || "") as string;
    const chapterName = (formData.get("chapterName") || "") as string;
    const className = (formData.get("className") || "") as string;
    const subjectName = (formData.get("subjectName") || "") as string; // Get the new subjectName
    const description = (formData.get("description") || "") as string;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.v2.uploader
        .upload_stream(
          {
            folder: "notes-pdfs",
            resource_type: "raw",
            metadata: {
              className: className,
              subjectName: subjectName, // Save the new subjectName metadata
              chapterName: chapterName,
              chapterNumber: chapterNumber,
              description: description
            }
          },
          // Corrected code
          function (error, result) {
            if (error) {
              console.error("Cloudinary upload stream error:", error);
              reject(error);
              return;
            }

            if (!result) { // <-- यह check जोड़ें
              reject(new Error("Cloudinary upload failed: no result object"));
              return;
            }

            resolve(result); // अब `result` के `undefined` होने की कोई संभावना नहीं है
          }
        )
        .end(buffer);
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