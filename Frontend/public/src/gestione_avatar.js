import { supabase } from './collegamentoDb.js';

export async function cercaContenutiBucket() {
  console.log('🚀 Avvio ricerca contenuti nel bucket...');

  if (!supabase || !supabase.storage) {
    console.error('❌ supabase o supabase.storage non definito!');
    return;
  }

  try {
    const { data, error } = await supabase
      .storage
      .from('immaginiprofilo')
      .list('', { limit: 100 });

    if (error) {
      console.error('❌ Errore durante il recupero file:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Nessun file trovato nel bucket immaginiprofilo.');
      return;
    }

    console.log(`✅ Trovati ${data.length} file nel bucket immaginiprofilo:`);

    data.forEach((file, index) => {
      console.log(`  [${index + 1}] Nome: ${file.name}, tipo: ${file.metadata?.mime_type || 'n/d'}, size: ${file.metadata?.size || 'n/d'}`);
    });

  } catch (e) {
    console.error('❌ Eccezione durante la ricerca contenuti:', e);
  }
}

// Per testare la funzione da console o codice:
cercaContenutiBucket();