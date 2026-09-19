# savvy — quick context

This is the active application. Read this file before scanning `src/`.

## Stack

- Next.js `15`, React `19`, TypeScript strict mode, Tailwind CSS.
- App Router under `src/app/`; alias `@/*` maps to `src/*`.
- UI uses Radix primitives, `lucide-react`, Framer Motion, and Recharts.
- Package scripts: `dev`, `build`, `start`, `lint` (see `package.json`).

## Layout

- `src/app/page.tsx`: dashboard home.
- `src/app/{trends,sources,models,people,research,bookmarks,settings}/`: main routes.
- `src/app/content/[id]`, `models/[id]`, `people/[id]`: detail routes.
- `src/components/layout/`: shell/header/navigation.
- `src/components/{shared,content,models,people,research,sources,trends,bookmarks,settings}/`: feature components.
- `src/lib/services/`: domain data access and orchestration.
- `src/lib/adapters/`: external/source adapters; `src/lib/services/shared.ts` contains shared helpers.
- `src/data/`: local mock/fallback data.
- `src/types/index.ts`, `src/lib/schemas/index.ts`: shared contracts and validation.
- `src/app/globals.css`, `tailwind.config.ts`: visual system.

## Change guidance

- Prefer existing shared components and utilities before adding new ones.
- Keep route pages thin; put reusable/domain logic in components or `src/lib`.
- Preserve the current visual language, responsive behavior, dark mode, and Turkish/user-facing copy unless asked otherwise.
- When changing a data shape, update types, mock data, services, and every consuming page/component.
- Do not add real API keys or commit generated `.next/`/`node_modules/` output.

## Validation

```powershell
npm run lint
npm run build
```

If dependencies are missing, run `npm install --legacy-peer-deps` first. For a focused change, inspect and validate only the affected route/component.

## AI task completion and release protocol

After every AI task affecting this application:

- Apply SemVer: `patch` for bug fixes, UI corrections, refactors, and performance work; `minor` for backward-compatible features; `major` for breaking changes, migrations, or incompatible contracts.
- Update both `package.json` and `package-lock.json` to the selected version. Keep the lockfile package version identical to the application version.
- Run `npm run lint` and `npx tsc --noEmit`. Run `npm run build` whenever routes, configuration, dependencies, or broad UI behavior change.
- Check responsive layouts, dark mode, accessibility labels, Turkish UTF-8 copy, and that no `.next/`, `node_modules/`, secrets, or unrelated files are included in the change.
- Before handoff, report the version bump, change summary, validation results, and known limitations.

Documentation-only or read-only tasks do not require a version bump, but must explicitly state that no release was created.
