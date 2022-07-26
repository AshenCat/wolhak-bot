import { SlashCommandBuilder } from 'discord.js';
import { HelpArray, SlashCommand } from '../types';

export const HelpCommand = (helpArray: HelpArray): SlashCommand => {
    const helpMap = helpArray.reduce<Record<string, string>>(
        (map, { subcommandName, subcommandHelp }) => {
            map[subcommandName] = subcommandHelp;
            return map;
        },
        {}
    );

    return {
        command: (() => {
            const slashCommand = new SlashCommandBuilder()
                .setName('help')
                .setDescription('Gets help for a specific command');
            helpArray.forEach(({ subcommandName, subcommandDescription }) => {
                slashCommand.addSubcommand((subcommand) =>
                    subcommand
                        .setName(subcommandName)
                        .setDescription(subcommandDescription)
                );
            });
            return slashCommand;
        })(),
        async run(interaction) {
            console.log(await interaction.options.data);
            // const helpString = helpMap[interaction.options];
            await interaction.reply({ content: 'UNDER CONSTRUCTION' });
        },
    };
};
