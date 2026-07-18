import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAuth } from '@/lib/server/auth';
import { createChatMessage, listChatMessages } from '@/lib/server/repositories/content.repository';
import { findUserById } from '@/lib/server/repositories/user.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await listChatMessages());
  } catch (err) {
    return handleError(err, 'GET /api/chat');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const payload = auth.payload;
    const { content, attachmentUrl, attachmentName, attachmentType } = await safeJsonBody(request);
    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    if (!trimmedContent && !attachmentUrl) {
      return NextResponse.json({ error: 'Fariintu waa inay qoraal ama faylka lifaaqan leedahay.' }, { status: 400 });
    }

    const user = await findUserById(payload.userId);
    const message = await createChatMessage({
      userId: payload.userId,
      userName: payload.name,
      userRole: payload.role,
      userTitle: user?.title,
      avatarUrl: user?.avatarUrl,
      content: trimmedContent,
      attachmentUrl,
      attachmentName,
      attachmentType,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/chat');
  }
}
