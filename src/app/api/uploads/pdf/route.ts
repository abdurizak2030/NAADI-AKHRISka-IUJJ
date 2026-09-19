import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/auth';
import { handleUpload } from '@/lib/server/uploads';

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await handleUpload(request, 'attachment');
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
    const { file } = result;
    if (file.mimeType !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed.' }, { status: 400 });
    }
    return NextResponse.json(
      { url: file.url, name: file.originalName, mimeType: file.mimeType, size: file.size },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}