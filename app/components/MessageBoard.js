'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function safeTrim(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function formatPacificDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  } catch {
    return date.toLocaleString('en-US');
  }
}

export default function MessageBoard({ initialMessages, viewerToken }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  const feedRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const handleScroll = () => {
      setCompactHeader(feed.scrollTop > 14);
    };

    feed.addEventListener('scroll', handleScroll);
    return () => feed.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    const handleViewportResize = () => {
      inputRef.current?.scrollIntoView({ block: 'nearest' });
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      clearTimeout(timer);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, []);

  const canPost = useMemo(() => safeTrim(text).length > 0 && text.length <= 500, [text]);

  const submitMessage = async (event) => {
    event.preventDefault();

    if (!canPost || posting) return;

    const trimmed = safeTrim(text);
    setPosting(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      });

      if (!response.ok) {
        throw new Error('Failed to post message');
      }

      const payload = await response.json();
      setMessages((prev) => [...prev, payload.message]);
      setText('');
      inputRef.current?.focus();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="appShell">
      <header className={`header ${compactHeader ? 'compact' : ''}`}>
        <h1 className="title">MurphyDisney.com</h1>
        <p className="instructions">
          type & send a message for Murphy. no edits, no take-backs. don't forget your name.
        </p>
      </header>

      <main className="feed" ref={feedRef}>
        <div className="messages">
          {messages.length === 0 ? <p className="empty">Be the first to leave a message 💙</p> : null}

          {messages.map((message) => {
            const isSelf = message.authorToken === viewerToken;
            return (
              <div className={`bubbleRow ${isSelf ? 'self' : ''}`} key={message.id}>
                <div className={`bubble ${isSelf ? 'self' : 'other'}`}>
                  <p>{message.content}</p>
                  <small>{formatPacificDateTime(message.createdAt)}</small>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="composerWrap">
        <form className="composer" onSubmit={submitMessage}>
          <input
            ref={inputRef}
            className="input"
            type="text"
            placeholder="Type your message..."
            maxLength={500}
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label="Message"
            autoComplete="off"
            autoFocus
            inputMode="text"
          />
          <button className="button" type="submit" disabled={!canPost || posting}>
            {posting ? '...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
