---
name: service-extraction-or-implementation
description: Workflow command scaffold for service-extraction-or-implementation in inventory_project.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /service-extraction-or-implementation

Use this workflow when working on **service-extraction-or-implementation** in `inventory_project`.

## Goal

Extracts or implements a new service class, typically with corresponding test file.

## Common Files

- `inventory_project/src/services/*.ts`
- `inventory_project/__tests__/*.test.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a service file in src/services (e.g., StockService.ts, VentasService.ts)
- Add or update corresponding test file in __tests__ (e.g., StockService.test.ts, AppError.test.ts)
- Update API route or other files to use the new service (optional, depending on refactor)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.