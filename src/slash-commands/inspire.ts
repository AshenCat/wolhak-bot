import {
    EmbedBuilder,
    GuildMemberRoleManager,
    SlashCommandBuilder,
} from 'discord.js';
import { COMMAND_NAMES, GPT_INTERVAL } from '../config';
import { SlashCommand } from '../types';
import {
    commandLimitReplyString,
    getInspirationImageURL,
    intervalReplyString,
} from '../helper-functions';
import Server from '../db/models/server.model';
import { getCommandLimit } from '../db/dao/server.dao';
import { getTotalUserCommandCallsToday, hasUsedCommandLastGivenTime } from '../db/dao/command-usage.dao';
import CommandsUsage from '../db/models/command-usage.model';

const this_command = 'inspire';

export const InspireCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName(COMMAND_NAMES.inspire.command_name)
        .setDescription('Returns an inspiration'),

    async run(interaction) {
        await interaction.deferReply();

        try {
            if (!interaction.inCachedGuild()) {
                await interaction.editReply({
                    content: `You can not use /${COMMAND_NAMES[this_command].command_name} command`,
                });
                return;
            }

            const serverDBSettings = await Server.findOne({
                discord_server_id: interaction.guild.id,
            });

            if (!serverDBSettings) {
                await interaction.editReply({
                    content:
                        'Cant use GPT if you are not registered at db. Contact the mods for support.',
                });
                return;
            }

            const guildId = interaction.guildId;
            const userId = interaction.user.id;

            const userRoles = (
                interaction.member.roles as GuildMemberRoleManager
            ).cache;

            const [command_limit, user_command_calls] = await Promise.all([
                getCommandLimit({
                    server_id: guildId,
                    command_name: COMMAND_NAMES[this_command].command_name,
                    role_ids: [...userRoles.keys()],
                }),
                getTotalUserCommandCallsToday({
                    discord_user_id: interaction.user.id,
                    server_id: guildId,
                    command_name: COMMAND_NAMES[this_command].command_name,
                }),
            ]);

            if (command_limit > -1 && user_command_calls >= command_limit) {
                await interaction.editReply({
                    content: commandLimitReplyString({
                        user_command_calls,
                        command_limit,
                    }),
                });
                return;
            }

            const latestGPTRequest = await hasUsedCommandLastGivenTime({
                command_name: COMMAND_NAMES[this_command].command_name,
                time_in_seconds: GPT_INTERVAL,
                discord_user_id: userId,
            });

            if (latestGPTRequest) {
                await interaction.editReply({
                    content: intervalReplyString(),
                });
                return;
            }

            const url = await getInspirationImageURL();

            if (!url || url.trim() === '') throw 'Empty Response';
            const embed = new EmbedBuilder()
                .setDescription(`*Here's an inspiration for <@${userId}>*`)
                .setImage(url)
                .setColor('Blurple');
            await Promise.all([
                await interaction.editReply({
                    embeds: [embed],
                }),
                await CommandsUsage.create({
                    discord_user_id: userId,
                    discord_server_id: guildId,
                    command_name: COMMAND_NAMES[this_command].command_name,
                }),
            ]);
        } catch (err) {
            console.log(err);
            await interaction.editReply({
                content:
                    "I'm sorry, I'm a little depressed myself...\nPlease try again!",
            });
        }
    },
};
