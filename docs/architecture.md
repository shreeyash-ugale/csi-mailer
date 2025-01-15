# Architecture

## Overview

CSI Mailer is a monorepo bulk email sending service. The system is split into two independently deployed services:

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) | Vercel |
| Backend | Go AWS Lambda | AWS (via Terraform) |

---

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                   User (Browser)                     │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS POST
                        ▼
┌─────────────────────────────────────────────────────┐
│              Vercel — Next.js Frontend               │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  EmailForm  →  streamEmails()  →  LogStream  │    │
│  └─────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────┘
                        │ Streaming HTTPS POST
                        │ (fetch ReadableStream)
                        ▼
┌─────────────────────────────────────────────────────┐
│          AWS Lambda Function URL (streaming)         │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  handler()  →  SendEmailWithLogs()           │    │
│  │  Writes NDJSON log entries to io.PipeWriter  │    │
│  └─────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────┘
                        │ SMTP via AWS SDK
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Amazon SES                         │
│            Sends one email per recipient             │
└─────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
csi-mailer/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── backend/      # Go Lambda function
│   └── terraform/    # AWS infrastructure as code
├── docs/             # Documentation
├── vercel.json       # Vercel deployment config
├── turbo.json        # Turborepo task graph
└── package.json      # Root workspace (Bun)
```

---

## Frontend Architecture (`apps/web`)

Built with Next.js 15 App Router and shadcn/ui (Zinc theme).

### Component Tree

```
page.tsx
├── Header
└── EmailForm
    ├── Card (AWS Credentials)
    │   ├── Input (Access Key)
    │   ├── Input (Secret Key, password toggle)
    │   ├── Select (Region)
    │   └── Input (Sender Email)
    ├── Card (Email Content)
    │   ├── Input (Subject)
    │   ├── RecipientsInput (tag-based multi-email)
    │   ├── Textarea (HTML Body)
    │   └── Textarea (Text Body, optional)
    └── LogStream (NDJSON stream viewer)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Streaming fetch client — reads NDJSON line by line using `ReadableStream` |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/types/index.ts` | Shared TypeScript types (mirrors Go models) |
| `src/components/email-form.tsx` | Main form with validation and stream handling |
| `src/components/log-stream.tsx` | Real-time delivery log viewer |
| `src/components/recipients-input.tsx` | Tag-style multi-email input with validation |

---

## Backend Architecture (`apps/backend`)

A Go binary compiled for `linux/arm64` and deployed as an AWS Lambda function.

### Request Flow

1. Lambda receives `APIGatewayProxyRequest`
2. Body is unmarshalled into `models.RequestBody`
3. If `stream: true` → `SendEmailWithLogs()` — iterates recipients individually, writing a `LogEntry` NDJSON line after each send
4. If `stream: false` → `SendEmail()` — sends all recipients in one SES call (batch)
5. Response body is a `LambdaFunctionURLStreamingResponse` backed by an `io.Pipe`

### Key Models

```go
type RequestBody struct {
    AccessKey  string    `json:"access_key"`
    SecretKey  string    `json:"secret_key"`
    Region     string    `json:"region"`
    Sender     string    `json:"sender"`
    Recipients []*string `json:"recipients"`
    Subject    string    `json:"subject"`
    HtmlBody   string    `json:"html_body"`
    TextBody   string    `json:"text_body"`
    Stream     bool      `json:"stream"`
}

type LogEntry struct {
    Timestamp string       `json:"timestamp"`
    Message   string       `json:"message"`
    Status    string       `json:"status"`  // "info" | "success" | "error"
    Email     *EmailStatus `json:"email,omitempty"`
}
```

---

## Infrastructure (`apps/terraform`)

| Resource | Type | Purpose |
|----------|------|---------|
| `aws_lambda_function` | `provided.al2023` | Runs the Go binary |
| `aws_lambda_function_url` | RESPONSE_STREAM | Exposes Lambda with streaming support |
| `aws_iam_role` | Lambda execution role | Grants SES send permissions |
| `aws_api_gateway_rest_api` | REST API | Alternative HTTP endpoint |

The Lambda Function URL is the primary endpoint (streaming support). API Gateway is included for future extensibility.

---

## Streaming Protocol

The backend streams NDJSON — one JSON object per line:

```
{"timestamp":"2025-01-10T10:00:01Z","message":"Creating AWS session...","status":"info"}
{"timestamp":"2025-01-10T10:00:02Z","message":"AWS session created successfully","status":"success"}
{"timestamp":"2025-01-10T10:00:03Z","message":"email sent successfully to user@example.com","status":"success","email":{"recipient":"user@example.com","success":true}}
{"timestamp":"2025-01-10T10:00:04Z","message":"All emails processed","status":"info"}
```

The frontend reads this via the Fetch API's `ReadableStream`, splitting on `\n` and parsing each line as JSON.
