import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { listTaxonomy, renameTaxonomy } from '@/lib/server/repositories/articles.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

/** Categories and authors are derived from articles; admins manage them by renaming/merging. */
export async function GET(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const [categories, authors] = await Promise.all([listTaxonomy('category'), listTaxonomy('author')]);
    return NextResponse.json({ categories, authors });
  } catch (err) {
    return handleError(err, 'GET /api/admin/taxonomy');
  }
}

export async function PUT(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const kind = body.kind === 'author' ? 'author' : body.kind === 'category' ? 'category' : null;
    const from = typeof body.from === 'string' ? body.from.trim() : '';
    const to = typeof body.to === 'string' ? body.to.trim() : '';
    if (!kind || !from || (kind === 'author' && !to) || to.length > 120) {
      return NextResponse.json({ error: 'Invalid rename request.' }, { status: 400 });
    }
    const updated = await renameTaxonomy(kind, from, to);
    addAuditLog(auth.payload.userId, auth.payload.name, 'RENAME_TAXONOMY', `${kind}: "${from}" -> "${to}" (${updated} articles)`);
    return NextResponse.json({ updated });
  } catch (err) {
    return handleError(err, 'PUT /api/admin/taxonomy');
  }
}
