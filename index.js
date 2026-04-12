const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Підключення до бази
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Мідлвар для безпеки (опційно)
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] || req.headers['x-api-key'];
  const expectedToken = process.env.API_KEY;
  if (!expectedToken || token === expectedToken) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

app.get('/', (req, res) => {
  res.send('🌸 Sakura API: v1.60 | Delta Sync Active');
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

// 3. РОЗУМНИЙ МАРШРУТ ПРОЄКТІВ (DELTA UPDATE)
app.get('/projects', async (req, res) => {
  try {
    const { tenant_id, last_update } = req.query;
    let query = supabase.from('projects').select('*');

    if (tenant_id) query = query.eq('tenant_id', tenant_id);

    // Якщо є дата — тягнемо все змінене (включаючи архівні для видалення в таблиці)
    if (last_update && last_update !== "null") {
      query = query.gt('updated_at', last_update);
    } else {
      // Якщо перше завантаження — тільки актуальні
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query.order('updated_at', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. МАРШРУТ ДЛЯ ЗВІРКИ (RECONCILIATION)
// Повертає лише список живих ID, щоб видалити те, що було видалено фізично
app.get('/projects-ids', async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const { data, error } = await supabase
      .from('projects')
      .select('object_number')
      .eq('tenant_id', tenant_id)
      .eq('is_archived', false);

    if (error) throw error;
    res.json(data.map(item => item.object_number));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. ТЕСТОВИЙ ПІНГ
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
app.listen(PORT, () => console.log(`🚀 Sakura API v1.60 Active on port ${PORT}`));
