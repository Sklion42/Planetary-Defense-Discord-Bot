const axios = require('axios');
const { API_URL, CONTRACT_NAME } = require('../config.json'); // Assurez-vous que ces valeurs sont correctement définies dans votre config.json
const { EmbedBuilder } = require('discord.js');
const RoleIds = require('../config/roleConfig');

// FONCTION ASYNC //

// Détermier le rôle du membre
async function determineUserCategory(member) {

    if (member.roles.cache.has(RoleIds.mercenaire.baseRoleId)) {
        return 'mercenaire';
    } else if (member.roles.cache.has(RoleIds.landowner.baseRoleId)) {
        return 'landowner';
    } else {
        return 'none'; // Aucun rôle spécifique trouvé
    }
}

// Obtenir les stats de jeu
async function getBlockchainScore(waxAddress, userCategory) {
    console.log(`getBlockchainScore appelé avec l'adresse ${waxAddress}`);

    // Déterminer la table en fonction du rôle
    const table = userCategory === 'mercenaire' ? 'players' : 'owners';
    const apiUrl = userCategory === 'mercenaire' 
        ? 'https://www.planetarydefense.io/players' 
        : 'https://www.planetarydefense.io/data';
    console.log(`l'utilisateur est un ${userCategory} et la table ${table} sera utilisée`);

    try {
        console.log(`Envoi de la requête à l'API pour l'adresse ${waxAddress}`);

        // Requête pour vérifier la présence de l'adresse dans la table forge
        const forgeCheckResponse = await axios.post(API_URL, {
            json: true,
            code: CONTRACT_NAME,
            scope: CONTRACT_NAME,
            table: 'forge',
            lower_bound: waxAddress,
            upper_bound: waxAddress,
            limit: 1,
        });

        console.log('Réponse FORGE reçue de l\'API');

        let forge = "Inactive";
        if (forgeCheckResponse.data.rows.length > 0) {
            forge = "Active";
        }   

        // Requête pour obtenir les données de l'utilisateur
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Gérer les différences dans la structure des données
        const userData = data.find(d => 
            userCategory === 'mercenaire' ? d.player === waxAddress : d.owner === waxAddress
        );

        if (!userData) {
            console.log('Aucune donnée trouvée pour cette adresse WAX.');
            return {
                slots: 0,
                crewNumber: 0,
                armNumber: 0,
                landCount: 0
            };
        }

        const defenseData = userData.defense || {};

        const totalAttack = defenseData.totalAttack || 0;
        const totalDefense = defenseData.totalDefense || 0;
        const totalAttackArm = defenseData.totalAttackArm || 0;
        const totalDefenseArm = defenseData.totalDefenseArm || 0;
        const armAttack = totalAttackArm - totalAttack || 0;
        const armDefense = totalDefenseArm - totalDefense || 0;

        const useArmStats = forgeCheckResponse.data.rows.length > 0;
        const attackField = useArmStats ? 'totalAttackArm' : 'totalAttack';
        const defenseField = useArmStats ? 'totalDefenseArm' : 'totalDefense';  
        const realTotalAttack = defenseData[attackField] || 0;
        const realTotalDefense = defenseData[defenseField] || 0;
        const score = realTotalAttack + realTotalDefense;

        const totalMoveCost = defenseData.totalMoveCost || 0;
        const slots = userData.Nombre_slots || 0;
        const crewNumber = userData.crew_number || 0;
        const armNumber = userData.arm_number || 0;
        const landCount = userData.landCount || 0;

        return { userData, score, forge, realTotalAttack, realTotalDefense, totalMoveCost, slots, crewNumber, armNumber, armAttack, armDefense, landCount };
        
    } catch (error) {
        console.error('Erreur lors de la récupération du score depuis la blockchain WAX:', error);
        throw error;
    }
}

async function assignRoleBasedOnScore(member, score, userCategory) {
    let embedMessage = new EmbedBuilder();

    // Continuer avec la logique existante si le rôle est correct
    let assignedRoleDetails = null;

    // Parcourir les grades du rôle pour trouver le rôle correspondant au score
    for (const grade of RoleIds[userCategory].grades) {
        if (score >= grade.threshold) {
            assignedRoleDetails = grade;
            break;
        }
    }

    if (score === 0) {
        // Construire un message d'information pour encourager l'utilisateur à améliorer son score
        embedMessage.setColor(0x0099FF) // Bleu pour un message informatif
                    .setTitle(':sleeping: No Activity Detected')
                    .setDescription(`It looks like your score is 0.`)
                    .setFooter({ text: 'Add some face.worlds and crew.worlds NFTs in your wallet!' });
    }

    // Gestion des rôles Discord selon le score
    else {
        
        if (assignedRoleDetails && !member.roles.cache.has(assignedRoleDetails.id)) {
        const assignedRole = await member.guild.roles.fetch(assignedRoleDetails.id);
        await member.roles.remove(RoleIds[userCategory].grades.map(grade => grade.id)).catch(console.error);
        await member.roles.add(assignedRole.id).catch(console.error);
        
        embedMessage.setColor(0x00FF00) // Vert pour succès
                    .setTitle(':tada: Promotion')
                    .setDescription(`Congratulations, **${member.displayName}**, you have been promoted to **${assignedRole.name}** based on your score of **${score}**!`)
                    .setFooter({ text: 'Take a RedBoar to celebrate!' });
        } else {
        embedMessage.setColor(0xFFA500) // Orange pour avertissement
                    .setTitle(':exclamation: No Promotion')
                    .setDescription(`**${member.displayName}**, you did not meet the score needed to be promoted to a new role.`)
                    .setFooter({ text: 'Add some crew.worlds, face.worlds or arm.worlds NFTs in your wallet!' });
        }
    }
    return embedMessage;
}


module.exports = { determineUserCategory, getBlockchainScore, assignRoleBasedOnScore };
