// commands/register.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db/db.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Registers your WAX address.')
        .addStringOption(option =>
            option.setName('address')
                .setDescription('Your WAX address')
                .setRequired(true)),
    async execute(interaction) {
        const waxAddress = interaction.options.getString('address');
        const userId = interaction.user.id;

        // Vérifier d'abord si l'utilisateur a déjà enregistré une adresse
        db.get("SELECT waxAddress FROM users WHERE id = ?", [userId], async (err, row) => {
            if (err) {
                console.error(err.message);
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000) // Rouge
                    .setTitle(':x: Error')
                    .setDescription('An error occurred while trying to verify your WAX address.');
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                return;
            }

            if (row) {
                // Si une adresse est déjà enregistrée, informer l'utilisateur
                const alreadyRegisteredEmbed = new EmbedBuilder()
                    .setColor(0xFF0000) // Rouge
                    .setTitle(':x: Already Registered')
                    .setDescription('You have already registered a WAX address. You cannot register another one.');
                await interaction.reply({ embeds: [alreadyRegisteredEmbed], ephemeral: true });
            } else {
                // Si aucune adresse n'est enregistrée, procéder à l'enregistrement
                db.run("INSERT INTO users (id, waxAddress) VALUES (?, ?)", [userId, waxAddress], async (err) => {
                    if (err) {
                        console.error(err.message);
                        const errorEmbed = new EmbedBuilder()
                            .setColor(0xFF0000) // Rouge
                            .setTitle(':x: Error')
                            .setDescription('An error occurred while trying to register your WAX address.');
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    }

                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00) // Vert
                        .setTitle(':white_check_mark: Success')
                        .setDescription(`Your WAX address **${waxAddress}** has been registered successfully.`);
                    await interaction.reply({ embeds: [successEmbed], ephemeral: false });
                });
            }
        });
    },
};
