const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'patients.sqlite'), (err) => {
  if (err) {
    console.error('Erreur connexion DB:', err.message);
  } else {
    console.log('DB Patients connectée');
    db.run(`CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT,
      telephone TEXT,
      dateNaissance TEXT
    )`, (err) => {
      if (err) console.error(err.message);
    });
  }
});

module.exports = db;