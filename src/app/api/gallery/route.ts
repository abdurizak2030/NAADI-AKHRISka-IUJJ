import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { createGalleryItem, listGallery } from '@/lib/server/repositories/media.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await listGallery());
  } catch (err) {
    return handleError(err, 'GET /api/gallery');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const { imageUrl } = body;
    if (!imageUrl) return NextResponse.json({ error: 'Cinwaanka sawirka (URL) waa muhiim.' }, { status: 400 });
    const item = await createGalleryItem(body);
    addAuditLog(auth.payload.userId, auth.payload.name, 'CREATE_GALLERY_ITEM', `Sawir cusub oo lagu daray: ${item.title}`);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/gallery');
  }
}
