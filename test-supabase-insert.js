import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('reseller_applications').insert({
    name: 'Test',
    whatsapp: '123',
    business_name: 'Test Biz',
    location: 'Test Loc',
    volume_needs: '100',
    status: 'new'
  }).select();
  console.log('Insert result:', data, error);
}

check();
