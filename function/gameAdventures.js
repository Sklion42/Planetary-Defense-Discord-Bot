const { updateUserMoney, getEquippedItems } = require('../function/gameData.js');
const { getBlockchainScore, determineUserCategory } = require('../function/utilis.js');
const gamedb = require('../db/gamedb.js');
const db = require('../db/db.js');

const adventures = [
    { 
        name: "Rescue",
        description: "Rescue Pestilentia and Pasha from bots attack.", 
        duration: 5,
        difficulty: 2,
        reward: 10,
        imageUrl: "https://i.imgur.com/H9Zccmq.png"
    },
    {
        name: "The World Destroyer",
        description: "Magor, be vigilant! A new threat looms over your borders. A dark force is gathering its legions and waiting for the right moment to strike.",
        duration: 30,
        difficulty: 7,
        reward: 50,
        imageUrl: "https://i.imgur.com/lizN7j8.png"
    },
    {
        name: "Shrimp Attack",
        description: "Would you like some mayonnaise?",
        duration: 90,
        difficulty: 12,
        reward: 100,
        imageUrl: "https://i.imgur.com/4sReBdQ.png"
    },
    { 
        name: "Treasure",
        description: "Follow Snip's treasure map.",
        duration: 180,
        difficulty: 20,
        reward: 250,
        imageUrl: "https://i.imgur.com/m8kzdsx.png"
    }
    // Ajoutez d'autres aventures ici
];

async function getAvailableAdventures() {
    return adventures.map(adventure => ({
        name: adventure.name,
        description: adventure.description,
        duration: adventure.duration,
        difficulty: adventure.difficulty,
        reward: adventure.reward,
        imageUrl: adventure.imageUrl
    }));
}

async function startMission(userId, selectedMission) {
    // Obtenir le timestamp actuel et calculer l'heure de fin de la mission
    const startTime = Date.now();
    const endTime = startTime + selectedMission.duration * 60 * 1000;

    // Mettre à jour la base de données pour stocker le nom de la mission et l'heure de fin
    try {
        await new Promise((resolve, reject) => {
            gamedb.run(
                `INSERT INTO game (id, currentAdventure, adventureStatus)
                 VALUES (?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET currentAdventure = excluded.currentAdventure, adventureStatus = excluded.adventureStatus`, 
                [userId, selectedMission.name, endTime], function (err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du nom de la mission et de l\'heure de fin:', error);
        throw error; // Arrêtez l'exécution si la mise à jour échoue
    }
}

async function durability(userId) {
    // Récupérer les objets équipés
    const equippedItems = await getEquippedItems(userId);

    // Vérifier si equippedItems est un tableau
     if (!Array.isArray(equippedItems) || equippedItems.length === 0) {
        console.warn('Aucun objet équipé n\'a été trouvé.');
        return;
    }

    // Mettre à jour la durabilité des objets équipés
    const updatedItems = equippedItems.map(item => ({
        ...item,
        durability: Math.max(0, item.durability - 1) // Réduire la durabilité de 1, minimum 0
    }))
    .filter(item => item.durability > 0); // Exclure les objets dont la durabilité est tombée à zéro

    const updatedItemsJson = JSON.stringify(updatedItems);

    // Mettre à jour la base de données avec les objets équipés, si des objets existent
    try {
        await new Promise((resolve, reject) => {
            gamedb.run(
                `UPDATE game SET equippedItems = ? WHERE id = ?`,
                [updatedItemsJson, userId],
                function (err) {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    } catch (error) {
            console.error('Erreur lors de la mise à jour des objets équipés:', error);
    }
}

async function scoreMission(userId, selectedMission, targetMember) {
    try {
        const row = await new Promise((resolve, reject) => {
            db.get("SELECT waxAddress FROM users WHERE id = ?", [userId], (err, result) => {
                if (err) reject(`Error: ${err.message}`);
                else resolve(result);
            });
        });

        if (!row) throw new Error("No user found.");

        const waxAddress = row.waxAddress;
        const userCategory = await determineUserCategory(targetMember);
        const { score } = await getBlockchainScore(waxAddress, userCategory); // Obtenir le score blockchain de l'utilisateur
        
        const equippedItems = await getEquippedItems(userId);
        let totalEffectPercentage = equippedItems.reduce((total, item) => total + parseFloat(item.effect), 0);

        const bonus = score * (totalEffectPercentage / 100);
        const totalScore = score + Math.round(bonus * 100) / 100;

        const missionScore = score + Math.round(score * ((selectedMission.difficulty * 10) / 100));
        const successPercentage = ((totalScore / missionScore) * 100).toFixed(2);

        const roll = parseFloat((Math.random() * 100).toFixed(2)); // Entre 0 et 100

        return { success: roll < parseFloat(successPercentage), successPercentage }; // Retourne si réussi et le pourcentage
    } catch (error) {
        console.error("scoreMission error:", error);
        return { success: false, successPercentage: 0 }; // Gérer les erreurs
    }
}


async function claimMission(userId, targetMember) {
    return new Promise((resolve, reject) => {
        gamedb.get(`SELECT currentAdventure FROM game WHERE id = ?`, [userId], async (err, row) => {
            if (err) {
                console.error(`Error retrieving mission details: ${err}`);
                resolve({ success: false, message: `Error retrieving mission details: ${err}` });
                return;
            }

            const currentAdventure = row ? row.currentAdventure : null;

            if (!currentAdventure) {
                console.log('No active mission found.');
                resolve({ success: false, message: 'No active mission found.' });
                return;
            }

            const selectedMission = adventures.find(adventure => adventure.name === currentAdventure);

            if (!selectedMission) {
                console.log('Mission not found in the adventure list.');
                resolve({ success: false, message: 'Mission not found in the adventure list.' });
                return;
            }

            const { success: missionSuccess } = await scoreMission(userId, selectedMission, targetMember);

            if (missionSuccess) {
                try {
                    await updateUserMoney(userId, selectedMission.reward);
                } catch (updateError) {
                    console.error(`Error updating user money: ${updateError}`);
                    resolve({ success: false, message: `Error updating user money: ${updateError}` });
                    return;
                }
            }

            gamedb.run(`UPDATE game SET currentAdventure = NULL, adventureStatus = NULL WHERE id = ?`, [userId], (err) => {
                if (err) {
                    console.error(`Error updating database to remove mission: ${err}`);
                    resolve({ success: false, message: `Error updating database to remove mission: ${err}` });
                    return;
                }

                const message = missionSuccess
                    ? `Mission **${selectedMission.name}** completed successfully! You've earned **${selectedMission.reward} coins**.`
                    : `Mission **${selectedMission.name}** failed. Better luck next time!`;
                resolve({ success: missionSuccess, message });
            });
        });
    });
}

function formatRemainingTime(endTime) {
    const now = Date.now();
    let delta = endTime - now; // Temps restant en millisecondes

    if (delta < 0) {
        return "0s"; // Si le délai est déjà écoulé, retournez 0 secondes
    }

    const hours = Math.floor(delta / 3600000); // 1 heure = 3600000 millisecondes
    delta -= hours * 3600000;
    const minutes = Math.floor(delta / 60000); // 1 minute = 60000 millisecondes
    delta -= minutes * 60000;
    const seconds = Math.floor(delta / 1000); // 1 seconde = 1000 millisecondes

    return `${hours}h ${minutes}m ${seconds}s`; // Format "Xh Ym Zs"
}



module.exports = { scoreMission, getAvailableAdventures, startMission, durability, claimMission, formatRemainingTime };
