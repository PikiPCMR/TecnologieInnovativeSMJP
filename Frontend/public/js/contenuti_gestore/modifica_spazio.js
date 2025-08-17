import { supabase } from '../collegamentoDb.js';

// Variabili per gestire le immagini lato client
let selectedFiles = [];
export let existingImageUrls = []; // Aggiunto "export" per rendere la variabile accessibile

const immaginiInput = document.getElementById('immagini-input');
const rimuoviBtn = document.getElementById('rimuovi-immagini-btn');
const previewContainer = document.getElementById('image-preview-container');

// Funzione per mostrare le immagini in un carosello
function updatePreviewCarousel() {
    previewContainer.innerHTML = '';
    const allFiles = [...existingImageUrls, ...selectedFiles]; // Combina immagini esistenti e nuove
    
    if (allFiles.length > 0) {
        rimuoviBtn.style.display = 'block';
        const carousel = document.createElement('div');
        carousel.className = 'image-carousel';
        
        allFiles.forEach(fileOrUrl => {
            const img = document.createElement('img');
            if (typeof fileOrUrl === 'string') {
                img.src = fileOrUrl;
                img.alt = 'Immagine esistente';
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                    img.alt = fileOrUrl.name;
                };
                reader.readAsDataURL(fileOrUrl);
            }
            carousel.appendChild(img);
        });
        previewContainer.appendChild(carousel);
    } else {
        rimuoviBtn.style.display = 'none';
    }
}

/**
 * Carica le immagini nel bucket e restituisce un array di URL.
 * Elimina prima le immagini esistenti nel bucket se necessario.
 * @param {Array<File>} files - I nuovi file da caricare.
 * @param {string} id_spazio - L'ID dello spazio per creare il percorso.
 * @returns {Promise<Array<string>>} Un array con gli URL pubblici delle nuove immagini.
 */
export async function uploadSpazioImages(files, id_spazio) {
    // Non è necessario passare oldUrls come argomento, lo prendiamo dal modulo.
    if (existingImageUrls && existingImageUrls.length > 0) {
        const pathsToDelete = existingImageUrls.map(url => {
            const pathStartIndex = url.indexOf('immaginispazio/') + 'immaginispazio/'.length;
            return url.substring(pathStartIndex);
        });
        const { error: deleteError } = await supabase.storage
            .from('immaginispazio')
            .remove(pathsToDelete);

        if (deleteError) {
            console.error('Errore durante l\'eliminazione delle vecchie immagini:', deleteError);
        }
    }

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
 * Funzione principale per caricare i dati dello spazio esistente.
 * @param {string} id_spazio - L'ID dello spazio da caricare.
 */
export async function loadSpazioData(id_spazio) {
    const { data: spazio, error } = await supabase
        .from('spazi_lavoro')
        .select('*')
        .eq('id_spazio', id_spazio)
        .single();

    if (error || !spazio) {
        console.error('Errore nel caricamento dei dati dello spazio:', error);
        alert('Spazio non trovato.');
        return;
    }

    document.getElementById('titolo-modifica-spazio').textContent = `Benvenuto nella pagina di modifica di ${spazio.id_spazio}. Potrai scegliere di modificare o eliminare lo spazio.`;

    document.querySelector('input[name="indirizzo_spazio"]').value = spazio.indirizzo_spazio;
    document.querySelector('input[name="numero_civico"]').value = spazio.numero_civico;
    document.querySelector('input[name="città"]').value = spazio.città;
    document.querySelector('input[name="provincia"]').value = spazio.provincia;
    document.querySelector('input[name="nazione"]').value = spazio.nazione;
    document.querySelector('select[name="categoria"]').value = spazio.categoria;
    document.querySelector('input[name="capienza_max"]').value = spazio.capienza_max;
    document.querySelector('input[name="prezzo_ora"]').value = spazio.prezzo_ora;
    document.querySelector('input[name="descrizione_breve"]').value = spazio.descrizione_breve;
    document.querySelector('textarea[name="descrizione_lunga"]').value = spazio.descrizione_lunga;

    existingImageUrls = spazio.immagini_spazio || [];
    updatePreviewCarousel();
}

/**
 * Funzione principale per modificare uno spazio.
 * @param {object} formData - I dati del form.
 * @param {Array<File>} newFiles - I nuovi file selezionati.
 * @param {string} id_spazio - L'ID dello spazio da modificare.
 */
export async function modificaSpazio(formData, newFiles, id_spazio) {
    const user = JSON.parse(localStorage.getItem('user'))?.id;
    if (!user) {
        alert('Gestore non loggato!');
        return;
    }

    let immaginiUrls = existingImageUrls;
    if (newFiles && newFiles.length > 0) {
        immaginiUrls = await uploadSpazioImages(newFiles, id_spazio);
        if (immaginiUrls.length === 0 && newFiles.length > 0) {
            alert('Si è verificato un errore durante l\'upload delle nuove immagini.');
            return;
        }
    } else if (existingImageUrls.length === 0) {
        await uploadSpazioImages([], id_spazio);
        immaginiUrls = [];
    }

    const spazioData = {
        ...formData,
        id_gestore: user,
        immagini_spazio: immaginiUrls
    };

    const { error } = await supabase
        .from('spazi_lavoro')
        .update(spazioData)
        .eq('id_spazio', id_spazio);

    if (error) {
        alert('Errore nella modifica dello spazio!');
        console.error(error);
        return;
    }

    alert('Spazio modificato con successo!');
}

/**
 * Funzione per eliminare uno spazio di lavoro.
 * @param {string} id_spazio - L'ID dello spazio da eliminare.
 */
export async function rimuoviSpazio(id_spazio) {
    if (!confirm('Sei sicuro di voler eliminare questo spazio? Questa azione non può essere annullata.')) {
        return;
    }

    const { data: spazio, error: fetchError } = await supabase
        .from('spazi_lavoro')
        .select('immagini_spazio')
        .eq('id_spazio', id_spazio)
        .single();

    if (fetchError || !spazio) {
        console.error('Errore nel recupero degli URL delle immagini:', fetchError);
        alert('Impossibile recuperare i dati dello spazio per l\'eliminazione.');
        return;
    }

    if (spazio.immagini_spazio && spazio.immagini_spazio.length > 0) {
        const pathsToDelete = spazio.immagini_spazio.map(url => {
            const pathStartIndex = url.indexOf('immaginispazio/') + 'immaginispazio/'.length;
            return url.substring(pathStartIndex);
        });
        const { error: deleteBucketError } = await supabase.storage
            .from('immaginispazio')
            .remove(pathsToDelete);

        if (deleteBucketError) {
            console.error('Errore durante l\'eliminazione delle immagini dal bucket:', deleteBucketError);
            alert('Errore durante l\'eliminazione delle immagini.');
            return;
        }
    }

    const { error: deleteRowError } = await supabase
        .from('spazi_lavoro')
        .delete()
        .eq('id_spazio', id_spazio);

    if (deleteRowError) {
        console.error('Errore durante l\'eliminazione della tupla:', deleteRowError);
        alert('Errore durante l\'eliminazione dello spazio.');
        return;
    }

    alert('Spazio eliminato con successo!');
    window.location.href = '../dashboard_gestore.html';
}