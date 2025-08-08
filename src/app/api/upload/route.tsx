// // app/api/upload/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { v2 as cloudinary  } from 'cloudinary';
// // import { ApiResourceType } from 'cloudinary';

// cloudinary.config({
//   cloud_name: 'dcxrzhoaj',
//   api_key: '971368918344559',
//   api_secret: 'mxUsn9CM-CKu07TpiOa_qdW4z4U',
// });

// type Metadata = {
//   chapterName: string;
//   chapterNumber: string;
//   className: string;
// };

// type CloudinaryResource = {
//   secure_url: string;
//   public_id: string;
//   context?: {
//     custom: {
//       chapterName?: string;
//       chapterNumber?: string;
//       className?: string;
//     };
//   };
//   created_at: string;
// };

// // Extract chapter number from public ID
// const getChapterNumber = (publicId: string): string => {
//   const match = publicId.match(/chapter_(\d+)\.pdf/);
//   return match ? match[1] : '0';
// };

// // Parse context metadata
// const parseMetadata = (context: CloudinaryResource['context']): Metadata => {
//   if (!context?.custom) return { chapterName: '', chapterNumber: '', className: '' };
//   return {
//     chapterName: context.custom.chapterName || '',
//     chapterNumber: context.custom.chapterNumber || '',
//     className: context.custom.className || '',
//   };
// };

// export async function POST(req: NextRequest) {
//   try {
//     const data: {
//       chapterNumber: string;
//       chapterName: string;
//       className: string;
//       fileBase64: string;
//     } = await req.json();

//     const { chapterNumber, chapterName, className, fileBase64 } = data;

//     if (!chapterNumber || !chapterName || !className || !fileBase64) {
//       return NextResponse.json(
//         { success: false, error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     const uploadResult = await cloudinary.uploader.upload(
//       `data:application/pdf;base64,${fileBase64}`,
//       {
//         resource_type: 'raw',
//         public_id: `notes/chapter_${chapterNumber}.pdf`,
//         overwrite: true,
//         context: `chapterName=${chapterName}|chapterNumber=${chapterNumber}|className=${className}`,
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       url: uploadResult.secure_url,
//       public_id: uploadResult.public_id,
//       chapterNumber,
//       chapterName,
//       className,
//     });
//   } catch (error) {
//     const err = error as Error;
//     console.error('Upload error:', err);
//     return NextResponse.json(
//       { success: false, error: err.message || 'Upload failed' },
//       { status: 500 }
//     );
//   }
// }

// export async function GET() {
//   try {
//     const result = await cloudinary.api.resources({
//       type: 'upload',
//       prefix: 'notes/',
//       resource_type: 'raw',
//       context: true,
//       max_results: 100,
//     });

//     const notes = (result.resources as CloudinaryResource[])
//       .filter((file) => file.public_id.includes('.pdf'))
//       .map((file) => {
//         const metadata = parseMetadata(file.context);
//         const chapterNumber = metadata.chapterNumber || getChapterNumber(file.public_id);

//         return {
//           url: file.secure_url,
//           public_id: file.public_id,
//           chapterNumber,
//           chapterName: metadata.chapterName || `Chapter ${chapterNumber}`,
//           className: metadata.className || '',
//           uploadedAt: file.created_at,
//         };
//       });

//     notes.sort((a, b) =>
//       parseInt(a.chapterNumber) - parseInt(b.chapterNumber)
//     );

//     return NextResponse.json(notes);
//   } catch (error) {
//     const err = error as Error;
//     console.error('Fetch error:', err);
//     return NextResponse.json([], { status: 500 });
//   }
// }

// export async function DELETE(req: NextRequest) {
//   try {
//     const bodyText = await req.text();
//     const { public_id }: { public_id: string } = JSON.parse(bodyText);

//     if (!public_id) {
//       return NextResponse.json(
//         { success: false, error: 'Missing public_id' },
//         { status: 400 }
//       );
//     }

//     const result: { result: string } = await cloudinary.uploader.destroy(public_id, {
//       resource_type: 'raw',
//     });

//     if (result.result !== 'ok') {
//       return NextResponse.json(
//         { success: false, error: 'Delete failed on Cloudinary' },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     const err = error as Error;
//     console.error('Delete error:', err);
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//   }
// }


// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// New types for better code
type Metadata = {
  chapterName: string;
  chapterNumber: string;
  className: string;
};

type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  context?: {
    custom: {
      chapterName?: string;
      chapterNumber?: string;
      className?: string;
    };
  };
  created_at: string;
};

type CloudinaryImageResource = {
  secure_url: string;
  public_id: string;
  created_at: string;
};

// Parse context metadata
const parseMetadata = (context: CloudinaryUploadResult['context']): Metadata => {
  if (!context?.custom) return { chapterName: '', chapterNumber: '', className: '' };
  return {
    chapterName: context.custom.chapterName || '',
    chapterNumber: context.custom.chapterNumber || '',
    className: context.custom.className || '',
  };
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const pdfFile = formData.get("file") as File;
    const imageFile = formData.get("thumbnail") as File;
    const chapterNumber = formData.get("chapterNumber") as string;
    const chapterName = formData.get("chapterName") as string;
    const className = formData.get("className") as string;

    if (!pdfFile || !imageFile || !chapterNumber || !chapterName || !className) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Upload PDF
    const pdfUploadResult: CloudinaryUploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'notes',
          public_id: `chapter_${chapterNumber}`,
          overwrite: true,
          context: `chapterName=${chapterName}|chapterNumber=${chapterNumber}|className=${className}`,
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result as CloudinaryUploadResult);
        }
      ).end(pdfBuffer);
    });

    // Upload Image
    const imageUploadResult: CloudinaryImageResource = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'notes_thumbnails',
          public_id: `chapter_${chapterNumber}_thumb`,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          resolve(result as CloudinaryImageResource);
        }
      ).end(imageBuffer);
    });

    return NextResponse.json({
      success: true,
      pdfUrl: pdfUploadResult.secure_url,
      pdfPublicId: pdfUploadResult.public_id,
      imageUrl: imageUploadResult.secure_url,
      imagePublicId: imageUploadResult.public_id,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Upload error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const pdfsResult = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'notes/',
      resource_type: 'raw',
      context: true,
      max_results: 100,
    });
    
    const imagesResult = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'notes_thumbnails/',
      resource_type: 'image',
      max_results: 100,
    });
    
    const imagesMap = new Map<string, CloudinaryImageResource>();
    (imagesResult.resources as CloudinaryImageResource[]).forEach((img) => {
      const publicId = img.public_id.replace('notes_thumbnails/', '');
      imagesMap.set(publicId.replace('_thumb', ''), img);
    });

    const notes = (pdfsResult.resources as CloudinaryUploadResult[])
      .map((file) => {
        const metadata = parseMetadata(file.context);
        const basePublicId = file.public_id.replace('notes/', '');
        const image = imagesMap.get(basePublicId);

        return {
          url: file.secure_url,
          public_id: file.public_id,
          chapterNumber: metadata.chapterNumber,
          chapterName: metadata.chapterName,
          className: metadata.className,
          thumbnailUrl: image ? image.secure_url : null,
          thumbnailPublicId: image ? image.public_id : null,
          created_at: file.created_at,
        };
      })
      .filter(note => note.className === "10" || note.className === "12");

    notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(notes);
  } catch (error) {
    const err = error as Error;
    console.error('Fetch error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    type DeleteRequest = {
      public_id: string;
      thumbnailPublicId: string;
    };
    const { public_id, thumbnailPublicId }: DeleteRequest = await req.json();

    if (!public_id) {
      return NextResponse.json(
        { success: false, error: 'Missing public_id' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: 'raw',
    });

    if (thumbnailPublicId) {
      await cloudinary.uploader.destroy(thumbnailPublicId, {
        resource_type: 'image',
      });
    }

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