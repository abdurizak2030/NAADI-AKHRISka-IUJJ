import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { requireAdmin } from '@/lib/server/auth';
import { deleteTestimonial, updateTestimonial } from '@/lib/server/repositories/content.repository';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await safeJsonBody(request);
    const testimonial = await updateTestimonial(id, body);
    if (!testimonial) return NextResponse.json({ error: 'Faalladan lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'UPDATE_TESTIMONIAL', `Faallo la cusboonaysiiyey: ${testimonial.name}`);
    return NextResponse.json(testimonial);
  } catch (err) {
    return handleError(err, 'PUT /api/testimonials/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  const auth = requireAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const testimonial = await deleteTestimonial(id);
    if (!testimonial) return NextResponse.json({ error: 'Faalladan lama helin.' }, { status: 404 });
    addAuditLog(auth.payload.userId, auth.payload.name, 'DELETE_TESTIMONIAL', `La tirtiray faallo: ${testimonial.name}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, 'DELETE /api/testimonials/[id]');
  }
}
