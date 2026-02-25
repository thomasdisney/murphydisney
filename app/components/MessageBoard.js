'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function normalizeMessage(value) {
  return value.replace(/\r\n?/g, '\n').trim();
}

function toValidDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLogTimestamp(value) {
  const date = toValidDate(value);

  if (!date) {
    return 'Unknown time';
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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

function getElapsedYears(fromValue, toValue) {
  const from = toValidDate(fromValue);
  const to = toValidDate(toValue);

  if (!from || !to || to <= from) {
    return 0;
  }

  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
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

  const canPost = useMemo(() => normalizeMessage(text).length > 0 && text.length <= 500, [text]);

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

  const firstMessageAt = messages[0]?.createdAt || null;

  return (
    <div className="appShell">
      <div className="spaceBackdrop" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <header className="sceneHeader">
        <h1 className="title">MurphyDisney Transmission Wall</h1>
        <p className="instructions">Delayed messages from home, preserved in order. Hold the line. Keep sending.</p>
      </header>

      <main className="monitorSection">
        <section className="monitorFrame" aria-label="Message monitor">
          <div className="monitorBezel">
            <div className="screenGlow" />
            <div className="monitorScreen" ref={feedRef}>
              <div className="scanlines" aria-hidden="true" />
              <div className="staticNoise" aria-hidden="true" />

              <div className="messageLogs">
                {messages.length === 0 ? <p className="empty">No transmissions yet. Be the first signal.</p> : null}

                {messages.map((message, index) => {
                  const isSelf = message.authorToken === viewerToken;
                  const label = formatMessageLabel(message);
                  const elapsedYears = getElapsedYears(firstMessageAt, message.createdAt);

                  return (
                    <article
                      key={message.id}
                      className={`logEntry ${isSelf ? 'self' : ''}`}
                      style={{ animationDelay: `${Math.min(index * 120, 1400)}ms` }}
                    >
                      <p className="logMeta">
                        <span className="logTimestamp">[{formatLogTimestamp(message.createdAt)}]</span>
                        {elapsedYears > 0 ? <span className="elapsedYears">+{elapsedYears}y drift</span> : null}
                      </p>
                      <p className="logContent">{message.content}</p>
                      {label ? <p className="logLabel">{label}</p> : null}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="composerWrap">
        <form className="composer" onSubmit={submitMessage}>
          <textarea
            ref={inputRef}
            className="input"
            placeholder="Record your transmission..."
            maxLength={500}
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label="Message"
            autoComplete="off"
            autoFocus
            inputMode="text"
            rows={2}
          />
          <button className="button" type="submit" disabled={!canPost || posting}>
            {posting ? 'Sending...' : 'Transmit'}
          </button>
        </form>
      </div>
    </div>
  );
}
