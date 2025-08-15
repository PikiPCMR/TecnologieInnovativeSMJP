import { supabase } from '../collegamentoDb.js';
console.log(supabase);

const user = JSON.parse(localStorage.getItem('user'))?.id;
console.log('User ID:', user);

// Carica immagini nel bucket e restituisce array di URL
export async function uploadSpazioImages(files, id_spazio) {
    const urls = [];
    for (const file of files) {
        const filePath = `${id_spazio}/${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('immaginispazio')
            .upload(filePath, file);
        if (error) {
            console.error('Errore upload:', error);
            continue;
        }
        const url = supabase.storage
            .from('immaginispazio')
            .getPublicUrl(filePath).data.publicUrl;
        urls.push(url);
    }
    return urls;
}

// Funzione principale per aggiungere uno spazio
export async function aggiungiSpazio(formData, files) {
    const id_gestore = user;
    if (!user) {
        alert('Gestore non loggato!');
        return;
    }

    // Genera un id_spazio unico (puoi usare uuid o timestamp)
    const id_spazio = `spazio_${Date.now()}`;

    // Carica immagini e ottieni gli URL
    const immaginiUrls = await uploadSpazioImages(files, id_spazio);

    // Prepara i dati
    const spazioData = {
        id_spazio,
        id_gestore,
        indirizzo_spazio: formData.indirizzo_spazio,
        numero_civico: formData.numero_civico,
        città: formData.città,
        provincia: formData.provincia,
        nazione: formData.nazione,
        categoria: formData.categoria,
        capienza_max: formData.capienza_max,
        prezzo_ora: formData.prezzo_ora,
        descrizione_breve: formData.descrizione_breve,
        descrizione_lunga: formData.descrizione_lunga,
        immagini_spazio: immaginiUrls // text[]
    };

    // Salva nel database
    const { error } = await supabase
        .from('spazi_lavoro')
        .insert([spazioData]);

    if (error) {
        alert('Errore nel salvataggio dello spazio!');
        console.error(error);
        return;
    }
    alert('Spazio creato con successo!');
}

async function doesBucketExist(bucketName) {
  try {
    const { data, error } = await supabase.storage.getBucket(immaginispazio);

    // Se l'errore indica che il bucket non è stato trovato (codice 404),
    // significa che non esiste. Altrimenti, qualsiasi altro errore o
    // il successo del recupero del dato indica che il bucket esiste.
    if (error && error.statusCode === '404') {
      console.log(`Il bucket "${bucketName}" non esiste.`);
      return false;
    } else if (error) {
      console.error('Errore durante il controllo del bucket:', error.message);
      return false;
    }

    console.log(`Il bucket "${bucketName}" esiste.`);
    return true;
  } catch (err) {
    console.error('Si è verificata un\'eccezione:', err.message);
    return false;
  }
}
window.doesBucketExist = doesBucketExist;

// Esempio di utilizzo:
// Controlla l'esistenza di un bucket chiamato 'immagini-utenti'
doesBucketExist('immagini-utenti').then(exists => {
  if (exists) {
    // Fai qualcosa se il bucket esiste
  } else {
    // Fai qualcosa se il bucket non esiste, ad es. crealo
  }
});