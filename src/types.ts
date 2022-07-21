import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface SlashCommand {
    command: SlashCommandBuilder;
    run: (interaction: CommandInteraction) => Promise<void>;
}
