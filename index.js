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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sakura API running on port ${PORT}`));
