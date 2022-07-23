import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../types';

const GOOGLE_URL = 'https://google.com';

export const GoogleCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName('google')
        .setDescription('Returns a link to Google'),

    async run(interaction) {
        const button = new ButtonBuilder()
            .setURL(GOOGLE_URL)
            .setStyle(ButtonStyle.Link)
            .setLabel('Visit Google');
        await interaction.reply({
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(button),
            ],
        });
    },
};