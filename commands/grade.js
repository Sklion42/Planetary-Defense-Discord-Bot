const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const RoleIds = require('../config/roleConfig.js'); // Ajustez le chemin selon votre structure

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grade-list')
        .setDescription('Informations about the grade roles and their thresholds.'),
    async execute(interaction) {
        // Obtenir les informations du rôle principal pour les mercenaires
        const mercenaryMainRole = interaction.guild.roles.cache.get(RoleIds.mercenaire.baseRoleId)?.id || "Mercenary";
        // Construire la liste des grades de mercenaires
        const mercenaireRoles = RoleIds.mercenaire.grades.map(role => `:white_small_square: <@&${role.id}> : ${role.threshold} points`).join('\n');
        
        // Obtenir les informations du rôle principal pour les landowners
        const landownerMainRole = interaction.guild.roles.cache.get(RoleIds.landowner.baseRoleId)?.id || "Landowner";
        // Construire la liste des grades de landowners
        const landownerRoles = RoleIds.landowner.grades.map(role => `:white_small_square: <@&${role.id}> : ${role.threshold} points`).join('\n');

        const embedMessage = new EmbedBuilder()
            .setColor(0x0099FF) // Bleu
            .setTitle('Role Grades Information')
            .addFields(
                { name: `\u200B`, value: `<@&${landownerMainRole}>\n` + landownerRoles },
                { name: `\u200B`, value: `<@&${mercenaryMainRole}>\n` + mercenaireRoles }                
            );

        await interaction.reply({ embeds: [embedMessage], ephemeral: true });
    },
};
