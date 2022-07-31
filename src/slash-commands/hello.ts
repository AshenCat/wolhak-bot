import { SlashCommandBuilder } from 'discord.js';
import { DEV } from '../config';
import { SlashCommand } from '../types';

export const HelloCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName(`${DEV ? 'dev_' : ''}hello`)
        .setDescription('Returns a greeting'),
    async run(interaction) {
        console.log(interaction);
        await interaction.reply({
            content: `Hello <@${interaction.user.id}>`,
        });
    },
};
