s/**
 * @fileoverview Questo modulo gestisce la logica per la selezione e la visualizzazione degli avatar utente.
 * Include funzioni per aprire e chiudere un popup, caricare avatar predefiniti da un database,
 * salvare la selezione dell'utente e aggiornare l'interfaccia.
 * @author [Nome del tuo team o tuo nome]
 */

import { supabase } from '../collegamentoDb.js';

// === APRI POPUP ===
/**
 * Rende visibile il popup per la selezione dell'avatar e avvia il caricamento degli avatar disponibili dal database.
 */
export function apriPopup() {
  document.getElementById('avatar-popup').style.display = 'flex';
  caricaAvatarDaDB();
}
window.apriPopup = apriPopup;

// === CHIUDI POPUP ===
/**
 * Rende invisibile il popup per la selezione dell'avatar.
 */
export function chiudiPopup() {
  document.getElementById('avatar-popup').style.display = 'none';
}
window.chiudiPopup = chiudiPopup;

// === CARICA AVATAR DA BUCKET ===
/**
 * Recupera la lista degli URL degli avatar disponibili dalla tabella `avatar_profilo` del database
 * e li visualizza in una griglia all'interno del popup.
 * In caso di errore o di assenza di avatar, gestisce la visualizzazione di un messaggio appropriato.
 * @returns {Promise<void>} Una promessa che si risolve una volta che gli avatar sono stati caricati e visualizzati.
 */
export async function caricaAvatarDaDB() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.id) {
    console.warn('⚠️ Nessun utente loggato, esco dalla funzione.');
    return;
  }

  console.log('🔄 Caricamento avatar da tabella DB...');

  const { data, error } = await supabase
    .from('avatar_profilo')
    .select('*');

  if (error) {
    console.error('❌ Errore caricamento avatar dal DB:', error);
    return;
  }

  console.log('✅ Avatar caricati dal DB:', data);

  const grid = document.getElementById('avatar-grid');
  if (!grid) {
    console.warn('⚠️ Elemento #avatar-grid non trovato nel DOM.');
    return;
  }

  grid.innerHTML = '';

  if (!data || data.length === 0) {
    grid.innerHTML = '<p>Nessuna immagine disponibile.</p>';
    return;
  }

  data.forEach(avatar => {
    const img = document.createElement('img');
    img.src = avatar.url;  // URL preso dal DB
    img.alt = avatar.descrizione || avatar.nome_file;
    img.onclick = () => selezionaAvatar(avatar.url);
    grid.appendChild(img);
  });

  console.log('✅ Avatar mostrati nel popup');
}

// === SELEZIONA AVATAR ===
/**
 * Salva l'URL dell'avatar selezionato nella colonna `immagine_profilo` della tabella `registrazione`
 * per l'utente loggato. Aggiorna anche l'interfaccia utente e il `localStorage`.
 * @param {string} urlAvatar L'URL dell'immagine dell'avatar selezionato.
 * @returns {Promise<void>} Una promessa che si risolve al termine dell'operazione di salvataggio.
 */
async function selezionaAvatar(urlAvatar) {
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user.id;

  if (!userId) {
    console.error('⚠️ ID utente non trovato nel localStorage.');
    return;
  }

  const { error } = await supabase
    .from('registrazione')
    .update({ immagine_profilo: urlAvatar })
    .eq('id', userId);

  if (error) {
    console.error('❌ Errore nel salvataggio immagine profilo nel DB:', error);
    return;
  }

  // Aggiorna immagine nel DOM
  document.getElementById('avatar').src = urlAvatar;

  // Aggiorna localStorage
  user.immagine_profilo = urlAvatar;
  localStorage.setItem('user', JSON.stringify(user));

  console.log('✅ Avatar selezionato e salvato:', urlAvatar);
  chiudiPopup();
}

// === CARICA AVATAR UTENTE ALL'AVVIO ===
/**
 * Carica e visualizza l'avatar dell'utente attualmente loggato.
 * L'URL dell'immagine viene recuperato dal `localStorage`. Se non viene trovato un avatar,
 * viene usato un'immagine placeholder predefinita.
 */
export function caricaAvatarUtente() {

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.id) {
    console.warn('⚠️ Nessun utente loggato, esco dalla funzione.');
    return;
  }

  const avatarImg = document.getElementById('avatar');
  const placeholder = 'https://sbxrdptjegjxqaklfpxq.supabase.co/storage/v1/object/public/immaginiprofilo//user1.png';

  try {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.immagine_profilo || user.immagine_profilo.trim() === '') {
      console.warn('🙈 Nessun utente o immagine trovata, uso placeholder.');
      avatarImg.src = placeholder;
      return;
    }

    console.log('📸 Immagine profilo trovata:', user.immagine_profilo);
    avatarImg.src = user.immagine_profilo;
  } catch (err) {
    console.error('❌ Errore nel recupero utente:', err);
    avatarImg.src = placeholder;
  }
}
window.caricaAvatarUtente = caricaAvatarUtente;