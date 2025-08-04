import { supabase } from '../config/supabaseClient.js'; // adatta il path se necessario
import fetch from 'node-fetch';

export const geocodificaSpazi = async (req, res) => {
  try {
    const { data: spazi, error } = await supabase.from('spazi_lavoro').select('*');
    if (error) throw error;

    const risultati = [];

    for (const spazio of spazi) {
      if (spazio.latitudine && spazio.longitudine) continue;

      const indirizzo = `${spazio.indirizzo_spazio}, ${spazio.Numero_Civico}, ${spazio.Città}, ${spazio.Provincia}, Italia`;

      const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(indirizzo)}`, {
        headers: { 'User-Agent': 'WorkspaceProApp/1.0 (admin@tuosito.it)' }
      }).then(res => res.json());

      if (!geo || geo.length === 0) {
        risultati.push({ spazio: spazio.id_spazio, stato: '❌ Coordinate non trovate' });
        continue;
      }

      const { lat, lon } = geo[0];

      await supabase
        .from('spazi_lavoro')
        .update({ latitudine: parseFloat(lat), longitudine: parseFloat(lon) })
        .eq('id_spazio', spazio.id_spazio);

      risultati.push({ spazio: spazio.id_spazio, lat, lon, stato: '✅ Aggiornato' });

      await new Promise(r => setTimeout(r, 1200)); // rispetto rate limit nominatim
    }

    res.status(200).json({ risultati });

  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: err.message });
  }
};
