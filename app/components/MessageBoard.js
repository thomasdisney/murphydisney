'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function normalizeMessage(value) {
  return value.replace(/\r\n?/g, '\n').trim();
}

function formatMessageDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  try {
    const datePart = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);

    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
      .format(date)
      .replace(' AM', 'am')
      .replace(' PM', 'pm');

    return `${datePart} at ${timePart}`;
  } catch {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

function formatMessageLabel(message) {
  const location = [message.city, message.region].filter(Boolean).join(', ');
  if (!location) {
    return null;
  }

  const device = message.deviceLabel || 'Device';
  return `${device} in ${location}`;
}

export default function MessageBoard({ initialMessages, viewerToken }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const feedRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    const focusInput = () => {
      const input = inputRef.current;
      if (!input) return;

      input.focus({ preventScroll: true });
      input.setSelectionRange(input.value.length, input.value.length);
    };

    const timer = setTimeout(focusInput, 120);
    const raf = requestAnimationFrame(focusInput);

    const handleViewportResize = () => {
      inputRef.current?.scrollIntoView({ block: 'nearest' });
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, []);

  const canPost = useMemo(() => normalizeMessage(text).length > 0 && text.length <= 500, [text]);
  const showSubmit = text.length > 0;

  const submitMessage = async (event) => {
    event.preventDefault();

    if (!canPost || posting) return;

    const trimmed = normalizeMessage(text);
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
      <header className="header">
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
            const label = formatMessageLabel(message);

            return (
              <div className={`bubbleRow ${isSelf ? 'self' : ''}`} key={message.id}>
                <div className={`bubble ${isSelf ? 'self' : 'other'}`}>
                  <p>{message.content}</p>
                  <div className="meta">
                    {label ? <small className="metaDevice">{label}</small> : null}
                    <small className="metaTimestamp">{formatMessageDateTime(message.createdAt)}</small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="composerWrap">
        <form className="composer" onSubmit={submitMessage}>
          <div className="inputWrap">
            <input
              ref={inputRef}
              className="input"
              placeholder=""
              maxLength={500}
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-label="Message"
              autoComplete="off"
              autoFocus
              inputMode="text"
              type="text"
              enterKeyHint="send"
            />
            {!text ? <span className="fakeCursor" aria-hidden="true" /> : null}
          </div>
          {showSubmit ? (
            <button className="button iconButton" type="submit" disabled={!canPost || posting} aria-label="Post message">
              {posting ? '…' : '↑'}
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
