import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { API_CONFIG, getApiUrl } from '@/lib/api/config';
import { uuidSchema } from '@/lib/validations/ids';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await context.params;
  const session = await getSession();

  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized: Student login required.' }, { status: 401 });
  }

  if (session.mustChangePassword) {
    return NextResponse.json(
      { error: 'Password change required before accessing certificates.' },
      { status: 403 }
    );
  }

  const parsedBatchId = uuidSchema.safeParse(batchId);
  if (!parsedBatchId.success) {
    return NextResponse.json({ error: 'Invalid batchId: expected a valid UUID.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(API_CONFIG.sessionCookieName)?.value;

  const issueUrl = getApiUrl(`/certificates/batch/${parsedBatchId.data}/issue`);
  const downloadUrl = getApiUrl(`/certificates/batch/${parsedBatchId.data}/download`);

  try {
    // 1. Ensure certificate is issued first via POST (P2-10 & P4-08)
    const issueRes = await fetch(issueUrl, {
      method: 'POST',
      headers: {
        Cookie: `${API_CONFIG.sessionCookieName}=${sessionToken}`,
      },
    });

    if (!issueRes.ok) {
      const errText = await issueRes.text();
      return NextResponse.json(
        { error: `Certificate issuance criteria not met: ${errText}` },
        { status: issueRes.status }
      );
    }

    // 2. Fetch the already-issued PDF via GET
    const res = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Cookie: `${API_CONFIG.sessionCookieName}=${sessionToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Certificate generation failed: ${errText}` },
        { status: res.status }
      );
    }

    const pdfBuffer = await res.arrayBuffer();
    const disposition = res.headers.get('content-disposition') || 'attachment; filename="Certificate.pdf"';

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Backend connection error: ${err.message || 'Service unavailable'}` },
      { status: 503 }
    );
  }
}

