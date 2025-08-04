import pkg from 'pg';
const { Client } = pkg;

// Configurazione della connessione
const client = new Client({
  user: 'postgres.sbxrdptjegjxqaklfpxq',
  host: 'aws-0-eu-west-3.pooler.supabase.com',
  database: 'postgres',
  password: 'ZTWeq036f7SD',
  port: 6543,
});

// Funzione per connettersi al database
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('✅ Connesso al database PostgreSQL');
  } catch (err) {
    console.error('❌ Errore di connessione al DB:', err);
    process.exit(1);
  }
}

// Connetti al database all'avvio
connectToDatabase();

// Esporta il client per altri moduli
export default client;
