CREATE TABLE field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    field_key TEXT NOT NULL,         -- наприклад, 'welding_check'
    field_label TEXT NOT NULL,       -- те, що бачить людина
    field_type TEXT DEFAULT 'checkbox',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);