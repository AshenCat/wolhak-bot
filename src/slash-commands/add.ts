import { SlashCommandBuilder } from 'discord.js';
import { DEV } from '../config';
import { SlashCommand } from '../types';

export const AddCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .addNumberOption((option) =>
            option
                .setName('number1')
                .setDescription('Number 1')
                .setRequired(true)
        )
        .addNumberOption((option) =>
            option
                .setName('number2')
                .setDescription('Number 2')
                .setRequired(true)
        )
        .setName(`${DEV ? 'dev_' : ''}add`)
        .setDescription('Returns the sum of the two numbers'),
    async run(interaction) {
        const { options } = interaction;
        console.log(options);
        const number1 = parseInt('' + options.get('number1')?.value);
        const number2 = parseInt('' + options.get('number2')?.value);
        const sum = number1 + number2;
        await interaction.reply({
            content: `${number1} + ${number2} = ${sum}`,
            // content: 'test',
        });
    },
};
