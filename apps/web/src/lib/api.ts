import type { EmailPayload, LogEntry } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Streams email sending logs from the Lambda backend.
 * The backend returns NDJSON (newline-delimited JSON), one LogEntry per line.
 */
export async function* streamEmails(
  payload: EmailPayload
): AsyncGenerator<LogEntry> {
  if (!API_URL) {
    throw new Error(
      "The API URL is not configured. Set NEXT_PUBLIC_API_URL and try again."
    );
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        try {
          yield JSON.parse(trimmed) as LogEntry;
        } catch (error) {
          throw new Error("The API returned malformed log data.", {
            cause: error,
          });
        }
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer.trim()) as LogEntry;
    } catch (error) {
      throw new Error("The API returned malformed log data.", {
        cause: error,
      });
    }
  }
}

/**
 * Sends emails without streaming (fire-and-forget).
 * Returns a single log entry on completion.
 */
export async function sendEmails(payload: EmailPayload): Promise<LogEntry[]> {
  const logs: LogEntry[] = [];
  for await (const entry of streamEmails(payload)) {
    logs.push(entry);
  }
  return logs;
}
