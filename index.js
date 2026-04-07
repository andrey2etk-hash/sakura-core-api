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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
