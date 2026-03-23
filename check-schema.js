import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkColumns() {
  const tables = ['contract_templates', 'contracts', 'document_templates', 'inventory_items'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    // If table is empty, we can still get the columns from a 0 row response? No, postgrest might just give nothing or we can use error.
    // Actually, we can just do a CSV query with limit=0 to get headers.
    const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/${table}?limit=0`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        'Accept': 'text/csv'
      }
    });
    const text = await res.text();
    console.log(`Table ${table} columns:`, text.split('\n')[0]);
  }
}
checkColumns();
