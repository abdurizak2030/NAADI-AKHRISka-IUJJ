import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { createTestimonial, listTestimonials } from '@/lib/server/repositories/content.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function GET() {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    return NextResponse.json(await listTestimonials());
  } catch (err) {
    return handleError(err, 'GET /api/testimonials');
  }
}

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const body = await safeJsonBody(request);
    const { name, content } = body;
    if (!name || !content) {
      return NextResponse.json({ error: 'Magaca iyo faallada waa muhiim.' }, { status: 400 });
    }
    const testimonial = await createTestimonial(body);
    addAuditLog(auth.payload.userId, auth.payload.name, 'CREATE_TESTIMONIAL', `Faallo cusub oo laga helay: ${testimonial.name}`);
    return NextResponse.json(testimonial, { status: 201 });
  } catch (err) {
    return handleError(err, 'POST /api/testimonials');
  }
}
