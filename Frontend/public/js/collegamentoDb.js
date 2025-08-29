/**
 * @file Gestisce la connessione al database Supabase creando e configurando
 * il client necessario per tutte le operazioni di lettura e scrittura.
 * Questo modulo può essere importato e riutilizzato in altri script.
 * @author Simone Marino, Nicola Pichierri, Manuel Gjolaj, Mattia Statti
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

/**
 * L'URL del progetto Supabase.
 * @type {string}
 * @constant
 */
const supabaseUrl = 'https://sbxrdptjegjxqaklfpxq.supabase.co';

/**
 * La chiave API anonima pubblica per il progetto Supabase.
 * Questa chiave è sicura da esporre sul lato client.
 * @type {string}
 * @constant
 */
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieHJkcHRqZWdqeHFha2xmcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjcxMTcsImV4cCI6MjA2MjIwMzExN30.-eNAPw6hGKrSLtYmFSxxneOtEKrAyH6OUl_pKZmg-zs'; // anon/public key (readonly idealmente)

/**
 * L'istanza del client Supabase configurata con l'URL e la chiave del progetto.
 * Viene esportata per essere utilizzata in altri moduli del progetto.
 * @type {SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

// Ora puoi usare supabase in altri file importando questo modulo
// Ad esempio:  import { supabase } from './collegamentoDb.js';