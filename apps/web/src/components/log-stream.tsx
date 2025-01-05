"use client";

import * as React from "react";
import { CheckCircle, XCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEntry, LogStatus } from "@/types";

interface LogStreamProps {
  logs: LogEntry[];
  isStreaming: boolean;
  className?: string;
}

function StatusIcon({ status }: { status: LogStatus }) {
  switch (status) {
    case "success":
      return <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />;
    case "error":
      return <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />;
    default:
      return <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
  }
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

export function LogStream({ logs, isStreaming, className }: LogStreamProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const summary = React.useMemo(() => {
    if (isStreaming) return null;
    const sent = logs.filter((l) => l.email?.success).length;
    const failed = logs.filter(
      (l) => l.email !== undefined && !l.email.success
    ).length;
    if (sent + failed === 0) return null;
    return { sent, failed };
  }, [logs, isStreaming]);

  if (logs.length === 0 && !isStreaming) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Delivery Log</span>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Sending…
          </span>
        )}
        {summary && (
          <span className="text-xs text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-500 font-medium">
              {summary.sent} sent
            </span>
            {summary.failed > 0 && (
              <>
                {" · "}
                <span className="text-destructive font-medium">
                  {summary.failed} failed
                </span>
              </>
            )}
          </span>
        )}
      </div>

      <div className="relative h-72 overflow-y-auto rounded-md border bg-muted/30 font-mono text-xs">
        <div className="p-3 space-y-1">
          {logs.map((log, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 py-0.5",
                log.status === "error" && "text-destructive",
                log.status === "success" &&
                  "text-emerald-700 dark:text-emerald-400",
                log.status === "info" && "text-muted-foreground"
              )}
            >
              <StatusIcon status={log.status} />
              <span className="shrink-0 text-muted-foreground/70 tabular-nums">
                {formatTimestamp(log.timestamp)}
              </span>
              <span className="break-all leading-relaxed">{log.message}</span>
            </div>
          ))}
          {isStreaming && (
            <div className="flex items-center gap-2 text-muted-foreground py-0.5">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
