import { Client, CommandInteraction, InteractionType } from 'discord.js';
import { SlashCommands } from '../slash-commands';

export const onInteractionCreate = (client: Client) => {
    client.on('interactionCreate', async (interaction) => {
        if (interaction.isButton()) {
            await interaction.deferUpdate();
        }
        if (interaction.type === InteractionType.ApplicationCommand) {
            await handleSlashCommand(interaction);
        }
    });

    const handleSlashCommand = async (interaction: CommandInteraction) => {
        const SlashCommand = SlashCommands.find(
            (SlashCommand) =>
                SlashCommand.command.name === interaction.commandName
        );
        if (!SlashCommand) {
            await interaction.reply({ content: 'Command not found' });
            return;
        }

        await SlashCommand.run(interaction);
    };
};
