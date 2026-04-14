# Sakura Core - Product Roadmap

## Current Stage
Foundation is connected end-to-end:
- Sidebar and role-aware behavior
- GAS to Render to Supabase flow
- Initial dynamic field configuration (`field_definitions`)
- Modal creation flow with auto-refresh behavior

## Module A - Flexible Admin (In Progress)
Goal:
- Allow owner/admin to control visible workflow fields without code edits.

Scope:
- Manage field visibility/activity through `field_definitions`
- Dynamic rendering in operator UI

## Module B - Smart Production Journal
Goal:
- Real-time and traceable order progress visibility.

Planned:
- Status sync across departments
- Workload visibility for engineering/production
- Action log ("who changed what and when")

## Module C - Sheet Metal Operations Add-ons
Goal:
- Optional paid modules attached to core.

Planned examples:
- Welding reporting
- Cutting/bending checkpoints
- Material and purchase support flows

## Module D - CAD/BOM Integration (Future)
Goal:
- Import data from design systems into production and purchasing workflow.

Potential:
- SolidWorks BOM bridge
- Automatic item mapping and procurement preparation

## Product Direction Rule
Build simple, modular, and tenant-safe features first.
