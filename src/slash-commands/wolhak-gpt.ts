import {
    EmbedBuilder,
    GuildMemberRoleManager,
    SlashCommandBuilder,
} from 'discord.js';
import { COMMAND_NAMES, GPT_INTERVAL, OPEN_API_KEY } from '../config';
import { SlashCommand } from '../types';
import OpenAI from 'openai';
import User from '../db/models/user.model';
// import Gpt from '../db/models/gpt.model';
import {
    commandLimitReplyString,
    getChatGPTResponse,
    intervalReplyString,
} from '../helper-functions';
import { AxiosError } from 'axios';
import Server from '../db/models/server.model';
import { getCommandLimit } from '../db/dao/server.dao';
import {
    getTotalUserCommandCallsToday,
    hasUsedCommandLastGivenTime,
} from '../db/dao/command-usage.dao';
import CommandsUsage from '../db/models/command-usage.model';

// type ChatGPTResponseType = {
//     id: string;
//     object: string;
//     created: number;
//     model: string;
//     usage: {
//         prompt_tokens: number;
//         completion_tokens: number;
//         total_tokens: number;
//     };
//     choices: [
//         {
//             message: {
//                 role: string;
//                 content: string;
//                 finish_reason: string;
//                 index: number;
//             };
//         }
//     ];
// };

const openai = new OpenAI({
    apiKey: OPEN_API_KEY,
});

const this_command = 'wolhak_gpt';

export const WolhakGPTCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addStringOption((option) =>
            option
                .setName('prompt')
                .setRequired(true)
                .setDescription('What do you want to talk about?')
        )
        .addStringOption((option) =>
            option
                .setName('model')
                .setDescription('default: gpt-3.5-turbo-0125')
                .setRequired(false)
                .addChoices(
                    { name: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
                    { name: 'gpt-3.5-turbo-0125', value: 'gpt-3.5-turbo-0125' },
                    { name: 'text-davinci-003', value: 'text-davinci-003' },
                    { name: 'text-davinci-002', value: 'text-davinci-002' },
                    { name: 'code-davinci-002', value: 'code-davinci-002' }
                )
        )
        .setName(COMMAND_NAMES.wolhak_gpt.command_name)
        .setDescription('ChatGPT in discord UwU'),

    async run(interaction) {
        await interaction.deferReply();

        try {
            const { options, user } = interaction;
            const userId = user.id;

            const prompt = options.get('prompt')?.value;

            const dbUser = await User.findOne({ discord_user_id: userId });

            if (!dbUser) {
                await interaction.editReply({
                    content: 'Cant use GPT if you are not registered at db',
                });
                return;
            }

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

            const model = (() => {
                const model = options.get('model')?.value;
                if (typeof model !== 'string') return 'gpt-3.5-turbo-0125';
                return model;
            })();

            if (typeof prompt !== 'string') {
                await interaction.editReply({
                    content: 'Prompt is required and needs to be a string.',
                });
                return;
            }

            const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });

            if (!completion.choices.length)
                throw new Error('I have no words for that.');

            const embed = new EmbedBuilder()
                .setTitle(prompt)
                .setThumbnail('' + user.avatarURL())
                .setColor('Blurple')
                .addFields({
                    name: 'Tokens used',
                    value: '' + completion.usage?.total_tokens,
                    inline: true,
                })
                .addFields({
                    name: 'Model',
                    value: completion.model,
                    inline: true,
                })
                .setDescription('' + getChatGPTResponse(completion.choices));

            await Promise.all([
                await CommandsUsage.create({
                    command_name: COMMAND_NAMES[this_command].command_name,
                    discord_user_id: userId,
                    discord_server_id: guildId,
                    prompt: prompt,
                }),
                await interaction.editReply({
                    embeds: [embed],
                }),
            ]);
        } catch (error) {
            const err = error as AxiosError;
            console.error(err);
            // console.error(err.toJSON());
            await interaction.editReply({
                content: `I'm sorry, ChatGPT said: ${String(
                    err
                )}. Please try again later.`,
            });
        }
    },
};
