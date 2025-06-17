import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export async function GET() {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'students/',
      resource_type: 'image',
      context: true,
      max_results: 500,
    });

    const students = result.resources.map((file: any) => {
      // Extract all context data
      const context = file.context?.custom || {};
      return {
        id: file.public_id,
        name: context.name || 'No Name',
        email: context.email || 'No Email',
        className: context.class || 'No Class',
        mobile: context.mobile || 'No Mobile',
        village: context.village || 'No Village',
        district: context.district || 'No District',
        imageUrl: file.secure_url,
        public_id: file.public_id,
        created_at: file.created_at
      };
    });

    // Sort by creation date (newest first)
    students.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// Update the POST function in your route.ts file
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields (removed email from required fields)
    const requiredFields = ['name', 'className', 'mobile', 'village', 'district', 'fileBase64'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      );
    }

    // Upload to Cloudinary with all context data
    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${data.fileBase64}`,
      {
        folder: 'students',
        resource_type: 'image',
        public_id: `${data.name.replace(/\s+/g, '-')}-${Date.now()}`,
        context: {
          name: data.name,
          email: data.email || '', // Handle empty email case
          class: data.className,
          mobile: data.mobile,
          village: data.village,
          district: data.district
        },
        tags: ['student']
      }
    );

    return NextResponse.json({
      success: true,
      student: {
        id: uploadResult.public_id,
        name: data.name,
        email: data.email || '', // Handle empty email case
        className: data.className,
        mobile: data.mobile,
        village: data.village,
        district: data.district,
        imageUrl: uploadResult.secure_url,
        public_id: uploadResult.public_id
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const public_id = searchParams.get('public_id');
    
    if (!public_id) {
      return NextResponse.json(
        { success: false, error: 'public_id is required' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: 'image'
    });

    if (result.result === 'ok') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete student' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Delete request failed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';