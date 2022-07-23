import { EmbedBuilder, roleMention, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../types';

export const UserInfoCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('The user which we will know about')
                .setRequired(true)
        )
        .setName('user_info')
        .setDescription('Returns the info of the specified user'),
    async run(interaction) {
        const getFormattedDate = (date: Date) => {
            return date.toLocaleDateString(interaction.locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        };

        const user = interaction.options.getUser('user', true);
        const avatar = user.displayAvatarURL();

        const embed = new EmbedBuilder()
            .setColor('Blurple')
            .setTitle(user.tag)
            .setThumbnail(avatar)
            .addFields([
                {
                    name: 'Registered at',
                    value: getFormattedDate(user.createdAt),
                },
            ]);

        if (interaction.inGuild()) {
            const guild =
                interaction.guild ||
                (await interaction.client.guilds.fetch(interaction.guildId));
            const member =
                guild.members.cache.get(user.id) ||
                (await guild.members.fetch(user.id));

            const joinedAt = member.joinedAt;

            embed.setDescription(`<@${user.id}>`);

            if (joinedAt) {
                embed.addFields([
                    {
                        name: 'Joined at',
                        value: getFormattedDate(joinedAt),
                    },
                ]);
            }

            const roles = member.roles.cache;
            const filteredRoles = roles
                .filter((role) => role.name !== '@everyone')
                .map((role) => roleMention(role.id));

            if (filteredRoles.length) {
                embed.addFields([
                    {
                        name: `roles[${filteredRoles.length}]`,
                        value: filteredRoles.join(),
                    },
                ]);
            }
        }

        embed.setFooter({ text: `ID: ${user.id}` });
        await interaction.reply({
            embeds: [embed],
        });
    },
};
