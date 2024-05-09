const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBlockchainScore, determineUserCategory } = require('../function/utilis.js'); // Ajustez le chemin d'accès si nécessaire
const db = require('../db/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Retrieves the blockchain stats for yourself or a specified member.')
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to get the stats for')
                .setRequired(false)),
    async execute(interaction) {

        const targetMember = interaction.options.getMember('member') || interaction.member;

        // Assurez-vous que votre fonction db.get est adaptée pour fonctionner avec des promesses ou utilisez des callbacks
        db.get("SELECT waxAddress FROM users WHERE id = ?", [targetMember.id], async (err, row) => {
            let embedMessage = new EmbedBuilder();
            if (err) {
                embedMessage.setColor(0xFF0000) // Rouge pour les erreurs
                           .setTitle(':x: Error')
                           .setDescription("An error occurred while trying to retrieve the WAX address.");
                return interaction.reply({ embeds: [embedMessage], ephemeral: true });
            }

            if (!row) {
                embedMessage.setColor(0xFFA500) // Orange pour attention
                           .setTitle(':x: WAX Address Not Found')
                           .setDescription("This WAX address is not registered.");
                return interaction.reply({ embeds: [embedMessage], ephemeral: true });
            }

            const waxAddress = row.waxAddress;
            const userCategory = await determineUserCategory(targetMember);

            try {
                const { score, forge, realTotalAttack, realTotalDefense, totalMoveCost, slots, crewNumber, armNumber, armAttack, armDefense, landCount } = await getBlockchainScore(waxAddress, userCategory);
                let emojiForge;
                if (forge === "Active"){
                    emojiForge = "<:forgeactive:1231597895422050374>";
                } else {
                    emojiForge = "<:forgeinactive:1231597897091383438> ";
                }
                embedMessage.setColor(0x00FF00) // Vert pour succès
                           .setTitle(':abacus: Planetary Defense Stats')
                           .addFields({ name: 'User', value: `${targetMember}`, inline: true },
                                      { name: `${emojiForge} Forge`, value: `${forge}`, inline: false },
                                      { name: '<:attack:1231597889474662461>  Attack', value: `${realTotalAttack}`, inline: true },
                                      { name: '<:defense:1231597893853511680>  Defense', value: `${realTotalDefense}`, inline: true },
                                      { name: '<:Move:1231597898723098726>  Move Cost', value: `${totalMoveCost}`, inline: true },
                                      { name: '<:availableslot:1231598136540270653>  Crew slot available', value: `${slots}`, inline: true },
                                      { name: '<:crewnumber:1231597892498620560>  Crew number', value: `${crewNumber}`, inline: true },
                                      { name: '<:weaponsnumber:1231597900564398090>  Weapon number', value: `${armNumber}`, inline: true },
                                      { name: '<:attackarm:1232739777531613186>  Weapon Attack', value: `${armAttack}`, inline: true },
                                      { name: '<:defensearm:1232739778877984798>  Weapon Defense', value: `${armDefense}`, inline: true },
                                      { name: ':map: Number of land', value: `${landCount}`, inline: true },
                                      { name: ':abacus: Score', value: `${score}`, inline: true }
                                      
                            )
                            .setThumbnail(targetMember.user.displayAvatarURL({ format: 'png', size: 1024 }));

                return interaction.reply({ embeds: [embedMessage], ephemeral: true });

            } catch (error) {
                console.error(`Error while fetching blockchain stats: ${error}`);
                embedMessage.setColor(0xFF0000) // Rouge pour les erreurs
                            .setTitle(':x: Error')
                            .setDescription("An error occurred while trying to fetch the stats from the blockchain.");

                return interaction.reply({ embeds: [embedMessage], ephemeral: true });
            }
        });
    },
};
