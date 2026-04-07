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

// 1. Маршрут для Об'єктів
app.get('/objects', authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from('objects').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 2. Маршрут для Виробів (Те, що ми додавали)
app.get('/order_items', authenticateToken, async (req, res) => {
  const { order_id } = req.query;
  let query = supabase.from('order_items').select('*');
  
  if (order_id) {
    query = query.eq('order_id', order_id);
  }
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Базовий перевірочний маршрут
app.get('/', (req, res) => res.send('Sakura API is Live!'));

// Маршрут для створення нового об'єкта
app.post('/objects', authenticateToken, async (req, res) => {
  const { data, error } = await supabase
    .from('objects')
    .insert([req.body])
    .select();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data[0] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Маршрут для створення НОВОГО ВИРОБУ (Лист Вводу)
app.post('/order_items', authenticateToken, async (req, res) => {
  const { order_id, type_code, display_name, height, width, depth } = req.body;

  const { data, error } = await supabase
    .from('order_items')
    .insert([{ 
      order_id, 
      type_code, 
      display_name, 
      height: parseInt(height), 
      width: parseInt(width), 
      depth: parseInt(depth) 
    }])
    .select(); // select() обов'язковий, щоб повернути згенерований full_job_number

  if (error) {
    console.error("Supabase Error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  // Повертаємо створений об'єкт, де вже буде full_job_number (завдяки тригеру в БД)
  res.json(data[0]);
});
