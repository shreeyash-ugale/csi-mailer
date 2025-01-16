# API Reference

## Endpoint

```
POST {LAMBDA_FUNCTION_URL}
Content-Type: application/json
```

The Lambda Function URL is provisioned by Terraform. Set it as `NEXT_PUBLIC_API_URL` in the frontend environment.

---

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `access_key` | `string` | ✅ | AWS IAM Access Key ID |
| `secret_key` | `string` | ✅ | AWS IAM Secret Access Key |
| `region` | `string` | ✅ | AWS region (e.g. `ap-south-1`) |
| `sender` | `string` | ✅ | Verified SES sender email address |
| `recipients` | `string[]` | ✅ | Array of recipient email addresses |
| `subject` | `string` | ✅ | Email subject line |
| `html_body` | `string` | ✅ | HTML content of the email |
| `text_body` | `string` | ❌ | Plain text fallback (auto-stripped from HTML if omitted) |
| `stream` | `boolean` | ❌ | `true` for real-time per-recipient logs (default: `false`) |

### Example

```json
{
  "access_key": "AKIAIOSFODNN7EXAMPLE",
  "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "ap-south-1",
  "sender": "noreply@yourdomain.com",
  "recipients": ["alice@example.com", "bob@example.com"],
  "subject": "Welcome to CSI VIT!",
  "html_body": "<h1>Hello!</h1><p>Welcome to our community.</p>",
  "text_body": "Hello! Welcome to our community.",
  "stream": true
}
```

---

## Response

The response is always a streaming HTTP body (`Content-Type: application/json`, streamed via Lambda Function URL `RESPONSE_STREAM` mode).

### Response Format — NDJSON

Each line is a complete JSON object (`LogEntry`):

```ts
interface LogEntry {
  timestamp: string        // ISO 8601 (e.g. "2025-01-10T10:00:01Z")
  message: string          // Human-readable log message
  status: "info" | "success" | "error"
  email?: {                // Present when status relates to a specific recipient
    recipient: string
    success: boolean
  }
}
```

### Example Stream (`stream: true`)

```ndjson
{"timestamp":"2025-01-10T10:00:01Z","message":"Creating AWS session...","status":"info"}
{"timestamp":"2025-01-10T10:00:01Z","message":"AWS session created successfully","status":"success"}
{"timestamp":"2025-01-10T10:00:02Z","message":"email sent successfully to alice@example.com","status":"success","email":{"recipient":"alice@example.com","success":true}}
{"timestamp":"2025-01-10T10:00:03Z","message":"Failed to send email to bob@example.com: ...","status":"error","email":{"recipient":"bob@example.com","success":false}}
{"timestamp":"2025-01-10T10:00:03Z","message":"All emails processed","status":"info"}
```

### Example Stream (`stream: false`)

Sends all recipients in a single SES API call. Only a single log entry is written on completion or error.

---

## Error Responses

Error entries are written as NDJSON with `"status": "error"`:

| Scenario | Message |
|----------|---------|
| Invalid request body | `"Invalid request body"` |
| Missing credentials | `"AWS credentials are missing in the request body"` |
| AWS session failure | `"Failed to create AWS session: ..."` |
| SES rejection | `"MessageRejected: ..."` |
| Unverified domain | `"MailFromDomainNotVerified: ..."` |

HTTP status `400` is returned for malformed JSON. Streaming errors return HTTP `200` with an error log entry in the body.

---

## curl Examples

### Streaming send

```bash
curl -X POST "$LAMBDA_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "access_key": "YOUR_ACCESS_KEY",
    "secret_key": "YOUR_SECRET_KEY",
    "region": "ap-south-1",
    "sender": "noreply@yourdomain.com",
    "recipients": ["user@example.com"],
    "subject": "Test",
    "html_body": "<p>Hello!</p>",
    "stream": true
  }'
```

### Batch send (no streaming)

```bash
curl -X POST "$LAMBDA_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "access_key": "YOUR_ACCESS_KEY",
    "secret_key": "YOUR_SECRET_KEY",
    "region": "ap-south-1",
    "sender": "noreply@yourdomain.com",
    "recipients": ["a@example.com", "b@example.com"],
    "subject": "Announcement",
    "html_body": "<p>Hi everyone!</p>",
    "stream": false
  }'
```

---

## SES Prerequisites

Before sending emails:

1. Verify your sender domain or email in [AWS SES Console](https://console.aws.amazon.com/ses/)
2. If your account is in SES **sandbox mode**, recipient addresses must also be verified
3. Request **production access** to remove sandbox restrictions
4. IAM user must have `ses:SendEmail` and `ses:SendRawEmail` permissions
