const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { determineUserCategory, getBlockchainScore, assignRoleBasedOnScore } = require('../function/utilis.js'); // Assurez-vous que le chemin est correct
const db = require('../db/db.js');
const RoleIds = require('../config/roleConfig.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('assign-grade')
        .setDescription('Assign yourself a role based on your score in Planetary Defense.'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });
        const member = interaction.member;
        const channelID = "1202272701922955304"; // Identifiant de votre salon
        const userId = interaction.user.id;

        // Vérifier si le membre a le rôle "mercenaire" ou "landowner"
        if (!member.roles.cache.has(RoleIds.mercenaire.baseRoleId) && !member.roles.cache.has(RoleIds.landowner.baseRoleId)) {
            const embedMessage = new EmbedBuilder()
                .setColor(0xFFA500) // Orange pour attention
                .setTitle(':x: Role Missing')
                .setDescription(`You must have a Mercenary or Landowner role to use this command.\nGo to <#${channelID}> to take one`)
            return interaction.editReply({ embeds: [embedMessage] });
        }

        db.get("SELECT waxAddress FROM users WHERE id = ?", [userId], async (err, row) => {
            let embedMessage = new EmbedBuilder();

            const waxAddress = row.waxAddress;
            const userCategory = await determineUserCategory(interaction.member);
            const { userData, score } = await getBlockchainScore(waxAddress, userCategory);
            
            if (!row) {
                embedMessage.setColor(0xFFA500) // Orange pour attention
                           .setTitle(':x: WAX Address Not Found')
                           .setDescription("You have not registered a WAX address. Please register one using `/register`");
                return interaction.editReply({ embeds: [embedMessage], ephemeral: true });
            }

            // Ajoutez cette vérification pour s'assurer que l'utilisateur est dans la bonne catégorie
            const expectedRole = userCategory === 'mercenaire' ? RoleIds.mercenaire.baseRoleId : RoleIds.landowner.baseRoleId;
            if (interaction.member.roles.cache.has(expectedRole) && !userData) {
                embedMessage.setColor(0xFFA500) // Orange pour attention
                        .setTitle(':x: Role Mismatch')
                        .setDescription(`Your role in Discord does not match your data in Planetary Defense.\nGo to <#${channelID}> to correct your role.`);
                return interaction.editReply({ embeds: [embedMessage], ephemeral: true });
            }

            if ((userCategory === 'mercenaire' || userCategory === 'landowner') && !userData) {
                embedMessage.setColor(0xFF0000) // Rouge pour les erreurs
                           .setTitle(':hourglass: Please wait')
                           .setDescription("You are not added to the game yet, please wait until you see your stats in Planetary Defense web page.");
                return interaction.editReply({ embeds: [embedMessage], ephemeral: true });
            }

            if (err) {
                embedMessage.setColor(0xFF0000) // Rouge pour les erreurs
                           .setTitle(':x: Error')
                           .setDescription("An error occurred while trying to retrieve your WAX address.");
                return interaction.editReply({ embeds: [embedMessage], ephemeral: true });
            }

            try {
                embedMessage = await assignRoleBasedOnScore(interaction.member, score, userCategory, embedMessage);
                await interaction.editReply({ embeds: [embedMessage], ephemeral: false });
            } catch (error) {
                console.error(`Error while fetching blockchain score: ${error}`);
                embedMessage.setColor(0xFF0000) // Rouge pour les erreurs
                           .setTitle(':x: Error')
                           .setDescription("An error occurred while trying to fetch your score from the blockchain.");
                await interaction.editReply({ embeds: [embedMessage], ephemeral: true  });
            }
        });
    },
};
