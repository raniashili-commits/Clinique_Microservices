const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'rendezvous.sqlite'), (err) => {
  if (err) {
    console.error('Erreur connexion DB:', err.message);
  } else {
    console.log('DB Rendez-vous connectée');
    db.run(`CREATE TABLE IF NOT EXISTS rendezvous (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      date TEXT NOT NULL,
      heure TEXT NOT NULL,
      medecin TEXT NOT NULL,
      statut TEXT DEFAULT 'planifie'
    )`, (err) => {
      if (err) console.error(err.message);
    });
  }
});

module.exports = db;