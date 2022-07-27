import axios from 'axios';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../types';

const INSPIRE_URL = 'https://inspirobot.me/api?generate=true';

type InspireResponse = {
    data: string;
};

export const InspireCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName('inspire')
        .setDescription('Returns an inspiration'),

    async run(interaction) {
        await interaction.deferReply();

        try {
            const response = await axios.get<InspireResponse['data']>(
                INSPIRE_URL
            );

            const url = response.data;

            const user = interaction.user.id;

            const embed = new EmbedBuilder()
                .setDescription(`*Here's an inspiration for <@${user}>*`)
                .setImage(url)
                .setColor('Blurple');

            await interaction.editReply({
                embeds: [embed],
            });
        } catch (err) {
            console.log(err);
            await interaction.editReply({
                content:
                    "I'm sorry, I'm a little depressed myself...\nPlease try again!",
            });
        }
    },
};
