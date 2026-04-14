# Sakura Core - Start Here

This file is a quick entry point for daily work.

## 1) Read First
- `PROJECT_BRIEF.md` - product purpose and target market
- `ARCHITECTURE.md` - strict 4-layer system rules
- `PRODUCT_ROADMAP.md` - current and next module priorities
- `DECISIONS_LOG.md` - confirmed implementation decisions
- `SALES_PLAN_Q4.md` - commercial direction and KPI targets

## 2) Core Runtime Flow
1. Google Sheets (user UI screen)
2. Google Apps Script (dispatcher)
3. Render Node.js API (business logic)
4. Supabase PostgreSQL (source of truth)

Rule: keep business logic in Render, keep GAS thin.

## 3) Current Workspace Files
- `Code.gs` - main GAS library logic
- `Main.gs` - table-side bridge/proxy
- `Sidebar.html` - sidebar structure
- `script.js` - sidebar interactions
- `ProjectCreateModal.html` - modal for creating objects/projects
- `index.js` - Render API server

## 4) Current Working Assumptions
- One spreadsheet per user (accepted operating model).
- Strict tenant isolation in all data operations.
- Menu and actions are role-aware and moving toward role + paid-module model.
- Sheets are treated as display/reporting surface.

## 5) Standard Dev Checklist
1. Confirm tenant-safe logic (`tenant_id` in data operations).
2. Update Render endpoint(s) if business behavior changes.
3. Update GAS bridge/proxy if new action is added.
4. Verify Sidebar behavior and modal open/close UX.
5. Verify sheet sync behavior after data writes.

## 6) Next Priority (Product)
Build dynamic input UI from `field_definitions` so new checks/stages can appear without code rewrite.

## 7) Done Criteria (Feature)
- Works across all 4 layers
- Role/permission behavior is correct
- Tenant safety preserved
- UI response is clear for user actions
