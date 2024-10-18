import {
    EmbedBuilder,
    GuildMemberRoleManager,
    SlashCommandBuilder,
} from 'discord.js';
import {
    COMMAND_NAMES,
    GPT_INTERVAL,
    OPEN_API_KEY,
    ZODIAC_SIGNS,
} from '../config';
import { SlashCommand } from '../types';
import OpenAI from 'openai';
import User from '../db/models/user.model';
// import Gpt from '../db/models/gpt.model';
import {
    addTextToImage,
    commandLimitReplyString,
    getChatGPTResponse,
    getDateDashSeperated,
    getS3FileURL,
    intervalReplyString,
    uploadToS3,
} from '../helper-functions';
import Server from '../db/models/server.model';
import { getCommandLimit } from '../db/dao/server.dao';
import {
    getTotalUserCommandCallsToday,
    hasUsedCommandLastGivenTime,
} from '../db/dao/command-usage.dao';
import CommandsUsage from '../db/models/command-usage.model';

const openai = new OpenAI({
    apiKey: OPEN_API_KEY,
});

const this_command = 'horoscope';

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
        .setName(COMMAND_NAMES.horoscope.command_name)
        .setDescription(
            'Replies with an AI generated horoscope embedded in a random image created by DALL-E'
        ),

    async run(interaction) {
        await interaction.deferReply();

        try {
            if (!interaction.inCachedGuild()) {
                await interaction.editReply({
                    content: `You can not use /${COMMAND_NAMES[this_command].command_name} command`,
                });
                return;
            }

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

            // console.log('command_limit');
            // console.log(command_limit);
            // console.log('user_command_calls');
            // console.log(user_command_calls);

            if (command_limit > -1 && user_command_calls >= command_limit) {
                await interaction.editReply({
                    content: commandLimitReplyString({
                        user_command_calls,
                        command_limit,
                    }),
                });
                return;
            }

            if (typeof zodiac !== 'string' || zodiac.trim() === '') {
                /**
                 * CHECK IF ZODIAC OPTION IS PRESENT. IF NOT CHECK IF USER HAS REGISTERED ZODIAC.
                 * IF THERES NO ZODIAC OPTION BUT HAS REGISTERED ZODIAC, USE REGISTERED ZODIAC.
                 */

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

            const latestGPTRequest = await hasUsedCommandLastGivenTime({
                command_name: COMMAND_NAMES[this_command].command_name,
                time_in_seconds: GPT_INTERVAL,
                discord_user_id: userId,
            });

            if (latestGPTRequest) {
                await interaction.editReply({
                    content: intervalReplyString(),
                });
                console.timeEnd('total');
                return;
            }

            const model = (() => {
                const model = options.get('model')?.value;
                if (typeof model !== 'string') return 'gpt-3.5-turbo-0125';
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

            const url = getS3FileURL(finalImagePath);

            const embed = new EmbedBuilder()
                .setTitle(
                    `Here's your ${
                        ZODIAC_SIGNS[zodiac as keyof typeof ZODIAC_SIGNS].zodiac
                    } horoscope for today!`
                )
                .setThumbnail(user.avatarURL())
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
                .setImage(url);

            await Promise.all([
                await interaction.editReply({
                    embeds: [embed],
                }),
                await CommandsUsage.create({
                    command_name: COMMAND_NAMES[this_command].command_name,
                    discord_user_id: userId,
                    discord_server_id: guildId,
                    prompt: prompt,
                })
            ]);
            console.timeEnd('total');
        } catch (err) {
            console.log(err);
            await interaction.editReply({
                content: `It seems like I can't generate a horoscope for you just yet: ${String(
                    err
                )}. Please try again later.`,
            });
        }
    },
};
