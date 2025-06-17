// src/app/api/upload-person/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

function isValidType(type: string | null): type is 'team' | 'mentor' {
  return type === 'team' || type === 'mentor';
}

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type');
    if (!isValidType(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${type}/`,
      resource_type: 'image',
      context: true,
      max_results: 100,
    });

    const people = result.resources.map((file: any) => ({
      name: file.context?.custom?.name || null,
      role: file.context?.custom?.role || null,
      url: file.secure_url,
      public_id: file.public_id,
    }));

    return NextResponse.json(people);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, role, fileBase64, type } = await req.json();

    if (!name || !role || !fileBase64 || !isValidType(type)) {
      return NextResponse.json(
        { success: false, error: 'Missing fields or invalid type' },
        { status: 400 }
      );
    }

    const uploadResult = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${fileBase64}`,
      {
        resource_type: 'image',
        public_id: `${type}/${name}-${Date.now()}`,
        overwrite: true,
        context: `name=${name}|role=${role}`,
      }
    );

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      name,
      role,
    });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { public_id, type } = await req.json();

    if (!public_id) {
      return NextResponse.json({ success: false, error: 'Missing public_id' }, { status: 400 });
    }

    // Optional: validate type if needed
    if (type && !isValidType(type)) {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });

    if (result.result === 'ok') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Delete request failed' }, { status: 500 });
  }
}
