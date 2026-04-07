const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

app.get('/config', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('api_key', apiKey)
        .single();

    if (error || !tenant) return res.status(401).json({ error: 'Unauthorized' });
    
    const isExpired = new Date(tenant.trial_ends_at) < new Date();
    if (isExpired && tenant.subscription_status === 'trial') {
        return res.status(402).json({ error: 'Trial expired' });
    }

    res.json({
        company: tenant.company_name,
        locale: tenant.locale,
        status: tenant.subscription_status
    });
});
// Отримання списку об'єктів для конкретного клієнта
app.get('/objects', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    
    // 1. Перевіряємо хто стукає (Tenant)
    const { data: tenant, error: tError } = await supabase
        .from('tenants')
        .select('id')
        .eq('api_key', apiKey)
        .single();

    if (tError || !tenant) return res.status(401).json({ error: 'Unauthorized' });

    // 2. Беремо його об'єкти
    const { data: objects, error: oError } = await supabase
        .from('objects')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('deadline', { ascending: true });

    if (oError) return res.status(500).json({ error: oError.message });

    res.json(objects);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sakura API running on port ${PORT}`));

// Додай це в index.js після маршруту /objects
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
