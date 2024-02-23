import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DEV, GPT_INTERVAL, OPEN_API_KEY, ZODIAC_SIGNS } from '../config';
import { SlashCommand } from '../types';
import OpenAI from 'openai';
import User from '../db/models/user.model';
import Gpt from '../db/models/gpt.model';
import { getChatGPTResponse } from '../helper-functions';
import Jimp from 'jimp';

const openai = new OpenAI({
    apiKey: OPEN_API_KEY,
});

export const WolhakImageGPTCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addStringOption((option) =>
            option
                .setName('Zodiac-Sign')
                .setRequired(false)
                .setDescription('Horoscope for which zodiac sign?')
                .addChoices(
                    ...[
                        ...Object.entries(ZODIAC_SIGNS).map(([key, val]) => ({
                            name: key,
                            value: val,
                        })),
                    ]
                )
        )
        .setName(`${DEV ? 'dev_' : ''}horoscope`)
        .setDescription(
            'Replies with an AI generated horoscope embedded in a random image created by DALL-E'
        ),

    async run(interaction) {
        await interaction.deferReply();

        try {
            const { options, user } = interaction;
            const userId = user.id;

            let zodiac = options.get('Zodiac-Sign')?.value || '';

            const dbUser = await User.findOne({ discord_user_id: userId });

            if (!dbUser) {
                await interaction.editReply({
                    content:
                        'Cant use GPT if you are not registered at db. Contact the mods for support.',
                });
                return;
            }

            /**
             * CHECK IF ZODIAC OPTION IS PRESENT. IF NOT CHECK IF USER HAS REGISTERED ZODIAC.
             * IF THERES NO ZODIAC OPTION BUT HAS REGISTERED ZODIAC, USE REGISTERED ZODIAC.
             */

            if (typeof zodiac !== 'string' || zodiac.trim() === '') {
                if (
                    !dbUser.zodiac ||
                    !Object.keys(ZODIAC_SIGNS).includes(zodiac as string)
                ) {
                    await interaction.editReply({
                        content:
                            'You do not have a registered Zodiac. Please add zodiac-sign parameter or register your zodiac sign via bot command.',
                    });
                    return;
                }
                zodiac = dbUser.zodiac;
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

            /**
             * KEY 1
             * QUERY 1 SENTENCE HOROSCOPE FROM CHAT GPT 
             */

            const prompt = `Give me a random 1 sentence horoscope for ${zodiac} zodiac sign.`;

            const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });

            const horoscope = getChatGPTResponse(completion.choices);

            /**
             * KEY 2
             * FEED DALL-E HOROSCOPE FROM KEY 1 TO GENERATE A RANDOM IMAGE
             */

            const size = '512x512';

            if (typeof zodiac !== 'string') {
                await interaction.editReply({
                    content: 'Invalid Zodiac Sign',
                });
                return;
            }

            const imageResponse = (
                await openai.images.generate({
                    prompt: horoscope,
                    size: size,
                    n: 1,
                })
            ).data;

            if (!imageResponse.length)
                throw new Error('I have no words for that.');

            const backgroundImage = imageResponse[0].url as string;

            /**
            * EDIT GENERATED IMAGE FROM KEY 2 
            */
            
            const editedImage = await Jimp.read(backgroundImage);

            const fontText = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK)

            editedImage.print(fontText, 0, 0, {
                text: `${zodiac}\n ${horoscope}`,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            }, editedImage.bitmap.width, editedImage.bitmap.height);


            const embed = new EmbedBuilder()
                .setTitle(zodiac)
                .setThumbnail('' + user.avatarURL())
                .setColor('Blurple')
                .addFields({
                    name: 'size',
                    value: size,
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
