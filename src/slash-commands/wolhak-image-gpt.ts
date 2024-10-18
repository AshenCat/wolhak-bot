import {
    EmbedBuilder,
    GuildMemberRoleManager,
    SlashCommandBuilder,
} from 'discord.js';
import { COMMAND_NAMES, GPT_INTERVAL, OPEN_API_KEY } from '../config';
import { SlashCommand } from '../types';
import OpenAI from 'openai';
import User from '../db/models/user.model';
import Server from '../db/models/server.model';
import { getCommandLimit } from '../db/dao/server.dao';
import {
    getTotalUserCommandCallsToday,
    hasUsedCommandLastGivenTime,
} from '../db/dao/command-usage.dao';
import CommandsUsage from '../db/models/command-usage.model';
import {
    commandLimitReplyString,
    intervalReplyString,
} from '../helper-functions';

const openai = new OpenAI({
    apiKey: OPEN_API_KEY,
});

const this_command = 'wolhak_image_gpt';

export const WolhakImageGPTCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addStringOption((option) =>
            option
                .setName('prompt')
                .setRequired(true)
                .setDescription('Describe the image that you want.')
        )
        .addStringOption((option) =>
            option
                .setName('size')
                .setDescription('default: 256x256')
                .setRequired(false)
                .addChoices(
                    { name: '256x256', value: '256x256' },
                    { name: '512x512', value: '512x512' },
                    { name: '1024x1024', value: '1024x1024' }
                )
        )
        .setName(COMMAND_NAMES.wolhak_image_gpt.command_name)
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

            const size = (() => {
                const size = options.get('size')?.value;
                if (typeof size !== 'string' || !size) return '1024x1024';
                return size;
            })();

            if (typeof prompt !== 'string') {
                await interaction.editReply({
                    content: 'Prompt is required and needs to be a string.',
                });
                return;
            }

            const imageResponse = (
                await openai.images.generate({
                    prompt,
                    size: size as '256x256' | '512x512' | '1024x1024',
                    n: 1,
                })
            ).data;

            if (!imageResponse.length)
                throw new Error('I have no words for that.');

            const embed = new EmbedBuilder()
                .setTitle(prompt)
                .setThumbnail('' + user.avatarURL())
                .setColor('Blurple')
                .addFields({
                    name: 'size',
                    value: size,
                    inline: true,
                })
                .addFields({
                    name: 'n',
                    value: '1',
                    inline: true,
                })
                .setImage('' + imageResponse[0].url);

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
        } catch (err) {
            console.log(err);
            await interaction.editReply({
                content: `I'm sorry, ChatGPT said: ${String(
                    err
                )}. Please try again later.`,
            });
        }
    },
};
