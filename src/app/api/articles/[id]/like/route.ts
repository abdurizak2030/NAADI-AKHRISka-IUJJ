import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { incrementLikes } from '@/lib/server/repositories/articles.repository';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const { id } = await params;
    const likesCount = await incrementLikes(id);
    if (likesCount === null) return NextResponse.json({ error: 'Maqaalka lama helin.' }, { status: 404 });
    return NextResponse.json({ likesCount });
  } catch (err) {
    return handleError(err, 'POST /api/articles/[id]/like');
  }
}
