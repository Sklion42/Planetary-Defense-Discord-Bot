// commands/clearWam.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../db/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwam')
        .setDescription('Clears the registered WAX address for the specified user. Admin only.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Nécessite les permissions d'administrateur pour utiliser cette commande
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear the WAX address for')
                .setRequired(true)),

    async execute(interaction) {
        // Vérifier les permissions d'administrateur, même si c'est déjà fait via setDefaultMemberPermissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            let embed = new EmbedBuilder()
                .setColor(0xFF0000) // Rouge pour erreur
                .setTitle(':x: Permission Denied')
                .setDescription('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const userToClear = interaction.options.getUser('user');
        const userId = userToClear.id;

        // Effacer l'adresse WAX de l'utilisateur spécifié
        db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
            let embed;
            if (err) {
                console.error(err.message);
                embed = new EmbedBuilder()
                    .setColor(0xFF0000) // Rouge pour erreur
                    .setTitle(':x: Error')
                    .setDescription('An error occurred while trying to clear the WAX address.');
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            if (this.changes > 0) {
                embed = new EmbedBuilder()
                    .setColor(0x00FF00) // Vert pour succès
                    .setTitle(':white_check_mark: WAX Address Cleared')
                    .setDescription(`The WAX address for **${userToClear.tag}** has been cleared successfully.`);
                interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                embed = new EmbedBuilder()
                    .setColor(0xFFA500) // Orange pour attention
                    .setTitle(':x: No Address Found')
                    .setDescription('No registered WAX address found for that user.');
                interaction.reply({ embeds: [embed], ephemeral: true });
            }
        });
    },
};
