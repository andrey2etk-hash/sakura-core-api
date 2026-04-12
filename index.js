const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Підключення до Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// МІДЛВЕР ДЛЯ ПЕРЕВІРКИ ТОКЕНА (для адмінських дій)
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] || req.headers['x-api-key'];
  const expectedToken = process.env.API_KEY;
  if (token === `Bearer ${expectedToken}` || token === expectedToken) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// --- БАЗОВІ МАРШРУТИ ---
app.get('/', (req, res) => {
  res.send('🌸 Sakura API: v1.15 | Production Ready');
});

// --- АВТОРИЗАЦІЯ (Відкритий маршрут для Бібліотеки) ---
app.get('/get-user', async (req, res) => {
  try {
    const { email, tenant_id } = req.query;
    if (!email || !tenant_id) return res.status(400).json({ error: 'Missing email or tenant_id' });

    const { data, error } = await supabase
      .from('user_permissions')
      .select('role, options, full_name')
      .eq('email', email.toLowerCase().trim())
      .eq('tenant_id', tenant_id)
      .single();

    if (error || !data) {
      return res.json({ full_name: 'Гість', role: 'GUEST', options: {} });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ІНТЕРФЕЙС (Для завантаження Sidebar) ---
app.get('/api/interface', (req, res) => {
  const filePath = path.join(__dirname, 'src/main/resources/templates/Sidebar.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Помилка завантаження інтерфейсу');
    res.set('Content-Type', 'text/html');
    res.send(data);
  });
});

// --- РОБОТА З ПРОЄКТАМИ (Захищено токеном) ---
app.get('/projects', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- КЕРУВАННЯ КОРИСТУВАЧАМИ (Захищено токеном) ---
app.post('/user-permissions', authenticateToken, async (req, res) => {
  try {
    const { email, role, tenant_id, options, full_name } = req.body;
    const { data, error } = await supabase
      .from('user_permissions')
      .upsert({ 
        email: email.toLowerCase().trim(), 
        role, 
        tenant_id, 
        full_name, 
        options: options || {} 
      }, { onConflict: ['email', 'tenant_id'] })
      .select();
    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sakura Server active on port ${PORT}`);
});
