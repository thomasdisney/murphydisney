import { NextResponse } from 'next/server';
import { getClientIp, makeAuthorToken } from '@/app/lib';

export async function GET(request) {
  const ip = getClientIp(request);
  const authorToken = makeAuthorToken(ip);

  return NextResponse.json({ authorToken });
}
