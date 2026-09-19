# Reference projects — quick context

This directory contains cloned/reference repositories, not the active dashboard. Do not scan it for ordinary `ai_radar` work.

## Known projects

- `internet-radar-reference/`: Python/Streamlit Internet Radar reference implementation; read its `README.md` and `pyproject.toml` for scoped work.
- `rsshub/`: TypeScript/Cloudflare Workers RSSHub source; has its own `AGENTS.md`.
- `n8n/`: large TypeScript monorepo; has its own `CLAUDE.md` and `AGENTS.md`.
- `folo/`: TypeScript monorepo; has its own `AGENTS.md`.
- `freshrss/`, `changedetection/`, `huginn/`: upstream reference applications.

## Rules

- Work in a named child repository only when the user explicitly requests it or the task clearly targets it.
- Always read that repository's nearest `CLAUDE.md`/`AGENTS.md` first; those instructions override this index.
- Prefer targeted search inside the named repository. Avoid whole-directory inventory commands because this tree is large.
- Treat upstream code as reference unless a change is explicitly requested.

