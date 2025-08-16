import { supabase } from './collegamentoDb.js';
const queryString = window.location.search;

const params = new URLSearchParams(queryString);

const spazioId = params.get('id');
const giorno = params.get('giorno');
const fascia = params.get('fascia');


document.addEventListener('DOMContentLoaded', async() => {
  try{
    const{data, error: fetchError} = await supabase
    .from('spazi_lavoro')
    .select('prezzo_ora')
    .eq('id_spazio', spazioId)
    .single();
    if (fetchError) throw new Error(fetchError.message);
    const prezzo = data.prezzo_ora;
    document.getElementById('spazio-id').textContent = spazioId;
    document.getElementById('giorno').textContent = giorno;
    document.getElementById('fascia').textContent = fascia;
    document.getElementById('prezzo').textContent = `€ ${prezzo}`;
  }catch (error) {
    console.error('Errore nel recupero dei dati dello spazio:', error);
  }
  
});

document.getElementById('button-sub').addEventListener('click', async () => {
  const nome= document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();

  
  window.location.href = `pagamento.html?nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&prezzo=${prezzo}`;
});