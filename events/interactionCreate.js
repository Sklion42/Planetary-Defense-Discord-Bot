const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const { getShopItems, getShopItemById, purchaseItem, getUserMoney, getEquippedItems, updateEquippedItems } = require('../function/gameData.js');
const { getBlockchainScore, determineUserCategory } = require('../function/utilis.js');
const { getAvailableAdventures, startMission, durability, claimMission, scoreMission, formatRemainingTime } = require('../function/gameAdventures.js');
const db = require('../db/db.js');
const gamedb = require('../db/gamedb.js');

// events/interactionCreate.js
module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isCommand()) {
                const { commandName } = interaction;
                const commands = interaction.client.commands;

                if (!commands.has(commandName)) return;

                try {
                    await commands.get(commandName).execute(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }

            else if (interaction.isButton()) {
                if (interaction.customId === 'viewMissions') {
                // Logique pour afficher les missions
                const targetMember = interaction.member;
                const adventures = await getAvailableAdventures();
                if (adventures.length === 0) {
                    await interaction.reply({ content: "No missions available at the moment.", ephemeral: true });
                    return;
                }

                const missionDescription = adventures.map(adventure =>
                    `**${adventure.name}**` +
                    `\n${adventure.description}` +
                    `\n:hourglass: Duration: ${adventure.duration} min` +
                    `\n:mechanical_arm: Difficulty: ${adventure.difficulty}` +
                    `\n:moneybag: Reward: ${adventure.reward} coins`
                ).join("\n\n");

                const options = adventures.map(adventure => ({
                    label: adventure.name,
                    description: `Duration: ${adventure.duration} min, Difficulty: ${adventure.difficulty}, Reward: ${adventure.reward} coins`,
                    value: adventure.name, // Ensure the value is unique and identifiable for mission selection
                }));

                // Vérifier si une mission est en cours ou terminée
                const { currentAdventure, adventureStatus } = await new Promise((resolve, reject) => {
                    gamedb.get(`SELECT currentAdventure, adventureStatus FROM game WHERE id = ?`, [targetMember.id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row || {});
                    });
                });

                const now = Date.now();
                const missionCompleted = currentAdventure && adventureStatus <= now;

                const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('selectMission')
                .setPlaceholder('Choose a mission to start')
                .addOptions(options);

                const row1 = new ActionRowBuilder().addComponents(selectMenu);

                const backButton = new ButtonBuilder()
                .setCustomId('profile')
                .setLabel('Return')
                .setStyle(ButtonStyle.Secondary);

                const row2 = new ActionRowBuilder().addComponents(backButton);

                    
                if (missionCompleted) {
                    const claimButton = new ButtonBuilder()
                        .setCustomId('claimMission')
                        .setLabel('Claim')
                        .setStyle(ButtonStyle.Success);
        
                    row2.addComponents(claimButton);
                }

                const imageUrl = "https://i.imgur.com/e7ohteX.png";
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(":park: Available Missions")
                    .setDescription(missionDescription)
                    .setImage(imageUrl)
                    .setTimestamp();    

                await interaction.update({ embeds: [embed], components: [row1, row2], ephemeral: true });

                }
                
                else if (interaction.customId === 'openShop') {
                // Logique pour afficher les items du shop
                const shopItems = await getShopItems();
                const itemDescriptions = shopItems.map(item =>
                    `**${item.name}:** ${item.description.substring(0, 50)}` +
                    `\n:boom: **Score Effect:** +${item.effect}%` +
                    `\n:hourglass: **Durability:** ${item.durability}` +
                    `\n:moneybag: **Cost:** ${item.cost} coins`
                ).join("\n\n");

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('selectItem')
                    .setPlaceholder('Choose an item')
                    .addOptions(shopItems.map(item => ({
                        label: item.name,
                        description: `Durability: ${item.durability}, Score Effect: +${item.effect}%, Cost: ${item.cost} coins`,
                        value: item.id.toString(),
                    })));
                        
                const backMissionButton = new ButtonBuilder()
                    .setCustomId('profile')
                    .setLabel('Return')
                    .setStyle(ButtonStyle.Secondary);
                
                const row1 = new ActionRowBuilder().addComponents(selectMenu);
                const row2 = new ActionRowBuilder().addComponents(backMissionButton);
                
                const imageUrl = "https://i.imgur.com/ctaIdHS.png";
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(":shopping_cart: Available Items")
                    .setDescription(itemDescriptions)
                    .setImage(imageUrl)
                    .setTimestamp();

                await interaction.update({ embeds: [embed], components: [row1, row2], ephemeral: true });
                }

                else if (interaction.customId === 'profile') {
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
                        const { score }  = await getBlockchainScore(waxAddress, userCategory); // Récupère le score blockchain de l'utilisateur
                    
                        const userMoney = await getUserMoney(targetMember.id); // Récupère l'argent de l'utilisateur
                    
                        const equippedItems = await getEquippedItems(targetMember.id);
                        const equippedItemsDescription = equippedItems.map(item => `**${item.name}**\n:hourglass: Durability: ${item.durability}\n:boom: Effect: +${item.effect}%`).join('\n') || "No items equipped";
                        
                        // Calculer l'impact total des effets des items équipés
                        let totalEffectPercentage = 0;
                        equippedItems.forEach(item => {            
                            totalEffectPercentage += parseFloat(item.effect);
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
                
                        await interaction.update({ embeds: [embed], components: [row1], ephemeral: true });
                    });
                }

                else if (interaction.customId.startsWith('launchMission')) {
                    const selectedMissionName = interaction.customId.split('_')[1]; // Récupère le nom de la mission à partir du customId
                    const adventures = await getAvailableAdventures();
                    const selectedMission = adventures.find(adventure => adventure.name === selectedMissionName);
                
                    if (!selectedMission) {
                        await interaction.reply({ content: "Mission not found.", ephemeral: true });
                        return;
                    }
                
                    const userId = interaction.user.id;
                    const userGameData = await new Promise((resolve, reject) => {
                        gamedb.get(`SELECT currentAdventure, missionsLeft, lastMissionDate FROM game WHERE id = ?`, [userId], (err, row) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(row || {}); // Fournit un objet vide si row est null
                            }
                        });
                    });

                    const backMissionButton = new ButtonBuilder()
                    .setCustomId('profile')
                    .setLabel('Return')
                    .setStyle(ButtonStyle.Secondary);
                    
                    if (userGameData.currentAdventure) {
                        const embed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle(':hourglass: Mission in progress')
                            .setDescription('Please complete your current mission before starting a new one.');
                
                        await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(backMissionButton)], ephemeral: true });
                        return;
                    }
                
                    const today = new Date().toISOString().split('T')[0];
                    if (userGameData.lastMissionDate !== today) {
                        userGameData.missionsLeft = 20; // Reset missions
                    }
                
                    if (userGameData.missionsLeft <= 0) {
                        const embed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle(':stop_sign: No Missions Left')
                            .setDescription('You have reached your daily limit of missions. Please come back tomorrow.');
                
                        await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(backMissionButton)], ephemeral: true });
                        return;
                    }
                
                    // Décrémenter le compteur de missions
                    userGameData.missionsLeft -= 1;
                
                    // Mise à jour de la base de données
                    gamedb.run(`UPDATE game SET missionsLeft = ?, lastMissionDate = ? WHERE id = ?`, [userGameData.missionsLeft, today, userId], (err) => {
                        if (err) {
                            console.error('Failed to update mission count:', err);
                        }
                    });
                
                    const embed = new EmbedBuilder()
                        .setColor(0x00FF00) // Vert pour succès
                        .setTitle(`:alarm_clock: Mission : ${selectedMission.name}`)
                        .setDescription(`Your mission has started. It will take **${selectedMission.duration} minutes** to complete.\nCheck back later for your reward.`);
                
                    await interaction.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(backMissionButton)], ephemeral: true });
                
                    await startMission(userId, selectedMission);
                }
                
                else if (interaction.customId === 'claimMission') {
                    try {
                        const userId = interaction.user.id;
                        const targetMember = interaction.member;
                        const result = await claimMission(userId, targetMember);
                        await durability(userId);
                
                        const embed = new EmbedBuilder()
                            .setColor(result.success ? 0x00FF00 : 0xFF0000)
                            .setTitle(result.success ? ':tada: Mission Complete' : ':x: Mission Failed')
                            .setDescription(result.message);
                
                        const backButton = new ButtonBuilder()
                            .setCustomId('profile')
                            .setLabel('Return')
                            .setStyle(ButtonStyle.Secondary);
                
                        const row = new ActionRowBuilder().addComponents(backButton);
                
                        await interaction.update({ embeds: [embed], components: [row], ephemeral: true });
                    } catch (error) {
                        console.error('Error claiming mission:', error);
                        await interaction.reply({ content: 'An error occurred while claiming the mission.', ephemeral: true });
                    }
                }    
            }

            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'selectItem') {
                    const itemId = interaction.values[0]; // Récupère l'ID de l'item sélectionné
                    const userId = interaction.user.id; // Récupère l'ID de l'utilisateur

                    // Récupérer les détails complets de l'item
                    const item = await getShopItemById(itemId);
                    if (!item) {
                        await interaction.reply({ content: 'Item not found.', ephemeral: true });
                        return;
                    }

                    // Vérifie si l'item est déjà équipé
                    const currentItems = await getEquippedItems(userId);
                    const isAlreadyEquipped = currentItems.some(i => i.id === item.id);

                    if (isAlreadyEquipped) {
                        const embed = new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle(":x: Item already equipped")
                            .setDescription("You can't equip the same item twice.");

                        const backButton = new ButtonBuilder()
                            .setCustomId('openShop')
                            .setLabel('Return')
                            .setStyle(ButtonStyle.Secondary);

                        const row = new ActionRowBuilder().addComponents(backButton);
                        await interaction.update({ embeds: [embed], components: [row], ephemeral: true });
                        return;
                    }

                    // Tente d'acheter l'item
                    const purchaseSuccess = await purchaseItem(userId, item);

                    if (!purchaseSuccess) {
                        const embed = new EmbedBuilder()
                            .setColor(0xFF0000) // Rouge
                            .setTitle(":money_with_wings: Not Enough Money")
                            .setDescription("You do not have enough money to purchase this item.");
        
                        const backButton = new ButtonBuilder()
                            .setCustomId('openShop')
                            .setLabel('Return')
                            .setStyle(ButtonStyle.Secondary);
        
                        const row = new ActionRowBuilder().addComponents(backButton);
                        await interaction.update({ embeds: [embed], components: [row], ephemeral: true });
                        
                    } else {
                        
                        // Met à jour les items équipés
                        await updateEquippedItems(userId, item);                  
                        
                        const embed = new EmbedBuilder()
                        .setColor(0x00FF00) // Vert pour le succès
                        .setTitle(":white_check_mark: Item Purchased Successfully!")
                        .setDescription(`Thanks for your purchase, **${item.name}** is now equipped! See you soon!`)
                        .setImage(item.imageUrl) // Assurez-vous que chaque item a une propriété 'imageUrl'
                        .setTimestamp();
            
                        const backButton = new ButtonBuilder()
                            .setCustomId('openShop')
                            .setLabel('Return')
                            .setStyle(ButtonStyle.Secondary);
            
                        const row = new ActionRowBuilder().addComponents(backButton);
                        await interaction.update({ embeds: [embed], components: [row], ephemeral: true });
                    }
                }

                else if (interaction.customId === 'selectMission') {
                    const adventures = await getAvailableAdventures();
                    const selectedMissionName = interaction.values[0]; // Récupère le nom de la mission sélectionnée
                    const selectedMission = adventures.find(adventure => adventure.name === selectedMissionName);
            
                    if (!selectedMission) {
                        await interaction.reply({ content: "Mission not found.", ephemeral: true });
                        return;
                    }

                    const userId = interaction.user.id;
                    const targetMember = interaction.member;
                    const { successPercentage } = await scoreMission(userId, selectedMission, targetMember);

                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(selectedMission.name)
                        .setDescription(
                            `**Description:** ${selectedMission.description}` +
                            `\n:hourglass: **Duration:** ${selectedMission.duration} min` +
                            `\n:mechanical_arm: **Difficulty:** ${selectedMission.difficulty}` +
                            `\n:moneybag: **Reward:** ${selectedMission.reward} coins` +
                            `\n\n:tada: **Success percentage:** ${successPercentage}%`
                        )
                        .setImage(selectedMission.imageUrl);
            
                    const launchButton = new ButtonBuilder()
                        .setCustomId(`launchMission_${selectedMission.name}`)
                        .setLabel('Start Mission')
                        .setStyle(ButtonStyle.Success);
            
                    const backButton = new ButtonBuilder()
                        .setCustomId('viewMissions')
                        .setLabel('Return')
                        .setStyle(ButtonStyle.Secondary);     
            
                    const row = new ActionRowBuilder().addComponents(launchButton, backButton);
            
                    await interaction.update({ embeds: [embed], components: [row], ephemeral: true });
                }
            }  
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
    }
};
