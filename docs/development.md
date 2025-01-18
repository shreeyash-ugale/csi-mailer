# Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| [Bun](https://bun.sh) | ≥ 1.0 | `curl -fsSL https://bun.sh/install \| bash` |
| [Go](https://go.dev/dl/) | ≥ 1.22 | Download from go.dev |
| [Node.js](https://nodejs.org) | ≥ 20 | Required by some tooling |
| [Air](https://github.com/air-verse/air) | latest | `go install github.com/air-verse/air@latest` |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/csivitu/csi-mailer.git
cd csi-mailer

# 2. Install dependencies
bun install

# 3. Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL
```

### Environment Variables

Create `apps/web/.env.local`:

```env
# Lambda Function URL from Terraform output (or a local mock)
NEXT_PUBLIC_API_URL=https://your-lambda-url.lambda-url.ap-south-1.on.aws
```

---

## Running the Frontend

```bash
# From repo root (runs all apps in parallel)
bun run dev

# Or from the web app directly
cd apps/web
bun run dev
```

Frontend runs at [http://localhost:3000](http://localhost:3000)

---

## Running the Backend (Hot Reload)

The backend uses [Air](https://github.com/air-verse/air) for hot reload in development.

```bash
cd apps/backend
air
```

> **Note:** The Lambda handler uses `APIGatewayProxyRequest` and cannot be invoked directly with `go run`. For local testing, use the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) or test against the deployed Lambda.

---

## Project Scripts

From the repo root:

| Script | Description |
|--------|-------------|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all apps for production |
| `bun run lint` | Lint all TypeScript files |
| `bun run format` | Format all files with Prettier |
| `bun run deploy` | Build + deploy backend via Terraform |
| `bun run plan` | Run Terraform plan (preview infra changes) |
| `bun run down` | Tear down Terraform infrastructure |

---

## Frontend Development

### Adding shadcn/ui Components

The project uses shadcn/ui with the Zinc theme. To add a new component:

```bash
cd apps/web
bunx shadcn@latest add <component-name>
```

Components are added to `src/components/ui/`.

### Linting & Formatting

```bash
# Lint
cd apps/web && bun run lint

# Format entire repo
bun run format
```

### TypeScript

The project uses strict TypeScript. Types shared between the frontend and backend logic live in `apps/web/src/types/index.ts` and mirror the Go struct definitions in `apps/backend/pkg/models/models.go`.

---

## Backend Development

### Project Structure

```
apps/backend/
├── main.go              # Lambda handler entry point
└── pkg/
    ├── helpers/
    │   ├── logs.go      # WriteLog helper (NDJSON writer)
    │   └── session.go   # AWS session initialisation
    └── models/
        └── models.go    # Request/Response types
```

### Running Tests

```bash
cd apps/backend
go test ./...
```

### Building

```bash
# Local binary
go build -o backend .

# Lambda binary (linux arm64)
GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o build/bootstrap .
```

---

## Troubleshooting

### `NEXT_PUBLIC_API_URL` not set

The frontend reports a configuration error when the API URL is missing. Copy `apps/web/.env.example` to `apps/web/.env.local` and set the Lambda Function URL before running `bun run dev`.

### CORS errors in browser

The Lambda Function URL `allow_origins` must include your local dev origin (`http://localhost:3000`) or be set to `"*"` for development. Update `apps/terraform/main.tf` and re-apply.

### Module not found errors

Run `bun install` from the repo root to ensure all workspace dependencies are installed.
