import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { createPdf, listPdfs } from '@/lib/server/repositories/media.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await listPdfs());
  } catch (err) {
    return handleError(err, 'GET /api/pdfs');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;

  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await safeJsonBody(request);
    const { title, author } = body;
    if (!title || !author) {
      return NextResponse.json({ error: 'Buuxi magaca iyo qoraha labadaba.' }, { status: 400 });
    }
    const pdf = await createPdf(body);
    addAuditLog(auth.payload.userId, auth.payload.name, 'CREATE_PDF', `Lagu daray buug cusub: ${title}`);
    return NextResponse.json(pdf, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/pdfs');
  }
}
