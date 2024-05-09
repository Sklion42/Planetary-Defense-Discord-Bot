// db.js
const sqlite3 = require('sqlite3').verbose();

// Créer ou ouvrir la base de données
const db = new sqlite3.Database('./db/usersDatabase.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Erreur lors de la connexion à la base de données :", err.message);
        throw err; // Pour arrêter l'exécution si la base de données ne peut pas être ouverte
    }
    console.log('Connecté à la base de données des utilisateurs.');

    // Créer la table si elle n'existe pas déjà
    const query = `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, 
        waxAddress TEXT
    )`;

    db.run(query, (err) => {
        if (err) {
            console.error("Erreur lors de la création de la table 'users' :", err.message);
            throw err; // Pour arrêter l'exécution si la table ne peut pas être créée
        }
        console.log('Table \'users\' créée ou déjà existante.');
    });
});

module.exports = db;