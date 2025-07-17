import { createClient } from '@supabase/supabase-js';

// Supabase client for the web app
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Usage example:
// import { supabase } from '@/lib/supabase';
// const { data, error } = await supabase.from('your_table').select(); 