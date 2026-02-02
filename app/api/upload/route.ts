import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { put } from '@vercel/blob';

const UPLOAD_DIR = 'public/uploads';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (local)
const MAX_SIZE_BLOB = 4.5 * 1024 * 1024; // 4.5MB (Vercel Blob server limit)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
    const isVercel = !!process.env.VERCEL;

    if (isVercel && !useBlob) {
      return NextResponse.json(
        {
          success: false,
          error:
            'File upload is not configured. Add a Blob store and set BLOB_READ_WRITE_TOKEN in Vercel.',
        },
        { status: 503 }
      );
    }

    const maxSize = useBlob ? MAX_SIZE_BLOB : MAX_SIZE_BYTES;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: useBlob
            ? 'File too large. Max size: 4.5MB (Vercel Blob limit)'
            : 'File too large. Max size: 10MB',
        },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase()) ? ext : '.jpg';
    const filename = `${Date.now()}-${randomBytes(8).toString('hex')}${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;

    if (useBlob) {
      const blob = await put(filename, buffer, {
        access: 'public',
      });
      url = blob.url;
    } else {
      const dir = path.join(process.cwd(), UPLOAD_DIR);
      const filepath = path.join(dir, filename);
      await mkdir(dir, { recursive: true });
      await writeFile(filepath, buffer);
      url = `/uploads/${filename}`;
    }

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
