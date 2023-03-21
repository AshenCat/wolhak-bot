import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DEV, GPT_INTERVAL, OPEN_API_KEY } from '../config';
import { SlashCommand } from '../types';
import { Configuration, OpenAIApi } from 'openai';
import User from '../db/models/user.model';
import Gpt from '../db/models/gpt.model';
import { getChatGPTResponse } from '../helper-functions';

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

const configuration = new Configuration({
    apiKey: OPEN_API_KEY,
});

const openai = new OpenAIApi(configuration);

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
                .setDescription('default: gpt-3.5-turbo-0301')
                .setRequired(false)
                .addChoices(
                    { name: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
                    { name: 'gpt-3.5-turbo-0301', value: 'gpt-3.5-turbo-0301' },
                    { name: 'text-davinci-003', value: 'text-davinci-003' },
                    { name: 'text-davinci-002', value: 'text-davinci-002' },
                    { name: 'code-davinci-002', value: 'code-davinci-002' }
                )
        )
        .setName(`${DEV ? 'dev_' : ''}wolhak_gpt`)
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

            const latestGPTRequest = await Gpt.findOne(
                { success: true },
                {},
                { sort: { created_at: -1 } }
            );

            if (latestGPTRequest) {
                const now = new Date();
                const minuteAfter = new Date(latestGPTRequest.created_at);

                if (
                    now.valueOf() - minuteAfter.valueOf() <
                    GPT_INTERVAL * 1000
                ) {
                    await interaction.editReply({
                        content: `Your next query will be <t:${
                            Date.now().valueOf() + GPT_INTERVAL
                        }:R>`,
                    });
                    return;
                }
            }

            const model = (() => {
                const model = options.get('model')?.value;
                if (typeof model !== 'string') return 'gpt-3.5-turbo-0301';
                return model;
            })();

            if (typeof prompt !== 'string') {
                await interaction.editReply({
                    content: 'Prompt is required and needs to be a string.',
                });
                return;
            }

            const completion = (
                await openai.createChatCompletion({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                })
            ).data;

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

            const gpt_response = new Gpt({
                type: model,
                prompt,
                user: dbUser.id,
                response: completion,
            });

            await gpt_response.save();
            interaction.editReply({
                embeds: [embed],
            });
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
