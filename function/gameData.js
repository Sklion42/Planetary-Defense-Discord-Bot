const gamedb = require('../db/gamedb.js');

async function getUserMoney(userId) {
    return new Promise((resolve, reject) => {
        gamedb.get(`SELECT money FROM game WHERE id = ?`, [userId], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                resolve(row.money);
            } else {
                // Gérer le cas où l'utilisateur n'existe pas encore
                resolve(0); // On pourrait commencer à 0 si l'utilisateur n'est pas trouvé
            }
        });
    });
}

async function updateUserMoney(userId, amount) {
    return new Promise((resolve, reject) => {
        // Vérifier si l'utilisateur existe déjà
        gamedb.get(`SELECT money FROM game WHERE id = ?`, [userId], (err, row) => {
            if (err) return reject(err);
            let newMoneyAmount = amount;
            if (row) {
                newMoneyAmount += row.money;
                gamedb.run(`UPDATE game SET money = ? WHERE id = ?`, [newMoneyAmount, userId], function(err) {
                    if (err) return reject(err);
                    resolve(newMoneyAmount);
                });
            } else {
                gamedb.run(`INSERT INTO game (id, money) VALUES (?, ?)`, [userId, newMoneyAmount], function(err) {
                    if (err) return reject(err);
                    resolve(newMoneyAmount);
                });
            }
        });
    });
}

async function getEquippedItems(userId) {
    return new Promise((resolve, reject) => {
        gamedb.get("SELECT equippedItems FROM game WHERE id = ?", [userId], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                // Supposons que les items sont stockés sous forme JSON
                // Convertissez la chaîne en objet JSON
                const items = JSON.parse(row.equippedItems || '[]'); // Utilisez '[]' comme valeur par défaut si rien n'est trouvé
                resolve(items);
            } else {
                resolve([]);
            }
        });
    });
}

async function updateEquippedItems(userId, item) {
    // Récupérer les items actuellement équipés
    const currentItems = await getEquippedItems(userId);

    // Ajouter le nouvel item à la liste si pas déjà équipé
    const isAlreadyEquipped = currentItems.find(i => i.id === item.id);
    if (!isAlreadyEquipped) {
        const updatedItems = [...currentItems, item];
        const updatedItemsJson = JSON.stringify(updatedItems);

        // Mettre à jour la base de données avec la nouvelle liste d'items
        return new Promise((resolve, reject) => {
            gamedb.run(`UPDATE game SET equippedItems = ? WHERE id = ?`, [updatedItemsJson, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve('Item equipped successfully.');
                }
            });
        });
    } else {
        throw new Error("Item is already equipped");
    }
}

async function getShopItems() {
    return new Promise((resolve, reject) => {
        gamedb.all("SELECT * FROM shop_items", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function getShopItemById(itemId) {
    return new Promise((resolve, reject) => {
        gamedb.get("SELECT * FROM shop_items WHERE id = ?", [itemId], (err, item) => {
            if (err) {
                reject(err);
            } else if (item) {
                resolve(item);
            } else {
                reject(new Error("Item not found"));
            }
        });
    });
}

async function purchaseItem(userId, item) {
    // Récupérer les informations de l'item
    const userMoney = await getUserMoney(userId);

    if (userMoney >= item.cost) {
        // L'utilisateur a assez d'argent, procéder à l'achat
        await updateUserMoney(userId, -item.cost); // Déduire le coût de l'item
        return true;
    } else {
        // L'utilisateur n'a pas assez d'argent
        return false;
    }
}



module.exports = { getUserMoney, updateUserMoney, getEquippedItems, updateEquippedItems, getShopItems, purchaseItem, getShopItemById };