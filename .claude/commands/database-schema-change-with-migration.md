---
name: database-schema-change-with-migration
description: Workflow command scaffold for database-schema-change-with-migration in inventory_project.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /database-schema-change-with-migration

Use this workflow when working on **database-schema-change-with-migration** in `inventory_project`.

## Goal

Updates the Prisma schema, generates a migration, and updates seed data or related API routes.

## Common Files

- `inventory_project/prisma/schema.prisma`
- `inventory_project/prisma/migrations/*/migration.sql`
- `inventory_project/prisma/seed.ts`
- `inventory_project/src/app/api/*/route.ts`
- `inventory_project/node_modules/.prisma/client/*`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit prisma/schema.prisma
- Generate a new migration in prisma/migrations
- Update seed.ts or related files for new/changed data
- Update affected API route files in src/app/api
- Regenerate Prisma client (node_modules/.prisma/client/* updated)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.