import axios from 'axios';
import { EmbedBuilder, SlashCommandBuilder, TextChannel } from 'discord.js';
import { DEV, TENOR_API_KEY } from '../config';
import User from '../db/models/user.model';
import { SlashCommand } from '../types';

const TENOR_API = encodeURI(
    `https://api.tenor.com/v1/random?q=anime%20hug&key=${TENOR_API_KEY}`
);

type TenorResponse = {
    data: {
        results: {
            id: string;
            media: {
                gif: {
                    url: string;
                    preview: string;
                };
            }[];
        }[];
    };
};

export const HugCommand: SlashCommand = {
    command: (() => {
        const slashCommand = new SlashCommandBuilder()
            .setName(`${DEV ? 'dev_' : ''}hug`)
            .setDescription('Hugs up to 10 users... or just yourself...');

        Array.from({ length: 10 }).forEach((_, ctr) => {
            slashCommand.addUserOption((option) =>
                option
                    .setName(`user${ctr + 1}`)
                    .setDescription('Hugs the user...')
            );
        });

        return slashCommand;
    })(),

    async run(interaction) {
        await interaction.deferReply();

        if (!interaction.inGuild()) {
            await interaction.editReply({
                content: 'You can only use this command inside a server',
            });
            return;
        }

        if (!interaction.channel) {
            await interaction.editReply({
                content:
                    'You can only use this command inside a chhannel or the client does not have the correct intents.',
            });
            return;
        }

        try {
            const { options, user } = interaction;
            const guild =
                interaction.guild ||
                (await interaction.client.guilds.fetch(interaction.guildId));

            const userId = user.id;
            let huggedUsers: string[] = [];
            const hugObjectArr: {
                name: string;
                value: string;
                inline?: boolean;
                userId?: string;
            }[] = [];

            Array.from({ length: 10 }).map((_, ctr) => {
                const huggedUser = options.get(`user${ctr + 1}`)?.value;
                if (huggedUser) {
                    huggedUsers.push('' + huggedUser);
                }
            });

            const db_user = await User.findOne({ discord_user_id: userId });
            if (!db_user) {
                await interaction.editReply({
                    content: `I'm sorry <@${userId}>, but you don't seem to be a registered user ❌...\nPlease try again!`,
                });
                return;
            }

            if (huggedUsers.length) {
                // [1] can be optimized
                db_user.hugs.forEach(async (hug) => {
                    if (huggedUsers.includes(hug.other_discord_user_id)) {
                        const member =
                            guild.members.cache.get(
                                hug.other_discord_user_id
                            ) ||
                            (await guild.members.fetch(
                                hug.other_discord_user_id
                            ));
                        hug.count += 1;
                        hugObjectArr.push({
                            name: member.displayName,
                            value: '' + hug.count,
                            userId: hug.other_discord_user_id,
                        });
                        huggedUsers = huggedUsers.filter(
                            (id) => id !== hug.other_discord_user_id
                        );
                    }
                });
                if (huggedUsers.length) {
                    huggedUsers.forEach(async (hug) => {
                        const member =
                            guild.members.cache.get(hug) ||
                            (await guild.members.fetch(hug));
                        hugObjectArr.push({
                            name: member.displayName,
                            value: '' + 1,
                            userId: hug,
                        });
                        db_user.hugs.push({
                            other_discord_user_id: hug,
                            count: 1,
                        });
                    });
                }
                await db_user.save();
                // [1] end
            } else {
                // self hug
                const existingHug = db_user.hugs.find(
                    (hubObj) => hubObj.other_discord_user_id
                );
                if (existingHug) {
                    db_user.hugs.forEach(async (hugItem) => {
                        if (hugItem.other_discord_user_id === userId) {
                            const member =
                                guild.members.cache.get(userId) ||
                                (await guild.members.fetch(userId));
                            hugItem.count += 1;
                            hugObjectArr.push({
                                name: member.displayName,
                                value: '' + hugItem.count,
                                userId: hugItem.other_discord_user_id,
                            });
                        }
                    });
                } else {
                    const member =
                        guild.members.cache.get(userId) ||
                        (await guild.members.fetch(userId));
                    hugObjectArr.push({
                        name: member.displayName,
                        value: '' + 1,
                        userId: userId,
                    });
                    db_user.hugs.push({
                        other_discord_user_id: userId,
                        count: 1,
                    });
                }
                await db_user.save();
            }

            const response: TenorResponse = await axios.get(TENOR_API);

            const {
                data: { results },
            } = response;

            const gifUrl = results[0].media[0].gif.url;
            // const previewUrl = results[0].media[0].gif.preview;

            const hugTagMap = hugObjectArr
                .map((obj) => `<@${obj.userId}>`)
                .join(', ');
            const descriptionString =
                hugObjectArr.length > 0
                    ? `*${user} hugged ${hugTagMap}!*`
                    : `*${user} self-hug*`;

            const embed = new EmbedBuilder()
                .setTitle('Awwwwwwww')
                .setDescription(descriptionString)
                .setThumbnail('' + user.avatarURL())
                .setImage(gifUrl)
                .setColor('Blurple');

            if (hugObjectArr.length)
                embed.addFields(
                    hugObjectArr.map((hug) => ({
                        name: `${hug.name} hugs:`,
                        value: hug.value,
                    }))
                );

            await interaction.editReply({
                embeds: [embed],
            });

            const channel = interaction.channel;

            if (channel?.isTextBased()) {
                (<TextChannel>channel).send({ content: `${hugTagMap}` });
            }
        } catch (err) {
            console.log(err);
            await interaction.editReply({
                content: `I'm sorry <@${interaction.user.id}>, but that didn't count as a hug ❌...\nPlease try again!`,
            });
        }
    },
};
