# Deployment Guide

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- [Go](https://go.dev) ≥ 1.22
- [Terraform](https://www.terraform.io) ≥ 1.5
- AWS account with SES enabled
- AWS IAM user with the permissions listed below
- [Vercel account](https://vercel.com) (free tier is sufficient)

---

## 1. Backend — AWS Lambda via Terraform

### IAM Permissions Required

The IAM user running Terraform needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PutRolePolicy",
        "iam:GetRole",
        "iam:PassRole",
        "ses:SendEmail",
        "ses:SendRawEmail",
        "logs:*",
        "apigateway:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Build the Go Binary

```bash
cd apps/backend

# Linux ARM64 (Lambda arm64 runtime)
GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o build/bootstrap .
```

> **Note:** The binary must be named `bootstrap` for the `provided.al2023` runtime.

### Deploy with Terraform

```bash
cd apps/terraform

# Initialise providers
terraform init

# Preview changes
terraform plan

# Apply
terraform apply
```

After a successful apply, Terraform outputs the Lambda Function URL:

```
api_gateway_url = "https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/send-email"
```

Copy this URL — you'll need it for the frontend.

### Automated Deploy (Turborepo)

From the repo root:

```bash
bun run deploy
```

This runs `turbo run infra:up`, which builds the binary and applies Terraform in order.

---

## 2. Frontend — Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel  # or bun add -g vercel
cd apps/web
vercel --prod
```

Set the environment variable when prompted:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | Your Lambda Function URL |

### Option B: Vercel Dashboard (recommended)

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the `csi-mailer` repository
4. Set **Root Directory** to `apps/web`
5. Add environment variable `NEXT_PUBLIC_API_URL` → Lambda Function URL
6. Click **Deploy**

> **Note:** The `vercel.json` at the repo root pre-configures the build command and output directory.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Lambda Function URL (from Terraform output) |

---

## 3. CORS Configuration

The Lambda Function URL is configured with:

```hcl
cors {
  allow_origins = ["*"]
  allow_methods = ["POST"]
}
```

For production, replace `"*"` in `apps/terraform/main.tf` with your Vercel deployment URL to restrict access.

---

## Updating the Backend

To redeploy after code changes:

```bash
# Rebuild binary
cd apps/backend
GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o build/bootstrap .

# Redeploy
cd ../terraform
terraform apply
```

## Updating the Frontend

Vercel automatically redeploys on every push to the main branch (if connected via GitHub).
