import { NextResponse, NextRequest } from "next/server";
import cloudinary from "cloudinary";

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const GET = async (req: NextRequest) => {
  try {
    const publicId = req.nextUrl.searchParams.get("publicId");
    if (!publicId) {
      return NextResponse.json({ message: "Missing publicId" }, { status: 400 });
    }

    // Cloudinary से सिर्फ़ उस specific resource का metadata fetch करें
    const resource = await cloudinary.v2.api.resource(publicId, {
      metadata: true,
      resource_type: "raw" // सुनिश्चित करें कि यह 'raw' है क्योंकि आपने इसे notes-pdfs फ़ोल्डर में रखा है।
    });

    const descriptionImages = resource.metadata?.descriptionImages ? JSON.parse(resource.metadata.descriptionImages) : [];

    return NextResponse.json({ descriptionImages }, { status: 200 });
  } catch (error) {
    console.error("Error fetching note images:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: (error as Error).message },
      { status: 500 }
    );
  }
};