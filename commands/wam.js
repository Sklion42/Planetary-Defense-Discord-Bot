const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db/db.js'); // Ajustez le chemin d'accès vers votre db.js

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wam')
        .setDescription('Retrieves the WAX address for yourself or a specified member.')
        .addUserOption(option => 
            option.setName('member')
                  .setDescription('The member to retrieve the WAX address for')
                  .setRequired(false)),
    async execute(interaction) {
        const targetMember = interaction.options.getMember('member') || interaction.member;

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
                           .setTitle(':exclamation: WAX Address Not Found')
                           .setDescription(`No WAX address found for ${targetMember}.`);
                return interaction.reply({ embeds: [embedMessage], ephemeral: true });
            }

            // Si une adresse WAX est trouvée
            embedMessage.setColor(0x00FF00) // Vert pour succès
                         .setTitle(':honey_pot: WAX Address Found')
                         .addFields({ name: 'User', value: `${targetMember}`, inline: true },
                                    { name: 'WAX Address', value: row.waxAddress, inline: true });
            return interaction.reply({ embeds: [embedMessage], ephemeral: false });
        });
    },
};