# Sakura Core - Architecture

## 4-Layer Flow (Strict)
1. Google Sheets (Client UI screen)
2. Google Apps Script (Dispatcher / bridge)
3. Render Node.js API (Engine / business logic)
4. Supabase PostgreSQL (Single source of truth)

## Operational Principles
- Sheets are a UI surface, not the source of truth.
- Core business logic lives in Render API.
- Data integrity and history live in Supabase.
- Apps Script remains thin and predictable.

## Tenant and User Model
- Strict tenant isolation with `tenant_id` in all data operations.
- Current operating decision: one spreadsheet per user in each customer environment.
- Each user spreadsheet is generated from template and bound to tenant context.

## Security Rules
- Every SELECT/INSERT/UPDATE path must include tenant scope.
- Role and permission checks happen in:
  - Sidebar visibility layer
  - Apps Script/Render action layer
  - Database policies (where applicable)

## UI Rules
- Sidebar includes logo, version, authenticated user, role, and dynamic menu.
- Menu content depends on role + active paid modules.
- Data input/edit flows are modal HTML forms.
- Data output/reporting is rendered into Google Sheets tabs.

## Dynamic Extensibility
- `field_definitions` controls configurable field visibility and behavior.
- New modules should plug in without core rewrite.
