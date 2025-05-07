const readline = require('readline');
const { Client } = require('pg');

// Configurazione della connessione
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'TecnologieInnovativeSMJP',
  password: '#x6J_63ZhWtI',
  port: 5432,
});

// Funzione per connettersi al database
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connesso al database!');
  } catch (err) {
    console.error('Errore di connessione al DB:', err);
    process.exit(1);
  }
}

// Funzione per inserire una registrazione
async function inserisciRegistrazione(nome, cognome, email) {
  try {
    const insertQuery = `
      INSERT INTO registrazione (nome, cognome, email)
      VALUES ($1, $2, $3)
    `;
    await client.query(insertQuery, [nome, cognome, email]);
    console.log('Registrazione inserita con successo!');
  } catch (err) {
    console.error('Errore nell\'inserimento dei dati:', err);
  }
}

// Funzione per leggere tutte le registrazioni
async function leggiRegistrazioni() {
  try {
    const res = await client.query('SELECT nome, cognome, email FROM registrazione');
    console.log('Registrazioni trovate:');
    res.rows.forEach(row => {
      console.log(`Nome: ${row.nome}, Cognome: ${row.cognome}, Email: ${row.email}`);
    });
  } catch (err) {
    console.error('Errore nella lettura dei dati:', err);
  } finally {
    await client.end();
  }
}

// Interfaccia utente da console
function chiediDatiUtente() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Nome: ', (nome) => {
    rl.question('Cognome: ', (cognome) => {
      rl.question('Email: ', async (email) => {
        rl.close();
        await connectToDatabase();
        await inserisciRegistrazione(nome, cognome, email);
        await leggiRegistrazioni();
      });
    });
  });
}

// Avvia la procedura
chiediDatiUtente();
