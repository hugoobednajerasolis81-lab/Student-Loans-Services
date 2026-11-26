# Student Loans Services

Student Loans Services is being organized as a Bun monorepo.

## Current status

The repository contains copied Hostinger source under `JS apps/`. The source is not yet in the workspace paths expected by the root configuration. The restructuring branch preserves those files while the application layout is recovered.

## Expected layout

```text
apps/
  web/
  pocketbase/
```

## Prerequisites

- Node.js 20 or newer
- Bun
- PocketBase, when the backend workspace is restored

## Commands

```bash
bun install
bun run check:structure
```

The structure check intentionally reports missing workspace files until the copied Hostinger source has been placed into `apps/web` and `apps/pocketbase`. The existing source files are not deleted by this restructuring pass.

## Branches

- `main`: original repository state
- `fix/restructure-monorepo`: restructuring work
