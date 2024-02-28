import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DEV, GPT_INTERVAL, OPEN_API_KEY, ZODIAC_SIGNS } from '../config';
import { SlashCommand } from '../types';
import OpenAI from 'openai';
import User from '../db/models/user.model';
import Gpt from '../db/models/gpt.model';
import {
    addTextToImage,
    getChatGPTResponse,
    getDateDashSeperated,
    getS3FileURL,
    uploadToS3,
} from '../helper-functions';

const openai = new OpenAI({
    apiKey: OPEN_API_KEY,
});

export const HoroscopeCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addStringOption((option) =>
            option
                .setName('zodiac')
                .setRequired(true)
                .setDescription('Gives horoscope from the given zodiac')
                .addChoices(
                    ...[
                        ...Object.entries(ZODIAC_SIGNS).map(([key, val]) => ({
                            name: key,
                            value: val.zodiac,
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
            console.time('total');
            const { options, user } = interaction;
            const userId = user.id;

            let zodiac = options.get('zodiac')?.value || '';

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
                    console.timeEnd('total');
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
            console.time('horoscope');
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
            console.timeEnd('horoscope');
            // const horoscope =
            //     "Taurus, you're feeling extra stubborn today, but don't let that hold you back. Embrace your inner quirks and let your creativity soar! Try something new and exciting, you never know what kind of magic may happen. Your lucky color is chartreuse.";

            // console.log('-----------horoscope');
            // console.log(horoscope);

            /**
             * KEY 2
             * FEED DALL-E HOROSCOPE FROM KEY 1 TO GENERATE A RANDOM IMAGE
             */
            console.time('bgimage');
            const size = '512x512';

            if (typeof zodiac !== 'string') {
                await interaction.editReply({
                    content: 'Invalid Zodiac Sign',
                });
                console.timeEnd('total');
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
            // const backgroundImage = 'media/earth.jpg';

            console.timeEnd('bgimage');

            const gpt_response = new Gpt({
                type: 'image/generations',
                prompt,
                user: dbUser.id,
                response: imageResponse,
            });

            await gpt_response.save();

            // console.log('-----------backgroundImage');
            // console.log(backgroundImage);

            /**
             * EDIT GENERATED IMAGE FROM KEY 2
             */

            console.time('editimage');
            const editedImage = await addTextToImage({
                zodiac: zodiac as keyof typeof ZODIAC_SIGNS,
                bgImageURL: backgroundImage,
                description: horoscope,
                key: userId,
            });
            console.timeEnd('editimage');
            // console.log('-----------editedImage');
            // console.log(editedImage);
            console.time('uploadtos3');
            const finalImagePath = await uploadToS3(
                editedImage.filename,
                editedImage.fileBuffer
            );
            console.timeEnd('uploadtos3');
            // console.log('-----------finalImagePath: ');
            // console.log(finalImagePath);

            console.log(getS3FileURL(finalImagePath))

            const embed = new EmbedBuilder()
                .setTitle(
                    `Here's your ${
                        ZODIAC_SIGNS[zodiac as keyof typeof ZODIAC_SIGNS].zodiac
                    } horoscope for today!`
                )
                .setThumbnail('' + user.avatarURL())
                .setColor('Blurple')
                .setFooter({
                    text: `${getDateDashSeperated()}`,
                })
                .addFields({
                    name: 'Requested by',
                    value: `<@${userId}>`,
                })
                .addFields({
                    name: 'Zodiac',
                    value: ZODIAC_SIGNS[zodiac as keyof typeof ZODIAC_SIGNS]
                        .zodiac,
                    inline: true,
                })
                .addFields({
                    name: 'Date Range',
                    value: ZODIAC_SIGNS[zodiac as keyof typeof ZODIAC_SIGNS]
                        .range,
                    inline: true,
                })
                // .setDescription(`${horoscope}`)
                .setImage('' + getS3FileURL(finalImagePath));

            interaction.editReply({
                embeds: [embed],
            });
            console.timeEnd('total');
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
