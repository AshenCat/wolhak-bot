import { GuildMemberRoleManager, SlashCommandBuilder } from 'discord.js';
import { COMMAND_NAMES, GPT_INTERVAL } from '../config';
import { SlashCommand } from '../types';
import CommandsUsage from '../db/models/command-usage.model';
import { getCommandLimit } from '../db/dao/server.dao';
import {
    getTotalUserCommandCallsToday,
    hasUsedCommandLastGivenTime,
} from '../db/dao/command-usage.dao';
import Server from '../db/models/server.model';
import {
    commandLimitReplyString,
    intervalReplyString,
} from '../helper-functions';

const this_command = 'add';

export const AddCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addNumberOption((option) =>
            option
                .setName('number1')
                .setDescription('Number 1')
                .setRequired(true)
        )
        .addNumberOption((option) =>
            option
                .setName('number2')
                .setDescription('Number 2')
                .setRequired(true)
        )
        .setName(COMMAND_NAMES.add.command_name)
        .setDescription('Returns the sum of the two numbers'),
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

            const { options, user, guildId } = interaction;
            const userId = user.id;

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
                    discord_user_id: userId,
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

            const number1 = parseInt('' + options.get('number1')?.value);
            const number2 = parseInt('' + options.get('number2')?.value);
            const sum = number1 + number2;
            await Promise.all([
                await interaction.editReply({
                    content: `${number1} + ${number2} = ${sum}`,
                    // content: 'test',
                }),
                await CommandsUsage.create({
                    discord_user_id: userId,
                    discord_server_id: guildId,
                    command_name: COMMAND_NAMES[this_command].command_name,
                }),
            ]);
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: `/add error: ${err}`,
            });
            return;
        }
    },
};
