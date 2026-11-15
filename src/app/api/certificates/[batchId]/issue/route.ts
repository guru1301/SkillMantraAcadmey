import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { API_CONFIG, getApiUrl } from '@/lib/api/config';
import { uuidSchema } from '@/lib/validations/ids';
import { cookies } from 'next/headers';

export async function POST(
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
  const backendUrl = getApiUrl(`/certificates/batch/${parsedBatchId.data}/issue`);

  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        Cookie: `${API_CONFIG.sessionCookieName}=${sessionToken}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Backend connection error: ${err.message || 'Service unavailable'}` },
      { status: 503 }
    );
  }
}

