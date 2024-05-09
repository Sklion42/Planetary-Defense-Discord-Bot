// commands/clearWam.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const gamedb = require('../db/gamedb.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Clear user data')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Nécessite les permissions d'administrateur pour utiliser cette commande
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const userId = user.id;

        // Exécutez la mise à jour dans la base de données
        gamedb.run(`UPDATE game SET currentAdventure = NULL, adventureStatus = NULL, WHERE id = ?`, [userId], (err) => {
            if (err) {
                console.error(`Error updating database to remove mission: ${err}`);
                interaction.reply({ content: `Failed to reset data for ${user.username}. Error: ${err.message}`, ephemeral: true });
                return;
            }

            // Envoie une confirmation que l'opération a été effectuée
            interaction.reply({ content: `Successfully reset current adventure and status for ${user.username}.`, ephemeral: true });
        });
    }
};
