import { NextResponse, NextRequest } from "next/server";
import cloudinary from "cloudinary";

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MODIFIED: GET handler to fetch notes with pagination
// MODIFIED: GET handler to fetch notes with pagination
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    const nextCursor = searchParams.get('nextCursor') || undefined;

    const { resources, next_cursor } = await cloudinary.v2.search
      .expression('folder:notes-pdfs')
      .with_field('metadata')
      // CHANGES MADE HERE: public_id ko created_at se badla
      .sort_by('created_at', 'desc')
      .max_results(limit)
      .next_cursor(nextCursor)
      .execute();

    const notes = resources.map((resource: any) => {
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

    return NextResponse.json({
      notes,
      nextCursor: next_cursor || null,
    });
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
    const subjectName = (formData.get("subjectName") || "") as string;
    
    // CHANGES MADE:
    // Ab hum 'description' ki jagah 'images' naam se multiple files expect kar rahe hain.
    const images = formData.getAll("images") as File[]; 
    
    if (!file) {
      return NextResponse.json({ message: "No PDF file uploaded" }, { status: 400 });
    }
    
    // CHANGES MADE:
    // Images upload karne ke liye naya logic.
    const uploadedImageUrls: string[] = [];
    
    // Agar images upload hui hain, toh unhe Cloudinary par upload karo
    if (images && images.length > 0) {
      for (const image of images) {
        const imageArrayBuffer = await image.arrayBuffer();
        const imageBuffer = new Uint8Array(imageArrayBuffer);
        
        const imageResult: any = await new Promise((resolve, reject) => {
          cloudinary.v2.uploader
            .upload_stream(
              {
                folder: "note-images", // Images ke liye naya folder
                resource_type: "image"
              },
              function (error, result) {
                if (error) {
                  console.error("Cloudinary image upload stream error:", error);
                  reject(error);
                  return;
                }
                resolve(result);
              }
            )
            .end(imageBuffer);
        });
        uploadedImageUrls.push(imageResult.secure_url);
      }
    }
    
    // Main PDF file upload ka logic
    const pdfArrayBuffer = await file.arrayBuffer();
    const pdfBuffer = new Uint8Array(pdfArrayBuffer);

   const pdfResult: any = await new Promise((resolve, reject) => {
  cloudinary.v2.uploader
    .upload_stream(
      {
        folder: "notes-pdfs",
        resource_type: "raw",
        metadata: {
          className: className,
          subjectName: subjectName,
          chapterName: chapterName,
          chapterNumber: chapterNumber,
          descriptionImages: JSON.stringify(uploadedImageUrls),
          // NEW: Store the total number of images
          descriptionImageCount: uploadedImageUrls.length, 
        },
      },
          function (error, result) {
            if (error) {
              console.error("Cloudinary upload stream error:", error);
              reject(error);
              return;
            }
            resolve(result);
          }
        )
        .end(pdfBuffer);
    });

    return NextResponse.json({ success: true, data: pdfResult }, { status: 200 });
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