/** Server-side AI provider boundary. Add provider SDK and request handling in a later phase. */
export function getAiApiKey() {
  return process.env.AI_API_KEY;
}
