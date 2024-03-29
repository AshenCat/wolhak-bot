import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { DEV } from '../config';
import { SlashCommand } from '../types';
import { getInspirationImageURL } from '../helper-functions';

export const InspireCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName(`${DEV ? 'dev_' : ''}inspire`)
        .setDescription('Returns an inspiration'),

    async run(interaction) {
        await interaction.deferReply();

        try {
            const url = await getInspirationImageURL();

            if (!url || url.trim() === '') throw 'Empty Response';
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
