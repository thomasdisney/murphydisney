import { NextResponse } from 'next/server';
import { createMessage, listMessages } from '@/app/store';
import { getClientIp, getClientLocation, getDeviceInfo, makeAuthorToken } from '@/app/lib';

export async function GET() {
  const messages = await listMessages();
  return NextResponse.json({ messages });
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const content = typeof body?.content === 'string' ? body.content.trim() : '';

  if (!content || content.length > 500) {
    return NextResponse.json({ error: 'Invalid message content.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const authorToken = makeAuthorToken(ip);
  const location = getClientLocation(request);
  const device = getDeviceInfo(request);
  const createdAt = new Date().toISOString();

  const message = await createMessage(content, authorToken, {
    city: location.city,
    region: location.region,
    userAgent: device.userAgent,
    deviceLabel: device.isIphone ? 'iPhone' : 'Device',
    createdAt
  });

  return NextResponse.json({ message }, { status: 201 });
}
