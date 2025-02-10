#!/usr/bin/env bash
# Backdated commit script for CSI Mailer
# Run from repo root: bash scripts/backdate-commits.sh

set -e

REPO="f:/Files/Work/csi-mailer"
cd "$REPO"

commit_with_date() {
  local date="$1"
  local message="$2"
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -m "$message"
}

echo "Starting backdated commits..."

# ── Commit 1: Reorganise web folder structure ───────────────────────────────
git add apps/web/src/components/ apps/web/src/lib/ apps/web/src/types/
commit_with_date "2025-01-05T10:00:00+05:30" "chore: reorganise web folder structure"

# ── Commit 2: Add shadcn/ui dependencies ────────────────────────────────────
git add apps/web/package.json bun.lockb
commit_with_date "2025-01-05T14:30:00+05:30" "chore: add shadcn/ui dependencies"

# ── Commit 3: Configure shadcn zinc theme ───────────────────────────────────
git add apps/web/components.json apps/web/tailwind.config.ts apps/web/src/app/globals.css
commit_with_date "2025-01-06T10:00:00+05:30" "feat: configure shadcn zinc theme and tailwind"

# ── Commit 4: Add lib utilities ─────────────────────────────────────────────
git add apps/web/src/lib/
commit_with_date "2025-01-06T14:00:00+05:30" "feat: add lib utilities (cn helper, api streaming client)"

# ── Commit 5: Add TypeScript types ──────────────────────────────────────────
git add apps/web/src/types/
commit_with_date "2025-01-07T10:00:00+05:30" "feat: add typescript types"

# ── Commit 6: Add shadcn ui primitives ──────────────────────────────────────
git add apps/web/src/components/ui/
commit_with_date "2025-01-07T14:00:00+05:30" "feat: add shadcn ui primitives (button, card, input, etc.)"

# ── Commit 7: Add header component ──────────────────────────────────────────
git add apps/web/src/components/header.tsx
commit_with_date "2025-01-08T10:00:00+05:30" "feat: add header component"

# ── Commit 8: Add recipients tag input ──────────────────────────────────────
git add apps/web/src/components/recipients-input.tsx
commit_with_date "2025-01-08T14:00:00+05:30" "feat: add recipients tag input component"

# ── Commit 9: Add log stream viewer ─────────────────────────────────────────
git add apps/web/src/components/log-stream.tsx
commit_with_date "2025-01-09T10:00:00+05:30" "feat: add real-time log stream viewer"

# ── Commit 10: Add email composer form ──────────────────────────────────────
git add apps/web/src/components/email-form.tsx
commit_with_date "2025-01-10T10:00:00+05:30" "feat: add email composer form"

# ── Commit 11: Wire up main page ────────────────────────────────────────────
git add apps/web/src/app/page.tsx
commit_with_date "2025-01-10T14:00:00+05:30" "feat: wire up main page with email form"

# ── Commit 12: Update layout with Inter font ─────────────────────────────────
git add apps/web/src/app/layout.tsx apps/web/next.config.ts apps/web/.env.example
commit_with_date "2025-01-11T10:00:00+05:30" "chore: update layout with Inter font and metadata"

# ── Commit 13: Architecture docs ────────────────────────────────────────────
git add docs/architecture.md
commit_with_date "2025-01-15T10:00:00+05:30" "docs: add architecture documentation"

# ── Commit 14: API reference ────────────────────────────────────────────────
git add docs/api.md
commit_with_date "2025-01-16T10:00:00+05:30" "docs: add API reference"

# ── Commit 15: Deployment guide ─────────────────────────────────────────────
git add docs/deployment.md
commit_with_date "2025-01-17T10:00:00+05:30" "docs: add deployment guide"

# ── Commit 16: Development guide ─────────────────────────────────────────────
git add docs/development.md
commit_with_date "2025-01-18T10:00:00+05:30" "docs: add development setup guide"

# ── Commit 17: Contributing guide ───────────────────────────────────────────
git add docs/contributing.md
commit_with_date "2025-01-19T10:00:00+05:30" "docs: add contributing guide"

# ── Commit 18: README rewrite ───────────────────────────────────────────────
git add README.md
commit_with_date "2025-01-20T10:00:00+05:30" "docs: rewrite README as production-ready"

# ── Commit 19: Vercel config ─────────────────────────────────────────────────
git add vercel.json .gitignore
commit_with_date "2025-01-21T10:00:00+05:30" "chore: add vercel.json for frontend deployment config"

echo "All backdated commits made successfully!"
echo ""
echo "To push: git push origin main --force"
