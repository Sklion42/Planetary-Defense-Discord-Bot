// commands/clearWam.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { updateUserMoney } = require('../function/gameData.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('money')
        .setDescription('Add or remove money from a user\'s account. Admin only.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Assurez-vous que seule l'administration peut utiliser cette commande.
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to modify money for')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of money to add (use negative value to remove)')
                .setRequired(true)),

    async execute(interaction) {
        const executorUser = interaction.user;
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        // Vérifier si l'utilisateur cible est le même que celui qui exécute la commande
        if (executorUser.id === targetUser.id) {
            await interaction.reply({ content: "You cannot modify your own balance.", ephemeral: true });
            return;
        }

        // Ici, vous pouvez appeler votre fonction pour mettre à jour l'argent de l'utilisateur
        try {
            const newMoneyAmount = await updateUserMoney(targetUser.id, amount); // Assurez-vous que cette fonction gère correctement l'ajout/retrait d'argent
            const embed = new EmbedBuilder()
                    .setColor(0x00FF00) // Vert pour le succès
                    .setTitle(":moneybag: Balance update")
                    .setDescription(`**${amount}** coins added to your bag\n**${targetUser}**'s balance is now updated!\nNew balance: **${newMoneyAmount}** coins`)
                    .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to update money.', ephemeral: true });
        }
    },
};
