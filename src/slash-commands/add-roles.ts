import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '../config';
import { SELF_ROLES } from '../self-roles';
import { SlashCommand } from '../types';

export const AddRolesCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName(COMMAND_NAMES.add_roles.command_name)
        .setDescription(
            'Creates a message so that people can get their own roles'
        )
        .setDefaultPermission(false),
    async run(interaction) {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({
                content: 'You cannot use this command outside a cached guild',
            });
            return;
        }

        const buildEmbed = () => {
            let description = 'Give yourself a role:\n\n';

            for (const role of SELF_ROLES) {
                description += `<:${role.emoji.name}:${role.emoji.id}> - ${role.name}\n\n`;
            }

            return new EmbedBuilder()
                .setTitle('Roles')
                .setDescription(description)
                .setColor('Blurple');
        };

        const reactToEmbed = async () => {
            for (const role of SELF_ROLES) {
                await message.react(`<:${role.emoji.name}:${role.emoji.id}>`);
            }
        };

        const embed = buildEmbed();

        const message = await interaction.reply({
            embeds: [embed],
            fetchReply: true,
        });

        await reactToEmbed();
    },
};
