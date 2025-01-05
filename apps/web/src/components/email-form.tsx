"use client";

import * as React from "react";
import { Send, ChevronDown, ChevronUp, Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RecipientsInput } from "@/components/recipients-input";
import { LogStream } from "@/components/log-stream";
import { streamEmails } from "@/lib/api";
import type { LogEntry } from "@/types";

const AWS_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "eu-central-1", label: "Europe (Frankfurt)" },
  { value: "sa-east-1", label: "South America (São Paulo)" },
];

interface FormState {
  accessKey: string;
  secretKey: string;
  region: string;
  sender: string;
  recipients: string[];
  subject: string;
  htmlBody: string;
  textBody: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validateForm(state: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!state.accessKey.trim()) errors.accessKey = "AWS Access Key is required";
  if (!state.secretKey.trim()) errors.secretKey = "AWS Secret Key is required";
  if (!state.region) errors.region = "Region is required";
  if (!state.sender.trim()) errors.sender = "Sender email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.sender))
    errors.sender = "Enter a valid sender email";
  if (state.recipients.length === 0)
    errors.recipients = "Add at least one recipient";
  if (!state.subject.trim()) errors.subject = "Subject is required";
  if (!state.htmlBody.trim()) errors.htmlBody = "Email body (HTML) is required";
  return errors;
}

export function EmailForm() {
  const [form, setForm] = React.useState<FormState>({
    accessKey: "",
    secretKey: "",
    region: "ap-south-1",
    sender: "",
    recipients: [],
    subject: "",
    htmlBody: "",
    textBody: "",
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [showSecret, setShowSecret] = React.useState(false);
  const [credentialsOpen, setCredentialsOpen] = React.useState(true);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [submitError, setSubmitError] = React.useState("");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLogs([]);
    setSubmitError("");
    setIsStreaming(true);

    try {
      for await (const entry of streamEmails({
        access_key: form.accessKey,
        secret_key: form.secretKey,
        region: form.region,
        sender: form.sender,
        recipients: form.recipients,
        subject: form.subject,
        html_body: form.htmlBody,
        text_body: form.textBody || form.htmlBody.replace(/<[^>]+>/g, ""),
        stream: true,
      })) {
        setLogs((prev) => [...prev, entry]);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* AWS Credentials */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none pb-4"
          onClick={() => setCredentialsOpen((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">AWS Credentials</CardTitle>
              <CardDescription>
                Your credentials are used only for this request and never stored.
              </CardDescription>
            </div>
            {credentialsOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        {credentialsOpen && (
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Access Key */}
            <div className="space-y-1.5">
              <Label htmlFor="access-key">Access Key ID</Label>
              <Input
                id="access-key"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={form.accessKey}
                onChange={(e) => set("accessKey", e.target.value)}
                disabled={isStreaming}
                autoComplete="off"
                spellCheck={false}
                className={errors.accessKey ? "border-destructive" : ""}
              />
              {errors.accessKey && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.accessKey}
                </p>
              )}
            </div>

            {/* Secret Key */}
            <div className="space-y-1.5">
              <Label htmlFor="secret-key">Secret Access Key</Label>
              <div className="relative">
                <Input
                  id="secret-key"
                  type={showSecret ? "text" : "password"}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={form.secretKey}
                  onChange={(e) => set("secretKey", e.target.value)}
                  disabled={isStreaming}
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(
                    "pr-10",
                    errors.secretKey ? "border-destructive" : ""
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showSecret ? "Hide secret key" : "Show secret key"}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.secretKey && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.secretKey}
                </p>
              )}
            </div>

            {/* Region */}
            <div className="space-y-1.5">
              <Label htmlFor="region">Region</Label>
              <Select
                value={form.region}
                onValueChange={(v) => set("region", v)}
                disabled={isStreaming}
              >
                <SelectTrigger
                  id="region"
                  className={errors.region ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {AWS_REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.region}
                </p>
              )}
            </div>

            {/* Sender */}
            <div className="space-y-1.5">
              <Label htmlFor="sender">Sender Email</Label>
              <Input
                id="sender"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={form.sender}
                onChange={(e) => set("sender", e.target.value)}
                disabled={isStreaming}
                className={errors.sender ? "border-destructive" : ""}
              />
              {errors.sender && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.sender}
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Email Content */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Email Content</CardTitle>
          <CardDescription>
            Compose your message below. HTML body is required; text body is
            optional and used as a fallback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Your email subject"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              disabled={isStreaming}
              className={errors.subject ? "border-destructive" : ""}
            />
            {errors.subject && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.subject}
              </p>
            )}
          </div>

          {/* Recipients */}
          <div className="space-y-1.5">
            <Label>Recipients</Label>
            <RecipientsInput
              value={form.recipients}
              onChange={(v) => set("recipients", v)}
              disabled={isStreaming}
            />
            {errors.recipients && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.recipients}
              </p>
            )}
          </div>

          <Separator />

          {/* HTML Body */}
          <div className="space-y-1.5">
            <Label htmlFor="html-body">HTML Body</Label>
            <Textarea
              id="html-body"
              placeholder="<p>Hello {{name}},</p>"
              value={form.htmlBody}
              onChange={(e) => set("htmlBody", e.target.value)}
              disabled={isStreaming}
              rows={8}
              className={cn(
                "font-mono text-xs",
                errors.htmlBody ? "border-destructive" : ""
              )}
            />
            {errors.htmlBody && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.htmlBody}
              </p>
            )}
          </div>

          {/* Text Body */}
          <div className="space-y-1.5">
            <Label htmlFor="text-body">
              Plain Text Body{" "}
              <span className="text-muted-foreground font-normal">
                (optional — auto-generated if empty)
              </span>
            </Label>
            <Textarea
              id="text-body"
              placeholder="Hello, this is the plain text version..."
              value={form.textBody}
              onChange={(e) => set("textBody", e.target.value)}
              disabled={isStreaming}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {submitError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isStreaming} className="w-full sm:w-auto gap-2">
        <Send className="h-4 w-4" />
        {isStreaming ? "Sending…" : `Send to ${form.recipients.length || "—"} recipient${form.recipients.length !== 1 ? "s" : ""}`}
      </Button>

      {/* Log Stream */}
      <LogStream logs={logs} isStreaming={isStreaming} />
    </form>
  );
}
