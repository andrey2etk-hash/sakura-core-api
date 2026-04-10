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
  res.send('🌸 Sakura API: New Architecture with Archiving active!');
});

// --- РОБОТА З ПРОЄКТАМИ (PROJECTS) ---

// 1. Отримання проєктів (ТІЛЬКИ АКТИВНИХ)
app.get('/projects', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_archived', false) // Приховуємо архівні
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Створення нового проєкту
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

// 3. Архівування проєкту (PATCH)
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

// --- РОБОТА З ВИРОБАМИ (PROJECT ITEMS) ---

// 1. Отримання виробів (ТІЛЬКИ АКТИВНИХ)
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

// 2. Створення нового виробу
app.post('/project_items', authenticateToken, async (req, res) => {
  try {
    const { 
      project_id, 
      type_code, 
      display_name, 
      height, 
      width, 
      depth, 
      mass_kg, 
      ip_rating 
    } = req.body;

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

// 3. Архівування виробу (PATCH)
app.patch('/project_items/:id/archive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('project_items')
      .update({ is_archived: true })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, message: "Виріб архівовано", data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// --- АВТОРИЗАЦІЯ ТА РОЛІ ---
app.get('/get-user-access', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query; // Отримуємо email з запиту
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { data, error } = await supabase
      .from('user_permissions')
      .select('role, options')
      .eq('email', email)
      .single();

    if (error || !data) {
      // Якщо юзера немає в базі, даємо роль за замовчуванням (гість)
      return res.json({ role: 'guest', options: {} });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
