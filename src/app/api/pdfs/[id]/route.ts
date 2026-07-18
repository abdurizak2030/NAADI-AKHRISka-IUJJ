import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deletePdf, updatePdf } from '@/lib/server/repositories/media.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await safeJsonBody(request);
    const pdf = await updatePdf(id, body);
    if (!pdf) return NextResponse.json({ error: 'Buugga lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'EDIT_PDF', `La cusboonaysiiyey buug: ${pdf.title}`);
    return NextResponse.json(pdf);
  } catch (err) {
    return handleError(err, 'PUT /api/pdfs/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const pdf = await deletePdf(id);
    if (!pdf) return NextResponse.json({ error: 'Buugga lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_PDF', `La tirtiray buug: ${pdf.title}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/pdfs/[id]');
  }
}
