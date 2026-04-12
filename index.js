const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] || req.headers['x-api-key'];
  const expectedToken = process.env.API_KEY;
  if (token === `Bearer ${expectedToken}` || token === expectedToken) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

app.get('/', (req, res) => {
  res.send('🌸 Sakura API: v1.50 | Modular Active');
});

// Маршрут для отримання даних користувача
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

// --- ЗБІРКА ІНТЕРФЕЙСУ ПО МЕТОДИЧЦІ ---
app.get('/api/interface', (req, res) => {
    const dir = path.join(__dirname, 'src/main/resources/templates');
    
    try {
        const html = fs.readFileSync(path.join(dir, 'Sidebar.html'), 'utf8');
        const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
        const js = fs.readFileSync(path.join(dir, 'script.js'), 'utf8');

        const fullContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <base target="_top">
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}</script>
            </body>
            </html>
        `;
        
        res.set('Content-Type', 'text/html');
        res.send(fullContent);
    } catch (err) {
        console.error("Build Error Details:", err.message);
        res.status(500).send(`Помилка збірки: не знайдено файл`);
    }
});

/**
 * Маршрут для отримання проєктів (Об'єктів)
 * ПРАВКА: Використовуємо існуючу таблицю 'projects' та фільтр по tenant_id
 */
app.get('/projects', async (req, res) => {
  try {
    const { tenant_id } = req.query;

    let query = supabase
      .from('projects') 
      .select('*')
      .order('created_at', { ascending: false });

    // Фільтруємо за клієнтом, якщо передано ID
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    res.json(data);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server active on port ${PORT}`));
