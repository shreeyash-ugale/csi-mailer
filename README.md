<div align="center">

# CSI Mailer

**Production-ready bulk email sending via AWS SES**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go&logoColor=white)](https://go.dev)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/lambda/)
[![AWS SES](https://img.shields.io/badge/AWS-SES-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/ses/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?logo=terraform&logoColor=white)](https://www.terraform.io)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend-black?logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-zinc.svg)](LICENSE)

[Documentation](docs/) · [API Reference](docs/api.md) · [Deployment Guide](docs/deployment.md) · [Contributing](docs/contributing.md)

</div>

---

## Overview

CSI Mailer is an open-source bulk email sending service that lets you send personalised HTML emails to hundreds of recipients using your own AWS SES credentials — with real-time per-recipient delivery logs streamed directly to the browser.

**Key features:**

- **Bulk sending** — Send to any number of recipients in one submission
- **Real-time logs** — Watch email delivery happen live with per-recipient status updates
- **Credential-safe** — AWS keys are used only for the request and never stored
- **Clean UI** — Minimal, production-ready interface with shadcn/ui
- **Multi-region** — Select any AWS SES region
- **Tag input** — Paste or type multiple email addresses with validation
- **Serverless** — Zero-cost at rest; pay only per email sent

## Demo

The web interface guides users through the complete sending workflow:

1. Enter AWS SES credentials and select a region.
2. Add and validate multiple recipients with the tag input.
3. Compose an HTML email with an optional plain-text body.
4. Submit the message and monitor per-recipient delivery logs in real time.

Run the frontend locally with `bun run dev` and open [http://localhost:3000](http://localhost:3000) to try the workflow.

---

## Architecture

```
┌───────────────────────────────┐         ┌───────────────────────────────┐
│        Vercel (Frontend)       │         │        AWS (Backend)           │
│                               │         │                               │
│   Next.js 15 · shadcn/ui     │──POST──▶│  Lambda Function URL          │
│   Inter font · Zinc theme     │◀──NDJSON│  Go · AWS SDK · SES          │
└───────────────────────────────┘ stream  └───────────────────────────────┘
                                                          │
                                                          ▼
                                               Amazon SES → Recipients
```

The backend is a **Go AWS Lambda function** with streaming response support — it sends emails one-by-one and streams a JSON log entry per recipient back to the frontend. The frontend is a **Next.js app** deployed on Vercel that reads the stream with the Fetch API.

For full architecture details, see [docs/architecture.md](docs/architecture.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | [Next.js 15](https://nextjs.org) (App Router) |
| UI components | [shadcn/ui](https://ui.shadcn.com) (Zinc theme) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Backend runtime | [Go 1.22](https://go.dev) |
| Cloud function | [AWS Lambda](https://aws.amazon.com/lambda/) (`provided.al2023`, arm64) |
| Email delivery | [Amazon SES](https://aws.amazon.com/ses/) |
| Infrastructure | [Terraform](https://www.terraform.io) |
| Monorepo tooling | [Turborepo](https://turbo.build) + [Bun](https://bun.sh) |
| Frontend hosting | [Vercel](https://vercel.com) |

---

## Quickstart

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Go](https://go.dev) ≥ 1.22
- AWS account with SES enabled
- [Terraform](https://www.terraform.io) ≥ 1.5 (for backend deployment)

### 1. Clone & Install

```bash
git clone https://github.com/csivitu/csi-mailer.git
cd csi-mailer
bun install
```

### 2. Configure Environment

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-lambda-url.lambda-url.ap-south-1.on.aws
```

### 3. Run Locally

```bash
bun run dev
```

Frontend available at [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Backend (AWS Lambda)

```bash
# Build Go binary for Lambda
cd apps/backend
GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o build/bootstrap .

# Deploy infrastructure
cd ../terraform
terraform init && terraform apply
```

### Frontend (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/csivitu/csi-mailer&env=NEXT_PUBLIC_API_URL&envDescription=Lambda%20Function%20URL%20from%20Terraform%20output&root-directory=apps/web)

Or deploy manually — see [docs/deployment.md](docs/deployment.md).

---

## Usage

1. **Enter AWS Credentials** — Provide your Access Key, Secret Key, and select the SES region
2. **Set the Sender** — Use a verified SES sender address
3. **Add Recipients** — Type or paste email addresses (comma/newline-separated)
4. **Compose your Email** — Write the subject and HTML body
5. **Send** — Watch per-recipient delivery logs stream in real time

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design, component tree, streaming protocol |
| [API Reference](docs/api.md) | Request/response schema, curl examples, error codes |
| [Deployment](docs/deployment.md) | Backend (Terraform) and frontend (Vercel) deployment |
| [Development](docs/development.md) | Local setup, project scripts, troubleshooting |
| [Contributing](docs/contributing.md) | Branch naming, commit conventions, PR process |

---

## Project Structure

```
csi-mailer/
├── apps/
│   ├── web/              # Next.js frontend (Vercel)
│   │   └── src/
│   │       ├── app/      # Next.js App Router
│   │       ├── components/
│   │       │   └── ui/   # shadcn/ui primitives
│   │       ├── lib/      # Utilities & API client
│   │       └── types/    # TypeScript types
│   ├── backend/          # Go Lambda function
│   │   ├── main.go
│   │   └── pkg/
│   │       ├── helpers/  # Log writer, AWS session
│   │       └── models/   # Request/response types
│   └── terraform/        # AWS infrastructure
│       └── main.tf
├── docs/                 # Documentation
├── vercel.json           # Vercel deployment config
├── turbo.json            # Turborepo task graph
└── package.json          # Root workspace
```

---

## Contributing

Contributions are welcome! Please read [docs/contributing.md](docs/contributing.md) before opening a PR.

---

## License

MIT © [CSI VIT](https://csivit.com)
