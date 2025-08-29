/**
 * @file Gestisce la visualizzazione e la gestione delle prenotazioni dell'utente.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { supabase } from '/js/collegamentoDb.js';

// Variabili globali per gestire lo stato delle immagini selezionate
let selectedFiles = [];

const immaginiInput = document.getElementById('immagini-input');
const rimuoviBtn = document.getElementById('rimuovi-immagini-btn');
const previewContainer = document.getElementById('image-preview-container');

// Aggiungi un listener per l'input dei file
immaginiInput.addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files);
    updatePreviewCarousel();
});

// Aggiungi un listener per il pulsante di rimozione
rimuoviBtn.addEventListener('click', () => {
    selectedFiles = [];
    immaginiInput.value = ''; // Resetta l'input file
    updatePreviewCarousel();
});

/**
 * Aggiorna il carosello di anteprima delle immagini selezionate.
 * Crea un carosello dinamico che mostra le immagini caricate dall'utente.
 * Se non ci sono immagini, nasconde il pulsante di rimozione.
 */
function updatePreviewCarousel() {
    previewContainer.innerHTML = ''; // Pulisci il contenitore
    if (selectedFiles.length > 0) {
        rimuoviBtn.style.display = 'block';
        
        // Crea un div per il carosello
        const carousel = document.createElement('div');
        carousel.className = 'image-carousel';
        
        selectedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                carousel.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
        previewContainer.appendChild(carousel);
    } else {
        rimuoviBtn.style.display = 'none';
    }
}

/**
 * Carica un array di file immagine su un bucket di storage di Supabase.
 * Le immagini vengono salvate in una sottocartella il cui nome è `id_spazio`.
 * @param {File[]} files Un array di oggetti File da caricare.
 * @param {string} id_spazio L'ID dello spazio di lavoro, usato come nome della cartella nel bucket.
 * @returns {Promise<string[]>} Una promessa che si risolve in un array di URL pubblici delle immagini caricate con successo.
 */
export async function uploadSpazioImages(files, id_spazio) {
    const urls = [];
    for (const file of files) {
        const filePath = `${id_spazio}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('immaginispazio')
            .upload(filePath, file, { upsert: true });
        
        if (uploadError) {
            console.error('Errore durante l\'upload:', uploadError);
            continue;
        }
        
        const { data: { publicUrl } } = supabase.storage
            .from('immaginispazio')
            .getPublicUrl(filePath);
            
        urls.push(publicUrl);
    }
    return urls;
}

/**
 * Gestisce il processo completo di aggiunta di un nuovo spazio di lavoro.
 * Esegue il caricamento delle immagini, recupera i dati dell'utente loggato,
 * unisce i dati del form e salva il tutto nel database.
 * @param {Object} formData Un oggetto che contiene i dati del form.
 * @param {File[]} selectedFiles Un array di oggetti File con le immagini da caricare.
 * @returns {Promise<void>} Una promessa che non restituisce un valore ma gestisce alert e reindirizzamento.
 */
export async function aggiungiSpazio(formData, selectedFiles) {
    const user = JSON.parse(localStorage.getItem('user'))?.id;
    if (!user) {
        alert('Gestore non loggato!');
        return;
    }

    const id_spazio = document.getElementById('nomespazio').value.trim(); 

    // Upload immagini
    const immaginiUrls = await uploadSpazioImages(selectedFiles, id_spazio);

    if (immaginiUrls.length === 0 && selectedFiles.length > 0) {
        alert('Si è verificato un errore durante l\'upload di alcune immagini.');
        return;
    }

    // Uniamo i dati del form con id e immagini
    const spazioData = {
        ...formData,
        id_spazio,
        id_gestore: user,
        immagini_spazio: immaginiUrls
    };

    // Salvataggio nel DB
    const { error } = await supabase
        .from('spazi_lavoro')
        .insert([spazioData]);

    if (error) {
        alert('Errore nel salvataggio dello spazio!');
        console.error(error);
        return;
    }

    alert('Spazio creato con successo!');
    window.location.href = '../dashboard_gestore.html';
}