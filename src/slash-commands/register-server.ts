import { SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES } from '../config';
import { SlashCommand } from '../types';
import Server from '../db/models/server.model';

/**
 * 
 * 
 * 
 * 
 * UNUSED
 * 
 * 
 * 
 * 
 */

const command_name = 'register_server';

export const RegisterServerCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addUserOption((option) =>
            option
                .setName('owner_id')
                .setRequired(true)
                .setDescription('Sets the owner id of the server')
        )
        .addStringOption((option) =>
            option
                .setName('owner_email')
                .setRequired(true)
                .setDescription('Sets the contact email of the server admin.')
        )
        .addChannelOption((option) =>
            option
                .setName('general_channel_id')
                .setRequired(false)
                .setDescription(
                    'General channel of the guild. Some commands/features require this.'
                )
        )
        .setName(COMMAND_NAMES[command_name].command_name)
        .setDescription('registers the current server to the database'),

    async run(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            if (!interaction.inCachedGuild()) {
                await interaction.editReply({
                    content: 'You can not use /manage command',
                });
                return;
            }

            const { guildId, user, guild } = interaction;

            const ownerId = '' + interaction.options.get('owner_id')?.value;
            const ownerEmail = interaction.options.get('owner_email')?.value as
                | string
                | undefined;
            const generalChannelId = interaction.options.get(
                'general_channel_id'
            )?.value as string | undefined;

            // validation start

            if (!ownerId) {
                await interaction.editReply({
                    content: `Validation Failed: The supplied owner id is not a valid discord id.`,
                });
                return;
            }

            if (!/[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]{2,3}/i.test('' + ownerEmail)) {
                await interaction.editReply({
                    content: `Validation Failed: The supplied Email is not a valid email.`,
                });
                return;
            }

            const serverExists = await Server.findOne({
                discord_server_id: guildId,
            });

            if (serverExists && serverExists.owner_discord_id !== user.id) {
                await interaction.editReply({
                    content: `Error: The server seems to already have been registered. \n Please contact administrator`,
                });
                return;
            }

            // validation end

            const newServer = {
                discord_server_id: guildId,
                owner_discord_id: ownerId,
                owner_email: ownerEmail,
                ...(generalChannelId && {
                    general_channel_id: generalChannelId,
                }),
            };

            await Server.create(newServer);

            await interaction.editReply({
                content: `Server ${guild.name}(${guildId}) has been registered to the database.`,
            });
        } catch (err) {
            console.log(err);
            await interaction.editReply({
                content: `Error: ${String(
                    err
                )}.\n Please contact administrator`,
            });
        }
    },
};
