const { Client } = require('pg');

// Configurazione della connessione
const client = new Client({
  user: 'postgres',                             // nome utente del database
  host: 'localhost',                            // host del database
  database: 'TecnologieInnovativeSMJP',         // nome del database
  password: '#x6J_63ZhWtI',                     // password del database
  port: 5432,                                   // porta database
});

// Connessione e query di prova
client.connect()
  .then(() => {
    console.log('Connesso al database!');
    return client.query('SELECT NOW()'); // Query di prova
  })
  .then(res => {
    console.log('Risultato:', res.rows);
  })
  .catch(err => console.error('Errore:', err.stack))
  .finally(() => client.end());
