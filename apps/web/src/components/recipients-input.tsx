"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RecipientsInputProps {
  value: string[];
  onChange: (recipients: string[]) => void;
  className?: string;
  disabled?: boolean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function RecipientsInput({
  value,
  onChange,
  className,
  disabled,
}: RecipientsInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  function addRecipient(email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (!isValidEmail(trimmed)) {
      setError(`"${trimmed}" is not a valid email address`);
      return;
    }
    if (value.includes(trimmed)) {
      setError(`"${trimmed}" is already added`);
      return;
    }

    onChange([...value, trimmed]);
    setInputValue("");
    setError("");
  }

  function removeRecipient(email: string) {
    onChange(value.filter((r) => r !== email));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRecipient(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeRecipient(value[value.length - 1]);
    } else {
      setError("");
    }
  }

  function handleBlur() {
    if (inputValue) {
      addRecipient(inputValue);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const emails = pasted.split(/[\n,;\s]+/).filter(Boolean);
    const added: string[] = [];
    const invalid: string[] = [];

    for (const email of emails) {
      const trimmed = email.trim().toLowerCase();
      if (isValidEmail(trimmed) && !value.includes(trimmed)) {
        added.push(trimmed);
      } else if (!isValidEmail(trimmed)) {
        invalid.push(trimmed);
      }
    }

    if (added.length > 0) onChange([...value, ...added]);
    if (invalid.length > 0)
      setError(`Invalid: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "min-h-10 w-full flex flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className="gap-1 pr-1 font-normal text-xs"
          >
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecipient(email);
                }}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label={`Remove ${email}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={
            value.length === 0 ? "Add emails — press Enter or comma" : ""
          }
          className="flex-1 min-w-[200px] bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} recipient{value.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
