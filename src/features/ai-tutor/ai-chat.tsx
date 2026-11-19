"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type ChatRole = "user" | "assistant";
interface ChatMessage {
  role: ChatRole;
  content: string;
}

const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_CHARACTERS = 12_000;

const suggestedQuestions = [
  { label: "Giải thích Python", prompt: "Python là gì? Hãy giải thích bằng một ví dụ ngắn, dễ hiểu." },
  { label: "Sửa lỗi code", prompt: "Mình có một đoạn code Python bị lỗi. Hãy hướng dẫn mình cách gửi code và thông báo lỗi để cùng tìm nguyên nhân." },
  { label: "Giải thích vòng lặp", prompt: "Hãy giải thích sự khác nhau giữa vòng lặp for và while trong Python, kèm ví dụ ngắn." },
  { label: "Bài tập thực hành", prompt: "Cho mình một bài tập Python cơ bản về biến và câu lệnh điều kiện. Hãy đưa gợi ý trước, chưa đưa lời giải." },
];

function selectHistory(messages: ChatMessage[]) {
  const selected: ChatMessage[] = [];
  let characters = 0;

  for (const message of messages.slice(-MAX_HISTORY_MESSAGES).reverse()) {
    if (characters + message.content.length > MAX_HISTORY_CHARACTERS) break;
    selected.push(message);
    characters += message.content.length;
  }

  return selected.reverse();
}

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLLIElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  async function sendMessage(question = draft) {
    const content = question.trim();
    if (!content || pending) return;

    const nextMessages = [...messages, { role: "user" as const, content }].slice(-MAX_HISTORY_MESSAGES);
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: selectHistory(nextMessages) }),
      });

      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const apiError = typeof payload === "object" && payload !== null
          ? (payload as { error?: { message?: unknown } }).error?.message
          : null;
        throw new Error(typeof apiError === "string" ? apiError : "AI gia sư chưa thể trả lời. Vui lòng thử lại sau.");
      }

      const reply = typeof payload === "object" && payload !== null ? (payload as { reply?: unknown }).reply : null;
      if (typeof reply !== "string" || !reply.trim()) throw new Error("AI gia sư trả về câu trả lời không hợp lệ. Vui lòng thử lại.");

      setMessages((current) => [...current, { role: "assistant" as const, content: reply.trim() }].slice(-MAX_HISTORY_MESSAGES));
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Không thể kết nối AI gia sư. Vui lòng thử lại.");
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function clearConversation() {
    if (pending) return;
    setMessages([]);
    setDraft("");
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <main className="content ai-page">
      <div className="page-heading ai-page-heading">
        <div>
          <p className="eyebrow">Học cùng AI</p>
          <h1>AI gia sư Python</h1>
          <p className="page-subtitle">Hỏi về khái niệm, chia sẻ lỗi code hoặc luyện tập theo nhịp học của bạn.</p>
        </div>
        <button className="button-secondary ai-clear-button" type="button" onClick={clearConversation} disabled={pending || messages.length === 0}>
          Xóa hội thoại
        </button>
      </div>

      <section className="card ai-chat-panel" aria-label="Trò chuyện với gia sư Python">
        <div className="ai-chat-toolbar">
          <div className="ai-tutor-identity">
            <span className="ai-tutor-mark" aria-hidden="true">P</span>
            <div><strong>Gia sư Python</strong><span>Giải thích bằng tiếng Việt</span></div>
          </div>
          <span className="ai-privacy-note">Hội thoại không được lưu sau khi rời trang</span>
        </div>

        <div className="ai-transcript" role="log" aria-label="Nội dung hội thoại" aria-live="off">
          {messages.length === 0 ? (
            <div className="ai-welcome-state">
              <span className="ai-welcome-icon" aria-hidden="true">{"{ }"}</span>
              <h2>Bạn muốn tìm hiểu điều gì?</h2>
              <p>Hãy đặt câu hỏi hoặc chọn một gợi ý để bắt đầu.</p>
              <div className="ai-suggestions">
                {suggestedQuestions.map((suggestion) => (
                  <button key={suggestion.label} className="ai-suggestion" type="button" onClick={() => void sendMessage(suggestion.prompt)} disabled={pending}>
                    {suggestion.label}<span aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="ai-message-list">
              {messages.map((message, index) => (
                <li className={`ai-message ai-message-${message.role}`} key={`${index}-${message.role}`}>
                  {message.role === "assistant" && <span className="ai-message-avatar" aria-hidden="true">P</span>}
                  <div className="ai-message-bubble">
                    <span className="ai-message-label">{message.role === "user" ? "Bạn" : "Gia sư Python"}</span>
                    <p>{message.content}</p>
                  </div>
                </li>
              ))}
              {pending && (
                <li className="ai-message ai-message-assistant">
                  <span className="ai-message-avatar" aria-hidden="true">P</span>
                  <div className="ai-message-bubble ai-typing" role="status" aria-live="polite">
                    <span className="ai-message-label">Gia sư Python</span>
                    <span>Đang suy nghĩ</span><span className="ai-typing-dots" aria-hidden="true">•••</span>
                  </div>
                </li>
              )}
              <li className="ai-transcript-end" ref={transcriptEndRef} aria-hidden="true" />
            </ol>
          )}
        </div>

        {error && <p className="ai-error-message" role="alert">{error}</p>}

        <form className="ai-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="ai-question">Câu hỏi dành cho gia sư Python</label>
          <textarea
            id="ai-question"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Nhập câu hỏi về Python…"
            rows={2}
            maxLength={4_000}
            disabled={pending}
          />
          <div className="ai-composer-footer">
            <span>Enter để gửi · Shift + Enter để xuống dòng</span>
            <button className="button-primary ai-send-button" type="submit" disabled={pending || !draft.trim()}>
              {pending ? "Đang gửi…" : "Gửi câu hỏi"}<span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
