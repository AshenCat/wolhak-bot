import axios from 'axios';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    hyperlink,
    SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../types';

const GET_RANDOM_ANIME_URL = 'https://api.jikan.moe/v4/random/anime';

type GetRandomAnimeResponse = {
    data: {
        mal_id: 0;
        url: 'string';
        images: {
            jpg: {
                image_url: 'string';
                small_image_url: 'string';
                large_image_url: 'string';
            };
            webp: {
                image_url: 'string';
                small_image_url: 'string';
                large_image_url: 'string';
            };
        };
        trailer: {
            youtube_id: 'string';
            url: 'string';
            embed_url: 'string';
        };
        approved: true;
        titles: ['string'];
        title: 'string';
        title_english: 'string';
        title_japanese: 'string';
        title_synonyms: ['string'];
        type: 'TV';
        source: 'string';
        episodes: 0;
        status: 'Finished Airing';
        airing: true;
        aired: {
            from: 'string';
            to: 'string';
            prop: {
                from: {
                    day: 0;
                    month: 0;
                    year: 0;
                };
                to: {
                    day: 0;
                    month: 0;
                    year: 0;
                };
                string: 'string';
            };
        };
        duration: 'string';
        rating: 'G - All Ages';
        score: 0;
        scored_by: 0;
        rank: 0;
        popularity: 0;
        members: 0;
        favorites: 0;
        synopsis: 'string';
        background: 'string';
        season: 'summer';
        year: 0;
        broadcast: {
            day: 'string';
            time: 'string';
            timezone: 'string';
            string: 'string';
        };
        producers: [
            {
                mal_id: 0;
                type: 'string';
                name: 'string';
                url: 'string';
            }
        ];
        licensors: [
            {
                mal_id: 0;
                type: 'string';
                name: 'string';
                url: 'string';
            }
        ];
        studios: [
            {
                mal_id: 0;
                type: 'string';
                name: 'string';
                url: 'string';
            }
        ];
        genres: [
            {
                mal_id: 0;
                type: 'string';
                name: 'string';
                url: 'string';
            }
        ];
        explicit_genres: [
            {
                mal_id: 0;
                type: 'string';
                name: 'string';
                url: 'string';
            }
        ];
        themes: [
            {
                mal_id: 0;
                type: 'string';
                name: 'string';
                url: 'string';
            }
        ];
        demographics: [
            {
                mal_id: 0;
                type: 'string';
                name: 'string';
                url: 'string';
            }
        ];
    };
};

export const GetRandomAnimeCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName('get_random_anime')
        .setDescription('Returns a random anime'),

    async run(interaction) {
        await interaction.deferReply();

        try {
            const response = await axios.get<GetRandomAnimeResponse['data']>(
                GET_RANDOM_ANIME_URL,
                {
                    transformResponse: (response) => {
                        const json: GetRandomAnimeResponse =
                            JSON.parse(response);
                        return json.data;
                    },
                }
            );

            const {
                data: {
                    title,
                    title_japanese,
                    images: {
                        webp: { image_url },
                    },
                    rank,
                    url,
                    type,
                    synopsis,
                    status,
                    score,
                    scored_by,
                    rating,
                    duration,
                    genres,
                    themes,
                },
            } = response;

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setURL(url)
                .setThumbnail(image_url)
                .setImage(image_url)
                .setAuthor({ name: title_japanese })
                .setDescription(synopsis)
                .setColor('Blurple');

            const genresString = genres
                .map(({ name, url }) => hyperlink(name, url))
                .join('\n');
            const themesString = themes
                .map(({ name, url }) => hyperlink(name, url))
                .join('\n');

            embed.addFields(
                { name: 'Rank', value: rank?.toString(), inline: true },
                { name: 'Type', value: type?.toString(), inline: true },
                { name: 'Score', value: score?.toString(), inline: true },
                {
                    name: 'Scored by',
                    value: scored_by?.toString(),
                    inline: true,
                },
                { name: 'Status', value: status?.toString(), inline: true },
                { name: 'Rating', value: rating?.toString(), inline: true },
                { name: 'Duration', value: duration?.toString(), inline: true },
                { name: 'Genres', value: genresString?.toString() },
                { name: 'Themes', value: themesString?.toString() }
            );

            await interaction.editReply({
                embeds: [embed],
            });
        } catch (err) {
            await interaction.editReply({
                content:
                    "I'm sorry, my sources is spouting something gibberish...\nPlease try again!",
            });
        }
    },
};
