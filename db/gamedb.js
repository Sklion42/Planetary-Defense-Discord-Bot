// gamedb.js
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');

// Créer ou ouvrir la base de données
const gamedb = new sqlite3.Database('./db/gameDatabase.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Erreur lors de la connexion à la base de données :", err.message);
        throw err; // Pour arrêter l'exécution si la base de données ne peut pas être ouverte
    }
    console.log('Connecté à la base de données game.');

    const query = `CREATE TABLE IF NOT EXISTS game (
            id TEXT PRIMARY KEY,
            money INTEGER DEFAULT 0,
            equippedItems TEXT,
            currentAdventure TEXT DEFAULT NULL, 
            adventureStatus TEXT DEFAULT NULL,
            missionsLeft INTEGER DEFAULT 20,
            lastMissionDate DATE
    )`;

    gamedb.run(query, (err) => {
        if (err) {
            console.error("Erreur lors de la création de la table 'game' :", err.message);
            throw err; // Pour arrêter l'exécution si la table ne peut pas être créée
        }
        console.log('Table \'game\' créée ou déjà existante.');
        
        const queryCreateTable = `CREATE TABLE IF NOT EXISTS shop_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            cost INTEGER NOT NULL,
            durability INTEGER,
            effect TEXT,
            imageUrl TEXT
        )`;

        gamedb.run(queryCreateTable, (err) => {
            if (err) {
                console.error("Erreur lors de la création de la table 'shop_items' :", err.message);
            } else {
                console.log("Table 'shop_items' créée ou déjà existante.");
        
                const items = [
                    {
                        name: "Sword of Truth",
                        description: "A powerful laser sword.",
                        cost: 500,
                        durability: 15,
                        effect: 25,
                        imageUrl: "https://i.imgur.com/kTvTxwM.png"
                    },
                    {
                        name: "Personal Ray Shield",
                        description: "A sturdy shield that can withstand any attack.",
                        cost: 500,
                        durability: 15,
                        effect: 25,
                        imageUrl: "https://i.imgur.com/O6Ai33M.png"
                    },
                    {
                        name: "Helm of Recklessness",
                        description: "A helmet that protects against adversity.",
                        cost: 200,
                        durability: 20,
                        effect: 10,
                        imageUrl: "https://i.imgur.com/4yl8DFV.png"
                    },
                    {
                        name: "Shoes of Safety",
                        description: "Shoes that hold up well.",
                        cost: 200,
                        durability: 20,
                        effect: 10,
                        imageUrl: "https://i.imgur.com/tGn2XPj.png"
                    },
                    {
                        name: "Protective gloves",
                        description: "A pair of gloves that resists all temperatures.",
                        cost: 200,
                        durability: 20,
                        effect: 10,
                        imageUrl: "https://i.imgur.com/DUV3ACr.png"
                    },
                    {
                        name: "Adventurer's Armor",
                        description: "Durable armor essential for your missions.",
                        cost: 1000,
                        durability: 100,
                        effect: 20,
                        imageUrl: "https://i.imgur.com/4XK4VWP.png"
                    }
                    // Ajoutez d'autres items ici avec leurs images correspondantes
                ];
                
                items.forEach(item => {
                    // Vérifie d'abord si l'élément existe déjà
                    gamedb.get("SELECT * FROM shop_items WHERE name = ?", [item.name], function(err, row) {
                        if (err) {
                            console.error("Erreur lors de la vérification de l'existence de l'item :", err.message);
                            return;
                        }
                
                        if (!row) {
                            // L'élément n'existe pas, donc insérez-le
                            const queryInsertItem = `INSERT INTO shop_items (name, description, cost, durability, effect, imageUrl) VALUES (?, ?, ?, ?, ?, ?)`;
                            gamedb.run(queryInsertItem, [item.name, item.description, item.cost, item.durability, item.effect, item.imageUrl], err => {
                                if (err) {
                                    console.error("Erreur lors de l'insertion d'un item dans 'shop_items' :", err.message);
                                } else {
                                    console.log(`Item ${item.name} inséré avec succès dans 'shop_items'.`);
                                }
                            });
                        } else {
                            const queryUpdateItem = `UPDATE shop_items SET description = ?, cost = ?, durability = ?, effect = ?, imageUrl = ? WHERE name = ?`;
                            gamedb.run(queryUpdateItem, [item.description, item.cost, item.durability, item.effect, item.imageUrl, item.name], err => {
                                if (err) {
                                    console.error("Erreur lors de la mise à jour de l'item dans 'shop_items' :", err.message);
                                } else {
                                    console.log(`Item ${item.name} mis à jour avec succès dans 'shop_items'.`);
                                }
                            });
                        }
                    });
                });
            }
        });
    });

    // Tâche cron pour réinitialiser les missions chaque jour à minuit UTC
    cron.schedule('0 0 * * *', () => {
        console.log('Réinitialisation des compteurs de missions à minuit UTC.');
        const today = new Date().toISOString().split('T')[0]; // Date actuelle en format YYYY-MM-DD
        gamedb.run(`UPDATE game SET missionsLeft = 20, lastMissionDate = ?`, [today], (err) => {
            if (err) {
                console.error('Erreur lors de la réinitialisation des compteurs de missions:', err.message);
            } else {
                console.log('Les compteurs de missions ont été réinitialisés.');
            }
        });
    }, {
        scheduled: true,
        timezone: "UTC"
    });
});

module.exports = gamedb;