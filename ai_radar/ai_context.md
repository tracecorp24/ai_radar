# AI Radar Context - Quick Reference

This document provides essential context for AI operations to minimize token consumption.

## Project Overview
- **Name**: AI Radar
- **Type**: Next.js 15 + React 19 dashboard application
- **Purpose**: Trend analysis, source tracking, model management, and research organization

## Key Directories
- `src/app/`: Main application routes and pages
- `src/components/`: Reusable UI components
- `src/lib/services/`: Data access and business logic
- `src/lib/adapters/`: External API integrations
- `src/types/`: TypeScript type definitions
- `src/data/`: Mock and fallback data

## Common Tasks
1. **Data Fetching**: Use services in `src/lib/services/`
2. **UI Components**: Check `src/components/` before creating new ones
3. **Type Safety**: Always update `src/types/index.ts` when changing data shapes
4. **Validation**: Run `npm run lint` and `npx tsc --noEmit` after changes

## Performance Tips
- Prefer existing components and utilities
- Keep route pages thin
- Use shared helpers from `src/lib/services/shared.ts`
- Preserve responsive behavior and dark mode support

## Validation Commands
```bash
npm run lint
npm run build
```

## Important Notes
- Turkish language support is required
- Dark mode must be preserved
- No API keys in commits
- Keep `.next/` and `node_modules/` out of version control
