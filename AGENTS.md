# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React/TypeScript app for merging and previewing Garmin FIT files. Core app code lives in `src/`: `src/App.tsx` is the main UI, feature components are in `src/components/`, shadcn-style primitives are in `src/components/ui/`, FIT parsing and merge logic are in `src/lib/`, hooks are in `src/hooks/`, and shared styling is in `src/styles/` plus the root CSS files. Sample FIT fixtures live in `sample_data/`; validation utilities live in `scripts/`. Do not edit generated `dist/` or `node_modules/` content.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local Vite development server.
- `npm run build`: run the TypeScript/Vite production build.
- `npm run lint`: run ESLint across the repository.
- `npm run test:sample-merge`: validate sample FIT merge behavior using `scripts/validate-sample-merge.mjs`.
- `npm run preview`: serve the built app locally for final verification.
- `npm run optimize`: pre-bundle Vite dependencies.

## Coding Style & Naming Conventions

Use TypeScript and React functional components. Prefer 2-space indentation, single-purpose modules, and clear named exports for utilities. Component files use PascalCase, such as `TrackMap.tsx`; hooks use `use-*.ts`; utility modules use camelCase, such as `fitMerger.ts`. Use the `@/*` path alias for imports from `src`. Keep `src/components/ui/` consistent with existing shadcn/Radix patterns. Run `npm run lint` before submitting changes.

## Testing Guidelines

There is not yet a full unit-test suite. The current regression check is `npm run test:sample-merge`, which exercises the sample merge flow against files in `sample_data/`. When changing FIT parsing, coordinate handling, merge timing, or export behavior, update or add sample validations in `scripts/validate-sample-merge.mjs`. For UI changes, also run `npm run build` and manually verify upload, preview, map rendering, and download flows in the dev server.

## Commit & Pull Request Guidelines

Recent history uses concise commit subjects, including `feat: enhance FIT merge workflow and track visualization`. Prefer `feat:`, `fix:`, `docs:`, `refactor:`, or `test:` prefixes with imperative descriptions. Pull requests should include a summary, testing performed, linked issues when relevant, and screenshots or recordings for visible UI changes. Note sample data additions and avoid committing generated files unless required.

## Security & Configuration Tips

Treat uploaded FIT files as user-provided data. Avoid logging full file contents, personal location traces, or raw binary payloads. Keep dependency updates aligned with `package-lock.json`, and review `.github/dependabot.yml` alerts promptly.
