const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Підключення до Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// МІДЛВЕР ДЛЯ ПЕРЕВІРКИ ТОКЕНА
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
  res.send('🌸 Sakura API: v1.10 | Personalization & full_name Support Active');
});

// --- РОБОТА З ПРОЄКТАМИ ---

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

app.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([req.body])
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Проєкт з таким номером уже існує!' });
      }
      throw error;
    }
    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/projects/:id/archive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, message: "Проєкт перенесено в архів", data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- РОБОТА З ВИРОБАМИ ---

app.get('/project_items', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    let query = supabase.from('project_items').select('*').eq('is_archived', false);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error } = await query.order('full_job_number', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/project_items', authenticateToken, async (req, res) => {
  try {
    const { project_id, type_code, display_name, height, width, depth, mass_kg, ip_rating } = req.body;
    if (!project_id || !display_name) {
      return res.status(400).json({ error: 'Missing project_id or display_name' });
    }
    const { data, error } = await supabase
      .from('project_items')
      .insert([{ 
        project_id, 
        type_code, 
        display_name, 
        height: height ? parseInt(height) : null, 
        width: width ? parseInt(width) : null, 
        depth: depth ? parseInt(depth) : null,
        mass_kg: mass_kg ? parseInt(mass_kg) : null,
        ip_rating: ip_rating || 'IP00'
      }])
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- КЕРУВАННЯ КОРИСТУВАЧАМИ ---

app.post('/user-permissions', authenticateToken, async (req, res) => {
  try {
    const { email, role, tenant_id, options, full_name } = req.body;
    if (!email || !role || !tenant_id) {
      return res.status(400).json({ error: 'Missing email, role or tenant_id' });
    }

    const { data, error } = await supabase
      .from('user_permissions')
      .upsert({ 
        email: email.toLowerCase().trim(), 
        role, 
        tenant_id, 
        full_name, // Тепер ім'я зберігається при створенні/оновленні
        options: options || {} 
      }, { onConflict: ['email', 'tenant_id'] })
      .select();

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) {
    console.error("Помилка на сервері:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- АВТОРИЗАЦІЯ ТА РОЛІ (З ПІДТРИМКОЮ ПІБ) ---
app.get('/get-user-access', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabase
      .from('user_permissions')
      .select('role, options, full_name') // ЯВНО ДОДАНО full_name
      .eq('email', normalizedEmail)
      .single();

    if (error || !data) {
      return res.json({ role: 'guest', options: {} });
    }

    // ПЕРЕВІРКА БЛОКУВАННЯ
    if (data.options && data.options.disabled === true) {
      return res.json({ 
        role: 'guest', 
        options: data.options, 
        message: 'Access blocked by administrator' 
      });
    }

    res.json(data); // Тепер об'єкт містить full_name
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/get-all-users', authenticateToken, async (req, res) => {
  try {
    const { tenant_id } = req.query;
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*') // Тут full_name підтягнеться автоматично
      .eq('tenant_id', tenant_id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
