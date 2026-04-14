const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Підключення до бази Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Мідлвар безпеки (залишаємо структуру на майбутнє)
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] || req.headers['x-api-key'];
  const expectedToken = process.env.API_KEY;
  if (!expectedToken || token === expectedToken) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

app.get('/', (req, res) => {
  res.send('🌸 Sakura API: v1.70 | Simple Sync Active');
});

// 1. ОТРИМАННЯ ДАНИХ КОРИСТУВАЧА
app.get('/get-user', async (req, res) => {
  try {
    const { email, tenant_id } = req.query;
    const { data, error } = await supabase
      .from('user_permissions')
      .select('role, options, full_name')
      .eq('email', email.toLowerCase().trim())
      .eq('tenant_id', tenant_id)
      .single();

    if (error || !data) return res.json({ full_name: 'Гість', role: 'GUEST' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. ЗБІРКА ІНТЕРФЕЙСУ (SIDEBAR)
app.get('/api/interface', (req, res) => {
  const dir = path.join(__dirname, 'src/main/resources/templates');
  try {
    const html = fs.readFileSync(path.join(dir, 'Sidebar.html'), 'utf8');
    const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
    const js = fs.readFileSync(path.join(dir, 'script.js'), 'utf8');
    
    const fullContent = `<!DOCTYPE html><html><head><base target="_top"><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
    res.set('Content-Type', 'text/html');
    res.send(fullContent);
  } catch (err) { res.status(500).send(`Помилка збірки ресурсів`); }
});

// 3. СПРОЩЕНИЙ МАРШРУТ ПРОЄКТІВ (ПОВНИЙ ПЕРЕЗАПИС)
app.get('/projects', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    
    // Просто тягнемо ВСІ неархівні проекти для цього клієнта
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/projects', async (req, res) => {
  try {
    const { tenant_id, name, customer, deadline, manager_name, object_number, status } = req.body || {};
    if (!tenant_id || !name) {
      return res.status(400).json({ error: 'tenant_id and name are required' });
    }

    const payload = {
      tenant_id,
      name,
      customer: customer || null,
      deadline: deadline || null,
      manager_name: manager_name || null,
      object_number: object_number || null,
      status: status || 'planned',
      is_archived: false
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([payload])
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. НАЛАШТУВАННЯ ПОЛІВ ЖУРНАЛУ
app.get('/field-definitions', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    const { data, error } = await supabase
      .from('field_definitions')
      .select('id, tenant_id, field_key, field_label, field_type, is_active, created_at')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/field-definitions/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id, is_active } = req.body;

    if (!tenant_id || typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'tenant_id and boolean is_active are required' });
    }

    const { data, error } = await supabase
      .from('field_definitions')
      .update({ is_active })
      .eq('id', id)
      .eq('tenant_id', tenant_id)
      .select('id, tenant_id, field_key, field_label, field_type, is_active, created_at')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Field definition not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. ТЕСТОВИЙ ПІНГ (Для перевірки зв'язку)
app.get('/test-ping', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ 
        name: "ТЕСТ ЗВ'ЯЗКУ", 
        tenant_id: '859f518e-49b8-402b-a396-8488e390c500', 
        status: 'testing' 
      }]);
    if (error) throw error;
    res.json({ message: "Сигнал дійшов до Supabase!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Sakura API v1.70 Active on port ${PORT}`));