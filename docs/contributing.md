# Contributing

Thank you for considering contributing to CSI Mailer! This document outlines the process for contributing to this project.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. Set up the development environment — see [development.md](development.md)
4. Create a **feature branch** from `main`

---

## Branch Naming

Use the following conventions:

| Prefix | Usage |
|--------|-------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `chore/` | Build, tooling, config changes |
| `refactor/` | Code restructuring without feature changes |

**Examples:**
```
feat/csv-recipient-import
fix/log-stream-autoscroll
docs/update-api-reference
```

---

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`

**Examples:**
```
feat(web): add CSV import for recipients
fix(backend): handle empty text_body gracefully
docs: update deployment guide for arm64
chore(deps): bump tailwindcss to 3.4.17
```

---

## Pull Requests

1. Ensure your branch is up to date with `main`
2. Run lint and type checks:
   ```bash
   cd apps/web && bun run lint
   ```
3. Test your changes locally
4. Open a PR against `main` with:
   - A clear **title** following commit conventions
   - A **description** explaining what changed and why
   - Screenshots for any UI changes

---

## Code Style

### TypeScript / React

- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript strict types — avoid `any`
- Co-locate component state with the component that owns it
- Keep components small and focused

### Go

- Follow standard Go formatting (`gofmt`)
- Error messages should be lowercase and not end with punctuation
- Use the existing `helpers.WriteLog` pattern for log entries

### CSS / Tailwind

- Use shadcn/ui components when possible
- Prefer Tailwind utility classes over custom CSS
- Use the design token CSS variables (`--background`, `--foreground`, etc.) rather than raw colours

---

## Reporting Issues

Please use [GitHub Issues](https://github.com/csivitu/csi-mailer/issues) with the appropriate label:

- `bug` — Something isn't working
- `enhancement` — New feature request
- `documentation` — Docs improvements
- `question` — General questions

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this standard.
