import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteComment } from '@/lib/server/repositories/articles.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const comment = await deleteComment(id);
    if (!comment) return NextResponse.json({ error: 'Faallada lama helin.' }, { status: 404 });

    addAuditLog(
      auth.payload.userId,
      auth.payload.name,
      'DELETE_COMMENT',
      'Deleted comment from ' + comment.authorName + ' on: ' + comment.articleTitle
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/admin/comments/[id]');
  }
}
