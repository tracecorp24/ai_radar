# Savvy — quick context

Read this file first. Do not recursively scan the workspace unless the task requires it.

## Scope

- `savvy/`: active product, a Next.js + React + TypeScript dashboard.
- `copt-open-source-projects/`: reference and upstream projects; touch only when the task explicitly names one.
- `run.bat`: launches `savvy/run.bat`.

## Working rules

- Prefer the smallest relevant subtree and inspect targeted files with `rg`.
- Preserve existing user changes; do not reset or mass-reformat unrelated files.
- Keep secrets and local state out of commits (`.env`, databases, caches, `node_modules`).
- Before editing, read the nearest `CLAUDE.md`/`AGENTS.md` in the target subtree.
- After code changes in `savvy`, run the narrowest useful check; use `npm run build` for broad validation when practical.

## Navigation

- UI routes: `savvy/src/app/`
- Reusable UI: `savvy/src/components/`
- Domain services/adapters: `savvy/src/lib/services/`, `savvy/src/lib/adapters/`
- Types/schemas/constants: `savvy/src/types/`, `savvy/src/lib/schemas/`, `savvy/src/lib/constants.ts`
- Mock data: `savvy/src/data/`
- App-specific details: `savvy/CLAUDE.md`
- Reference-repo details: `copt-open-source-projects/CLAUDE.md`

## Common commands

```powershell
cd savvy
npm install --legacy-peer-deps
npm run dev
npm run build
```

## AI task completion protocol

Every AI task that changes the product must finish with this protocol:

1. Classify the change using Semantic Versioning: `patch` for fixes and performance improvements, `minor` for backward-compatible features, and `major` for breaking changes or incompatible data/API contracts.
2. Update the version in `savvy/package.json` and keep `savvy/package-lock.json` in sync. Never invent a version outside SemVer.
3. Run the narrowest relevant checks. For `savvy` code changes, run `npm run lint` and `npx tsc --noEmit`; run `npm run build` for route, configuration, dependency, or broad UI changes.
4. Review the diff for unrelated edits, secrets, generated output, accessibility regressions, responsive layout issues, and broken Turkish/UTF-8 text.
5. Report the completed version, files changed, validation commands and results, and any remaining risks to the user.

For documentation-only, comment-only, or inspection-only tasks, do not bump the product version; still report that no release was required. A release version must not be claimed unless the version files and required checks have been updated successfully.
