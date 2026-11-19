import "server-only";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatInputResult =
  | { ok: true; messages: AiChatMessage[] }
  | { ok: false; reason: "invalid" | "too-many-messages" | "message-too-long" | "conversation-too-long" };

export type AiProviderFailure =
  | "not-configured"
  | "provider-configuration"
  | "app-timeout"
  | "provider-invalid-request"
  | "provider-invalid-api-key"
  | "provider-forbidden"
  | "provider-not-found"
  | "provider-rate-limit"
  | "provider-server-error"
  | "provider-http-error"
  | "network-error"
  | "invalid-response";

export class AiProviderError extends Error {
  constructor(
    readonly kind: AiProviderFailure,
    readonly httpStatus?: number,
    readonly providerErrorCode?: string,
  ) {
    super(kind);
    this.name = "AiProviderError";
  }
}

const GEMINI_REQUEST_TIMEOUT_MS = 60_000;

export const AI_CHAT_LIMITS = {
  bodyBytes: 32_000,
  historyMessages: 20,
  messageCharacters: 4_000,
  conversationCharacters: 12_000,
} as const;

const SYSTEM_PROMPT = `Bạn là gia sư Python của Python Learning Hub. Luôn trả lời bằng tiếng Việt tự nhiên, đầy đủ dấu và phù hợp với người mới bắt đầu.

Hãy giải thích khái niệm theo từng bước, dùng ví dụ Python ngắn, dễ chạy và giải thích kết quả. Khi được hỏi về code hoặc lỗi, chỉ ra nguyên nhân, cách sửa, và có thể phân tích từng dòng khi hữu ích. Khuyến khích người học tự suy luận bằng câu hỏi gợi mở thay vì chỉ đưa đáp án; khi người học cần lời giải, hướng dẫn rõ ràng nhưng vẫn giải thích cách nghĩ. Không khẳng định đã chạy hoặc kiểm chứng code nếu bạn chưa thực sự chạy code.`;

export function getAiApiKey() {
  return process.env.AI_API_KEY?.trim() ?? "";
}

export function validateChatMessages(value: unknown): ChatInputResult {
  if (!Array.isArray(value) || value.length === 0) return { ok: false, reason: "invalid" };
  if (value.length > AI_CHAT_LIMITS.historyMessages) return { ok: false, reason: "too-many-messages" };

  const messages: AiChatMessage[] = [];
  let totalCharacters = 0;

  for (const item of value) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return { ok: false, reason: "invalid" };
    const record = item as Record<string, unknown>;
    if (Object.keys(record).some((key) => key !== "role" && key !== "content")) return { ok: false, reason: "invalid" };
    if ((record.role !== "user" && record.role !== "assistant") || typeof record.content !== "string") {
      return { ok: false, reason: "invalid" };
    }

    const content = record.content.trim();
    if (!content) return { ok: false, reason: "invalid" };
    if (content.length > AI_CHAT_LIMITS.messageCharacters) return { ok: false, reason: "message-too-long" };
    totalCharacters += content.length;
    if (totalCharacters > AI_CHAT_LIMITS.conversationCharacters) return { ok: false, reason: "conversation-too-long" };
    messages.push({ role: record.role, content });
  }

  if (messages.at(-1)?.role !== "user") return { ok: false, reason: "invalid" };
  return { ok: true, messages };
}

function getCompletionUrl() {
  const baseUrl = process.env.AI_BASE_URL?.trim() || "https://generativelanguage.googleapis.com/v1beta/openai";
  let parsed: URL;

  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new AiProviderError("provider-configuration");
  }

  if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new AiProviderError("provider-configuration");
  }

  return `${parsed.toString().replace(/\/+$/, "")}/chat/completions`;
}

function readCompletionText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (typeof first !== "object" || first === null) return null;
  const message = (first as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" && content.trim() ? content.trim() : null;
}

async function readProviderJson(response: Response): Promise<unknown> {
  const maxResponseBytes = 256_000;
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
    throw new AiProviderError("invalid-response");
  }
  if (!response.body) throw new AiProviderError("invalid-response");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > maxResponseBytes) {
      await reader.cancel();
      throw new AiProviderError("invalid-response");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new AiProviderError("invalid-response");
  }
}

function getProviderErrorCode(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return undefined;
  const errorPayload = error as { code?: unknown; status?: unknown };
  const code = typeof errorPayload.status === "string" ? errorPayload.status : errorPayload.code;
  const candidate = typeof code === "number" ? String(code) : code;
  return typeof candidate === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(candidate)
    ? candidate
    : undefined;
}

function getProviderHttpFailure(status: number): AiProviderFailure {
  switch (status) {
    case 400: return "provider-invalid-request";
    case 401: return "provider-invalid-api-key";
    case 403: return "provider-forbidden";
    case 404: return "provider-not-found";
    case 429: return "provider-rate-limit";
    default: return status >= 500 ? "provider-server-error" : "provider-http-error";
  }
}

async function readProviderErrorCode(response: Response): Promise<string | undefined> {
  try {
    const payload = await readProviderJson(response);
    return getProviderErrorCode(payload);
  } catch {
    return undefined;
  }
}

function logProviderRequest(
  durationMs: number,
  httpStatus: number | null,
  errorType: AiProviderFailure | "success",
  providerErrorCode?: string,
) {
  console.info(JSON.stringify({
    event: "ai_provider_request",
    provider: "gemini",
    durationMs,
    httpStatus,
    errorType,
    ...(providerErrorCode ? { providerErrorCode } : {}),
  }));
}

export async function requestPythonTutorReply(messages: AiChatMessage[]) {
  const apiKey = getAiApiKey();
  if (!apiKey) throw new AiProviderError("not-configured");

  const model = process.env.AI_MODEL?.trim() || "gemini-3.8-flash";
  const url = getCompletionUrl();
  const controller = new AbortController();
  const startedAt = performance.now();
  let appTimedOut = false;
  let httpStatus: number | null = null;
  let errorType: AiProviderFailure | "success" = "success";
  let providerErrorCode: string | undefined;
  const timeout = setTimeout(() => {
    appTimedOut = true;
    controller.abort();
  }, GEMINI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_completion_tokens: 1_200,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    httpStatus = response.status;

    if (!response.ok) {
      providerErrorCode = await readProviderErrorCode(response);
      throw new AiProviderError(getProviderHttpFailure(response.status), response.status, providerErrorCode);
    }

    const payload = await readProviderJson(response);
    const reply = readCompletionText(payload);
    if (!reply) throw new AiProviderError("invalid-response");
    return reply;
  } catch (error) {
    if (appTimedOut) {
      errorType = "app-timeout";
      throw new AiProviderError("app-timeout", httpStatus ?? undefined, providerErrorCode);
    }
    if (error instanceof AiProviderError) {
      errorType = error.kind;
      throw error;
    }
    errorType = "network-error";
    throw new AiProviderError("network-error", httpStatus ?? undefined);
  } finally {
    clearTimeout(timeout);
    if (!controller.signal.aborted) controller.abort();
    logProviderRequest(Math.round(performance.now() - startedAt), httpStatus, errorType, providerErrorCode);
  }
}
