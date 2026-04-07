const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ФУНКЦІЯ ПЕРЕВІРКИ (Middleware)
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] || req.headers['x-api-key'];
  if (token === `Bearer ${process.env.API_KEY}` || token === process.env.API_KEY) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// --- МАРШРУТИ ДЛЯ ОБ'ЄКТІВ ---

app.get('/objects', authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from('objects').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/objects', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('objects')
    .insert([req.body])
    .select();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data[0] });
});

// --- МАРШРУТИ ДЛЯ ВИРОБІВ (ORDER ITEMS) ---

app.get('/order_items', authenticateToken, async (req, res) => {
  const { order_id } = req.query;
  let query = supabase.from('order_items').select('*');
  
  if (order_id) {
    query = query.eq('order_id', order_id);
  }
  
  const { data, error } = await query.order('full_job_number', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/order_items', authenticateToken, async (req, res) => {
  const { 
    order_id, 
    type_code, 
    display_name, 
    height, 
    width, 
    depth, 
    mass_kg, 
    ip_rating 
  } = req.body;

  const { data, error } = await supabase
    .from('order_items')
    .insert([{ 
      order_id, 
      type_code, 
      display_name, 
      height: height ? parseInt(height) : null, 
      width: width ? parseInt(width) : null, 
      depth: depth ? parseInt(depth) : null,
      mass_kg: mass_kg ? parseInt(mass_kg) : null,
      ip_rating: ip_rating || 'IP00'
    }])
    .select(); // Повертає об'єкт вже з full_job_number від тригера

  if (error) {
    console.error("Supabase Error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data[0]);
});

// БАЗОВІ МАРШРУТИ
app.get('/', (req, res) => res.send('Sakura API is Live!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
