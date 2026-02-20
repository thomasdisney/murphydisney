import MessageBoard from './components/MessageBoard';
import { listMessages } from './store';
import { headers } from 'next/headers';
import { makeAuthorToken } from './lib';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const allMessages = await listMessages();
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || headers().get('x-real-ip') || 'unknown';
  const viewerToken = makeAuthorToken(ip);

  return <MessageBoard initialMessages={allMessages} viewerToken={viewerToken} />;
}
