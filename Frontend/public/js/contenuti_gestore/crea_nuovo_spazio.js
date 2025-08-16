import { supabase } from '../collegamentoDb.js';

// Variabili per gestire le immagini lato client
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

// Funzione per mostrare le immagini in un carosello (o una singola immagine)
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

// Carica immagini nel bucket e restituisce array di URL
export async function uploadSpazioImages(files, id_spazio) {
    const urls = [];
    for (const file of files) {
        // ... (la tua logica di upload rimane la stessa)
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

// Funzione principale per aggiungere uno spazio
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
    window.location.reload(); // reset del form
}
