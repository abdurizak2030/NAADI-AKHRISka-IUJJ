import { NextRequest, NextResponse } from 'next/server';
import { requireDbReady, handleError, safeJsonBody } from '@/lib/server/route-helpers';
import { addAuditLog } from '@/lib/server/repositories/audit.repository';
import { createContactMessage } from '@/lib/server/repositories/content.repository';

export async function POST(request: NextRequest) {
  const notReady = await requireDbReady();
  if (notReady) return notReady;
  try {
    const { name, email, message } = await safeJsonBody(request);
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Fadlan buuxi magaca, iimaylka, iyo fariinta.' }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: 'Fadlan geli iimayl sax ah.' }, { status: 400 });
    }

    // Persisted so it shows up directly in the Admin Dashboard's Messages
    // inbox, not just buried in the audit trail.
    const saved = await createContactMessage({ name, email, message });
    addAuditLog('guest', name, 'CONTACT_FORM', `${email}: ${message}`);

    return NextResponse.json(
      { success: true, id: saved.id, message: 'Fariintaada waa la helay. Waan kula soo xiriiri doonaa dhawaan.' },
      { status: 201 }
    );
  } catch (err) {
    return handleError(err, 'POST /api/contact');
  }
}
