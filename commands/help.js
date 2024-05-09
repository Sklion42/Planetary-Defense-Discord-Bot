// commands/help.js
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Provides a list of commands.'),
    async execute(interaction) {
        // Créer un nouvel embed
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff') // Définir la couleur de l'embed
            .setTitle(':scroll: Commands list') // Définir le titre de l'embed
            .setDescription('Here are the commands you can use:')
            .addFields(
                { name: ':small_blue_diamond: /register', value: 'Register your WAX address.' },
                { name: ':small_blue_diamond: /assign-grade', value: 'Assign yourself a role based on your score (attack + defense stats).' },
                { name: ':small_blue_diamond: /grade-list', value: 'Informations about the grade roles and their thresholds.' },
                { name: ':small_blue_diamond: /stats', value: 'View your actual stats stored in our smart contract, or specify a user to see theirs.' },
                { name: ':small_blue_diamond: /wam', value: 'View your WAX address, or specify a user to see theirs.' },
                { name: 'Example Usage', value: ':one: Registering your WAX address: `/register address:iLoveFury.wam`\n:two: Get your role: `/assign-grade`' }
            )
            .setFooter({ text: 'If you encounter any issues or have questions, feel free to ask for help.' });

        // Vérifier si l'utilisateur a la permission d'administrateur
        if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            helpEmbed.addFields(
                { name: '\u200B', value: '\u200B' },
                { name: ':closed_lock_with_key: Admin Commands',
                    value: ':small_orange_diamond: **/clearWam**\n' +
                           'Clears the registered WAX address for the specified user. This allows them to register a new address if needed.\n' +
                           ':small_orange_diamond: **/money**\n' + 
                           'Add or remove money to mentioned user.' },
            );
        }
        // Envoyer l'embed comme réponse
        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    },
};