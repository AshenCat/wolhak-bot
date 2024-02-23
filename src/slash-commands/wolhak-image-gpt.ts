import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DEV, GPT_INTERVAL, OPEN_API_KEY } from '../config';
import { SlashCommand } from '../types';
import OpenAI from 'openai';
import User from '../db/models/user.model';
import Gpt from '../db/models/gpt.model';

const openai = new OpenAI({
    apiKey: OPEN_API_KEY,
});

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
        .setName(`${DEV ? 'dev_' : ''}wolhak_image_gpt`)
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

            const gpt_response = new Gpt({
                type: 'image/generations',
                prompt,
                user: dbUser.id,
                response: imageResponse,
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
