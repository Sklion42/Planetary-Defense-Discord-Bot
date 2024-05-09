const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getBlockchainScore, determineUserCategory } = require('../function/utilis.js');
const { getUserMoney, getEquippedItems } = require('../function/gameData.js');
const { formatRemainingTime } = require('../function/gameAdventures.js');
const db = require('../db/db.js');
const gamedb = require('../db/gamedb.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('missions')
        .setDescription('Check your profile and embark on an adventurous quest!'),
    async execute(interaction) {
        try {    
            const targetMember = interaction.member;

            db.get("SELECT waxAddress FROM users WHERE id = ?", [targetMember.id], async (err, row) => {
                if (err) {
                    console.error(err);
                    return interaction.reply({ content: ':x: An error occurred while trying to retrieve your information.', ephemeral: true });
                }

                if (!row) {
                    // Si aucune adresse WAX n'est trouvée pour cet utilisateur
                    return interaction.reply({ content: ':exclamation: Please register your WAX address first using /register.', ephemeral: true });
                }
                    const waxAddress = row.waxAddress;
                    const userCategory = await determineUserCategory(targetMember);
                    const { score } = await getBlockchainScore(waxAddress, userCategory);; // Récupère le score blockchain de l'utilisateur
                    const userMoney = await getUserMoney(targetMember.id); // Récupère l'argent de l'utilisateur
                
                    const equippedItems = await getEquippedItems(targetMember.id);
                    const equippedItemsDescription = equippedItems.map(item => `**${item.name}**\n:hourglass: Durability: ${item.durability}\n:boom: Effect: +${item.effect}%`).join('\n') || "No items equipped";
                    
                    // Calculer l'impact total des effets des items équipés
                    let totalEffectPercentage = 0;
                    equippedItems.forEach(item => {
                        // Supposons que l'effet est stocké sous forme de pourcentage direct (ex: 10 pour 10%)
                        totalEffectPercentage += parseFloat(item.effect); // Assurez-vous que 'effect' est un nombre
                    });

                    // Calculer le bonus en pourcentage total
                    const bonus = score * (totalEffectPercentage / 100);
                    
                    // Arrondir le bonus à deux chiffres après la virgule
                    const bonusRounded = Math.round(bonus * 100) / 100;
                    const totalScore = score + bonusRounded;                 

                    // Vérifier si une mission est en cours ou terminée
                    const { currentAdventure, adventureStatus, missionsLeft } = await new Promise((resolve, reject) => {
                        gamedb.get(`SELECT currentAdventure, adventureStatus, missionsLeft FROM game WHERE id = ?`, [targetMember.id], (err, row) => {
                            if (err) reject(err);
                            else resolve(row || {});
                        });
                    });

                    const now = Date.now();
                    const adventureInProgress = currentAdventure && adventureStatus > now;
                    const missionCompleted = currentAdventure && adventureStatus <= now;
                    const remainingTime = adventureInProgress ? formatRemainingTime(adventureStatus) : null; // Calculer le temps restant si la mission est en cours

                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`${interaction.user.username}'s profile`)
                        .setDescription(`:abacus: **Score:** ${totalScore} (${score} + ${bonusRounded})\n:moneybag: **Coins:** ${userMoney}`)
                        .addFields(
                            { 
                                name: ':park: Mission\'s Status', 
                                value: `Missions left: ${missionsLeft}/20\n` +
                                    (adventureInProgress ? `**${currentAdventure}** mission in progress..\nCome back in **${remainingTime}**` : 
                                    missionCompleted ? `**${currentAdventure}** mission completed.\nClick on **Missions** button and claim your reward!` : 
                                    `Click on **Missions** button and start a new one!`), 
                                inline: false 
                            },
                            { name: ':crossed_swords: Equipped Items', value: equippedItemsDescription, inline: true }
                        )
                        .setThumbnail(interaction.user.displayAvatarURL({ format: 'png', size: 1024 }))  // Add this line, replace URL_OF_THE_IMAGE with the actual URL of the image
                        .setTimestamp();
                
                    const row1 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('viewMissions')
                                .setLabel('Missions')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId('openShop')
                                .setLabel('Shop')
                                .setStyle(ButtonStyle.Primary)
                        );

                await interaction.reply({ embeds: [embed], components: [row1], ephemeral: true });
            });
        } catch (error) {
            // Gérer l'erreur spécifique pour une interaction expirée
            if (error.code === 10062) {
                console.log('Interaction has expired', error);
                if (!interaction.replied && !interaction.deferred) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000) // Rouge pour les erreurs
                        .setTitle(':hourglass: Command Expired')
                        .setDescription("Sorry, command has expired. Please dismiss this message then do /missions again");
            
                    await interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error);
                }
            } else {
                console.error('Error handling interaction:', error);
                if (!interaction.replied && !interaction.deferred) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000) // Rouge pour les erreurs
                        .setTitle(':x: Error Encountered')
                        .setDescription("An error occurred while processing your interaction.")
                        .setFooter({ text: 'Please contact support if this continues.' });
            
                    await interaction.reply({ embeds: [embed], ephemeral: true }).catch(console.error);
                }
            }
        }
    },
};
