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
  res.send('🌸 Sakura API is Live and Running!');
});

// --- РОБОТА З ОБ'ЄКТАМИ ---

// 1. Отримання всіх об'єктів
app.get('/objects', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Створення нового об'єкта
app.post('/objects', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('objects')
      .insert([req.body])
      .select();

    if (error) throw error;
    res.json({ success: true, data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- РОБОТА З ВИРОБАМИ (ORDER ITEMS) ---

// 1. Отримання виробів (опціонально фільтр за order_id)
app.get('/order_items', authenticateToken, async (req, res) => {
  try {
    const { order_id } = req.query;
    let query = supabase.from('order_items').select('*');

    if (order_id) {
      query = query.eq('order_id', order_id);
    }

    const { data, error } = await query.order('full_job_number', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Створення нового виробу (Лист Вводу)
app.post('/order_items', authenticateToken, async (req, res) => {
  try {
    const { 
      order_id, 
      type_code, 
      display_name, // це приходить з Google Таблиці
      height, 
      width, 
      depth, 
      mass_kg, 
      ip_rating 
    } = req.body;

    const { data, error } = await supabase
      .from('order_items')
      .insert([{ 
        order_id, // тут має бути UUID, який прийшов з Select-списку
        type_code, 
        display_name, // тепер у базі ми його перейменували на display_name
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
    console.error("Помилка:", err.message);
    res.status(500).json({ error: err.message });
  }
});

    // Повертаємо перший елемент масиву (створений об'єкт з full_job_number)
    res.json(data[0]);
  } catch (err) {
    console.error("Supabase Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
