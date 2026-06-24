# BRIEFING — 2026-06-22T14:59:00-05:00

## Mission
Implement the multi-tenant UI model, company CRUD, and company selector in user profiles.

## 🔒 My Identity
- Archetype: Project Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\orchestrator_multitenant
- Original parent: parent
- Original parent conversation ID: a90eb57a-3259-4209-ac28-9386a9670e80

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\PROJECT.md
1. **Decompose**: Decomposed into 4 milestones (Backend CRUD, Admin View, User Selector UI, final verification).
2. **Dispatch & Execute**:
   - **Delegate (sub-orchestrator)**: Spawn a sub-orchestrator for each milestone.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: Self-succeed at 16 spawns.
- **Work items**:
  1. R1: CRUD de Empresas (Backend) [pending]
  2. R2: Vista de Administración de Empresas [pending]
  3. R3: Selector de Empresa en Usuarios [pending]
  4. Final E2E Verification & Hardening [pending]
- **Current phase**: 1
- **Current focus**: Milestone 1

## 🔒 Key Constraints
- Never write, modify, or create source code files directly.
- Never run build/test commands yourself — require workers to do so.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh

## Current Parent
- Conversation ID: a90eb57a-3259-4209-ac28-9386a9670e80
- Updated: not yet

## Key Decisions Made
- Multi-tenant architecture uses existing Prisma models for Empresa and Usuario.
- Admin role is a global administrator who manages companies and can assign users to any company.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| sub_orch_m1 | self | Milestone 1: CRUD de Empresas (Backend) | in-progress | deabe6c0-9ad9-40f3-9e90-2e80bf9469f7 |

## Succession Status
- Succession required: no
- Spawn count: 1 / 16
- Pending subagents: deabe6c0-9ad9-40f3-9e90-2e80bf9469f7
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 2adac996-a7d4-42c9-96b1-f1ac42c7b0e0/task-49
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\PROJECT.md — Global project plan and milestones
