# Sakura Core - Decisions Log

## 2026-04 - Core Decisions

### Architecture
- Confirmed strict 4-layer architecture:
  Sheets -> GAS -> Render -> Supabase.

### Data Responsibility
- Supabase remains the source of truth.
- Google Sheets is treated as UI/reporting surface.

### User Workspace Model
- Accepted operating model: one spreadsheet per user for each customer.
- Spreadsheets are cloned from a prepared template and tied to customer context.

### Access and Visibility
- Sidebar menu is role-aware and should evolve to role + paid-module aware.
- Sheets/tabs are created lazily (first use) by authorized functions.

### Dynamic Configuration
- `field_definitions` introduced to control dynamic workflow field visibility.
- Goal: admin can add new checks/stages without code rewrite.

### UX Behavior
- Modal-related menu item should stay highlighted while modal is open.
- On modal close, menu item should reset to inactive state.

### Commercial Direction
- Product direction expanded from narrow domain to broader sheet metal manufacturing focus.
- Revenue model: one-time setup + monthly core + monthly add-on modules.
