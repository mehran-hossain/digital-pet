import { useEffect, useRef } from "react";

export function Talk({
  messages,
  quickSuggestions,
  draftMessage,
  onDraftChange,
  onSendMessage,
  onSuggestionClick,
  isLocked = false,
  onKeyDown,
}) {
  const messageLogRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!messageLogRef.current || !bottomRef.current) return;

    requestAnimationFrame(() => {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages]);

  return (
    <div className="message-box">
      <div
        ref={messageLogRef}
        className="message-log"
        aria-label="messages"
      >
        {messages.slice(-6).map((m) => (
          <div
            key={`${m.ts}-${m.from}-${m.text}`}
            className={`message message--${m.from}${m.variant ? ` message--${m.variant}` : ""}`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        className="message-suggestions"
        aria-label="quick message suggestions"
      >
        {quickSuggestions.map((suggestion) => (
          <button
            key={`suggestion-${suggestion}`}
            type="button"
            className="suggestion-chip"
            onClick={() => onSuggestionClick(suggestion)}
            disabled={isLocked}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="message-compose">
        <input
          value={draftMessage}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Send a message…"
          className="message-input"
          disabled={isLocked}
        />
        <button
          onClick={() => onSendMessage()}
          className="send-button"
          disabled={isLocked}
        >
          Send
        </button>
      </div>
    </div>
  );
}