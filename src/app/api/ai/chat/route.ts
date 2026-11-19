import { isIP } from "node:net";
import { NextResponse } from "next/server";
import {
  AI_CHAT_LIMITS,
  AiProviderError,
  requestPythonTutorReply,
  validateChatMessages,
} from "@/services/ai";

export const runtime = "nodejs";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 8;
const rateLimitByIp = new Map<string, { count: number; windowStartedAt: number }>();

function json(body: object, status = 200, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(body, { status, headers });
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const candidate = forwarded || realIp;
  return candidate && isIP(candidate) ? candidate : "unknown";
}

function enforceRateLimit(request: Request) {
  const now = Date.now();
  for (const [ip, entry] of rateLimitByIp) {
    if (now - entry.windowStartedAt >= RATE_WINDOW_MS) rateLimitByIp.delete(ip);
  }

  const key = clientIp(request);
  const current = rateLimitByIp.get(key);
  if (!current || now - current.windowStartedAt >= RATE_WINDOW_MS) {
    rateLimitByIp.set(key, { count: 1, windowStartedAt: now });
    if (rateLimitByIp.size > 4_096) {
      const oldestKey = rateLimitByIp.keys().next().value;
      if (oldestKey) rateLimitByIp.delete(oldestKey);
    }
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - current.windowStartedAt)) / 1_000)) };
  }

  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

async function readLimitedBody(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > AI_CHAT_LIMITS.bodyBytes) return { tooLarge: true as const };
  if (!request.body) return { tooLarge: false as const, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > AI_CHAT_LIMITS.bodyBytes) {
      await reader.cancel();
      return { tooLarge: true as const };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { tooLarge: false as const, text: new TextDecoder("utf-8", { fatal: true }).decode(body) };
  } catch {
    return { tooLarge: false as const, text: "\u0000" };
  }
}

export async function POST(request: Request) {
  const rateLimit = enforceRateLimit(request);
  if (!rateLimit.allowed) {
    return json(
      { error: { code: "RATE_LIMITED", message: "Bạn gửi yêu cầu quá nhanh. Vui lòng đợi một chút rồi thử lại." } },
      429,
      { "Retry-After": String(rateLimit.retryAfter) },
    );
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: { code: "INVALID_CONTENT_TYPE", message: "Yêu cầu cần được gửi ở định dạng JSON." } }, 415);
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    try {
      if (!host || new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
        return json({ error: { code: "CROSS_ORIGIN_REQUEST", message: "Yêu cầu không được phép từ nguồn này." } }, 403);
      }
    } catch {
      return json({ error: { code: "CROSS_ORIGIN_REQUEST", message: "Yêu cầu không được phép từ nguồn này." } }, 403);
    }
  }

  let body: Awaited<ReturnType<typeof readLimitedBody>>;
  try {
    body = await readLimitedBody(request);
  } catch {
    return json({ error: { code: "INVALID_REQUEST_BODY", message: "Không thể đọc nội dung yêu cầu. Vui lòng thử lại." } }, 400);
  }
  if (body.tooLarge) {
    return json({ error: { code: "REQUEST_TOO_LARGE", message: "Câu hỏi quá dài. Hãy rút gọn nội dung rồi thử lại." } }, 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body.text);
  } catch {
    return json({ error: { code: "INVALID_JSON", message: "Không đọc được nội dung yêu cầu. Vui lòng thử lại." } }, 400);
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return json({ error: { code: "INVALID_REQUEST", message: "Nội dung yêu cầu không hợp lệ." } }, 400);
  }

  const requestBody = payload as Record<string, unknown>;
  if (Object.keys(requestBody).some((key) => key !== "messages")) {
    return json({ error: { code: "INVALID_REQUEST", message: "Nội dung yêu cầu không hợp lệ." } }, 400);
  }

  const validated = validateChatMessages(requestBody.messages);
  if (!validated.ok) {
    const message = validated.reason === "too-many-messages"
      ? "Cuộc trò chuyện đã quá dài. Hãy xóa hội thoại và bắt đầu lại."
      : validated.reason === "message-too-long"
        ? "Một tin nhắn vượt quá giới hạn độ dài. Hãy rút gọn câu hỏi."
        : validated.reason === "conversation-too-long"
          ? "Tổng nội dung hội thoại quá dài. Hãy xóa hội thoại và bắt đầu lại."
          : "Tin nhắn không hợp lệ. Hãy gửi một câu hỏi mới.";
    return json({ error: { code: "INVALID_MESSAGES", message } }, 400);
  }

  try {
    const reply = await requestPythonTutorReply(validated.messages);
    return json({ reply });
  } catch (error) {
    if (!(error instanceof AiProviderError)) {
      return json({ error: { code: "AI_UNAVAILABLE", message: "AI gia sư hiện chưa thể trả lời. Vui lòng thử lại sau." } }, 502);
    }

    switch (error.kind) {
      case "not-configured":
        return json({ error: { code: "AI_NOT_CONFIGURED", message: "AI gia sư chưa được cấu hình. Hãy thêm AI_API_KEY trong biến môi trường phía máy chủ." } }, 503);
      case "provider-configuration":
        return json({ error: { code: "AI_CONFIGURATION_ERROR", message: "Cấu hình dịch vụ AI chưa hợp lệ. Hãy kiểm tra AI_API_KEY, AI_MODEL và AI_BASE_URL trên máy chủ." } }, 503);
      case "rate-limit":
        return json({ error: { code: "AI_PROVIDER_RATE_LIMITED", message: "Dịch vụ AI đang bận. Vui lòng đợi một chút rồi thử lại." } }, 429, { "Retry-After": "10" });
      case "timeout":
        return json({ error: { code: "AI_TIMEOUT", message: "AI gia sư mất nhiều thời gian hơn dự kiến. Hãy thử lại." } }, 504);
      case "invalid-response":
        return json({ error: { code: "AI_INVALID_RESPONSE", message: "Dịch vụ AI trả về phản hồi không hợp lệ. Vui lòng thử lại sau." } }, 502);
      case "unavailable":
        return json({ error: { code: "AI_UNAVAILABLE", message: "Không thể kết nối dịch vụ AI lúc này. Vui lòng thử lại sau." } }, 502);
    }
  }
}
