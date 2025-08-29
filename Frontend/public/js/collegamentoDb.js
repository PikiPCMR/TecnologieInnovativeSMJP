import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://sbxrdptjegjxqaklfpxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHJkcHRqZWdqeHFha2xmcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjcxMTcsImV4cCI6MjA2MjIwMzExN30.-eNAPw6hGKrSLtYmFSxxneOtEKrAyH6OUi_pKZmg-zs'; // anon/public key (readonly idealmente)

export const supabase = createClient(supabaseUrl, supabaseKey);

// Ora puoi usare supabase in altri file importando questo modulo
// Ad esempio:  import { supabase } from './collegamentoDb.js';