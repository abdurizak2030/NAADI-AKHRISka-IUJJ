import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { handleUpload } from '@/lib/server/uploads';

// Video uploads are admin-only: they back the Media Library (lectures /
// recordings) managed from the Admin Dashboard, not general member uploads.
export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await handleUpload(request, 'video');
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const { file } = result;
    return NextResponse.json(
      { url: file.url, name: file.originalName, mimeType: file.mimeType, size: file.size },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Videos can be large — raise the body size limit for this route specifically.
export const maxDuration = 60;
